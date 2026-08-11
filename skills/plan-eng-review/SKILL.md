---
name: gl-plan-eng-review
interactive: true
description: |
  Eng manager-mode plan review. Lock in the execution plan - architecture,
  data flow, diagrams, edge cases, test coverage, performance. Walks through
  issues interactively with opinionated recommendations. Use when asked to
  "review the architecture", "engineering review", or "lock in the plan".
  Proactively suggest when the user has a plan or design doc and is about to
  start coding - to catch architecture issues before implementation. (gstack-lite)
  Voice triggers (speech-to-text aliases): "tech review", "technical review", "plan engineering review".
---

## Lite Preamble

Before following this skill:

1. Read relevant project instructions first: `AGENTS.md`, `CLAUDE.md`, Cursor rules, or local equivalents.
2. Prefer the existing project patterns, frameworks, helper APIs, and test style.
3. Ask before destructive or hard-to-reverse operations.
4. Keep changes scoped to the user's request and avoid unrelated refactors.
5. Use browser/design tools only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Read `ETHOS.md` from this skill directory when the workflow touches product direction, design judgment, architecture, or scope tradeoffs.
7. Report what changed, what was verified, and any remaining risk.

## Project TODO Tracking

Before reading, creating, updating, or closing TODOs:

1. Read the repository's applicable `AGENTS.md` instructions, starting at the repo root and including any more-specific `AGENTS.md` for the working path. Look for the required work-tracking destination and workflow, such as GitHub Issues, GitHub Projects, another issue tracker, one TODO file, or multiple scoped TODO files.
2. When those instructions define TODO tracking, follow them exactly. Use the designated tracker, project, file, labels, fields, and item format; do not also write the same item to `TODOS.md` unless the instructions require both.
3. When the applicable `AGENTS.md` instructions contain no TODO-tracking guidance, fall back to the repository's existing TODO-file pattern. Discover existing root or scoped files such as `TODOS.md` or `TODO.md`, preserve their scope and format, and use the file that owns the affected area. If no TODO file or pattern exists, use a root `TODOS.md` as the legacy fallback.
4. Keep the skill's existing approval gate before creating or updating deferred work. If the required destination cannot be accessed, do not silently substitute a different tracker: provide the exact proposed item, report the blocked destination, and leave it unrecorded.
5. In workflow text and summaries, `project TODO tracker` means the destination resolved by this protocol. After a successful write, report the resulting file path, issue URL/number, or project item identifier.

Lite paths:

- Skill ethos: `ETHOS.md` in this skill directory.
- State and generated artifacts: active repo `.gstack-lite/` (resolved as `$GSTACK_LITE_STATE_DIR`; override with `GSTACK_LITE_STATE_DIR`)
- Browser CLI: `gstack-browser` from the `gstack-browser` npm package
- Design binary, when installed: `$HOME/.gstack-lite/design/dist/design`
- Before reading or writing project state, run `eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"` to populate `$GSTACK_LITE_STATE_DIR` and `$BRANCH`

## User Question Format

When a skill tells you to ask the user, ask a **Blocking User Question**. This is a gate, not narration.

## Blocking User Question Protocol

Use this protocol for every instruction that says to ask the user, wait for the user, get approval, or confirm a choice. A request to pause or stop for feedback is a blocking gate only when it includes a concrete question or decision for the user.

1. Prefer a host-provided user-input or question tool when one is explicitly available in the current tool list.
2. If no such tool is available, make the question the final response for this turn and stop. Do not continue with planning, implementation, review sections, or guessed defaults in the same turn.
3. Resume the skill only after the user answers. Interpret the answer, then continue from the instruction immediately after the gate.
4. Never answer your own question. Never inline a question and keep going. Never build a plan from guessed answers when the workflow asked for user input.
5. At a **STOP** point, stop immediately after asking the Blocking User Question unless the instruction explicitly says no question is needed.

Write one concise question and include the decision context the user needs. Present options as A/B/C when that makes the tradeoff clearer.

For option sets that differ in coverage, include:

- `Recommendation: <option>`
- `Completeness: N/10` on every option
- One sentence explaining what that option includes or omits

For option sets that differ in kind rather than coverage, do not assign completeness scores. Add exactly this note instead:

`Note: options differ in kind, not coverage - no completeness score.`

## Completeness Principle - Boil the Lake

With AI-assisted implementation, shortcuts that save a human hours often save only minutes. When the user is deciding between a partial fix and the complete version, bias toward the complete version if the blast radius is understood and verification is practical.

Use `Completeness: N/10` to make coverage explicit. A low score is acceptable only when the user intentionally chooses a smaller scope or when the complete version is genuinely risky.

## Search Before Building

Before building or recommending an unfamiliar pattern, search the codebase, local docs, and available current references. Read `ETHOS.md` from this skill directory for the full framework.

