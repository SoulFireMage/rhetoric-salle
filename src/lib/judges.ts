// LLM judge rubrics. Each judge fills a checklist of discrete criteria; the
// score is computed here from the checklist, not taken as a free 0–100 number,
// to keep noisy grading from swinging ratings.

import { NODE_MAP } from '../data/taxonomy';
import type { FigureCard, SteelmanItem, WarrantItem } from '../data/forge';
import { chat, chatJson, type ChatMessage } from './openrouter';

export type Verdict = 'pass' | 'partial' | 'fail';
const VERDICT = { type: 'string', enum: ['pass', 'partial', 'fail'] };
const v2n = (v: Verdict) => (v === 'pass' ? 1 : v === 'partial' ? 0.5 : 0);

export const wordCount = (s: string) => (s.trim().match(/\S+/g) ?? []).length;
export const sentenceCount = (s: string) => (s.trim().match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []).filter((x) => x.trim()).length;

const JUDGE_SYSTEM = `You are a strict, fair judge of classical rhetoric and argumentation. You grade against the rubric only. You are not impressed by length or eloquence that ignores the task. Notes are one or two sentences, concrete, and quote the user's words where useful. Use British spelling.`;

const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

// ── Mr. Potato Head workbench ─────────────────────────────

export interface PotatoSentenceGrade {
  card_id: string;
  figure: Verdict;
  figure_note: string;
  claim_preserved: Verdict;
  claim_note: string;
  concision: Verdict;
  concision_note: string;
  hedges_found: string[];
  better_version: string;
}
export interface PotatoGrade {
  sentences: PotatoSentenceGrade[];
  overall_comment: string;
}

const potatoSchema = obj({
  sentences: {
    type: 'array',
    items: obj({
      card_id: { type: 'string' },
      figure: VERDICT,
      figure_note: { type: 'string' },
      claim_preserved: VERDICT,
      claim_note: { type: 'string' },
      concision: VERDICT,
      concision_note: { type: 'string' },
      hedges_found: { type: 'array', items: { type: 'string' } },
      better_version: { type: 'string' },
    }),
  },
  overall_comment: { type: 'string' },
});

export function potatoScore(g: PotatoSentenceGrade): number {
  const base = 0.5 * v2n(g.figure) + 0.3 * v2n(g.claim_preserved) + 0.2 * v2n(g.concision);
  return Math.max(0, base - 0.05 * g.hedges_found.length);
}

export function judgePotato(o: {
  apiKey: string; model: string; proposition: string; cards: FigureCard[]; answers: string[];
}): Promise<PotatoGrade> {
  const items = o.cards.map((c, i) =>
    `Card ${c.id}: ${c.classical} (${c.modern}). Requirement: ${c.instruction}\nUser's sentence: """${o.answers[i] ?? ''}"""`).join('\n\n');
  return chatJson<PotatoGrade>({
    apiKey: o.apiKey, model: o.model, schemaName: 'potato_grade', schema: potatoSchema,
    system: JUDGE_SYSTEM,
    user: `Core proposition: "${o.proposition}"

The user wrote one or two sentences per card, each meant to restate the SAME core claim dressed in the required figure.

For each card, grade:
- figure: pass if the figure is clearly and correctly executed; partial if attempted but imperfect; fail if absent or wrong.
- claim_preserved: pass if the core claim survives intact (no reversal, no drift into a different claim); partial if weakened or narrowed; fail if lost.
- concision: pass if tight with no padding; partial if somewhat bloated; fail if wordy, passive or full of throat-clearing.
- hedges_found: list any cowardly hedges ("sort of", "arguably", "perhaps", "I think", "maybe", "kind of", "to some extent"). Use an empty list if none.
- better_version: one improved sentence that executes the figure well. Keep it short.

Return the sentences in the same order as the cards, with card_id copied exactly.

${items}`,
    check: (x: any) => (Array.isArray(x?.sentences) && x.sentences.length === o.cards.length ? null : `expected ${o.cards.length} sentences`),
  });
}

