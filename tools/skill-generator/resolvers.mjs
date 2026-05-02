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

Lite paths:

- Skill ethos: \`ETHOS.md\` in this skill directory.
- State and generated artifacts: active repo \`.gstack-lite/\` (resolved as \`$GSTACK_LITE_STATE_DIR\`; override with \`GSTACK_LITE_STATE_DIR\`)
- Browser CLI: \`gstack-browser\` from the \`gstack-browser\` npm package
- Design binary, when installed: \`$HOME/.gstack-lite/design/dist/design\`
- Before reading or writing project state, run \`eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"\` to populate \`$GSTACK_LITE_STATE_DIR\` and \`$BRANCH\`

## User Question Format

When a skill tells you to ask the user, ask a **Blocking User Question**. This is a gate, not narration.

## Blocking User Question Protocol

Use this protocol for every instruction that says to ask the user, wait for the user, get approval, confirm a choice, or stop for feedback.

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

If the host provides an active plan file path, update or append a \`## GSTACK REVIEW REPORT\` section using the review you just completed and any visible review context. If no active plan file is available, skip this section silently.

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

export function generatePlanFileReviewReport() {
  return `## Plan File Review Report

At the end of this review, update the active plan file only when the host has provided a concrete plan file path in the conversation context. If no active plan file is available, skip this section silently.

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
      case 'INVOKE_SKILL':
        return generateInvokeSkill(ctx, args);
      case 'PLAN_FILE_REVIEW_REPORT':
        return generatePlanFileReviewReport(ctx);
      default:
        throw new Error(`unknown template placeholder ${match}`);
    }
  });
}