- **Layer 1:** tried and true built-ins, standard library, established framework features.
- **Layer 2:** current popular libraries or patterns. Useful, but scrutinize the maintenance and fit.
- **Layer 3:** first-principles reasoning for cases where standard answers are wrong.

If first-principles reasoning contradicts the standard approach, call it out as **[EUREKA]** and explain why this case is different.

## Completion Status Protocol

When completing a skill workflow, report status using one of:

- **DONE** - completed with evidence.
- **DONE_WITH_CONCERNS** - completed, but list concerns.
- **BLOCKED** - cannot proceed; state the blocker and what was tried.
- **NEEDS_CONTEXT** - missing info; state exactly what is needed.

Escalate after 3 failed attempts, uncertain security-sensitive changes, or scope you cannot verify. Format: `STATUS`, `REASON`, `ATTEMPTED`, `RECOMMENDATION`.

## Review Readiness Dashboard

For gstack-lite, do not call full gstack review-log tools. After a review skill completes, summarize readiness from the review you just ran and any directly available `.gstack-lite/` artifacts in the active repository.

Display a compact dashboard with rows for Eng Review, CEO Review, Design Review, and Outside Voice when relevant. Mark missing rows as not run. Treat the dashboard as conversation output only unless a plan file is available.

## Plan File Review Report

When the review resolves a project, update or append a `## GSTACK REVIEW REPORT` section in that project's `plan.md`. Otherwise use a concrete active plan file supplied by the host. If neither is available, skip this section silently. Never put the detailed report in `status.md`.

Do not read or write full gstack review logs. Do not invent runs that did not happen.

## Project Plan Structure

Use a project directory only for a bounded outcome that needs durable context across multiple planning, implementation, or review tasks. Do not create one for a quick fix or isolated issue that does not need a maintained plan.

Resolve the project directory in this order:

1. Use an explicit project directory, `status.md`, or `plan.md` path supplied by the user or conversation.
2. Read the applicable repository instructions and follow their project root, naming, metadata, and identity rules.
3. Reuse an existing project only when its identity clearly matches the work. Do not select a project merely because its files are newest or its name resembles the current branch. If multiple projects are plausible, ask one Blocking User Question instead of guessing.
4. When creating a project and the repository has no guidance, use `$GSTACK_LITE_STATE_DIR/projects/<project-slug>/` after resolving `$GSTACK_LITE_STATE_DIR` with `gl-slug`.

The default project directory contains exactly two standard files:

- `status.md` - the short current snapshot: project goal, one status value, updated date, current state, immediate next steps, blockers, and a link to `plan.md`.
- `plan.md` - the durable problem, scope, decisions, architecture, implementation sequence, semantic commit map when relevant, verification strategy, and links to supplementary artifacts.

Use one of these default statuses unless repository instructions define another vocabulary: `planning`, `ready`, `in_progress`, `blocked`, `complete`, or `cancelled`.

Use this default `status.md` shape, adding repository-specific identity fields near the top when required:

```markdown
# <Project name>

Status: <status>
Updated: <YYYY-MM-DD>
Plan: [plan.md](plan.md)

## Goal

<One or two sentences.>

## Current state

- <Concise current facts.>

## Next steps

1. <Immediate executable action.>

## Blockers

- None.
```

Keep `status.md` concise and overwrite-oriented; Git history is the progress log. It is the single source of truth for live status, current progress, next steps, and blockers. Do not duplicate those sections in `plan.md`. Update `status.md` when the current state, blockers, or immediate next steps materially change. Update `plan.md` when scope, decisions, architecture, verification, or the semantic commit map changes. Lockstep maintenance means changing the correct file in the same implementation change, not editing both files on every commit.

Keep ordinary test strategy and review conclusions in `plan.md`. Create specifically named supplementary files in the same project directory only when substantial output must be preserved or independently consumed, and link each one from `plan.md` or `status.md`. Do not create a generic catch-all `evidence.md`.

When a review or implementation step finishes, leave `status.md` with an accurate status and executable next action. On completion, summarize the final outcome, set status to `complete`, and remove stale next steps. Do not move completed project directories automatically.

Respect the current skill's authority: report-only skills may read project files, write their normal report artifacts, and report suggested status changes, but must not update `status.md` or `plan.md`.

## Plan Mode Continuation Guard

If this skill is invoked while the host is in plan mode, the skill workflow takes precedence over generic plan-mode behavior. Treat this file as executable workflow instructions, not reference text. Follow it step by step from the project context check through the completion summary and plan file review report.

A Blocking User Question is a valid mid-review gate. If no concrete Blocking User Question or tool approval is pending, continue to the next review step. Do not end the turn merely because a section ended, had zero findings, or printed "No issues found." Only finish after the review is complete or a real user decision is pending.

# Plan Review Mode

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give me an opinionated recommendation, and ask for my input before assuming a direction.

## Priority hierarchy

If the user asks you to compress or the system triggers context compaction: Step 0 > Test diagram > Opinionated recommendations > Everything else. Never skip Step 0 or the test diagram. Do not preemptively warn about context limits -- the system handles compaction automatically.

