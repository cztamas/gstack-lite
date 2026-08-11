---
name: gl-review
description: |
  Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust
  boundary violations, conditional side effects, and other structural issues. Use when
  asked to "review this PR", "code review", "pre-landing review", or "check my diff".
  Proactively suggest when the user is about to merge or land code changes. (gstack-lite)
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

# Pre-Landing PR Review

You are running the `/gl-review` workflow. Analyze the current branch's diff against the base branch for structural issues that tests don't catch.

---

## Step 1: Check branch

1. Run `git branch --show-current` to get the current branch.
2. If on the base branch, output: **"Nothing to review - you're on the base branch or have no changes against it."** and stop.
3. Run `git fetch origin <base> --quiet && git diff origin/<base> --stat` to check if there's a diff. If no diff, output the same message and stop.

---

## Step 1.5: Scope Drift Detection

Before reviewing code quality, check: **did they build what was requested - nothing more, nothing less?**

1. Read the project TODO tracker(s) resolved by the preamble when accessible. Read PR description (`gh pr view --json body --jq .body 2>/dev/null || true`).
   Read commit messages (`git log origin/<base>..HEAD --oneline`).
   **If no PR exists:** rely on commit messages and the resolved project TODO tracker(s) for stated intent - this is the common case since /gl-review runs before /ship (full gstack only) creates the PR.
2. Identify the **stated intent** - what was this branch supposed to accomplish?
3. Run `git diff origin/<base>...HEAD --stat` and compare the files changed against the stated intent.

4. Evaluate with skepticism (incorporating plan completion results if available from an earlier step or adjacent section):

   **SCOPE CREEP detection:**
   - Files changed that are unrelated to the stated intent
   - New features or refactors not mentioned in the plan
   - "While I was in there..." changes that expand blast radius

   **MISSING REQUIREMENTS detection:**
   - Requirements from the project TODO tracker/PR description not addressed in the diff
   - Test coverage gaps for stated requirements
   - Partial implementations (started but not finished)

5. Output (before the main review begins):
   \`\`\`
   Scope Check: [CLEAN / DRIFT DETECTED / REQUIREMENTS MISSING]
   Intent: <1-line summary of what was requested>
   Delivered: <1-line summary of what the diff actually does>
   [If drift: list each out-of-scope change]
   [If missing: list each unaddressed requirement]
   \`\`\`

6. This is **INFORMATIONAL** - does not block the review. Proceed to the next step.

---

### Project Plan Discovery

Resolve the project through the Project Plan Structure protocol.

1. Prefer an explicit project directory, `status.md`, or `plan.md` path from the conversation.
2. Otherwise follow repository project-identity instructions.
3. Otherwise inspect the default `$GSTACK_LITE_STATE_DIR/projects/` root for an exact project or work-item match. Do not choose the newest plan or guess from branch-name similarity. If multiple projects plausibly match, ask one Blocking User Question.
4. Read `status.md` first to understand the current state and intended next action, then read `plan.md` for the full implementation intent.

**Error handling:**
- No project plan and no other intent source -> skip with "No project plan detected - skipping."
- Project files found but unreadable -> skip with "Project plan found but unreadable - skipping."
- `status.md` missing but a clearly relevant legacy plan exists -> use the plan for this read-only review and report the missing status file; do not create project state during review.

### Actionable Item Extraction

Read the plan file. Extract every actionable item - anything that describes work to be done. Look for:

- **Checkbox items:** `- [ ] ...` or `- [x] ...`
- **Numbered steps** under implementation headings: "1. Create ...", "2. Add ...", "3. Modify ..."
- **Imperative statements:** "Add X to Y", "Create a Z service", "Modify the W controller"
- **File-level specifications:** "New file: path/to/file.ts", "Modify path/to/existing.rb"
- **Test requirements:** "Test that X", "Add test for Y", "Verify Z"
- **Data model changes:** "Add column X to table Y", "Create migration for Z"

**Ignore:**
- Context/Background sections (`## Context`, `## Background`, `## Problem`)
- Questions and open items (marked with ?, "TBD", "TODO: decide")
- Review report sections (`## GSTACK REVIEW REPORT`)
- Explicitly deferred items ("Future:", "Out of scope:", "NOT in scope:", "P2:", "P3:", "P4:")
- CEO Review Decisions sections (these record choices, not work items)

**Cap:** Extract at most 50 items. If the plan has more, note: "Showing top 50 of N plan items - full list in plan file."

