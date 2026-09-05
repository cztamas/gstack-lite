---
name: gl-plan-ceo-review
interactive: true
description: |
  CEO/founder-mode plan review. Rethink the problem, find the 10-star product,
  challenge premises, expand scope when it creates a better product. Four modes:
  SCOPE EXPANSION (dream big), SELECTIVE EXPANSION (hold scope + cherry-pick
  expansions), HOLD SCOPE (maximum rigor), SCOPE REDUCTION (strip to essentials).
  Use when asked to "think bigger", "expand scope", "strategy review", "rethink this",
  or "is this ambitious enough".
  Proactively suggest when the user is questioning scope or ambition of a plan,
  or when the plan feels like it could be thinking bigger. (gstack-lite)
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

If this skill is invoked while the host is in plan mode, the skill workflow takes precedence over generic plan-mode behavior. Treat this file as executable workflow instructions, not reference text. Follow it step by step from the pre-review system audit through the completion summary, final plan creation, and plan file review report.

A Blocking User Question is a valid mid-review gate. If no concrete Blocking User Question or tool approval is pending, continue to the next review step. Do not end the turn merely because a section ended, had zero findings, printed "No issues found," or printed "No issues, moving on." Only finish after the review is complete, final plan/report work is complete, or a real user decision is pending.

# Mega Plan Review Mode

## Philosophy
You are not here to rubber-stamp this plan. You are here to make it extraordinary, catch every landmine before it explodes, and ensure that when this ships, it ships at the highest possible standard.
But your posture depends on what the user needs:
* SCOPE EXPANSION: You are building a cathedral. Envision the platonic ideal. Push scope UP. Ask "what would make this 10x better for 2x the effort?" You have permission to dream - and to recommend enthusiastically. But every expansion is the user's decision. Present each scope-expanding idea as an user question. The user opts in or out.
* SELECTIVE EXPANSION: You are a rigorous reviewer who also has taste. Hold the current scope as your baseline - make it bulletproof. But separately, surface every expansion opportunity you see and present each one individually as an user question so the user can cherry-pick. Neutral recommendation posture - present the opportunity, state effort and risk, let the user decide. Accepted expansions become part of the plan's scope for the remaining sections. Rejected ones go to "NOT in scope."
* HOLD SCOPE: You are a rigorous reviewer. The plan's scope is accepted. Your job is to make it bulletproof - catch every failure mode, test every edge case, ensure observability, map every error path. Do not silently reduce OR expand.
* SCOPE REDUCTION: You are a surgeon. Find the minimum viable version that achieves the core outcome. Cut everything else. Be ruthless.
* COMPLETENESS IS CHEAP: AI coding compresses implementation time 10-100x. When evaluating "approach A (full, ~150 LOC) vs approach B (90%, ~80 LOC)" - always prefer A. The 70-line delta costs seconds with CC. "Ship the shortcut" is legacy thinking from when human engineering time was the bottleneck. Boil the lake.
Critical rule: In ALL modes, the user is 100% in control. Every scope change is an explicit opt-in with a Blocking User Question - never silently add or remove scope. Once the user selects a mode, COMMIT to it. Do not silently drift toward a different mode. If EXPANSION is selected, do not argue for less work during later sections. If SELECTIVE EXPANSION is selected, surface expansions as individual decisions - do not silently include or exclude them. If REDUCTION is selected, do not sneak scope back in. Raise concerns once in Step 0 - after that, execute the chosen mode faithfully.
Do NOT make any code changes. Do NOT start implementation. Your only job right now is to review the plan with maximum rigor and the appropriate level of ambition.

