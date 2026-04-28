#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { isProcessAlive, readJson, resolveConfig, scriptPath, sleep } from './config.js';

const config = resolveConfig();

function readState() {
  return readJson(config.stateFile);
}

async function isHealthy(state) {
  if (!state?.port) return false;
  try {
    const response = await fetch(`http://127.0.0.1:${state.port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return false;
    const health = await response.json();
    return health.status === 'healthy';
  } catch {
    return false;
  }
}

async function killServer(pid) {
  if (!isProcessAlive(pid)) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {}
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline && isProcessAlive(pid)) await sleep(100);
  if (isProcessAlive(pid)) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {}
  }
}

async function startServer() {
  fs.rmSync(config.startupLog, { force: true });
  fs.rmSync(config.stateFile, { force: true });

  const serverScript = scriptPath('server.js');
  const child = spawn(process.execPath, [serverScript], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
    env: {
      ...process.env,
      BROWSE_STATE_FILE: config.stateFile,
    },
  });
  child.unref();

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const state = readState();
    if (state && await isHealthy(state)) return state;
    await sleep(100);
  }

  let detail = '';
  try {
    detail = fs.readFileSync(config.startupLog, 'utf8').trim();
  } catch {}
  throw new Error(`Server failed to start.${detail ? `\n${detail}` : ''}`);
}

async function ensureServer() {
  const state = readState();
  if (state && await isHealthy(state)) return state;
  if (state?.pid) await killServer(state.pid);
  return startServer();
}

async function sendCommand(state, command, args) {
  const response = await fetch(`http://127.0.0.1:${state.port}/command`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({ command, args }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await response.text();
  if (!response.ok) {
    try {
      const parsed = JSON.parse(body);
      throw new Error(parsed.error || body);
    } catch (err) {
      if (err.message !== body) throw err;
      throw new Error(body);
    }
  }
  process.stdout.write(body);
  if (!body.endsWith('\n')) process.stdout.write('\n');
}

function printHelp() {
  process.stdout.write(`gstack-browser

Usage:
  gstack-browser <command> [args...]

Core commands:
  goto <url>              navigate to http(s), file, or local path
  snapshot [-i]           list visible elements with @e refs
  click|fill|hover <ref>  interact with @e refs or CSS selectors
  text|html|links|forms   inspect page content
  screenshot [path]       save a screenshot
  responsive [prefix]     save mobile/tablet/desktop screenshots
  console|network         inspect captured logs
  tabs|newtab|tab|closetab
  status|stop|restart

State:
  ${config.stateFile}
`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  let commandArgs = args;
  if (command === 'chain' && args.length === 0 && !process.stdin.isTTY) {
    commandArgs = [await readStdin()];
  }

  const state = await ensureServer();
  try {
    await sendCommand(state, command, commandArgs);
  } catch (err) {
    if (/fetch failed|ECONNRESET|ECONNREFUSED/i.test(err.message || '')) {
      if (state?.pid) await killServer(state.pid);
      const fresh = await startServer();
      await sendCommand(fresh, command, commandArgs);
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(`[gstack-browser] ${err.message || err}`);
  process.exit(1);
});
