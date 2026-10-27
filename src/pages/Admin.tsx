import { useState } from 'preact/hooks';
import { ADMIN_USER_IDS } from '../config';
import { nodesByWing, WINGS } from '../data/taxonomy';
import { DrillPlayer } from '../components/DrillPlayer';
import { Busy } from '../components/ForgeBits';
import { Dual, termText } from '../components/Term';
import { errorMessage, publishDrill, unpublishDrill } from '../lib/cloud';
import { generateDrills } from '../lib/generator';
import type { DrillItem, DrillType, WingId } from '../lib/types';
import { validateDrill } from '../lib/validate';
import { apiKey, cloudDrills, isAdmin, profile, refreshCloudDrills, settings } from '../state/store';

interface Candidate {
  key: string;
  drill: DrillItem;
  json: string;
  errors: string[];
  record_id?: string;
  status?: string;
  previewRun: number;
}

const DOMAINS = ['Classical Civic', 'Modern Policy', 'Software/Engineering', 'Workplace', 'Everyday Dispute', 'Science & Medicine', 'Business'];

const toCandidate = (drill: DrillItem, record_id?: string): Candidate => {
  const { source: _s, ...clean } = drill;
  return { key: `${drill.id}_${Math.random().toString(36).slice(2, 6)}`, drill, json: JSON.stringify(clean, null, 2), errors: validateDrill(drill), record_id, previewRun: 0 };
};

