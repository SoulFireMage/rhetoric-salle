// Core data shapes. DrillItem follows spec §7.1, extended with `steps` (diagnostic
// trees) and `blocks`/`solutions` (syntactic assembly).

export type WingId = 'structure' | 'fallacies' | 'ethos' | 'syntax';
export type Register = 'dual' | 'classical' | 'modern';

export interface TaxonomyNode {
  id: string;
  wing: WingId;
  group: string;
  classical: string;
  modern: string;
  summary: string;
  /** Source or terminology caveats (contested names, modern coinages). */
  note?: string;
}

export interface Wing {
  id: WingId;
  numeral: string;
  title: string;
  focus: string;
}

export type DrillType = 'surgical_dissection' | 'diagnostic_tree' | 'syntactic_assembly';

export interface PassageSegment {
  id: string;
  text: string;
  /** Anatomical role shown in the feedback overlay, e.g. claim, data_fact, warrant_gap, fallacy_target. */
  role: string;
  tense?: string;
  note?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  is_correct: boolean;
  feedback: string;
}

export interface ChoiceQuestion {
  question: string;
  options: ChoiceOption[];
}

export interface TreeStep extends ChoiceQuestion {
  id: string;
  label: string;
}

export interface AssemblyBlock {
  id: string;
  text: string;
}

export interface DrillItem {
  id: string;
  tier: 'deterministic';
  drill_type: DrillType;
  taxonomy_nodes: string[];
  difficulty_elo: number;
  domain?: string;
  register_tags: { classical: string; modern: string };
  prompt_instruction: string;
  passage_segments?: PassageSegment[];
  correct_target_id?: string;
  follow_up_question?: ChoiceQuestion;
  steps?: TreeStep[];
  /** Assembly: movable blocks (may include decoys not used in any solution). */
  blocks?: AssemblyBlock[];
  /** Assembly: every accepted ordering, as block ids. */
  solutions?: string[][];
  target_structure?: string;
  time_limit_s?: number;
  explanation_formal: string;
  explanation_modern: string;
  /** Where the drill came from: bundled seed or the cloud bank. */
  source?: 'seed' | 'cloud';
}

export interface NodeMastery {
  /** Glicko-2 rating on the familiar ELO scale (default 1200). */
  elo: number;
  /** Glicko rating deviation: how unsure we are of `elo`. */
  rd: number;
  vol: number;
  attempts: number;
  last_practiced: string | null;
  /** FSRS-lite memory stability, in days. */
  stability_days: number;
}

export interface AttemptRecord {
  id: string;
  date: string;
  kind: 'drill' | 'forge' | 'bout' | 'blitz';
  item_id: string;
  nodes: string[];
  score: number;
  /** Time-to-detection for deterministic drills, in ms. */
  ttd_ms?: number;
}

export interface SalleScores {
  logos: number;
  ethos: number;
  tense_control: number;
  syntax: number;
  epistemics: number;
}

export interface BoutSummary {
  bout_id: string;
  date: string;
  mode: 'blind_sparring' | 'targeted_sparring';
  topic: string;
  assigned_side: 'pro' | 'con';
  persona: string;
  opponent_hidden_tactics: string[];
  user_detected_tactics: string[];
  scores: SalleScores;
  verdict?: string;
}

export interface SavedItem {
  id: string;
  date: string;
  kind: 'potato' | 'steelman' | 'warrant';
  title: string;
  content: string;
}

export interface UserTelemetry {
  user_id: string;
  preferred_register: Register;
  global_elo: number;
  node_mastery: Record<string, NodeMastery>;
  salle_history: BoutSummary[];
  attempt_log: AttemptRecord[];
  saved_items: SavedItem[];
  updated_at: string;
}

export interface Settings {
  theme: 'auto' | 'light' | 'dark';
  register: Register;
  judge_model: string;
  opponent_model: string;
  word_cap: number;
}
