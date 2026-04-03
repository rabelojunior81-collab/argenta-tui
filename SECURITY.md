# Security

## Important

Do not treat the Argenta-Tui permission UX as a hard security boundary.

Argenta-Tui is a powerful local AI terminal and may execute commands, interact with files, and connect to external services depending on runtime configuration and enabled tools.

## Threat model

### Overview

Argenta-Tui is a terminal-first AI assistant that inherits part of its architectural lineage from OpenCode while operating under the Rabelus Lab ecosystem.

### No sandbox guarantee

Argenta-Tui does **not** provide true sandbox isolation by default.

If your use case requires strict isolation, run it inside:

- a VM
- a container
- an isolated workstation/profile

### Server mode

If you expose headless/server functionality, securing access is your responsibility.

That includes:

- authentication
- network exposure
- reverse proxying
- local runtime/provider credentials

### Out of scope

| Category | Rationale |
|---|---|
| User-enabled server exposure | Expected behavior when the user explicitly exposes the server |
| External MCP behavior | External servers/plugins are outside the core trust boundary |
| Provider-side data handling | Remote model providers govern their own data policies |
| Local environment compromise | The terminal is not intended to be a sandbox |

## Reporting security issues

If you identify a real security issue in the Argenta-Tui codebase, report it privately through the repository's security workflow or a private maintainer channel when available.

If that channel is not yet formalized, open a private coordination path before disclosing details publicly.

## Practical guidance

- keep credentials scoped and minimal
- prefer local-only execution where possible
- review tool access before enabling remote integrations
- avoid exposing local inference servers broadly on the network without explicit controls
