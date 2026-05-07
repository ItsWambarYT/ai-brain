# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a Node.js CLI tool.{{BRAIN_SNIPPET}}

## Architecture

- **Runtime:** Node.js 18+ (ESM)
- **Language:** TypeScript (strict mode)
- **CLI framework:** Commander.js / yargs{{EXTRA_STACK}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Directory Structure

```
bin/
  {{PACKAGE_SLUG}}.js   # Entry point (thin — just imports and runs)
src/
  commands/             # One file per sub-command
  lib/                  # Shared business logic
  utils/                # Pure utility functions
  types.ts              # Shared TypeScript types
tests/
  commands/             # Integration tests per command
  lib/                  # Unit tests
dist/                   # Compiled output (gitignored)
```

## Coding Standards

- TypeScript strict mode — no `any`, explicit return types on exports
- ESM only (`"type": "module"` in package.json)
- Compiled to `dist/` before publishing — source in `src/`
- Bin entry points are thin: parse args → call command function → exit
- Never `process.exit()` inside library code — throw errors and let the CLI entry handle exit codes
- All user-facing strings go through a single formatting helper (enables color toggling for CI)

## CLI Design

- Follow Unix conventions: stdin/stdout for data, stderr for diagnostics/progress
- `--dry-run` flag on any destructive command
- `--json` flag for machine-readable output on key commands
- Respect `NO_COLOR` env var and `--no-color` flag
- Exit codes: 0 = success, 1 = usage error, 2 = operational error

## Error Handling

- User-facing errors: print a clear message to stderr + exit 1
- Unexpected errors: print message + stack trace in debug mode (`DEBUG=*`) + exit 2
- Never swallow errors silently

## Testing

- Integration tests use `execa` to spawn the actual CLI binary
- Unit tests for pure logic with Node's built-in test runner or Vitest
- Run: `{{PACKAGE_MANAGER}} run test`
- Test both happy paths and failure modes (bad input, missing files, network errors)

## Publishing

- Build before publish: `{{PACKAGE_MANAGER}} run build`
- `files` field in package.json includes only `dist/` and `bin/`
- `engines.node` specifies minimum version
- Shebang on entry: `#!/usr/bin/env node`

## Common Commands

```bash
{{PACKAGE_MANAGER}} run dev          # run from source (ts-node / tsx)
{{PACKAGE_MANAGER}} run build        # compile to dist/
{{PACKAGE_MANAGER}} run test         # run tests
{{PACKAGE_MANAGER}} run lint         # ESLint
{{PACKAGE_MANAGER}} run type-check   # tsc --noEmit
node bin/{{PACKAGE_SLUG}}.js --help  # test locally without install
```
