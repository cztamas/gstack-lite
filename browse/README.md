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
npm link
gstack-browser help
gstack-browser goto http://localhost:3000
gstack-browser screenshot /tmp/page.png
```

Or install the published package globally:

```bash
npm i -g gstack-browser
```

## Local vs Published

For local package development, use npm's global link:

```bash
cd browse
npm install
npx playwright install chromium
npm link
```

After that, `gstack-browser` on `PATH` points at this checkout. To go back to the published package, unlink/reinstall with npm:

```bash
npm unlink -g gstack-browser
npm i -g gstack-browser
```

Browser session state defaults to `$PROJECT/.gstack-lite/browser/`. Override it with `GSTACK_LITE_STATE_DIR=/absolute/path` for all lite state, or `GSTACK_BROWSER_HOME=/absolute/path` for browser state only.

This first Node port focuses on headless local browser QA. It intentionally skips cookie import from installed browsers, Chrome side panel/extension workflows, headed handoff, and ngrok/pairing.