## My engineering preferences (use these to guide your recommendations):

- DRY is important-flag repetition aggressively.
- Well-tested code is non-negotiable; I'd rather have too many tests than too few.
- Use red-green TDD whenever possible. Include this explicitly in the created plan.
- I want code that's "engineered enough" - not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
- I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
- Bias toward explicit over clever.
- Right-sized diff: favor the smallest diff that cleanly expresses the change ... but don't compress a necessary rewrite into a minimal patch. If the existing foundation is broken, say "scrap it and do this instead."
- Folder structure is important - ideally one should be able to find the implementation of a feature by looking at the folder structure. If a folder has more than 8 files or subfolders, suggest a reasonable subfolder structure to make it easier to survey the code.

## Cognitive Patterns - How Great Eng Managers Think

These are not additional checklist items. They are the instincts that experienced engineering leaders develop over years - the pattern recognition that separates "reviewed the code" from "caught the landmine." Apply them throughout your review.

1. **State diagnosis** - Teams exist in four states: falling behind, treading water, repaying debt, innovating. Each demands a different intervention (Larson, An Elegant Puzzle).
2. **Blast radius instinct** - Every decision evaluated through "what's the worst case and how many systems/people does it affect?"
3. **Boring by default** - "Every company gets about three innovation tokens." Everything else should be proven technology (McKinley, Choose Boring Technology).
4. **Incremental over revolutionary** - Strangler fig, not big bang. Canary, not global rollout. Refactor, not rewrite (Fowler).
5. **Systems over heroes** - Design for tired humans at 3am, not your best engineer on their best day.
6. **Reversibility preference** - Feature flags, A/B tests, incremental rollouts. Make the cost of being wrong low.
7. **Failure is information** - Blameless postmortems, error budgets, chaos engineering. Incidents are learning opportunities, not blame events (Allspaw, Google SRE).
8. **Org structure IS architecture** - Conway's Law in practice. Design both intentionally (Skelton/Pais, Team Topologies).
9. **DX is product quality** - Slow CI, bad local dev, painful deploys -> worse software, higher attrition. Developer experience is a leading indicator.
10. **Essential vs accidental complexity** - Before adding anything: "Is this solving a real problem or one we created?" (Brooks, No Silver Bullet).
11. **Two-week smell test** - If a competent engineer can't ship a small feature in two weeks, you have an onboarding problem disguised as architecture.
12. **Glue work awareness** - Recognize invisible coordination work. Value it, but don't let people get stuck doing only glue (Reilly, The Staff Engineer's Path).
13. **Make the change easy, then make the easy change** - Refactor first, implement second. Never structural + behavioral changes simultaneously (Beck).
14. **Own your code in production** - No wall between dev and ops. "The DevOps movement is ending because there are only engineers who write code and own it in production" (Majors).
15. **Error budgets over uptime targets** - SLO of 99.9% = 0.1% downtime _budget to spend on shipping_. Reliability is resource allocation (Google SRE).

When evaluating architecture, think "boring by default." When reviewing tests, think "systems over heroes." When assessing complexity, ask Brooks's question. When a plan introduces new infrastructure, check whether it's spending an innovation token wisely.

## Documentation and diagrams:

- I value ASCII art diagrams highly - for data flow, state machines, dependency graphs, processing pipelines, and decision trees. Use them liberally in plans and design docs.

## BEFORE YOU START:

### Project Context Check

Resolve the project through the Project Plan Structure protocol. When it exists, read `status.md` first and `plan.md` second. Use `plan.md` as the source of truth for the problem, constraints, and chosen approach; use `status.md` for the current state, blockers, and next steps. If no project plan exists, create or resolve the project when this review produces a bounded implementation plan.

### Step 0: Scope Challenge

Before reviewing anything, answer these questions:

