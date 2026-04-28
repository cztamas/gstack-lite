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

The installer creates namespaced skill symlinks such as `gl-review` and `gl-qa`, then links shared runtime assets into `$HOME/.gstack-lite` and skill mirrors into `$HOME/.gstack-lite/skills`.

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

The browser and design runtimes are optional progressive enhancements:

- Browser CLI: `$HOME/.gstack-lite/browse/dist/browse`
- Design: `$HOME/.gstack-lite/design/dist/design`
- Pretext vendor file: `$HOME/.gstack-lite/design-html/vendor/pretext.js`

The browser CLI is a Node + Playwright package in `browse/`. For a local checkout:

```bash
cd browse
npm install
npx playwright install chromium
```

It can also be installed globally as `gstack-browser`:

```bash
npm i -g gstack-browser
```

Browser provider selection:

- Default: use `gstack-browser` on `PATH` when present, then fall back to the local/state wrapper.
- Published/global: `GSTACK_BROWSER_PROVIDER=global`
- Checkout-local: `GSTACK_BROWSER_PROVIDER=local`
- Explicit binary: `GSTACK_BROWSER_BIN=/absolute/path/to/browser`

For local browser package development, run `npm link` from `browse/`; the global `gstack-browser` command will point at this checkout until you unlink/reinstall it. If a runtime is missing, the relevant skills should fall back to host-native browser tools, screenshots, wireframes, or written review.

## Development

Import the scoped skills from a full gstack checkout:

```bash
node tools/import-from-gstack.mjs --source ../gstack
```

Validate the lite package:

```bash
npm test
npm run browser:check
```
