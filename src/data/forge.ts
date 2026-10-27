// Content for the Generative Forge (Tier 2).

export interface FigureCard {
  id: string;
  nodes: string[];
  classical: string;
  modern: string;
  instruction: string;
  example: string;
}

/** "Mr. Potato Head" cards: each is a figure or move the user must dress the proposition in. */
export const CARDS: FigureCard[] = [
  { id: 'c_chiasmus', nodes: ['figure_chiasmus'], classical: 'Chiasmus', modern: 'The Criss-Cross',
    instruction: 'Repeat two key terms in reverse order (A–B / B–A).',
    example: '“We do not serve the schedule; the schedule serves us.”' },
  { id: 'c_periodic', nodes: ['syntax_periodic'], classical: 'Periodic Sentence', modern: 'The Suspense Sentence',
    instruction: 'Hold the main clause back until the final words.',
    example: '“After two audits, a failed pilot and a year of excuses, the vendor has to go.”' },
  { id: 'c_cumulative', nodes: ['syntax_cumulative'], classical: 'Cumulative Sentence', modern: 'The Add-On Sentence',
    instruction: 'Main clause first, then let modifiers accumulate.',
    example: '“The bridge held, groaning, swaying, but whole.”' },
  { id: 'c_antithesis', nodes: ['syntax_antithesis'], classical: 'Antithesis', modern: 'The Balanced Contrast',
    instruction: 'Set opposed ideas in matching grammatical halves.',
    example: '“Cheap to build, dear to run.”' },
  { id: 'c_tricolon', nodes: ['syntax_tricolon'], classical: 'Tricolon Crescens', modern: 'The Rising Three',
    instruction: 'Three parallel members, growing in length or force.',
    example: '“It cost us time, it cost us money, and it very nearly cost us the trust of every customer we have.”' },
  { id: 'c_anaphora', nodes: ['figure_anaphora'], classical: 'Anaphora', modern: 'The Drumbeat',
    instruction: 'Start successive clauses with the same word or phrase.',
    example: '“Not this quarter, not this year, not on my watch.”' },
  { id: 'c_epistrophe', nodes: ['figure_epistrophe'], classical: 'Epistrophe', modern: 'The Echo Ending',
    instruction: 'End successive clauses with the same word or phrase.',
    example: '“We designed it in public, we tested it in public, and we will fail, if we fail, in public.”' },
  { id: 'c_anadiplosis', nodes: ['figure_anadiplosis'], classical: 'Anadiplosis', modern: 'The Relay',
    instruction: 'Begin each clause with the word that ended the last.',
    example: '“Silence breeds rumour; rumour breeds fear; fear breeds resignations.”' },
  { id: 'c_litotes_reluctant', nodes: ['figure_litotes', 'ethos_disinterest'], classical: 'Litotes + Reluctant Conclusion', modern: 'Understatement + “It Pains Me to Say”',
    instruction: 'Understate by denying the opposite, while conceding a conclusion against your own interest.',
    example: '“It is not a small thing for me to admit, as the one who built it, that the old system was better.”' },
  { id: 'c_asyndeton', nodes: ['figure_asyndeton'], classical: 'Asyndeton', modern: 'The Rapid-Fire List',
    instruction: 'Drop the conjunctions from a list or series.',
    example: '“Fewer meetings, shorter emails, clearer owners.”' },
  { id: 'c_polysyndeton', nodes: ['figure_polysyndeton'], classical: 'Polysyndeton', modern: 'The Pile-Up',
    instruction: 'Repeat the conjunction to give each item weight.',
    example: '“And the logs and the alerts and the dashboards all said the same thing.”' },
  { id: 'c_metaphor', nodes: ['figure_metaphor'], classical: 'Sustained Metaphor', modern: 'The Picture Phrase',
    instruction: 'Carry the claim through one consistent image. No mixing.',
    example: '“Our codebase is a house with no plans: every new room risks a wall that was holding up the roof.”' },
  { id: 'c_procatalepsis', nodes: ['concession_prebuttal'], classical: 'Procatalepsis', modern: 'Pre-emptive Buttressing',
    instruction: 'Raise the obvious objection yourself, then answer it.',
    example: '“You will say it is too expensive; it is cheaper than the outage.”' },
  { id: 'c_paromologia', nodes: ['concession_pivot'], classical: 'Paromologia', modern: 'Concede-and-Pivot',
    instruction: 'Grant the opponent a point, then turn it to your advantage.',
    example: '“Yes, the rollout was slow, and that slowness is why it hasn’t broken once.”' },
  { id: 'c_deliberative', nodes: ['tense_deliberative'], classical: 'Deliberative Turn', modern: 'Future-Choice Framing',
    instruction: 'Recast the claim as a choice the listener can make next.',
    example: '“So the question for Monday is simple: patch it again, or replace it while we still can.”' },
];

