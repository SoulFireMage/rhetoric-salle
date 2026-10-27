// Picks what to practise next: lowest-rated and most-rusted skills first.

import { NODES } from '../data/taxonomy';
import { currentRetrievability } from './memory';
import { winProbability } from './rating';
import { mastery } from './telemetry';
import type { DrillItem, UserTelemetry } from './types';

export interface NodePriority {
  node: string;
  priority: number;
  retrievability: number;
  elo: number;
}

export function nodePriorities(t: UserTelemetry, now = Date.now()): NodePriority[] {
  return NODES.map((node) => {
    const m = mastery(t, node.id);
    const R = currentRetrievability(m.stability_days, m.last_practiced, now);
    const weakness = Math.min(1, Math.max(0, (1500 - m.elo) / 600));
    const unpractised = m.attempts === 0 ? 0.35 : 0;
    return { node: node.id, priority: (1 - R) * 0.6 + weakness * 0.4 + unpractised, retrievability: R, elo: m.elo };
  }).sort((a, b) => b.priority - a.priority);
}

function recentlySeen(t: UserTelemetry, withinItems = 40): Set<string> {
  return new Set(t.attempt_log.slice(-withinItems).map((a) => a.item_id));
}

/** Score how well a drill suits the user now: covers needy nodes, pitched near a 60–75% win chance, not seen lately. */
export function drillFit(d: DrillItem, t: UserTelemetry, prio: Map<string, number>, seen: Set<string>): number {
  const need = Math.max(...d.taxonomy_nodes.map((id) => prio.get(id) ?? 0));
  const rating = mastery(t, d.taxonomy_nodes[0]).elo;
  const p = winProbability(rating, d.difficulty_elo);
  const pitch = 1 - Math.min(1, Math.abs(p - 0.68) * 2.5);
  return need * 1.2 + pitch * 0.6 - (seen.has(d.id) ? 1.5 : 0) + Math.random() * 0.15;
}

/** The ~10-minute "Daily Calibration Run": a mixed queue across the neediest nodes. */
export function calibrationQueue(drills: DrillItem[], t: UserTelemetry, size = 8): DrillItem[] {
  const prioList = nodePriorities(t);
  const prio = new Map(prioList.map((p) => [p.node, p.priority]));
  const seen = recentlySeen(t);
  const ranked = [...drills].sort((a, b) => drillFit(b, t, prio, seen) - drillFit(a, t, prio, seen));
  const out: DrillItem[] = [];
  const coveredPrimary = new Set<string>();
  for (const d of ranked) {
    if (out.length >= size) break;
    if (coveredPrimary.has(d.taxonomy_nodes[0])) continue;
    coveredPrimary.add(d.taxonomy_nodes[0]);
    out.push(d);
  }
  for (const d of ranked) {
    if (out.length >= size) break;
    if (!out.includes(d)) out.push(d);
  }
  // Interleave types so the session is mixed rather than blocked.
  return out.sort(() => Math.random() - 0.5);
}

export function pickNext(drills: DrillItem[], t: UserTelemetry, exclude: Set<string> = new Set()): DrillItem | undefined {
  const prio = new Map(nodePriorities(t).map((p) => [p.node, p.priority]));
  const seen = recentlySeen(t);
  return drills
    .filter((d) => !exclude.has(d.id))
    .sort((a, b) => drillFit(b, t, prio, seen) - drillFit(a, t, prio, seen))[0];
}

export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