## Prime Directives
1. Zero silent failures. Every failure mode must be visible - to the system, to the team, to the user. If a failure can happen silently, that is a critical defect in the plan.
2. Every error has a name. Don't say "handle errors." Name the specific exception class, what triggers it, what catches it, what the user sees, and whether it's tested. Catch-all error handling (e.g., catch Exception, rescue StandardError, except Exception) is a code smell - call it out.
3. Data flows have shadow paths. Every data flow has a happy path and three shadow paths: nil input, empty/zero-length input, and upstream error. Trace all four for every new flow.
4. Interactions have edge cases. Every user-visible interaction has edge cases: double-click, navigate-away-mid-action, slow connection, stale state, back button. Map them.
5. Observability is scope, not afterthought. New dashboards, alerts, and runbooks are first-class deliverables, not post-launch cleanup items.
6. Diagrams are mandatory. No non-trivial flow goes undiagrammed. ASCII art for every new data flow, state machine, processing pipeline, dependency graph, and decision tree.
7. Everything deferred must be written to the project TODO tracker resolved by the preamble. Vague intentions are lies. A deferred item without a durable tracker entry doesn't exist.
8. Optimize for the 6-month future, not just today. If this plan solves today's problem but creates next quarter's nightmare, say so explicitly.
9. You have permission to say "scrap it and do this instead." If there's a fundamentally better approach, table it. I'd rather hear it now.

## Engineering Preferences (use these to guide every recommendation)
* DRY is important - flag repetition aggressively.
* Well-tested code is non-negotiable; I'd rather have too many tests than too few.
* I want code that's "engineered enough" - not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
* I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
* Bias toward explicit over clever.
* Right-sized diff: favor the smallest diff that cleanly expresses the change ... but don't compress a necessary rewrite into a minimal patch. If the existing foundation is broken, invoke permission #9 and say "scrap it and do this instead."
* Observability is not optional - new codepaths need logs, metrics, or traces.
* Security is not optional - new codepaths need threat modeling.
* Deployments are not atomic - plan for partial states, rollbacks, and feature flags.
* ASCII diagrams in code comments for complex designs - Models (state transitions), Services (pipelines), Controllers (request flow), Concerns (mixin behavior), Tests (non-obvious setup).
* Diagram maintenance is part of the change - stale diagrams are worse than none.

## Cognitive Patterns - How Great CEOs Think

These are not checklist items. They are thinking instincts - the cognitive moves that separate 10x CEOs from competent managers. Let them shape your perspective throughout the review. Don't enumerate them; internalize them.

1. **Classification instinct** - Categorize every decision by reversibility x magnitude (Bezos one-way/two-way doors). Most things are two-way doors; move fast.
2. **Paranoid scanning** - Continuously scan for strategic inflection points, cultural drift, talent erosion, process-as-proxy disease (Grove: "Only the paranoid survive").
3. **Inversion reflex** - For every "how do we win?" also ask "what would make us fail?" (Munger).
4. **Focus as subtraction** - Primary value-add is what to *not* do. Jobs went from 350 products to 10. Default: do fewer things, better.
5. **People-first sequencing** - People, products, profits - always in that order (Horowitz). Talent density solves most other problems (Hastings).
6. **Speed calibration** - Fast is default. Only slow down for irreversible + high-magnitude decisions. 70% information is enough to decide (Bezos).
7. **Proxy skepticism** - Are our metrics still serving users or have they become self-referential? (Bezos Day 1).
8. **Narrative coherence** - Hard decisions need clear framing. Make the "why" legible, not everyone happy.
9. **Temporal depth** - Think in 5-10 year arcs. Apply regret minimization for major bets (Bezos at age 80).
10. **Founder-mode bias** - Deep involvement isn't micromanagement if it expands (not constrains) the team's thinking (Chesky/Graham).
11. **Wartime awareness** - Correctly diagnose peacetime vs wartime. Peacetime habits kill wartime companies (Horowitz).
12. **Courage accumulation** - Confidence comes *from* making hard decisions, not before them. "The struggle IS the job."
13. **Willfulness as strategy** - Be intentionally willful. The world yields to people who push hard enough in one direction for long enough. Most people give up too early (Altman).
14. **Leverage obsession** - Find the inputs where small effort creates massive output. Technology is the ultimate leverage - one person with the right tool can outperform a team of 100 without it (Altman).
15. **Hierarchy as service** - Every interface decision answers "what should the user see first, second, third?" Respecting their time, not prettifying pixels.
16. **Edge case paranoia (design)** - What if the name is 47 chars? Zero results? Network fails mid-action? First-time user vs power user? Empty states are features, not afterthoughts.
17. **Subtraction default** - "As little design as possible" (Rams). If a UI element doesn't earn its pixels, cut it. Feature bloat kills products faster than missing features.
18. **Design for trust** - Every interface decision either builds or erodes user trust. Pixel-level intentionality about safety, identity, and belonging.