// ── Steelman & Detox ──────────────────────────────────────

export interface SteelmanGrade {
  grievance_preserved: Verdict;
  grievance_note: string;
  distortions_remaining: string[];
  distortions_note: string;
  warrant_explicit: Verdict;
  warrant_quote: string;
  deliberative_ending: Verdict;
  deliberative_note: string;
  better_version: string;
}

const steelmanSchema = obj({
  grievance_preserved: VERDICT,
  grievance_note: { type: 'string' },
  distortions_remaining: { type: 'array', items: { type: 'string' } },
  distortions_note: { type: 'string' },
  warrant_explicit: VERDICT,
  warrant_quote: { type: 'string' },
  deliberative_ending: VERDICT,
  deliberative_note: { type: 'string' },
  better_version: { type: 'string' },
});

export function steelmanScore(g: SteelmanGrade, words: number): number {
  const distortions = g.distortions_remaining.length === 0 ? 1 : g.distortions_remaining.length === 1 ? 0.5 : 0;
  const s = 0.25 * v2n(g.grievance_preserved) + 0.25 * distortions + 0.25 * v2n(g.warrant_explicit) + 0.25 * v2n(g.deliberative_ending);
  return words > 75 ? s * 0.85 : s;
}

export function judgeSteelman(o: { apiKey: string; model: string; item: SteelmanItem; answer: string }): Promise<SteelmanGrade> {
  const named = o.item.distortions.map((id) => NODE_MAP[id]?.modern ?? id).join(', ');
  return chatJson<SteelmanGrade>({
    apiKey: o.apiKey, model: o.model, schemaName: 'steelman_grade', schema: steelmanSchema,
    system: JUDGE_SYSTEM,
    user: `ORIGINAL (hostile, distorted) paragraph:
"""${o.item.passage}"""
Distortions and fallacies in the original include: ${named}.
The author's legitimate core grievance: ${o.item.grievance}

The user's task: rewrite in under 75 words so that it (a) preserves the core grievance, (b) strips out every distortion and fallacy, (c) states an explicit, valid warrant (the general rule linking evidence to conclusion), and (d) ends in the Deliberative tense (a future choice or action), not blame.

USER'S REWRITE (${wordCount(o.answer)} words):
"""${o.answer}"""

Grade each criterion. distortions_remaining lists every distortion or fallacy still present in the rewrite (empty list if none). warrant_quote quotes the user's warrant, or is "" if absent. better_version is a model rewrite under 75 words.`,
  });
}

// ── Warrant Sniping ───────────────────────────────────────

export interface WarrantGrade {
  warrant_match: Verdict;
  warrant_note: string;
  undercuts_warrant: Verdict;
  undercut_note: string;
  concession: Verdict;
  concession_note: string;
  tone: Verdict;
  tone_note: string;
  better_rebuttal: string;
}

const warrantSchema = obj({
  warrant_match: VERDICT,
  warrant_note: { type: 'string' },
  undercuts_warrant: VERDICT,
  undercut_note: { type: 'string' },
  concession: VERDICT,
  concession_note: { type: 'string' },
  tone: VERDICT,
  tone_note: { type: 'string' },
  better_rebuttal: { type: 'string' },
});

export function warrantScore(g: WarrantGrade, sentences: number): number {
  const s = 0.35 * v2n(g.warrant_match) + 0.35 * v2n(g.undercuts_warrant) + 0.2 * v2n(g.concession) + 0.1 * v2n(g.tone);
  return sentences > 2 ? s * 0.9 : s;
}

