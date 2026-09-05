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

## Progressive Disclosure References

- [Detailed review and completion flow](references/review-flow.md) - Read when the review reaches the detailed review passes.

STOP: Read `references/review-flow.md` now. Read when the review reaches the detailed review passes.

After reading it completely, resume at `## Eager Completion Invariant Gate` in this `SKILL.md`.

## Eager Completion Invariant Gate

Do not finish this skill until the detailed reference flow has been read and completed. Completion requires:

- all four engineering review passes, with every surfaced issue resolved through the Blocking User Question Protocol;
- confidence-calibrated findings and an explicit result for every blocking decision;
- the test coverage diagram and red-green test plan;
- the durable `plan.md` and concise `status.md` handoff;
- the semantic commit map;
- the final `GSTACK REVIEW REPORT`;
- an explicit unresolved-decisions result, including `None` when everything is resolved.
