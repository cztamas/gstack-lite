export const progressiveDisclosureContracts = {
  'plan-eng-review': {
    baselineBytes: 47_156,
    maxLazyBytes: 25 * 1024,
    minReduction: 0.45,
    eager: [
      '### Step 0: Scope Challenge',
      '## Progressive Disclosure References',
      '## Eager Completion Invariant Gate',
    ],
    deferred: [
      '### 1. Architecture review',
      '## Confidence Calibration',
      '### 2. Code quality review',
      '### 3. Test review',
      '### Test Framework Detection',
      '### E2E Test Decision Matrix',
      '### REGRESSION RULE (mandatory)',
      '### Test Plan',
      '### 4. Performance review',
      '## CRITICAL RULE - How to ask questions',
      '### Durable Plan File',
      '### Semantic Commit Map',
      '### Project TODO tracker updates',
      '### Diagrams',
      '### Failure modes',
      '### Worktree parallelization strategy',
      '### Completion summary',
      '## Retrospective learning',
      '## Formatting rules',
      'Write or replace a final `## GSTACK REVIEW REPORT` section with this shape:',
      '## Project Status Handoff',
      '## Unresolved decisions',
    ],
    completion: [
      'all four engineering review passes',
      'test coverage diagram',
      'semantic commit map',
      'GSTACK REVIEW REPORT',
      'explicit unresolved-decisions result',
    ],
  },
  'plan-ceo-review': {
    baselineBytes: 75_167,
    maxLazyBytes: 50 * 1024,
    minReduction: 0.3,
    eager: [
      '### 0F. Mode Selection',
      '## Progressive Disclosure References',
      '## Eager Completion Invariant Gate',
    ],
    deferred: [
      '### Section 1: Architecture Review',
      '### Section 2: Error & Rescue Map',
      '### Section 3: Security & Threat Model',
      '### Section 4: Data Flow & Interaction Edge Cases',
      '### Section 5: Code Quality Review',
      '### Section 6: Test Review',
      '### Section 7: Performance Review',
      '### Section 8: Observability & Debuggability Review',
      '### Section 9: Deployment & Rollout Review',
      '### Section 10: Long-Term Trajectory Review',
      '### Section 11: Design & UX Review',
      '## Post-Implementation Design Audit',
      '## CRITICAL RULE - How to ask questions',
      '### Durable Plan File',
      '### Error & Rescue Registry',
      '### Failure Modes Registry',
      '### Project TODO tracker updates',
      '### Scope Expansion Decisions',
      '### Diagrams',
      '### Stale Diagram Audit',
      '### Completion Summary',
      '### Unresolved Decisions',
      '## Project Status Handoff',
      'Write or replace a final `## GSTACK REVIEW REPORT` section with this shape:',
      '## Formatting Rules',
      '## Mode Quick Reference',
    ],
    completion: [
      'all 11 CEO review sections',
      'selected review mode',
      'GSTACK REVIEW REPORT',
      'explicit unresolved-decisions result',
    ],
  },
};

function requireMarker(text, marker, label) {
  if (!text.includes(marker)) throw new Error(`${label}: missing marker "${marker}"`);
}

export function assertProgressiveDisclosureContract({ skill, host, rendered }) {
  const contract = progressiveDisclosureContracts[skill];
  if (!contract) return;
  const reference = rendered.references.find((candidate) => candidate.id === 'review-flow');
  if (!reference) throw new Error(`${skill} (${host}): missing review-flow reference`);

  for (const marker of contract.eager) {
    requireMarker(rendered.skillText, marker, `${skill} (${host}) eager contract`);
  }
  for (const marker of contract.completion) {
    requireMarker(rendered.skillText, marker, `${skill} (${host}) completion contract`);
  }

  let lastPosition = -1;
  for (const marker of contract.deferred) {
    requireMarker(reference.text, marker, `${skill} (${host}) deferred contract`);
    const position = reference.text.indexOf(marker);
    if (position <= lastPosition) {
      throw new Error(`${skill} (${host}): deferred marker out of order "${marker}"`);
    }
    lastPosition = position;
  }

  if (host === 'cursor') {
    for (const marker of contract.deferred) {
      requireMarker(rendered.skillText, marker, `${skill} (${host}) inline contract`);
    }
    if (Buffer.byteLength(rendered.skillText) > contract.baselineBytes * 1.1) {
      throw new Error(`${skill} (${host}): inline output exceeds 110% baseline budget`);
    }
    return;
  }

  for (const marker of contract.deferred) {
    if (rendered.skillText.includes(marker)) {
      throw new Error(`${skill} (${host}): deferred marker leaked into lazy skill "${marker}"`);
    }
  }
  const lazyBytes = Buffer.byteLength(rendered.skillText);
  const unionBytes = lazyBytes + Buffer.byteLength(reference.text);
  if (lazyBytes > contract.maxLazyBytes) {
    throw new Error(`${skill} (${host}): lazy output exceeds ${contract.maxLazyBytes} bytes`);
  }
  if (lazyBytes > contract.baselineBytes * (1 - contract.minReduction)) {
    throw new Error(`${skill} (${host}): lazy output misses reduction budget`);
  }
  if (unionBytes < contract.baselineBytes * 0.98 || unionBytes > contract.baselineBytes * 1.1) {
    throw new Error(`${skill} (${host}): skeleton/reference union is outside parity budget`);
  }
}
