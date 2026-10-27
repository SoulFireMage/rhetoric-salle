import { groupsOfWing, WINGS } from '../data/taxonomy';
import { allDrills } from '../state/store';

export function Codex() {
  const count = (id: string) => allDrills.value.filter((d) => d.taxonomy_nodes.includes(id)).length;
  return (
    <div>
      <div class="eyebrow">The Codex</div>
      <h1>The unified skill tree</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>
        Every node carries a formal (classical) name and a modern street name. Notes flag contested terms and modern coinages,
        so you know which labels are ancient and which are recent.
      </p>
      {WINGS.map((w) => (
        <section class="panel">
          <div class="eyebrow">Wing {w.numeral} · {w.focus}</div>
          <h2>{w.title}</h2>
          {groupsOfWing(w.id).map((g) => (
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ color: 'var(--brass)' }}>{g.group}</h3>
              {g.nodes.map((n) => (
                <div style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                  <div><strong>{n.classical}</strong> <span class="muted">· <em>{n.modern}</em></span> <span class="tag">{count(n.id)} drills</span></div>
                  <div style={{ fontSize: '0.95rem' }}>{n.summary}</div>
                  {n.note && <div class="muted" style={{ fontSize: '0.85rem' }}>Note: {n.note}</div>}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
