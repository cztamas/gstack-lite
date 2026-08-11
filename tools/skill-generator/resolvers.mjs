import { standardHostSkillRoots } from './config.mjs';

const defaultInvokeSkips = [
  'Preamble (run first)',
  'User Question Format',
  'Completeness Principle - Boil the Lake',
  'Search Before Building',
  'Contributor Mode',
  'Completion Status Protocol',
  'Telemetry (run last)',
  'Step 0: Detect platform and base branch',
  'Review Readiness Dashboard',
  'Plan File Review Report',
  'Prerequisite Skill Offer',
  'Plan Status Footer',
  'Project Plan Structure',
];

function hostSkillRoot(host) {
  return standardHostSkillRoots[host] ?? 'the current host skill directory';
}

export function generateLitePreamble() {
  return `## Lite Preamble

Before following this skill:

1. Read relevant project instructions first: \`AGENTS.md\`, \`CLAUDE.md\`, Cursor rules, or local equivalents.
2. Prefer the existing project patterns, frameworks, helper APIs, and test style.
3. Ask before destructive or hard-to-reverse operations.
4. Keep changes scoped to the user's request and avoid unrelated refactors.
5. Use browser/design tools only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Read \`ETHOS.md\` from this skill directory when the workflow touches product direction, design judgment, architecture, or scope tradeoffs.
7. Report what changed, what was verified, and any remaining risk.

## Project TODO Tracking

Before reading, creating, updating, or closing TODOs:

1. Read the repository's applicable \`AGENTS.md\` instructions, starting at the repo root and including any more-specific \`AGENTS.md\` for the working path. Look for the required work-tracking destination and workflow, such as GitHub Issues, GitHub Projects, another issue tracker, one TODO file, or multiple scoped TODO files.
2. When those instructions define TODO tracking, follow them exactly. Use the designated tracker, project, file, labels, fields, and item format; do not also write the same item to \`TODOS.md\` unless the instructions require both.
3. When the applicable \`AGENTS.md\` instructions contain no TODO-tracking guidance, fall back to the repository's existing TODO-file pattern. Discover existing root or scoped files such as \`TODOS.md\` or \`TODO.md\`, preserve their scope and format, and use the file that owns the affected area. If no TODO file or pattern exists, use a root \`TODOS.md\` as the legacy fallback.
4. Keep the skill's existing approval gate before creating or updating deferred work. If the required destination cannot be accessed, do not silently substitute a different tracker: provide the exact proposed item, report the blocked destination, and leave it unrecorded.
5. In workflow text and summaries, \`project TODO tracker\` means the destination resolved by this protocol. After a successful write, report the resulting file path, issue URL/number, or project item identifier.

Lite paths:

- Skill ethos: \`ETHOS.md\` in this skill directory.
- State and generated artifacts: active repo \`.gstack-lite/\` (resolved as \`$GSTACK_LITE_STATE_DIR\`; override with \`GSTACK_LITE_STATE_DIR\`)
- Browser CLI: \`gstack-browser\` from the \`gstack-browser\` npm package
- Design binary, when installed: \`$HOME/.gstack-lite/design/dist/design\`
- Before reading or writing project state, run \`eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"\` to populate \`$GSTACK_LITE_STATE_DIR\` and \`$BRANCH\`

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

- \`Recommendation: <option>\`
- \`Completeness: N/10\` on every option
- One sentence explaining what that option includes or omits

For option sets that differ in kind rather than coverage, do not assign completeness scores. Add exactly this note instead:

\`Note: options differ in kind, not coverage - no completeness score.\`

## Completeness Principle - Boil the Lake

With AI-assisted implementation, shortcuts that save a human hours often save only minutes. When the user is deciding between a partial fix and the complete version, bias toward the complete version if the blast radius is understood and verification is practical.

Use \`Completeness: N/10\` to make coverage explicit. A low score is acceptable only when the user intentionally chooses a smaller scope or when the complete version is genuinely risky.

## Search Before Building

Before building or recommending an unfamiliar pattern, search the codebase, local docs, and available current references. Read \`ETHOS.md\` from this skill directory for the full framework.

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

Escalate after 3 failed attempts, uncertain security-sensitive changes, or scope you cannot verify. Format: \`STATUS\`, \`REASON\`, \`ATTEMPTED\`, \`RECOMMENDATION\`.

## Review Readiness Dashboard

For gstack-lite, do not call full gstack review-log tools. After a review skill completes, summarize readiness from the review you just ran and any directly available \`.gstack-lite/\` artifacts in the active repository.

Display a compact dashboard with rows for Eng Review, CEO Review, Design Review, and Outside Voice when relevant. Mark missing rows as not run. Treat the dashboard as conversation output only unless a plan file is available.

## Plan File Review Report

When the review resolves a project, update or append a \`## GSTACK REVIEW REPORT\` section in that project's \`plan.md\`. Otherwise use a concrete active plan file supplied by the host. If neither is available, skip this section silently. Never put the detailed report in \`status.md\`.

Do not read or write full gstack review logs. Do not invent runs that did not happen.`;
}