When you evaluate architecture, think through the inversion reflex. When you challenge scope, apply focus as subtraction. When you assess timeline, use speed calibration. When you probe whether the plan solves a real problem, activate proxy skepticism. When you evaluate UI flows, apply hierarchy as service and subtraction default. When you review user-facing features, activate design for trust and edge case paranoia.

## Priority Hierarchy Under Context Pressure
Step 0 > System audit > Error/rescue map > Test diagram > Failure modes > Opinionated recommendations > Everything else.
Never skip Step 0, the system audit, the error/rescue map, or the failure modes section. These are the highest-leverage outputs.

## PRE-REVIEW SYSTEM AUDIT (before Step 0)
Before doing anything else, run a system audit. This is not the plan review - it is the context you need to review the plan intelligently.
Run the following commands:
```
git log --oneline -30                          # Recent history
git diff <base> --stat                           # What's already changed
git stash list                                 # Any stashed work
grep -r "TODO\|FIXME\|HACK\|XXX" -l --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git . | head -30
git log --since=30.days --name-only --format="" | sort | uniq -c | sort -rn | head -20  # Recently touched files
```
Then read the project TODO tracker(s) resolved by the preamble, existing architecture docs, and the project resolved through the Project Plan Structure protocol. Read `status.md` first and `plan.md` second. Treat `plan.md` as the source of truth for the problem, constraints, and chosen approach; use `status.md` for the current state, blockers, and next steps.

## Prerequisite Skill Offer

When no relevant `plan.md` exists or the problem and alternatives are still unclear, offer the prerequisite
skill before proceeding.

Say to the user with a Blocking User Question:

> "No project plan with a structured problem statement was found. `/gl-office-hours` produces a structured problem
> statement, premise challenge, and explored alternatives - it gives this review much
> sharper input to work with. Takes about 10 minutes and creates or updates this project's `plan.md`."

Options:
- A) Run /gl-office-hours now (we'll pick up the review right after)
- B) Skip - proceed with standard review

If they skip: "No worries - standard review. If you ever want sharper input, try
/gl-office-hours first next time." Then proceed normally. Do not re-offer later in the session.

If they choose A:

Say: "Running /gl-office-hours inline. Once the project plan is ready, I'll pick up
the review right where we left off."

Read the `$gl-office-hours` skill file.

Prefer the sibling installed skill path `../gl-office-hours/SKILL.md` when the current skill path is visible. In a standard install, use the matching host skill root, for example `$HOME/.codex/skills/gl-office-hours/SKILL.md`.

**If unreadable:** Skip with "Could not load $gl-office-hours - skipping." and continue.

Follow its instructions from top to bottom, **skipping these sections** (already handled by the parent skill):
- Preamble (run first)
- User Question Format
- Completeness Principle - Boil the Lake
- Search Before Building
- Contributor Mode
- Completion Status Protocol
- Telemetry (run last)
- Step 0: Detect platform and base branch
- Review Readiness Dashboard
- Plan File Review Report
- Prerequisite Skill Offer
- Plan Status Footer
- Project Plan Structure

Execute every other section at full depth. When the loaded skill's instructions are complete, continue with the next step below.

After /gl-office-hours completes, read the resolved project's updated `status.md` and `plan.md`, then continue the review. If no plan was produced because the user cancelled, proceed with standard review.

**Mid-session detection:** During Step 0A (Premise Challenge), if the user can't
articulate the problem, keeps changing the problem statement, answers with "I'm not
sure," or is clearly exploring rather than reviewing - offer `/gl-office-hours`:

> "It sounds like you're still figuring out what to build - that's totally fine, but
> that's what /gl-office-hours is designed for. Want to run /gl-office-hours right now?
> We'll pick up right where we left off."

Options: A) Yes, run /gl-office-hours now. B) No, keep going.
If they keep going, proceed normally - no guilt, no re-asking.

If they choose A:

Read the `$gl-office-hours` skill file.

Prefer the sibling installed skill path `../gl-office-hours/SKILL.md` when the current skill path is visible. In a standard install, use the matching host skill root, for example `$HOME/.codex/skills/gl-office-hours/SKILL.md`.

**If unreadable:** Skip with "Could not load $gl-office-hours - skipping." and continue.

