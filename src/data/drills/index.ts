import type { DrillItem } from '../../lib/types';
import wing1 from './wing1_structure.json';
import wing2 from './wing2_fallacies.json';
import wing3 from './wing3_ethos.json';
import wing4 from './wing4_syntax.json';

export const SEED_DRILLS: DrillItem[] = ([...wing1, ...wing2, ...wing3, ...wing4] as DrillItem[]).map((d) => ({ ...d, source: 'seed' }));
