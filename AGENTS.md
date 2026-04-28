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

- Planning/product: `gstack-lite-office-hours`, `gstack-lite-plan-ceo-review`, `gstack-lite-plan-eng-review`
- Design: `gstack-lite-plan-design-review`, `gstack-lite-design-consultation`, `gstack-lite-design-shotgun`, `gstack-lite-design-html`, `gstack-lite-design-review`
- Debugging/review/security: `gstack-lite-investigate`, `gstack-lite-review`, `gstack-lite-cso`
- Browser QA: `gstack-lite-browse`, `gstack-lite-qa`, `gstack-lite-qa-only`
- Safety: `gstack-lite-freeze`, `gstack-lite-unfreeze`

Do not add telemetry, auto-upgrade hooks, GBrain sync, migrations, team-mode hooks, or global agent settings to this repo.