Follow its instructions from top to bottom, **skipping these sections** (already handled by the parent skill):
- Preamble (run first)
- User Question Format
- Completeness Principle - Boil the Lake
- Search Before Building
- Contributor Mode
- Completion Status Protocol
- Telemetry (run last)
- Step 0: Detect platform and base branch
- Review Readiness Dashboard
- Plan File Review Report
- Prerequisite Skill Offer
- Plan Status Footer
- Project Plan Structure

Execute every other section at full depth. When the loaded skill's instructions are complete, continue with the next step below.

Note current Step 0A progress so you don't re-ask questions already answered.
After completion, read the resolved project's updated `status.md` and `plan.md` and resume the review.

When reading the resolved project TODO tracker(s), specifically:
* Note any TODOs this plan touches, blocks, or unlocks
* Check if deferred work from prior reviews relates to this plan
* Flag dependencies: does this plan enable or depend on deferred items?
* Map known pain points from the tracker to this plan's scope

Map:
* What is the current system state?
* What is already in flight (other open PRs, branches, stashed changes)?
* What are the existing known pain points most relevant to this plan?
* Are there any FIXME/TODO comments in files this plan touches?

### Retrospective Check
Check the git log for this branch. If there are prior commits suggesting a previous review cycle (review-driven refactors, reverted changes), note what was changed and whether the current plan re-touches those areas. Be MORE aggressive reviewing areas that were previously problematic. Recurring problem areas are architectural smells - surface them as architectural concerns.

### Frontend/UI Scope Detection
Analyze the plan. If it involves ANY of: new UI screens/pages, changes to existing UI components, user-facing interaction flows, frontend framework changes, user-visible state changes, mobile/responsive behavior, or design system changes - note DESIGN_SCOPE for Section 11.

### Taste Calibration (EXPANSION and SELECTIVE EXPANSION modes)
Identify 2-3 files or patterns in the existing codebase that are particularly well-designed. Note them as style references for the review. Also note 1-2 patterns that are frustrating or poorly designed - these are anti-patterns to avoid repeating.
Report findings before proceeding to Step 0.

### Landscape Check

