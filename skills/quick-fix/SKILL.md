---
name: gl-quick-fix
description: |
  Disciplined small-fix workflow. Use when the user has one or more issues
  expected to be small or obvious and wants Codex to think through each fix,
  implement simple low-risk fixes, and stop for confirmation when ambiguity,
  tradeoffs, or broader blast radius appear. Handles multiple issues
  sequentially. Use for "quick fix", "small bug", "minor cleanup", "fix these
  issues", and "should be simple" requests. Prefer /gl-investigate for unclear
  root-cause debugging, /gl-plan-eng-review for planned architecture review,
  and /gl-qa for full web QA. (gstack-lite)
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

# /gl-quick-fix - Think, Then Fix

Use this skill for small issue batches where speed matters but guesses are not
acceptable. The workflow is intentionally lighter than `/gl-investigate` and
`/gl-plan-eng-review`: do enough planning to avoid hacks, fix what is simple,
and escalate anything that is not simple.

## Core Rule

Do not patch symptoms. A quick fix is allowed only when the cause, invariant,
and verification path are clear.

If that bar is not met, stop and present options instead of guessing.

## Setup

1. Read the user's issue list and split it into numbered issues in the order given.
2. Check the worktree before editing:
   ```bash
   git status --short
   ```
3. If `.gstack-lite/freeze-dir.txt` exists, read it and keep edits inside that boundary unless the user explicitly widens scope.
4. Identify the smallest relevant file set with `rg`, `rg --files`, and targeted reads.
5. If the user's request includes production credentials, destructive operations, broad restores, force pushes, database deletion, or similar hard-to-reverse actions, ask for explicit confirmation before doing anything.

## Per-Issue Loop

Handle issues sequentially. Finish or escalate the current issue before moving
to the next one.

### 1. Frame

Write a one-line frame for the issue:

```text
Issue N: <symptom or requested change> -> likely area: <file/module/unknown>
```

If the issue is underspecified and cannot be located from the repo, ask one
concise question. Otherwise continue.

### 2. Inspect

Read only the code needed to answer:

- What behavior is wrong or missing?
- Where is the smallest responsible codepath?
- What existing pattern should this follow?
- What test or command would prove the fix?

For bug reports, reproduce when practical. For text, config, docs, or obvious
mechanical issues, reading the affected file may be enough.

### 3. Classify

Classify the issue before editing.

**SIMPLE** means all of these are true:

- The cause or desired invariant is clear.
- The intended behavior has no meaningful product or architecture tradeoff.
- The likely edit touches at most 2 production files, plus focused tests or docs.
- No schema migration, public API contract, auth boundary, concurrency model,
  data deletion, payment flow, or production resource is involved.
- A targeted verification command is available, or the change is clearly
  inspectable without a test runner.
- Confidence is at least 7/10 after reading the relevant code.

**NEEDS PLAN** means any of these are true:

- The cause is unclear after a bounded inspection.
- More than 2 production files need coordinated changes.
- There are multiple reasonable fixes with different tradeoffs.
- The issue touches security, authorization, persistence, migrations,
  concurrency, billing, production data, generated artifacts, or shared APIs.
- A larger refactor appears necessary to avoid a hack.
- Verification is unclear or would require a broader test strategy.
- The user-facing behavior is ambiguous.

**NEEDS INVESTIGATION** means it is a bug-like symptom without confirmed root
cause, the reproduction is unclear, or early hypotheses do not match the code.
Recommend `/gl-investigate` or switch into that deeper workflow if the user
confirms.

### 4. Act on the Classification

For **SIMPLE**:

1. State the cause and planned edit in 1-2 sentences.
2. Make the smallest clean change that fixes the root cause.
3. Add or update a focused regression test unless the change is docs-only,
   copy-only, or the repo has no practical test surface for it.
4. Run the narrowest meaningful verification first. Run broader checks when
   touching shared behavior.
5. If verification fails because the fix is wrong, keep investigating within
   the simple scope. If the fix expands beyond the SIMPLE criteria, stop and
   reclassify as NEEDS PLAN.

For **NEEDS PLAN**:

Do not edit files for that issue. Present a short decision brief:

```text
Issue N needs a plan.
Facts found: <specific files/behaviors observed>
Why this is not a quick fix: <blast radius/tradeoff/unknown>

Options:
A) <recommended approach> - effort, risk, verification
B) <smaller/safer alternative> - effort, risk, verification
C) Do nothing for now - consequence

Recommendation: <one sentence tied to right-sized diff, tests, or explicitness>
```

Ask the user which option to take, then stop. Do not continue to later issues
unless the user explicitly asked to skip complex issues and continue.

For **NEEDS INVESTIGATION**:

Do not guess. Report the evidence gathered, explain why root cause is not yet
confirmed, and recommend `/gl-investigate` with the current issue as input.

## Multi-Issue Rules

- Keep a queue table: issue, classification, status, files changed, verification.
- Do not batch unrelated fixes into one edit just because they are small.
- If one issue reveals the user's premise is wrong, say so and reclassify before editing.
- If later issues depend on a complex unresolved issue, stop and explain the dependency.
- If later issues are independent and the user already authorized "skip complex and continue", continue with the next issue.

## Testing Standard

Use test effort proportional to risk:

- Copy/docs/config typo: inspect the diff and run formatting or validation if present.
- Local logic: add or update a unit test and run that test file.
- Shared helper or API behavior: run the focused test plus the nearest package or workspace tests.
- UI behavior: run the focused test if present and use browser verification when the app must render to prove the fix.

If a meaningful test cannot be added, say why. Do not pretend inspection is a
regression test.

## Anti-Hack Gates

Stop and ask for confirmation when you catch yourself doing any of these:

- Changing code before identifying the responsible codepath.
- Adding special-case logic without naming the invariant it protects.
- Introducing a new abstraction for one small issue.
- Touching unrelated formatting or refactoring adjacent code.
- Silencing an error without defining what the user or operator sees.
- Skipping tests because the change "looks obvious" when a focused test exists.
- Expanding the fix after tests fail without reclassifying the issue.

## Report Format

After all handled issues are done, report:

```text
QUICK FIX REPORT
========================================
Issue 1: DONE | NEEDS PLAN | NEEDS INVESTIGATION
Classification: SIMPLE | NEEDS PLAN | NEEDS INVESTIGATION
Cause: <one sentence>
Change: <files and behavior changed>
Verification: <commands run and result>
Risk: <remaining concern or none>

Issue 2: ...
========================================
Summary: <N fixed, M need confirmation, K skipped>
```

Keep the final user response concise, but include any verification that failed
or could not be run.
