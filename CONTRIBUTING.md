# Contributing to Argenta-Tui

Argenta-Tui is the Multi-Agent Terminal of Rabelus Lab. It grows from the OpenCode lineage while following its own product, branding, and ecosystem direction.

## What we welcome

- bug fixes
- improvements to runtime stability
- provider and model integration improvements
- documentation fixes
- UX improvements that fit the established Argenta direction

Core product changes, onboarding changes, and major runtime decisions should not be improvised. They need to respect the planning and validation flow already documented in this project.

## Development basics

- Requirements: Bun 1.3+
- Install dependencies from the repo root:

```bash
bun install
```

- Start the project locally:

```bash
bun dev
```

## Running in another directory

By default, `bun dev` runs the local equivalent of the Argenta-Tui CLI inside `packages/opencode`.

```bash
bun dev <directory>
```

## Building the standalone binary

```bash
./packages/opencode/script/build.ts --single
```

The produced binary is branded as `argenta-fenix` in the current Argenta flow.

## Main areas of the codebase

- `packages/opencode` — core business logic and server
- `packages/opencode/src/cli/cmd/tui/` — TUI written with SolidJS and opentui
- `packages/app` — shared web UI surface
- `packages/desktop` — native desktop wrapper

## API / web development

- headless API server:

```bash
bun dev serve
```

- web app:

```bash
bun run --cwd packages/app dev
```

## Ground rules

- keep the Argenta/Rabelus Lab identity coherent
- do not erase the OpenCode lineage, but do not let upstream branding dominate public-facing surfaces
- prefer small, verifiable changes
- document significant runtime/product decisions before broad edits

## Security and style

- follow the style guide in `AGENTS.md`
- review `SECURITY.md` before making changes that affect exposure, permissions, or remote execution

## Upstream awareness

Argenta-Tui honors the OpenCode community and benefits from its lineage. If you are making changes that intentionally diverge from upstream, document the rationale clearly so future sync work remains possible.