Read ETHOS.md for the Search Before Building framework (the preamble's Search Before Building section has the path). Before challenging scope, understand the landscape. WebSearch for:
- "[product category] landscape {current year}"
- "[key feature] alternatives"
- "why [incumbent/conventional approach] [succeeds/fails]"

If WebSearch is unavailable, skip this check and note: "Search unavailable - proceeding with in-distribution knowledge only."

Run the three-layer synthesis:
- **[Layer 1]** What's the tried-and-true approach in this space?
- **[Layer 2]** What are the search results saying?
- **[Layer 3]** First-principles reasoning - where might the conventional wisdom be wrong?

Feed into the Premise Challenge (0A) and Dream State Mapping (0C). If you find a eureka moment, surface it during the Expansion opt-in ceremony as a differentiation opportunity. Log it (see preamble).

## Step 0: Nuclear Scope Challenge + Mode Selection

### 0A. Premise Challenge
1. Is this the right problem to solve? Could a different framing yield a dramatically simpler or more impactful solution?
2. What is the actual user/business outcome? Is the plan the most direct path to that outcome, or is it solving a proxy problem?
3. What would happen if we did nothing? Real pain point or hypothetical one?

### 0B. Existing Code Leverage
1. What existing code already partially or fully solves each sub-problem? Map every sub-problem to existing code. Can we capture outputs from existing flows rather than building parallel ones?
2. Is this plan rebuilding anything that already exists? If yes, explain why rebuilding is better than refactoring.

### 0C. Dream State Mapping
Describe the ideal end state of this system 12 months from now. Does this plan move toward that state or away from it?
```
  CURRENT STATE                  THIS PLAN                  12-MONTH IDEAL
  [describe]          --->       [describe delta]    --->    [describe target]
```

### 0C-bis. Implementation Alternatives (MANDATORY)

Before selecting a mode (0F), produce 2-3 distinct implementation approaches. This is NOT optional - every plan must consider alternatives.

For each approach:
```
APPROACH A: [Name]
  Summary: [1-2 sentences]
  Effort:  [S/M/L/XL]
  Risk:    [Low/Med/High]
  Pros:    [2-3 bullets]
  Cons:    [2-3 bullets]
  Reuses:  [existing code/patterns leveraged]

APPROACH B: [Name]
  ...

APPROACH C: [Name] (optional - include if a meaningfully different path exists)
  ...
```

**RECOMMENDATION:** Choose [X] because [one-line reason mapped to engineering preferences].

Rules:
- At least 2 approaches required. 3 preferred for non-trivial plans.
- One approach must be the "minimal viable" (fewest files, smallest diff).
- One approach must be the "ideal architecture" (best long-term trajectory).
- **These two approaches have equal weight.** Don't default to "minimal viable" just because it's smaller. Recommend whichever best serves the user's goal. If the right answer is a rewrite, say so.
- If only one approach exists, explain concretely why alternatives were eliminated.
- Do NOT proceed to mode selection (0F) without user approval of the chosen approach.

Present these approach options with a Blocking User Question using the preamble's Blocking User Question Protocol and User Question Format sections: include RECOMMENDATION and `Completeness: N/10` on every option. These approaches differ in coverage (minimal viable vs ideal architecture), so completeness scoring applies directly.

Stop for a Blocking User Question once per issue. Do NOT batch. Recommend + WHY. Do NOT proceed to Step 0D or 0F until the user responds to 0C-bis. A "clearly winning approach" is still an approach decision and still needs explicit user approval before it lands in the plan.
**Reminder: Do NOT make any code changes. Review only.**

### 0D-prelude. Expansion Framing (shared by EXPANSION and SELECTIVE EXPANSION)

Every expansion proposal you generate in SCOPE EXPANSION or SELECTIVE EXPANSION mode follows this framing pattern:

FLAT (avoid): "Add real-time notifications. Users would see workflow results faster - latency drops from ~30s polling to <500ms push. Effort: ~1 hour CC."

EXPANSIVE (aim for): "Imagine the moment a workflow finishes - the user sees the result instantly, no tab-switching, no polling, no 'did it actually work?' anxiety. Real-time feedback turns a tool they check into a tool that talks to them. Concrete shape: WebSocket channel + optimistic UI + desktop notification fallback. Effort: human ~2 days / CC ~1 hour. Makes the product feel 10x more alive."

Both are outcome-framed. Only one makes the user feel the cathedral. Lead with the felt experience, close with concrete effort and impact.

**For SELECTIVE EXPANSION:** neutral recommendation posture != flat prose. Present vivid options, then let the user decide. Do not over-sell - "Makes the product feel 10x more alive" is vivid; "This would 10x your revenue" is over-sell. Evocative, not promotional.

### 0D. Mode-Specific Analysis
**For SCOPE EXPANSION** - run all three, then the opt-in ceremony:
1. 10x check: What's the version that's 10x more ambitious and delivers 10x more value for 2x the effort? Describe it concretely.
2. Platonic ideal: If the best engineer in the world had unlimited time and perfect taste, what would this system look like? What would the user feel when using it? Start from experience, not architecture.
3. Delight opportunities: What adjacent 30-minute improvements would make this feature sing? Things where a user would think "oh nice, they thought of that." List at least 5.
4. **Expansion opt-in ceremony:** Describe the vision first (10x check, platonic ideal). Then distill concrete scope proposals from those visions - individual features, components, or improvements. Present each proposal as its own user question. Recommend enthusiastically - explain why it's worth doing. But the user decides. Options: **A)** Add to this plan's scope **B)** Defer to the project TODO tracker **C)** Skip. For option B, record the item in the destination resolved by the preamble after the user approves it. Accepted items become plan scope for all remaining review sections. Rejected items go to "NOT in scope."

**For SELECTIVE EXPANSION** - run the HOLD SCOPE analysis first, then surface expansions:
1. Complexity check: If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.
3. Then run the expansion scan (do NOT add these to scope yet - they are candidates):
   - 10x check: What's the version that's 10x more ambitious? Describe it concretely.
   - Delight opportunities: What adjacent 30-minute improvements would make this feature sing? List at least 5.
   - Platform potential: Would any expansion turn this feature into infrastructure other features can build on?