**No items found:** If the plan contains no extractable actionable items, skip with: "Plan file contains no actionable items - skipping completion audit."

For each item, note:
- The item text (verbatim or concise summary)
- Its category: CODE | TEST | MIGRATION | CONFIG | DOCS

### Cross-Reference Against Diff

Run `git diff origin/<base>...HEAD` and `git log origin/<base>..HEAD --oneline` to understand what was implemented.

For each extracted plan item, check the diff and classify:

- **DONE** - Clear evidence in the diff that this item was implemented. Cite the specific file(s) changed.
- **PARTIAL** - Some work toward this item exists in the diff but it's incomplete (e.g., model created but controller missing, function exists but edge cases not handled).
- **NOT DONE** - No evidence in the diff that this item was addressed.
- **CHANGED** - The item was implemented using a different approach than the plan described, but the same goal is achieved. Note the difference.

**Be conservative with DONE** - require clear evidence in the diff. A file being touched is not enough; the specific functionality described must be present.
**Be generous with CHANGED** - if the goal is met by different means, that counts as addressed.

### Output Format

```
PLAN COMPLETION AUDIT
===============================
Plan: {plan file path}

## Implementation Items
  [DONE]      Create UserService - src/services/user_service.rb (+142 lines)
  [PARTIAL]   Add validation - model validates but missing controller checks
  [NOT DONE]  Add caching layer - no cache-related changes in diff
  [CHANGED]   "Redis queue" -> implemented with Sidekiq instead

## Test Items
  [DONE]      Unit tests for UserService - test/services/user_service_test.rb
  [NOT DONE]  E2E test for signup flow

## Migration Items
  [DONE]      Create users table - db/migrate/20240315_create_users.rb

---------------------------------
COMPLETION: 4/7 DONE, 1 PARTIAL, 1 NOT DONE, 1 CHANGED
---------------------------------
```

### Fallback Intent Sources (when no plan file found)

When no plan file is detected, use these secondary intent sources:

1. **Commit messages:** Run `git log origin/<base>..HEAD --oneline`. Use judgment to extract real intent:
   - Commits with actionable verbs ("add", "implement", "fix", "create", "remove", "update") are intent signals
   - Skip noise: "WIP", "tmp", "squash", "merge", "chore", "typo", "fixup"
   - Extract the intent behind the commit, not the literal message
2. **Project TODO tracker:** When accessible, check for items related to this branch or recent dates
3. **PR description:** Run `gh pr view --json body -q .body 2>/dev/null` for intent context

**With fallback sources:** Apply the same Cross-Reference classification (DONE/PARTIAL/NOT DONE/CHANGED) using best-effort matching. Note that fallback-sourced items are lower confidence than plan-file items.

### Investigation Depth

For each PARTIAL or NOT DONE item, investigate WHY:

1. Check `git log origin/<base>..HEAD --oneline` for commits that suggest the work was started, attempted, or reverted
2. Read the relevant code to understand what was built instead
3. Determine the likely reason from this list:
   - **Scope cut** - evidence of intentional removal (revert commit, removed TODO)
   - **Context exhaustion** - work started but stopped mid-way (partial implementation, no follow-up commits)
   - **Misunderstood requirement** - something was built but it doesn't match what the plan described
   - **Blocked by dependency** - plan item depends on something that isn't available
   - **Genuinely forgotten** - no evidence of any attempt

Output for each discrepancy:
```
DISCREPANCY: {PARTIAL|NOT_DONE} | {plan item} | {what was actually delivered}
INVESTIGATION: {likely reason with evidence from git log / code}
IMPACT: {HIGH|MEDIUM|LOW} - {what breaks or degrades if this stays undelivered}
```

### Integration with Scope Drift Detection

The plan completion results augment the existing Scope Drift Detection. If a plan file is found:

- **NOT DONE items** become additional evidence for **MISSING REQUIREMENTS** in the scope drift report.
- **Items in the diff that don't match any plan item** become evidence for **SCOPE CREEP** detection.
- **HIGH-impact discrepancies** trigger Ask the user:
  - Show the investigation findings
  - Options: A) Stop and implement missing items, B) Ship anyway + create P1 items in the project TODO tracker, C) Intentionally dropped. If the user chooses B, record the items in the destination resolved by the preamble and report their identifiers.

This is **INFORMATIONAL** unless HIGH-impact discrepancies are found (then it gates with a Blocking User Question).