export const PROPOSITIONS: string[] = [
  'Centralised software dependencies create brittle systems that fail when maintainers lose interest.',
  'Meetings without a written agenda waste more time than they save.',
  'Cities that build more housing make housing cheaper for everyone.',
  'Teams that never admit mistakes repeat them.',
  'A product that tries to please every customer ends up pleasing none.',
  'Cutting the training budget saves money this year and costs far more next year.',
  'Public libraries do more for social mobility than most targeted schemes.',
  'Automated tests are only as good as the assumptions written into them.',
  'Leaders who hoard information create organisations that cannot act without them.',
  'Measuring the wrong thing precisely is worse than measuring the right thing roughly.',
  'A clear "no" is kinder than a vague "maybe".',
  'Rural bus routes are lifelines, not luxuries.',
  'Every exception to a rule teaches people the rule is negotiable.',
  'Small, frequent releases are safer than large, rare ones.',
  'An apology without a change of behaviour is just a performance.',
  'Speed without direction only gets you lost faster.',
  'Shared ownership of code means nobody owns it.',
  'Protecting old trees is cheaper than planting new ones.',
  'Documentation is a gift to your future self.',
  'Simplicity takes more effort than complexity.',
];

export interface SteelmanItem {
  id: string;
  title: string;
  passage: string;
  /** Taxonomy nodes for the distortions present. */
  distortions: string[];
  grievance: string;
  exemplar: string;
}