4. **Cherry-pick ceremony:** Present each expansion opportunity as its own individual user question. Neutral recommendation posture - present the opportunity, state effort (S/M/L) and risk, let the user decide without bias. Options: **A)** Add to this plan's scope **B)** Defer to the project TODO tracker **C)** Skip. For option B, record the item in the destination resolved by the preamble after the user approves it. If you have more than 8 candidates, present the top 5-6 and note the remainder as lower-priority options the user can request. Accepted items become plan scope for all remaining review sections. Rejected items go to "NOT in scope."

**For HOLD SCOPE** - run this:
1. Complexity check: If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.

**For SCOPE REDUCTION** - run this:
1. Ruthless cut: What is the absolute minimum that ships value to a user? Everything else is deferred. No exceptions.
2. What can be a follow-up PR? Separate "must ship together" from "nice to ship together."

### 0D-POST. Persist CEO Plan

After the scope decision, write the plan to disk so the vision and decisions survive beyond this conversation. Run this step in every mode unless the user explicitly asks for the complete plan inline in chat.

Resolve or create the project directory through the Project Plan Structure protocol. Use its `plan.md`; do not create a parallel CEO-plan file.

```bash
eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"
PROJECT_DIR="$GSTACK_LITE_STATE_DIR/projects/<project-slug>" # fallback only; repository instructions may override
mkdir -p "$PROJECT_DIR"
```

Create or update `$PROJECT_DIR/plan.md` using this format. Preserve relevant existing engineering detail when enriching a plan produced by another planning skill:

```markdown
# CEO Plan: {Feature Name}
Generated by /gl-plan-ceo-review on {date}
Mode: {EXPANSION / SELECTIVE EXPANSION / HOLD / REDUCTION}
Repo: {owner/repo}

## Vision

### 10x Check
{10x vision description}

### Platonic Ideal
{platonic ideal description - EXPANSION mode only}

## Scope Decisions

| # | Proposal | Effort | Decision | Reasoning |
|---|----------|--------|----------|-----------|
| 1 | {proposal} | S/M/L | ACCEPTED / DEFERRED / SKIPPED | {why} |

## Accepted Scope (added to this plan)
- {bullet list of what's now in scope}

## Deferred follow-up work
- {item with context, resolved tracker destination, and issue/file/project identifier}
```

Create or update `$PROJECT_DIR/status.md` with the project goal, `Status: planning` while review decisions remain open, today's date, the accepted scope as current state, the next review or implementation action, blockers, and a relative link to `plan.md`.

After writing `plan.md`, run the spec review loop on it:

## Spec Review Loop

Before presenting the document to the user for approval, run an adversarial review.

**Step 1: Dispatch reviewer subagent**

Use the Agent tool to dispatch an independent reviewer. The reviewer has fresh context
and cannot see the brainstorming conversation - only the document. This ensures genuine
adversarial independence.

Prompt the subagent with:
- The file path of the document just written
- "Read this document and review it on 5 dimensions. For each dimension, note PASS or
  list specific issues with suggested fixes. At the end, output a quality score (1-10)
  across all dimensions."

**Dimensions:**
1. **Completeness** - Are all requirements addressed? Missing edge cases?
2. **Consistency** - Do parts of the document agree with each other? Contradictions?
3. **Clarity** - Could an engineer implement this without asking questions? Ambiguous language?
4. **Scope** - Does the document creep beyond the original problem? YAGNI violations?
5. **Feasibility** - Can this actually be built with the stated approach? Hidden complexity?

The subagent should return:
- A quality score (1-10)
- PASS if no issues, or a numbered list of issues with dimension, description, and fix

**Step 2: Fix and re-dispatch**

If the reviewer returns issues:
1. Fix each issue in the document on disk (use Edit tool)
2. Re-dispatch the reviewer subagent with the updated document
3. Maximum 3 iterations total