Update the scope drift output to include plan file context:

```
Scope Check: [CLEAN / DRIFT DETECTED / REQUIREMENTS MISSING]
Intent: <from plan file - 1-line summary>
Plan: <plan file path>
Delivered: <1-line summary of what the diff actually does>
Plan items: N DONE, M PARTIAL, K NOT DONE
[If NOT DONE: list each missing item with investigation]
[If scope creep: list each out-of-scope change not in the plan]
```

**No plan file found:** Use commit messages and the resolved project TODO tracker(s) as fallback sources (see above). If no intent sources at all, skip with: "No intent sources detected - skipping completion audit."

## Step 2: Read the checklist

Read `$HOME/.gstack-lite/review/checklist.md`.

**If the file cannot be read, STOP and report the error.** Do not proceed without the checklist.

---

## Step 2.5: Check for Greptile review comments

Read `$HOME/.gstack-lite/review/greptile-triage.md` and follow the fetch, filter, classify, and **escalation detection** steps.

**If no PR exists, `gh` fails, API returns an error, or there are zero Greptile comments:** Skip this step silently. Greptile integration is additive - the review works without it.

**If Greptile comments are found:** Store the classifications (VALID & ACTIONABLE, VALID BUT ALREADY FIXED, FALSE POSITIVE, SUPPRESSED) - you will need them in Step 5.

---

## Step 3: Get the diff

Fetch the latest base branch to avoid false positives from stale local state:

```bash
git fetch origin <base> --quiet
```

Run `git diff origin/<base>` to get the full diff. This includes both committed and uncommitted changes against the latest base branch.

## Step 3.4: Workspace-aware queue status (advisory)

Check whether this PR's claimed VERSION still points at a free slot in the queue. Advisory only - never blocks review; just informs the reviewer about landing-order risk.

```bash
BRANCH_VERSION=$(git show HEAD:VERSION 2>/dev/null | tr -d '\r\n[:space:]' || echo "")
BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)
BASE_VERSION=$(git show origin/$BASE_BRANCH:VERSION 2>/dev/null | tr -d '\r\n[:space:]' || echo "")
QUEUE_JSON=$(bun run bin/gstack-next-version \
  --base "$BASE_BRANCH" \
  --bump patch \
  --current-version "$BASE_VERSION" 2>/dev/null || echo '{"offline":true}')
NEXT_SLOT=$(echo "$QUEUE_JSON" | jq -r '.version // empty')
CLAIMED_COUNT=$(echo "$QUEUE_JSON" | jq -r '.claimed | length // 0')
OFFLINE=$(echo "$QUEUE_JSON" | jq -r '.offline // false')
```

- If `OFFLINE=true`: skip this section (no signal to report).
- Otherwise, include ONE line in the review output: `Version claimed: v<BRANCH_VERSION>. Queue: <CLAIMED_COUNT> PR(s) ahead. <VERDICT>` where VERDICT is either `Slot free` (if `BRANCH_VERSION >= NEXT_SLOT`) or `WARNING queue moved - rerun /ship (full gstack only) to reconcile v<BRANCH_VERSION> -> v<NEXT_SLOT>`.

---

## Step 3.5: Slop scan (advisory)

Run a slop scan on changed files to catch AI code quality issues (empty catches,
redundant `return await`, overcomplicated abstractions):

```bash
bun run slop:diff origin/<base> 2>/dev/null || true
```

If findings are reported, include them in the review output as an informational
diagnostic. Slop findings are advisory, never blocking. If slop:diff is not
available (e.g., slop-scan not installed), skip this step silently.

---

## Step 4: Critical pass (core review)

Apply the CRITICAL categories from the checklist against the diff:
SQL & Data Safety, Race Conditions & Concurrency, LLM Output Trust Boundary, Shell Injection, Enum & Value Completeness.

Also apply the remaining INFORMATIONAL categories that are still in the checklist (Async/Sync Mixing, Column/Field Name Safety, LLM Prompt Issues, Type Coercion, View/Frontend, Time Window Safety, Completeness Gaps, Distribution & CI/CD).

**Enum & Value Completeness requires reading code OUTSIDE the diff.** When the diff introduces a new enum value, status, tier, or type constant, use Grep to find all files that reference sibling values, then Read those files to check if the new value is handled. This is the one category where within-diff review is insufficient.

