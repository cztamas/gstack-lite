# Browse Runtime

The `gl-browse`, `gl-qa`, `gl-qa-only`, and `gl-design-review` skills look for an optional browser binary at:

```text
$HOME/.gstack-lite/browse/dist/browse
```

This repository does not install browser dependencies automatically. If the binary is missing, browser workflows should degrade to the host's native browser tools, screenshots, or written QA.
