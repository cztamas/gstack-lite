# Upstream gstack changes worth learning from

Date: 2026-07-30

## Executive summary

The useful upstream changes are mostly stronger workflow contracts, not new
skills or infrastructure.

The best ideas to bring into gstack-lite are:

1. Make review boundaries mathematically correct and consistent.
2. Require review findings to carry direct code evidence.
3. Treat interactive skill behavior as a tested product contract.
4. End plan reviews with an explicit unresolved-decisions status and an
   implementation-ready checklist.
5. Split the largest skills into small routing skeletons plus on-demand sections,
   with tests proving that no behavior was lost.
6. Refresh task context when a long workflow narrows from a broad request to a
   concrete component or hypothesis.
7. Add lightweight documentation-staleness and diagram-drift checks to existing
   review skills.
8. Strengthen destructive-operation guidance around resolved targets, ownership,
   and fail-closed behavior.

The recommendation is not to synchronize the repositories or import upstream
skills wholesale. gstack-lite should keep its host-neutral question protocol,
repo-local state, explicit red-green TDD emphasis, bounded "Boil the Lake"
principle, and intentional exclusion of telemetry, auto-upgrades, GBrain,
migrations, team hooks, deploy/release machinery, and global agent settings.

## Audit scope and method

This report compares the local repositories:

- Upstream: `/Users/cztamas/dev/tools/gstack`
- Lite: `/Users/cztamas/dev/personal/gstack-lite`

The upstream comparison window starts at commit
`675717e3200d` from 2026-04-28, the day gstack-lite was created, and ends at
local upstream `main` commit `a3259400a366` from 2026-07-14.

Within that window, upstream `main` contains:

- 110 commits after the baseline, counting the repository's squashed merge
  history;
- 76 changelog release entries after v1.17;
- 57 non-merge commits touching skill families that overlap with gstack-lite.

The audit used:

- upstream `CHANGELOG.md` release narratives;
- commit history for overlapping skills;
- baseline-to-current diffs of templates and generated skills;
- current upstream and lite skill bodies;
- both repositories' generator and test suites.

This is a review of the local snapshot. It did not fetch newer remote commits.

## What gstack-lite already gets right

Several lite choices are better fits for this repository than their upstream
equivalents and should be preserved.

### Host-neutral blocking questions

The shared lite `Blocking User Question Protocol` gives every host the same
semantic rule: use a question tool when available; otherwise ask in the final
response and stop. This is simpler than upstream's growing collection of
Claude/Conductor-specific tool and hook workarounds.

Keep the generic protocol. Add behavioral tests around it rather than copying
host-specific fallback machinery.

### Stronger explicit TDD posture

`gl-plan-eng-review` explicitly requires red-green TDD and full planned test
coverage. `gl-investigate` requires a regression test that fails without the fix
and passes with it. `gl-qa` also has a regression-test generation loop.

Upstream's newer "eval-first" work supports this direction, but does not justify
weakening lite's TDD language.

### Bounded completeness

Upstream renamed "Boil the Lake" to "Boil the Ocean" in v1.57.4. Lite's version
is more operationally useful: complete the bounded task and flag genuinely
unrelated oceans. Keep the lite wording.

### Repo-local state and a small installation surface

Lite keeps writable state under the active repository's `.gstack-lite/`
directory and avoids GBrain, global project stores, telemetry, migrations, and
release infrastructure. This is an important architectural boundary.

### Generated-source validation

Lite already checks that:

- every template generates current checked-in output;
- every host receives all expected skills;
- frontmatter and OpenAI metadata are valid;
- forbidden full-gstack dependencies do not leak into lite;
- installed skills can reach `ETHOS.md`.

This is a good static foundation. The main missing layer is behavioral testing
of what an agent actually does after reading a skill.

## Relevant upstream ideas

### 1. Correct diff boundaries in pre-landing review

Upstream commit `6d8908a5` changed `/review` from
`git diff origin/<base>` to:

```bash
DIFF_BASE=$(git merge-base origin/<base> HEAD)
git diff "$DIFF_BASE"
```

This matters when the base branch advances after the feature branch was cut.
Diffing directly against the base tip can mix unrelated base-branch changes into
the review. Using the merge base reviews the feature branch plus its uncommitted
working-tree changes.

Lite currently mixes three incompatible boundaries inside `gl-review`:

- `git diff origin/<base>`;
- `git diff origin/<base>...HEAD`;
- `git log origin/<base>..HEAD`.