export function generateInvokeSkill(ctx, args = []) {
  const skillName = args[0]?.trim();
  if (!skillName) {
    throw new Error('{{INVOKE_SKILL}} requires a skill name');
  }

  const extraSkips = args
    .slice(1)
    .filter((arg) => arg.startsWith('skip='))
    .flatMap((arg) => arg.slice(5).split(','))
    .map((arg) => arg.trim())
    .filter(Boolean);
  const skips = [...defaultInvokeSkips, ...extraSkips];
  const liteName = skillName.startsWith('gl-') ? skillName : `gl-${skillName}`;
  const standardPath = `${hostSkillRoot(ctx.host)}/${liteName}/SKILL.md`;
  const pathHint =
    ctx.host === 'source'
      ? `Prefer the sibling installed skill path \`../${liteName}/SKILL.md\` when the current skill path is visible. In a standard install, use the matching host skill root, for example \`$HOME/.codex/skills/${liteName}/SKILL.md\`.`
      : `Read \`${standardPath}\`. If the current skill path is visible, the sibling path \`../${liteName}/SKILL.md\` is also valid.`;

  return `Read the \`$${liteName}\` skill file.

${pathHint}

**If unreadable:** Skip with "Could not load $${liteName} - skipping." and continue.

Follow its instructions from top to bottom, **skipping these sections** (already handled by the parent skill):
${skips.map((skip) => `- ${skip}`).join('\n')}

Execute every other section at full depth. When the loaded skill's instructions are complete, continue with the next step below.`;
}

export function generateProjectPlanWorkflow() {
  return `## Project Plan Structure

Use a project directory only for a bounded outcome that needs durable context across multiple planning, implementation, or review tasks. Do not create one for a quick fix or isolated issue that does not need a maintained plan.

Resolve the project directory in this order:

1. Use an explicit project directory, \`status.md\`, or \`plan.md\` path supplied by the user or conversation.
2. Read the applicable repository instructions and follow their project root, naming, metadata, and identity rules.
3. Reuse an existing project only when its identity clearly matches the work. Do not select a project merely because its files are newest or its name resembles the current branch. If multiple projects are plausible, ask one Blocking User Question instead of guessing.
4. When creating a project and the repository has no guidance, use \`$GSTACK_LITE_STATE_DIR/projects/<project-slug>/\` after resolving \`$GSTACK_LITE_STATE_DIR\` with \`gl-slug\`.

The default project directory contains exactly two standard files:

- \`status.md\` - the short current snapshot: project goal, one status value, updated date, current state, immediate next steps, blockers, and a link to \`plan.md\`.
- \`plan.md\` - the durable problem, scope, decisions, architecture, implementation sequence, semantic commit map when relevant, verification strategy, and links to supplementary artifacts.

Use one of these default statuses unless repository instructions define another vocabulary: \`planning\`, \`ready\`, \`in_progress\`, \`blocked\`, \`complete\`, or \`cancelled\`.

Use this default \`status.md\` shape, adding repository-specific identity fields near the top when required:

\`\`\`markdown
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
\`\`\`

Keep \`status.md\` concise and overwrite-oriented; Git history is the progress log. It is the single source of truth for live status, current progress, next steps, and blockers. Do not duplicate those sections in \`plan.md\`. Update \`status.md\` when the current state, blockers, or immediate next steps materially change. Update \`plan.md\` when scope, decisions, architecture, verification, or the semantic commit map changes. Lockstep maintenance means changing the correct file in the same implementation change, not editing both files on every commit.

Keep ordinary test strategy and review conclusions in \`plan.md\`. Create specifically named supplementary files in the same project directory only when substantial output must be preserved or independently consumed, and link each one from \`plan.md\` or \`status.md\`. Do not create a generic catch-all \`evidence.md\`.

When a review or implementation step finishes, leave \`status.md\` with an accurate status and executable next action. On completion, summarize the final outcome, set status to \`complete\`, and remove stale next steps. Do not move completed project directories automatically.

Respect the current skill's authority: report-only skills may read project files, write their normal report artifacts, and report suggested status changes, but must not update \`status.md\` or \`plan.md\`.`;
}

export function generatePlanFileReviewReport() {
  return `## Plan File Review Report

At the end of this review, update the resolved project's \`plan.md\`. If no project was resolved, update an active plan only when the host provided its concrete path. If neither is available, skip this section silently. Never put the detailed report in \`status.md\`.

Use only information available in this lite workflow:

- The review you just completed
- Decisions accepted, rejected, or left unresolved in this conversation
- Any \`.gstack-lite/\` artifacts you directly read during this workflow

Do not read or write full gstack review logs. Do not invent runs, statuses, or second-opinion results that did not happen.

Write or replace a final \`## GSTACK REVIEW REPORT\` section with this shape:

\`\`\`markdown
## GSTACK REVIEW REPORT

| Review | Trigger | Status | Findings |
|--------|---------|--------|----------|
| Current review | \`$gl-<skill>\` | DONE / DONE_WITH_CONCERNS / BLOCKED | <one-line summary> |
\`\`\`

Below the table, add short lines for:

- **DECISIONS:** accepted and rejected decisions, if any
- **UNRESOLVED:** unanswered questions or tradeoffs, if any
- **VERDICT:** whether the plan is ready to implement, ready with concerns, or blocked

When replacing an existing report, match from \`## GSTACK REVIEW REPORT\` through the next \`## \` heading or the end of file. Append the new report as the last section in the plan file.`;
}

export function resolveTemplate(text, ctx) {
  return text.replace(/\{\{([A-Z_]+)(?::([^}]+))?\}\}/g, (match, name, argString = '') => {
    const args = argString
      .split(':')
      .map((arg) => arg.trim())
      .filter(Boolean);

    switch (name) {
      case 'LITE_PREAMBLE':
      case 'PREAMBLE':
        return generateLitePreamble(ctx);
      case 'PROJECT_PLAN_STRUCTURE':
        return generateProjectPlanWorkflow(ctx);
      case 'INVOKE_SKILL':
        return generateInvokeSkill(ctx, args);
      case 'PLAN_FILE_REVIEW_REPORT':
        return generatePlanFileReviewReport(ctx);
      default:
        throw new Error(`unknown template placeholder ${match}`);
    }
  });
}
