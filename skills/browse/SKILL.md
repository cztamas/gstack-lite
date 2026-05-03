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
5. Use browser/design tools only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Read `ETHOS.md` from this skill directory when the workflow touches product direction, design judgment, architecture, or scope tradeoffs.
7. Report what changed, what was verified, and any remaining risk.

Lite paths:

- Skill ethos: `ETHOS.md` in this skill directory.
- State and generated artifacts: active repo `.gstack-lite/` (resolved as `$GSTACK_LITE_STATE_DIR`; override with `GSTACK_LITE_STATE_DIR`)
- Browser CLI: `gstack-browser` from the `gstack-browser` npm package
- Design binary, when installed: `$HOME/.gstack-lite/design/dist/design`
- Before reading or writing project state, run `eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"` to populate `$GSTACK_LITE_STATE_DIR` and `$BRANCH`

## User Question Format

When a skill tells you to ask the user, ask a **Blocking User Question**. This is a gate, not narration.

## Blocking User Question Protocol

Use this protocol for every instruction that says to ask the user, wait for the user, get approval, or confirm a choice. A request to pause or stop for feedback is a blocking gate only when it includes a concrete question or decision for the user.

1. Prefer a host-provided user-input or question tool when one is explicitly available in the current tool list.
2. If no such tool is available, make the question the final response for this turn and stop. Do not continue with planning, implementation, review sections, or guessed defaults in the same turn.
3. Resume the skill only after the user answers. Interpret the answer, then continue from the instruction immediately after the gate.
4. Never answer your own question. Never inline a question and keep going. Never build a plan from guessed answers when the workflow asked for user input.
5. At a **STOP** point, stop immediately after asking the Blocking User Question unless the instruction explicitly says no question is needed.

Write one concise question and include the decision context the user needs. Present options as A/B/C when that makes the tradeoff clearer.

For option sets that differ in coverage, include:

- `Recommendation: <option>`
- `Completeness: N/10` on every option
- One sentence explaining what that option includes or omits

For option sets that differ in kind rather than coverage, do not assign completeness scores. Add exactly this note instead:

`Note: options differ in kind, not coverage - no completeness score.`

## Completeness Principle - Boil the Lake

With AI-assisted implementation, shortcuts that save a human hours often save only minutes. When the user is deciding between a partial fix and the complete version, bias toward the complete version if the blast radius is understood and verification is practical.

Use `Completeness: N/10` to make coverage explicit. A low score is acceptable only when the user intentionally chooses a smaller scope or when the complete version is genuinely risky.

## Search Before Building

Before building or recommending an unfamiliar pattern, search the codebase, local docs, and available current references. Read `ETHOS.md` from this skill directory for the full framework.

- **Layer 1:** tried and true built-ins, standard library, established framework features.
- **Layer 2:** current popular libraries or patterns. Useful, but scrutinize the maintenance and fit.
- **Layer 3:** first-principles reasoning for cases where standard answers are wrong.

If first-principles reasoning contradicts the standard approach, call it out as **[EUREKA]** and explain why this case is different.

## Completion Status Protocol

When completing a skill workflow, report status using one of:

- **DONE** - completed with evidence.
- **DONE_WITH_CONCERNS** - completed, but list concerns.
- **BLOCKED** - cannot proceed; state the blocker and what was tried.
- **NEEDS_CONTEXT** - missing info; state exactly what is needed.

Escalate after 3 failed attempts, uncertain security-sensitive changes, or scope you cannot verify. Format: `STATUS`, `REASON`, `ATTEMPTED`, `RECOMMENDATION`.

## Review Readiness Dashboard

For gstack-lite, do not call full gstack review-log tools. After a review skill completes, summarize readiness from the review you just ran and any directly available `.gstack-lite/` artifacts in the active repository.

Display a compact dashboard with rows for Eng Review, CEO Review, Design Review, and Outside Voice when relevant. Mark missing rows as not run. Treat the dashboard as conversation output only unless a plan file is available.

## Plan File Review Report

If the host provides an active plan file path, update or append a `## GSTACK REVIEW REPORT` section using the review you just completed and any visible review context. If no active plan file is available, skip this section silently.

Do not read or write full gstack review logs. Do not invent runs that did not happen.

# browse: QA Testing & Visual Checks

`gstack-browser` is a Node + Playwright CLI. First call auto-starts a local headless Chromium server; subsequent calls reuse the same browser state.

This lite port intentionally does not include cookie import from installed browsers, Chrome side panel/extension workflows, headed handoff, or ngrok/pairing.

## Setup Check

Run this before any browse command:

```bash
command -v gstack-browser >/dev/null 2>&1 && echo "READY: gstack-browser" || echo "NEEDS_SETUP"
```

If `NEEDS_SETUP`, browser automation is unavailable in this lite install. Install it with `npm i -g gstack-browser`, or degrade to host-native browser tools, screenshots, wireframes, or written QA/review.

Run actual `gstack-browser` commands outside the filesystem/process sandbox. The sandbox commonly blocks Chromium/Playwright from launching or connecting, so sandboxed browser commands can fail even when the CLI is installed correctly.

For local package development, link this checkout:

```bash
cd browse
npm install
npx playwright install chromium
npm link
```

## Core QA Patterns

### Verify a page loads

```bash
gstack-browser goto http://localhost:3000
gstack-browser text
gstack-browser console
gstack-browser network
gstack-browser is visible ".main-content"
```

### Test a user flow

```bash
gstack-browser goto http://localhost:3000/login
gstack-browser snapshot -i
gstack-browser fill @e1 "user@test.com"
gstack-browser fill @e2 "password"
gstack-browser click @e3
gstack-browser wait ".dashboard"
gstack-browser screenshot /tmp/dashboard.png
```

### Use refs from snapshots

```bash
gstack-browser snapshot -i
gstack-browser click @e1
gstack-browser fill @e2 "Ada Lovelace"
gstack-browser attrs @e2
```

Refs are valid until navigation or a major DOM replacement. Rerun `snapshot -i` after page transitions.

### Visual evidence

```bash
gstack-browser screenshot /tmp/page.png
gstack-browser screenshot --selector ".card" /tmp/card.png
gstack-browser responsive /tmp/layout
```

After screenshots, inspect the output image before reporting visual conclusions.

### Render local HTML

```bash
gstack-browser goto /tmp/report.html
gstack-browser goto ./docs/page.html
gstack-browser load-html /tmp/generated.html
```

Local file reads are scoped to the current workspace or temp directories.

### Inspect behavior

```bash
gstack-browser js "document.title"
gstack-browser js "document.querySelector('#name').value"
gstack-browser storage
gstack-browser cookies
gstack-browser perf
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
