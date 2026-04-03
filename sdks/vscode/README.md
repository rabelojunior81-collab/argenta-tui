# Argenta-Tui VS Code Extension

A Visual Studio Code extension that integrates the Argenta-Tui runtime into your development workflow.

## Prerequisites

This extension expects the terminal runtime used by the project to be available locally. At this stage, follow the official Argenta-Tui repository for the most up-to-date setup instructions:

- `https://github.com/rabelojunior81-collab/argenta-tui`
- `https://rabelojunior81-collab.github.io/argenta-tui/`

## Features

- **Quick Launch**: Open Argenta-Tui in a split view, or focus an existing session.
- **New Session**: Start a new Argenta-Tui terminal session even if one is already open.
- **Context Awareness**: Automatically share your current selection or active file with the runtime.
- **File Reference Shortcuts**: Insert file references like `@File#L37-42`.

## Support

This extension is part of the Argenta-Tui public surface. If you find an issue, use the Argenta-Tui repository issue tracker:

- `https://github.com/rabelojunior81-collab/argenta-tui/issues`

## Development

1. `code sdks/vscode` — Open the `sdks/vscode` directory in VS Code. **Do not open from repo root.**
2. `bun install` — Run inside the `sdks/vscode` directory.
3. Press `F5` to start debugging — This launches a new VS Code window with the extension loaded.

### Making changes

`tsc` and `esbuild` watchers run automatically during debugging. Changes to the extension rebuild in the background.

To test your changes:

1. In the debug VS Code window, press `Cmd+Shift+P`
2. Search for `Developer: Reload Window`
3. Reload the window without restarting the debug session

## Upstream note

This extension remains part of a fork lineage rooted in OpenCode. Public metadata can evolve under the Argenta brand, but internal compatibility-sensitive identifiers should be changed carefully and intentionally.

That is why some internal command ids and runtime invocation details still preserve `opencode` naming for compatibility during this phase.
