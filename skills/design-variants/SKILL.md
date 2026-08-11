---
name: gl-design-variants
description: |
  Code-native design variants: generate one or more real HTML pages for a requested
  feature, grounded in the actual app's layout, components, styles, and design
  system. Opens clickable local previews and a comparison board so the user can
  compare variants, give structured feedback, and approve a direction. Use when
  asked for design variants, HTML prototypes, feature mockups, UI options, or to
  turn a design idea into inspectable browser pages. Intended as the preferred
  HTML-first replacement path for image-based design exploration and one-off
  design HTML generation. (gstack-lite)
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

## Project TODO Tracking

Before reading, creating, updating, or closing TODOs:

1. Read the repository's applicable `AGENTS.md` instructions, starting at the repo root and including any more-specific `AGENTS.md` for the working path. Look for the required work-tracking destination and workflow, such as GitHub Issues, GitHub Projects, another issue tracker, one TODO file, or multiple scoped TODO files.
2. When those instructions define TODO tracking, follow them exactly. Use the designated tracker, project, file, labels, fields, and item format; do not also write the same item to `TODOS.md` unless the instructions require both.
3. When the applicable `AGENTS.md` instructions contain no TODO-tracking guidance, fall back to the repository's existing TODO-file pattern. Discover existing root or scoped files such as `TODOS.md` or `TODO.md`, preserve their scope and format, and use the file that owns the affected area. If no TODO file or pattern exists, use a root `TODOS.md` as the legacy fallback.
4. Keep the skill's existing approval gate before creating or updating deferred work. If the required destination cannot be accessed, do not silently substitute a different tracker: provide the exact proposed item, report the blocked destination, and leave it unrecorded.
5. In workflow text and summaries, `project TODO tracker` means the destination resolved by this protocol. After a successful write, report the resulting file path, issue URL/number, or project item identifier.

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

When the review resolves a project, update or append a `## GSTACK REVIEW REPORT` section in that project's `plan.md`. Otherwise use a concrete active plan file supplied by the host. If neither is available, skip this section silently. Never put the detailed report in `status.md`.

Do not read or write full gstack review logs. Do not invent runs that did not happen.

# /gl-design-variants: Code-Native HTML Design Exploration

Generate real HTML variants for a requested feature. Use the target app as the
design source of truth: code, components, styles, routes, DESIGN.md, screenshots,
and browser snapshots. Do not use image-generation models.

This skill is the preferred HTML-first design workflow. One variant is the
single-design case; multiple variants are exploration.

## Setup

```bash
eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"
command -v gstack-browser >/dev/null 2>&1 && echo "READY: gstack-browser" || echo "NEEDS_SETUP"
[ -f DESIGN.md ] && echo "DESIGN_MD: exists" || echo "NO_DESIGN_MD"
```

Find the board template asset:

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
_TEMPLATE=""
for _CANDIDATE in \
  "$_ROOT/skills/design-variants/assets/compare-board-template.html" \
  "$HOME/.codex/skills/gl-design-variants/assets/compare-board-template.html" \
  "$HOME/.claude/skills/gl-design-variants/assets/compare-board-template.html" \
  "$HOME/.cursor/skills/gl-design-variants/assets/compare-board-template.html"; do
  [ -f "$_CANDIDATE" ] && _TEMPLATE="$_CANDIDATE" && break