Some steps include uncommitted changes, some do not, and some can include or
exclude the wrong base-branch work.

Recommendation: this is the highest-priority concrete fix. Compute `DIFF_BASE`
once after fetching the base and thread it through scope drift, plan completion,
specialist review, diff-size calculation, adversarial review, and the final
checklist pass. Use a separate commit range only where commit history, rather
than file state, is intentionally needed.

Add a regression fixture with:

1. a base commit;
2. a feature commit;
3. a later base-only commit;
4. an uncommitted feature edit.

The reviewed file set must include items 2 and 4, and exclude item 3.

### 2. Findings must quote the code that motivates them

Upstream's v1.43.2 fix wave, specifically commit `2a517753`, added a
pre-emission evidence gate to `/review`:

- quote the specific motivating code line;
- cite the file and line;
- if the line cannot be quoted, treat the finding as unverified;
- cap its confidence and suppress it from the main report.

Lite has confidence scores, but not this evidence gate. A reviewer can currently
assign high confidence to a plausible narrative without demonstrating the code
shape that caused it.

Recommendation: add the upstream principle, not its exact prose, to `gl-review`
and `gl-cso`:

```text
Every main-report finding must cite file:line and quote or precisely describe
the motivating code. If no motivating line can be identified, confidence is at
most 5/10 and the item belongs in an unverified appendix.
```

For runtime-only findings, allow an equivalent artifact: test output, browser
evidence, query result, or reproducible command. The key is that high confidence
must be earned by directly inspectable evidence.

### 3. Ask-first scope gates for ambiguous review invocations

Upstream commit `496ce802` made the first operational action in
`plan-eng-review` and `plan-design-review` a hard target-selection gate. This
fixed cold invocations where the skill explored an empty or irrelevant repo
before learning what the user wanted reviewed.

Lite has a strong generic blocking-question protocol, but neither skill resolves
its review target before repository exploration.

Recommendation: adapt rather than copy the unconditional gate.

- If the user's request or host context names an unambiguous plan, diff, URL, or
  path, proceed without asking a redundant question.
- Otherwise, the first operational step must ask what to review before running
  git, reading files, or generating mockups.
- Persist the resolved target in the review report so later phases do not drift.

This keeps the upstream UX improvement without making explicit invocations more
annoying.

### 4. Interactive decisions are output contracts

Upstream hardened interactive flows repeatedly:

- `b512be71` made office-hours stop at architectural forks and required a
  substantive "Recommendation ... because ..." comparison;
- `30fe6bb1` and `7b4738bc` made plan reviews stop after surfacing a decision
  instead of silently writing findings into the plan;
- `a6fb3172` required 5+ options to be split or batched instead of dropped;
- `f5897704` made the final plan-mode exit a blocking contract;
- `54f94bec` and release `1626d485` required every review report to end with
  either `NO UNRESOLVED DECISIONS` or a visible unresolved-decisions block.

Lite already prevents asking a question and continuing in the same turn. The
remaining gaps are:

- no explicit 5+ option overflow rule;
- no mandatory clean/open sentinel at the end of plan reports;
- no test that an agent obeys the stop;
- no check that a recommendation's reason compares real tradeoffs.

Recommendation:

1. Add a shared "split, never drop" rule for more options than the host can
   present.
2. Require every plan review report to finish with exactly one of:
   `NO UNRESOLVED DECISIONS`, or a list under `UNRESOLVED DECISIONS`.
3. Add a final self-check that refuses to call the review done if the status is
   missing.
4. Require decision recommendations to name why the recommended option wins
   over at least one alternative.

### 5. Plan reviews should hand off implementation-ready tasks

Upstream v1.38.1 (`ea51b45e`) added `## Implementation Tasks` to each plan review
and a structured JSONL handoff to `/autoplan`. The important idea is not the
global JSONL store or autoplan integration. It is that review output should be
directly buildable.

Lite plan reviews are detailed, but their completion summaries do not guarantee
a normalized task list.

Recommendation: add a lightweight Markdown handoff to the three lite plan
reviews. Each task should contain:

- outcome;
- affected component or files;
- implementation action;
- red-green test or verification;
- dependency or ordering note;
- acceptance criterion;
- source review finding.

If a host provides an active plan file, put the checklist there. Do not add a
global task store. A repo-local machine-readable artifact can be considered
later only if a real consumer emerges.

### 6. Test skill behavior, not only skill text

Upstream v1.46 (`22f8c7f4`) established an eval-first floor for every skill.
Later changes added targeted regressions:

- real plan-review smoke tests that prove the first interaction is a question;
- detection for questions rendered through different terminal layouts;
- tests that a sectioned skill actually reads its deferred section;
- hermetic spawned-agent environments in v1.58.1 (`c7ae6320`);
- timeout handling that returns collected evidence instead of hanging in
  v1.60.1;
- negative tests proving broken guards are detected.

Lite currently has three test files. They cover generation, installation, and
static validation, but not end-user skill behavior.

Recommendation: add two explicit test tiers.

#### Free gate tier

Run on every change:

- static invariants for target-resolution gates;
- no question followed by continued workflow in the same response;
- mandatory unresolved-decision sentinel;
- all declared options preserved;
- main-report findings require evidence;
- generated and template content stay in sync;
- negative fixtures prove each guard can fail.

#### Optional behavioral tier

Run manually or periodically behind an explicit environment flag:

- invoke a real supported agent against an isolated temporary repo;
- use a sealed environment, not the developer's real config or memories;
- record structured transcript events;
- assert tool calls, stops, file reads, and final status;
- impose a hard timeout;
- return partial transcript evidence on timeout;
- never make this paid or stochastic tier a default installation requirement.

Start with four scenarios:

1. ambiguous `gl-plan-eng-review` asks for a target before reading the repo;
2. a review finding asks and stops before editing the plan;
3. a zero-finding section continues to the next section;
4. a completed review ends with the unresolved-decision sentinel.

This extends lite's TDD focus to the skills themselves.

### 7. Progressive disclosure for large skills

Upstream v1.56 (`cab774cc`) split its largest plan skills into an always-loaded
skeleton and on-demand `sections/*.md` files. Later commits added:

- passive section manifests;
- explicit STOP-and-read pointers;
- ordering checks;
- a canonical registry of carved skills;
- union-content tests to prove no prose disappeared;
- behavioral tests proving the agent read the required section;
- size budgets for both the skeleton and the full union.

This is relevant because several lite generated skills are large:

- `gl-plan-ceo-review`: about 71 KB;
- `gl-office-hours`: about 62 KB;
- `gl-design-review`: about 56 KB;
- `gl-plan-design-review`: about 47 KB;
- `gl-cso`: about 41 KB;
- `gl-plan-eng-review`: about 39 KB;
- `gl-design-consultation`: about 38 KB.

Recommendation: pilot sectioning on one skill, not all of them. A good first
candidate is `gl-plan-eng-review` because its pre-review routing and four review
passes have a clean boundary.

The pilot should require:

- a small always-loaded target/scope skeleton;
- relative section paths that work in Claude, Codex, and Cursor installs;
- an installer test proving sections are copied or linked;
- a union-content completeness test;
- an ordering test proving the scope gate occurs before section loading;
- an optional behavioral test proving the agent reads the section;
- before/after byte counts and a documented rollback condition.

Do not carve `gl-investigate` or `gl-quick-fix`; they are already compact enough
that indirection would cost more than it saves.

### 8. Refresh context after a workflow narrows

Upstream commit `1a4f0c9c` changed long-running `/investigate`, `/qa`, and `/ship`
flows so they refresh learnings using the concrete component or hypothesis that
emerged mid-run. The general lesson is that the best search query at skill start
is often too broad once the task becomes specific.

Lite should not copy the GBrain or global learnings implementation.

Recommendation: add a local context refresh at meaningful phase boundaries:

- `gl-investigate`: after naming the root-cause hypothesis, re-read the original
  symptom and search recent changes/TODOs for the suspected component;
- `gl-qa`: before fixing an issue, re-read that issue's evidence and the affected
  component's tests and recent history;
- plan reviews: before writing the final report, re-read the resolved target and
  user decisions;
- long design workflows: before generating final artifacts, re-read approved
  feedback rather than relying on the opening brief.

This is context recovery without a memory subsystem.

### 9. Documentation coverage and diagram drift

Upstream v1.35 (`40e34deb`) introduced Diataxis-based documentation coverage and
architecture-diagram drift checks. A separate documentation skill is probably
too much for lite, but the checks are useful inside existing workflows.

Recommendation:

- `gl-plan-eng-review`: require the plan to say which user-facing, operational,
  reference, and architectural docs change;
- `gl-review`: flag touched public behavior with no matching docs update;
- `gl-review`: when code renames or removes entities named in nearby diagrams,
  verify those diagrams;
- keep this advisory unless the project itself marks documentation as required.

Do not import the full document generation/release pipeline.

