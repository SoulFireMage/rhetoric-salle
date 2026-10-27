import type { TaxonomyNode, Wing, WingId } from '../lib/types';

export const WINGS: Wing[] = [
  { id: 'structure', numeral: 'I', title: 'Structural Anatomy & Tenses', focus: 'The skeleton of argument and temporal control' },
  { id: 'fallacies', numeral: 'II', title: 'Fallacies, Sophistry & Distortions', focus: 'Defensive shields and diagnostic precision' },
  { id: 'ethos', numeral: 'III', title: 'Ethos, Pathos & Reframing', focus: 'Persuasive levers, decorum and tactical pivots' },
  { id: 'syntax', numeral: 'IV', title: 'Syntactic Craft & Figures', focus: 'Sentence variety, rhythm and rhetorical punch' },
];

const n = (
  id: string, wing: WingId, group: string, classical: string, modern: string, summary: string, note?: string,
): TaxonomyNode => ({ id, wing, group, classical, modern, summary, note });

export const NODES: TaxonomyNode[] = [
  // ── Wing I ──────────────────────────────────────────────
  n('toulmin_claim_data', 'structure', 'Toulmin Mapping', 'Claim & Data (Grounds)', 'What and Why',
    'Separate the conclusion being pushed from the evidence offered for it.'),
  n('toulmin_warrant', 'structure', 'Toulmin Mapping', 'Warrant', 'The Hidden Bridge',
    'The general rule that licenses the step from data to claim — usually left unsaid.'),
  n('toulmin_backing', 'structure', 'Toulmin Mapping', 'Backing', 'Proof of the Rule',
    'Support for the warrant itself: why the bridge rule should be trusted.'),
  n('toulmin_qualifier_rebuttal', 'structure', 'Toulmin Mapping', 'Qualifier & Rebuttal (Modality / Reservation)', '“Probably… unless”',
    'How strongly the claim is held, and the conditions under which it would not hold.'),
  n('syllogism_validity', 'structure', 'Syllogisms & Enthymemes', 'Syllogism (Formal Validity)', 'The Logic Chain',
    'Whether the conclusion follows from the premises by form alone, true or not.'),
  n('enthymeme', 'structure', 'Syllogisms & Enthymemes', 'Enthymeme', 'The Silent Premise',
    'A compressed syllogism whose missing premise the audience supplies — and can be challenged.',
    'Aristotle’s enthymeme is a rhetorical syllogism from probabilities; “premise left unstated” is the later, narrower textbook sense used here.'),
  n('tense_forensic', 'structure', 'Cicero’s Three Tenses', 'Forensic (Judicial) Rhetoric', 'Past Tense: Blame',
    'Argument about what happened and who is at fault.',
    'The three genres are Aristotle’s (Rhetoric I.3); Cicero and the Latin handbooks carried them on. “Tenses” is Heinrichs’ framing.'),
  n('tense_demonstrative', 'structure', 'Cicero’s Three Tenses', 'Demonstrative (Epideictic) Rhetoric', 'Present Tense: Values',
    'Praise and blame of who we are now; bonding an audience around shared values.'),
  n('tense_deliberative', 'structure', 'Cicero’s Three Tenses', 'Deliberative Rhetoric', 'Future Tense: Choice',
    'Argument about what we should do next — the tense of decisions.'),
  n('stasis_conjecture', 'structure', 'Stasis Theory', 'Stasis of Conjecture', 'Did It Happen? (Fact)',
    'Disagreement over whether something is or was the case.'),
  n('stasis_definition', 'structure', 'Stasis Theory', 'Stasis of Definition', 'What Is It?',
    'Disagreement over what to call the agreed facts.'),
  n('stasis_quality', 'structure', 'Stasis Theory', 'Stasis of Quality', 'How Bad or Good Is It?',
    'Disagreement over severity, value or justification.'),
  n('stasis_policy', 'structure', 'Stasis Theory', 'Stasis of Policy', 'What Should We Do?',
    'Disagreement over the action to take.',
    'Hermagoras’ fourth stasis is translatio (jurisdiction/procedure). “Policy” is the modern composition-teaching substitute.'),

  // ── Wing II ─────────────────────────────────────────────
  n('fallacy_false_comparison', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Faulty Analogy', 'False Comparison',
    'Treating two things as alike in the respect that matters when they are not.'),
  n('fallacy_bad_example', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Hasty Generalisation (Secundum Quid)', 'Bad Example',
    'Drawing a general rule from too few, or unrepresentative, cases.'),
  n('fallacy_ignorance', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Argumentum ad Ignorantiam', 'Ignorance as Proof',
    'Taking the absence of evidence against a claim as evidence for it (or vice versa).'),
  n('fallacy_tautology', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Petitio Principii (Circular Reasoning)', 'Tautology',
    'The conclusion is smuggled into the premises; the argument proves itself.'),
  n('fallacy_false_choice', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'False Dilemma (Bifurcation)', 'False Choice',
    'Presenting two options as the only ones when others exist.',
    'Cicero (De Inventione I.45) uses “complexio” for a dilemma, but Rhetorica ad Herennium uses the same word for symploce — so we avoid it as a label.'),
  n('fallacy_red_herring', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Ignoratio Elenchi (Irrelevant Conclusion)', 'Red Herring',
    'Diverting to a different issue that seems related but does not answer the point.',
    'Strictly, ignoratio elenchi is proving a conclusion other than the one at issue; the deliberate diversion is a common special case.'),
  n('fallacy_wrong_ending', 'fallacies', 'Heinrichs’ Deadly Logical Sins', 'Non Sequitur (incl. Post Hoc & Slippery Slope)', 'Wrong Ending',
    'The conclusion does not follow — typically a causal leap or an unearned chain of consequences.',
    'Heinrichs groups conclusions that do not follow (chiefly post hoc and slippery slope) under this name. Grouping is his, not classical.'),
  n('fallacy_ad_hominem', 'fallacies', 'Modern Rhetorical Traps', 'Argumentum ad Hominem', 'Personal Attack',
    'Attacking the person instead of the argument.'),
  n('trap_motte_bailey', 'fallacies', 'Modern Rhetorical Traps', 'Motte-and-Bailey Doctrine', 'Bait-and-Retreat',
    'Advancing a bold claim, then retreating to a modest, defensible one when challenged — and back again.',
    'Named by Nicholas Shackel (2005). No classical equivalent.'),
  n('trap_kafka', 'fallacies', 'Modern Rhetorical Traps', 'Kafka Trap', 'Denial as Proof',
    'Treating any denial of the accusation as further evidence for it.',
    'Named by Eric S. Raymond (2010). No classical equivalent.'),
  n('trap_equivocation', 'fallacies', 'Modern Rhetorical Traps', 'Equivocation (Fallacia Aequivocationis)', 'The Word Swap',
    'Using one word in two senses within the same argument.'),
  n('trap_gish_gallop', 'fallacies', 'Modern Rhetorical Traps', 'Gish Gallop', 'The Firehose',
    'Overwhelming an opponent with many weak claims faster than they can be answered.'),
  n('trap_straw_man', 'fallacies', 'Modern Rhetorical Traps', 'Straw Man (Distorted Refutation)', 'The Scarecrow',
    'Refuting a weaker, distorted version of the opponent’s position.'),
  n('trap_weak_man', 'fallacies', 'Modern Rhetorical Traps', 'Weak Man', 'Picking the Feeblest Defender',
    'Refuting the weakest real advocate of a position as if they represented it.',
    'Term popularised by Talisse & Aikin (2006) as a variant of the straw man.'),
  n('distortion_catastrophizing', 'fallacies', 'Cognitive Distortions', 'Catastrophising (Magnification)', 'The Doom Spiral',
    'Treating the worst imaginable outcome as the likely one.'),
  n('distortion_mind_reading', 'fallacies', 'Cognitive Distortions', 'Mind-Reading (Jumping to Conclusions)', 'Mind-Reading',
    'Asserting what others think or intend without evidence.'),
  n('distortion_emotional_reasoning', 'fallacies', 'Cognitive Distortions', 'Emotional Reasoning', 'I Feel It, So It’s True',
    'Taking a feeling as proof about the world.'),
  n('distortion_all_or_nothing', 'fallacies', 'Cognitive Distortions', 'Dichotomous Thinking', 'All-or-Nothing',
    'Seeing outcomes as total success or total failure, with no middle.'),
  n('distortion_overclaiming', 'fallacies', 'Cognitive Distortions', 'Epistemic Overclaiming', 'Certainty Inflation',
    'Stating probabilities, guesses or values as settled fact.',
    'Not one of Beck’s or Burns’ canonical distortions; included as an argumentation habit.'),

  // ── Wing III ────────────────────────────────────────────
  n('ethos_virtue', 'ethos', 'The Three Pillars of Ethos', 'Arete (Virtue)', 'Shared Values',
    'Showing that you hold the audience’s values.'),
  n('ethos_phronesis', 'ethos', 'The Three Pillars of Ethos', 'Phronesis', 'Practical Wisdom',
    'Showing you know what to do in this situation — judgement, not just knowledge.'),
  n('ethos_disinterest', 'ethos', 'The Three Pillars of Ethos', 'Eunoia (Goodwill / Disinterest)', 'The Reluctant Conclusion',
    'Showing you have the audience’s interest at heart, ideally by arguing against your own.',
    'Aristotle’s third pillar is eunoia (goodwill); Heinrichs recasts it as disinterest.'),
  n('concession_tactical_flaw', 'ethos', 'Tactical Concessions', 'Ethos of the Tactical Flaw', 'The Tactical Flaw',
    'Admitting a small, harmless weakness to make the rest more credible.'),
  n('concession_pivot', 'ethos', 'Tactical Concessions', 'Paromologia', 'Concede-and-Pivot',
    'Granting a point to the opponent, then using it to advance your own.'),
  n('concession_prebuttal', 'ethos', 'Tactical Concessions', 'Procatalepsis', 'Pre-emptive Buttressing',
    'Raising and answering an objection before the opponent can.'),
  n('pathos_redefinition', 'ethos', 'Pathos & Framing', 'Paradiastole', 'Reframing',
    'Redescribing something so it falls under a different, more favourable or less favourable, term.'),
  n('pathos_commonplace', 'ethos', 'Pathos & Framing', 'Topos Koinos (Commonplace)', 'The Shared Belief',
    'Building on a belief the audience already holds instead of fighting it.'),
  n('pathos_cooling', 'ethos', 'Pathos & Framing', 'Decorum: Lowering Pathos', 'Cooling the Temperature',
    'Calming an overheated exchange so that reasoning becomes possible.'),

  // ── Wing IV ─────────────────────────────────────────────
  n('syntax_periodic', 'syntax', 'Structural Syntax', 'Periodic Sentence', 'The Suspense Sentence',
    'Holding back the main clause until the end so the sentence lands.'),
  n('syntax_cumulative', 'syntax', 'Structural Syntax', 'Loose (Cumulative) Sentence', 'The Add-On Sentence',
    'Main clause first, then modifying phrases accumulate detail.'),
  n('syntax_antithesis', 'syntax', 'Structural Syntax', 'Antithesis', 'The Balanced Contrast',
    'Opposed ideas in parallel grammatical form.'),
  n('syntax_tricolon', 'syntax', 'Structural Syntax', 'Tricolon (Crescens)', 'The Rising Three',
    'Three parallel members, ideally growing in length or force.'),
  n('figure_chiasmus', 'syntax', 'Figures & Tropes', 'Chiasmus', 'The Criss-Cross',
    'Repeating terms or ideas in reverse order: A–B, B–A.'),
  n('figure_anaphora', 'syntax', 'Figures & Tropes', 'Anaphora', 'The Drumbeat',
    'Repeating the same word or phrase at the start of successive clauses.'),
  n('figure_epistrophe', 'syntax', 'Figures & Tropes', 'Epistrophe', 'The Echo Ending',
    'Repeating the same word or phrase at the end of successive clauses.'),
  n('figure_anadiplosis', 'syntax', 'Figures & Tropes', 'Anadiplosis', 'The Relay',
    'Ending one clause with the word that begins the next.'),
  n('figure_litotes', 'syntax', 'Figures & Tropes', 'Litotes', 'The Double-Negative Understatement',
    'Affirming something by denying its opposite: “not unhelpful”.'),
  n('figure_metaphor', 'syntax', 'Figures & Tropes', 'Metaphor & Idiom', 'The Picture Phrase',
    'Carrying meaning across by an implied comparison or a fixed figurative phrase.'),
  n('figure_asyndeton', 'syntax', 'Figures & Tropes', 'Asyndeton', 'The Rapid-Fire List',
    'Omitting conjunctions for speed and force.'),
  n('figure_polysyndeton', 'syntax', 'Figures & Tropes', 'Polysyndeton', 'The Pile-Up',
    'Repeating conjunctions for weight and accumulation.'),
  n('style_yawn_index', 'syntax', 'The Yawn & Coyness Index', 'Pleonasm & Nominalisation', 'The Yawn Index',
    'Throat-clearing, filler and verbs buried as nouns.'),
  n('style_coyness_index', 'syntax', 'The Yawn & Coyness Index', 'Hedging (Excessive Qualification)', 'The Coyness Index',
    'Cowardly hedges that soften claims you actually hold.'),
];

export const NODE_MAP: Record<string, TaxonomyNode> = Object.fromEntries(NODES.map((x) => [x.id, x]));

export const nodesByWing = (wing: WingId) => NODES.filter((x) => x.wing === wing);

export const groupsOfWing = (wing: WingId) => {
  const groups: { group: string; nodes: TaxonomyNode[] }[] = [];
  for (const node of nodesByWing(wing)) {
    const g = groups.find((x) => x.group === node.group);
    if (g) g.nodes.push(node);
    else groups.push({ group: node.group, nodes: [node] });
  }
  return groups;
};