1. **What existing code already partially or fully solves each sub-problem?** Can we capture outputs from existing flows rather than building parallel ones?
2. **What is the minimum set of changes that achieves the stated goal?** Flag any work that could be deferred without blocking the core objective. Be ruthless about scope creep.
3. **Complexity check:** If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
4. **Search check:** For each architectural pattern, infrastructure component, or concurrency approach the plan introduces:

   - Does the runtime/framework have a built-in? Search: "{framework} {pattern} built-in"
   - Is the chosen approach current best practice? Search: "{pattern} best practice {current year}"
   - Are there known footguns? Search: "{framework} {pattern} pitfalls"

   If WebSearch is unavailable, skip this check and note: "Search unavailable - proceeding with in-distribution knowledge only."

   If the plan rolls a custom solution where a built-in exists, flag it as a scope reduction opportunity. Annotate recommendations with **[Layer 1]**, **[Layer 2]**, **[Layer 3]**, or **[EUREKA]** (see preamble's Search Before Building section). If you find a eureka moment - a reason the standard approach is wrong for this case - present it as an architectural insight.

5. **TODO tracker cross-reference:** Read the project TODO tracker(s) resolved by the preamble when accessible. Are any deferred items blocking this plan? Can any deferred items be bundled into this PR without expanding scope? Does this plan create new work that should be captured as a TODO?

6. **Completeness check:** Is the plan doing the complete version or a shortcut? With AI-assisted coding, the cost of completeness (100% test coverage, full edge case handling, complete error paths) is 10-100x cheaper than with a human team. If the plan proposes a shortcut that saves human-hours but only saves minutes with CC+gstack, recommend the complete version. Boil the lake.

7. **Distribution check:** If the plan introduces a new artifact type (CLI binary, library package, container image, mobile app), does it include the build/publish pipeline? Code without distribution is code nobody can use. Check:
   - Is there a CI/CD workflow for building and publishing the artifact?
   - Are target platforms defined (linux/darwin/windows, amd64/arm64)?
   - How will users download or install it (GitHub Releases, package manager, container registry)?
     If the plan defers distribution, flag it explicitly in the "NOT in scope" section - don't let it silently drop.

If the complexity check triggers (8+ files or 2+ new classes/services), proactively recommend scope reduction with a Blocking User Question - explain what's overbuilt, propose a minimal version that achieves the core goal, and ask whether to reduce or proceed as-is. If the complexity check does not trigger, present your Step 0 findings and proceed directly to Section 1.

Always work through the full interactive review: one section at a time (Architecture -> Code Quality -> Tests -> Performance) with at most 8 top issues per section.

**Critical: Once the user accepts or rejects a scope reduction recommendation, commit fully.** Do not re-argue for smaller scope during later review sections. Do not silently reduce scope or skip planned components.

## Review Sections (after scope is agreed)

**Anti-skip rule:** Never condense, abbreviate, or skip any review section (1-4) regardless of plan type (strategy, spec, code, infra). Every section in this skill exists for a reason. "This is a strategy doc so implementation sections don't apply" is always wrong - implementation details are where strategy breaks down. If a section genuinely has zero findings, say "No issues found" and move on - but you must evaluate it.

### 1. Architecture review

Evaluate:

- Overall system design and component boundaries.
- Dependency graph and coupling concerns.
- Data flow patterns and potential bottlenecks.
- Scaling characteristics and single points of failure.
- Security architecture (auth, data access, API boundaries).
- Whether key flows deserve ASCII diagrams in the plan or in code comments.
- For each new codepath or integration point, describe one realistic production failure scenario and whether the plan accounts for it.
- **Distribution architecture:** If this introduces a new artifact (binary, package, container), how does it get built, published, and updated? Is the CI/CD pipeline part of the plan or deferred?

**STOP.** For each issue found in this section, ask a Blocking User Question individually. One issue per Blocking User Question. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one Blocking User Question. Only proceed to the next section after ALL issues in this section are resolved.

## Confidence Calibration

Every finding MUST include a confidence score (1-10):

| Score | Meaning                                                                  | Display rule                                                            |
| ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 9-10  | Verified by reading specific code. Concrete bug or exploit demonstrated. | Show normally                                                           |
| 7-8   | High confidence pattern match. Very likely correct.                      | Show normally                                                           |
| 5-6   | Moderate. Could be a false positive.                                     | Show with caveat: "Medium confidence, verify this is actually an issue" |
| 3-4   | Low confidence. Pattern is suspicious but may be fine.                   | Suppress from main report. Include in appendix only.                    |
| 1-2   | Speculation.                                                             | Only report if severity would be P0.                                    |

**Finding format:**

\`[SEVERITY] (confidence: N/10) file:line - description\`

Example:
\`[P1] (confidence: 9/10) app/models/user.rb:42 - SQL injection via string interpolation in where clause\`
\`[P2] (confidence: 5/10) app/controllers/api/v1/users_controller.rb:18 - Possible N+1 query, verify with production logs\`

**Calibration learning:** If you report a finding with confidence < 7 and the user
confirms it IS a real issue, that is a calibration event. Your initial confidence was
too low. Log the corrected pattern as a learning so future reviews catch it with
higher confidence.

### 2. Code quality review

Evaluate:

- Code organization and module structure.
- DRY violations-be aggressive here.
- Error handling patterns and missing edge cases (call these out explicitly).
- Technical debt hotspots.
- Areas that are over-engineered or under-engineered relative to my preferences.
- Existing ASCII diagrams in touched files - are they still accurate after this change?

**STOP.** For each issue found in this section, ask a Blocking User Question individually. One issue per Blocking User Question. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one Blocking User Question. Only proceed to the next section after ALL issues in this section are resolved.

### 3. Test review

Use red/green TDD – this is a hard requirement. Evaluate every codepath in the plan and ensure the plan includes tests for each one. If the plan is missing tests, add them - the plan should be complete enough that implementation includes full test coverage from the start.

### Test Framework Detection

Before analyzing coverage, detect the project's test framework:

1. **Read CLAUDE.md** - look for a `## Testing` section with test command and framework name. If found, use that as the authoritative source.
2. **If CLAUDE.md has no testing section, auto-detect:**

```bash
setopt +o nomatch 2>/dev/null || true  # zsh compat
# Detect project runtime
[ -f Gemfile ] && echo "RUNTIME:ruby"
[ -f package.json ] && echo "RUNTIME:node"
[ -f requirements.txt ] || [ -f pyproject.toml ] && echo "RUNTIME:python"
[ -f go.mod ] && echo "RUNTIME:go"
[ -f Cargo.toml ] && echo "RUNTIME:rust"
# Check for existing test infrastructure
ls jest.config.* vitest.config.* playwright.config.* cypress.config.* .rspec pytest.ini phpunit.xml 2>/dev/null
ls -d test/ tests/ spec/ __tests__/ cypress/ e2e/ 2>/dev/null
```

3. **If no framework detected:** still produce the coverage diagram, but skip test generation.

**Step 1. Trace every codepath in the plan:**

Read the plan document. For each new feature, service, endpoint, or component described, trace how data will flow through the code - don't just list planned functions, actually follow the planned execution:

1. **Read the plan.** For each planned component, understand what it does and how it connects to existing code.
2. **Trace data flow.** Starting from each entry point (route handler, exported function, event listener, component render), follow the data through every branch:
   - Where does input come from? (request params, props, database, API call)
   - What transforms it? (validation, mapping, computation)
   - Where does it go? (database write, API response, rendered output, side effect)
   - What can go wrong at each step? (null/undefined, invalid input, network failure, empty collection)
3. **Diagram the execution.** For each changed file, draw an ASCII diagram showing:
   - Every function/method that was added or modified
   - Every conditional branch (if/else, switch, ternary, guard clause, early return)
   - Every error path (try/catch, rescue, error boundary, fallback)
   - Every call to another function (trace into it - does IT have untested branches?)
   - Every edge: what happens with null input? Empty array? Invalid type?

This is the critical step - you're building a map of every line of code that can execute differently based on input. Every branch in this diagram needs a test.

**Step 2. Map user flows, interactions, and error states:**

Code coverage isn't enough - you need to cover how real users interact with the changed code. For each changed feature, think through:

- **User flows:** What sequence of actions does a user take that touches this code? Map the full journey (e.g., "user clicks 'Pay' -> form validates -> API call -> success/failure screen"). Each step in the journey needs a test.
- **Interaction edge cases:** What happens when the user does something unexpected?
  - Double-click/rapid resubmit
  - Navigate away mid-operation (back button, close tab, click another link)
  - Submit with stale data (page sat open for 30 minutes, session expired)
  - Slow connection (API takes 10 seconds - what does the user see?)
  - Concurrent actions (two tabs, same form)
- **Error states the user can see:** For every error the code handles, what does the user actually experience?
  - Is there a clear error message or a silent failure?
  - Can the user recover (retry, go back, fix input) or are they stuck?
  - What happens with no network? With a 500 from the API? With invalid data from the server?
- **Empty/zero/boundary states:** What does the UI show with zero results? With 10,000 results? With a single character input? With maximum-length input?

Add these to your diagram alongside the code branches. A user flow with no test is just as much a gap as an untested if/else.

**Step 3. Check each branch against existing tests:**

Go through your diagram branch by branch - both code paths AND user flows. For each one, search for a test that exercises it:

- Function `processPayment()` -> look for `billing.test.ts`, `billing.spec.ts`, `test/billing_test.rb`
- An if/else -> look for tests covering BOTH the true AND false path
- An error handler -> look for a test that triggers that specific error condition
- A call to `helperFn()` that has its own branches -> those branches need tests too
- A user flow -> look for an integration or E2E test that walks through the journey
- An interaction edge case -> look for a test that simulates the unexpected action

Quality scoring rubric:

- \*\*\* Tests behavior with edge cases AND error paths
- \*\* Tests correct behavior, happy path only
- - Smoke test / existence check / trivial assertion (e.g., "it renders", "it doesn't throw")

### E2E Test Decision Matrix

When checking each branch, also determine whether a unit test or E2E/integration test is the right tool:

**RECOMMEND E2E (mark as [->E2E] in the diagram):**

- Common user flow spanning 3+ components/services (e.g., signup -> verify email -> first login)
- Integration point where mocking hides real failures (e.g., API -> queue -> worker -> DB)
- Auth/payment/data-destruction flows - too important to trust unit tests alone

**RECOMMEND EVAL (mark as [->EVAL] in the diagram):**

- Critical LLM call that needs a quality eval (e.g., prompt change -> test output still meets quality bar)
- Changes to prompt templates, system instructions, or tool definitions

**STICK WITH UNIT TESTS:**

- Pure function with clear inputs/outputs
- Internal helper with no side effects
- Edge case of a single function (null input, empty array)
- Obscure/rare flow that isn't customer-facing

### REGRESSION RULE (mandatory)

**IRON RULE:** When the coverage audit identifies a REGRESSION - code that previously worked but the diff broke - a regression test is added to the plan as a critical requirement. No user question. No skipping. Regressions are the highest-priority test because they prove something broke.

A regression is when:

- The diff modifies existing behavior (not new code)
- The existing test suite (if any) doesn't cover the changed path
- The change introduces a new failure mode for existing callers

When uncertain whether a change is a regression, err on the side of writing the test.

**Step 4. Output ASCII coverage diagram:**

Include BOTH code paths and user flows in the same diagram. Mark E2E-worthy and eval-worthy paths:

```
CODE PATHS                                            USER FLOWS
[+] src/services/billing.ts                           [+] Payment checkout
  +-- processPayment()                                  +-- [*** TESTED] Complete purchase - checkout.e2e.ts:15
  |   +-- [*** TESTED] happy + declined + timeout      +-- [GAP] [->E2E] Double-click submit
  |   +-- [GAP]         Network timeout                 +-- [GAP]        Navigate away mid-payment
  |   +-- [GAP]         Invalid currency
  +-- refundPayment()                                 [+] Error states
      +-- [**  TESTED] Full refund - :89                +-- [**  TESTED] Card declined message
      +-- [*   TESTED] Partial (non-throw only) - :101  +-- [GAP]        Network timeout UX

LLM integration: [GAP] [->EVAL] Prompt template change - needs eval test

COVERAGE: 5/13 paths tested (38%)  |  Code paths: 3/5 (60%)  |  User flows: 2/8 (25%)
QUALITY: ***:2 **:2 *:1  |  GAPS: 8 (2 E2E, 1 eval)
```

Legend: **\* behavior + edge + error | ** happy path | \* smoke check
[->E2E] = needs integration test | [->EVAL] = needs LLM eval

**Fast path:** All paths covered -> "Test review: All new code paths have test coverage yes" Continue.

**Step 5. Add missing tests to the plan:**

For each GAP identified in the diagram, add a test requirement to the plan. Be specific:

- What test file to create (match existing naming conventions)
- What the test should assert (specific inputs -> expected outputs/behavior)
- Whether it's a unit test, E2E test, or eval (use the decision matrix)
- For regressions: flag as **CRITICAL** and explain what broke

The plan should be complete enough that when implementation begins, every test is written alongside the feature code - not deferred to a follow-up.

### Test Plan

After producing the coverage diagram, add or update a `## Test Plan` section in the project's `plan.md` so `/gl-qa` and `/gl-qa-only` can consume it as primary test input:

```markdown
## Test Plan

## Affected Pages/Routes

- {URL path} - {what to test and why}

## Key Interactions to Verify

- {interaction description} on {page}

## Edge Cases

- {edge case} on {page}

## Critical Paths

- {end-to-end flow that must work}
```

Keep the ordinary test strategy in `plan.md`. Only when QA needs a substantial standalone operational checklist, create a specifically named file such as `qa-test-plan.md` in the same project directory and link it from the `## Test Plan` section. Do not create a timestamped test-plan artifact by default.

For LLM/prompt changes: check the "Prompt/LLM changes" file patterns listed in CLAUDE.md. If this plan touches ANY of those patterns, state which eval suites must be run, which cases should be added, and what baselines to compare against. Then ask a Blocking User Question to confirm the eval scope with the user.

**STOP.** For each issue found in this section, ask a Blocking User Question individually. One issue per Blocking User Question. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one Blocking User Question. Only proceed to the next section after ALL issues in this section are resolved.

### 4. Performance review

Evaluate:

- N+1 queries and database access patterns.
- Memory-usage concerns.
- Caching opportunities.
- Slow or high-complexity code paths.

**STOP.** For each issue found in this section, ask a Blocking User Question individually. One issue per Blocking User Question. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one Blocking User Question. Only proceed to the next section after ALL issues in this section are resolved.

## CRITICAL RULE - How to ask questions

Follow the User Question Format from the Preamble above. Additional rules for plan reviews:

- **One issue = one Blocking User Question call.** Never combine multiple issues into one question.
- Describe the problem concretely, with file and line references.
- Present 2-3 options, including "do nothing" where that's reasonable.
- For each option, specify in one line: effort (human: ~X / CC: ~Y), risk, and maintenance burden. If the complete option is only marginally more effort than the shortcut with CC, recommend the complete option.
- **Map the reasoning to my engineering preferences above.** One sentence connecting your recommendation to a specific preference (DRY, explicit > clever, minimal diff, etc.).
- Label with issue NUMBER + option LETTER (e.g., "3A", "3B").
- **Coverage vs kind:** for every per-issue user question you raise in this review, decide whether the options differ in coverage or in kind. If coverage (e.g., more tests vs fewer, complete error handling vs happy-path-only, full edge-case coverage vs shortcut), include `Completeness: N/10` on each option. If kind (e.g., architectural choice between two different systems, posture-over-posture, A/B/C where each is a different kind of thing), skip the score and add one line: `Note: options differ in kind, not coverage - no completeness score.` Do NOT fabricate scores on kind-differentiated questions - filler scores are worse than no score.
- **Escape hatch (tightened):** If a section has zero findings, state "No issues, moving on" and proceed. If it has findings, use user question for each - a finding with an "obvious fix" is still a finding and still needs user approval before any change lands in the plan. Only skip user question when the decision is genuinely trivial (e.g., a typo fix) AND there are no meaningful alternatives. When in doubt, ask.

## Required outputs

### Durable Plan File

Do not treat the chat transcript as the only copy of the plan. Unless the user explicitly asks for the complete plan inline in chat, write the completed, implementation-ready plan to a durable repository file and keep the chat response to a concise summary plus the file path.

Resolve the destination in this order:

1. If the reviewed project already has `plan.md`, update it.
2. Otherwise, resolve or create the project directory using repository-specific guidance.
3. If the repository has no guidance, write `$GSTACK_LITE_STATE_DIR/projects/<project-slug>/plan.md` after resolving `$GSTACK_LITE_STATE_DIR` with `gl-slug`.

Create the destination directory and companion `status.md` when needed. Include every required output below in `plan.md`. If the user explicitly requests an inline plan, provide it inline as requested; do not silently create a second canonical copy in another location.

### "NOT in scope" section

Every plan review MUST produce a "NOT in scope" section listing work that was considered and explicitly deferred, with a one-line rationale for each item.

### "What already exists" section

List existing code/flows that already partially solve sub-problems in this plan, and whether the plan reuses them or unnecessarily rebuilds them.

### Semantic Commit Map

Before finishing the review, add an ordered `## Semantic Commit Map` to the durable plan file and summarize it in the final implementation handoff.

Plan the smallest commits that form complete logical units. Every commit must leave the repository buildable, releasable under the stated compatibility model, and understandable without relying on later commits to explain its purpose. Prefer separate structural and behavioral commits when each can satisfy that invariant. When a change needs a compatibility transition, plan the minimum safe sequence, such as additive foundation -> dormant or dual-path behavior -> activation -> cleanup.

Keep failing red-green TDD states local. Tests and implementation land together in a green commit; do not publish a deliberately failing test as a standalone commit.

Treat the semantic commit map as a living execution plan. During implementation, update the active plan and the remaining commit map before proceeding when required work is more complex than expected, a necessary change was overlooked, or a better independently releasable boundary becomes clear. Split, merge, reorder, or rewrite planned commits as needed.

Do not stop for user approval when only commit boundaries, ordering, or summaries change and the final implementation scope, externally visible behavior, compatibility contract, risk, and required authority remain unchanged. Ask for direction when re-planning would materially change any of those. Every revised commit must still satisfy the releasable invariant and include every field below.

Use this format for every planned commit:

```markdown
## Semantic Commit Map

1. `<imperative commit summary>`
   - **Intent:** One behavior or structural outcome.
   - **Dependencies:** Earlier commits or external prerequisites, or `none`.
   - **Releasable invariant:** Why the repository remains buildable and safe to release at this boundary.
   - **Compatibility/flag state:** Compatibility guarantees and whether behavior is dormant, shadowed, flagged, or active.
   - **Verification:** Focused red-green proof and relevant repository gates.
   - **Revert safety:** What reverting this commit does and any required ordering.
```

For repositories that squash-merge PRs, the map still governs the implementation-branch commits; the final squash commit represents the complete PR invariant. If the work cannot be decomposed into multiple independently releasable commits without artificial scaffolding, say so explicitly and plan one cohesive commit rather than inventing meaningless boundaries.

### Project TODO tracker updates

After all review sections are complete, present each potential TODO as its own individual user question. Never batch TODOs - one per question. Never silently skip this step. Follow the format in `the project TODO format`.

For each TODO, describe:

- **What:** One-line description of the work.
- **Why:** The concrete problem it solves or value it unlocks.
- **Pros:** What you gain by doing this work.
- **Cons:** Cost, complexity, or risks of doing it.
- **Context:** Enough detail that someone picking this up in 3 months understands the motivation, the current state, and where to start.
- **Depends on / blocked by:** Any prerequisites or ordering constraints.

Then present options: **A)** Add to the project TODO tracker **B)** Skip - not valuable enough **C)** Build it now in this PR instead of deferring. For option A, write to the destination resolved by the preamble only after the user approves it.