export const STEELMAN: SteelmanItem[] = [
  {
    id: 'sm_01', title: 'The Open-Plan Office',
    passage: 'Management have clearly decided they want us miserable. Since they ripped out the walls, nobody can think, every single day is ruined by noise, and anyone who complains gets labelled "not a team player". If this carries on, every decent engineer will quit and the company will be finished within a year. The people who signed off this disaster should be ashamed of themselves.',
    distortions: ['distortion_mind_reading', 'distortion_all_or_nothing', 'distortion_catastrophizing', 'fallacy_ad_hominem', 'tense_forensic'],
    grievance: 'The open-plan layout makes focused work hard, and complaints are being dismissed.',
    exemplar: 'Since the move to open-plan, focused work has become much harder: our deep-work hours have dropped and interruptions are constant. Because engineering depends on long stretches of concentration, we should test quiet zones or booked focus rooms for a quarter, track output, and give staff a safe channel to raise concerns.',
  },
  {
    id: 'sm_02', title: 'The Parking Charges',
    passage: 'The council only introduced these parking charges because they hate drivers and want to bleed us dry. Either they scrap the charges completely or the high street dies. Everyone I know says the town is already dead. Whoever came up with this has obviously never worked a day in a real job.',
    distortions: ['distortion_mind_reading', 'fallacy_false_choice', 'fallacy_bad_example', 'fallacy_ad_hominem'],
    grievance: 'The new parking charges may be driving shoppers away from the high street.',
    exemplar: 'Since the parking charges began, several shops report fewer customers. If short visits are being priced out, high-street trade will suffer. The council could make the first hour free for six months and compare footfall with the previous period before deciding whether the charges should stay.',
  },
  {
    id: 'sm_03', title: 'The Missed Promotion',
    passage: 'I didn\'t get the promotion, which proves this company never rewards hard work. My manager obviously had it in for me from day one. I feel completely worthless here, so I must be worthless to them. There\'s no point trying any more. Either they promote me next round or I\'m gone.',
    distortions: ['fallacy_bad_example', 'distortion_mind_reading', 'distortion_emotional_reasoning', 'distortion_all_or_nothing', 'fallacy_false_choice'],
    grievance: 'The speaker worked hard, missed a promotion, and doesn\'t understand why.',
    exemplar: 'I worked hard for this promotion and didn\'t get it, and I don\'t yet know why. Because promotions should depend on clear criteria, I will ask my manager which criteria I fell short on and agree a plan with dated milestones, then decide by spring whether there is a path for me here.',
  },
  {
    id: 'sm_04', title: 'The Legacy Rewrite',
    passage: 'Anyone who still defends the legacy system is either lazy or scared of change. It has caused every outage we\'ve ever had. If we don\'t rewrite the whole thing from scratch this year, we\'re finished. I just know in my gut that the new stack will fix everything.',
    distortions: ['fallacy_ad_hominem', 'fallacy_false_choice', 'distortion_overclaiming', 'distortion_catastrophizing', 'distortion_emotional_reasoning'],
    grievance: 'The legacy system causes real reliability problems that keep being deferred.',
    exemplar: 'The legacy system was involved in most of last year\'s outages, and patching it is getting slower. Since recurring failures tend to cluster in a few components, we should identify the three worst offenders, replace those first with a strangler-pattern rewrite, and measure incident rates before committing to more.',
  },
  {
    id: 'sm_05', title: 'The School Uniform Rule',
    passage: 'The school only cares about uniforms because the head teacher is a control freak. My son was sent home for wearing the wrong shoes, so obviously the whole system is cruel. Next they\'ll be measuring our children\'s haircuts with rulers. Parents who support this rule clearly don\'t love their kids.',
    distortions: ['fallacy_ad_hominem', 'fallacy_bad_example', 'fallacy_wrong_ending', 'distortion_mind_reading'],
    grievance: 'A child was excluded from lessons over a minor uniform breach, which seems disproportionate.',
    exemplar: 'My son missed a day of lessons for wearing the wrong shoes, which seems out of proportion to the breach. Because missed teaching harms learning more than a footwear lapse harms discipline, I\'d ask the governors to replace sending pupils home with a warning and a loan-shoes box from next term.',
  },
  {
    id: 'sm_06', title: 'The Cycling Lane',
    passage: 'These cyclists think they own the road. The new lane has completely destroyed traffic on Station Road. I\'ve never seen a single cyclist use it, so nobody does. If we let them have this, they\'ll want every road in the city closed to cars.',
    distortions: ['distortion_mind_reading', 'distortion_all_or_nothing', 'fallacy_bad_example', 'fallacy_wrong_ending'],
    grievance: 'The new cycle lane appears to have worsened congestion on one road.',
    exemplar: 'Since the Station Road cycle lane opened, car journeys at rush hour seem slower. If the lane is lightly used, the trade-off may not be worth it there. The council should publish counts of cyclists and journey times on that stretch and adjust the lane\'s hours or layout at the six-month review.',
  },
  {
    id: 'sm_07', title: 'The AI Policy',
    passage: 'Banning AI tools at work is pure fear from people who don\'t understand technology. Anyone who supports the ban will be unemployable in two years. AI is either embraced completely or the company dies. It feels like the obvious future, so it must be.',
    distortions: ['distortion_mind_reading', 'distortion_catastrophizing', 'fallacy_false_choice', 'distortion_emotional_reasoning'],
    grievance: 'A blanket ban on AI tools may block real productivity gains.',
    exemplar: 'A blanket ban on AI tools may cost us real productivity, since some teams already save hours with them. Because the risks are mostly about data handling, we should pilot approved tools with clear data rules in two teams for a quarter and decide the wider policy on the results.',
  },
  {
    id: 'sm_08', title: 'The Team Reorganisation',
    passage: 'This reorg is just leadership punishing our team for speaking up. They\'ve split us up because they hate us. Nothing we built will survive. Nobody has proved the old structure was a problem, so it obviously wasn\'t. Everyone responsible should resign.',
    distortions: ['distortion_mind_reading', 'distortion_catastrophizing', 'fallacy_ignorance', 'tense_forensic'],
    grievance: 'The team was split up without a clear explanation, and its work may be lost.',
    exemplar: 'Our team was split up without a stated reason, and our shared systems now have no clear owner. Because unowned systems decay, we should ask leadership for the reasoning and agree, before the reorg completes, named owners for each system we built.',
  },
];

export interface WarrantItem {
  id: string;
  title: string;
  argument: string;
  nodes: string[];
  hidden_warrant: string;
  exemplar_rebuttal: string;
}

