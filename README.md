# The Rhetoric Forge

A training platform for argumentation, fallacy detection, cognitive-distortion filtering and syntactic craft. It's a static Preact + TypeScript app hosted on GitHub Pages. It works fully offline and logged out, with optional Skapi accounts for sync and bring-your-own-key OpenRouter for the AI-judged parts.

**How it was built:** the code and seed content were written by an AI coding agent (Claude Code) from Richard’s written spec, with Richard steering and reviewing.

## What's in it

| Area | What it does | Needs |
|---|---|---|
| **Deterministic drills** (Tier 1) | Surgical Dissection (click the span), Diagnostic Trees (multi-step triage), Clause Assembly (build a periodic sentence, chiasmus and so on against a timer). 64 seed drills across all four wings. | Nothing |
| **Daily Calibration / Blitz** | A mixed queue aimed at the lowest-rated and most-rusted skills. Blitz is rapid dissection with a streak multiplier and time-to-detection tracking. | Nothing |
| **Telemetry** | Four-wing radar, per-node rating ± uncertainty, readiness (decay) bars, attempt history and Salle record. | Nothing |
| **Generative Forge** (Tier 2) | Mr. Potato Head workbench, Steelman & Detox, Warrant Sniping. The judge fills a checklist and the score is computed from it. Without a key, a self-check mode compares your work with a reference answer. | OpenRouter key (optional) |
| **The Fencing Salle** | 3- or 5-round bouts against personas with a secret tactic per round (blind or targeted), Pro/Con/Forced sides, a word ceiling, tactic flagging, and a separate Arbiter call with a 5-axis scorecard. | OpenRouter key |
| **Admin Studio** | Batch-generate candidate drills, validate them, preview them live in the real player, edit the JSON inline, and commit to or unpublish from the global bank. | Admin account + key |
| **Codex** | The full skill tree with formal and modern names and source notes on contested terms. | Nothing |

There is a dual-register toggle (Formal / Both / Modern) everywhere, plus parchment and slate themes and JSON export/import (which merges, never overwrites).

## Design decisions worth knowing

- **Ratings are Glicko-2** on the ELO scale (start 1200, RD 250). Each drill is treated as an opponent at its `difficulty_elo`, the same model Lichess uses for puzzles. On multi-node drills the primary node gets full weight and the others 0.6.
- **Evidence weights:** right-or-wrong drills count at 1.0, Blitz at 0.8, AI-judged Forge work and Salle bouts at 0.5, and self-checks at 0.25. LLM judges are noisier, so they move ratings less.
- **"FSRS-lite"** is a heuristic: FSRS's power-law forgetting curve (R(S,S) = 0.9) with a simplified stability update per skill node. A skill isn't a flashcard, so the readiness bar is a guide to what to revisit, not a memory model.
- **The Salle opponent gets only the current round's tactic**, injected per turn, so it doesn't drift or give the game away. The Arbiter is a separate call. Each axis score is 50% the arbiter's number and 50% its own 3-item checklist.
- **JSON output:** strict `json_schema` first, then `json_object`, then plain text with extraction, plus one repair re-ask. This lets any OpenRouter model work as judge.

## Data & privacy

- Progress lives in `localStorage` (`rs.*` keys). When you're signed in it also syncs to a **private** Skapi record that only you can read. The merge rule is: per skill node, the most recently practised copy wins, and histories are unioned by id.
- The **OpenRouter key never leaves the browser** except in calls to `openrouter.ai`. It isn't synced or exported.
- Salle transcripts are kept locally (last 40) and mirrored to a private Skapi table when you're signed in.

## Development

```sh
npm ci
npm run dev        # local dev server
npm test           # unit tests: ratings, merge, scheduler, and validation of every seed drill
npm run build      # typecheck + production build into dist/
```

Seed drills live in `src/data/drills/*.json`, the taxonomy in `src/data/taxonomy.ts`, and Forge and Salle content in `src/data/forge.ts` and `src/data/salle.ts`. `npm test` validates every drill's structure: exactly one correct option, the target span exists, solutions reference real blocks, and node ids exist.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`. One-time setup: **repo Settings → Pages → Build and deployment → Source: GitHub Actions.** The build uses relative paths and hash routing, so it works at `https://<user>.github.io/rhetoric-salle/`.

## Skapi setup

The project ID is in `src/config.ts`. It currently points at the "Test Site" project.

To become admin:
1. Sign up in the app (Account page) and copy the **User ID** shown there.
2. Add it to `ADMIN_USER_IDS` in `src/config.ts`. Anyone can post a public record, so other visitors only load bank drills uploaded by these IDs.
3. Optionally grant the account access group 90+ in the Skapi dashboard. Either step on its own unlocks the Admin Studio UI.

Tables used: `drill_bank` (public, admin-authored), `telemetry` (private, one record per user) and `salle_transcripts` (private).
