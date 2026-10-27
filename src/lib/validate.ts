// Structural checks for drills: used by the test suite on the seed bank and by
// the Admin Studio before anything is committed to the global bank.

import { NODE_MAP } from '../data/taxonomy';
import type { ChoiceQuestion, DrillItem } from './types';

function checkQuestion(q: ChoiceQuestion | undefined, where: string, errs: string[]) {
  if (!q) return;
  if (!q.question?.trim()) errs.push(`${where}: missing question text`);
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errs.push(`${where}: needs at least 2 options`);
    return;
  }
  const correct = q.options.filter((o) => o.is_correct).length;
  if (correct !== 1) errs.push(`${where}: exactly one option must be correct (found ${correct})`);
  const ids = new Set<string>();
  for (const o of q.options) {
    if (!o.id || ids.has(o.id)) errs.push(`${where}: option ids must be present and unique`);
    ids.add(o.id);
    if (!o.text?.trim()) errs.push(`${where}: option ${o.id} has no text`);
    if (!o.feedback?.trim()) errs.push(`${where}: option ${o.id} has no feedback`);
  }
}

export function validateDrill(d: DrillItem): string[] {
  const errs: string[] = [];
  if (!d || typeof d !== 'object') return ['not an object'];
  if (!/^[a-z0-9_]+$/.test(d.id ?? '')) errs.push('id must be lowercase letters, digits and underscores');
  if (d.tier !== 'deterministic') errs.push('tier must be "deterministic"');
  if (!Array.isArray(d.taxonomy_nodes) || !d.taxonomy_nodes.length) errs.push('taxonomy_nodes must be a non-empty array');
  for (const id of d.taxonomy_nodes ?? []) if (!NODE_MAP[id]) errs.push(`unknown taxonomy node "${id}"`);
  if (!(d.difficulty_elo >= 800 && d.difficulty_elo <= 2000)) errs.push('difficulty_elo must be 800–2000');
  if (!d.register_tags?.classical || !d.register_tags?.modern) errs.push('register_tags needs classical and modern');
  if (!d.prompt_instruction?.trim()) errs.push('missing prompt_instruction');
  if (!d.explanation_formal?.trim() || !d.explanation_modern?.trim()) errs.push('needs both explanations');

  const segIds = new Set<string>();
  for (const s of d.passage_segments ?? []) {
    if (!s.id || segIds.has(s.id)) errs.push('segment ids must be present and unique');
    segIds.add(s.id);
    if (!s.text?.trim()) errs.push(`segment ${s.id} is empty`);
    if (!s.role) errs.push(`segment ${s.id} has no role`);
  }

  switch (d.drill_type) {
    case 'surgical_dissection':
      if ((d.passage_segments?.length ?? 0) < 3) errs.push('dissection needs at least 3 segments');
      if (!d.correct_target_id || !segIds.has(d.correct_target_id)) errs.push('correct_target_id must name a segment');
      checkQuestion(d.follow_up_question, 'follow_up_question', errs);
      break;
    case 'diagnostic_tree':
      if ((d.passage_segments?.length ?? 0) < 1) errs.push('diagnostic tree needs a passage');
      if (!Array.isArray(d.steps) || d.steps.length < 2) errs.push('diagnostic tree needs at least 2 steps');
      (d.steps ?? []).forEach((s, i) => checkQuestion(s, `step ${i + 1}`, errs));
      break;
    case 'syntactic_assembly': {
      const blockIds = new Set((d.blocks ?? []).map((b) => b.id));
      if (blockIds.size !== (d.blocks ?? []).length) errs.push('block ids must be unique');
      if ((d.blocks?.length ?? 0) < 3) errs.push('assembly needs at least 3 blocks');
      if (!Array.isArray(d.solutions) || !d.solutions.length) errs.push('assembly needs at least one solution');
      for (const sol of d.solutions ?? []) {
        if (new Set(sol).size !== sol.length) errs.push('a solution repeats a block');
        for (const id of sol) if (!blockIds.has(id)) errs.push(`solution references unknown block "${id}"`);
      }
      if (!d.target_structure?.trim()) errs.push('assembly needs target_structure');
      break;
    }
    default:
      errs.push(`unknown drill_type "${(d as DrillItem).drill_type}"`);
  }
  return errs;
}
