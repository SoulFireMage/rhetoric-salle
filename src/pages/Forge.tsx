import { apiKey, settings, telemetry } from '../state/store';

export function Forge() {
  const saved = telemetry.value.saved_items;
  return (
    <div>
      <div class="eyebrow">Tier 2 · BYOK OpenRouter evaluation</div>
      <h1>The Generative Forge</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>
        Free-form writing judged against strict, checklist-based rubrics. The score is computed from the checklist rather than
        taken from the model as a free number, and Forge results move your ratings at half weight, because AI judges are noisier than
        right-or-wrong drills.
      </p>
      {!apiKey.value ? (
        <div class="notice">No OpenRouter key is set, so the Forge runs in <strong>self-check mode</strong>: you compare your work with a model answer and tick a checklist (quarter-weight ratings). <a href="#/settings">Add a key</a> for AI judging.</div>
      ) : (
        <div class="notice good">Judging with <code>{settings.value.judge_model}</code>. Change it in <a href="#/settings">Settings</a>.</div>
      )}
      <div class="grid grid-3">
        <a class="card" href="#/forge/potato" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div class="eyebrow">Syntactic workbench</div>
          <h3>Mr. Potato Head</h3>
          <p class="grow muted">One flat proposition, three figure cards. Dress the same claim three ways.</p>
        </a>
        <a class="card" href="#/forge/steelman" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div class="eyebrow">Argument reconstruction</div>
          <h3>Steelman &amp; Detox</h3>
          <p class="grow muted">Turn a distorted rant into a clean, warranted, deliberative case in under 75 words.</p>
        </a>
        <a class="card" href="#/forge/warrant" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div class="eyebrow">Targeted counter-strike</div>
          <h3>Warrant Sniping</h3>
          <p class="grow muted">Name the hidden warrant, then undercut it in two sentences with a tactical concession.</p>
        </a>
      </div>
      {saved.length > 0 && (
        <section class="panel" style={{ marginTop: '18px' }}>
          <h2>Saved pieces</h2>
          {[...saved].reverse().map((s) => (
            <details style={{ borderBottom: '1px solid var(--rule)', padding: '6px 0' }}>
              <summary>{s.title} <span class="muted mono" style={{ fontSize: '0.72rem' }}>{s.kind} · {new Date(s.date).toLocaleDateString()}</span></summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--serif)' }}>{s.content}</pre>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
