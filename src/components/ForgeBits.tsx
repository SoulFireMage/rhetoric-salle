import { useState } from 'preact/hooks';
import type { Verdict } from '../lib/judges';
import { Deltas } from './Deltas';
import type { NodeDelta } from '../lib/telemetry';

export function VerdictLine({ label, verdict, note }: { label: string; verdict: Verdict; note?: string }) {
  const icon = verdict === 'pass' ? '✓' : verdict === 'partial' ? '◐' : '✗';
  const cls = verdict === 'pass' ? 'up' : verdict === 'partial' ? '' : 'down';
  return (
    <div style={{ marginBottom: '6px' }}>
      <span class={`mono ${cls}`}>{icon} {label}</span>
      {note && <div class="feedback">{note}</div>}
    </div>
  );
}

/** Self-check checklist for the no-key mode. Returns a fraction 0–1 via onSubmit. */
export function SelfCheck({ items, onSubmit }: { items: string[]; onSubmit: (score: number) => void }) {
  const [ticks, setTicks] = useState<boolean[]>(items.map(() => false));
  const [sent, setSent] = useState(false);
  return (
    <div class="panel" style={{ background: 'var(--panel-2)' }}>
      <div class="eyebrow">Self-check: be honest, it only trains you</div>
      {items.map((it, i) => (
        <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '6px 0' }}>
          <input type="checkbox" checked={ticks[i]} disabled={sent} onChange={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))} />
          <span>{it}</span>
        </label>
      ))}
      <div class="btn-row">
        <button class="btn-primary" disabled={sent} onClick={() => { setSent(true); onSubmit(ticks.filter(Boolean).length / items.length); }}>Record self-assessment</button>
      </div>
    </div>
  );
}

export function ScoreBox({ score, deltas, mode }: { score: number; deltas: NodeDelta[] | null; mode: 'judge' | 'self' }) {
  return (
    <div class="notice good">
      <strong>Score: {Math.round(score * 100)}%</strong>{' '}
      <span class="muted">({mode === 'judge' ? 'AI-judged, half-weight rating update' : 'self-assessed, quarter-weight rating update'})</span>
      {deltas && <Deltas deltas={deltas} />}
    </div>
  );
}

export function Busy({ label }: { label: string }) {
  return <p class="muted"><span class="spinner" /> {label}</p>;
}

export function SaveButton({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  return <button disabled={saved} onClick={() => { onSave(); setSaved(true); }}>{saved ? 'Saved' : 'Save to my pieces'}</button>;
}