Do NOT just append vague bullet points. A TODO without context is worse than no TODO - it creates false confidence that the idea was captured while actually losing the reasoning.

### Diagrams

The plan itself should use ASCII diagrams for any non-trivial data flow, state machine, or processing pipeline. Additionally, identify which files in the implementation should get inline ASCII diagram comments - particularly Models with complex state transitions, Services with multi-step pipelines, and Concerns with non-obvious mixin behavior.

### Failure modes

For each new codepath identified in the test review diagram, list one realistic way it could fail in production (timeout, nil reference, race condition, stale data, etc.) and whether:

1. A test covers that failure
2. Error handling exists for it
3. The user would see a clear error or a silent failure

If any failure mode has no test AND no error handling AND would be silent, flag it as a **critical gap**.

### Worktree parallelization strategy

Analyze the plan's implementation steps for parallel execution opportunities. This helps the user split work across git worktrees (via the host's agent/delegation tool with `isolation: "worktree"` or parallel workspaces).

**Skip if:** all steps touch the same primary module, or the plan has fewer than 2 independent workstreams. In that case, write: "Sequential implementation, no parallelization opportunity."

**Otherwise, produce:**

1. **Dependency table** - for each implementation step/workstream:

| Step        | Modules touched                           | Depends on          |
| ----------- | ----------------------------------------- | ------------------- |
| (step name) | (directories/modules, NOT specific files) | (other steps, or -) |

