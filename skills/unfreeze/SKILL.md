---
name: gstack-lite-unfreeze
description: |
  Clear the freeze boundary set by /freeze, allowing edits to all directories
  again. Use when you want to widen edit scope without ending the session.
  Use when asked to "unfreeze", "unlock edits", "remove freeze", or
  "allow all edits". (gstack-lite)
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
- Browser binary, when installed: `$HOME/.gstack-lite/browse/dist/browse`
- Design binary, when installed: `$HOME/.gstack-lite/design/dist/design`

# /unfreeze - Clear Freeze Boundary

Remove the edit restriction set by `/freeze`, allowing edits to all directories.

```bash
mkdir -p $HOME/.gstack-lite/analytics
```

## Clear the boundary

```bash
STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack-lite}"
if [ -f "$STATE_DIR/freeze-dir.txt" ]; then
  PREV=$(cat "$STATE_DIR/freeze-dir.txt")
  rm -f "$STATE_DIR/freeze-dir.txt"
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result. Note that `/freeze` hooks are still registered for the
session - they will just allow everything since no state file exists. To re-freeze,
run `/freeze` again.