**Search-before-recommending:** When recommending a fix pattern (especially for concurrency, caching, auth, or framework-specific behavior):
- Verify the pattern is current best practice for the framework version in use
- Check if a built-in solution exists in newer versions before recommending a workaround
- Verify API signatures against current docs (APIs change between versions)

Takes seconds, prevents recommending outdated patterns. If WebSearch is unavailable, note it and proceed with in-distribution knowledge.

Follow the output format specified in the checklist. Respect the suppressions - do NOT flag items listed in the "DO NOT flag" section.

## Confidence Calibration

Every finding MUST include a confidence score (1-10):

| Score | Meaning | Display rule |
|-------|---------|-------------|
| 9-10 | Verified by reading specific code. Concrete bug or exploit demonstrated. | Show normally |
| 7-8 | High confidence pattern match. Very likely correct. | Show normally |
| 5-6 | Moderate. Could be a false positive. | Show with caveat: "Medium confidence, verify this is actually an issue" |
| 3-4 | Low confidence. Pattern is suspicious but may be fine. | Suppress from main report. Include in appendix only. |
| 1-2 | Speculation. | Only report if severity would be P0. |

**Finding format:**

\`[SEVERITY] (confidence: N/10) file:line - description\`

Example:
\`[P1] (confidence: 9/10) app/models/user.rb:42 - SQL injection via string interpolation in where clause\`
\`[P2] (confidence: 5/10) app/controllers/api/v1/users_controller.rb:18 - Possible N+1 query, verify with production logs\`

**Calibration learning:** If you report a finding with confidence < 7 and the user
confirms it IS a real issue, that is a calibration event. Your initial confidence was
too low. Log the corrected pattern as a learning so future reviews catch it with
higher confidence.

---

## Step 4.5: Review Army - Specialist Dispatch

### Detect stack and scope

```bash
source <($HOME/.gstack-lite/bin/gl-diff-scope <base> 2>/dev/null) || true
# Detect stack for specialist context
STACK=""
[ -f Gemfile ] && STACK="${STACK}ruby "
[ -f package.json ] && STACK="${STACK}node "
[ -f requirements.txt ] || [ -f pyproject.toml ] && STACK="${STACK}python "
[ -f go.mod ] && STACK="${STACK}go "
[ -f Cargo.toml ] && STACK="${STACK}rust "
echo "STACK: ${STACK:-unknown}"
DIFF_INS=$(git diff origin/<base> --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
DIFF_DEL=$(git diff origin/<base> --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
DIFF_LINES=$((DIFF_INS + DIFF_DEL))
echo "DIFF_LINES: $DIFF_LINES"
# Detect test framework for specialist test stub generation
TEST_FW=""
{ [ -f jest.config.ts ] || [ -f jest.config.js ]; } && TEST_FW="jest"
[ -f vitest.config.ts ] && TEST_FW="vitest"
{ [ -f spec/spec_helper.rb ] || [ -f .rspec ]; } && TEST_FW="rspec"
{ [ -f pytest.ini ] || [ -f conftest.py ]; } && TEST_FW="pytest"
[ -f go.mod ] && TEST_FW="go-test"
echo "TEST_FW: ${TEST_FW:-unknown}"
```

### Read specialist hit rates (adaptive gating)

```bash
```

### Select specialists

Based on the scope signals above, select which specialists to dispatch.

**Always-on (dispatch on every review with 50+ changed lines):**
1. **Testing** - read `$HOME/.gstack-lite/review/specialists/testing.md`
2. **Maintainability** - read `$HOME/.gstack-lite/review/specialists/maintainability.md`

**If DIFF_LINES < 50:** Skip all specialists. Print: "Small diff ($DIFF_LINES lines) - specialists skipped." Continue to Step 5.

**Conditional (dispatch if the matching scope signal is true):**
3. **Security** - if SCOPE_AUTH=true, OR if SCOPE_BACKEND=true AND DIFF_LINES > 100. Read `$HOME/.gstack-lite/review/specialists/security.md`
4. **Performance** - if SCOPE_BACKEND=true OR SCOPE_FRONTEND=true. Read `$HOME/.gstack-lite/review/specialists/performance.md`
5. **Data Migration** - if SCOPE_MIGRATIONS=true. Read `$HOME/.gstack-lite/review/specialists/data-migration.md`
6. **API Contract** - if SCOPE_API=true. Read `$HOME/.gstack-lite/review/specialists/api-contract.md`
7. **Design** - if SCOPE_FRONTEND=true. Use the existing design review checklist at `$HOME/.gstack-lite/review/design-checklist.md`

### Adaptive gating

After scope-based selection, apply adaptive gating based on specialist hit rates:

- If tagged `[GATE_CANDIDATE]` (0 findings in 10+ dispatches): skip it. Print: "[specialist] auto-gated (0 findings in N reviews)."
- If tagged `[NEVER_GATE]`: always dispatch regardless of hit rate. Security and data-migration are insurance policy specialists - they should run even when silent.

**Force flags:** If the user's prompt includes `--security`, `--performance`, `--testing`, `--maintainability`, `--data-migration`, `--api-contract`, `--design`, or `--all-specialists`, force-include that specialist regardless of gating.

Note which specialists were selected, gated, and skipped. Print the selection:
"Dispatching N specialists: [names]. Skipped: [names] (scope not detected). Gated: [names] (0 findings in N+ reviews)."

---

### Dispatch specialists in parallel

For each selected specialist, launch an independent subagent via the Agent tool.
**Launch ALL selected specialists in a single message** (multiple Agent tool calls)
so they run in parallel. Each subagent has fresh context - no prior review bias.

**Each specialist subagent prompt:**

Construct the prompt for each specialist. The prompt includes:

1. The specialist's checklist content (you already read the file above)
2. Stack context: "This is a {STACK} project."
3. Past learnings for this domain (if any exist):

```bash
```

If learnings are found, include them: "Past learnings for this domain: {learnings}"

4. Instructions:

"You are a specialist code reviewer. Read the checklist below, then run
`git diff origin/<base>` to get the full diff. Apply the checklist against the diff.

For each finding, output a JSON object on its own line:
{\"severity\":\"CRITICAL|INFORMATIONAL\",\"confidence\":N,\"path\":\"file\",\"line\":N,\"category\":\"category\",\"summary\":\"description\",\"fix\":\"recommended fix\",\"fingerprint\":\"path:line:category\",\"specialist\":\"name\"}

Required fields: severity, confidence, path, category, summary, specialist.
Optional: line, fix, fingerprint, evidence, test_stub.

If you can write a test that would catch this issue, include it in the `test_stub` field.
Use the detected test framework ({TEST_FW}). Write a minimal skeleton - describe/it/test
blocks with clear intent. Skip test_stub for architectural or design-only findings.

If no findings: output `NO FINDINGS` and nothing else.
Do not output anything else - no preamble, no summary, no commentary.

Stack context: {STACK}
Past learnings: {learnings or 'none'}

CHECKLIST:
{checklist content}"

**Subagent configuration:**
- Use `subagent_type: "general-purpose"`
- Do NOT use `run_in_background` - all specialists must complete before merge
- If any specialist subagent fails or times out, log the failure and continue with results from successful specialists. Specialists are additive - partial results are better than no results.

---

### Step 4.6: Collect and merge findings

After all specialist subagents complete, collect their outputs.

**Parse findings:**
For each specialist's output:
1. If output is "NO FINDINGS" - skip, this specialist found nothing
2. Otherwise, parse each line as a JSON object. Skip lines that are not valid JSON.
3. Collect all parsed findings into a single list, tagged with their specialist name.

**Fingerprint and deduplicate:**
For each finding, compute its fingerprint:
- If `fingerprint` field is present, use it
- Otherwise: `{path}:{line}:{category}` (if line is present) or `{path}:{category}`

Group findings by fingerprint. For findings sharing the same fingerprint:
- Keep the finding with the highest confidence score
- Tag it: "MULTI-SPECIALIST CONFIRMED ({specialist1} + {specialist2})"
- Boost confidence by +1 (cap at 10)
- Note the confirming specialists in the output

**Apply confidence gates:**
- Confidence 7+: show normally in the findings output
- Confidence 5-6: show with caveat "Medium confidence - verify this is actually an issue"
- Confidence 3-4: move to appendix (suppress from main findings)
- Confidence 1-2: suppress entirely

**Compute PR Quality Score:**
After merging, compute the quality score:
`quality_score = max(0, 10 - (critical_count * 2 + informational_count * 0.5))`
Cap at 10. Log this in the review result at the end.

**Output merged findings:**
Present the merged findings in the same format as the current review:

```
SPECIALIST REVIEW: N findings (X critical, Y informational) from Z specialists

[For each finding, in order: CRITICAL first, then INFORMATIONAL, sorted by confidence descending]
[SEVERITY] (confidence: N/10, specialist: name) path:line - summary
  Fix: recommended fix
  [If MULTI-SPECIALIST CONFIRMED: show confirmation note]

PR Quality Score: X/10
```

These findings flow into Step 5 Fix-First alongside the CRITICAL pass findings from Step 4.
The Fix-First heuristic applies identically - specialist findings follow the same AUTO-FIX vs ASK classification.

**Compile per-specialist stats:**
After merging findings, compile a `specialists` object for the review-log entry in Step 5.8.
For each specialist (testing, maintainability, security, performance, data-migration, api-contract, design, red-team):
- If dispatched: `{"dispatched": true, "findings": N, "critical": N, "informational": N}`
- If skipped by scope: `{"dispatched": false, "reason": "scope"}`
- If skipped by gating: `{"dispatched": false, "reason": "gated"}`
- If not applicable (e.g., red-team not activated): omit from the object

Include the Design specialist even though it uses `design-checklist.md` instead of the specialist schema files.
Remember these stats - you will need them for the review-log entry in Step 5.8.

---

### Red Team dispatch (conditional)

**Activation:** Only if DIFF_LINES > 200 OR any specialist produced a CRITICAL finding.

If activated, dispatch one more subagent via the Agent tool (foreground, not background).

The Red Team subagent receives:
1. The red-team checklist from `$HOME/.gstack-lite/review/specialists/red-team.md`
2. The merged specialist findings from Step 4.6 (so it knows what was already caught)
3. The git diff command

Prompt: "You are a red team reviewer. The code has already been reviewed by N specialists
who found the following issues: {merged findings summary}. Your job is to find what they
MISSED. Read the checklist, run `git diff origin/<base>`, and look for gaps.
Output findings as JSON objects (same schema as the specialists). Focus on cross-cutting
concerns, integration boundary issues, and failure modes that specialist checklists
don't cover."

If the Red Team finds additional issues, merge them into the findings list before
Step 5 Fix-First. Red Team findings are tagged with `"specialist":"red-team"`.

If the Red Team returns NO FINDINGS, note: "Red Team review: no additional issues found."
If the Red Team subagent fails or times out, skip silently and continue.

---

## Step 5: Fix-First Review

**Every finding gets action - not just critical ones.**

### Step 5.0: Cross-review finding dedup

Before classifying findings, check if any were previously skipped by the user in a prior review on this branch.

```bash
```

Parse the output: only lines BEFORE `---CONFIG---` are JSONL entries (the output also contains `---CONFIG---` and `---HEAD---` footer sections that are not JSONL - ignore those).

For each JSONL entry that has a `findings` array:
1. Collect all fingerprints where `action: "skipped"`
2. Note the `commit` field from that entry

If skipped fingerprints exist, get the list of files changed since that review:

```bash
git diff --name-only <prior-review-commit> HEAD
```

For each current finding (from both Step 4 critical pass and Step 4.5-4.6 specialists), check:
- Does its fingerprint match a previously skipped finding?
- Is the finding's file path NOT in the changed-files set?

If both conditions are true: suppress the finding. It was intentionally skipped and the relevant code hasn't changed.

Print: "Suppressed N findings from prior reviews (previously skipped by user)"

**Only suppress `skipped` findings - never `fixed` or `auto-fixed`** (those might regress and should be re-checked).

If no prior reviews exist or none have a `findings` array, skip this step silently.

Output a summary header: `Pre-Landing Review: N issues (X critical, Y informational)`

### Step 5a: Classify each finding

For each finding, classify as AUTO-FIX or ASK per the Fix-First Heuristic in
checklist.md. Critical findings lean toward ASK; informational findings lean
toward AUTO-FIX.

**Test stub override:** Any finding that has a `test_stub` field (generated by a specialist)
is reclassified as ASK regardless of its original classification. When presenting the ASK
item, show the proposed test file path and the test code. The user approves or skips the
test creation. If approved, write the fix + test file. Derive the test file path from
the finding's `path` using project conventions (`spec/` for RSpec, `__tests__/` for
Jest/Vitest, `test_` prefix for pytest, `_test.go` suffix for Go). If the test file
already exists, append the new test. Output: `[FIXED + TEST] [file:line] Problem -> fix + test at [test_path]`

### Step 5b: Auto-fix all AUTO-FIX items

Apply each fix directly. For each one, output a one-line summary:
`[AUTO-FIXED] [file:line] Problem -> what you did`

### Step 5c: Batch-ask about ASK items

If there are ASK items remaining, present them in ONE Ask the user:

- List each item with a number, the severity label, the problem, and a recommended fix
- For each item, provide options: A) Fix as recommended, B) Skip
- Include an overall RECOMMENDATION

Example format:
```
I auto-fixed 5 issues. 2 need your input:

1. [CRITICAL] app/models/post.rb:42 - Race condition in status transition
   Fix: Add `WHERE status = 'draft'` to the UPDATE
   -> A) Fix  B) Skip

