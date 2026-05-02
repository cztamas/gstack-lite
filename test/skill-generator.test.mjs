import { mkdtemp, readFile, rm, lstat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { expectedSkills, hosts } from '../tools/skill-generator/config.mjs';
import { defaultRepoRoot, generateSkills } from '../tools/skill-generator/generate.mjs';

describe('skill generator', () => {
  it('generates every host skill with reachable ETHOS.md', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-generator-'));
    try {
      for (const host of hosts) {
        const outDir = path.join(tmp, host);
        await generateSkills({ repoRoot: defaultRepoRoot, host, outDir });

        for (const skill of expectedSkills) {
          const skillDir = path.join(outDir, `gl-${skill}`);
          const skillText = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
          expect(skillText).toContain('## Search Before Building');
          expect(skillText).toContain('## Completion Status Protocol');
          expect(skillText).not.toContain('{{LITE_PREAMBLE}}');

          const ethosInfo = await lstat(path.join(skillDir, 'ETHOS.md'));
          expect(ethosInfo.isFile() || ethosInfo.isSymbolicLink()).toBe(true);
          await expect(readFile(path.join(skillDir, 'ETHOS.md'), 'utf8')).resolves.toContain(
            'Search Before Building',
          );
        }
      }
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('renders host-specific cross-skill invocation paths', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-invoke-'));
    try {
      const outDir = path.join(tmp, 'codex');
      await generateSkills({ repoRoot: defaultRepoRoot, host: 'codex', outDir });
      const text = await readFile(path.join(outDir, 'gl-plan-eng-review', 'SKILL.md'), 'utf8');

      expect(text).toContain('$HOME/.codex/skills/gl-office-hours/SKILL.md');
      expect(text).toContain('../gl-office-hours/SKILL.md');
      expect(text).not.toContain('$HOME/.gstack-lite/office-hours/SKILL.md');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
