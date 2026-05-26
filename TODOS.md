# TODOs

## P2: Add an app-style extraction manifest for `gl-design-variants`

- **What:** Save a `style-sources.json` for each `gl-design-variants` run that records the files, routes, screenshots, CSS variables, components, and design tokens used to infer the app style.
- **Why:** Makes bad-looking variants debuggable by showing which evidence the skill used and whether it missed the real app shell or design system.
- **Pros:** Improves auditability, makes regressions easier to diagnose, and gives future agents a concrete starting point for refinement.
- **Cons:** Adds another generated artifact and a small amount of schema maintenance.
- **Context:** Deferred during the 2026-05-26 CEO review for the code-native design variants skill. V1 should ship with a lighter `run-summary.json`; this manifest is a v1.1 hardening item once the base workflow is proven.
- **Effort:** S human / S with CC+gstack.
- **Depends on / blocked by:** `gl-design-variants` v1 artifact directory and run summary shape.

## P2: Add framework-native variant output for `gl-design-variants`

- **What:** Let `gl-design-variants` optionally generate React, Vue, Svelte, Next, or similar preview files that reuse existing project components and styles instead of only self-contained HTML.
- **Why:** Moves approved designs closer to production implementation when the user wants the design exploration artifact to become code directly.
- **Pros:** Higher fidelity to the real app, shorter path from approved design to implementation, and better fit for componentized projects.
- **Cons:** Increases framework-specific maintenance and risks turning an exploration skill into implementation work too early.
- **Context:** Deferred during the 2026-05-26 CEO review. The strategic direction is for `gl-design-variants` to become the preferred design workflow, but v1 should prove self-contained HTML exploration first.
- **Effort:** L human / M with CC+gstack.
- **Depends on / blocked by:** `gl-design-variants` v1 and evidence that self-contained HTML is not enough for production handoff.
