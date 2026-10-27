// Glicko-2 for one "game" against a drill (or a bout persona) treated as a rated
// opponent, the same model Lichess uses for puzzles. Ratings are shown on the
// familiar ELO scale (default 1200). See Glickman, "Example of the Glicko-2 system".

import type { NodeMastery } from './types';

const SCALE = 173.7178;
const TAU = 0.5;
const EPS = 1e-6;
export const DEFAULT_RATING = 1200;
/** Starting uncertainty. Glicko’s textbook 350 swings a fresh skill ~300 points on one drill; 250 is calmer. */
export const DEFAULT_RD = 250;
export const DEFAULT_VOL = 0.06;
/** Drills have fixed, hand-set difficulty; treat them as fairly well-known opponents. */
export const DRILL_RD = 80;
/** RD regrows towards the default while a skill is idle (per day). */
const RD_IDLE_GROWTH_PER_DAY = 6;

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const expected = (mu: number, muJ: number, phiJ: number) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

export function newMastery(): NodeMastery {
  return { elo: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL, attempts: 0, last_practiced: null, stability_days: 0 };
}

/** Rating deviation after `days` of inactivity. */
export function idleRd(rd: number, days: number): number {
  return Math.min(DEFAULT_RD, Math.sqrt(rd * rd + RD_IDLE_GROWTH_PER_DAY * RD_IDLE_GROWTH_PER_DAY * Math.max(0, days)));
}

/** Probability that a player at `rating` "beats" an item at `difficulty`. */
export function winProbability(rating: number, difficulty: number, rdOpp = DRILL_RD): number {
  return expected((rating - 1500) / SCALE, (difficulty - 1500) / SCALE, rdOpp / SCALE);
}

/**
 * One Glicko-2 update.
 * @param score outcome in [0,1] — 1 = clean win, fractional for partial credit.
 * @param weight in (0,1] — damps noisy evidence (e.g. LLM-judged results).
 */
export function glickoUpdate(
  player: { elo: number; rd: number; vol: number },
  opponentRating: number,
  score: number,
  opts: { opponentRd?: number; weight?: number } = {},
): { elo: number; rd: number; vol: number } {
  const s = Math.min(1, Math.max(0, score));
  const w = Math.min(1, Math.max(0, opts.weight ?? 1));
  const mu = (player.elo - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const muJ = (opponentRating - 1500) / SCALE;
  const phiJ = (opts.opponentRd ?? DRILL_RD) / SCALE;

  const gJ = g(phiJ);
  const E = expected(mu, muJ, phiJ);
  const v = 1 / (gJ * gJ * E * (1 - E));
  const delta = v * gJ * (s - E);

  // Volatility via the Illinois algorithm (step 5 of Glickman's paper).
  const a = Math.log(player.vol * player.vol);
  const f = (x: number) => {
    const ex = Math.exp(x);
    const d = phi * phi + v + ex;
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * d * d) - (x - a) / (TAU * TAU);
  };
  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0 && k < 100) k++;
    B = a - k * TAU;
  }
  let fA = f(A);
  let fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > EPS; i++) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }
  const volNew = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi * phi + volNew * volNew);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * gJ * (s - E);

  const elo = player.elo + w * (muNew * SCALE + 1500 - player.elo);
  const rd = player.rd + w * (phiNew * SCALE - player.rd);
  const vol = player.vol + w * (volNew - player.vol);
  return { elo, rd: Math.max(30, rd), vol };
}
