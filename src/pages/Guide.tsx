import { Dual } from '../components/Term';

const toc = [
  ['start', 'Start here'],
  ['wings', 'What you’re training'],
  ['drills', 'The three drill types'],
  ['sessions', 'Calibration & Blitz'],
  ['forge', 'The Generative Forge'],
  ['salle', 'The Fencing Salle'],
  ['ratings', 'Ratings & readiness'],
  ['registers', 'Formal and modern names'],
  ['data', 'Your data, keys & costs'],
] as const;

const jump = (id: string) => (e: Event) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function Guide() {
  return (
    <div>
      <div class="eyebrow">Guide</div>
      <h1>How to use the Forge</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>
        A field manual: read it front to back in ten minutes, or jump to the part you need.
      </p>
      <nav class="panel" aria-label="Guide contents">
        <div class="tags">{toc.map(([id, label]) => <a class="tag" href={`#/guide`} onClick={jump(id)}>{label}</a>)}</div>
      </nav>

      <section class="panel" id="start">
        <h2>Start here</h2>
        <ol>
          <li><strong>Try one drill.</strong> <a href="#/drill/w1_tense_shift_01">This one</a> takes thirty seconds: click the sentence where blame turns into choice.</li>
          <li><strong>Run a Daily Calibration.</strong> Eight mixed drills chosen for you. The first few runs map your strengths across all four wings.</li>
          <li><strong>Look at Telemetry.</strong> You’ll see a rating per skill and which ones need revisiting.</li>
          <li><strong>When you want to write, not just spot,</strong> open the Forge. When you want to argue against someone, enter the Salle. Both work best with an OpenRouter key (see <a href="#/guide" onClick={jump('data')}>below</a>).</li>
        </ol>
        <p>A good rhythm is one calibration run a day, plus a Forge exercise or a Salle bout when you have twenty minutes.</p>
        <a class="btn btn-primary" href="#/drill/w1_tense_shift_01">Try the first drill</a>
      </section>

      <section class="panel" id="wings">
        <h2>What you’re training</h2>
        <p>Every exercise maps onto one skill tree with four wings. Each skill (a <em>node</em>) has its own rating.</p>
        <ul>
          <li><strong>I. Structural Anatomy &amp; Tenses:</strong> the skeleton of an argument (claim, data, the hidden warrant), syllogisms, Cicero’s three tenses (blame, values, choice) and stasis theory (what kind of disagreement this is).</li>
          <li><strong>II. Fallacies, Sophistry &amp; Distortions:</strong> spotting the classic logical sins, modern traps like the Motte-and-Bailey, and the cognitive distortions that bend arguments.</li>
          <li><strong>III. Ethos, Pathos &amp; Reframing:</strong> credibility, tactical concessions, reframing and cooling a heated room.</li>
          <li><strong>IV. Syntactic Craft &amp; Figures:</strong> periodic sentences, chiasmus, anaphora and friends, plus cutting throat-clearing and cowardly hedges.</li>
        </ul>
        <p>The <a href="#/codex">Codex</a> lists every node with a one-line definition and notes on contested terms.</p>
      </section>

      <section class="panel" id="drills">
        <h2>The three drill types</h2>
        <p class="muted">These are free and work offline. Feedback is instant and exact, because there is a right answer.</p>
        <h3>Surgical Dissection</h3>
        <p>
          Read the prompt, then <strong>click the sentence</strong> it asks for, such as the hidden warrant or the moment the speaker slides into blame.
          The passage then lights up with every sentence’s anatomical role. Many dissections have a follow-up question.
          The timer measures your <em>time to detection</em>.
        </p>
        <h3>Diagnostic Tree</h3>
        <p>
          A flawed passage and two or three questions in sequence, usually: <em>where is this argument stuck → what’s the trick → what’s the best reply?</em>
          Every wrong option is wrong in an instructive way, so read the feedback on the ones you didn’t pick.
        </p>
        <h3>Clause Assembly</h3>
        <p>
          Tap blocks to build a sentence in a target structure (a periodic sentence, a chiasmus, a rising tricolon). Tap a placed block to take it back.
          Some blocks are <strong>decoys</strong> that belong nowhere. You get two tries; going over the time limit gives partial credit.
        </p>
        <p>After every drill, the <strong>Anatomy</strong> section explains the answer, in formal terms, modern terms, or both.</p>
      </section>

      <section class="panel" id="sessions">
        <h2>Calibration &amp; Blitz</h2>
        <p>
          <strong>Daily Calibration</strong> picks eight drills, each aimed at a different weak or fading skill, pitched where you should succeed roughly two times in three.
          That’s hard enough to learn from and easy enough to keep going.
        </p>
        <p>
          <strong>Blitz</strong> is rapid-fire dissection with no follow-ups. Consecutive hits raise a multiplier and faster spotting scores more.
          Three misses end the run. Use it to build speed once accuracy is there.
        </p>
      </section>

      <section class="panel" id="forge">
        <h2>The Generative Forge</h2>
        <p>Here you write. An AI judge grades your work against a fixed checklist, and your score is computed from that checklist.</p>
        <ul>
          <li><strong>Mr. Potato Head:</strong> one plain proposition and three “cards” (figures or moves). Rewrite the same claim three ways, one per card. Marks go for executing the figure, keeping the claim and staying tight.</li>
          <li><strong>Steelman &amp; Detox:</strong> a hostile, distorted paragraph. Rewrite it in under 75 words so it keeps the real grievance, drops every distortion, states its warrant and ends on a future choice.</li>
          <li><strong>Warrant Sniping:</strong> a reasonable-sounding argument with a fatal unstated assumption. Name the assumption, then undercut it in two sentences while conceding something.</li>
        </ul>
        <p>
          With no key, the Forge runs in <strong>self-check mode</strong>: you see a model answer and tick an honest checklist.
          Either way, you can save pieces you’re proud of.
        </p>
      </section>

      <section class="panel" id="salle">
        <h2>The Fencing Salle</h2>
        <ol>
          <li><strong>Choose a mode.</strong> <em>Blind</em> hides the opponent’s tactics until the end. <em>Targeted</em> lets you (or your weakest skills) choose which tactics you face.</li>
          <li><strong>Draw a motion and a side.</strong> <em>Forced</em> assigns your side at random, which is the best practice: arguing a case you don’t hold.</li>
          <li><strong>Fence.</strong> The opponent speaks first each round, and each round it secretly deploys one tactic. You reply within the word ceiling.</li>
          <li><strong>Flag what you spot.</strong> Under your reply, “Flag a tactic” tells the arbiter what you noticed. Naming a tactic aloud in your reply counts too. Spotting <em>and</em> defusing a tactic earns the most.</li>
          <li><strong>Read the scorecard.</strong> A separate arbiter scores five axes (logic, ethos, tense control, syntax, epistemics), reveals the hidden loadout round by round, and names your key moment and top improvement.</li>
        </ol>
        <p class="muted">The tactic menu: False Choice, Motte-and-Bailey, Forensic Baiting (dragging you into blame), Straw Man, Gish Gallop, Red Herring, emotion dressed up as data, Equivocation, Kafka Trap, Catastrophising, Bad Example, Loaded Reframe, Certainty Inflation and the snide personal jab.</p>
      </section>

      <section class="panel" id="ratings">
        <h2>Ratings &amp; readiness</h2>
        <p><strong>The short version:</strong> every skill has a chess-style rating starting at 1200. Beat a hard drill and it rises a lot; miss an easy one and it falls. The “±” next to it shrinks as the app grows more sure of you.</p>
        <details>
          <summary style={{ cursor: 'pointer' }}><strong>The step-by-step version</strong></summary>
          <ol>
            <li>Each drill has a difficulty on the same scale (1000 is clear-cut, 1400 subtle, 1800 expert).</li>
            <li>Before you answer, the app predicts your chance of success from the gap between your rating and the drill’s.</li>
            <li>Afterwards, your rating moves by <em>(actual result − predicted result)</em>, scaled by how uncertain your rating still is. This is the Glicko-2 system.</li>
            <li>Partial results count: two of three tree steps scores 0.67.</li>
            <li>Evidence is weighted by reliability: right-or-wrong drills count fully, AI-judged work half, self-checks a quarter.</li>
          </ol>
        </details>
        <p style={{ marginTop: '12px' }}>
          <strong>Readiness</strong> (the coloured bar) estimates how fresh each skill is, using a forgetting curve that flattens each time you succeed after a gap.
          Green is fresh; amber and red mean it’s time to revisit. It’s a guide to what to practise, not a precise measure of memory.
        </p>
      </section>

      <section class="panel" id="registers">
        <h2>Formal and modern names</h2>
        <p>
          Every skill has two names, for example <Dual classical="Paradiastole" modern="Reframing" /> and <Dual classical="Enthymeme" modern="The Silent Premise" />.
          The <strong>Formal / Both / Modern</strong> switch at the top changes every label and explanation in the app.
          Learning both is the point: formal names let you look things up, and modern names make them usable in a meeting.
        </p>
      </section>

      <section class="panel" id="data">
        <h2>Your data, keys &amp; costs</h2>
        <ul>
          <li><strong>No account needed.</strong> Progress is saved in this browser. <a href="#/account">Signing in</a> syncs it across devices, and anything you did while signed out is merged in.</li>
          <li><strong>OpenRouter key:</strong> the Forge judge and the Salle use AI models through your own <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter</a> key, added in <a href="#/settings">Settings</a>. It stays in this browser and is only ever sent to OpenRouter. Set a spending limit on the key.</li>
          <li><strong>Costs</strong> depend on the model you pick. A Forge grading is one call; a 3-round bout is four calls (three opponent turns plus the arbiter). With a small, fast model that’s typically under a penny per Forge grading and a few pence per bout; large models cost more. Check the model’s price on OpenRouter.</li>
          <li><strong>Backups:</strong> Settings → Export JSON saves everything except your key. Import merges rather than overwrites.</li>
        </ul>
      </section>
    </div>
  );
}
