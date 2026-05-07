# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a TypeScript library / package.{{BRAIN_SNIPPET}}

## Architecture

- **Language:** TypeScript (strict mode)
- **Build:** tsup / tsc{{EXTRA_STACK}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Directory Structure

```
src/
  index.ts              # Public API — only export what consumers need
  lib/                  # Implementation
  types.ts              # Exported TypeScript types
  utils/                # Internal utilities (not exported)
tests/
dist/                   # Compiled output — CJS + ESM dual build (gitignored)
```

## Coding Standards

- TypeScript strict mode — no `any`, no non-null assertions without a comment explaining why
- Explicit return types on all exported functions
- Keep the public API surface minimal — export only what is documented
- Internal helpers live in `src/utils/` and are never re-exported
- JSDoc on every exported function — include `@param`, `@returns`, `@throws`, `@example`
- Prefer immutability — `readonly` arrays and properties where possible

## API Design

- Favor options objects over positional args beyond 2 parameters
- Overloaded signatures for ergonomic usage patterns
- Throw typed errors (custom subclass of `Error`) for expected failures
- Return `undefined` (not `null`) for optional results
- No side effects at module load time — no global state mutations

## Dual Build (CJS + ESM)

- Output both `dist/cjs/` and `dist/esm/` with matching type declarations
- `package.json` exports map:
  ```json
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
  ```
- Test the built package before releasing: `{{PACKAGE_MANAGER}} pack` and inspect the tarball

## Testing

- Run: `{{PACKAGE_MANAGER}} run test`
- 100% coverage of public API
- Test types with `tsd` or `expect-type`
- Include at least one integration test that imports from the dist build

## Publishing Checklist

- [ ] `{{PACKAGE_MANAGER}} run build` — clean build
- [ ] `{{PACKAGE_MANAGER}} run test` — all passing
- [ ] `{{PACKAGE_MANAGER}} run type-check` — no errors
- [ ] Bump version in `package.json` (semver)
- [ ] Update `CHANGELOG.md`
- [ ] `npm publish --access public`

## Common Commands

```bash
{{PACKAGE_MANAGER}} run dev          # watch mode
{{PACKAGE_MANAGER}} run build        # build dist/
{{PACKAGE_MANAGER}} run test         # tests
{{PACKAGE_MANAGER}} run type-check   # tsc --noEmit
{{PACKAGE_MANAGER}} run lint         # ESLint
```
