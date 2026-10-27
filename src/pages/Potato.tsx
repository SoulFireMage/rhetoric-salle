import { useState } from 'preact/hooks';
import { CARDS, PROPOSITIONS, type FigureCard } from '../data/forge';
import { Busy, SaveButton, ScoreBox, SelfCheck, VerdictLine } from '../components/ForgeBits';
import { Dual } from '../components/Term';
import { judgePotato, potatoScore, wordCount, type PotatoGrade } from '../lib/judges';
import { shuffle } from '../lib/scheduler';
import type { NodeDelta } from '../lib/telemetry';
import { apiKey, recordOutcome, saveItem, settings } from '../state/store';

const DIFFICULTY = 1300;

function deal() {
  return { proposition: PROPOSITIONS[Math.floor(Math.random() * PROPOSITIONS.length)], cards: shuffle(CARDS).slice(0, 3) };
}

export function Potato() {
  const [hand, setHand] = useState(deal);
  const [answers, setAnswers] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<PotatoGrade | null>(null);
  const [selfMode, setSelfMode] = useState(false);
  const [result, setResult] = useState<{ score: number; deltas: NodeDelta[]; mode: 'judge' | 'self' } | null>(null);

  const reset = () => { setHand(deal()); setAnswers(['', '', '']); setGrade(null); setResult(null); setSelfMode(false); setError(''); };
  const ready = answers.every((a) => a.trim().length > 0);

  const record = (scores: number[], mode: 'judge' | 'self') => {
    const weight = mode === 'judge' ? 0.5 : 0.25;
    const deltas = hand.cards.flatMap((c: FigureCard, i: number) =>
      recordOutcome({ kind: 'forge', item_id: `potato:${c.id}`, nodes: c.nodes, difficulty: DIFFICULTY, score: scores[i], weight }));
    setResult({ score: scores.reduce((a, b) => a + b, 0) / scores.length, deltas, mode });
  };

  const submit = async () => {
    if (!apiKey.value) { setSelfMode(true); return; }
    setBusy(true); setError('');
    try {
      const g = await judgePotato({ apiKey: apiKey.value, model: settings.value.judge_model, proposition: hand.proposition, cards: hand.cards, answers });
      setGrade(g);
      record(g.sentences.map(potatoScore), 'judge');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const locked = !!grade || selfMode;

  return (
    <div>
      <div class="eyebrow"><a href="#/forge">Forge</a> · Syntactic workbench</div>
      <h1>Mr. Potato Head</h1>
      <section class="panel">
        <div class="eyebrow">The proposition</div>
        <p style={{ fontSize: '1.3rem', fontStyle: 'italic', margin: '6px 0 0' }}>“{hand.proposition}”</p>
        <p class="muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>Write one or two sentences per card. Each must keep the same core claim, dressed in the card’s figure. Be tight: bloat and hedges cost marks.</p>
      </section>
      {hand.cards.map((c, i) => (
        <section class="panel">
          <div class="drill-head">
            <h3 style={{ margin: 0 }}>Card {i + 1}: <Dual classical={c.classical} modern={c.modern} /></h3>
            <span class="mono muted">{wordCount(answers[i])} words</span>
          </div>
          <p class="muted" style={{ fontSize: '0.95rem' }}>{c.instruction}</p>
          <textarea value={answers[i]} disabled={locked} aria-label={`Your sentence for ${c.classical}`}
            onInput={(e) => setAnswers(answers.map((a, j) => (j === i ? (e.target as HTMLTextAreaElement).value : a)))} />
          {(locked) && <p class="feedback">Example on a different claim: {c.example}</p>}
          {grade?.sentences[i] && (
            <div style={{ marginTop: '10px' }}>
              <VerdictLine label="Figure" verdict={grade.sentences[i].figure} note={grade.sentences[i].figure_note} />
              <VerdictLine label="Core claim preserved" verdict={grade.sentences[i].claim_preserved} note={grade.sentences[i].claim_note} />
              <VerdictLine label="Rhythm & concision" verdict={grade.sentences[i].concision} note={grade.sentences[i].concision_note} />
              {grade.sentences[i].hedges_found.length > 0 && <p class="down mono" style={{ fontSize: '0.8rem' }}>Hedges: {grade.sentences[i].hedges_found.join(', ')}</p>}
              <p><span class="eyebrow">Stronger version · </span><em>{grade.sentences[i].better_version}</em></p>
              <p class="mono muted" style={{ fontSize: '0.78rem' }}>Card score {Math.round(potatoScore(grade.sentences[i]) * 100)}%</p>
            </div>
          )}
        </section>
      ))}
      {error && <div class="notice bad">{error}</div>}
      {busy && <Busy label="The judge is reading…" />}
      {!locked && (
        <div class="btn-row">
          <button class="btn-primary" disabled={!ready || busy} onClick={submit}>{apiKey.value ? 'Submit to the judge' : 'Compare & self-check'}</button>
          <button onClick={reset} disabled={busy}>Re-deal</button>
        </div>
      )}
      {selfMode && !result && (
        <SelfCheck
          items={hand.cards.flatMap((c, i) => [`Card ${i + 1}: the ${c.classical} is clearly executed`, `Card ${i + 1}: the core claim survives, tight and unhedged`])}
          onSubmit={(s) => record(hand.cards.map(() => s), 'self')}
        />
      )}
      {grade?.overall_comment && <div class="notice">{grade.overall_comment}</div>}
      {result && (
        <>
          <ScoreBox score={result.score} deltas={result.deltas} mode={result.mode} />
          <div class="btn-row">
            <button class="btn-primary" onClick={reset}>New hand</button>
            <SaveButton onSave={() => saveItem({ kind: 'potato', title: hand.proposition, content: hand.cards.map((c, i) => `${c.classical}: ${answers[i]}`).join('\n\n') })} />
          </div>
        </>
      )}
    </div>
  );
}
