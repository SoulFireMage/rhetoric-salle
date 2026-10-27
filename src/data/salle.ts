// Content for the Fencing Salle: motions, opponent personas and their tactic menu.

export interface Motion {
  text: string;
  category: 'Philosophical' | 'Policy' | 'Workplace' | 'Technical';
}

export const MOTIONS: Motion[] = [
  { category: 'Philosophical', text: 'It is better to be feared than loved.' },
  { category: 'Philosophical', text: 'Lying is sometimes a moral duty.' },
  { category: 'Philosophical', text: 'Free will is an illusion we should keep believing in.' },
  { category: 'Philosophical', text: 'Tradition deserves deference until proven harmful.' },
  { category: 'Philosophical', text: 'Privacy matters more than convenience.' },
  { category: 'Philosophical', text: 'Experts should have more say than the public on matters of science.' },
  { category: 'Policy', text: 'Mandatory open-source audits for critical infrastructure software.' },
  { category: 'Policy', text: 'Cities should abolish minimum parking requirements.' },
  { category: 'Policy', text: 'A four-day working week should be the legal default.' },
  { category: 'Policy', text: 'Voting should be compulsory.' },
  { category: 'Policy', text: 'Social media platforms should verify the age of every user.' },
  { category: 'Policy', text: 'Rent controls do more harm than good.' },
  { category: 'Policy', text: 'Public transport should be free at the point of use.' },
  { category: 'Policy', text: 'Universities should drop entrance exams in favour of lotteries among qualified applicants.' },
  { category: 'Workplace', text: 'Performance reviews should be abolished.' },
  { category: 'Workplace', text: 'Salaries should be published openly within a company.' },
  { category: 'Workplace', text: 'Managers should be elected by their teams.' },
  { category: 'Workplace', text: 'Remote work should be the default for knowledge workers.' },
  { category: 'Workplace', text: 'Unlimited holiday policies hurt employees.' },
  { category: 'Workplace', text: 'Meetings longer than 30 minutes should require director approval.' },
  { category: 'Technical', text: 'Rewrites from scratch are almost always a mistake.' },
  { category: 'Technical', text: 'Microservices have done more harm than good to most companies.' },
  { category: 'Technical', text: 'Every production deploy should require a second engineer’s approval.' },
  { category: 'Technical', text: 'Teams should be allowed to choose their own programming languages.' },
  { category: 'Technical', text: 'AI coding assistants should be banned from security-critical code.' },
  { category: 'Technical', text: 'Test coverage targets do more harm than good.' },
];

export interface Tactic {
  id: string;
  label: string;
  /** Taxonomy node the user is tested on when this tactic is used against them. */
  node: string;
  instruction: string;
}

export const TACTICS: Tactic[] = [
  { id: 'false_dilemma', label: 'False Choice', node: 'fallacy_false_choice',
    instruction: 'Present exactly two options, one plainly unacceptable, as if no others exist.' },
  { id: 'motte_and_bailey', label: 'Motte-and-Bailey', node: 'trap_motte_bailey',
    instruction: 'Make a bold, sweeping claim; if challenged, retreat to a modest, near-obvious version and act as if that was always your point.' },
  { id: 'forensic_baiting', label: 'Forensic Baiting', node: 'tense_deliberative',
    instruction: 'Try to drag the debate into past blame (who caused what, whose fault it was) instead of what should be done next.' },
  { id: 'straw_man', label: 'Straw Man', node: 'trap_straw_man',
    instruction: 'Restate the user’s position in an exaggerated, extreme form and refute that instead.' },
  { id: 'gish_gallop', label: 'Gish Gallop', node: 'trap_gish_gallop',
    instruction: 'Fire off five or more quick, loosely supported claims in one turn so they cannot all be answered.' },
  { id: 'red_herring', label: 'Red Herring', node: 'fallacy_red_herring',
    instruction: 'Raise a sympathetic but different issue as if it settled the question.' },
  { id: 'pathos_as_data', label: 'Pathos Disguised as Data', node: 'distortion_emotional_reasoning',
    instruction: 'Present an emotive anecdote or vague statistic as if it were hard evidence.' },
  { id: 'equivocation', label: 'Equivocation', node: 'trap_equivocation',
    instruction: 'Use a key term of the motion in one sense early on and another sense later, without flagging the shift.' },
  { id: 'kafka_trap', label: 'Kafka Trap', node: 'trap_kafka',
    instruction: 'Suggest that the user’s denial or defensiveness is itself evidence for your accusation.' },
  { id: 'catastrophizing', label: 'Catastrophising', node: 'distortion_catastrophizing',
    instruction: 'Predict a disastrous chain of consequences from the user’s position as if it were near-certain.' },
  { id: 'bad_example', label: 'Bad Example', node: 'fallacy_bad_example',
    instruction: 'Generalise confidently from one vivid case or anecdote.' },
  { id: 'loaded_reframe', label: 'Loaded Reframe', node: 'pathos_redefinition',
    instruction: 'Rename the user’s proposal with a loaded, unfavourable label and argue against the label.' },
  { id: 'overclaiming', label: 'Certainty Inflation', node: 'distortion_overclaiming',
    instruction: 'State contested or probabilistic claims as settled fact ("everyone knows", "it is proven").' },
  { id: 'ad_hominem', label: 'Snide Personal Jab', node: 'fallacy_ad_hominem',
    instruction: 'Make one polite-sounding but personal dig at the user’s competence or motives instead of their argument.' },
];

