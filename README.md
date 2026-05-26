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

The installer generates host-specific skill directories under `$HOME/.gstack-lite/generated/<host>/`, then creates namespaced skill directories such as `gl-review` and `gl-qa` in the selected host. Each installed directory contains symlinks to the generated `SKILL.md`, `agents/` metadata when present, and `ETHOS.md`. Shared runtime assets are linked into `$HOME/.gstack-lite`.

Generated plans, browser state, QA reports, design artifacts, and other writable state default to the active repository's `.gstack-lite/` directory. Add `.gstack-lite/` to that repository's `.gitignore` for local-only state, or commit selected files when the state should be shared with the repo.

## Uninstall

```bash
./uninstall --host claude
./uninstall --all
./uninstall --all --state
```

`--state` also removes the installed runtime directory at `$HOME/.gstack-lite`. Repo-local `.gstack-lite/` project state is left alone.

## Skills

- `gl-office-hours`
- `gl-plan-ceo-review`
- `gl-plan-eng-review`
- `gl-plan-design-review`
- `gl-design-consultation`
- `gl-design-shotgun`
- `gl-design-html`
- `gl-design-variants`
- `gl-design-review`
- `gl-investigate`
- `gl-quick-fix`
- `gl-review`
- `gl-cso`
- `gl-browse`
- `gl-qa`
- `gl-qa-only`
- `gl-freeze`
- `gl-unfreeze`

## Runtime Assets

The browser and design runtimes are optional progressive enhancements:

- Browser CLI: `gstack-browser` from the `gstack-browser` npm package
- Design: `$HOME/.gstack-lite/design/dist/design`
- Pretext vendor file: `$HOME/.gstack-lite/design-html/vendor/pretext.js`

Writable project state uses `<repo>/.gstack-lite/` by default. Override that with `GSTACK_LITE_STATE_DIR=/absolute/path` if a repository needs a different state location.

Install the browser CLI from npm:

```bash
npm i -g gstack-browser
gstack-browser help
```

For local browser package development, link this checkout:

```bash
cd browse
npm install
npx playwright install chromium
npm link
gstack-browser help
```

If a runtime is missing, the relevant skills should fall back to host-native browser tools, screenshots, wireframes, or written review.

## Development

Skill source lives in `skills/*/SKILL.md.tmpl`. The generator expands lite placeholders such as `{{LITE_PREAMBLE}}` and writes the checked-in `SKILL.md` files:

```bash
npm run generate:skills
```

Validate and test the lite package:

```bash
npm run validate
npm test
npm run browser:check
```