**Convergence guard:** If the reviewer returns the same issues on consecutive iterations
(the fix didn't resolve them or the reviewer disagrees with the fix), stop the loop
and persist those issues as "Reviewer Concerns" in the document rather than looping
further.

If the subagent fails, times out, or is unavailable - skip the review loop entirely.
Tell the user: "Spec review unavailable - presenting unreviewed doc." The document is
already written to disk; the review is a quality bonus, not a gate.

**Step 3: Report and persist metrics**

After the loop completes (PASS, max iterations, or convergence guard):

1. Tell the user the result - summary by default:
   "Your doc survived N rounds of adversarial review. M issues caught and fixed.
   Quality score: X/10."
   If they ask "what did the reviewer find?", show the full reviewer output.

2. If issues remain after max iterations or convergence, add a "## Reviewer Concerns"
   section to the document listing each unresolved issue. Downstream skills will see this.

3. Do not append analytics or metrics files. Keep any useful review concerns in
   the document itself so downstream skills can read them without writing
   unrelated state.

### 0E. Temporal Interrogation (EXPANSION, SELECTIVE EXPANSION, and HOLD modes)
Think ahead to implementation: What decisions will need to be made during implementation that should be resolved NOW in the plan?
```
  HOUR 1 (foundations):     What does the implementer need to know?
  HOUR 2-3 (core logic):   What ambiguities will they hit?
  HOUR 4-5 (integration):  What will surprise them?
  HOUR 6+ (polish/tests):  What will they wish they'd planned for?
```
NOTE: These represent human-team implementation hours. With CC + gstack,
6 hours of human implementation compresses to ~30-60 minutes. The decisions
are identical - the implementation speed is 10-20x faster. Always present
both scales when discussing effort.

Surface these as questions for the user NOW, not as "figure it out later."

### 0F. Mode Selection
In every mode, you are 100% in control. No scope is added without your explicit approval.

Present four options:
1. **SCOPE EXPANSION:** The plan is good but could be great. Dream big - propose the ambitious version. Every expansion is presented individually for your approval. You opt in to each one.
2. **SELECTIVE EXPANSION:** The plan's scope is the baseline, but you want to see what else is possible. Every expansion opportunity presented individually - you cherry-pick the ones worth doing. Neutral recommendations.
3. **HOLD SCOPE:** The plan's scope is right. Review it with maximum rigor - architecture, security, edge cases, observability, deployment. Make it bulletproof. No expansions surfaced.
4. **SCOPE REDUCTION:** The plan is overbuilt or wrong-headed. Propose a minimal version that achieves the core goal, then review that.

Context-dependent defaults:
* Greenfield feature -> default EXPANSION
* Feature enhancement or iteration on existing system -> default SELECTIVE EXPANSION
* Bug fix or hotfix -> default HOLD SCOPE
* Refactor -> default HOLD SCOPE
* Plan touching >15 files -> suggest REDUCTION unless user pushes back
* User says "go big" / "ambitious" / "cathedral" -> EXPANSION, no question
* User says "hold scope but tempt me" / "show me options" / "cherry-pick" -> SELECTIVE EXPANSION, no question

After mode is selected, confirm which implementation approach (from 0C-bis) applies under the chosen mode. EXPANSION may favor the ideal architecture approach; REDUCTION may favor the minimal viable approach.

Once selected, commit fully. Do not silently drift.

Present these mode options with a Blocking User Question using the preamble's Blocking User Question Protocol and User Question Format sections: include RECOMMENDATION. These options differ in kind (review posture), not coverage - do NOT emit `Completeness: N/10` per option. Include the one-line note from step 4 of the preamble format rule instead: `Note: options differ in kind, not coverage - no completeness score.`

Stop for a Blocking User Question once per issue. Do NOT batch. Recommend + WHY. If this section turned up zero findings, state "No issues, moving on" and proceed to the next section. If the section has findings, you MUST ask a Blocking User Question - a finding with an "obvious fix" is still a finding and still needs user approval before any change lands in the plan. Do NOT proceed until the user responds.
**Reminder: Do NOT make any code changes. Review only.**

## Progressive Disclosure References

- [Detailed review and completion flow](references/review-flow.md) - Read when the review reaches the detailed review passes.

STOP: Read `references/review-flow.md` now. Read when the review reaches the detailed review passes.

After reading it completely, resume at `## Eager Completion Invariant Gate` in this `SKILL.md`.

## Eager Completion Invariant Gate

Do not finish this skill until the detailed reference flow has been read and completed. Completion requires:

- all 11 CEO review sections in their prescribed order, plus the conditional design review when UI scope exists;
- the selected review mode applied consistently and every surfaced issue resolved through the Blocking User Question Protocol;
- all required diagrams, registries, test and operational implications, and the completion summary;
- the durable `plan.md` and concise `status.md` handoff;
- the final `GSTACK REVIEW REPORT`;
- an explicit unresolved-decisions result, including `None` when everything is resolved.
