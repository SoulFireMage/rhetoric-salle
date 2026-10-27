// Admin Drill Generator: batch-synthesises candidate drills in the app's schema.

import { NODE_MAP } from '../data/taxonomy';
import { SEED_DRILLS } from '../data/drills';
import { chatJson } from './openrouter';
import type { DrillItem, DrillType } from './types';
import { validateDrill } from './validate';

export interface GenParams {
  apiKey: string;
  model: string;
  nodes: string[];
  drillType: DrillType;
  difficulty: number;
  domain: string;
  count: number;
}

const TYPE_RULES: Record<DrillType, string> = {
  surgical_dissection: `"surgical_dissection": 3–6 realistic sentences in passage_segments (each with id "s1", "s2"…, text, role, optional tense and note). Exactly one segment is the target, named by correct_target_id. Usually include a follow_up_question with 3–4 options (exactly one is_correct) whose distractors fail in instructive ways. Omit steps, blocks and solutions.`,
  diagnostic_tree: `"diagnostic_tree": a short flawed passage in passage_segments, plus "steps": 2–3 sequential questions, each {id, label, question, options}, with exactly one correct option per step. Typical chain: (1) identify the tense or stasis, (2) identify the fallacy or distortion, (3) choose the best one-sentence Deliberative counter-pivot from 4 subtle variants (distractors fail by attacking a straw man, sliding into past blame, or using weak ethos). Omit correct_target_id, blocks and solutions.`,
  syntactic_assembly: `"syntactic_assembly": "blocks" are 3–7 movable phrase fragments ({id: "b1"…, text}) with punctuation attached, optionally including 1–2 decoy blocks used in no solution. "solutions" lists EVERY acceptable ordering as arrays of block ids. Include "target_structure" (a short schematic such as "Subordinate build-up → Main clause last") and "time_limit_s" (30–90). Omit passage_segments, steps and correct_target_id.`,
};

export async function generateDrills(p: GenParams): Promise<{ drill: DrillItem; errors: string[] }[]> {
  const example = SEED_DRILLS.find((d) => d.drill_type === p.drillType)!;
  const { source: _s, ...exampleClean } = example;
  const nodeList = p.nodes.map((id) => `${id} = ${NODE_MAP[id].classical} / ${NODE_MAP[id].modern}: ${NODE_MAP[id].summary}`).join('\n');
  const res = await chatJson<{ drills: DrillItem[] }>({
    apiKey: p.apiKey,
    model: p.model,
    strict: false,
    temperature: 0.8,
    maxTokens: 8000,
    schemaName: 'drill_batch',
    schema: { type: 'object', properties: { drills: { type: 'array', items: { type: 'object' } } }, required: ['drills'] },
    system: `You are an expert teacher of classical rhetoric, informal logic and prose style, writing training drills for an app. Your drills are accurate (no contested or wrong labels), realistic, concise and pedagogically sharp. Distractors are plausible and each one fails for a reason worth learning. Use British spelling.`,
    user: `Write ${p.count} new drill(s) as {"drills": [...]}.

Drill type: ${TYPE_RULES[p.drillType]}

Target skill nodes (taxonomy_nodes must use these ids; put the primary one first):
${nodeList}

Difficulty: about ${p.difficulty} on an ELO-style scale (1000 = clear-cut beginner case, 1400 = subtle, 1800 = expert discrimination between near neighbours).
Domain flavour: ${p.domain}.

Every drill needs: id (lowercase, digits and underscores), tier "deterministic", drill_type, taxonomy_nodes, difficulty_elo, domain, register_tags {classical, modern}, prompt_instruction, explanation_formal (classical terminology) and explanation_modern (plain street register).

Here is one complete example of this type, for format only (do not copy its content):
${JSON.stringify(exampleClean, null, 2)}`,
    check: (x: any) => (Array.isArray(x?.drills) && x.drills.length ? null : 'expected a non-empty "drills" array'),
  });
  const stamp = Date.now().toString(36);
  return res.drills.map((raw, i) => {
    const drill: DrillItem = {
      ...raw,
      tier: 'deterministic',
      drill_type: p.drillType,
      difficulty_elo: Number(raw.difficulty_elo) || p.difficulty,
      id: `gen_${stamp}_${i + 1}`,
    };
    return { drill, errors: validateDrill(drill) };
  });
}
