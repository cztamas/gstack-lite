#!/usr/bin/env node
import {
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expectedSkills,
  expectedSkillsSorted,
  hosts,
  liteSkillCommands,
} from './skill-generator/config.mjs';
import {
  defaultRepoRoot,
  discoverTemplateSkills,
  generateSkills,
  renderSkillPackage,
} from './skill-generator/generate.mjs';
import { assertProgressiveDisclosureContract } from './skill-generator/progressive-disclosure-contracts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const unprefixedLiteSkillCommand = new RegExp(`(^|[\\s(\\[{"'\`])/(?:${liteSkillCommands.join('|')})\\b`);

const forbiddenPatterns = [
  new RegExp(`${['gstack', 'lite'].join('-')}-`),
  /~\/\.claude\/skills\/gstack/,
  /\.claude\/skills\/gstack/,
  /~\/\.gstack(?!-lite)/,
  /\$HOME\/\.gstack(?!-lite)/,
  /\$\{GSTACK_LITE_HOME:-\$HOME\/\.gstack\}/,
  /\$HOME\/\.gstack-lite\/analytics/,
  /\$HOME\/\.gstack-lite\/[^/\s`]+\/SKILL\.md/,
  /\bslug-cache\b/,
  /\bCLAUDE_PLUGIN_DATA\b/,
  /\bspec-review\.jsonl\b/,
  /\bfind-browse\b/,
  /\$B\b/,
  /\bB=""/,
  /\bbrowse\/dist\/browse\b/,
  /\bgstack-browse\b/,
  /\bGSTACK_BROWSER_(?:PROVIDER|BIN)\b/,
  /\bBROWSE_NOT_AVAILABLE\b/,
  /\bbrowse binary\b/i,
  /\.gstack\//,
  /\bAskUserQuestion\b/,
  /<SKILL_DIR>\s*&&\s*\.\/setup/,
  /\bbuilder-profile\.jsonl\b/,
  /\bskill-usage\.jsonl\b/,
  /analytics\/skill-usage/,
  /Review Readiness Dashboard step above/,
  /Parse each JSONL entry/,
  /\b(?:codex-review|plan-devex-review|devex-review)\b/,
  /by asking the user/i,
  /call user question/i,
  /user question as a tool_use/i,
  /ask the user to wait for the user/i,
  /gates by asking the user/i,
  /using the preamble's User Question Format section/i,
  /Follow the user question format/,
  /\bgstack-(?:update-check|config|telemetry-log|timeline-log|learnings-(?:search|log)|question-(?:preference|log)|review-(?:log|read)|taste-update|builder-profile|specialist-stats|brain|gbrain)\b/,
  /\bGBrain\b/,
  /\bSupabase\b/,
  /\bcommunity pulse\b/i,
  /\bauto-upgrade\b/i,
  /\btelemetry prompt\b/i,
  /\bcodex\s+(?:exec|review)\b/i,
  /\bwhich codex\b/i,
  /\bCODEX_/,
  /\bCLAUDE_SKILL_DIR\b/,
  /\bcheck-freeze\b/,
  unprefixedLiteSkillCommand,
];

const browserForbiddenPatterns = [
  /\bfind-browse\b/,
  /\$B\b/,
  /\bB=""/,
  /\bbrowse\/dist\/browse\b/,
  /\bgstack-browse\b/,
  /\bGSTACK_BROWSER_(?:PROVIDER|BIN)\b/,
  /\bBROWSE_NOT_AVAILABLE\b/,
  /\bbrowse binary\b/i,
];

const sourceScanRoots = [
  'skills',
  'bin',
  'browse/bin',
  'design-html',
  'review',
  'qa',
];

const browserScanRoots = [
  'skills',
  'browse/bin',
  'README.md',
  'browse/README.md',
  'install',
  'browse/package.json',
  'package-lock.json',
];

const requiredPreambleSections = [
  'User Question Format',
  'Blocking User Question Protocol',
  'Completeness Principle - Boil the Lake',
  'Search Before Building',
  'Completion Status Protocol',
  'Review Readiness Dashboard',
  'Plan File Review Report',
];

const referencedSectionPatterns = [
  {
    heading: 'User Question Format',
    patterns: [/User Question Format section/, /user question format from the Preamble/i],
  },
  {
    heading: 'Blocking User Question Protocol',
    patterns: [/Blocking User Question/, /stop for feedback/i, /wait for the user/i],
  },
  {
    heading: 'Completeness Principle - Boil the Lake',
    patterns: [/Completeness Principle - Boil the Lake/],
  },
  {
    heading: 'Search Before Building',
    patterns: [/Search Before Building section/, /Search Before Building framework/],
  },
  {
    heading: 'Completion Status Protocol',
    patterns: [/Completion Status Protocol/],
  },
  {
    heading: 'Review Readiness Dashboard',
    patterns: [/Review Readiness Dashboard/],
  },
  {
    heading: 'Plan File Review Report',
    patterns: [/Plan File Review Report/],
  },
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootPath, out = []) {
  if (!(await exists(rootPath))) return out;
  const info = await stat(rootPath);
  if (info.isFile()) {
    out.push(rootPath);
    return out;
  }
  for (const child of await readdir(rootPath)) {
    await walkFiles(path.join(rootPath, child), out);
  }
  return out;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath) || filePath;
}

function parseFrontmatter(text, filePath) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error(`${filePath}: missing frontmatter`);
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const desc = frontmatter.match(/^description:\s*\|\n([\s\S]*)$/m)?.[1]?.trim() || '';
  return { name, desc };
}

function parseQuotedField(text, field) {
  const value = text.match(new RegExp(`^  ${field}:\\s*"([^"]+)"$`, 'm'))?.[1];
  return value ? value.replace(/\\"/g, '"') : undefined;
}