export function judgeWarrant(o: { apiKey: string; model: string; item: WarrantItem; warrant: string; rebuttal: string }): Promise<WarrantGrade> {
  return chatJson<WarrantGrade>({
    apiKey: o.apiKey, model: o.model, schemaName: 'warrant_grade', schema: warrantSchema,
    system: JUDGE_SYSTEM,
    user: `ARGUMENT: """${o.item.argument}"""
Reference hidden warrant (for your calibration; accept any equivalent formulation): ${o.item.hidden_warrant}

The user had to (1) state the hidden warrant in one sentence, then (2) write a two-sentence rebuttal that undercuts THAT warrant (not the data, not the person) while granting a tactical concession to keep high ethos.

USER'S WARRANT: """${o.warrant}"""
USER'S REBUTTAL: """${o.rebuttal}"""

Grade:
- warrant_match: does the user's warrant capture the unstated general rule the argument relies on?
- undercuts_warrant: does the rebuttal attack the warrant itself, rather than the data or the conclusion directly?
- concession: is there a genuine tactical concession?
- tone: is it decorous, with no snark and no ad hominem?
- better_rebuttal: a model two-sentence rebuttal.`,
  });
}

// ── The Fencing Salle ─────────────────────────────────────

export interface OpponentBrief {
  personaName: string;
  personaVoice: string;
  motion: string;
  opponentSide: 'pro' | 'con';
  round: number;
  rounds: number;
  tacticInstruction: string;
  wordCap: number;
  targetNote?: string;
}

export function opponentSystem(b: OpponentBrief): string {
  return `You are role-playing a debate opponent in a rhetoric training app. Stay in character for the whole bout.

Character: ${b.personaName}. Voice: ${b.personaVoice}
Motion: "${b.motion}"
You argue the ${b.opponentSide === 'pro' ? 'PROPOSITION (for the motion)' : 'OPPOSITION (against the motion)'}.
This is round ${b.round} of ${b.rounds}.

SECRET tactic for THIS round, which you must deploy clearly but naturally: ${b.tacticInstruction}
${b.targetNote ? `Training focus: ${b.targetNote}\n` : ''}
Rules:
- Never name, label or hint at your tactic, and never break character or mention being an AI, a game or a training exercise.
- Respond directly to what the user just said, then press your case.
- Maximum ${b.wordCap} words. Plain prose, no headings, no bullet points, no stage directions.
- Be a genuinely testing opponent: persuasive and confident, never cartoonish.`;
}

export function opponentTurn(o: { apiKey: string; model: string; system: string; history: ChatMessage[]; signal?: AbortSignal }) {
  return chat({ apiKey: o.apiKey, model: o.model, messages: [{ role: 'system', content: o.system }, ...o.history], temperature: 0.8, maxTokens: 400, signal: o.signal });
}

export interface AxisGrade {
  checks: boolean[];
  score: number;
  evidence: string;
}
export interface TacticFinding {
  tactic_id: string;
  named_by_user: boolean;
  neutralised: boolean;
  note: string;
}
export interface Scorecard {
  logos: AxisGrade;
  ethos: AxisGrade;
  tense_control: AxisGrade;
  syntax: AxisGrade;
  epistemics: AxisGrade;
  tactics: TacticFinding[];
  hedge_count: number;
  key_moment: string;
  top_improvement: string;
  verdict: 'user' | 'opponent' | 'draw';
  verdict_reason: string;
}

export const AXIS_CRITERIA: Record<keyof Omit<Scorecard, 'tactics' | 'hedge_count' | 'key_moment' | 'top_improvement' | 'verdict' | 'verdict_reason'>, { title: string; checks: string[] }> = {
  logos: { title: 'Logos & Warrant Integrity', checks: [
    'Every main claim was linked to evidence by a stated or obvious warrant',
    'Exposed at least one of the opponent’s hidden warrants or fallacies',
    'No fallacies of the user’s own',
  ] },
  ethos: { title: 'Ethos & Decorum', checks: [
    'Showed practical wisdom (situation-specific judgement)',
    'Used at least one tactical concession effectively',
    'Avoided snark, sarcasm and personal attacks',
  ] },
  tense_control: { title: 'Tense & Stasis Control', checks: [
    'Kept the argument anchored in the Deliberative (future-choice) tense',
    'Refused or redirected attempts to drag the debate into past blame',
    'Identified the real point of disagreement (stasis)',
  ] },
  syntax: { title: 'Syntactic Force & Figures', checks: [
    'Varied sentence length and structure',
    'Used at least one rhetorical figure effectively',
    'No weak hedging (“sort of”, “arguably”, “I think maybe”)',
  ] },
  epistemics: { title: 'Epistemic & Factual Grounding', checks: [
    'Distinguished empirical fact from inference and value judgement',
    'Calibrated confidence: no overclaiming',
    'Did not accept the opponent’s overclaims or invented data uncritically',
  ] },
};

