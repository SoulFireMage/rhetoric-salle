import { Radar } from '../components/Radar';
import { Term } from '../components/Term';
import { groupsOfWing, nodesByWing, NODE_MAP, WINGS } from '../data/taxonomy';
import { currentRetrievability } from '../lib/memory';
import { DEFAULT_RATING } from '../lib/rating';
import { nodePriorities } from '../lib/scheduler';
import { mastery } from '../lib/telemetry';
import { telemetry } from '../state/store';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function Readiness({ r, practised }: { r: number; practised: boolean }) {
  if (!practised) return <span class="muted mono" style={{ fontSize: '0.75rem' }}>untested</span>;
  const cls = r >= 0.85 ? '' : r >= 0.7 ? 'mid' : 'low';
  return (
    <div class={`bar decay ${cls}`} title={`Readiness ${Math.round(r * 100)}%`} aria-label={`Readiness ${Math.round(r * 100)}%`}>
      <i style={{ width: `${Math.round(r * 100)}%` }} />
    </div>
  );
}

export function Dashboard() {
  const t = telemetry.value;
  const radar = WINGS.map((w) => {
    const ms = nodesByWing(w.id).map((n) => mastery(t, n.id));
    const practised = ms.filter((m) => m.attempts > 0);
    const value = practised.length ? practised.reduce((s, m) => s + m.elo, 0) / practised.length : DEFAULT_RATING;
    return { label: `Wing ${w.numeral}`, value, detail: `${w.title}; ${practised.length}/${ms.length} nodes tested` };
  });
  const rusting = nodePriorities(t).filter((p) => mastery(t, p.node).attempts > 0).slice(0, 5);
  const recent = [...t.attempt_log].reverse().slice(0, 12);
  const ttd = t.attempt_log.filter((a) => a.ttd_ms != null && a.score >= 1);
  const avgTtd = ttd.length ? ttd.reduce((s, a) => s + a.ttd_ms!, 0) / ttd.length / 1000 : null;

  return (
    <div>
      <div class="drill-head">
        <div>
          <div class="eyebrow">Telemetry</div>
          <h1>Skill ratings &amp; readiness</h1>
        </div>
        <a class="btn btn-primary" href="#/calibrate">Daily Calibration Run</a>
      </div>

      <div class="grid grid-2">
        <section class="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Radar data={radar} />
          <small>Average rating of tested nodes per wing (scale 800–1800).</small>
        </section>
        <section class="panel">
          <div class="stats">
            <div class="stat"><div class="n">{t.global_elo}</div><div class="l">Overall</div></div>
            <div class="stat"><div class="n">{t.attempt_log.length}</div><div class="l">Attempts</div></div>
            <div class="stat"><div class="n">{avgTtd != null ? `${avgTtd.toFixed(1)}s` : '–'}</div><div class="l">Avg time-to-detect</div></div>
          </div>
          <hr class="hr" />
          <h3>Rusting first</h3>
          {rusting.length === 0 && <p class="muted">Nothing tested yet. Start with a calibration run.</p>}
          {rusting.map((p) => (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.95rem' }}><Term node={p.node} /></span>
              <Readiness r={p.retrievability} practised />
            </div>
          ))}
          <p class="muted" style={{ fontSize: '0.82rem', marginTop: '10px' }}>
            Readiness is an FSRS-style forgetting curve per skill: a heuristic for what to revisit, not a precise memory model.
          </p>
        </section>
      </div>

      {WINGS.map((w) => (
        <section class="panel">
          <div class="eyebrow">Wing {w.numeral}</div>
          <h2>{w.title}</h2>
          <div class="table-wrap">
            <table class="node-table">
              <thead>
                <tr><th>Skill</th><th style={{ textAlign: 'right' }}>Rating</th><th style={{ textAlign: 'right' }}>±</th><th style={{ textAlign: 'right' }}>Tries</th><th>Readiness</th><th>Last</th></tr>
              </thead>
              <tbody>
                {groupsOfWing(w.id).flatMap((g) => [
                  <tr><td colSpan={6} class="muted" style={{ fontStyle: 'italic', fontSize: '0.85rem', paddingTop: '12px' }}>{g.group}</td></tr>,
                  ...g.nodes.map((n) => {
                    const m = mastery(t, n.id);
                    const r = currentRetrievability(m.stability_days, m.last_practiced);
                    return (
                      <tr>
                        <td><Term node={n.id} /></td>
                        <td class="num">{m.attempts ? Math.round(m.elo) : '–'}</td>
                        <td class="num muted">{m.attempts ? Math.round(m.rd) : ''}</td>
                        <td class="num">{m.attempts}</td>
                        <td style={{ minWidth: '90px' }}><Readiness r={r} practised={m.attempts > 0} /></td>
                        <td class="num muted">{m.last_practiced ? fmtDate(m.last_practiced) : ''}</td>
                      </tr>
                    );
                  }),
                ])}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div class="grid grid-2">
        <section class="panel">
          <h3>Recent attempts</h3>
          {recent.length === 0 && <p class="muted">None yet.</p>}
          {recent.map((a) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.92rem', borderBottom: '1px solid var(--rule)', padding: '4px 0' }}>
              <span>{a.kind} · {a.nodes[0] ? <Term node={a.nodes[0]} /> : a.item_id}</span>
              <span class="mono">{Math.round(a.score * 100)}%</span>
            </div>
          ))}
        </section>
        <section class="panel">
          <h3>Salle record</h3>
          {t.salle_history.length === 0 && <p class="muted">No bouts yet. <a href="#/salle">Enter the Salle</a>.</p>}
          {[...t.salle_history].reverse().slice(0, 8).map((b) => {
            const avg = Math.round(Object.values(b.scores).reduce((s, x) => s + x, 0) / 5);
            return (
              <div style={{ borderBottom: '1px solid var(--rule)', padding: '6px 0', fontSize: '0.92rem' }}>
                <div>{b.topic}</div>
                <div class="mono muted" style={{ fontSize: '0.75rem' }}>
                  {fmtDate(b.date)} · {b.assigned_side} · {b.persona} · avg {avg} · spotted {b.user_detected_tactics.length}/{b.opponent_hidden_tactics.length}
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <p class="muted" style={{ fontSize: '0.82rem' }}>
        Ratings use Glicko-2 on the familiar ELO scale (start 1200). Each drill is treated as an opponent at its difficulty
        rating; “±” is the rating deviation, i.e. how unsure the estimate still is. {Object.keys(NODE_MAP).length} skill nodes in total.
      </p>
    </div>
  );
}
