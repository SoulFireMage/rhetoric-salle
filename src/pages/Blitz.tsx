import { useMemo, useRef, useState } from 'preact/hooks';
import { DrillPlayer } from '../components/DrillPlayer';
import { shuffle } from '../lib/scheduler';
import { allDrills, recordOutcome, telemetry } from '../state/store';

const MAX_DRILLS = 12;
const MAX_MISSES = 3;

export function Blitz() {
  const pool = useMemo(() => shuffle(allDrills.value.filter((d) => d.drill_type === 'surgical_dissection')), []);
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [points, setPoints] = useState(0);
  const [misses, setMisses] = useState(0);
  const [ttds, setTtds] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [last, setLast] = useState<{ ok: boolean; pts: number } | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const history = telemetry.value.attempt_log.filter((a) => a.kind === 'blitz' && a.ttd_ms != null && a.score > 0);
  const histAvg = history.length ? history.reduce((s, a) => s + a.ttd_ms!, 0) / history.length / 1000 : null;

  const over = running && (i >= Math.min(MAX_DRILLS, pool.length) || misses >= MAX_MISSES);
  const multiplier = 1 + Math.min(8, streak) * 0.25;

  const start = () => {
    setRunning(true); setI(0); setStreak(0); setBest(0); setPoints(0); setMisses(0); setTtds([]); setAnswered(false); setLast(null);
  };

  if (!running || over) {
    const avg = ttds.length ? ttds.reduce((a, b) => a + b, 0) / ttds.length / 1000 : null;
    return (
      <div class="panel">
        <div class="eyebrow">Blitz Counter</div>
        <h1>{over ? 'Blitz over' : 'Blitz'}</h1>
        {!over && (
          <p>
            Rapid-fire Surgical Dissections, no follow-ups. Each consecutive hit raises your precision multiplier, and faster
            detection earns more. The run ends after {MAX_DRILLS} drills or {MAX_MISSES} misses.
          </p>
        )}
        {over && (
          <div class="stats" style={{ margin: '12px 0 18px' }}>
            <div class="stat"><div class="n">{points}</div><div class="l">Points</div></div>
            <div class="stat"><div class="n">{best}</div><div class="l">Best streak</div></div>
            <div class="stat"><div class="n">{avg != null ? `${avg.toFixed(1)}s` : '–'}</div><div class="l">Avg time-to-detection (hits)</div></div>
          </div>
        )}
        {histAvg != null && <p class="muted mono">Lifetime average time-to-detection on hits: {histAvg.toFixed(1)}s over {history.length} hits.</p>}
        <div class="btn-row"><button class="btn-primary" onClick={start} disabled={!pool.length}>{over ? 'Go again' : 'Start'}</button></div>
      </div>
    );
  }

  const drill = pool[i];
  return (
    <div>
      <div class="stats" style={{ marginBottom: '12px' }}>
        <div class="stat"><div class="n">{points}</div><div class="l">Points</div></div>
        <div class="stat"><div class="n">×{multiplier.toFixed(2)}</div><div class="l">Multiplier</div></div>
        <div class="stat"><div class="n">{streak}</div><div class="l">Streak</div></div>
        <div class="stat"><div class="n">{MAX_MISSES - misses}</div><div class="l">Lives</div></div>
        <div class="stat"><div class="n">{i + 1}/{Math.min(MAX_DRILLS, pool.length)}</div><div class="l">Drill</div></div>
      </div>
      <div class="panel">
        <DrillPlayer
          key={drill.id}
          drill={drill}
          blitz
          onComplete={(r) => {
            const ok = r.score >= 1;
            const t = r.ttd_ms ?? 10_000;
            const speed = Math.max(0.3, Math.min(1.5, 8000 / Math.max(1500, t)));
            const pts = ok ? Math.round(100 * multiplier * speed) : 0;
            recordOutcome({ kind: 'blitz', item_id: drill.id, nodes: drill.taxonomy_nodes, difficulty: drill.difficulty_elo, score: ok ? 1 : 0, ttd_ms: t, weight: 0.8 });
            setPoints(points + pts);
            if (ok) {
              setTtds([...ttds, t]);
              setStreak(streak + 1);
              setBest(Math.max(best, streak + 1));
            } else {
              setStreak(0);
              setMisses(misses + 1);
            }
            setLast({ ok, pts });
            setAnswered(true);
            clearTimeout(advanceTimer.current);
            advanceTimer.current = setTimeout(() => { setAnswered(false); setI((x) => x + 1); }, ok ? 1100 : 2600);
          }}
        />
        {answered && last && <p class={`mono ${last.ok ? 'up' : 'down'}`}>{last.ok ? `+${last.pts}` : 'Miss'}</p>}
      </div>
    </div>
  );
}
