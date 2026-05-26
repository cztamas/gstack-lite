export const hosts = ['claude', 'codex', 'cursor'];

export const expectedSkills = [
  'office-hours',
  'plan-ceo-review',
  'plan-eng-review',
  'plan-design-review',
  'design-consultation',
  'design-shotgun',
  'design-html',
  'design-variants',
  'design-review',
  'investigate',
  'quick-fix',
  'review',
  'cso',
  'browse',
  'qa',
  'qa-only',
  'freeze',
  'unfreeze',
];

export const expectedSkillsSorted = [...expectedSkills].sort();

export const liteSkillCommands = [
  'office-hours',
  'plan-ceo-review',
  'plan-eng-review',
  'plan-design-review',
  'design-consultation',
  'design-shotgun',
  'design-html',
  'design-variants',
  'design-review',
  'investigate',
  'quick-fix',
  'review',
  'cso',
  'browse',
  'qa-only',
  'qa',
  'freeze',
  'unfreeze',
];

export const standardHostSkillRoots = {
  claude: '$HOME/.claude/skills',
  codex: '$HOME/.codex/skills',
  cursor: '$HOME/.cursor/skills',
};