function parseHeadings(text) {
  return new Set(
    [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1]),
  );
}

function validateReferencedSections(text, filePath) {
  const headings = parseHeadings(text);
  for (const section of requiredPreambleSections) {
    if (!headings.has(section)) {
      throw new Error(`${filePath}: missing generated preamble section "${section}"`);
    }
  }

  for (const { heading, patterns } of referencedSectionPatterns) {
    if (patterns.some((pattern) => pattern.test(text)) && !headings.has(heading)) {
      throw new Error(`${filePath}: references missing section "${heading}"`);
    }
  }
}

async function validateSkillFile({ skill, filePath }) {
  const text = await readFile(filePath, 'utf8');
  const { name, desc } = parseFrontmatter(text, rel(filePath));
  if (name !== `gl-${skill}`) {
    throw new Error(`${rel(filePath)}: expected name gl-${skill}, got ${name}`);
  }
  if (!desc) {
    throw new Error(`${rel(filePath)}: empty description`);
  }
  if (desc.length > 1024) {
    throw new Error(`${rel(filePath)}: description exceeds 1024 chars (${desc.length})`);
  }
  if (/\{\{[A-Z_]+(?::[^}]+)?\}\}/.test(text)) {
    throw new Error(`${rel(filePath)}: unresolved generator placeholder`);
  }
  validateReferencedSections(text, rel(filePath));
}

function validateReferenceText({ skill, filePath, text }) {
  if (/\{\{[A-Z_]+(?::[^}]+)?\}\}/.test(text)) {
    throw new Error(`${rel(filePath)}: unresolved generator placeholder in ${skill} reference`);
  }
}

async function validateRenderedReferences({ skill, skillDir, references }) {
  const dir = path.join(skillDir, 'references');
  const expectedFiles = new Set(references.map((reference) => reference.file));
  const actualFiles = new Set();
  if (await exists(dir)) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) actualFiles.add(entry.name);
    }
  }

  if ([...actualFiles].sort().join('\n') !== [...expectedFiles].sort().join('\n')) {
    throw new Error(
      `${rel(dir)}: generated reference set mismatch; expected ${[
        ...expectedFiles,
      ].join(', ') || 'none'}, got ${[...actualFiles].join(', ') || 'none'}`,
    );
  }

  for (const reference of references) {
    const filePath = path.join(dir, reference.file);
    const committed = await readFile(filePath, 'utf8');
    if (committed !== reference.text) {
      throw new Error(`${rel(filePath)}: generated output is stale; run npm run generate:skills`);
    }
    validateReferenceText({ skill, filePath, text: committed });
  }
}

async function validateMetadata({ skill, metadataPath }) {
  const metadata = await readFile(metadataPath, 'utf8');
  const displayName = parseQuotedField(metadata, 'display_name');
  const shortDescription = parseQuotedField(metadata, 'short_description');
  const defaultPrompt = parseQuotedField(metadata, 'default_prompt');
  if (displayName !== `gl-${skill}`) {
    throw new Error(`${rel(metadataPath)}: expected display_name gl-${skill}, got ${displayName}`);
  }
  if (!shortDescription) {
    throw new Error(`${rel(metadataPath)}: missing short_description`);
  }
  if (!defaultPrompt?.includes(`$gl-${skill}`)) {
    throw new Error(`${rel(metadataPath)}: default_prompt must mention $gl-${skill}`);
  }
  if (!/^policy:\n  allow_implicit_invocation: true\n?$/m.test(metadata)) {
    throw new Error(`${rel(metadataPath)}: expected allow_implicit_invocation policy`);
  }
}

