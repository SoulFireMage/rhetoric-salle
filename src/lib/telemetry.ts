// Pure telemetry operations: applying outcomes, merging local and cloud copies.

import { NODES } from '../data/taxonomy';
import { DEFAULT_RATING, DRILL_RD, glickoUpdate, idleRd, newMastery } from './rating';
import { daysSince, nextStability } from './memory';
import type { AttemptRecord, NodeMastery, UserTelemetry } from './types';

export const ATTEMPT_LOG_LIMIT = 600;

export function emptyTelemetry(userId = 'local_anon'): UserTelemetry {
  return {
    user_id: userId,
    preferred_register: 'dual',
    global_elo: DEFAULT_RATING,
    node_mastery: {},
    salle_history: [],
    attempt_log: [],
    saved_items: [],
    updated_at: new Date(0).toISOString(),
  };
}

export const mastery = (t: UserTelemetry, nodeId: string): NodeMastery => t.node_mastery[nodeId] ?? newMastery();

export function globalElo(t: UserTelemetry): number {
  const practised = Object.values(t.node_mastery).filter((m) => m.attempts > 0);
  if (!practised.length) return DEFAULT_RATING;
  return Math.round(practised.reduce((s, m) => s + m.elo, 0) / practised.length);
}

export interface Outcome {
  kind: AttemptRecord['kind'];
  item_id: string;
  nodes: string[];
  difficulty: number;
  score: number;
  /** Evidence weight: 1 for deterministic, lower for LLM-judged or self-assessed results. */
  weight?: number;
  opponentRd?: number;
  ttd_ms?: number;
  /** Per-node score overrides (e.g. a bout scores each axis separately). */
  nodeScores?: Record<string, number>;
}

export interface NodeDelta {
  node: string;
  before: number;
  after: number;
}

/** Secondary taxonomy nodes on a multi-node item get a share of the evidence. */
const SECONDARY_WEIGHT = 0.6;

export function applyOutcome(t: UserTelemetry, o: Outcome, now = new Date()): { telemetry: UserTelemetry; deltas: NodeDelta[] } {
  const iso = now.toISOString();
  const node_mastery = { ...t.node_mastery };
  const deltas: NodeDelta[] = [];
  const valid = o.nodes.filter((id) => NODES.some((x) => x.id === id));
  valid.forEach((id, i) => {
    const prev = node_mastery[id] ?? newMastery();
    const score = o.nodeScores?.[id] ?? o.score;
    const weight = (o.weight ?? 1) * (i === 0 ? 1 : SECONDARY_WEIGHT);
    const days = daysSince(prev.last_practiced, now.getTime());
    const rd = Number.isFinite(days) ? idleRd(prev.rd, days) : prev.rd;
    const upd = glickoUpdate({ elo: prev.elo, rd, vol: prev.vol }, o.difficulty, score, {
      weight,
      opponentRd: o.opponentRd ?? DRILL_RD,
    });
    node_mastery[id] = {
      ...upd,
      attempts: prev.attempts + 1,
      last_practiced: iso,
      stability_days: nextStability(prev.stability_days, prev.last_practiced, score, now.getTime()),
    };
    deltas.push({ node: id, before: prev.elo, after: upd.elo });
  });
  const attempt: AttemptRecord = {
    id: `${o.kind}_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    date: iso,
    kind: o.kind,
    item_id: o.item_id,
    nodes: valid,
    score: Math.round(o.score * 1000) / 1000,
    ...(o.ttd_ms != null ? { ttd_ms: Math.round(o.ttd_ms) } : {}),
  };
  const next: UserTelemetry = {
    ...t,
    node_mastery,
    attempt_log: [...t.attempt_log, attempt].slice(-ATTEMPT_LOG_LIMIT),
    updated_at: iso,
  };
  next.global_elo = globalElo(next);
  return { telemetry: next, deltas };
}

function unionById<T>(a: T[], b: T[], key: (x: T) => string, sortKey: (x: T) => string, limit?: number): T[] {
  const map = new Map<string, T>();
  for (const x of [...a, ...b]) map.set(key(x), x);
  const out = [...map.values()].sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  return limit ? out.slice(-limit) : out;
}

/**
 * Merge two telemetry copies (e.g. a phone used logged-out and a laptop logged-in).
 * Per node, the copy practised most recently wins (ties: more attempts).
 * Histories are unioned by id and never deleted.
 */
export function mergeTelemetry(local: UserTelemetry, remote: UserTelemetry, userId?: string): UserTelemetry {
  const node_mastery: Record<string, NodeMastery> = { ...remote.node_mastery };
  for (const [id, m] of Object.entries(local.node_mastery)) {
    const r = node_mastery[id];
    if (!r) node_mastery[id] = m;
    else {
      const lt = m.last_practiced ? Date.parse(m.last_practiced) : 0;
      const rt = r.last_practiced ? Date.parse(r.last_practiced) : 0;
      if (lt > rt || (lt === rt && m.attempts > r.attempts)) node_mastery[id] = m;
    }
  }
  const newer = Date.parse(local.updated_at) >= Date.parse(remote.updated_at) ? local : remote;
  const merged: UserTelemetry = {
    user_id: userId ?? remote.user_id ?? local.user_id,
    preferred_register: newer.preferred_register,
    global_elo: DEFAULT_RATING,
    node_mastery,
    salle_history: unionById(local.salle_history, remote.salle_history, (x) => x.bout_id, (x) => x.date),
    attempt_log: unionById(local.attempt_log, remote.attempt_log, (x) => x.id, (x) => x.date, ATTEMPT_LOG_LIMIT),
    saved_items: unionById(local.saved_items, remote.saved_items, (x) => x.id, (x) => x.date),
    updated_at: [local.updated_at, remote.updated_at].sort().at(-1)!,
  };
  merged.global_elo = globalElo(merged);
  return merged;
}

/** Defensive normaliser for imported or cloud-fetched JSON. */
export function normaliseTelemetry(raw: unknown, fallbackUser = 'local_anon'): UserTelemetry {
  const base = emptyTelemetry(fallbackUser);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<UserTelemetry>;
  const node_mastery: Record<string, NodeMastery> = {};
  for (const [id, m] of Object.entries(r.node_mastery ?? {})) {
    if (!m || typeof m !== 'object') continue;
    node_mastery[id] = { ...newMastery(), ...(m as Partial<NodeMastery>) };
  }
  const out: UserTelemetry = {
    ...base,
    user_id: typeof r.user_id === 'string' ? r.user_id : base.user_id,
    preferred_register: r.preferred_register === 'classical' || r.preferred_register === 'modern' ? r.preferred_register : 'dual',
    node_mastery,
    salle_history: Array.isArray(r.salle_history) ? r.salle_history : [],
    attempt_log: Array.isArray(r.attempt_log) ? r.attempt_log : [],
    saved_items: Array.isArray(r.saved_items) ? r.saved_items : [],
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : base.updated_at,
  };
  out.global_elo = globalElo(out);
  return out;
}