const axisSchema = obj({
  checks: { type: 'array', items: { type: 'boolean' } },
  score: { type: 'integer' },
  evidence: { type: 'string' },
});

const scorecardSchema = obj({
  logos: axisSchema,
  ethos: axisSchema,
  tense_control: axisSchema,
  syntax: axisSchema,
  epistemics: axisSchema,
  tactics: { type: 'array', items: obj({
    tactic_id: { type: 'string' },
    named_by_user: { type: 'boolean' },
    neutralised: { type: 'boolean' },
    note: { type: 'string' },
  }) },
  hedge_count: { type: 'integer' },
  key_moment: { type: 'string' },
  top_improvement: { type: 'string' },
  verdict: { type: 'string', enum: ['user', 'opponent', 'draw'] },
  verdict_reason: { type: 'string' },
});

/** Final 0–100 axis score: the judge's number tempered by its own checklist. */
export function axisFinal(a: AxisGrade): number {
  const met = a.checks.length ? a.checks.filter(Boolean).length / a.checks.length : 0;
  return Math.round(0.5 * Math.min(100, Math.max(0, a.score)) + 50 * met);
}

export function arbitrate(o: {
  apiKey: string; model: string; motion: string; userSide: 'pro' | 'con';
  transcript: { speaker: 'opponent' | 'user'; round: number; text: string; flagged?: string[] }[];
  tacticsUsed: { round: number; id: string; label: string }[];
  signal?: AbortSignal;
}): Promise<Scorecard> {
  const transcript = o.transcript
    .map((t) => `[Round ${t.round}] ${t.speaker === 'user' ? 'USER' : 'OPPONENT'}: ${t.text}${t.flagged?.length ? `\n  (User flagged opponent tactics: ${t.flagged.join(', ')})` : ''}`)
    .join('\n\n');
  const criteria = Object.entries(AXIS_CRITERIA)
    .map(([k, v]) => `${k} (${v.title}):\n${v.checks.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`)
    .join('\n');
  return chatJson<Scorecard>({
    apiKey: o.apiKey, model: o.model, schemaName: 'salle_scorecard', schema: scorecardSchema, signal: o.signal,
    system: `${JUDGE_SYSTEM} You are the Corner Arbiter of a formal debate. You judge ONLY the user's performance, objectively, even when the opponent argued better or worse.`,
    user: `Motion: "${o.motion}". The user argued ${o.userSide === 'pro' ? 'FOR' : 'AGAINST'} the motion.

The opponent secretly used these tactics: ${o.tacticsUsed.map((t) => `round ${t.round}: ${t.id} (${t.label})`).join('; ')}.

TRANSCRIPT:
${transcript}

For each axis, set "checks" to an array of booleans, one per numbered criterion below, in order. Set "score" to 0–100 for that axis overall, and "evidence" to a short quote or observation from the user's turns.
${criteria}

For "tactics", include one entry per tactic the opponent used (tactic_id exactly as given): named_by_user is true if the user explicitly called it out in their words or flagged it; neutralised is true if the user's reply defused it.
hedge_count: the number of weak hedges in the user's turns.
key_moment: the user's best or most decisive moment. top_improvement: the single most useful thing to change next time.`,
    check: (x: any) => {
      for (const k of Object.keys(AXIS_CRITERIA)) {
        if (!Array.isArray(x?.[k]?.checks) || x[k].checks.length !== 3) return `${k}.checks must have exactly 3 booleans`;
      }
      return Array.isArray(x?.tactics) ? null : 'tactics must be an array';
    },
  });
}
