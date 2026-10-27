// Single-series radar of the four wings. Values are ratings; the ring scale is fixed
// (800–1800) so the shape is comparable over time.

export interface RadarDatum {
  label: string;
  value: number;
  detail: string;
}

const MIN = 800;
const MAX = 1800;

export function Radar({ data, size = 300 }: { data: RadarDatum[]; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 58;
  const n = data.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number) => {
    const k = (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN);
    return [c + Math.cos(angle(i)) * r * k, c + Math.sin(angle(i)) * r * k];
  };
  const rings = [1000, 1200, 1400, 1600, 1800];
  const poly = data.map((d, i) => pt(i, d.value).join(',')).join(' ');
  return (
    <svg class="radar" viewBox={`-50 0 ${size + 100} ${size}`} width="100%" style={{ maxWidth: `${size + 100}px` }} role="img"
      aria-label={`Ratings by wing: ${data.map((d) => `${d.label} ${Math.round(d.value)}`).join(', ')}`}>
      {rings.map((v) => (
        <polygon class="grid-line" points={data.map((_, i) => pt(i, v).join(',')).join(' ')} />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, MAX);
        return <line class="grid-line" x1={c} y1={c} x2={x} y2={y} />;
      })}
      <text x={c + 4} y={c - ((1200 - MIN) / (MAX - MIN)) * r - 3} style={{ fontSize: '9px', fill: 'var(--ink-3)' }}>1200</text>
      <polygon class="area" points={poly} />
      {data.map((d, i) => {
        const [x, y] = pt(i, d.value);
        return (
          <g>
            <circle class="pt" cx={x} cy={y} r={5} />
            <circle cx={x} cy={y} r={14} fill="transparent">
              <title>{`${d.label}: ${Math.round(d.value)} (${d.detail})`}</title>
            </circle>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = c + Math.cos(angle(i)) * (r + 26);
        const y = c + Math.sin(angle(i)) * (r + 26);
        const anchor = Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end';
        return (
          <text x={x} y={y} text-anchor={anchor} dominant-baseline="middle">
            <tspan x={x} dy="-0.5em">{d.label}</tspan>
            <tspan x={x} dy="1.2em" style={{ fill: 'var(--ink)', fontWeight: 600 }}>{Math.round(d.value)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
