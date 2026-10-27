import { NODE_MAP } from '../data/taxonomy';
import { settings } from '../state/store';

/** A name in the user's chosen register: classical, modern, or both side by side. */
export function Dual({ classical, modern }: { classical: string; modern: string }) {
  const reg = settings.value.register;
  if (reg === 'classical') return <span class="term">{classical}</span>;
  if (reg === 'modern') return <span class="term">{modern}</span>;
  if (classical === modern) return <span class="term">{classical}</span>;
  return (
    <span class="term">
      {classical} <span class="alt">· {modern}</span>
    </span>
  );
}

export function Term({ node }: { node: string }) {
  const n = NODE_MAP[node];
  if (!n) return <span>{node}</span>;
  return <Dual classical={n.classical} modern={n.modern} />;
}

export function termText(node: string): string {
  const n = NODE_MAP[node];
  if (!n) return node;
  const reg = settings.value.register;
  return reg === 'classical' ? n.classical : reg === 'modern' ? n.modern : `${n.classical} · ${n.modern}`;
}

export function RegisterToggle() {
  const reg = settings.value.register;
  const set = (register: typeof reg) => (settings.value = { ...settings.value, register });
  return (
    <div class="seg" role="group" aria-label="Terminology register">
      {(['classical', 'dual', 'modern'] as const).map((r) => (
        <button aria-pressed={reg === r} onClick={() => set(r)} title={`Show ${r === 'dual' ? 'both registers' : r + ' names'}`}>
          {r === 'classical' ? 'Formal' : r === 'modern' ? 'Modern' : 'Both'}
        </button>
      ))}
    </div>
  );
}

/** Explanation text in the chosen register. */
export function Explanation({ formal, modern }: { formal: string; modern: string }) {
  const reg = settings.value.register;
  return (
    <div>
      {reg !== 'modern' && <p>{reg === 'dual' && <span class="eyebrow">Formal · </span>}{formal}</p>}
      {reg !== 'classical' && <p>{reg === 'dual' && <span class="eyebrow">Modern · </span>}{modern}</p>}
    </div>
  );
}
