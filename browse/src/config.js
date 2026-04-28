import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function getGitRoot(cwd = process.cwd()) {
  try {
    const proc = spawnSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    });
    if (proc.status !== 0) return null;
    return proc.stdout.trim() || null;
  } catch {
    return null;
  }
}

function safeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'workspace';
}

function workspaceSlug(projectDir) {
  const hash = crypto.createHash('sha1').update(projectDir).digest('hex').slice(0, 10);
  return `${safeSlug(path.basename(projectDir))}-${hash}`;
}

export function resolveConfig(env = process.env, cwd = process.cwd()) {
  if (env.BROWSE_STATE_FILE) {
    const stateFile = path.resolve(env.BROWSE_STATE_FILE);
    const stateDir = path.dirname(stateFile);
    const projectDir = path.dirname(stateDir);
    return pathsFor(projectDir, stateDir, stateFile);
  }

  const projectDir = getGitRoot(cwd) || cwd;
  const home = env.GSTACK_BROWSER_HOME
    || env.GSTACK_LITE_HOME
    || path.join(os.homedir(), '.gstack-lite');
  const stateDir = path.join(home, 'browser', 'projects', workspaceSlug(projectDir));
  const stateFile = path.join(stateDir, 'browse.json');
  return pathsFor(projectDir, stateDir, stateFile);
}

function pathsFor(projectDir, stateDir, stateFile) {
  return {
    projectDir,
    stateDir,
    stateFile,
    startupLog: path.join(stateDir, 'startup-error.log'),
    consoleLog: path.join(stateDir, 'console.log'),
    networkLog: path.join(stateDir, 'network.log'),
    dialogLog: path.join(stateDir, 'dialog.log'),
    statesDir: path.join(stateDir, 'states'),
  };
}

export function ensureStateDir(config) {
  fs.mkdirSync(config.stateDir, { recursive: true, mode: 0o700 });
}

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJsonAtomic(file, value, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode });
  fs.renameSync(tmp, file);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isProcessAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function scriptPath(name) {
  return path.join(packageRoot, 'src', name);
}