export const WARRANTS: WarrantItem[] = [
  {
    id: 'ws_01', title: 'The Senior Hire',
    argument: 'Our last three senior hires came from big tech companies and each one shipped major projects within a year. We should only hire senior engineers from big tech from now on.',
    nodes: ['toulmin_warrant', 'fallacy_bad_example'],
    hidden_warrant: 'Where someone worked before reliably predicts how they will perform here.',
    exemplar_rebuttal: 'Three hires is a promising pattern, and big-tech experience clearly can help. But their success may owe more to the projects we gave them than to their CVs, so let\'s hire on demonstrated skill and keep tracking where strong performers come from.',
  },
  {
    id: 'ws_02', title: 'The Popular Feature',
    argument: 'The dark-mode request is the most upvoted item on our feedback board. So it should be the top priority on our roadmap.',
    nodes: ['toulmin_warrant', 'enthymeme'],
    hidden_warrant: 'The number of upvotes measures how much value a feature delivers.',
    exemplar_rebuttal: 'The upvotes show real demand, and we should take that seriously. But votes measure how many people want something, not what it\'s worth to them, so let\'s weigh it against retention and revenue impact before ranking it first.',
  },
  {
    id: 'ws_03', title: 'The Quiet Neighbourhood',
    argument: 'Crime in the Eastfield area fell by 20% after the new streetlights went in. The council should install the same lights in every neighbourhood.',
    nodes: ['toulmin_warrant', 'fallacy_wrong_ending'],
    hidden_warrant: 'The streetlights caused the fall in crime, and would do the same everywhere.',
    exemplar_rebuttal: 'A 20% fall is genuinely encouraging, and lighting may well have helped. But crime fell citywide that year, so let\'s compare Eastfield with similar unlit areas before funding a citywide rollout.',
  },
  {
    id: 'ws_04', title: 'The Long Hours',
    argument: 'Sam is always the last to leave the office. Sam should get this year\'s performance award.',
    nodes: ['toulmin_warrant', 'enthymeme'],
    hidden_warrant: 'Hours spent in the office are a good measure of performance.',
    exemplar_rebuttal: 'Sam\'s commitment is real and deserves recognition. But hours measure effort, not results, so let\'s base the award on what each person delivered and recognise dedication in another way.',
  },
  {
    id: 'ws_05', title: 'The Expert Endorsement',
    argument: 'A Nobel-winning physicist has said this nutrition supplement improves memory. That\'s good enough evidence for me to recommend it to patients.',
    nodes: ['toulmin_warrant', 'toulmin_backing'],
    hidden_warrant: 'Expertise in one field makes someone an authority in another.',
    exemplar_rebuttal: 'The physicist\'s brilliance isn\'t in question, and their curiosity is admirable. But a physics prize doesn\'t make someone an authority on nutrition, so let\'s look for controlled trials before recommending it to anyone.',
  },
  {
    id: 'ws_06', title: 'The Legacy Code',
    argument: 'This module hasn\'t been touched in five years and it hasn\'t caused a single incident. We can safely skip it in the security audit.',
    nodes: ['toulmin_warrant', 'fallacy_ignorance'],
    hidden_warrant: 'A component that has caused no incidents has no vulnerabilities.',
    exemplar_rebuttal: 'Five quiet years is real evidence of stability, and audit time is limited. But no incidents only means nothing has gone wrong yet, and untouched code is exactly where old vulnerabilities hide, so let\'s give it at least a lightweight review.',
  },
  {
    id: 'ws_07', title: 'The Survey Result',
    argument: 'In our staff survey, 85% said they were happy with the hybrid policy. So the policy is working for everyone.',
    nodes: ['toulmin_warrant', 'distortion_overclaiming'],
    hidden_warrant: 'A high average satisfaction score means nobody is badly served.',
    exemplar_rebuttal: '85% is a strong result, and it\'s worth celebrating. But a majority can hide a minority who are badly served, so let\'s break the results down by role and team before calling it a success for everyone.',
  },
  {
    id: 'ws_08', title: 'The Competitor Move',
    argument: 'Our biggest competitor just launched a mobile app. We need to launch one this year too.',
    nodes: ['toulmin_warrant', 'fallacy_false_comparison'],
    hidden_warrant: 'What is right for our competitor is right for us.',
    exemplar_rebuttal: 'Watching competitors is sensible, and they may have spotted real demand. But their customers and strategy aren\'t ours, so let\'s check whether our own users are asking for mobile before committing a year\'s budget.',
  },
];