### 10. Project-aware routing and first-use guidance

Upstream v1.58.5 (`938fa4a0`) replaced a browser-heavy top-level entry point with
a router and a project-aware first-run suggestion.

Lite's README currently lists skill names but gives little guidance about which
one to start with.

Recommendation: start with documentation, not activation state.

- Add a compact "start here" matrix to the README:
  idea -> `gl-office-hours`;
  plan -> CEO/eng/design review;
  bug -> investigate or quick-fix;
  branch ready -> review;
  site ready -> QA;
  visual exploration -> design variants/shotgun.
- Improve descriptions where two skills overlap, especially
  `gl-investigate` vs `gl-quick-fix`, `gl-qa` vs `gl-qa-only`, and
  `gl-design-variants` vs `gl-design-shotgun`.
- Consider a tiny `gl-help` router only if documentation proves insufficient.

Do not add activation markers, telemetry, onboarding hooks, or a daemon.

### 11. Fail closed around destructive operations

Upstream's June safety fixes and July commit `ea648b7d` repeatedly addressed
guards that reported success while doing nothing, compound recursive deletes,
unsafe cleanup targets, and actions whose target could not be proven.

Lite's shared preamble currently says to ask before destructive operations, which
is necessary but not sufficient.

Recommendation: strengthen the common safety contract:

- resolve and display the exact target before asking;
- do not use unresolved variables, broad globs, `$HOME`, `~`, `/`, or the repo
  root as recursive-delete targets;
- for temporary cleanup, require proof that the workflow created the directory,
  preferably an ownership marker or a just-created `mktemp` path;
- treat compound commands conservatively if any segment is destructive;
- if classification or target resolution fails, refuse rather than warn-and-run;
- prefer recoverable moves to trash where practical.

This belongs in the shared lite preamble and validation tests. It does not
require importing `/careful`, shell hooks, or full-gstack safety infrastructure.

### 12. One browser runtime for rendering and QA

Upstream v1.57.8 made `browse` the canonical Chromium for local HTML rendering,
including write-to-file output, and told skills not to bundle separate Puppeteer
installations.

Lite already uses the standalone `gstack-browser` package as an optional shared
runtime. The principle is aligned.

Recommendation:

- keep design and QA skills on the shared browser when it is available;
- avoid adding skill-specific browser dependencies;
- document local render commands only when the lite npm package supports them;
- retain native-tool and written fallbacks.

Do not copy upstream command documentation ahead of runtime support.

## Recommended change set

### P0: correctness and evidence

#### A. Normalize `gl-review` around one merge-base diff

Files:

- `skills/review/SKILL.md.tmpl`
- generated `skills/review/SKILL.md`
- a new deterministic git-fixture test

Acceptance:

- every file-state review pass uses the same `DIFF_BASE`;
- uncommitted changes are included;
- base-only changes after branch creation are excluded;
- commit-history queries are explicitly separate.

#### B. Add the motivating-evidence gate

Files:

- `skills/review/SKILL.md.tmpl`
- `skills/cso/SKILL.md.tmpl`
- static negative-fixture tests

Acceptance:

- a 7+ confidence finding cannot omit a file/line and motivating evidence;
- runtime findings can substitute reproducible output or visual evidence;
- unsupported findings move to an appendix.

#### C. Make plan completion unambiguous

Files:

- shared lite preamble generator;
- plan CEO, eng, and design templates;
- generator tests.

Acceptance:

- 5+ options are split, never trimmed;
- each final report has exactly one clean/open unresolved status;
- unresolved items are never silently defaulted;
- recommendations explain a comparative tradeoff.

### P1: behavioral quality

#### D. Add a skill-contract test harness

Build the free static/negative tier first. Add the real-agent tier only as an
opt-in periodic suite after the transcript contract is stable.

#### E. Add normalized implementation tasks

Start with `gl-plan-eng-review`, then apply the same schema to CEO and design
reviews once it proves useful.

#### F. Pilot on-demand sections

Pilot `gl-plan-eng-review`. Do not carve another skill until the pilot has:

- cross-host installation coverage;
- union completeness;
- ordering checks;
- a real-agent section-read proof;
- a measured token/byte benefit.

### P2: workflow polish

#### G. Add phase-boundary context refreshes

Implement local re-reading and repo searches only. No memory service.

#### H. Add docs/diagram coverage to plan and PR review

Keep advisory by default and project-policy aware.

#### I. Improve README routing

Try a matrix before adding another skill.

#### J. Harden the shared destructive-action contract