2. [INFORMATIONAL] app/services/generator.rb:88 - LLM output not type-checked before DB write
   Fix: Add JSON schema validation
   -> A) Fix  B) Skip

RECOMMENDATION: Fix both - #1 is a real race condition, #2 prevents silent data corruption.
```

If 3 or fewer ASK items, you may use individual user question calls instead of batching.

### Step 5d: Apply user-approved fixes

Apply fixes for items where the user chose "Fix." Output what was fixed.

If no ASK items exist (everything was AUTO-FIX), skip the question entirely.

### Verification of claims

Before producing the final review output:
- If you claim "this pattern is safe" -> cite the specific line proving safety
- If you claim "this is handled elsewhere" -> read and cite the handling code
- If you claim "tests cover this" -> name the test file and method
- Never say "likely handled" or "probably tested" - verify or flag as unknown

**Rationalization prevention:** "This looks fine" is not a finding. Either cite evidence it IS fine, or flag it as unverified.

### Greptile comment resolution

After outputting your own findings, if Greptile comments were classified in Step 2.5:

**Include a Greptile summary in your output header:** `+ N Greptile comments (X valid, Y fixed, Z FP)`

Before replying to any comment, run the **Escalation Detection** algorithm from greptile-triage.md to determine whether to use Tier 1 (friendly) or Tier 2 (firm) reply templates.

1. **VALID & ACTIONABLE comments:** These are included in your findings - they follow the Fix-First flow (auto-fixed if mechanical, batched into ASK if not) (A: Fix it now, B: Acknowledge, C: False positive). If the user chooses A (fix), reply using the **Fix reply template** from greptile-triage.md (include inline diff + explanation). If the user chooses C (false positive), reply using the **False Positive reply template** (include evidence + suggested re-rank), save to both per-project and global greptile-history.

2. **FALSE POSITIVE comments:** Present each one with a Blocking User Question:
   - Show the Greptile comment: file:line (or [top-level]) + body summary + permalink URL
   - Explain concisely why it's a false positive
   - Options:
     - A) Reply to Greptile explaining why this is incorrect (recommended if clearly wrong)
     - B) Fix it anyway (if low-effort and harmless)
     - C) Ignore - don't reply, don't fix

   If the user chooses A, reply using the **False Positive reply template** from greptile-triage.md (include evidence + suggested re-rank), save to both per-project and global greptile-history.

3. **VALID BUT ALREADY FIXED comments:** Reply using the **Already Fixed reply template** from greptile-triage.md - no user question needed:
   - Include what was done and the fixing commit SHA
   - Save to both per-project and global greptile-history

4. **SUPPRESSED comments:** Skip silently - these are known false positives from previous triage.

---

## Step 5.5: Project TODO tracker cross-reference

Read the project TODO tracker(s) resolved by the preamble when accessible. Cross-reference the PR against open TODOs:

- **Does this PR close any open TODOs?** If yes, note which items in your output: "This PR addresses TODO: <title>"
- **Does this PR create work that should become a TODO?** If yes, flag it as an informational finding.
- **Are there related TODOs that provide context for this review?** If yes, reference them when discussing related findings.

If no tracker exists or the resolved tracker cannot be read, note that limitation and continue without inventing tracker state.

---

## Step 5.6: Documentation staleness check

Cross-reference the diff against documentation files. For each `.md` file in the repo root (README.md, ARCHITECTURE.md, CONTRIBUTING.md, CLAUDE.md, etc.):

1. Check if code changes in the diff affect features, components, or workflows described in that doc file.
2. If the doc file was NOT updated in this branch but the code it describes WAS changed, flag it as an INFORMATIONAL finding:
   "Documentation may be stale: [file] describes [feature/component] but code changed in this branch. Consider running `/document-release`."

This is informational only - never critical. The fix action is `/document-release`.

If no documentation files exist, skip this step silently.

---

## Step 5.7: Adversarial review

Every diff should get at least one adversarial pass. LOC is not a proxy for risk - a 5-line auth change can be critical.

**Detect diff size and tool availability:**

```bash
DIFF_INS=$(git diff origin/<base> --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
DIFF_DEL=$(git diff origin/<base> --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
DIFF_TOTAL=$((DIFF_INS + DIFF_DEL))
echo "DIFF_SIZE: $DIFF_TOTAL"
```

### Host adversarial subagent

If the host provides an agent/delegation tool, dispatch an adversarial subagent.
The subagent has fresh context - no checklist bias from the structured review.

Subagent prompt:
"Read the diff for this branch with `git diff origin/<base>`. Think like an attacker and a chaos engineer. Your job is to find ways this code will fail in production. Look for: edge cases, race conditions, security holes, resource leaks, failure modes, silent data corruption, logic errors that produce wrong results silently, error handling that swallows failures, and trust boundary violations. Be adversarial. Be thorough. No compliments - just the problems. For each finding, classify as FIXABLE (you know how to fix it) or INVESTIGATE (needs human judgment)."

Present findings under an `ADVERSARIAL REVIEW (host subagent):` header. **FIXABLE findings** flow into the same Fix-First pipeline as the structured review. **INVESTIGATE findings** are presented as informational.

If the subagent fails, times out, or delegation is unavailable: say "host adversarial subagent unavailable. Continuing with the structured review only."

For large diffs (`DIFF_TOTAL >= 200`), spend extra time on a manual adversarial pass even if no subagent is available.

---

### Persist the review result

After all passes complete, summarize the review status in the final output:
STATUS = "clean" if no findings across all passes, "issues_found" if any pass found issues. SOURCE = "structured" if only the structured checklist ran, "structured+adversarial" if an adversarial pass ran.

---

### Cross-model synthesis

After all passes complete, synthesize findings across all sources:

```
ADVERSARIAL REVIEW SYNTHESIS (always-on, N lines):
============================================================
  High confidence (found by multiple sources): [findings agreed on by >1 pass]
  Unique to structured review: [from earlier step]
  Unique to host adversarial: [from subagent]
  Passes used: structured yes  host adversarial yes/no
============================================================
```

High-confidence findings (agreed on by multiple sources) should be prioritized for fixes.

---

## Step 5.8: Persist Eng Review result

After all review passes complete, persist the final `/gl-review` outcome so `/ship (full gstack only)` can
recognize that Eng Review was run on this branch.

Run:

```bash
```

Substitute:
- `TIMESTAMP` = ISO 8601 datetime
- `STATUS` = `"clean"` if there are no remaining unresolved findings after Fix-First handling and adversarial review, otherwise `"issues_found"`
- `issues_found` = total remaining unresolved findings
- `critical` = remaining unresolved critical findings
- `informational` = remaining unresolved informational findings
- `quality_score` = the PR Quality Score computed in Step 4.6 (e.g., 7.5). If specialists were skipped (small diff), use `10.0`
- `specialists` = the per-specialist stats object compiled in Step 4.6. Each specialist that was considered gets an entry: `{"dispatched":true/false,"findings":N,"critical":N,"informational":N}` if dispatched, or `{"dispatched":false,"reason":"scope|gated"}` if skipped. Include Design specialist. Example: `{"testing":{"dispatched":true,"findings":2,"critical":0,"informational":2},"security":{"dispatched":false,"reason":"scope"}}`
- `findings` = array of per-finding records from Step 5. For each finding (from critical pass and specialists), include: `{"fingerprint":"path:line:category","severity":"CRITICAL|INFORMATIONAL","action":"ACTION"}`. ACTION is `"auto-fixed"` (Step 5b), `"fixed"` (user approved in Step 5d), or `"skipped"` (user chose Skip in Step 5c). Suppressed findings from Step 5.0 are NOT included (they were already recorded in a prior review entry).
- `COMMIT` = output of `git rev-parse --short HEAD`

## Important Rules

- **Read the FULL diff before commenting.** Do not flag issues already addressed in the diff.
- **Fix-first, not read-only.** AUTO-FIX items are applied directly. ASK items are only applied after user approval. Never commit, push, or create PRs - that's /ship (full gstack only)'s job.
- **Be terse.** One line problem, one line fix. No preamble.
- **Only flag real problems.** Skip anything that's fine.
- **Use Greptile reply templates from greptile-triage.md.** Every reply includes evidence. Never post vague replies.
