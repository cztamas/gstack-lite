import { execFile } from 'node:child_process';
import { lstat, mkdtemp, readFile, readlink, rm, stat, writeFile } from 'node:fs/promises';
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

      const ceoReview = await readFile(
        path.join(codexSkills, 'gl-plan-ceo-review', 'SKILL.md'),
        'utf8',
      );
      expect(ceoReview).toContain('$HOME/.codex/skills/gl-office-hours/SKILL.md');
      expect(ceoReview).not.toContain('$HOME/.gstack-lite/office-hours/SKILL.md');

      const ceoReference = path.join(
        codexSkills,
        'gl-plan-ceo-review',
        'references',
        'review-flow.md',
      );
      await expect(readFile(ceoReference, 'utf8')).resolves.toContain(
        '### Section 11: Design & UX Review',
      );

      const staleReference = path.join(
        codexSkills,
        'gl-plan-ceo-review',
        'references',
        'stale.md',
      );
      await writeFile(staleReference, '# stale\n');
      await execFileAsync('bash', ['install', '--host', 'codex'], {
        cwd: process.cwd(),
        env,
      });
      await expect(stat(staleReference)).rejects.toThrow();

      await execFileAsync('bash', ['uninstall', '--host', 'codex'], {
        cwd: process.cwd(),
        env,
      });
      await expect(stat(installed)).rejects.toThrow();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('installs lazy references for Codex and Claude while Cursor remains inline', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-install-hosts-'));
    const env = {
      ...process.env,
      HOME: path.join(tmp, 'home'),
      GSTACK_LITE_HOME: path.join(tmp, 'runtime'),
      CODEX_SKILLS_DIR: path.join(tmp, 'codex-skills'),
      CLAUDE_SKILLS_DIR: path.join(tmp, 'claude-skills'),
      CURSOR_SKILLS_DIR: path.join(tmp, 'cursor-skills'),
    };

    try {
      await execFileAsync('bash', ['install', '--all'], { cwd: process.cwd(), env });

      for (const root of [env.CODEX_SKILLS_DIR, env.CLAUDE_SKILLS_DIR]) {
        const skillDir = path.join(root, 'gl-plan-eng-review');
        const main = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
        const reference = await readFile(
          path.join(skillDir, 'references', 'review-flow.md'),
          'utf8',
        );
        expect(main).toContain('STOP: Read `references/review-flow.md` now');
        expect(main).not.toContain('### 4. Performance review');
        expect(reference).toContain('### 4. Performance review');
      }

      const cursorSkill = path.join(env.CURSOR_SKILLS_DIR, 'gl-plan-eng-review');
      const cursorMain = await readFile(path.join(cursorSkill, 'SKILL.md'), 'utf8');
      expect(cursorMain).not.toContain('STOP: Read `references/review-flow.md` now');
      expect(cursorMain).toContain('### 4. Performance review');
      await expect(
        readFile(path.join(cursorSkill, 'references', 'review-flow.md'), 'utf8'),
      ).resolves.toContain('### 4. Performance review');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
