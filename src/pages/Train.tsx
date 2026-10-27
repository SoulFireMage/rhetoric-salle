import { useState } from 'preact/hooks';
import { NODE_MAP, WINGS } from '../data/taxonomy';
import { Dual, Term } from '../components/Term';
import { pickNext } from '../lib/scheduler';
import { allDrills, telemetry } from '../state/store';
import { navigate } from '../state/router';
import type { DrillType, WingId } from '../lib/types';

const TYPES: [DrillType | 'all', string][] = [
  ['all', 'All types'],
  ['surgical_dissection', 'Surgical Dissection'],
  ['diagnostic_tree', 'Diagnostic Tree'],
  ['syntactic_assembly', 'Clause Assembly'],
];

export function Train() {
  const [wing, setWing] = useState<WingId | 'all'>('all');
  const [type, setType] = useState<DrillType | 'all'>('all');
  const [q, setQ] = useState('');
  const done = new Map<string, number>();
  for (const a of telemetry.value.attempt_log) if (a.kind === 'drill' || a.kind === 'blitz') done.set(a.item_id, a.score);

  const drills = allDrills.value
    .filter((d) => wing === 'all' || NODE_MAP[d.taxonomy_nodes[0]]?.wing === wing)
    .filter((d) => type === 'all' || d.drill_type === type)
    .filter((d) => {
      if (!q.trim()) return true;
      const hay = [d.register_tags.classical, d.register_tags.modern, d.prompt_instruction, ...d.taxonomy_nodes.flatMap((n) => [NODE_MAP[n]?.classical, NODE_MAP[n]?.modern])].join(' ').toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => a.difficulty_elo - b.difficulty_elo);

  const next = () => {
    const d = pickNext(allDrills.value, telemetry.value);
    if (d) navigate(`/drill/${d.id}`);
  };

  return (
    <div>
      <div class="drill-head">
        <div>
          <div class="eyebrow">Tier 1</div>
          <h1>Deterministic drills</h1>
        </div>
        <div class="btn-row" style={{ marginTop: 0 }}>
          <button class="btn-primary" onClick={next}>Recommended next</button>
          <a class="btn" href="#/calibrate">Daily Calibration</a>
          <a class="btn" href="#/blitz">Blitz</a>
        </div>
      </div>
      <div class="btn-row" style={{ marginBottom: '16px' }}>
        <select value={wing} onChange={(e) => setWing((e.target as HTMLSelectElement).value as WingId | 'all')} aria-label="Wing">
          <option value="all">All wings</option>
          {WINGS.map((w) => <option value={w.id}>Wing {w.numeral}: {w.title}</option>)}
        </select>
        <select value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value as DrillType | 'all')} aria-label="Drill type">
          {TYPES.map(([v, l]) => <option value={v}>{l}</option>)}
        </select>
        <input type="text" placeholder="Search…" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} style={{ maxWidth: '240px' }} aria-label="Search drills" />
        <span class="muted mono" style={{ alignSelf: 'center' }}>{drills.length} drills</span>
      </div>
      <div class="grid grid-3">
        {drills.map((d) => {
          const last = done.get(d.id);
          return (
            <a class="card" href={`#/drill/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div class="eyebrow">
                {TYPES.find((t) => t[0] === d.drill_type)?.[1]} · {d.difficulty_elo}
                {d.source === 'cloud' ? ' · bank' : ''}
              </div>
              <h3><Dual classical={d.register_tags.classical} modern={d.register_tags.modern} /></h3>
              <div class="grow" />
              <div class="tags">{d.taxonomy_nodes.slice(0, 3).map((n) => <span class="tag"><Term node={n} /></span>)}</div>
              {last != null && <small>Last score: {Math.round(last * 100)}%</small>}
            </a>
          );
        })}
      </div>
    </div>
  );
}
