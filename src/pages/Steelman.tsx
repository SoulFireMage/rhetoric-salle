import { useState } from 'preact/hooks';
import { STEELMAN } from '../data/forge';
import { NODE_MAP } from '../data/taxonomy';
import { Busy, SaveButton, ScoreBox, SelfCheck, VerdictLine } from '../components/ForgeBits';
import { Term } from '../components/Term';
import { judgeSteelman, steelmanScore, wordCount, type SteelmanGrade } from '../lib/judges';
import type { NodeDelta } from '../lib/telemetry';
import { apiKey, recordOutcome, saveItem, settings } from '../state/store';

const DIFFICULTY = 1350;
const LIMIT = 75;

export function Steelman() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * STEELMAN.length));
  const item = STEELMAN[idx];
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<SteelmanGrade | null>(null);
  const [selfMode, setSelfMode] = useState(false);
  const [result, setResult] = useState<{ score: number; deltas: NodeDelta[]; mode: 'judge' | 'self' } | null>(null);
  const words = wordCount(answer);
  // Primary node: the first fallacy/distortion; then warrant and deliberative tense.
  const nodes = [...item.distortions.filter((n) => NODE_MAP[n]?.wing === 'fallacies').slice(0, 2), 'toulmin_warrant', 'tense_deliberative'];

  const next = () => { setIdx((idx + 1) % STEELMAN.length); setAnswer(''); setGrade(null); setResult(null); setSelfMode(false); setError(''); };

  const record = (score: number, mode: 'judge' | 'self') => {
    const deltas = recordOutcome({ kind: 'forge', item_id: item.id, nodes, difficulty: DIFFICULTY, score, weight: mode === 'judge' ? 0.5 : 0.25 });
    setResult({ score, deltas, mode });
  };

  const submit = async () => {
    if (!apiKey.value) { setSelfMode(true); return; }
    setBusy(true); setError('');
    try {
      const g = await judgeSteelman({ apiKey: apiKey.value, model: settings.value.judge_model, item, answer });
      setGrade(g);
      record(steelmanScore(g, words), 'judge');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const locked = !!grade || selfMode;

  return (
    <div>
      <div class="eyebrow"><a href="#/forge">Forge</a> · Argument reconstruction</div>
      <h1>Steelman &amp; Detox</h1>
      <section class="panel">
        <div class="drill-head"><h3 style={{ margin: 0 }}>{item.title}</h3><button class="btn-quiet" onClick={next} disabled={busy}>Another passage →</button></div>
        <blockquote style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic', borderLeft: '3px solid var(--bad)', paddingLeft: '14px' }}>{item.passage}</blockquote>
        <p style={{ marginTop: '14px' }}>Rewrite it in <strong>under {LIMIT} words</strong> so that it:</p>
        <ol style={{ marginTop: 0 }}>
          <li>preserves the author’s core grievance or goal,</li>
          <li>strips out every fallacy and cognitive distortion,</li>
          <li>supplies a valid, <em>explicit</em> warrant, and</li>
          <li>ends in the <strong>Deliberative</strong> tense: a future choice, not blame.</li>
        </ol>
      </section>
      <section class="panel">
        <div class="drill-head"><label for="sm-answer">Your rewrite</label><span class={`mono ${words > LIMIT ? 'down' : 'muted'}`}>{words} / {LIMIT} words</span></div>
        <textarea id="sm-answer" value={answer} disabled={locked} style={{ minHeight: '140px' }} onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)} />
        {!locked && (
          <div class="btn-row">
            <button class="btn-primary" disabled={!answer.trim() || busy} onClick={submit}>{apiKey.value ? 'Submit to the judge' : 'Compare & self-check'}</button>
          </div>
        )}
      </section>
      {error && <div class="notice bad">{error}</div>}
      {busy && <Busy label="The judge is reading…" />}
      {grade && (
        <section class="panel">
          <VerdictLine label="Core grievance preserved" verdict={grade.grievance_preserved} note={grade.grievance_note} />
          <VerdictLine label={`Distortions removed${grade.distortions_remaining.length ? ` (still present: ${grade.distortions_remaining.join(', ')})` : ''}`}
            verdict={grade.distortions_remaining.length === 0 ? 'pass' : grade.distortions_remaining.length === 1 ? 'partial' : 'fail'} note={grade.distortions_note} />
          <VerdictLine label="Explicit, valid warrant" verdict={grade.warrant_explicit} note={grade.warrant_quote ? `“${grade.warrant_quote}”` : 'No warrant found.'} />
          <VerdictLine label="Deliberative ending" verdict={grade.deliberative_ending} note={grade.deliberative_note} />
          {words > LIMIT && <p class="down mono" style={{ fontSize: '0.8rem' }}>Over {LIMIT} words: 15% penalty.</p>}
          <p><span class="eyebrow">Judge’s version · </span><em>{grade.better_version}</em></p>
        </section>
      )}
      {locked && (
        <section class="panel">
          <div class="eyebrow">Reference answer</div>
          <p><em>{item.exemplar}</em></p>
          <div class="tags"><span class="muted" style={{ fontSize: '0.85rem' }}>Distortions in the original:</span>{item.distortions.map((d) => <span class="tag"><Term node={d} /></span>)}</div>
        </section>
      )}
      {selfMode && !result && (
        <SelfCheck
          items={['My rewrite keeps the core grievance', 'It contains no fallacies or distortions', 'It states an explicit warrant (a general rule)', 'It ends with a future choice or action', `It is under ${LIMIT} words`]}
          onSubmit={(s) => record(s, 'self')}
        />
      )}
      {result && (
        <>
          <ScoreBox score={result.score} deltas={result.deltas} mode={result.mode} />
          <div class="btn-row">
            <button class="btn-primary" onClick={next}>Next passage</button>
            <SaveButton onSave={() => saveItem({ kind: 'steelman', title: item.title, content: answer })} />
          </div>
        </>
      )}
    </div>
  );
}
