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

Or install it as a global package:

```bash
npm i -g gstack-browser
```

The lite skill resolver checks, in order:

1. `$PROJECT/.gstack-lite/browse/dist/browse`
2. `$GSTACK_LITE_HOME/browse/dist/browse`
3. `gstack-browser` on `PATH`
4. `gstack-browse` on `PATH`

This first Node port focuses on headless local browser QA. It intentionally skips cookie import from installed browsers, Chrome side panel/extension workflows, headed handoff, and ngrok/pairing.