async function validateSourceSkills() {
  const actual = await discoverTemplateSkills(repoRoot);
  if (actual.join('\n') !== expectedSkillsSorted.join('\n')) {
    throw new Error(`skill set mismatch\nexpected:\n${expectedSkillsSorted.join('\n')}\nactual:\n${actual.join('\n')}`);
  }

  for (const skill of expectedSkills) {
    const skillDir = path.join(repoRoot, 'skills', skill);
    const templatePath = path.join(skillDir, 'SKILL.md.tmpl');
    const skillPath = path.join(skillDir, 'SKILL.md');
    const template = await readFile(templatePath, 'utf8');
    if (!template.includes('{{LITE_PREAMBLE}}')) {
      throw new Error(`${rel(templatePath)}: missing {{LITE_PREAMBLE}} placeholder`);
    }

    const rendered = await renderSkillPackage({ repoRoot, skill, host: 'source' });
    const committed = await readFile(skillPath, 'utf8');
    if (committed !== rendered.skillText) {
      throw new Error(`${rel(skillPath)}: generated output is stale; run npm run generate:skills`);
    }

    await validateSkillFile({ skill, filePath: skillPath });
    await validateRenderedReferences({ skill, skillDir, references: rendered.references });
    assertProgressiveDisclosureContract({ skill, host: 'source', rendered });
    await validateMetadata({
      skill,
      metadataPath: path.join(skillDir, 'agents', 'openai.yaml'),
    });
  }
}

async function validateGeneratedHost(host, outDir) {
  await generateSkills({ repoRoot, host, outDir });
  for (const skill of expectedSkills) {
    const skillDir = path.join(outDir, `gl-${skill}`);
    const rendered = await renderSkillPackage({ repoRoot, skill, host });
    await validateSkillFile({ skill, filePath: path.join(skillDir, 'SKILL.md') });
    await validateRenderedReferences({ skill, skillDir, references: rendered.references });
    assertProgressiveDisclosureContract({ skill, host, rendered });
    await validateMetadata({
      skill,
      metadataPath: path.join(skillDir, 'agents', 'openai.yaml'),
    });

    const ethosPath = path.join(skillDir, 'ETHOS.md');
    const ethosInfo = await lstat(ethosPath);
    if (!ethosInfo.isFile() && !ethosInfo.isSymbolicLink()) {
      throw new Error(`${rel(ethosPath)}: ETHOS.md is not reachable`);
    }
    const ethos = await readFile(ethosPath, 'utf8');
    if (!ethos.includes('Search Before Building')) {
      throw new Error(`${rel(ethosPath)}: ETHOS.md content is not readable`);
    }
  }
}

async function validateForbiddenTextInFiles(files, patterns, label) {
  const failures = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        failures.push(`${rel(file)}: ${match[0]}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`${label}:\n${failures.join('\n')}`);
  }
}

async function validateForbiddenText(generatedRoot) {
  const sourceFiles = [];
  for (const root of sourceScanRoots) {
    await walkFiles(path.join(repoRoot, root), sourceFiles);
  }
  const generatedFiles = await walkFiles(generatedRoot);
  await validateForbiddenTextInFiles(
    [...sourceFiles, ...generatedFiles],
    forbiddenPatterns,
    'forbidden full-gstack references found',
  );

  const browserFiles = [];
  for (const root of browserScanRoots) {
    await walkFiles(path.join(repoRoot, root), browserFiles);
  }
  await validateForbiddenTextInFiles(
    browserFiles,
    browserForbiddenPatterns,
    'forbidden browser resolver references found',
  );
}

async function main() {
  if (repoRoot !== defaultRepoRoot) {
    throw new Error(`repo root mismatch: ${repoRoot} !== ${defaultRepoRoot}`);
  }

  const generatedRoot = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-validate-'));
  try {
    await validateSourceSkills();
    for (const host of hosts) {
      await validateGeneratedHost(host, path.join(generatedRoot, host));
    }
    await validateForbiddenText(generatedRoot);
  } finally {
    await rm(generatedRoot, { recursive: true, force: true });
  }

  console.log('gstack-lite validation passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
