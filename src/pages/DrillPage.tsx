import { useState } from 'preact/hooks';
import { DrillPlayer } from '../components/DrillPlayer';
import { Deltas } from '../components/Deltas';
import { pickNext } from '../lib/scheduler';
import type { NodeDelta } from '../lib/telemetry';
import { navigate } from '../state/router';
import { allDrills, drillById, recordOutcome, telemetry } from '../state/store';

export function DrillPage({ id }: { id: string }) {
  const drill = drillById(id);
  const [deltas, setDeltas] = useState<NodeDelta[] | null>(null);
  const [lastId, setLastId] = useState(id);
  if (lastId !== id) {
    setLastId(id);
    setDeltas(null);
  }
  if (!drill) return <div class="panel"><p>Drill not found. <a href="#/train">Back to drills</a></p></div>;
  const next = () => {
    const d = pickNext(allDrills.value, telemetry.value, new Set([drill.id]));
    if (d) navigate(`/drill/${d.id}`);
  };
  return (
    <div class="panel">
      <DrillPlayer
        drill={drill}
        onComplete={(r) =>
          setDeltas(recordOutcome({ kind: 'drill', item_id: drill.id, nodes: drill.taxonomy_nodes, difficulty: drill.difficulty_elo, score: r.score, ttd_ms: r.ttd_ms }))
        }
      />
      {deltas && (
        <>
          <Deltas deltas={deltas} />
          <div class="btn-row">
            <button class="btn-primary" onClick={next}>Next drill</button>
            <a class="btn" href="#/train">All drills</a>
          </div>
        </>
      )}
    </div>
  );
}
