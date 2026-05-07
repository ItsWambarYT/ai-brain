# CLAUDE.md Templates

claude-vault ships 8 hand-tuned templates. Each one contains real, opinionated rules for that stack — not generic advice.

## nextjs

Triggered by: `next` in `package.json`

Covers:
- App Router directory structure (route groups, API routes, layouts)
- TypeScript strict mode rules
- RSC vs Client Component decision rules
- State management (RSC first → Server Actions → React Query → Zustand)
- Image, font, and dynamic import performance rules
- Environment variable validation with Zod
- Testing with Vitest + Playwright

Extra stack detection: tRPC, Prisma, Drizzle, NextAuth, TanStack Query, Tailwind, monorepo

---

## react-vite

Triggered by: `react` + (`vite` or no `next`)

Covers:
- Vite project structure
- TypeScript strict mode
- React Query for server state
- Zustand for global client state
- Tailwind + `cva` for styling
- Code-splitting with `lazy` + `Suspense`
- MSW for test mocking

Extra stack detection: React Query, Zustand, Jotai, React Router, TanStack Router, Tailwind

---

## python-fastapi

Triggered by: `fastapi` in `requirements.txt` or `pyproject.toml`

Covers:
- Layered architecture (routes → services → stores)
- Async SQLAlchemy session management
- Pydantic schema validation
- JWT auth with FastAPI `Depends()`
- Alembic migration workflow
- pytest-asyncio testing patterns
- structlog + request ID logging

Extra stack detection: SQLAlchemy, Alembic, Celery, Poetry, uv, Docker

---

## python-data

Triggered by: `pandas`, `numpy`, `torch`, `tensorflow`, `sklearn`, `polars`, `jupyter`

Covers:
- Numbered notebook convention (01_eda.ipynb)
- Raw → interim → processed data pipeline
- Reproducibility rules (seed setting)
- MLflow / W&B experiment tracking
- Model versioning with timestamp + git hash
- Pandera schema validation
- nbstripout before committing

Extra stack detection: PyTorch, TensorFlow, DVC, Poetry, uv

---

## node-cli

Triggered by: `bin` field in `package.json` (no React/Next)

Covers:
- ESM-first structure
- Unix CLI conventions (stdin/stdout, stderr for diagnostics)
- `--dry-run`, `--json`, `NO_COLOR` / `--no-color` flags
- Exit code conventions (0/1/2)
- `execa`-based integration testing
- Publishing checklist (shebang, `files` field, `engines.node`)

Extra stack detection: Commander.js, Inquirer, Docker

---

## typescript-lib

Triggered by: `tsconfig.json` present, no framework detected

Covers:
- Minimal public API surface (export only what's documented)
- JSDoc on every export
- Dual CJS + ESM build with `exports` map
- Type testing with `tsd` / `expect-type`
- Semver + CHANGELOG publishing workflow
- `npm pack` verification before publish

Extra stack detection: tsup, Vitest, Jest

---

## go

Triggered by: `go.mod` present

Covers:
- Standard Go project layout (`cmd/`, `internal/`, `pkg/`)
- Error wrapping with `fmt.Errorf("…: %w", err)`
- Context propagation rules
- Interface placement (consumer, not implementor)
- HTTP server with timeouts + structured JSON errors
- `slog` / `zerolog` logging
- Table-driven tests with `t.Run`
- `golangci-lint` usage

Extra stack detection: gin, echo, fiber (web framework auto-detected)

---

## generic

Triggered by: everything else (Rust, Ruby, PHP, monorepo, bare JS, etc.)

Covers:
- Universal coding standards
- Error handling principles
- Testing minimums
- Development workflow
- Placeholder commands for you to fill in

This template is intentionally sparse — it's a starting point. Edit `CLAUDE.md` after generation to add your project's specifics.

---

## Customizing Templates

After generation, `CLAUDE.md` is just a Markdown file. Edit it freely. Common things to add:

- The actual names of your key files and modules
- Your team's specific conventions
- Authentication details (what system, where the config is)
- Database schema highlights
- CI/CD pipeline details
- Deployment process

The more specific the file, the better Claude performs on your project.
