// FSRS-lite: a per-skill "rust" heuristic in the spirit of FSRS, not real FSRS.
// FSRS models recall of one flashcard; a skill node is practised through many
// different drills, so we borrow FSRS's power-law forgetting curve and a
// simplified stability update rather than its fitted parameters.

const F = 19 / 81;
const C = -0.5;
const DAY_MS = 86_400_000;

/** Retrievability after `days` at stability `S` (FSRS-4.5 curve: R(S,S) = 0.9). */
export function retrievability(stabilityDays: number, days: number): number {
  if (stabilityDays <= 0) return 0;
  return Math.pow(1 + (F * Math.max(0, days)) / stabilityDays, C);
}

export function daysSince(iso: string | null, now = Date.now()): number {
  if (!iso) return Infinity;
  return Math.max(0, (now - Date.parse(iso)) / DAY_MS);
}

export function currentRetrievability(stabilityDays: number, lastPracticed: string | null, now = Date.now()): number {
  if (!lastPracticed) return 0;
  return retrievability(stabilityDays, daysSince(lastPracticed, now));
}

/** Stability after a practice with outcome `score` in [0,1]. */
export function nextStability(stabilityDays: number, lastPracticed: string | null, score: number, now = Date.now()): number {
  if (!lastPracticed || stabilityDays <= 0) return 1 + 3 * score;
  const R = currentRetrievability(stabilityDays, lastPracticed, now);
  if (score >= 0.6) {
    // Success grows stability more when memory had faded (spacing effect) and less as S gets large.
    const growth = 2 * score * Math.pow(stabilityDays, -0.2) * (Math.exp(1 - R) - 1 + 0.15);
    return Math.min(365, stabilityDays * (1 + growth));
  }
  // Lapse: stability drops but keeps some of what was built.
  return Math.max(0.4, Math.min(stabilityDays, 0.6 * Math.pow(stabilityDays, 0.7)));
}