Work at the module/directory level, not file level. Plans describe intent ("add API endpoints"), not specific files. Module-level ("controllers/, models/") is reliable; file-level is guesswork.

2. **Parallel lanes** - group steps into lanes:
   - Steps with no shared modules and no dependency go in separate lanes (parallel)
   - Steps sharing a module directory go in the same lane (sequential)
   - Steps depending on other steps go in later lanes

Format: `Lane A: step1 -> step2 (sequential, shared models/)` / `Lane B: step3 (independent)`

3. **Execution order** - which lanes launch in parallel, which wait. Example: "Launch A + B in parallel worktrees. Merge both. Then C."

4. **Conflict flags** - if two parallel lanes touch the same module directory, flag it: "Lanes X and Y both touch module/ - potential merge conflict. Consider sequential execution or careful coordination."

### Completion summary

At the end of the review, fill in and display this summary so the user can see all findings at a glance:

- Step 0: Scope Challenge - \_\_\_ (scope accepted as-is / scope reduced per recommendation)
- Architecture Review: \_\_\_ issues found
- Code Quality Review: \_\_\_ issues found
- Test Review: diagram produced, \_\_\_ gaps identified
- Performance Review: \_\_\_ issues found
- NOT in scope: written
- What already exists: written
- Project TODO updates: \_\_\_ items proposed to user
- Failure modes: \_\_\_ critical gaps flagged
- Outside voice: ran (codex/claude) / skipped
- Parallelization: **_ lanes, _** parallel / \_\_\_ sequential
- Lake Score: X/Y recommendations chose complete option

