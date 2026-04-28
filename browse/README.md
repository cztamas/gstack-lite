# gstack-browser

This directory contains `gstack-browser`, a standalone Node + Playwright browser automation CLI used by `gl-browse`, `gl-qa`, `gl-qa-only`, and visual review skills.

Install dependencies for local development:

```bash
cd browse
npm install
npx playwright install chromium
```

Run it from this checkout:

```bash
./dist/browse help
./dist/browse goto http://localhost:3000
./dist/browse screenshot /tmp/page.png
```

Or install the published package globally:

```bash
npm i -g gstack-browser
```

## Choosing Local vs Published

The resolver supports three knobs:

- `GSTACK_BROWSER_BIN=/absolute/path/to/browser`: hard override.
- `GSTACK_BROWSER_PROVIDER=global`: use `gstack-browser` or `gstack-browse` from `PATH`.
- `GSTACK_BROWSER_PROVIDER=local`: use the checkout/state-local `browse/dist/browse`.

Default `auto` behavior prefers `PATH` first, then the local/state wrapper. This makes the published package the normal provider when installed globally.

For local package development, use npm's global link:

```bash
cd browse
npm install
npx playwright install chromium
npm link
```

After that, `gstack-browser` on `PATH` points at this checkout, so `GSTACK_BROWSER_PROVIDER=global` and the default `auto` mode both use the local linked package. To go back to the published package, unlink/reinstall with npm:

```bash
npm unlink -g gstack-browser
npm i -g gstack-browser
```

To bypass `npm link` entirely while working in this repo:

```bash
GSTACK_BROWSER_PROVIDER=local ./browse/bin/find-browse
```

The lite skill resolver checks, in order:

1. `GSTACK_BROWSER_BIN`, if set.
2. `gstack-browser` / `gstack-browse` on `PATH`, unless `GSTACK_BROWSER_PROVIDER=local`.
3. `$PROJECT/.gstack-lite/browse/dist/browse`
4. `$GSTACK_LITE_HOME/browse/dist/browse`

This first Node port focuses on headless local browser QA. It intentionally skips cookie import from installed browsers, Chrome side panel/extension workflows, headed handoff, and ngrok/pairing.
