#!/usr/bin/env node
import { chmod, mkdir, readFile, writeFile, cp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const argSourceIndex = process.argv.indexOf('--source');
const sourceRoot = argSourceIndex >= 0
  ? path.resolve(process.argv[argSourceIndex + 1] || '')
  : path.resolve(repoRoot, '..', 'gstack');

const skillStarts = new Map([
  ['office-hours', '# YC Office Hours'],
  ['plan-ceo-review', '# Mega Plan Review Mode'],
  ['plan-eng-review', '# Plan Review Mode'],
  ['plan-design-review', '# /plan-design-review: Designer\'s Eye Plan Review'],
  ['design-consultation', '# /design-consultation: Your Design System, Built Together'],
  ['design-shotgun', '# /design-shotgun: Visual Design Exploration'],
  ['design-html', '# /design-html: Pretext-Native HTML Engine'],
  ['design-review', '# /design-review: Design Audit -> Fix -> Verify'],
  ['investigate', '# Systematic Debugging'],
  ['review', '# Pre-Landing PR Review'],
  ['cso', '# /cso - Chief Security Officer Audit (v2)'],
  ['qa', '# /qa: Test -> Fix -> Verify'],
  ['qa-only', '# /qa-only: Report-Only QA Testing'],
  ['freeze', '# /freeze - Restrict Edits to a Directory'],
  ['unfreeze', '# /unfreeze - Clear Freeze Boundary'],
]);

const skills = [...skillStarts.keys()];

const litePreamble = `## Lite Preamble

Before following this skill:

1. Read relevant project instructions first: \`AGENTS.md\`, \`CLAUDE.md\`, Cursor rules, or local equivalents.
2. Prefer the existing project patterns, frameworks, helper APIs, and test style.
3. Ask before destructive or hard-to-reverse operations.
4. Keep changes scoped to the user's request and avoid unrelated refactors.
5. Use browser/design binaries only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Report what changed, what was verified, and any remaining risk.

Lite runtime paths:

- State and generated artifacts: \`$HOME/.gstack-lite/\`
- Browser binary, when installed: \`$HOME/.gstack-lite/browse/dist/browse\`
- Design binary, when installed: \`$HOME/.gstack-lite/design/dist/design\`

`;

const stripSectionHeadings = [
  /^## Prior Learnings\b/,
  /^## Capture Learnings\b/,
  /^### Learnings Logging\b/,
  /^### Builder Profile Append\b/,
  /^### If TIER = regular\b/,
  /^### If TIER = inner_circle\b/,
  /^## Review Log\b/,
  /^## Review Readiness Dashboard\b/,
  /^## Plan File Review Report\b/,
  /^## Next Steps - Review Chaining\b/,
  /^## Outside Voice\b/,
  /^### Outside Voice Integration Rule\b/,
  /^## Design Outside Voices\b/,
  /^## Phase 3\.5: Cross-Model Second Opinion\b/,
  /^### Codex adversarial challenge\b/,
  /^### Codex structured review\b/,
];

const forbiddenLine = /\b(gstack-(?:config|update-check|telemetry-log|timeline-log|learnings-(?:search|log)|question-(?:preference|log)|review-(?:log|read)|taste-update|builder-profile|specialist-stats|brain|gbrain)|codex\s+(?:exec|review)|which codex|CODEX_|CLAUDE_SKILL_DIR|GBrain|telemetry prompt|Remote telemetry|Local analytics|Session timeline|skill-usage\.jsonl|analytics\/skill-usage|builder-profile\.jsonl|check-freeze)\b/i;

const liteSkillCommands = [
  'office-hours',
  'plan-ceo-review',
  'plan-eng-review',
  'plan-design-review',
  'design-consultation',
  'design-shotgun',
  'design-html',
  'design-review',
  'investigate',
  'review',
  'cso',
  'browse',
  'qa-only',
  'qa',
  'freeze',
  'unfreeze',
];

const skillInterface = new Map([
  ['office-hours', {
    shortDescription: 'Brainstorm product ideas with YC-style questions',
    defaultPrompt: 'Use $gl-office-hours to pressure-test this idea and produce a focused next step.',
  }],
  ['plan-ceo-review', {
    shortDescription: 'Review plans for scope and product ambition',
    defaultPrompt: 'Use $gl-plan-ceo-review to review this plan for product ambition and scope tradeoffs.',
  }],
  ['plan-eng-review', {
    shortDescription: 'Review architecture and execution plans',
    defaultPrompt: 'Use $gl-plan-eng-review to review this implementation plan for architecture, edge cases, and tests.',
  }],
  ['plan-design-review', {
    shortDescription: 'Review UI plans before implementation',
    defaultPrompt: 'Use $gl-plan-design-review to critique this UI plan before implementation.',
  }],
  ['design-consultation', {
    shortDescription: 'Create a product design system',
    defaultPrompt: 'Use $gl-design-consultation to create a design system for this product.',
  }],
  ['design-shotgun', {
    shortDescription: 'Explore multiple visual design directions',
    defaultPrompt: 'Use $gl-design-shotgun to explore several visual directions for this UI.',
  }],
  ['design-html', {
    shortDescription: 'Turn approved designs into HTML/CSS',
    defaultPrompt: 'Use $gl-design-html to turn this approved design into production-quality HTML/CSS.',
  }],
  ['design-review', {
    shortDescription: 'Audit and polish a live UI',
    defaultPrompt: 'Use $gl-design-review to visually audit and polish this live UI.',
  }],
  ['investigate', {
    shortDescription: 'Debug issues with root cause analysis',
    defaultPrompt: 'Use $gl-investigate to find the root cause of this bug before fixing it.',
  }],
  ['review', {
    shortDescription: 'Run a pre-landing structural code review',
    defaultPrompt: 'Use $gl-review to run a pre-landing structural review of this diff.',
  }],
  ['cso', {
    shortDescription: 'Run a security audit and threat review',
    defaultPrompt: 'Use $gl-cso to run a security audit and threat review for this codebase.',
  }],
  ['browse', {
    shortDescription: 'QA websites with headless browser tools',
    defaultPrompt: 'Use $gl-browse to inspect and test this website in a browser.',
  }],
  ['qa', {
    shortDescription: 'Test web apps and fix found bugs',
    defaultPrompt: 'Use $gl-qa to test this web app, fix found bugs, and verify the fixes.',
  }],
  ['qa-only', {
    shortDescription: 'Report web app bugs without fixing them',
    defaultPrompt: 'Use $gl-qa-only to test this web app and report bugs without fixing them.',
  }],
  ['freeze', {
    shortDescription: 'Restrict edits to one directory',
    defaultPrompt: 'Use $gl-freeze to restrict edits to the relevant directory for this task.',
  }],
  ['unfreeze', {
    shortDescription: 'Remove the edit boundary',
    defaultPrompt: 'Use $gl-unfreeze to clear the current edit boundary.',
  }],
]);

const liteSkillCommandPattern = new RegExp(`(^|[\\s(\\[{"'\`])/(?:${liteSkillCommands.join('|')})\\b`, 'g');

function prefixLiteSkillCommands(markdown) {
  return markdown.replace(liteSkillCommandPattern, (match, prefix) => {
    const command = match.slice(prefix.length + 1);
    return `${prefix}/gl-${command}`;
  });
}

const pathRewrites = [
  [/~\/\.claude\/skills\/gstack\/bin\/gstack-slug/g, '$HOME/.gstack-lite/bin/gl-slug'],
  [/~\/\.claude\/skills\/gstack\/bin\/gstack-diff-scope/g, '$HOME/.gstack-lite/bin/gl-diff-scope'],
  [/~\/\.claude\/skills\/gstack\/browse\/dist\/browse/g, '$HOME/.gstack-lite/browse/dist/browse'],
  [/~\/\.claude\/skills\/gstack\/design\/dist\/design/g, '$HOME/.gstack-lite/design/dist/design'],
  [/~\/\.claude\/skills\/gstack\/design-html\/vendor\/pretext\.js/g, '$HOME/.gstack-lite/design-html/vendor/pretext.js'],
  [/~\/\.claude\/skills\/gstack\/ETHOS\.md/g, '$HOME/.gstack-lite/ETHOS.md'],
  [/~\/\.claude\/skills\/gstack/g, '$HOME/.gstack-lite'],
  [/\.claude\/skills\/review\/checklist\.md/g, '$HOME/.gstack-lite/review/checklist.md'],
  [/\.claude\/skills\/review\/greptile-triage\.md/g, '$HOME/.gstack-lite/review/greptile-triage.md'],
  [/\.claude\/skills\/review\/TODOS-format\.md/g, 'the project TODO format'],
  [/\.claude\/skills\/gstack/g, '.gstack-lite'],
  [/~\/\.gstack/g, '$HOME/.gstack-lite'],
  [/\$HOME\/\.gstack(?!-lite)/g, '$HOME/.gstack-lite'],
  [/\$\{GSTACK_LITE_HOME:-\$HOME\/\.gstack\}/g, '${GSTACK_LITE_HOME:-$HOME/.gstack-lite}'],
  [/\$\{CLAUDE_PLUGIN_DATA:-\$HOME\/\.gstack\}/g, '${GSTACK_LITE_HOME:-$HOME/.gstack-lite}'],
  [/\.gstack\//g, '.gstack-lite/'],
  [/\.gstack\/qa-reports/g, '.gstack-lite/qa-reports'],
  [/\.gstack\/security-reports/g, '.gstack-lite/security-reports'],
  [/\.gstack\/design-reports/g, '.gstack-lite/design-reports'],
  [/\.gstack\/no-test-bootstrap/g, '.gstack-lite/no-test-bootstrap'],
  [/GSTACK_HOME/g, 'GSTACK_LITE_HOME'],
  [/\/ship/g, '/ship (full gstack only)'],
  [/\/land-and-deploy/g, '/land-and-deploy (full gstack only)'],
  [/\/setup-browser-cookies/g, '/setup-browser-cookies (optional full gstack add-on)'],
];

const hostNeutralRewrites = [
  [/Claude Code's Grep tool/g, "the host's search/read tools"],
  [/Claude Code's Agent tool/g, "the host's agent/delegation tool"],
  [/Scan installed Claude skills/g, 'Scan installed AI coding agent skills'],
  [/Scan installed Claude Code skills/g, 'Scan installed AI coding agent skills'],
  [/Claude Code/g, 'AI coding agents'],
  [/Claude subagent/g, 'host subagent'],
  [/Claude adversarial subagent/g, 'host adversarial subagent'],
  [/Claude structured review/g, 'structured review'],
  [/Unique to Claude adversarial/g, 'Unique to host adversarial'],
  [/ls -la \.claude\/skills\/ 2>\/dev\/null/g, 'for d in .claude/skills .codex/skills .cursor/skills; do ls -la "$d" 2>/dev/null; done'],
  [/AskUserQuestion Format/g, 'User Question Format'],
  [/AskUserQuestion response/g, 'user response'],
  [/AskUserQuestion Q/g, 'User question Q'],
  [/via AskUserQuestion/g, 'by asking the user'],
  [/Use AskUserQuestion to/g, 'Ask the user to'],
  [/use AskUserQuestion to/g, 'ask the user to'],
  [/Use AskUserQuestion:/g, 'Ask the user:'],
  [/use AskUserQuestion:/g, 'ask the user:'],
  [/AskUserQuestion:/g, 'Ask the user:'],
  [/AskUserQuestion/g, 'user question'],
  [/Every diff gets adversarial review from both Claude and Codex\./g, 'Every diff should get at least one adversarial pass.'],
  [/Visual sketch requires the browse binary\. Run the setup script to enable it\./g, 'Visual sketch rendering requires the optional browse binary. Continuing with the written wireframe.'],
  [/The gstack(?:-lite)? designer isn't set up yet\. Run `\$D setup` to enable visual mockups\. Proceeding with text-only review, but you're missing the best part\./g, 'The optional lite design binary is not available. Proceeding with text-only review.'],
];

const unicodeReplacements = [
  ['\u2014', '-'],
  ['\u2013', '-'],
  ['\u2011', '-'],
  ['\u2192', '->'],
  ['\u2190', '<-'],
  ['\u2191', 'up'],
  ['\u2193', 'down'],
  ['\u00d7', 'x'],
  ['\u2713', 'yes'],
  ['\u2717', 'no'],
  ['\u2026', '...'],
  ['\u201c', '"'],
  ['\u201d', '"'],
  ['\u2018', "'"],
  ['\u2019', "'"],
  ['\u2260', '!='],
  ['\u2264', '<='],
  ['\u2265', '>='],
  ['\u2248', '~'],
  ['\u00b1', '+/-'],
  ['\u2605', '*'],
  ['\u26a0\ufe0f', 'WARNING'],
  ['\u26a0', 'WARNING'],
  ['\u2588', '#'],
  ['\u2591', '.'],
  ['\u2500', '-'],
  ['\u2502', '|'],
  ['\u250c', '+'],
  ['\u2510', '+'],
  ['\u2514', '+'],
  ['\u2518', '+'],
  ['\u251c', '+'],
  ['\u2524', '+'],
  ['\u252c', '+'],
  ['\u2534', '+'],
  ['\u253c', '+'],
  ['\u2550', '='],
  ['\u2551', '|'],
  ['\u2554', '+'],
  ['\u2557', '+'],
  ['\u255a', '+'],
  ['\u255d', '+'],
  ['\u2560', '+'],
  ['\u2563', '+'],
];

function toAscii(value) {
  let out = value;
  for (const [from, to] of unicodeReplacements) {
    out = out.replaceAll(from, to);
  }
  return out
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function frontmatterOf(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error('missing frontmatter');
  const lines = match[1].split('\n');
  const start = lines.findIndex((line) => line.trim() === 'description: |');
  const descLines = [];
  if (start >= 0) {
    for (const line of lines.slice(start + 1)) {
      if (/^[a-zA-Z0-9_-]+:/.test(line)) break;
      descLines.push(line.replace(/^  ?/, ''));
    }
  }
  const desc = descLines.join('\n').trim();
  return { desc };
}

function blockDescription(description) {
  const cleaned = description
    .replace(/\(gstack\)/g, '(gstack-lite)')
    .replace(/\bgstack\b(?!-lite)/g, 'gstack-lite')
    .trim();
  return toAscii(prefixLiteSkillCommands(cleaned)).split('\n').map((line) => `  ${line}`).join('\n');
}

function findBody(source, skill) {
  let body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  body = body.replace(/^<!-- AUTO-GENERATED[\s\S]*?\n\n/, '');

  const wanted = skillStarts.get(skill);
  let index = body.indexOf(wanted);
  if (index < 0 && wanted.includes('->')) {
    index = body.indexOf(wanted.replaceAll('->', '\u2192'));
  }
  if (index < 0 && wanted.includes('-')) {
    index = body.indexOf(wanted.replace('-', '\u2014'));
  }
  if (index < 0) {
    throw new Error(`could not find start heading for ${skill}: ${wanted}`);
  }
  return body.slice(index).trimStart();
}

function stripSections(markdown) {
  const lines = markdown.split('\n');
  const kept = [];
  let stripping = false;
  let stripFenceOpen = false;

  for (const line of lines) {
    const startsStrip = stripSectionHeadings.some((pattern) => pattern.test(line.trim()));
    const startsNextSection = /^#{1,3}\s+/.test(line) && !startsStrip;

    if (startsStrip) {
      stripping = true;
      stripFenceOpen = false;
      continue;
    }

    if (stripping) {
      if (line.trim().startsWith('```')) stripFenceOpen = !stripFenceOpen;
      if (startsNextSection && !stripFenceOpen) {
        stripping = false;
      } else {
        continue;
      }
    }

    kept.push(line);
  }

  return kept.join('\n');
}

function removeForbiddenLines(markdown) {
  const lines = markdown.split('\n');
  const kept = [];
  let droppingFence = false;

  for (const line of lines) {
    if (droppingFence) {
      if (line.trim().startsWith('```')) droppingFence = false;
      continue;
    }

    if (forbiddenLine.test(line)) {
      if (line.trim().startsWith('```')) droppingFence = true;
      continue;
    }

    kept.push(line);
  }

  return kept.join('\n');
}

function normalizeBody(markdown) {
  let out = toAscii(markdown);

  for (const [from, to] of pathRewrites) {
    out = out.replace(from, to);
  }

  for (const [from, to] of hostNeutralRewrites) {
    out = out.replace(from, to);
  }

  out = prefixLiteSkillCommands(out);

  out = stripSections(out);
  out = out.replace(
    /^If `NEEDS_SETUP`:\n1\. Tell the user:[\s\S]*?^   ```\n/gm,
    'If `NEEDS_SETUP`, browser automation is unavailable in this lite install. Degrade to host-native browser tools if available; otherwise continue with written QA/review and tell the user that `$HOME/.gstack-lite/browse/dist/browse` is missing.\n',
  );
  out = removeForbiddenLines(out);
  out = out.replace(/\n{4,}/g, '\n\n\n');
  return toAscii(out.trimEnd()) + '\n';
}

function yamlString(value) {
  return JSON.stringify(value);
}

function openAiMetadata(skill) {
  const metadata = skillInterface.get(skill);
  if (!metadata) throw new Error(`missing OpenAI metadata for ${skill}`);
  const name = `gl-${skill}`;
  return `interface:
  display_name: ${yamlString(name)}
  short_description: ${yamlString(metadata.shortDescription)}
  default_prompt: ${yamlString(metadata.defaultPrompt)}
policy:
  allow_implicit_invocation: true
`;
}

async function importSkill(skill) {
  const sourcePath = path.join(sourceRoot, skill, 'SKILL.md');
  const source = await readFile(sourcePath, 'utf8');
  const { desc } = frontmatterOf(source);
  const body = normalizeBody(findBody(source, skill));
  const output = `---\nname: gl-${skill}\ndescription: |\n${blockDescription(desc)}\n---\n${litePreamble}${body}`;
  const targetDir = path.join(repoRoot, 'skills', skill);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, 'SKILL.md'), output);
  await mkdir(path.join(targetDir, 'agents'), { recursive: true });
  await writeFile(path.join(targetDir, 'agents', 'openai.yaml'), openAiMetadata(skill));
}

async function copyIfExists(from, to) {
  try {
    await cp(from, to, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function copyTextIfExists(from, to, transform = (value) => value) {
  try {
    const text = await readFile(from, 'utf8');
    await mkdir(path.dirname(to), { recursive: true });
    await writeFile(to, transform(text));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function copyTextDirIfExists(from, to, transform = (value) => value) {
  try {
    const info = await stat(from);
    if (!info.isDirectory()) return;
    await mkdir(to, { recursive: true });
    for (const entry of await readdir(from, { withFileTypes: true })) {
      const src = path.join(from, entry.name);
      const dst = path.join(to, entry.name);
      if (entry.isDirectory()) {
        await copyTextDirIfExists(src, dst, transform);
      } else if (entry.isFile()) {
        await copyTextIfExists(src, dst, transform);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function importAssets() {
  await mkdir(path.join(repoRoot, 'bin'), { recursive: true });
  const slug = (await readFile(path.join(sourceRoot, 'bin', 'gstack-slug'), 'utf8'))
    .replaceAll('$HOME/.gstack', '$HOME/.gstack-lite')
    .replaceAll('gstack-slug', 'gl-slug')
    .replace('CACHE_DIR="$HOME/.gstack-lite/slug-cache"', 'STATE_DIR="${GSTACK_LITE_HOME:-$HOME/.gstack-lite}"\nCACHE_DIR="$STATE_DIR/slug-cache"');
  await writeFile(path.join(repoRoot, 'bin', 'gl-slug'), toAscii(slug), { mode: 0o755 });

  const diffScope = (await readFile(path.join(sourceRoot, 'bin', 'gstack-diff-scope'), 'utf8'))
    .replaceAll('gstack-diff-scope', 'gl-diff-scope');
  await writeFile(path.join(repoRoot, 'bin', 'gl-diff-scope'), toAscii(diffScope), { mode: 0o755 });

  await copyIfExists(path.join(sourceRoot, 'design', 'dist'), path.join(repoRoot, 'design', 'dist'));
  await copyIfExists(path.join(sourceRoot, 'design-html', 'vendor'), path.join(repoRoot, 'design-html', 'vendor'));
  await copyTextIfExists(path.join(sourceRoot, 'review', 'checklist.md'), path.join(repoRoot, 'review', 'checklist.md'), toAscii);
  await copyTextIfExists(
    path.join(sourceRoot, 'review', 'design-checklist.md'),
    path.join(repoRoot, 'review', 'design-checklist.md'),
    (text) => toAscii(text
      .replaceAll('~/.claude/skills/gstack/bin/gstack-diff-scope', '$HOME/.gstack-lite/bin/gl-diff-scope')
      .replaceAll('~/.gstack', '$HOME/.gstack-lite')
      .replace(/\$HOME\/\.gstack(?!-lite)/g, '$HOME/.gstack-lite')
      .replaceAll('.gstack/', '.gstack-lite/')),
  );
  await copyTextIfExists(
    path.join(sourceRoot, 'review', 'greptile-triage.md'),
    path.join(repoRoot, 'review', 'greptile-triage.md'),
    (text) => toAscii(text
      .replaceAll('~/.claude/skills/gstack/browse/bin/remote-slug', '$HOME/.gstack-lite/browse/bin/remote-slug')
      .replaceAll('~/.gstack', '$HOME/.gstack-lite')
      .replace(/\$HOME\/\.gstack(?!-lite)/g, '$HOME/.gstack-lite')
      .replaceAll('.gstack/', '.gstack-lite/')),
  );
  await copyTextDirIfExists(path.join(sourceRoot, 'review', 'specialists'), path.join(repoRoot, 'review', 'specialists'), toAscii);
  await copyTextIfExists(path.join(sourceRoot, 'qa', 'templates', 'qa-report-template.md'), path.join(repoRoot, 'qa', 'templates', 'qa-report-template.md'), toAscii);
  await copyTextIfExists(path.join(sourceRoot, 'qa', 'references', 'issue-taxonomy.md'), path.join(repoRoot, 'qa', 'references', 'issue-taxonomy.md'), toAscii);
  await copyTextIfExists(path.join(sourceRoot, 'ETHOS.md'), path.join(repoRoot, 'ETHOS.md'), toAscii);

  await copyTextIfExists(
    path.join(sourceRoot, 'browse', 'bin', 'remote-slug'),
    path.join(repoRoot, 'browse', 'bin', 'remote-slug'),
    (text) => toAscii(text.replaceAll('~/.gstack', '$HOME/.gstack-lite')),
  );
  await chmod(path.join(repoRoot, 'browse', 'bin', 'remote-slug'), 0o755);
  await chmod(path.join(repoRoot, 'browse', 'bin', 'find-browse'), 0o755);
}

async function main() {
  for (const skill of skills) {
    await importSkill(skill);
  }
  await importAssets();
  console.log(`Imported ${skills.length} skills from ${sourceRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