export function Admin() {
  const [wing, setWing] = useState<WingId>('structure');
  const [nodes, setNodes] = useState<string[]>([]);
  const [drillType, setDrillType] = useState<DrillType>('surgical_dissection');
  const [difficulty, setDifficulty] = useState(1300);
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cands, setCands] = useState<Candidate[]>([]);

  if (!isAdmin.value) {
    return (
      <div class="panel">
        <h1>Admin Studio</h1>
        <p>This area needs an admin account: a Skapi access group of 90 or more, or a user ID listed in <code>ADMIN_USER_IDS</code>.</p>
        <p class="muted">Admin checks in the browser only hide the screen. What can be written to the global bank is enforced by Skapi, and other visitors only load drills from trusted admin IDs.</p>
      </div>
    );
  }

  const update = (key: string, patch: Partial<Candidate>) => setCands((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const generate = async () => {
    setBusy(true); setError('');
    try {
      const out = await generateDrills({ apiKey: apiKey.value, model: settings.value.judge_model, nodes, drillType, difficulty, domain, count });
      setCands((cs) => [...out.map((o) => toCandidate(o.drill)), ...cs]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const editJson = (c: Candidate, text: string) => {
    try {
      const drill = JSON.parse(text) as DrillItem;
      update(c.key, { json: text, drill, errors: validateDrill(drill), status: undefined, previewRun: c.previewRun + 1 });
    } catch (e) {
      update(c.key, { json: text, errors: [`JSON: ${(e as Error).message}`] });
    }
  };

  const commit = async (c: Candidate) => {
    update(c.key, { status: 'Publishing…' });
    try {
      const record_id = await publishDrill(c.drill, c.record_id);
      update(c.key, { record_id, status: '✓ Committed to the global bank' });
      await refreshCloudDrills();
    } catch (e) {
      update(c.key, { status: `Failed: ${errorMessage(e)}` });
    }
  };

  const unpublish = async (record_id: string) => {
    if (!confirm('Remove this drill from the global bank?')) return;
    try {
      await unpublishDrill(record_id);
      await refreshCloudDrills();
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const exportCandidates = () => {
    const blob = new Blob([JSON.stringify(cands.map((c) => JSON.parse(c.json)), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'drill-candidates.json';
    a.click();
  };

  const trusted = profile.value && ADMIN_USER_IDS.includes(profile.value.user_id);

  return (
    <div>
      <div class="eyebrow">Admin</div>
      <h1>Drill Generator &amp; Curation Studio</h1>
      {!trusted && (
        <div class="notice">
          Your user ID (<code>{profile.value?.user_id}</code>) isn’t in <code>ADMIN_USER_IDS</code> in <code>src/config.ts</code> yet. You’ll see your
          published drills, but other visitors won’t until it’s added.
        </div>
      )}
      {!apiKey.value && <div class="notice bad">Generation needs an OpenRouter key (<a href="#/settings">Settings</a>). You can still edit and publish by hand.</div>}

      <section class="panel">
        <h2>1. Parameters</h2>
        <div class="grid grid-2">
          <div class="field">
            <label for="wing">Target wing</label>
            <select id="wing" value={wing} onChange={(e) => { setWing((e.target as HTMLSelectElement).value as WingId); setNodes([]); }}>
              {WINGS.map((w) => <option value={w.id}>Wing {w.numeral}: {w.title}</option>)}
            </select>
          </div>
          <div class="field">
            <label for="dtype">Drill type</label>
            <select id="dtype" value={drillType} onChange={(e) => setDrillType((e.target as HTMLSelectElement).value as DrillType)}>
              <option value="surgical_dissection">Surgical Dissection</option>
              <option value="diagnostic_tree">Diagnostic Tree</option>
              <option value="syntactic_assembly">Clause Assembly (Potato Head seed)</option>
            </select>
          </div>
        </div>
        <label>Sub-nodes (primary first; you can add nodes from other wings by switching wing)</label>
        <div class="tags" style={{ marginBottom: '12px' }}>
          {nodesByWing(wing).map((n) => (
            <button class="tag" aria-pressed={nodes.includes(n.id)} onClick={() => setNodes(nodes.includes(n.id) ? nodes.filter((x) => x !== n.id) : [...nodes, n.id])}
              style={nodes.includes(n.id) ? { background: 'var(--brass-soft)', borderColor: 'var(--brass)' } : undefined}>
              {termText(n.id)}
            </button>
          ))}
        </div>
        {nodes.length > 0 && <p class="mono" style={{ fontSize: '0.78rem' }}>Selected: {nodes.join(', ')}</p>}
        <div class="grid grid-3">
          <div class="field">
            <label for="diff">Difficulty: {difficulty}</label>
            <input id="diff" type="range" min={1000} max={1800} step={50} value={difficulty} onInput={(e) => setDifficulty(Number((e.target as HTMLInputElement).value))} style={{ width: '100%' }} />
          </div>
          <div class="field">
            <label for="domain">Domain flavour</label>
            <select id="domain" value={domain} onChange={(e) => setDomain((e.target as HTMLSelectElement).value)}>{DOMAINS.map((d) => <option>{d}</option>)}</select>
          </div>
          <div class="field">
            <label for="count">Batch size</label>
            <input id="count" type="number" min={1} max={6} value={count} onChange={(e) => setCount(Math.max(1, Math.min(6, Number((e.target as HTMLInputElement).value) || 1)))} style={{ maxWidth: '90px' }} />
          </div>
        </div>
        <div class="btn-row">
          <button class="btn-primary" disabled={!nodes.length || busy || !apiKey.value} onClick={generate}>Generate candidates</button>
          {cands.length > 0 && <button onClick={exportCandidates}>Export candidates as JSON</button>}
        </div>
        {busy && <Busy label={`Synthesising ${count} drill(s) with ${settings.value.judge_model}…`} />}
        {error && <div class="notice bad">{error}</div>}
      </section>

      {cands.map((c) => (
        <section class="panel">
          <div class="drill-head">
            <h3 style={{ margin: 0 }}>Candidate <code>{c.drill.id}</code>{c.record_id ? ' (published)' : ''}</h3>
            <div class="btn-row" style={{ marginTop: 0 }}>
              <button class="btn-primary" disabled={c.errors.length > 0} onClick={() => commit(c)}>{c.record_id ? 'Update in bank' : 'Commit to Global Bank'}</button>
              <button onClick={() => setCands(cands.filter((x) => x.key !== c.key))}>Discard</button>
            </div>
          </div>
          {c.status && <p class="mono" style={{ fontSize: '0.8rem' }}>{c.status}</p>}
          {c.errors.length > 0 && <div class="notice bad"><strong>Fix before committing:</strong><ul style={{ margin: '4px 0 0' }}>{c.errors.map((e) => <li>{e}</li>)}</ul></div>}
          <div class="grid grid-2">
            <div>
              <div class="eyebrow">Live preview (results are not recorded)</div>
              {c.errors.length === 0 ? (
                <div class="panel" style={{ background: 'var(--bg)' }}>
                  <DrillPlayer key={`${c.key}_${c.previewRun}`} drill={c.drill} onComplete={() => undefined} />
                  <button class="btn-quiet" onClick={() => update(c.key, { previewRun: c.previewRun + 1 })}>↺ Replay</button>
                </div>
              ) : <p class="muted">Preview appears once the drill validates.</p>}
            </div>
            <div>
              <div class="eyebrow">JSON (edit inline)</div>
              <textarea value={c.json} spellcheck={false} onInput={(e) => editJson(c, (e.target as HTMLTextAreaElement).value)}
                style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', minHeight: '420px' }} aria-label={`JSON for ${c.drill.id}`} />
            </div>
          </div>
        </section>
      ))}

      <section class="panel">
        <h2>Global bank ({cloudDrills.value.length})</h2>
        <div class="btn-row" style={{ marginTop: 0 }}><button onClick={() => refreshCloudDrills()}>Refresh</button></div>
        {cloudDrills.value.length === 0 && <p class="muted">No published drills yet.</p>}
        {cloudDrills.value.map((cd) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--rule)' }}>
            <span><code>{cd.drill.id}</code> · <Dual classical={cd.drill.register_tags?.classical ?? ''} modern={cd.drill.register_tags?.modern ?? ''} /></span>
            <span class="btn-row" style={{ marginTop: 0 }}>
              <a class="btn" href={`#/drill/${cd.drill.id}`}>Play</a>
              <button onClick={() => setCands([toCandidate(cd.drill, cd.record_id), ...cands])}>Edit</button>
              <button onClick={() => unpublish(cd.record_id)} style={{ color: 'var(--bad)' }}>Unpublish</button>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
