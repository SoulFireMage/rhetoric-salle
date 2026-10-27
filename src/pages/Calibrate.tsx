import { useState } from 'preact/hooks';
import { DrillPlayer } from '../components/DrillPlayer';
import { Deltas } from '../components/Deltas';
import { Term } from '../components/Term';
import { calibrationQueue, nodePriorities } from '../lib/scheduler';
import type { NodeDelta } from '../lib/telemetry';
import type { DrillItem } from '../lib/types';
import { allDrills, recordOutcome, telemetry } from '../state/store';

export function Calibrate() {
  const [queue, setQueue] = useState<DrillItem[]>(() => calibrationQueue(allDrills.value, telemetry.value));
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [deltas, setDeltas] = useState<NodeDelta[] | null>(null);
  const focus = nodePriorities(telemetry.value).slice(0, 4);

  if (i >= queue.length) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return (
      <div class="panel">
        <div class="eyebrow">Daily Calibration</div>
        <h1>Run complete</h1>
        <p>{queue.length} drills, average score {Math.round(avg * 100)}%. Overall rating now <strong>{telemetry.value.global_elo}</strong>.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#/dashboard">See telemetry</a>
          <button onClick={() => { setQueue(calibrationQueue(allDrills.value, telemetry.value)); setI(0); setScores([]); setDeltas(null); }}>Another run</button>
        </div>
      </div>
    );
  }

  const drill = queue[i];
  return (
    <div>
      <div class="drill-head">
        <div>
          <div class="eyebrow">Daily Calibration · drill {i + 1} of {queue.length}</div>
          <div class="tags" style={{ marginTop: '4px' }}>
            <span class="muted" style={{ fontSize: '0.9rem' }}>Targeting:</span>
            {focus.map((f) => <span class="tag"><Term node={f.node} /></span>)}
          </div>
        </div>
        <div class="bar" style={{ width: '160px' }} aria-label={`Progress ${i} of ${queue.length}`}><i style={{ width: `${(i / queue.length) * 100}%` }} /></div>
      </div>
      <div class="panel">
        <DrillPlayer
          drill={drill}
          onComplete={(r) => {
            setScores([...scores, r.score]);
            setDeltas(recordOutcome({ kind: 'drill', item_id: drill.id, nodes: drill.taxonomy_nodes, difficulty: drill.difficulty_elo, score: r.score, ttd_ms: r.ttd_ms }));
          }}
        />
        {deltas && (
          <>
            <Deltas deltas={deltas} />
            <div class="btn-row">
              <button class="btn-primary" onClick={() => { setDeltas(null); setI(i + 1); }}>{i + 1 < queue.length ? 'Next' : 'Finish'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