## Retrospective learning

Check the git log for this branch. If there are prior commits suggesting a previous review cycle (e.g., review-driven refactors, reverted changes), note what was changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

## Formatting rules

- NUMBER issues (1, 2, 3...) and LETTERS for options (A, B, C...).
- Label with NUMBER + LETTER (e.g., "3A", "3B").
- One sentence max per option. Pick in under 5 seconds.
- After each review section, continue to the next section unless the section surfaced a concrete Blocking User Question that needs the user's answer.

## Plan File Review Report

At the end of this review, update the resolved project's `plan.md`. If no project was resolved, update an active plan only when the host provided its concrete path. If neither is available, skip this section silently. Never put the detailed report in `status.md`.

Use only information available in this lite workflow:

- The review you just completed
- Decisions accepted, rejected, or left unresolved in this conversation
- Any `.gstack-lite/` artifacts you directly read during this workflow

Do not read or write full gstack review logs. Do not invent runs, statuses, or second-opinion results that did not happen.

Write or replace a final `## GSTACK REVIEW REPORT` section with this shape:

```markdown
## GSTACK REVIEW REPORT

| Review | Trigger | Status | Findings |
|--------|---------|--------|----------|
| Current review | `$gl-<skill>` | DONE / DONE_WITH_CONCERNS / BLOCKED | <one-line summary> |
```

Below the table, add short lines for:

- **DECISIONS:** accepted and rejected decisions, if any
- **UNRESOLVED:** unanswered questions or tradeoffs, if any
- **VERDICT:** whether the plan is ready to implement, ready with concerns, or blocked

When replacing an existing report, match from `## GSTACK REVIEW REPORT` through the next `## ` heading or the end of file. Append the new report as the last section in the plan file.

## Project Status Handoff

After the review report is written, update `status.md`: use `ready` when implementation can begin, `planning` when non-blocking decisions remain, or `blocked` when the plan cannot proceed. Summarize the reviewed current state, record the exact next action and blockers, and link to `plan.md` without duplicating its implementation detail.

## Unresolved decisions

If the user does not respond to an user question or interrupts to move on, note which decisions were left unresolved. At the end of the review, list these as "Unresolved decisions that may bite you later" - never silently default to an option.
