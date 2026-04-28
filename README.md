# gstack-lite

gstack-lite is a small, host-neutral subset of gstack: plain Markdown workflow skills plus a few optional runtime assets. It is scoped for Claude Code, OpenAI Codex, and Cursor.

It intentionally excludes telemetry, auto-upgrades, GBrain sync, migrations, team-mode hooks, deploy automation, and release machinery.

## Install

```bash
git clone https://github.com/cztamas/gstack-lite.git
cd gstack-lite
./install --host claude
```

Other hosts:

```bash
./install --host codex
./install --host cursor
./install --all
```

The installer creates namespaced skill symlinks such as `gl-review` and `gl-qa`, then links shared runtime assets and unprefixed skill mirrors into `$HOME/.gstack-lite`.

## Uninstall

```bash
./uninstall --host claude
./uninstall --all
./uninstall --all --state
```

`--state` also removes `$HOME/.gstack-lite`. Playwright browser caches and project files are left alone.

## Skills

- `gl-office-hours`
- `gl-plan-ceo-review`
- `gl-plan-eng-review`
- `gl-plan-design-review`
- `gl-design-consultation`
- `gl-design-shotgun`
- `gl-design-html`
- `gl-design-review`
- `gl-investigate`
- `gl-review`
- `gl-cso`
- `gl-browse`
- `gl-qa`
- `gl-qa-only`
- `gl-freeze`
- `gl-unfreeze`

## Runtime Assets

The browser and design binaries are optional progressive enhancements:

- Browser: `$HOME/.gstack-lite/browse/dist/browse`
- Design: `$HOME/.gstack-lite/design/dist/design`
- Pretext vendor file: `$HOME/.gstack-lite/design-html/vendor/pretext.js`

If a binary is missing, the relevant skills should fall back to host-native browser tools, screenshots, wireframes, or written review.

## Development

Import the scoped skills from a full gstack checkout:

```bash
node tools/import-from-gstack.mjs --source ../gstack
```

Validate the lite package:

```bash
npm test
```
