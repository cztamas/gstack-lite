---
name: gl-browse
description: |
  Headless browser for QA testing and visual checks. Navigate local or remote pages,
  inspect content, interact with elements, capture console/network state, take screenshots,
  and verify responsive layouts. Use when asked to "open in browser", "test the site",
  "take a screenshot", or "dogfood this". (gstack-lite)
---
## Lite Preamble

Before following this skill:

1. Read relevant project instructions first: `AGENTS.md`, `CLAUDE.md`, Cursor rules, or local equivalents.
2. Prefer the existing project patterns, frameworks, helper APIs, and test style.
3. Ask before destructive or hard-to-reverse operations.
4. Keep changes scoped to the user's request and avoid unrelated refactors.
5. Use browser/design binaries only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Report what changed, what was verified, and any remaining risk.

Lite runtime paths:

- State and generated artifacts: `$HOME/.gstack-lite/`
- Browser CLI, when installed: `$HOME/.gstack-lite/browse/dist/browse`
- Design binary, when installed: `$HOME/.gstack-lite/design/dist/design`

# browse: QA Testing & Visual Checks

`gstack-browser` is a Node + Playwright CLI. First call auto-starts a local headless Chromium server; subsequent calls reuse the same browser state.

This lite port intentionally does not include cookie import from installed browsers, Chrome side panel/extension workflows, headed handoff, or ngrok/pairing.

## Setup Check

Run this before any browse command:

```bash
_STATE="${GSTACK_LITE_HOME:-$HOME/.gstack-lite}"
B=""
if [ -x "$_STATE/browse/bin/find-browse" ]; then
  B="$("$_STATE/browse/bin/find-browse" 2>/dev/null || true)"
fi
[ -z "$B" ] && [ -x "$_STATE/browse/dist/browse" ] && B="$_STATE/browse/dist/browse"
[ -z "$B" ] && command -v gstack-browser >/dev/null 2>&1 && B="$(command -v gstack-browser)"
[ -z "$B" ] && command -v gstack-browse >/dev/null 2>&1 && B="$(command -v gstack-browse)"
if [ -n "$B" ] && [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

If `NEEDS_SETUP`, browser automation is unavailable in this lite install. Degrade to host-native browser tools if available; otherwise continue with written QA/review and tell the user that `gstack-browser` is missing.

If the CLI exists but Playwright is missing, install it:

```bash
cd "$_STATE/browse"
npm install
npx playwright install chromium
```

## Core QA Patterns

### Verify a page loads

```bash
$B goto http://localhost:3000
$B text
$B console
$B network
$B is visible ".main-content"
```

### Test a user flow

```bash
$B goto http://localhost:3000/login
$B snapshot -i
$B fill @e1 "user@test.com"
$B fill @e2 "password"
$B click @e3
$B wait ".dashboard"
$B screenshot /tmp/dashboard.png
```

### Use refs from snapshots

```bash
$B snapshot -i
$B click @e1
$B fill @e2 "Ada Lovelace"
$B attrs @e2
```

Refs are valid until navigation or a major DOM replacement. Rerun `snapshot -i` after page transitions.

### Visual evidence

```bash
$B screenshot /tmp/page.png
$B screenshot --selector ".card" /tmp/card.png
$B responsive /tmp/layout
```

After screenshots, inspect the output image before reporting visual conclusions.

### Render local HTML

```bash
$B goto /tmp/report.html
$B goto ./docs/page.html
$B load-html /tmp/generated.html
```

Local file reads are scoped to the current workspace or temp directories.

### Inspect behavior

```bash
$B js "document.title"
$B js "document.querySelector('#name').value"
$B storage
$B cookies
$B perf
```

## Supported Commands

Navigation:

| Command | Description |
| --- | --- |
| `goto <url|path>` | Navigate to http(s), localhost, file URL, or local path |
| `load-html <file>` | Load an HTML file with Playwright `setContent` |
| `back` / `forward` / `reload` | Browser navigation |
| `url` | Print current URL |

Reading:

| Command | Description |
| --- | --- |
| `text [selector]` | Page or element text |
| `html [selector]` | Page HTML or element innerHTML |
| `links` | Links as JSON |
| `forms` | Forms and fields as JSON |
| `accessibility` | ARIA snapshot when supported, otherwise interactive snapshot |
| `snapshot [-i] [-c]` | Visible elements with `@e` refs; `-i` limits to interactive elements |

Interaction:

| Command | Description |
| --- | --- |
| `click <selector|@eN>` | Click an element |
| `fill <selector|@eN> <value>` | Fill an input |
| `type <text>` | Type into the focused element |
| `press <key>` | Press a key |
| `select <selector|@eN> <value>` | Select dropdown value |
| `hover <selector|@eN>` | Hover an element |
| `scroll [selector|@eN]` | Scroll page or element into view |
| `wait <selector|--networkidle|--load>` | Wait for element or load state |
| `viewport <WxH> [--scale N]` | Set viewport and optional device scale factor |
| `cookie <name>=<value>` | Set a cookie on the current page domain |
| `cookie-import <json>` | Import cookies from a JSON file |
| `header <name>:<value>` | Set extra HTTP header |
| `useragent <string>` | Set user agent and recreate context |

Inspection:

| Command | Description |
| --- | --- |
| `attrs <selector|@eN>` | Element attributes as JSON |
| `css <selector|@eN> <property>` | Computed CSS property |
| `is <state> <selector|@eN>` | Check `visible`, `hidden`, `enabled`, `disabled`, `checked`, `editable`, or `focused` |
| `js <expression>` | Evaluate JavaScript in the page |
| `eval <file>` | Evaluate JavaScript from a workspace/temp file |
| `console [--clear|--errors]` | Captured console entries |
| `network [--clear]` | Captured network entries |
| `dialog [--clear]` | Captured dialogs; dialogs auto-accept |
| `cookies` | Current context cookies |
| `storage [set key value]` | Read or write localStorage/sessionStorage |
| `perf` | Navigation performance data |

Visual:

| Command | Description |
| --- | --- |
| `screenshot [path] [--selector sel] [--viewport] [--base64]` | Capture a PNG |
| `responsive [prefix]` | Save mobile, tablet, and desktop screenshots |
| `pdf [path] [--print-background]` | Save current page as PDF |

Tabs and server:

| Command | Description |
| --- | --- |
| `tabs` / `newtab [url]` / `tab <id>` / `closetab [id]` | Tab management |
| `chain <json>` | Run JSON command array: `[["goto","/tmp/a.html"],["screenshot","/tmp/a.png"]]` |
| `state save|load <name>` | Save/load cookies and open page URLs |
| `status` | Health check |
| `stop` | Stop the server |
| `restart` | Stop the server; next command starts it again |

Unsupported in gstack-lite:

`cookie-import-browser`, Chrome side panel/extension commands, `connect`, `disconnect`, `focus`, `handoff`, `resume`, `watch`, `inbox`, ngrok/pairing, `inspect`, `style`, `cleanup`, `prettyscreenshot`, `download`, `scrape`, `archive`, `media`, `data`, `ux-audit`, `tab-each`, annotated snapshot overlays, and cursor-interactive `@c` refs.
