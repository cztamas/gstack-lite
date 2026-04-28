#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const expectedSkills = [
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
  'qa',
  'qa-only',
  'freeze',
  'unfreeze',
].sort();

const forbiddenPatterns = [
  /~\/\.claude\/skills\/gstack/,
  /\.claude\/skills\/gstack/,
  /~\/\.gstack(?!-lite)/,
  /\$HOME\/\.gstack(?!-lite)/,
  /\$\{GSTACK_LITE_HOME:-\$HOME\/\.gstack\}/,
  /\.gstack\//,
  /\bAskUserQuestion\b/,
  /<SKILL_DIR>\s*&&\s*\.\/setup/,
  /\bbuilder-profile\.jsonl\b/,
  /\bskill-usage\.jsonl\b/,
  /analytics\/skill-usage/,
  /\bgstack-(?:update-check|config|telemetry-log|timeline-log|learnings-(?:search|log)|question-(?:preference|log)|review-(?:log|read)|taste-update|builder-profile|specialist-stats|brain|gbrain)\b/,
  /\bGBrain\b/,
  /\bSupabase\b/,
  /\bcommunity pulse\b/i,
  /\bauto-upgrade\b/i,
  /\btelemetry prompt\b/i,
  /\bcodex\s+(?:exec|review)\b/i,
  /\bwhich codex\b/i,
  /\bCODEX_/,
];

const scanRoots = [
  'skills',
  'bin',
  'browse/bin',
  'design-html',
  'review',
  'qa',
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(entry, out = []) {
  const full = path.join(repoRoot, entry);
  if (!(await exists(full))) return out;
  const info = await stat(full);
  if (info.isFile()) {
    out.push(entry);
    return out;
  }
  for (const child of await readdir(full)) {
    await walk(path.join(entry, child), out);
  }
  return out;
}

function parseFrontmatter(text, filePath) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error(`${filePath}: missing frontmatter`);
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const desc = frontmatter.match(/^description:\s*\|\n([\s\S]*)$/m)?.[1]?.trim() || '';
  return { name, desc };
}

async function validateSkills() {
  const skillDir = path.join(repoRoot, 'skills');
  const actual = (await readdir(skillDir)).sort();
  if (actual.join('\n') !== expectedSkills.join('\n')) {
    throw new Error(`skill set mismatch\nexpected:\n${expectedSkills.join('\n')}\nactual:\n${actual.join('\n')}`);
  }

  for (const skill of expectedSkills) {
    const rel = path.join('skills', skill, 'SKILL.md');
    const text = await readFile(path.join(repoRoot, rel), 'utf8');
    const { name, desc } = parseFrontmatter(text, rel);
    if (name !== `gstack-lite-${skill}`) {
      throw new Error(`${rel}: expected name gstack-lite-${skill}, got ${name}`);
    }
    if (!desc) {
      throw new Error(`${rel}: empty description`);
    }
    if (desc.length > 1024) {
      throw new Error(`${rel}: description exceeds 1024 chars (${desc.length})`);
    }
  }
}

async function validateForbiddenText() {
  const files = [];
  for (const root of scanRoots) {
    await walk(root, files);
  }

  const failures = [];
  for (const file of files) {
    const text = await readFile(path.join(repoRoot, file), 'utf8');
    for (const pattern of forbiddenPatterns) {
      const match = text.match(pattern);
      if (match) {
        failures.push(`${file}: ${match[0]}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`forbidden full-gstack references found:\n${failures.join('\n')}`);
  }
}

async function main() {
  await validateSkills();
  await validateForbiddenText();
  console.log('gstack-lite validation passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