done
[ -n "$_TEMPLATE" ] && echo "BOARD_TEMPLATE: $_TEMPLATE" || echo "BOARD_TEMPLATE_MISSING"
```

If `BOARD_TEMPLATE_MISSING`, create a simple `compare.html` yourself with links
to each variant, rating/comment controls, and a copyable feedback JSON block.

## Step 1: Understand the Request

Extract:

- feature or screen name
- requested variant count, defaulting to 3
- requested variant type, if any
- target route or existing screen, if mentioned
- constraints such as mobile, dark mode, density, or accessibility

Variant count rules:

- default: 3
- allowed range: 1-8
- if the user asks for more than 8, explain that the board becomes hard to use and
  ask which 8 directions matter most
- if count or variant type is ambiguous, make a reasonable choice unless the
  ambiguity affects the design direction

Variant strategy: choose named difference dimensions so variants are meaningful:
layout, density, flow, visual emphasis, information hierarchy, state coverage, or
another app-specific dimension. Variants must not differ only by color.

## Step 2: Gather App Context

Read relevant project instructions first. Then gather enough design evidence from
the repo and, when available, the running app.

Suggested repo context:

```bash
cat DESIGN.md 2>/dev/null | head -160 || true
cat package.json 2>/dev/null | head -120 || true
ls app src pages components styles public 2>/dev/null | head -80 || true
rg -n "className=|<header|<nav|button|Card|Layout|Theme|--[a-zA-Z0-9-]+:" app src pages components styles 2>/dev/null | head -120 || true
```

If the user supplied a URL, use it. Otherwise try common local ports only when
that is useful:

```bash
gstack-browser goto http://localhost:3000 2>/dev/null && echo "LIVE_APP:http://localhost:3000" || \
gstack-browser goto http://localhost:4000 2>/dev/null && echo "LIVE_APP:http://localhost:4000" || \
gstack-browser goto http://localhost:8080 2>/dev/null && echo "LIVE_APP:http://localhost:8080" || \
echo "NO_LIVE_APP"
```

When `gstack-browser` is ready and a page loads, capture evidence:

```bash
gstack-browser snapshot -i
gstack-browser screenshot "$GSTACK_LITE_STATE_DIR/designs/current-app.png"
```

If browser automation or a dev server is unavailable, continue in repo-only mode
and record the fallback in `run-summary.json`.

## Step 3: Create the Artifact Directory

Sanitize the feature name to kebab-case. All artifacts go under repo-local state:

```bash
eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"
_FEATURE="<feature-slug>"
_DESIGN_DIR="$GSTACK_LITE_STATE_DIR/designs/${_FEATURE}-$(date +%Y%m%d)"
mkdir -p "$_DESIGN_DIR/screenshots"
echo "DESIGN_DIR: $_DESIGN_DIR"
```

Security boundary:

- write only under `$GSTACK_LITE_STATE_DIR/designs/`
- serve only the generated output directory
- keep generated HTML self-contained by default
- do not add external fonts, images, scripts, or analytics unless the user asked
- do not copy generated variants into production source files

## Step 4: Generate HTML Variants

For each variant, write one self-contained HTML file:

```text
variant-A.html
variant-B.html
...
```

Each variant should:

- feel like the actual app, not a generic landing page
- use inferred tokens, components, spacing, density, and navigation structure
- include realistic content and edge states relevant to the feature
- include responsive behavior for mobile, tablet, and desktop
- include keyboard-visible focus states and basic ARIA where applicable
- avoid decorative blobs, generic hero sections, stock placeholders, lorem ipsum,
  and one-note color palettes

Before writing, briefly list the variant concepts:

```text
A) <name> - <difference dimension and user value>
B) <name> - <difference dimension and user value>
C) <name> - <difference dimension and user value>
```

If generating a single variant, name it `variant-A.html` and still create the
comparison board. The board acts as the preview and feedback surface.

## Step 5: Build the Comparison Board

Use the template asset when present. Replace these placeholders:

- `__GSTACK_FEATURE_TITLE__`
- `__GSTACK_GENERATED_AT__`
- `__GSTACK_VARIANTS_JSON__`
- `__GSTACK_RUN_SUMMARY_JSON__`

The variants JSON should look like:

```json
[
  {
    "id": "A",
    "name": "Focused workflow",
    "dimension": "information hierarchy",
    "summary": "Prioritizes the primary task and compresses secondary metadata.",
    "file": "variant-A.html",
    "screenshots": {
      "mobile": "screenshots/variant-A-mobile.png",
      "tablet": "screenshots/variant-A-tablet.png",
      "desktop": "screenshots/variant-A-desktop.png"
    }
  }
]
```

The board must include:

- sticky header
- variant summary table
- direct open links for every variant
- viewport screenshot strip when screenshots exist
- rating/comment controls
- preferred variant selector
- copy feedback JSON and download feedback JSON actions

## Step 6: Verify Screenshots

When `gstack-browser` is available, verify the board and variants:

```bash
gstack-browser goto "$_DESIGN_DIR/compare.html"
gstack-browser responsive "$_DESIGN_DIR/screenshots/board"
gstack-browser goto "$_DESIGN_DIR/variant-A.html"
gstack-browser viewport 375x812
gstack-browser screenshot "$_DESIGN_DIR/screenshots/variant-A-mobile.png"
gstack-browser viewport 768x1024
gstack-browser screenshot "$_DESIGN_DIR/screenshots/variant-A-tablet.png"
gstack-browser viewport 1440x1000
gstack-browser screenshot "$_DESIGN_DIR/screenshots/variant-A-desktop.png"
```

Repeat for each variant. Inspect screenshots before presenting links. Fix obvious
blank pages, overflow, text clipping, and incoherent overlap. If screenshots cannot
be captured, record the fallback in `run-summary.json`.

## Step 7: Preview Links

Prefer a lightweight local preview:

```bash
cd "$_DESIGN_DIR"
python3 -m http.server 0 --bind 127.0.0.1 > "$_DESIGN_DIR/server.log" 2>&1 &
_SERVER_PID=$!
sleep 1
_PORT=$(lsof -i -P -n | grep "$_SERVER_PID" | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
[ -n "$_PORT" ] && echo "SERVER: http://127.0.0.1:$_PORT/compare.html" || echo "SERVER_NOT_AVAILABLE"
echo "PID: $_SERVER_PID"
```

If a local server is started, give the user the `compare.html` URL and keep the
server alive while waiting for feedback. If serving fails, provide direct local
file links to `compare.html` and each variant.

Use a Blocking User Question:

```text
I generated the HTML design variants and opened the comparison board:
<url-or-file-link>

Use the board to compare variants, choose a preferred option, add comments, then
copy or download the feedback JSON. Paste the JSON here, or describe the choice
in chat when ready.
```

Do not re-ask which variant they chose if the feedback JSON already says it.

## Step 8: Save Feedback and Handoff

After the user provides board feedback or a clear chat choice:

1. Summarize the preferred variant, ratings, and requested changes.
2. Ask for confirmation only if the feedback is ambiguous.
3. Write `feedback.json`.
4. Write `approved.json`.
5. Write `run-summary.json`.
6. If you started a preview server, stop it after feedback is captured:
   ```bash
   kill "$_SERVER_PID" 2>/dev/null || true
   ```

`approved.json` should include:

```json
{
  "approved_variant": "A",
  "feedback": {},
  "date": "2026-05-26T00:00:00Z",
  "screen": "<feature>",
  "branch": "<branch>",
  "files": {
    "board": "compare.html",
    "variants": ["variant-A.html"]
  },
  "screenshots": [],
  "recommended_next_step": "Implement the approved variant or rerun /gl-design-variants with more specific feedback."
}
```

`run-summary.json` should include:

- mode: `live-app` or `repo-only`
- variant count
- generated files
- screenshot verification results
- preview URL or file links
- fallback notes
- chosen variant, if known

## Error & Fallback Registry

| Failure | Required handling | User-visible result |
|---------|-------------------|---------------------|
| Missing dev server | Continue repo-only | Note `NO_LIVE_APP` in summary |
| `gstack-browser` unavailable | Skip automated screenshots | Note screenshot verification skipped |
| Browser navigation fails | Continue repo-only or file preview | Show attempted URL and fallback |
| Variant write fails | Stop and report `BLOCKED` | Include path and exact error |
| Board template missing | Generate simple board manually | Note template fallback |
| Preview server fails | Provide local file links | Note server fallback |
| Screenshot blank/overflow | Fix before presenting, or flag concern | Do not silently ship broken page |
| Feedback JSON missing | Use clear chat feedback | Write agent-created `feedback.json` |

## Completion

Report:

- comparison board link
- variant links
- approved variant, if selected
- files written
- screenshot verification status
- fallbacks used
- remaining risk

Use `DONE` when the board and variants are generated and verified or a fallback is
clearly reported. Use `DONE_WITH_CONCERNS` if screenshots or browser inspection
could not run.
