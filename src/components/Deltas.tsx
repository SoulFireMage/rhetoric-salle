import type { NodeDelta } from '../lib/telemetry';
import { termText } from './Term';

export function Deltas({ deltas }: { deltas: NodeDelta[] }) {
  if (!deltas.length) return null;
  return (
    <div class="deltas" aria-label="Rating changes">
      {deltas.map((d) => {
        const diff = Math.round(d.after - d.before);
        return (
          <span>
            {termText(d.node)}: {Math.round(d.after)}{' '}
            <span class={diff >= 0 ? 'up' : 'down'}>({diff >= 0 ? '+' : ''}{diff})</span>
          </span>
        );
      })}
    </div>
  );
}