Add exact-target, ownership, and fail-closed language plus static tests.

## Skill-by-skill application matrix

| Lite skill | Adopt now | Consider later | Avoid |
|---|---|---|---|
| `gl-review` | Merge-base diff, evidence gate, docs/diagram staleness | Optional outside voice | Full ship/release stack |
| `gl-plan-eng-review` | Target resolution, unresolved sentinel, implementation tasks | Sectioning pilot | Upstream's weaker TDD posture |
| `gl-plan-design-review` | Target resolution, unresolved sentinel | Sectioning after pilot | Mandatory mockups when tools are absent |
| `gl-plan-ceo-review` | Unresolved sentinel, normalized tasks | Sectioning after pilot | "Boil the Ocean" scope semantics |
| `gl-investigate` | Phase-boundary context refresh | Repo-local investigation summary | GBrain/global learnings |
| `gl-qa` | Component refresh, behavioral evidence | Optional transcript regression suite | Separate browser runtime |
| `gl-qa-only` | Evidence consistency with QA | Baseline comparison improvements | Any code mutation |
| `gl-cso` | Motivating-evidence gate, fail-closed safety | Sectioning | Telemetry/security dashboards |
| Design skills | Approved-feedback refresh, shared browser | Sectioning for the largest skills | Bundled Chromium/Puppeteer |
| All skills | Option overflow rule, behavior tests, exact completion status | Lightweight router | Host-specific hook maze |

## Changes not recommended for gstack-lite

The following upstream additions are valuable in full gstack but conflict with
lite's goals or repository instructions:

- telemetry, timeline logging, community dashboards;
- auto-upgrade hooks and migration machinery;
- GBrain sync, cross-machine memory, global decision stores;
- team/conductor hooks and host-global settings;
- deploy, ship, release, canary, and version-queue workflows;
- default-on paid or cross-model review;
- broad autoplan orchestration;
- iOS device infrastructure;
- browser stealth/proxy infrastructure unless independently needed by the
  standalone browser package;
- copying the new `/spec`, `/document-*`, `/retro`, or `/health` skills wholesale;
- renaming "Boil the Lake" to "Boil the Ocean";
- an unconditional first question when the user already supplied a clear target.

## Suggested implementation order

1. Fix `gl-review` diff semantics and add its deterministic regression test.
2. Add the motivating-evidence gate and negative tests.
3. Add unresolved-decision and option-overflow contracts to the shared preamble
   and plan reviews.
4. Build the free skill-contract test tier.
5. Add implementation-task handoff to `gl-plan-eng-review`.
6. Pilot sectioning on `gl-plan-eng-review`.
7. Add local context refresh and documentation/diagram checks.
8. Improve README routing and shared destructive-operation guidance.
9. Reassess whether any new skill is necessary after the existing ones are
   easier to discover and better tested.

This order front-loads correctness and testability. It also creates the safety
net needed before making structural changes to large skill files.

## Upstream evidence index

Key commits and releases consulted:

- `6d8908a5` — review from merge base;
- `2a517753` / v1.43.2 — pre-emission evidence gate for findings;
- `b512be71` — hard architectural fork and substantive recommendation reason;
- `30fe6bb1`, `7b4738bc` — ask/stop contract for plan reviews;
- `ea51b45e` — implementation-task handoff;
- `f5897704` — blocking plan exit gate;
- `1a4f0c9c` — task-shaped context refresh in long skills;
- `40e34deb` — Diataxis coverage and diagram drift;
- `22f8c7f4` — eval-first floor and size/cost budgets;
- `a6fb3172` — split 5+ options instead of dropping them;
- `cab774cc` — large-skill on-demand sectioning and guard tests;
- `54f94bec`, `1626d485` — mandatory unresolved-decisions status;
- `c7ae6320` — hermetic spawned-agent tests and prose decision fallback;
- `496ce802` — ask-first target gate;
- `938fa4a0` — project-aware first-use routing;
- `ea648b7d` — fail-closed compound recursive-delete handling.

Useful current upstream files:

- `CHANGELOG.md`
- `review/SKILL.md.tmpl` and generated `review/SKILL.md`
- `plan-eng-review/SKILL.md.tmpl`
- `plan-eng-review/sections/review-sections.md.tmpl`
- `scripts/resolvers/sections.ts`
- `test/helpers/carve-guards.ts`
- `test/carve-section-ordering.test.ts`
- `test/carve-section-loading.test.ts`
- `test/skill-e2e-plan.test.ts`
