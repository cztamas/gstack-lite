import { execFile } from 'node:child_process';
import { lstat, mkdtemp, readFile, readlink, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('installer layout', () => {
  it('installs Codex skills from generated output with ETHOS.md per skill', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-install-'));
    const home = path.join(tmp, 'home');
    const runtime = path.join(tmp, 'runtime');
    const codexSkills = path.join(tmp, 'codex-skills');
    const env = {
      ...process.env,
      HOME: home,
      GSTACK_LITE_HOME: runtime,
      CODEX_SKILLS_DIR: codexSkills,
    };

    try {
      await execFileAsync('bash', ['install', '--host', 'codex'], {
        cwd: process.cwd(),
        env,
      });

      const installed = path.join(codexSkills, 'gl-office-hours');
      await expect(stat(installed)).resolves.toBeTruthy();

      const skillInfo = await lstat(path.join(installed, 'SKILL.md'));
      expect(skillInfo.isFile()).toBe(true);
      expect(skillInfo.isSymbolicLink()).toBe(false);

      const agentsInfo = await lstat(path.join(installed, 'agents'));
      expect(agentsInfo.isDirectory()).toBe(true);
      expect(agentsInfo.isSymbolicLink()).toBe(false);

      await expect(readlink(path.join(installed, 'ETHOS.md'))).resolves.toBe(
        path.join(runtime, 'generated', 'codex', 'gl-office-hours', 'ETHOS.md'),
      );
      await expect(readFile(path.join(installed, 'ETHOS.md'), 'utf8')).resolves.toContain(
        'Search Before Building',
      );

      const engReview = await readFile(
        path.join(codexSkills, 'gl-plan-eng-review', 'SKILL.md'),
        'utf8',
      );
      expect(engReview).toContain('$HOME/.codex/skills/gl-office-hours/SKILL.md');
      expect(engReview).not.toContain('$HOME/.gstack-lite/office-hours/SKILL.md');

      await execFileAsync('bash', ['uninstall', '--host', 'codex'], {
        cwd: process.cwd(),
        env,
      });
      await expect(stat(installed)).rejects.toThrow();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
