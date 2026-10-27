import { useState } from 'preact/hooks';
import { WARRANTS } from '../data/forge';
import { Busy, SaveButton, ScoreBox, SelfCheck, VerdictLine } from '../components/ForgeBits';
import { judgeWarrant, sentenceCount, warrantScore, type WarrantGrade } from '../lib/judges';
import type { NodeDelta } from '../lib/telemetry';
import { apiKey, recordOutcome, saveItem, settings } from '../state/store';

const DIFFICULTY = 1300;

export function WarrantSniping() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WARRANTS.length));
  const item = WARRANTS[idx];
  const [warrant, setWarrant] = useState('');
  const [rebuttal, setRebuttal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<WarrantGrade | null>(null);
  const [selfMode, setSelfMode] = useState(false);
  const [result, setResult] = useState<{ score: number; deltas: NodeDelta[]; mode: 'judge' | 'self' } | null>(null);
  const sentences = sentenceCount(rebuttal);
  const nodes = [...item.nodes, 'concession_pivot'];

  const next = () => { setIdx((idx + 1) % WARRANTS.length); setWarrant(''); setRebuttal(''); setGrade(null); setResult(null); setSelfMode(false); setError(''); };
  const record = (score: number, mode: 'judge' | 'self') => {
    const deltas = recordOutcome({ kind: 'forge', item_id: item.id, nodes, difficulty: DIFFICULTY, score, weight: mode === 'judge' ? 0.5 : 0.25 });
    setResult({ score, deltas, mode });
  };
  const submit = async () => {
    if (!apiKey.value) { setSelfMode(true); return; }
    setBusy(true); setError('');
    try {
      const g = await judgeWarrant({ apiKey: apiKey.value, model: settings.value.judge_model, item, warrant, rebuttal });
      setGrade(g);
      record(warrantScore(g, sentences), 'judge');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const locked = !!grade || selfMode;

  return (
    <div>
      <div class="eyebrow"><a href="#/forge">Forge</a> · Targeted counter-strike</div>
      <h1>Warrant Sniping</h1>
      <section class="panel">
        <div class="drill-head"><h3 style={{ margin: 0 }}>{item.title}</h3><button class="btn-quiet" onClick={next} disabled={busy}>Another argument →</button></div>
        <blockquote style={{ margin: 0, fontSize: '1.15rem', fontStyle: 'italic', borderLeft: '3px solid var(--brass)', paddingLeft: '14px' }}>{item.argument}</blockquote>
        <p class="muted" style={{ marginTop: '12px', fontSize: '0.95rem' }}>It sounds reasonable. Find the fatal unstated assumption.</p>
      </section>
      <section class="panel">
        <div class="field">
          <label for="ws-warrant">1. The hidden warrant, in one sentence</label>
          <textarea id="ws-warrant" style={{ minHeight: '60px' }} value={warrant} disabled={locked} onInput={(e) => setWarrant((e.target as HTMLTextAreaElement).value)} />
        </div>
        <div class="field">
          <div class="drill-head" style={{ marginBottom: 0 }}>
            <label for="ws-rebuttal">2. Your two-sentence rebuttal: undercut the warrant and grant a tactical concession</label>
            <span class={`mono ${sentences > 2 ? 'down' : 'muted'}`}>{sentences} sentence{sentences === 1 ? '' : 's'}</span>
          </div>
          <textarea id="ws-rebuttal" value={rebuttal} disabled={locked} onInput={(e) => setRebuttal((e.target as HTMLTextAreaElement).value)} />
        </div>
        {!locked && (
          <div class="btn-row">
            <button class="btn-primary" disabled={!warrant.trim() || !rebuttal.trim() || busy} onClick={submit}>{apiKey.value ? 'Submit to the judge' : 'Compare & self-check'}</button>
          </div>
        )}
      </section>
      {error && <div class="notice bad">{error}</div>}
      {busy && <Busy label="The judge is reading…" />}
      {grade && (
        <section class="panel">
          <VerdictLine label="Warrant identified" verdict={grade.warrant_match} note={grade.warrant_note} />
          <VerdictLine label="Rebuttal undercuts the warrant" verdict={grade.undercuts_warrant} note={grade.undercut_note} />
          <VerdictLine label="Tactical concession" verdict={grade.concession} note={grade.concession_note} />
          <VerdictLine label="Decorum" verdict={grade.tone} note={grade.tone_note} />
          {sentences > 2 && <p class="down mono" style={{ fontSize: '0.8rem' }}>More than two sentences: 10% penalty.</p>}
          <p><span class="eyebrow">Judge’s rebuttal · </span><em>{grade.better_rebuttal}</em></p>
        </section>
      )}
      {locked && (
        <section class="panel">
          <div class="eyebrow">Reference</div>
          <p><strong>Hidden warrant:</strong> {item.hidden_warrant}</p>
          <p><strong>Model rebuttal:</strong> <em>{item.exemplar_rebuttal}</em></p>
        </section>
      )}
      {selfMode && !result && (
        <SelfCheck
          items={['My warrant matches the hidden assumption (in substance)', 'My rebuttal attacks the warrant, not the data or the person', 'I granted a genuine concession', 'Two sentences, no snark']}
          onSubmit={(s) => record(s, 'self')}
        />
      )}
      {result && (
        <>
          <ScoreBox score={result.score} deltas={result.deltas} mode={result.mode} />
          <div class="btn-row">
            <button class="btn-primary" onClick={next}>Next argument</button>
            <SaveButton onSave={() => saveItem({ kind: 'warrant', title: item.title, content: `Warrant: ${warrant}\n\nRebuttal: ${rebuttal}` })} />
          </div>
        </>
      )}
    </div>
  );
}
