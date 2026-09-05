import { mkdtemp, readFile, rm, lstat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { expectedSkills, hosts } from '../tools/skill-generator/config.mjs';
import {
  defaultRepoRoot,
  generateSkills,
  renderSkill,
  renderSkillPackage,
} from '../tools/skill-generator/generate.mjs';

async function renderCompleteSkill(options) {
  const rendered = await renderSkillPackage(options);
  return [rendered.skillText, ...rendered.references.map((reference) => reference.text)].join('\n');
}

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
          expect(skillText).toContain('## Project TODO Tracking');
          expect(skillText).toContain("Read the repository's applicable `AGENTS.md` instructions");
          expect(skillText).toContain("fall back to the repository's existing TODO-file pattern");
          expect(skillText).toContain('## Blocking User Question Protocol');
          expect(skillText).toContain('make the question the final response for this turn and stop');
          expect(skillText).toContain('Never inline a question and keep going');
          expect(skillText).toContain('## Completion Status Protocol');
          expect(skillText).not.toContain('{{LITE_PREAMBLE}}');

          const ethosInfo = await lstat(path.join(skillDir, 'ETHOS.md'));
          expect(ethosInfo.isFile() || ethosInfo.isSymbolicLink()).toBe(true);
          await expect(readFile(path.join(skillDir, 'ETHOS.md'), 'utf8')).resolves.toContain(
            'Search Before Building',
          );

          if (skill === 'design-variants') {
            await expect(
              readFile(path.join(skillDir, 'assets', 'compare-board-template.html'), 'utf8'),
            ).resolves.toContain('GSTACK_DESIGN_VARIANTS');
          }
        }
      }
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('routes TODO creation through the project tracker instead of hard-coded TODOS.md writes', async () => {
    const todoWritingSkills = [
      'plan-ceo-review',
      'plan-eng-review',
      'plan-design-review',
      'qa',
      'design-review',
      'cso',
      'review',
    ];

    for (const skill of todoWritingSkills) {
      const text = await renderSkill({
        repoRoot: defaultRepoRoot,
        skill,
        host: 'codex',
      });

      expect(text).toContain('project TODO tracker');
      expect(text).not.toMatch(/(?:add|defer) to `?TODOS\.md`?/i);
      expect(text).not.toMatch(/TODOS\.md (?:update|updates)/i);
    }
  });

  it('renders host-specific cross-skill invocation paths', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-invoke-'));
    try {
      const outDir = path.join(tmp, 'codex');
      await generateSkills({ repoRoot: defaultRepoRoot, host: 'codex', outDir });
      const text = await readFile(path.join(outDir, 'gl-plan-ceo-review', 'SKILL.md'), 'utf8');

      expect(text).toContain('$HOME/.codex/skills/gl-office-hours/SKILL.md');
      expect(text).toContain('../gl-office-hours/SKILL.md');
      expect(text).not.toContain('$HOME/.gstack-lite/office-hours/SKILL.md');
      expect(text).toContain('Blocking User Question');
      expect(text).not.toMatch(/call user question/i);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('keeps plan-eng-review interactive without stopping at section boundaries', async () => {
    const text = await renderCompleteSkill({
      repoRoot: defaultRepoRoot,
      skill: 'plan-eng-review',
      host: 'codex',
    });

    expect(text).toContain('interactive: true');
    expect(text).toContain('## Plan Mode Continuation Guard');
    expect(text).toContain('If no concrete Blocking User Question or tool approval is pending, continue');
    expect(text).toContain(
      'After each review section, continue to the next section unless the section surfaced a concrete Blocking User Question',
    );
    expect(text).not.toContain('confirm a choice, or stop for feedback');
    expect(text).not.toContain('pause and ask for feedback before moving on');
  });

  it('requires a releasable semantic commit map in every plan-eng-review rendering', async () => {
    for (const host of ['source', ...hosts]) {
      const text = await renderCompleteSkill({
        repoRoot: defaultRepoRoot,
        skill: 'plan-eng-review',
        host,
      });

      expect(text).toContain('## Semantic Commit Map');
      expect(text).toContain('**Intent:**');
      expect(text).toContain('**Dependencies:**');
      expect(text).toContain('**Releasable invariant:**');
      expect(text).toContain('**Compatibility/flag state:**');
      expect(text).toContain('**Verification:**');
      expect(text).toContain('**Revert safety:**');
      expect(text).toContain('Keep failing red-green TDD states local');
      expect(text).toContain('Tests and implementation land together in a green commit');
      expect(text).toContain('Treat the semantic commit map as a living execution plan');
      expect(text).toContain(
        'Do not stop for user approval when only commit boundaries, ordering, or summaries change',
      );
      expect(text).toContain('Every revised commit must still satisfy the releasable invariant');
    }
  });

  it('persists engineering and CEO plans using repository-specific guidance', async () => {
    for (const skill of ['plan-eng-review', 'plan-ceo-review']) {
      for (const host of ['source', ...hosts]) {
        const text = await renderCompleteSkill({
          repoRoot: defaultRepoRoot,
          skill,
          host,
        });

        expect(text).toContain('## Durable Plan File');
        expect(text).toContain('## Project Plan Structure');
        expect(text).toContain('status.md');
        expect(text).toContain('plan.md');
        expect(text).toContain('$GSTACK_LITE_STATE_DIR/projects/<project-slug>/');
        expect(text).toContain('explicitly asks for the complete plan inline in chat');
        expect(text).toContain('Do not treat the chat transcript as the only copy of the plan');
      }
    }
  });

  it('keeps every project-plan producer and consumer on the shared two-file structure', async () => {
    const projectPlanSkills = [
      'office-hours',
      'plan-ceo-review',
      'plan-eng-review',
      'plan-design-review',
      'design-consultation',
      'design-html',
      'design-review',
      'review',
      'qa',
      'qa-only',
    ];

    for (const skill of projectPlanSkills) {
      const text = await renderSkill({ repoRoot: defaultRepoRoot, skill, host: 'codex' });

      expect(text).toContain('## Project Plan Structure');
      expect(text).toContain('status.md');
      expect(text).toContain('plan.md');
      expect(text).toContain('$GSTACK_LITE_STATE_DIR/projects/<project-slug>/');
      expect(text).toContain('Do not create a generic catch-all `evidence.md`');
      expect(text).toContain('It is the single source of truth for live status');
      expect(text).toContain('## Current state');
      expect(text).toContain('## Next steps');
      expect(text).toContain('## Blockers');
    }
  });

  it('uses project plans instead of legacy flat planning artifacts', async () => {
    const officeHours = await renderSkill({
      repoRoot: defaultRepoRoot,
      skill: 'office-hours',
      host: 'codex',
    });
    const ceoReview = await renderSkill({
      repoRoot: defaultRepoRoot,
      skill: 'plan-ceo-review',
      host: 'codex',
    });
    const engReview = await renderSkill({
      repoRoot: defaultRepoRoot,
      skill: 'plan-eng-review',
      host: 'codex',
    });
    const review = await renderSkill({
      repoRoot: defaultRepoRoot,
      skill: 'review',
      host: 'codex',
    });

    expect(officeHours).not.toContain('*-design-*.md');
    expect(officeHours).not.toContain('Supersedes:');
    expect(ceoReview).not.toContain('/ceo-plans/');
    expect(ceoReview).not.toContain('status: ACTIVE');
    expect(engReview).not.toContain('eng-review-test-plan');
    expect(review).not.toContain('find "$PLAN_DIR"');
    expect(review).not.toContain('mmin -1440');
  });

  it('keeps plan-ceo-review interactive through zero-finding sections', async () => {
    const text = await renderCompleteSkill({
      repoRoot: defaultRepoRoot,
      skill: 'plan-ceo-review',
      host: 'codex',
    });

    expect(text).toContain('interactive: true');
    expect(text).toContain('## Plan Mode Continuation Guard');
    expect(text).toContain('If no concrete Blocking User Question or tool approval is pending, continue');
    expect(text).toContain('printed "No issues found," or printed "No issues, moving on."');
    expect(text).toContain(
      'After each review section, continue to the next section unless the section surfaced a concrete Blocking User Question',
    );
    expect(text).not.toContain('After each section, pause and wait for feedback');
    expect(text).not.toContain('pause and ask for feedback before moving on');
  });
});
