# How claude-vault Works

## Overview

`claude-vault` does three things in one command:

1. **Scans your project** — detects the framework, language, tools, and package manager
2. **Generates a tailored `CLAUDE.md`** — a real, opinionated instruction file Claude Code reads on every session start
3. **Sets up an Obsidian brain vault** — a personal knowledge base that Claude reads and writes to so it remembers context across sessions

---

## Step 1 — Project Scanner

The scanner (`src/scanner.js`) reads your project files without executing any code:

| Signal | What it checks |
|--------|----------------|
| `package.json` deps | `next`, `react`, `vue`, `express`, `fastify`, etc. |
| `pyproject.toml` / `requirements.txt` | `fastapi`, `django`, `flask`, `pandas`, `torch`, etc. |
| `go.mod` | module path, web frameworks |
| `Cargo.toml` | `actix-web`, `axum`, `tokio` |
| Lock files | `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun |
| `tsconfig.json` | TypeScript presence |
| `Dockerfile` | containerized |
| `packages/*/package.json` | monorepo |

Detected signals map to one of **8 templates**:

| Template | Triggers |
|----------|---------|
| `nextjs` | `next` in deps |
| `react-vite` | `react` + `vite` (no `next`) |
| `python-fastapi` | `fastapi` in requirements |
| `python-data` | `pandas`, `numpy`, `torch`, etc. |
| `node-cli` | `bin` field in `package.json` |
| `typescript-lib` | `tsconfig.json` present, no framework |
| `go` | `go.mod` |
| `generic` | everything else |

---

## Step 2 — CLAUDE.md Generation

The generator (`src/generator.js`) takes a template and substitutes:

- `{{PROJECT_NAME}}` → derived from `package.json` name or directory name
- `{{PACKAGE_MANAGER}}` → `pnpm` / `yarn` / `bun` / `npm` (detected from lock files)
- `{{EXTRA_STACK}}` → additional detected dependencies (tRPC, Prisma, SQLAlchemy, etc.)
- `{{PYTHON}}` → `python3`
- `{{GO_MODULE}}` → read from `go.mod`

The result is a real, human-readable `CLAUDE.md` that reflects your actual stack — not a generic template.

---

## Step 3 — Brain Vault

The brain vault (`src/brain.js`) creates this structure in `~/ClaudeBrain/` (or your chosen path):

```
ClaudeBrain/
  Home.md                   # Master index — Claude updates this
  Daily/
    2024-01-15.md           # Today's session log
    2024-01-16.md           # ...
  Sessions/                 # Longer session notes
  Skills/
    ClaudeCode.md           # How-to notes for Claude Code
```

Claude then reads this vault on every session start because the global `~/.claude/CLAUDE.md` is updated with an instruction to do so.

---

## Step 4 — Global Wiring

The wirer (`src/wirer.js`) appends a brain-reading snippet to `~/.claude/CLAUDE.md`:

```markdown
## Brain Vault — READ FIRST

Vault: ~/ClaudeBrain/

On every session start:
1. Read today's daily note: ClaudeBrain/Daily/YYYY-MM-DD.md
2. Read ClaudeBrain/Home.md for the full topic index
```

This means **every Claude Code session** — on any project — will start by reading your brain vault. Claude knows who you are, what you're working on, and what happened last time.

---

## Optional: GEMINI.md + AGENTS.md

- **`~/.gemini/GEMINI.md`** — equivalent wiring for Gemini CLI
- **`AGENTS.md`** in the project directory — read by Cursor, Windsurf, and other agents that look for it

Both point to the same `~/ClaudeBrain/` vault, so all your AI agents share one source of truth.

---

## Why This Works

Claude Code reads `CLAUDE.md` files at two levels:
- **Global** (`~/.claude/CLAUDE.md`) — loaded on every session, every project
- **Project** (`./CLAUDE.md`) — loaded when you're inside that directory

By putting the brain-reading instruction in the global file and the project-specific coding rules in the project file, you get:

- **Persistent memory** — Claude remembers your preferences, past decisions, ongoing work
- **Project context** — Claude knows your exact stack, conventions, and commands
- **Zero overhead** — happens automatically on every `claude` invocation
