import { describe, expect, it } from 'vitest';
import { SEED_DRILLS } from '../src/data/drills';
import { NODES } from '../src/data/taxonomy';
import { validateDrill } from '../src/lib/validate';
import { glickoUpdate, winProbability } from '../src/lib/rating';
import { nextStability, retrievability } from '../src/lib/memory';
import { applyOutcome, emptyTelemetry, mergeTelemetry } from '../src/lib/telemetry';
import { extractJson } from '../src/lib/openrouter';
import { calibrationQueue } from '../src/lib/scheduler';

describe('seed drill bank', () => {
  it('every drill passes structural validation', () => {
    const problems = SEED_DRILLS.flatMap((d) => validateDrill(d).map((e) => `${d.id}: ${e}`));
    expect(problems).toEqual([]);
  });
  it('ids are unique', () => {
    const ids = SEED_DRILLS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('covers all four wings and every drill type', () => {
    const wings = new Set(SEED_DRILLS.flatMap((d) => d.taxonomy_nodes.map((n) => NODES.find((x) => x.id === n)!.wing)));
    expect(wings.size).toBe(4);
    const types = new Set(SEED_DRILLS.map((d) => d.drill_type));
    expect(types).toEqual(new Set(['surgical_dissection', 'diagnostic_tree', 'syntactic_assembly']));
  });
  it('taxonomy node ids are unique', () => {
    expect(new Set(NODES.map((n) => n.id)).size).toBe(NODES.length);
  });
});

describe('Glicko-2', () => {
  it('reproduces Glickman’s worked example direction and magnitude', () => {
    // Paper example uses 3 games; for one game vs 1400/RD30 a win must raise rating and shrink RD.
    const r = glickoUpdate({ elo: 1500, rd: 200, vol: 0.06 }, 1400, 1, { opponentRd: 30 });
    expect(r.elo).toBeGreaterThan(1500);
    expect(r.elo).toBeLessThan(1600);
    expect(r.rd).toBeLessThan(200);
  });
  it('a loss lowers rating; weight damps the change', () => {
    const full = glickoUpdate({ elo: 1200, rd: 350, vol: 0.06 }, 1200, 0);
    const half = glickoUpdate({ elo: 1200, rd: 350, vol: 0.06 }, 1200, 0, { weight: 0.5 });
    expect(full.elo).toBeLessThan(1200);
    expect(1200 - half.elo).toBeCloseTo((1200 - full.elo) / 2, 5);
  });
  it('win probability is 0.5 against an equal opponent', () => {
    expect(winProbability(1300, 1300)).toBeCloseTo(0.5, 6);
  });
});

describe('FSRS-lite', () => {
  it('R(S,S) = 0.9', () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 6);
  });
  it('success grows stability, failure shrinks it', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    expect(nextStability(5, tenDaysAgo, 1)).toBeGreaterThan(5);
    expect(nextStability(5, tenDaysAgo, 0)).toBeLessThan(5);
  });
});

describe('telemetry', () => {
  it('applies an outcome to every valid node', () => {
    const { telemetry, deltas } = applyOutcome(emptyTelemetry(), {
      kind: 'drill', item_id: 'x', nodes: ['toulmin_warrant', 'enthymeme', 'not_a_node'], difficulty: 1200, score: 1,
    });
    expect(deltas.map((d) => d.node)).toEqual(['toulmin_warrant', 'enthymeme']);
    expect(telemetry.node_mastery.toulmin_warrant.elo).toBeGreaterThan(1200);
    // Secondary node receives a smaller share of the evidence.
    expect(telemetry.node_mastery.enthymeme.elo).toBeLessThan(telemetry.node_mastery.toulmin_warrant.elo);
    expect(telemetry.attempt_log).toHaveLength(1);
  });
  it('merge keeps the most recently practised node and unions history', () => {
    const a = applyOutcome(emptyTelemetry(), { kind: 'drill', item_id: 'a', nodes: ['toulmin_warrant'], difficulty: 1200, score: 1 }, new Date('2026-01-01')).telemetry;
    const b = applyOutcome(emptyTelemetry(), { kind: 'drill', item_id: 'b', nodes: ['toulmin_warrant'], difficulty: 1200, score: 0 }, new Date('2026-02-01')).telemetry;
    const m = mergeTelemetry(a, b, 'u1');
    expect(m.node_mastery.toulmin_warrant.elo).toBe(b.node_mastery.toulmin_warrant.elo);
    expect(m.attempt_log.map((x) => x.item_id)).toEqual(['a', 'b']);
    expect(m.user_id).toBe('u1');
    expect(mergeTelemetry(b, a).node_mastery.toulmin_warrant.elo).toBe(b.node_mastery.toulmin_warrant.elo);
  });
});

describe('scheduler', () => {
  it('builds a calibration queue of distinct drills', () => {
    const q = calibrationQueue(SEED_DRILLS, emptyTelemetry(), 8);
    expect(q).toHaveLength(8);
    expect(new Set(q.map((d) => d.id)).size).toBe(8);
  });
});

describe('extractJson', () => {
  it('pulls JSON out of fenced or chatty replies', () => {
    expect(extractJson('Sure!\n```json\n{"a": {"b": "}"}}\n```')).toEqual({ a: { b: '}' } });
    expect(extractJson('Result: {"x": 1} done')).toEqual({ x: 1 });
  });
});

describe('forge content', async () => {
  const { STEELMAN, WARRANTS } = await import('../src/data/forge');
  const { wordCount, sentenceCount } = await import('../src/lib/judges');
  it('steelman exemplars respect the 75-word limit they teach', () => {
    for (const s of STEELMAN) expect(wordCount(s.exemplar), s.id).toBeLessThanOrEqual(75);
  });
  it('warrant exemplar rebuttals are two sentences', () => {
    for (const w of WARRANTS) expect(sentenceCount(w.exemplar_rebuttal), w.id).toBe(2);
  });
  it('forge and salle content only references real taxonomy nodes', async () => {
    const { TACTICS, AXIS_NODES } = await import('../src/data/salle');
    const { CARDS } = await import('../src/data/forge');
    const ids = [...STEELMAN.flatMap((s) => s.distortions), ...WARRANTS.flatMap((w) => w.nodes), ...TACTICS.map((t) => t.node), ...Object.values(AXIS_NODES).flat(), ...CARDS.flatMap((c) => c.nodes)];
    expect(ids.filter((id) => !NODES.some((n) => n.id === id))).toEqual([]);
  });
});
