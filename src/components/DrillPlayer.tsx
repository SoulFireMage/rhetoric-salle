import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ChoiceQuestion, DrillItem } from '../lib/types';
import { shuffle } from '../lib/scheduler';
import { Dual, Explanation, Term } from './Term';

export interface DrillResult {
  score: number;
  ttd_ms?: number;
}

interface Props {
  drill: DrillItem;
  onComplete: (r: DrillResult) => void;
  /** Blitz: skip follow-up questions and keep it terse. */
  blitz?: boolean;
}

const prettyRole = (role: string) => role.replace(/_/g, ' ');

const HOW_TO: Record<DrillItem['drill_type'], string> = {
  surgical_dissection: 'Read the instruction, then click the sentence it asks for. The passage then shows each sentence’s role. Answer the follow-up question if there is one, and read the Anatomy at the end.',
  diagnostic_tree: 'Answer the questions in order. Each step unlocks the next. Read the feedback on the options you didn’t choose too: every wrong option is wrong for a reason worth knowing.',
  syntactic_assembly: 'Tap blocks to add them to your sentence, and tap a placed block to remove it. Some blocks are decoys. Press Check when done: you get two tries, and going over time gives partial credit.',
};

const SEEN_KEY = 'rs.seen_drill_types';
function firstTimeFor(type: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    if (seen.includes(type)) return false;
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, type]));
    return true;
  } catch {
    return false;
  }
}

function HowTo({ type }: { type: DrillItem['drill_type'] }) {
  const [open] = useState(() => firstTimeFor(type));
  return (
    <details class="howto" open={open}>
      <summary>How this drill works</summary>
      <p>{HOW_TO[type]} <a href="#/guide">Full guide</a></p>
    </details>
  );
}

export function DrillHeader({ drill }: { drill: DrillItem }) {
  const typeLabel = { surgical_dissection: 'Surgical Dissection', diagnostic_tree: 'Diagnostic Tree', syntactic_assembly: 'Clause Assembly' }[drill.drill_type];
  return (
    <div class="drill-head">
      <div>
        <div class="eyebrow">{typeLabel} · {drill.domain ?? 'General'} · difficulty {drill.difficulty_elo}</div>
        <h2 style={{ margin: '4px 0 0' }}><Dual classical={drill.register_tags.classical} modern={drill.register_tags.modern} /></h2>
      </div>
      <div class="tags">{drill.taxonomy_nodes.map((n) => <span class="tag"><Term node={n} /></span>)}</div>
    </div>
  );
}

export function DrillPlayer({ drill, onComplete, blitz }: Props) {
  // Remount per drill so internal state resets cleanly.
  return <Inner key={drill.id} drill={drill} onComplete={onComplete} blitz={blitz} />;
}

function Inner({ drill, onComplete, blitz }: Props) {
  const [done, setDone] = useState(false);
  const finish = (r: DrillResult) => {
    setDone(true);
    onComplete(r);
  };
  return (
    <div>
      <DrillHeader drill={drill} />
      {!blitz && <HowTo type={drill.drill_type} />}
      <p class="prompt">{drill.prompt_instruction}</p>
      {drill.drill_type === 'surgical_dissection' && <Dissection drill={drill} onFinish={finish} blitz={blitz} />}
      {drill.drill_type === 'diagnostic_tree' && <Tree drill={drill} onFinish={finish} />}
      {drill.drill_type === 'syntactic_assembly' && <Assembly drill={drill} onFinish={finish} />}
      {done && !blitz && (
        <div class="result">
          <hr class="hr" />
          <div class="eyebrow">Anatomy</div>
          <Explanation formal={drill.explanation_formal} modern={drill.explanation_modern} />
        </div>
      )}
    </div>
  );
}

// ── Choice question (shared by follow-ups and tree steps) ──

