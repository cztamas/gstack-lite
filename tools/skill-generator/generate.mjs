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
import { expectedSkills, hosts } from './config.mjs';
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

export async function renderSkill({ repoRoot = defaultRepoRoot, skill, host = 'source' }) {
  const template = await readFile(skillTemplatePath(repoRoot, skill), 'utf8');
  const rendered = resolveTemplate(template, { host, repoRoot, skill });
  const unresolved = rendered.match(/\{\{[A-Z_]+(?::[^}]+)?\}\}/g);
  if (unresolved) {
    throw new Error(`${skill}: unresolved placeholders: ${unresolved.join(', ')}`);
  }
  return rendered;
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
    await writeFile(path.join(dir, 'SKILL.md'), await renderSkill({ repoRoot, skill, host }));
    await writeEthosLink(repoRoot, dir);
    await copyAgents(repoRoot, skill, dir);
    await copyAssets(repoRoot, skill, dir);
    generated.push(dir);
  }

  return generated;
}

export async function writeSourceSkills({ repoRoot = defaultRepoRoot, skills = expectedSkills } = {}) {
  for (const skill of skills) {
    await writeFile(
      path.join(skillSourceDir(repoRoot, skill), 'SKILL.md'),
      await renderSkill({ repoRoot, skill, host: 'source' }),
    );
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