export const TACTIC_MAP = Object.fromEntries(TACTICS.map((t) => [t.id, t]));

export interface Persona {
  id: string;
  name: string;
  description: string;
  voice: string;
  difficulty: number;
  favoured: string[];
}

export const PERSONAS: Persona[] = [
  { id: 'technocrat', name: 'The Smooth Technocrat', difficulty: 1450,
    description: 'Calm, data-flavoured, quietly condescending.',
    voice: 'Measured, polished, cites figures confidently (some invented-sounding), treats opposition as naïve.',
    favoured: ['pathos_as_data', 'false_dilemma', 'motte_and_bailey', 'forensic_baiting', 'overclaiming'] },
  { id: 'populist', name: 'The Tub-Thumping Populist', difficulty: 1300,
    description: 'Loud, folksy, speaks for "ordinary people".',
    voice: 'Short punchy sentences, appeals to common sense and ordinary people, distrusts experts.',
    favoured: ['straw_man', 'bad_example', 'catastrophizing', 'loaded_reframe', 'ad_hominem'] },
  { id: 'sophist', name: 'The Slippery Sophist', difficulty: 1600,
    description: 'Clever, playful, never quite says what they mean.',
    voice: 'Witty, slippery, redefines terms, enjoys paradox, rarely commits to a clear claim.',
    favoured: ['equivocation', 'motte_and_bailey', 'loaded_reframe', 'red_herring', 'kafka_trap'] },
  { id: 'firehose', name: 'The Firehose Pundit', difficulty: 1400,
    description: 'Fast, relentless, quantity over quality.',
    voice: 'Rapid, confident, piles claim on claim, sounds like a cable-news panellist.',
    favoured: ['gish_gallop', 'overclaiming', 'bad_example', 'red_herring', 'straw_man'] },
  { id: 'inquisitor', name: 'The Moral Inquisitor', difficulty: 1550,
    description: 'Righteous, accusatory, makes it about your character.',
    voice: 'Grave, moralising, frames disagreement as a moral failing, asks pointed questions.',
    favoured: ['kafka_trap', 'forensic_baiting', 'ad_hominem', 'loaded_reframe', 'catastrophizing'] },
  { id: 'colleague', name: 'The Reasonable Colleague', difficulty: 1200,
    description: 'Friendly, mostly fair, with one or two bad habits.',
    voice: 'Warm, collegiate, reasonable-sounding; slips in a fallacy now and then without malice.',
    favoured: ['false_dilemma', 'bad_example', 'forensic_baiting', 'overclaiming'] },
];

/** Which taxonomy nodes each scorecard axis feeds. */
export const AXIS_NODES: Record<string, string[]> = {
  logos: ['toulmin_warrant', 'toulmin_claim_data'],
  ethos: ['ethos_phronesis', 'concession_pivot'],
  tense_control: ['tense_deliberative', 'stasis_policy'],
  syntax: ['syntax_antithesis', 'style_coyness_index'],
  epistemics: ['distortion_overclaiming', 'toulmin_qualifier_rebuttal'],
};