function Question({ q, onAnswer, label }: { q: ChoiceQuestion; onAnswer: (correct: boolean) => void; label?: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => shuffle(q.options), [q]);
  return (
    <div style={{ marginTop: '16px' }}>
      {label && <div class="step-label">{label}</div>}
      <div style={{ fontWeight: 500 }}>{q.question}</div>
      <div class="options" role="list">
        {options.map((o) => {
          const cls = !picked ? '' : o.is_correct ? 'correct' : picked === o.id ? 'wrong' : 'dim';
          return (
            <div role="listitem">
              <button
                class={`option ${cls}`}
                style={{ width: '100%' }}
                disabled={!!picked}
                aria-pressed={picked === o.id}
                onClick={() => {
                  setPicked(o.id);
                  onAnswer(o.is_correct);
                }}
              >
                {o.text}
              </button>
              {picked && (picked === o.id || o.is_correct) && <div class="feedback">{o.is_correct ? '✓ ' : '✗ '}{o.feedback}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Surgical dissection ──────────────────

function Dissection({ drill, onFinish, blitz }: { drill: DrillItem; onFinish: (r: DrillResult) => void; blitz?: boolean }) {
  const start = useRef(performance.now());
  const [picked, setPicked] = useState<string | null>(null);
  const [ttd, setTtd] = useState<number | undefined>();
  const segs = drill.passage_segments ?? [];
  const hit = picked === drill.correct_target_id;
  const followUp = !blitz ? drill.follow_up_question : undefined;

  const pick = (id: string) => {
    if (picked) return;
    const t = performance.now() - start.current;
    setPicked(id);
    setTtd(t);
    if (!followUp) onFinish({ score: id === drill.correct_target_id ? 1 : 0, ttd_ms: t });
  };

  return (
    <div>
      <div class="passage" aria-label="Passage: choose a sentence">
        {segs.map((s) => {
          const cls = !picked ? '' : s.id === drill.correct_target_id ? 'correct' : s.id === picked ? 'wrong' : '';
          return (
            <>
              <span
                class={`seg-span ${picked ? 'locked' : ''} ${cls}`}
                role="button"
                tabIndex={picked ? -1 : 0}
                onClick={() => pick(s.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(s.id))}
                title={picked ? (s.note ?? prettyRole(s.role)) : undefined}
              >
                {s.text}
                {picked && <span class="role">{prettyRole(s.role)}{s.tense ? ` · ${s.tense}` : ''}</span>}
              </span>{' '}
            </>
          );
        })}
      </div>
      {picked && (
        <div class={`notice ${hit ? 'good' : 'bad'}`}>
          {hit ? 'Correct.' : 'Not quite. The highlighted green span is the target.'}
          {ttd != null && <span class="mono"> · time to detection {(ttd / 1000).toFixed(1)}s</span>}
        </div>
      )}
      {picked && followUp && (
        <Question q={followUp} label="Follow-up" onAnswer={(ok) => onFinish({ score: (hit ? 0.6 : 0) + (ok ? 0.4 : 0), ttd_ms: ttd })} />
      )}
    </div>
  );
}

// ── Diagnostic tree ──────────────────────

function Tree({ drill, onFinish }: { drill: DrillItem; onFinish: (r: DrillResult) => void }) {
  const steps = drill.steps ?? [];
  const [answers, setAnswers] = useState<boolean[]>([]);
  const start = useRef(performance.now());
  const firstAt = useRef<number | undefined>(undefined);
  const answer = (ok: boolean) => {
    if (firstAt.current == null) firstAt.current = performance.now() - start.current;
    const next = [...answers, ok];
    setAnswers(next);
    if (next.length === steps.length) onFinish({ score: next.filter(Boolean).length / steps.length, ttd_ms: firstAt.current });
  };
  return (
    <div>
      <div class="passage lines">{(drill.passage_segments ?? []).map((s) => <div>{s.text}</div>)}</div>
      {steps.slice(0, answers.length + 1).map((s, i) => (
        <Question key={s.id} q={s} label={`Step ${i + 1} of ${steps.length} · ${s.label}`} onAnswer={i === answers.length ? answer : () => undefined} />
      ))}
      {answers.length === steps.length && (
        <div class="notice">{answers.filter(Boolean).length} of {steps.length} steps correct.</div>
      )}
    </div>
  );
}

// ── Syntactic assembly ───────────────────

function Assembly({ drill, onFinish }: { drill: DrillItem; onFinish: (r: DrillResult) => void }) {
  const blocks = drill.blocks ?? [];
  const pool = useMemo(() => {
    // Avoid dealing the blocks already in a solved order.
    let s = shuffle(blocks);
    for (let i = 0; i < 5 && (drill.solutions ?? []).some((sol) => sol.join() === s.map((b) => b.id).slice(0, sol.length).join()); i++) s = shuffle(blocks);
    return s;
  }, [drill]);
  const [tray, setTray] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<'open' | 'wrong' | 'solved' | 'revealed'>('open');
  const [elapsed, setElapsed] = useState(0);
  const limit = drill.time_limit_s ?? 60;
  const start = useRef(performance.now());

  useEffect(() => {
    if (status === 'solved' || status === 'revealed') return;
    const t = setInterval(() => setElapsed((performance.now() - start.current) / 1000), 250);
    return () => clearInterval(t);
  }, [status]);

  const locked = status === 'solved' || status === 'revealed';
  const byId = (id: string) => blocks.find((b) => b.id === id)!;
  const check = () => {
    const ok = (drill.solutions ?? []).some((sol) => sol.join('|') === tray.join('|'));
    const n = tries + 1;
    setTries(n);
    const t = performance.now() - start.current;
    if (ok) {
      setStatus('solved');
      const base = n === 1 ? 1 : 0.5;
      onFinish({ score: t / 1000 > limit ? base * 0.75 : base, ttd_ms: t });
    } else if (n >= 2) {
      setStatus('revealed');
      setTray(drill.solutions![0]);
      onFinish({ score: 0, ttd_ms: t });
    } else setStatus('wrong');
  };

  return (
    <div>
      <div class="drill-head">
        <span class="mono muted">Target: {drill.target_structure}</span>
        <span class={`timer ${elapsed > limit ? 'over' : ''}`}>{Math.floor(elapsed)}s / {limit}s</span>
      </div>
      <div class="eyebrow">Your sentence</div>
      <div class="tray" aria-label="Your sentence (tap a block to remove it)">
        {tray.length === 0 && <span class="muted">Tap blocks below to build the sentence.</span>}
        {tray.map((id, i) => (
          <button class="block" disabled={locked} onClick={() => setTray(tray.filter((_, j) => j !== i))}>{byId(id).text}</button>
        ))}
      </div>
      <div class="eyebrow" style={{ marginTop: '10px' }}>Blocks</div>
      <div class="pool">
        {pool.filter((b) => !tray.includes(b.id)).map((b) => (
          <button class="block" disabled={locked} onClick={() => { setTray([...tray, b.id]); if (status === 'wrong') setStatus('open'); }}>{b.text}</button>
        ))}
      </div>
      {!locked && (
        <div class="btn-row">
          <button class="btn-primary" disabled={!tray.length} onClick={check}>Check</button>
          <button onClick={() => setTray([])} disabled={!tray.length}>Clear</button>
        </div>
      )}
      {status === 'wrong' && <div class="notice bad">Not yet. One more try before the answer is shown.</div>}
      {status === 'solved' && <div class="notice good">Correct{tries > 1 ? ' on the second try' : ''}.{elapsed > limit ? ' Over time, so partial credit.' : ''}</div>}
      {status === 'revealed' && <div class="notice bad">Here's an accepted order.</div>}
      {locked && <p style={{ marginTop: '12px', fontSize: '1.15rem' }}><em>{(status === 'solved' ? tray : drill.solutions?.[0] ?? []).map((id) => byId(id).text).join(' ')}</em></p>}
    </div>
  );
}
