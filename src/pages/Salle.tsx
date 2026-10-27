import { useEffect, useRef, useState } from 'preact/hooks';
import { AXIS_NODES, MOTIONS, PERSONAS, TACTIC_MAP, TACTICS, type Persona } from '../data/salle';
import { Busy } from '../components/ForgeBits';
import { Deltas } from '../components/Deltas';
import { Term } from '../components/Term';
import { arbitrate, axisFinal, AXIS_CRITERIA, opponentSystem, opponentTurn, wordCount, type Scorecard } from '../lib/judges';
import type { ChatMessage } from '../lib/openrouter';
import { nodePriorities, shuffle } from '../lib/scheduler';
import type { NodeDelta } from '../lib/telemetry';
import type { SalleScores } from '../lib/types';
import { addBout, apiKey, recordOutcome, settings, storeTranscript, telemetry, updateSettings } from '../state/store';

type Side = 'pro' | 'con';
interface Turn { speaker: 'opponent' | 'user'; round: number; text: string; flagged?: string[] }
interface BoutConfig {
  id: string;
  mode: 'blind_sparring' | 'targeted_sparring';
  motion: string;
  side: Side;
  forced: boolean;
  rounds: number;
  persona: Persona;
  plan: string[];
  wordCap: number;
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function planTactics(persona: Persona, rounds: number, targeted: string[]): string[] {
  const source = targeted.length ? targeted : shuffle(persona.favoured);
  return Array.from({ length: rounds }, (_, i) => source[i % source.length]);
}

/** Scores for a tactic the opponent used: naming and neutralising it are both rewarded. */
const tacticScore = (named: boolean, neutralised: boolean) => (named && neutralised ? 1 : neutralised ? 0.65 : named ? 0.5 : 0);

export function Salle() {
  const [config, setConfig] = useState<BoutConfig | null>(null);
  if (!apiKey.value) {
    return (
      <div>
        <div class="eyebrow">The centrepiece</div>
        <h1>The Fencing Salle</h1>
        <div class="notice">The Salle needs an OpenRouter key, because your opponent and the arbiter are language models. <a href="#/settings">Add your key in Settings</a>. It stays in this browser.</div>
      </div>
    );
  }
  return config ? <Bout config={config} onExit={() => setConfig(null)} /> : <Setup onStart={setConfig} />;
}

// ── Pre-bout configuration ────────────────────────────────

function Setup({ onStart }: { onStart: (c: BoutConfig) => void }) {
  const [mode, setMode] = useState<BoutConfig['mode']>('blind_sparring');
  const [motion, setMotion] = useState(() => pick(MOTIONS).text);
  const [custom, setCustom] = useState('');
  const [side, setSide] = useState<Side | 'forced'>('forced');
  const [rounds, setRounds] = useState(3);
  const [personaId, setPersonaId] = useState<string>('random');
  const [targets, setTargets] = useState<string[]>([]);
  const wordCap = settings.value.word_cap;

  const weakest = () => {
    const prio = new Map(nodePriorities(telemetry.value).map((p) => [p.node, p.priority]));
    const ranked = [...TACTICS].sort((a, b) => (prio.get(b.node) ?? 0) - (prio.get(a.node) ?? 0));
    setTargets(ranked.slice(0, 2).map((t) => t.id));
  };
  const toggle = (id: string) => setTargets(targets.includes(id) ? targets.filter((x) => x !== id) : targets.length >= 3 ? targets : [...targets, id]);

  const start = () => {
    const persona = personaId === 'random' ? pick(PERSONAS) : PERSONAS.find((p) => p.id === personaId)!;
    const finalSide: Side = side === 'forced' ? pick(['pro', 'con'] as Side[]) : side;
    const targeted = mode === 'targeted_sparring' ? targets : [];
    onStart({
      id: `bout_${Date.now().toString(36)}`,
      mode, motion: custom.trim() || motion, side: finalSide, forced: side === 'forced',
      rounds, persona, plan: planTactics(persona, rounds, targeted), wordCap,
    });
  };

  return (
    <div>
      <div class="eyebrow">The centrepiece</div>
      <h1>The Fencing Salle</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>
        A formal bout, not a chat. Your opponent carries a secret tactical loadout, one tactic per round. A separate Corner Arbiter
        scores you on five axes when the bout ends.
      </p>
      <section class="panel">
        <h3>Sparring mode</h3>
        <div class="seg" role="group" aria-label="Sparring mode">
          <button aria-pressed={mode === 'blind_sparring'} onClick={() => setMode('blind_sparring')}>Blind</button>
          <button aria-pressed={mode === 'targeted_sparring'} onClick={() => setMode('targeted_sparring')}>Targeted</button>
        </div>
        <p class="muted" style={{ fontSize: '0.92rem', marginTop: '8px' }}>
          {mode === 'blind_sparring'
            ? 'The opponent’s tactics stay hidden until the debrief. Name them during the bout (use the tactic flags) to earn bonus rating.'
            : 'Choose up to three tactics to be tested on, or let your telemetry choose. The opponent will use them; you still have to spot them.'}
        </p>
        {mode === 'targeted_sparring' && (
          <>
            <div class="btn-row" style={{ marginTop: 0, marginBottom: '8px' }}><button onClick={weakest}>Choose from my weakest skills</button></div>
            <div class="tags">
              {TACTICS.map((t) => (
                <button class="tag" aria-pressed={targets.includes(t.id)} onClick={() => toggle(t.id)}
                  style={targets.includes(t.id) ? { background: 'var(--brass-soft)', borderColor: 'var(--brass)' } : undefined}>
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
      <section class="panel">
        <h3>The draw</h3>
        <div class="field">
          <label for="motion">Motion</label>
          <div class="btn-row" style={{ marginTop: 0 }}>
            <select id="motion" value={motion} onChange={(e) => setMotion((e.target as HTMLSelectElement).value)} style={{ maxWidth: '100%' }}>
              {(['Philosophical', 'Policy', 'Workplace', 'Technical'] as const).map((cat) => (
                <optgroup label={cat}>{MOTIONS.filter((m) => m.category === cat).map((m) => <option value={m.text}>{m.text}</option>)}</optgroup>
              ))}
            </select>
            <button onClick={() => { setMotion(pick(MOTIONS).text); setCustom(''); }}>Random draw</button>
          </div>
        </div>
        <div class="field">
          <label for="custom">…or write your own motion</label>
          <input id="custom" type="text" value={custom} placeholder="This house believes…" onInput={(e) => setCustom((e.target as HTMLInputElement).value)} />
        </div>
        <div class="grid grid-3">
          <div>
            <label>Your side</label>
            <div class="seg" role="group" aria-label="Side">
              <button aria-pressed={side === 'pro'} onClick={() => setSide('pro')}>Pro</button>
              <button aria-pressed={side === 'con'} onClick={() => setSide('con')}>Con</button>
              <button aria-pressed={side === 'forced'} onClick={() => setSide('forced')}>Forced</button>
            </div>
          </div>
          <div>
            <label>Rounds</label>
            <div class="seg" role="group" aria-label="Rounds">
              {[3, 5].map((n) => <button aria-pressed={rounds === n} onClick={() => setRounds(n)}>{n}</button>)}
            </div>
          </div>
          <div>
            <label for="cap">Word ceiling per turn</label>
            <input id="cap" type="number" min={40} max={300} step={10} value={wordCap} style={{ maxWidth: '110px' }}
              onChange={(e) => updateSettings({ word_cap: Math.max(40, Math.min(300, Number((e.target as HTMLInputElement).value) || 120)) })} />
          </div>
        </div>
        <div class="field" style={{ marginTop: '14px' }}>
          <label for="persona">Opponent</label>
          <select id="persona" value={personaId} onChange={(e) => setPersonaId((e.target as HTMLSelectElement).value)}>
            <option value="random">Random opponent</option>
            {PERSONAS.map((p) => <option value={p.id}>{p.name} ({p.difficulty})</option>)}
          </select>
          {personaId !== 'random' && <p class="muted" style={{ fontSize: '0.9rem', marginTop: '6px' }}>{PERSONAS.find((p) => p.id === personaId)?.description}</p>}
        </div>
        <div class="btn-row">
          <button class="btn-primary" onClick={start} disabled={mode === 'targeted_sparring' && targets.length === 0}>Enter the piste</button>
        </div>
        <p class="muted mono" style={{ fontSize: '0.72rem', marginTop: '10px' }}>Opponent: {settings.value.opponent_model} · Arbiter: {settings.value.judge_model}</p>
      </section>
    </div>
  );
}

// ── The bout ──────────────────────────────────────────────

function Bout({ config, onExit }: { config: BoutConfig; onExit: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [flags, setFlags] = useState<string[]>([]);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [card, setCard] = useState<Scorecard | null>(null);
  const [deltas, setDeltas] = useState<NodeDelta[]>([]);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const opponentSide: Side = config.side === 'pro' ? 'con' : 'pro';
  const userTurns = turns.filter((t) => t.speaker === 'user').length;
  const round = Math.min(config.rounds, userTurns + 1);
  const awaitingUser = turns.length > 0 && turns[turns.length - 1].speaker === 'opponent';
  const finished = userTurns >= config.rounds;
  const words = wordCount(draft);

  const history = (ts: Turn[]): ChatMessage[] => [
    { role: 'user', content: '(The chair invites the opponent to open the debate.)' },
    ...ts.map<ChatMessage>((t) => ({ role: t.speaker === 'opponent' ? 'assistant' : 'user', content: t.text })),
  ];

  const opponentMove = async (ts: Turn[], r: number) => {
    abort.current = new AbortController();
    setBusy('Your opponent is composing…'); setError('');
    try {
      const tactic = TACTIC_MAP[config.plan[r - 1]];
      const system = opponentSystem({
        personaName: config.persona.name, personaVoice: config.persona.voice, motion: config.motion, opponentSide,
        round: r, rounds: config.rounds, tacticInstruction: tactic.instruction, wordCap: config.wordCap,
      });
      const text = await opponentTurn({ apiKey: apiKey.value, model: settings.value.opponent_model, system, history: history(ts), signal: abort.current.signal });
      setTurns([...ts, { speaker: 'opponent', round: r, text: text.trim() }]);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    void opponentMove([], 1);
    return () => abort.current?.abort();
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [turns.length, busy]);

  const judge = async (ts: Turn[]) => {
    abort.current = new AbortController();
    setBusy('The Corner Arbiter is deliberating…'); setError('');
    try {
      const sc = await arbitrate({
        apiKey: apiKey.value, model: settings.value.judge_model, motion: config.motion, userSide: config.side, transcript: ts,
        tacticsUsed: config.plan.map((id, i) => ({ round: i + 1, id, label: TACTIC_MAP[id].label })), signal: abort.current.signal,
      });
      setCard(sc);
      finalise(ts, sc);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const finalise = (ts: Turn[], sc: Scorecard) => {
    const scores: SalleScores = {
      logos: axisFinal(sc.logos), ethos: axisFinal(sc.ethos), tense_control: axisFinal(sc.tense_control),
      syntax: axisFinal(sc.syntax), epistemics: axisFinal(sc.epistemics),
    };
    const all: NodeDelta[] = [];
    for (const [axis, nodes] of Object.entries(AXIS_NODES)) {
      all.push(...recordOutcome({
        kind: 'bout', item_id: `${config.id}:${axis}`, nodes, score: scores[axis as keyof SalleScores] / 100,
        difficulty: config.persona.difficulty, weight: 0.5, opponentRd: 120,
      }));
    }
    const flagged = new Set(ts.flatMap((t) => t.flagged ?? []));
    const used = [...new Set(config.plan)];
    const detected: string[] = [];
    for (const id of used) {
      const f = sc.tactics.find((x) => x.tactic_id === id);
      const named = flagged.has(id) || !!f?.named_by_user;
      if (named) detected.push(id);
      all.push(...recordOutcome({ kind: 'bout', item_id: `${config.id}:${id}`, nodes: [TACTIC_MAP[id].node], score: tacticScore(named, !!f?.neutralised), difficulty: config.persona.difficulty, weight: 0.5, opponentRd: 120 }));
    }
    setDeltas(all);
    addBout({
      bout_id: config.id, date: new Date().toISOString(), mode: config.mode, topic: config.motion, assigned_side: config.side,
      persona: config.persona.name, opponent_hidden_tactics: used, user_detected_tactics: detected, scores, verdict: sc.verdict,
    });
    storeTranscript({ bout_id: config.id, turns: ts, scorecard: sc });
  };

  const send = async () => {
    const next = [...turns, { speaker: 'user' as const, round, text: draft.trim(), flagged: flags.length ? flags : undefined }];
    setTurns(next);
    setDraft('');
    setFlags([]);
    if (next.filter((t) => t.speaker === 'user').length >= config.rounds) await judge(next);
    else await opponentMove(next, round + 1);
  };

  const retry = () => (finished ? judge(turns) : opponentMove(turns, turns.filter((t) => t.speaker === 'opponent').length + 1));

  return (
    <div>
      <div class="drill-head">
        <div>
          <div class="eyebrow">{config.mode === 'blind_sparring' ? 'Blind sparring' : 'Targeted sparring'} · Round {round} of {config.rounds}</div>
          <h2 style={{ margin: '4px 0' }}>“{config.motion}”</h2>
          <div class="muted" style={{ fontSize: '0.95rem' }}>
            You argue <strong>{config.side === 'pro' ? 'FOR' : 'AGAINST'}</strong>{config.forced ? ' (forced assignment)' : ''} · vs {config.persona.name}
          </div>
        </div>
        <button class="btn-quiet" onClick={() => { abort.current?.abort(); onExit(); }}>{card ? 'New bout' : 'Withdraw'}</button>
      </div>

      <div class="transcript" aria-live="polite">
        {turns.map((t) => (
          <div class={`turn ${t.speaker}`}>
            <div class="who">{t.speaker === 'opponent' ? config.persona.name : 'You'} · round {t.round}
              {card && t.speaker === 'opponent' && <span> · tactic: {TACTIC_MAP[config.plan[t.round - 1]]?.label}</span>}
              {t.flagged && <span> · flagged: {t.flagged.map((f) => TACTIC_MAP[f]?.label).join(', ')}</span>}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{t.text}</div>
          </div>
        ))}
      </div>
      <div ref={endRef} />
      {busy && <Busy label={busy} />}
      {error && (
        <div class="notice bad">{error} <button style={{ marginLeft: '8px' }} onClick={retry}>Retry</button></div>
      )}

      {awaitingUser && !finished && !busy && (
        <section class="panel" style={{ marginTop: '16px' }}>
          <div class="drill-head">
            <label for="reply">Your reply, round {round}</label>
            <span class={`mono ${words > config.wordCap ? 'down' : 'muted'}`}>{words} / {config.wordCap} words</span>
          </div>
          <textarea id="reply" value={draft} style={{ minHeight: '130px' }} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} />
          <details style={{ marginTop: '10px' }}>
            <summary class="mono" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
              Flag a tactic you spotted in that last turn{flags.length ? ` (${flags.length})` : ''}
            </summary>
            <div class="tags" style={{ marginTop: '8px' }}>
              {TACTICS.map((t) => (
                <button class="tag" aria-pressed={flags.includes(t.id)} onClick={() => setFlags(flags.includes(t.id) ? flags.filter((f) => f !== t.id) : [...flags, t.id])}
                  style={flags.includes(t.id) ? { background: 'var(--brass-soft)', borderColor: 'var(--brass)' } : undefined}>
                  {t.label}
                </button>
              ))}
            </div>
            <p class="muted" style={{ fontSize: '0.82rem' }}>Flags are private to the arbiter. Naming a tactic out loud in your reply also counts.</p>
          </details>
          <div class="btn-row">
            <button class="btn-primary" disabled={!draft.trim() || words > config.wordCap} onClick={send}>
              {userTurns + 1 >= config.rounds ? 'Deliver closing & call the arbiter' : 'Deliver'}
            </button>
          </div>
        </section>
      )}

      {card && <ScorecardView card={card} config={config} deltas={deltas} />}
    </div>
  );
}

function ScorecardView({ card, config, deltas }: { card: Scorecard; config: BoutConfig; deltas: NodeDelta[] }) {
  const axes = Object.entries(AXIS_CRITERIA) as [keyof typeof AXIS_CRITERIA, (typeof AXIS_CRITERIA)[keyof typeof AXIS_CRITERIA]][];
  const verdict = card.verdict === 'user' ? 'You carried the bout' : card.verdict === 'opponent' ? 'Your opponent carried the bout' : 'A draw';
  return (
    <section class="panel" style={{ marginTop: '18px' }}>
      <div class="eyebrow">The Salle Scorecard</div>
      <h2>{verdict}</h2>
      <p class="muted">{card.verdict_reason}</p>
      {axes.map(([key, def]) => {
        const a = card[key];
        const score = axisFinal(a);
        return (
          <div style={{ marginBottom: '12px' }}>
            <div class="axis">
              <span>{def.title}</span>
              <div class="bar"><i style={{ width: `${score}%` }} /></div>
              <span class="mono" style={{ textAlign: 'right' }}>{score}</span>
            </div>
            <ul class="checks">{def.checks.map((c, i) => <li class={a.checks[i] ? 'met' : ''}>{c}</li>)}</ul>
            {a.evidence && <div class="feedback" style={{ marginTop: '-6px' }}><em>{a.evidence}</em></div>}
          </div>
        );
      })}
      <p class="muted mono" style={{ fontSize: '0.72rem' }}>Each axis blends the arbiter’s 0–100 score with its own checklist (half each), to damp noisy grading.</p>
      <hr class="hr" />
      <h3>The hidden loadout</h3>
      {config.plan.map((id, i) => {
        const f = card.tactics.find((x) => x.tactic_id === id);
        return (
          <div style={{ marginBottom: '8px' }}>
            <strong>Round {i + 1}: {TACTIC_MAP[id].label}</strong> <span class="tag"><Term node={TACTIC_MAP[id].node} /></span>
            <div class="mono" style={{ fontSize: '0.78rem' }}>
              <span class={f?.named_by_user ? 'up' : 'down'}>{f?.named_by_user ? '✓ named' : '✗ not named'}</span> ·{' '}
              <span class={f?.neutralised ? 'up' : 'down'}>{f?.neutralised ? '✓ neutralised' : '✗ not neutralised'}</span>
            </div>
            {f?.note && <div class="feedback">{f.note}</div>}
          </div>
        );
      })}
      <hr class="hr" />
      <p><strong>Key moment:</strong> {card.key_moment}</p>
      <p><strong>Top improvement:</strong> {card.top_improvement}</p>
      <p class="mono" style={{ fontSize: '0.8rem' }}>Weak hedges counted: {card.hedge_count}</p>
      <Deltas deltas={deltas} />
    </section>
  );
}
