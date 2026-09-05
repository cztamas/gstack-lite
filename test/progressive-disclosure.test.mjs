import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { referenceLoadingByHost } from '../tools/skill-generator/config.mjs';
import {
  defaultRepoRoot,
  loadSkillReferences,
  renderSkillPackage,
} from '../tools/skill-generator/generate.mjs';
import {
  assertProgressiveDisclosureContract,
  progressiveDisclosureContracts as contracts,
} from '../tools/skill-generator/progressive-disclosure-contracts.mjs';

async function writeFixture({
  root,
  skill = 'fixture',
  main = '{{REFERENCE_INDEX}}\n{{REFERENCE:review-flow}}\n## Eager Completion Invariant Gate\n',
  manifest,
  references = {},
}) {
  const skillDir = path.join(root, 'skills', skill);
  const referenceDir = path.join(skillDir, 'references');
  await mkdir(referenceDir, { recursive: true });
  await writeFile(path.join(skillDir, 'SKILL.md.tmpl'), main);
  if (manifest !== undefined) {
    await writeFile(path.join(referenceDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }
  for (const [file, text] of Object.entries(references)) {
    await writeFile(path.join(referenceDir, file), text);
  }
  return skillDir;
}

const reviewManifest = [
  {
    id: 'review-flow',
    file: 'review-flow.md',
    title: 'Detailed review and completion flow',
    trigger: 'Read when the review reaches the detailed review passes.',
  },
];

describe('progressive disclosure foundation', () => {
  it('keeps skills without a manifest backward compatible', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-no-refs-'));
    try {
      await writeFixture({
        root,
        main: '{{LITE_PREAMBLE}}\n# Existing workflow\n',
      });
      const rendered = await renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'codex' });
      expect(rendered.references).toEqual([]);
      expect(rendered.skillText).toContain('## Lite Preamble');
      expect(rendered.skillText).toContain('# Existing workflow');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('renders lazy references for source, Codex, and Claude and inline content for Cursor', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-host-refs-'));
    try {
      await writeFixture({
        root,
        manifest: reviewManifest,
        references: {
          'review-flow.md.tmpl': '# Detailed flow\n\n{{PLAN_FILE_REVIEW_REPORT}}\n',
        },
      });

      for (const host of ['source', 'codex', 'claude']) {
        const rendered = await renderSkillPackage({ repoRoot: root, skill: 'fixture', host });
        expect(referenceLoadingByHost[host]).toBe('lazy');
        expect(rendered.skillText).toContain('[Detailed review and completion flow](references/review-flow.md)');
        expect(rendered.skillText).toContain('STOP: Read `references/review-flow.md` now');
        expect(rendered.skillText).not.toContain('# Detailed flow');
        expect(rendered.references).toHaveLength(1);
        expect(rendered.references[0].text).toContain('# Detailed flow');
        expect(rendered.references[0].text).toContain('## Plan File Review Report');
        expect(rendered.references[0].text).not.toMatch(/\{\{[A-Z_]+/);
      }

      const cursor = await renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'cursor' });
      expect(referenceLoadingByHost.cursor).toBe('inline');
      expect(cursor.skillText).toContain('# Detailed flow');
      expect(cursor.skillText).toContain('## Plan File Review Report');
      expect(cursor.skillText).not.toContain('STOP: Read `references/review-flow.md` now');
      expect(cursor.references[0].text).toContain('# Detailed flow');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each([
    {
      name: 'duplicate ids',
      manifest: [...reviewManifest, { ...reviewManifest[0], file: 'second.md' }],
      references: {
        'review-flow.md.tmpl': '# First\n',
        'second.md.tmpl': '# Second\n',
      },
      error: /duplicate reference id "review-flow"/,
    },
    {
      name: 'duplicate files',
      manifest: [...reviewManifest, { ...reviewManifest[0], id: 'second' }],
      references: { 'review-flow.md.tmpl': '# First\n' },
      error: /duplicate reference file "review-flow\.md"/,
    },
    {
      name: 'unsafe paths',
      manifest: [{ ...reviewManifest[0], file: '../escape.md' }],
      references: {},
      error: /unsafe reference file/,
    },
    {
      name: 'missing templates',
      manifest: reviewManifest,
      references: {},
      error: /missing reference template.*review-flow\.md\.tmpl/,
    },
    {
      name: 'orphan templates',
      manifest: reviewManifest,
      references: {
        'review-flow.md.tmpl': '# First\n',
        'orphan.md.tmpl': '# Orphan\n',
      },
      error: /undeclared reference template.*orphan\.md\.tmpl/,
    },
    {
      name: 'non-array manifests',
      manifest: reviewManifest[0],
      references: { 'review-flow.md.tmpl': '# First\n' },
      error: /must be a non-empty array/,
    },
    {
      name: 'unexpected manifest fields',
      manifest: [{ ...reviewManifest[0], condition: 'always' }],
      references: { 'review-flow.md.tmpl': '# First\n' },
      error: /must contain exactly id, file, title, trigger/,
    },
    {
      name: 'nested files',
      manifest: [{ ...reviewManifest[0], file: 'nested/review-flow.md' }],
      references: {},
      error: /unsafe reference file/,
    },
  ])('rejects $name with a contextual manifest error', async ({ manifest, references, error }) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-bad-refs-'));
    try {
      await writeFixture({ root, manifest, references });
      await expect(loadSkillReferences({ repoRoot: root, skill: 'fixture' })).rejects.toThrow(error);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects reference files when no manifest declares ownership', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-orphan-ref-'));
    try {
      await writeFixture({
        root,
        manifest: undefined,
        references: { 'orphan.md.tmpl': '# Orphan\n' },
      });
      await expect(loadSkillReferences({ repoRoot: root, skill: 'fixture' })).rejects.toThrow(
        /orphan\.md\.tmpl.*without references\/manifest\.json/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects direct reference cycles with the complete render stack', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-cycle-refs-'));
    try {
      await writeFixture({
        root,
        manifest: reviewManifest,
        references: { 'review-flow.md.tmpl': '{{REFERENCE:review-flow}}\n' },
      });
      await expect(
        renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'cursor' }),
      ).rejects.toThrow(/reference cycle.*REFERENCE:review-flow.*REFERENCE:review-flow/i);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects indirect reference cycles with the complete render stack', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-indirect-cycle-'));
    try {
      await writeFixture({
        root,
        main: '{{REFERENCE:first}}\n',
        manifest: [
          { ...reviewManifest[0], id: 'first', file: 'first.md' },
          { ...reviewManifest[0], id: 'second', file: 'second.md' },
        ],
        references: {
          'first.md.tmpl': '{{REFERENCE:second}}\n',
          'second.md.tmpl': '{{REFERENCE:first}}\n',
        },
      });
      for (const host of ['source', 'cursor']) {
        await expect(
          renderSkillPackage({ repoRoot: root, skill: 'fixture', host }),
        ).rejects.toThrow(/REFERENCE:first.*REFERENCE:second.*REFERENCE:first/);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails closed when recursive expansion exceeds the depth budget', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-depth-refs-'));
    try {
      const manifest = Array.from({ length: 26 }, (_, index) => ({
        ...reviewManifest[0],
        id: `ref-${index}`,
        file: `ref-${index}.md`,
      }));
      const references = Object.fromEntries(
        manifest.map((entry, index) => [
          `${entry.file}.tmpl`,
          index === manifest.length - 1 ? '# End\n' : `{{REFERENCE:ref-${index + 1}}}\n`,
        ]),
      );
      await writeFixture({ root, main: '{{REFERENCE:ref-0}}\n', manifest, references });
      await expect(
        renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'cursor' }),
      ).rejects.toThrow(/exceeded 24 levels.*REFERENCE:ref-0.*REFERENCE:ref-23/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects unknown reference ids with skill, host, and source context', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-unknown-ref-'));
    try {
      await writeFixture({
        root,
        main: '{{REFERENCE:missing}}\n',
        manifest: reviewManifest,
        references: { 'review-flow.md.tmpl': '# Detailed flow\n' },
      });
      await expect(
        renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'codex' }),
      ).rejects.toThrow(/fixture.*codex.*SKILL\.md\.tmpl.*missing/i);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('renders identical packages for identical inputs', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'gstack-lite-deterministic-refs-'));
    try {
      await writeFixture({
        root,
        manifest: reviewManifest,
        references: { 'review-flow.md.tmpl': '# Detailed flow\n\n{{PLAN_FILE_REVIEW_REPORT}}\n' },
      });
      const first = await renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'codex' });
      const second = await renderSkillPackage({ repoRoot: root, skill: 'fixture', host: 'codex' });
      expect(second).toEqual(first);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('planning review carve contracts', () => {
  for (const [skill, contract] of Object.entries(contracts)) {
    it(`${skill} keeps routing eager and the full ordered review flow deferred`, async () => {
      const rendered = await renderSkillPackage({
        repoRoot: defaultRepoRoot,
        skill,
        host: 'codex',
      });
      const reference = rendered.references.find((item) => item.id === 'review-flow');

      expect(reference).toBeTruthy();
      for (const marker of contract.eager) {
        expect(rendered.skillText, `missing eager marker: ${marker}`).toContain(marker);
      }
      for (const marker of contract.deferred) {
        expect(rendered.skillText, `deferred marker leaked eager: ${marker}`).not.toContain(marker);
        expect(reference.text, `missing deferred marker: ${marker}`).toContain(marker);
      }
      const positions = contract.deferred.map((marker) => reference.text.indexOf(marker));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      for (const marker of contract.completion) {
        expect(rendered.skillText, `missing completion invariant: ${marker}`).toContain(marker);
      }
      const lazyBytes = Buffer.byteLength(rendered.skillText);
      const unionBytes = lazyBytes + Buffer.byteLength(reference.text);
      expect(lazyBytes).toBeLessThanOrEqual(contract.maxLazyBytes);
      expect(lazyBytes).toBeLessThanOrEqual(contract.baselineBytes * (1 - contract.minReduction));
      expect(unionBytes).toBeGreaterThanOrEqual(contract.baselineBytes * 0.98);
      expect(unionBytes).toBeLessThanOrEqual(contract.baselineBytes * 1.1);
    });

    it(`${skill} stays complete and inline on Cursor`, async () => {
      const rendered = await renderSkillPackage({
        repoRoot: defaultRepoRoot,
        skill,
        host: 'cursor',
      });
      for (const marker of [...contract.eager, ...contract.deferred]) {
        expect(rendered.skillText, `missing Cursor marker: ${marker}`).toContain(marker);
      }
      expect(Buffer.byteLength(rendered.skillText)).toBeLessThanOrEqual(contract.baselineBytes * 1.1);
      expect(rendered.skillText.indexOf(contract.deferred[0])).toBeLessThan(
        rendered.skillText.indexOf('## Eager Completion Invariant Gate'),
      );
    });

    it(`${skill} contract guard rejects missing and reordered obligations`, async () => {
      const rendered = await renderSkillPackage({
        repoRoot: defaultRepoRoot,
        skill,
        host: 'codex',
      });
      const missing = structuredClone(rendered);
      missing.skillText = missing.skillText.replace(contract.completion[0], 'removed invariant');
      expect(() =>
        assertProgressiveDisclosureContract({ skill, host: 'codex', rendered: missing }),
      ).toThrow(/completion contract: missing marker/);

      const reordered = structuredClone(rendered);
      const reference = reordered.references.find((candidate) => candidate.id === 'review-flow');
      reference.text = reference.text.replace(contract.deferred[0], 'temporary marker');
      reference.text = reference.text.replace(contract.deferred[1], contract.deferred[0]);
      reference.text = reference.text.replace('temporary marker', contract.deferred[1]);
      expect(() =>
        assertProgressiveDisclosureContract({ skill, host: 'codex', rendered: reordered }),
      ).toThrow(/deferred marker out of order/);
    });
  }
});
