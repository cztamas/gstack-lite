import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectedSkills, hosts, referenceLoadingByHost } from './config.mjs';
import { resolveTemplate } from './resolvers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const defaultRepoRoot = path.resolve(__dirname, '../..');

export function assertKnownHost(host) {
  if (!hosts.includes(host)) {
    throw new Error(`unknown host: ${host}`);
  }
}

export function skillSourceDir(repoRoot, skill) {
  return path.join(repoRoot, 'skills', skill);
}

export function skillTemplatePath(repoRoot, skill) {
  return path.join(skillSourceDir(repoRoot, skill), 'SKILL.md.tmpl');
}

export function skillOutputName(skill) {
  return `gl-${skill}`;
}

function referenceDir(repoRoot, skill) {
  return path.join(skillSourceDir(repoRoot, skill), 'references');
}

function assertSafeReferenceFile(skill, file) {
  const normalized = path.posix.normalize(file);
  if (
    typeof file !== 'string' ||
    !file.endsWith('.md') ||
    file.includes('\\') ||
    file.includes('/') ||
    path.posix.isAbsolute(file) ||
    normalized !== file ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error(`${skill}: unsafe reference file "${file}"`);
  }
}

function validateManifestEntry(skill, entry, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${skill}: reference manifest entry ${index} must be an object`);
  }
  const expectedFields = ['file', 'id', 'title', 'trigger'];
  const actualFields = Object.keys(entry).sort();
  if (actualFields.join('\n') !== expectedFields.join('\n')) {
    throw new Error(
      `${skill}: reference manifest entry ${index} must contain exactly id, file, title, trigger`,
    );
  }
  for (const field of expectedFields) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) {
      throw new Error(`${skill}: reference manifest entry ${index} has invalid ${field}`);
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
    throw new Error(`${skill}: invalid reference id "${entry.id}"`);
  }
  assertSafeReferenceFile(skill, entry.file);
}

function validateReferenceGraph(skill, references) {
  const byId = new Map(references.map((reference) => [reference.id, reference]));
  const graph = new Map();
  for (const reference of references) {
    const dependencies = [
      ...reference.template.matchAll(/\{\{REFERENCE:([^}]+)\}\}/g),
    ].map((match) => match[1].trim());
    for (const dependency of dependencies) {
      if (!byId.has(dependency)) {
        throw new Error(
          `${skill} references/${reference.file}.tmpl: unknown reference id "${dependency}"`,
        );
      }
    }
    graph.set(reference.id, dependencies);
  }

  const complete = new Set();
  function visit(id, stack) {
    if (complete.has(id)) return;
    const cycleStart = stack.indexOf(id);
    if (cycleStart !== -1) {
      const cycle = [...stack.slice(cycleStart), id].map((item) => `REFERENCE:${item}`);
      throw new Error(`${skill}: reference cycle: ${cycle.join(' -> ')}`);
    }
    const nextStack = [...stack, id];
    for (const dependency of graph.get(id) ?? []) visit(dependency, nextStack);
    complete.add(id);
  }
  for (const id of graph.keys()) visit(id, []);
}

export async function loadSkillReferences({ repoRoot = defaultRepoRoot, skill }) {
  const dir = referenceDir(repoRoot, skill);
  const manifestPath = path.join(dir, 'manifest.json');
  let manifestText;
  try {
    manifestText = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      try {
        const orphan = (await readdir(dir, { withFileTypes: true })).find(
          (entry) => entry.isFile() && (entry.name.endsWith('.md.tmpl') || entry.name.endsWith('.md')),
        );
        if (orphan) {
          throw new Error(
            `${skill}: references/${orphan.name} exists without references/manifest.json`,
          );
        }
      } catch (directoryError) {
        if (directoryError?.code !== 'ENOENT') throw directoryError;
      }
      return [];
    }
    throw error;
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch (error) {
    throw new Error(`${skill}: invalid references/manifest.json: ${error.message}`);
  }
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error(`${skill}: references/manifest.json must be a non-empty array`);
  }

  const ids = new Set();
  const files = new Set();
  const references = [];
  for (const [index, entry] of manifest.entries()) {
    validateManifestEntry(skill, entry, index);
    if (ids.has(entry.id)) {
      throw new Error(`${skill}: duplicate reference id "${entry.id}"`);
    }
    if (files.has(entry.file)) {
      throw new Error(`${skill}: duplicate reference file "${entry.file}"`);
    }
    ids.add(entry.id);
    files.add(entry.file);

    const templatePath = path.join(dir, `${entry.file}.tmpl`);
    let template;
    try {
      template = await readFile(templatePath, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`${skill}: missing reference template references/${entry.file}.tmpl`);
      }
      throw error;
    }
    references.push({ ...entry, template });
  }

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md.tmpl')) continue;
    const outputFile = entry.name.slice(0, -'.tmpl'.length);
    if (!files.has(outputFile)) {
      throw new Error(`${skill}: undeclared reference template references/${entry.name}`);
    }
  }

  validateReferenceGraph(skill, references);
  return references;
}

function assertResolved(skill, source, rendered) {
  const unresolved = rendered.match(/\{\{[A-Z_]+(?::[^}]+)?\}\}/g);
  if (unresolved) {
    throw new Error(`${skill} ${source}: unresolved placeholders: ${unresolved.join(', ')}`);
  }
}

export async function renderSkillPackage({ repoRoot = defaultRepoRoot, skill, host = 'source' }) {
  const referenceLoading = referenceLoadingByHost[host];
  if (!referenceLoading) {
    throw new Error(`unknown render host: ${host}`);
  }

  const references = await loadSkillReferences({ repoRoot, skill });
  const ctx = { host, repoRoot, skill, references, referenceLoading };
  const renderedReferences = references.map((reference) => {
    const text = resolveTemplate(reference.template, ctx, {
      source: `references/${reference.file}.tmpl`,
      stack: [`REFERENCE:${reference.id}`],
      depth: 1,
    });
    assertResolved(skill, `references/${reference.file}`, text);
    return { id: reference.id, file: reference.file, text };
  });

  const template = await readFile(skillTemplatePath(repoRoot, skill), 'utf8');
  const skillText = resolveTemplate(template, ctx);
  assertResolved(skill, 'SKILL.md', skillText);
  return { skillText, references: renderedReferences };
}

export async function renderSkill(options) {
  return (await renderSkillPackage(options)).skillText;
}

async function resetPath(filePath) {
  try {
    await lstat(filePath);
  } catch {
    return;
  }
  await rm(filePath, { recursive: true, force: true });
}

async function writeEthosLink(repoRoot, outDir) {
  const dst = path.join(outDir, 'ETHOS.md');
  await resetPath(dst);
  try {
    await symlink(path.join(repoRoot, 'ETHOS.md'), dst);
  } catch {
    await cp(path.join(repoRoot, 'ETHOS.md'), dst);
  }
}

async function copyAgents(repoRoot, skill, outDir) {
  const src = path.join(skillSourceDir(repoRoot, skill), 'agents');
  const dst = path.join(outDir, 'agents');
  await resetPath(dst);
  await cp(src, dst, { recursive: true });
}

async function copyAssets(repoRoot, skill, outDir) {
  const src = path.join(skillSourceDir(repoRoot, skill), 'assets');
  try {
    const info = await lstat(src);
    if (!info.isDirectory()) return;
  } catch {
    return;
  }

  const dst = path.join(outDir, 'assets');
  await resetPath(dst);
  await cp(src, dst, { recursive: true });
}

async function writeGeneratedReferences(outDir, references) {
  const dir = path.join(outDir, 'references');
  await resetPath(dir);
  if (!references.length) return;
  await mkdir(dir, { recursive: true });
  for (const reference of references) {
    const outputPath = path.join(dir, reference.file);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, reference.text);
  }
}

async function writeSourceReferences(repoRoot, skill, references) {
  const dir = referenceDir(repoRoot, skill);
  if (!references.length) return;
  await mkdir(dir, { recursive: true });
  const declared = new Set(references.map((reference) => reference.file));
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md') && !declared.has(entry.name)) {
      await unlink(path.join(dir, entry.name));
    }
  }
  for (const reference of references) {
    const outputPath = path.join(dir, reference.file);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, reference.text);
  }
}

export async function generateSkills({
  repoRoot = defaultRepoRoot,
  host,
  outDir,
  clean = true,
  skills = expectedSkills,
}) {
  assertKnownHost(host);
  if (!outDir) {
    throw new Error('generateSkills requires outDir');
  }

  if (clean) {
    await resetPath(outDir);
  }
  await mkdir(outDir, { recursive: true });

  const generated = [];
  for (const skill of skills) {
    const dir = path.join(outDir, skillOutputName(skill));
    await mkdir(dir, { recursive: true });
    const rendered = await renderSkillPackage({ repoRoot, skill, host });
    await writeFile(path.join(dir, 'SKILL.md'), rendered.skillText);
    await writeGeneratedReferences(dir, rendered.references);
    await writeEthosLink(repoRoot, dir);
    await copyAgents(repoRoot, skill, dir);
    await copyAssets(repoRoot, skill, dir);
    generated.push(dir);
  }

  return generated;
}

export async function writeSourceSkills({ repoRoot = defaultRepoRoot, skills = expectedSkills } = {}) {
  for (const skill of skills) {
    const rendered = await renderSkillPackage({ repoRoot, skill, host: 'source' });
    await writeFile(
      path.join(skillSourceDir(repoRoot, skill), 'SKILL.md'),
      rendered.skillText,
    );
    await writeSourceReferences(repoRoot, skill, rendered.references);
  }
}

export async function discoverTemplateSkills(repoRoot = defaultRepoRoot) {
  const skillRoot = path.join(repoRoot, 'skills');
  const names = [];
  for (const entry of await readdir(skillRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      names.push(entry.name);
    }
  }
  return names.sort();
}
