#!/usr/bin/env node
import path from 'node:path';
import { defaultRepoRoot, generateSkills, writeSourceSkills } from './skill-generator/generate.mjs';
import { hosts } from './skill-generator/config.mjs';

function usage() {
  console.error(`Usage:
  node tools/generate-skills.mjs --host codex --out /tmp/generated
  node tools/generate-skills.mjs --all --out /tmp/generated
  node tools/generate-skills.mjs --write-source`);
}

function parseArgs(argv) {
  const opts = { host: undefined, all: false, out: undefined, writeSource: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--host') {
      opts.host = argv[++i];
    } else if (arg.startsWith('--host=')) {
      opts.host = arg.slice('--host='.length);
    } else if (arg === '--all') {
      opts.all = true;
    } else if (arg === '--out') {
      opts.out = argv[++i];
    } else if (arg.startsWith('--out=')) {
      opts.out = arg.slice('--out='.length);
    } else if (arg === '--write-source') {
      opts.writeSource = true;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.writeSource) {
    await writeSourceSkills({ repoRoot: defaultRepoRoot });
    console.log('updated source SKILL.md files');
    return;
  }

  if (!opts.out) {
    throw new Error('--out is required unless --write-source is used');
  }

  const selectedHosts = opts.all ? hosts : [opts.host ?? 'claude'];
  for (const host of selectedHosts) {
    const outDir = opts.all ? path.join(opts.out, host) : opts.out;
    await generateSkills({ repoRoot: defaultRepoRoot, host, outDir });
    console.log(`generated ${host} skills: ${outDir}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(1);
});
