---
name: gl-freeze
description: |
  Restrict file edits to a specific directory for the session. Records an
  agent-scoped edit boundary so the workflow stays inside the allowed path.
  Use when debugging to prevent accidentally "fixing" unrelated code, or when
  you want to scope changes to one module.
  Use when asked to "freeze", "restrict edits", "only edit this folder",
  or "lock down edits". (gstack-lite)
---
## Lite Preamble

Before following this skill:

1. Read relevant project instructions first: `AGENTS.md`, `CLAUDE.md`, Cursor rules, or local equivalents.
2. Prefer the existing project patterns, frameworks, helper APIs, and test style.
3. Ask before destructive or hard-to-reverse operations.
4. Keep changes scoped to the user's request and avoid unrelated refactors.
5. Use browser/design binaries only when available. If unavailable, degrade to host-native browser tools, screenshots, wireframes, or written review.
6. Report what changed, what was verified, and any remaining risk.

Lite paths:

- State and generated artifacts: active repo `.gstack-lite/` (resolved as `$GSTACK_LITE_STATE_DIR`; override with `GSTACK_LITE_STATE_DIR`)
- Browser binary, when installed: `$HOME/.gstack-lite/browse/dist/browse`
- Design binary, when installed: `$HOME/.gstack-lite/design/dist/design`
- Before reading or writing project state, run `eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"` to populate `$GSTACK_LITE_STATE_DIR` and `$BRANCH`

# /gl-freeze - Restrict Edits to a Directory

Lock intended file edits to a specific directory. Any edit outside the allowed
path is out of scope unless the user explicitly widens the boundary.

## Setup

Ask the user which directory to restrict edits to. Ask the user:

- Question: "Which directory should I restrict edits to? I will keep edits inside this path unless you explicitly widen the boundary."
- Text input (not multiple choice) - the user types a path.

Once the user provides a directory path:

1. Resolve it to an absolute path:
```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
echo "$FREEZE_DIR"
```

2. Ensure trailing slash and save to the freeze state file:
```bash
FREEZE_DIR="${FREEZE_DIR%/}/"
eval "$($HOME/.gstack-lite/bin/gl-slug 2>/dev/null)"
STATE_DIR="${GSTACK_LITE_STATE_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.gstack-lite}"
mkdir -p "$STATE_DIR"
echo "$FREEZE_DIR" > "$STATE_DIR/freeze-dir.txt"
echo "Freeze boundary set: $FREEZE_DIR"
```

Tell the user: "Edits are now restricted to `<path>/`. I will not edit outside
this directory unless you explicitly widen the boundary. To change the boundary,
run `/gl-freeze` again. To remove it, run `/gl-unfreeze` or end the session."

## How it works

The freeze boundary persists for the session via the state file. Agents should
read this file before editing and keep changes inside the recorded path.

This lite pack does not install host hooks or global agent settings. If a host
environment has its own hook integration, it may also read the same state file
to enforce the boundary mechanically.

## Notes

- The trailing `/` on the freeze directory prevents `/src` from matching `/src-old`
- Freeze is an agent workflow boundary, not a security boundary
- Bash commands like `sed` can still modify files outside the boundary; do not run write commands outside the frozen path
- To deactivate, run `/gl-unfreeze` or end the conversation
