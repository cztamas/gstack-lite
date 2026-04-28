# gstack-lite Instructions

gstack-lite is a small workflow skill pack, not a package manager or daemon suite.

Always-on safety guardrails:

- Ask for explicit confirmation before destructive or hard-to-reverse operations.
- This includes `rm -rf` outside disposable build/cache directories, `git reset --hard`, `git clean -fd`, broad checkout/restore commands, force pushes, database drops/truncates/destructive migrations, deletion of staging or production resources, and commands using production credentials or production data.
- Keep changes scoped to the user request and the active repository.
- Prefer existing project patterns and local helper APIs.
- Use optional browser/design binaries only when present. If unavailable, degrade to host-native browser tools, written QA, screenshots, or wireframes.
- Report what changed, what was verified, and any remaining risk.

Default lite skills:

- Planning/product: `gl-office-hours`, `gl-plan-ceo-review`, `gl-plan-eng-review`
- Design: `gl-plan-design-review`, `gl-design-consultation`, `gl-design-shotgun`, `gl-design-html`, `gl-design-review`
- Debugging/review/security: `gl-investigate`, `gl-review`, `gl-cso`
- Browser QA: `gl-browse`, `gl-qa`, `gl-qa-only`
- Safety: `gl-freeze`, `gl-unfreeze`

Do not add telemetry, auto-upgrade hooks, GBrain sync, migrations, team-mode hooks, or global agent settings to this repo.
