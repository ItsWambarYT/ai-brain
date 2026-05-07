# ai-brain

> **Give every AI coding agent a persistent, personalized brain — built from your real projects and history. One command.**

```bash
npx ai-brain
```

Works with **Claude Code · Gemini CLI · Cursor · Windsurf · GitHub Copilot · Cline · Aider · Continue · Codex CLI**

---

## The Problem

Your AI coding agents start every session with zero memory. They don't know your stack, your conventions, which projects you're working on, or what you did last week. The more agents you use, the worse it gets — each one is a blank slate every time.

## What ai-brain Does

```
$ npx ai-brain

  ai-brain v1.0.0

Project:  /Users/me/my-saas-app

✔ Found 4 projects · Claude Code, Cursor, Gemini CLI
✔ Detected: Next.js App

✔ CLAUDE.md
✔ Brain vault: /Users/me/AgentBrain
  Personalized with 4 projects, 5 skill notes
✔ ~/.claude/CLAUDE.md → wired to brain
✔ Registered in Obsidian
✔ ~/.gemini/GEMINI.md
✔ AGENTS.md
✔ .cursorrules
✔ .windsurfrules
✔ .github/copilot-instructions.md
✔ .clinerules
✔ .aider.conf.yml

All done!

Next steps:
  1. Open Obsidian → "Open folder as vault" → /Users/me/AgentBrain
  2. Edit /Users/me/AgentBrain/Me.md — tell your agents who you are
  3. Start a new AI session — all agents now read your brain automatically
```

---

## What It Generates

### 1. A Personalized Brain Vault (`~/AgentBrain/`)

Not a generic empty template — a vault **built from your actual machine**:

- Scans your git repos (Desktop, Documents, Projects, code, src, dev…) for active projects
- Reads your Claude Code memory files to find past topics
- Detects which AI tools you have installed
- Creates a `Home.md` listing your real projects with detected stacks and last-active dates
- Creates `Me.md` with your inferred role, languages, and frameworks
- Creates skill notes for each framework you actually use (`Skills/NextJS.md`, `Skills/FastAPI.md`…)
- Creates project notes for each detected repo (`Projects/MySaaS.md`…)

**Before ai-brain:**
```
AgentBrain/
  Home.md   ← "Add your projects here"
```

**After ai-brain:**
```
AgentBrain/
  Home.md             ← lists YOUR actual projects with stacks + last active dates
  Me.md               ← YOUR inferred role: "Full-Stack Developer · TypeScript · Python"
  Daily/
    2024-01-15.md     ← "Found 4 projects: my-saas (Next.js), api-server (FastAPI)…"
  Skills/
    NextJS.md         ← Next.js patterns (because you have Next.js projects)
    FastAPI.md        ← FastAPI patterns (because you have FastAPI projects)
    TypeScript.md     ← TypeScript rules
    AIAgents.md       ← your AI tools setup
  Projects/
    my-saas.md        ← stack, path, last active, status
    api-server.md     ← stack, path, last active, status
```

Every session, every agent reads this vault. They know who you are, what you're building, and what you've been doing — automatically.

### 2. Context Files for Every Agent

Generated from the same detected stack — not a generic template:

| File | Agent | Contains |
|------|-------|---------|
| `CLAUDE.md` | Claude Code | Full project context, coding rules, commands |
| `AGENTS.md` | Codex CLI, Aider | Project context + brain vault instructions |
| `.cursorrules` | Cursor IDE | Same as CLAUDE.md |
| `.windsurfrules` | Windsurf IDE | Same as CLAUDE.md |
| `.github/copilot-instructions.md` | GitHub Copilot | Same as CLAUDE.md |
| `.clinerules` | Cline | Same as CLAUDE.md |
| `.aider.conf.yml` | Aider | Points to AGENTS.md |

### 3. Global Agent Wiring

| File | Agent | Effect |
|------|-------|--------|
| `~/.claude/CLAUDE.md` | Claude Code | Reads brain vault on every session |
| `~/.gemini/GEMINI.md` | Gemini CLI | Reads brain vault on every session |
| `~/.continue/config.md` | Continue | Reads brain vault on every session |

---


## Smart Onboarding

When auto-detection finds limited data (new machine, empty home dir), ai-brain runs a 5-question interview instead of giving you a blank vault:

```
? Your name: Andrew
? Your role: Full-Stack Developer
? Primary languages: [x] TypeScript  [x] Python
? Frameworks you use: [x] Next.js  [x] FastAPI  [x] Tailwind CSS
? Coding style: Functional, small functions, strict types
? Package manager: pnpm
? What are you currently working on? Building a SaaS with Next.js and Stripe
? One rule every AI agent must follow: Never add comments unless the WHY is non-obvious
```

60 seconds. The answers go directly into `Me.md` and `Workflow.md` — the two notes every agent reads at session start.

## Quick Start

```bash
# Interactive (recommended for first run)
npx ai-brain

# Non-interactive — accept all defaults
npx ai-brain --yes

# Preview without writing anything
npx ai-brain --dry-run
```

### Tell Your AI Agent to Set It Up

Paste this to any AI agent:

> "Run `npx ai-brain --yes` in my project directory"

The `--yes` flag runs everything non-interactively. The agent handles it completely.

Or for a zero-config one-liner:

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/ItsWambarYT/ai-brain/main/setup.sh | bash
```

**Windows PowerShell:**
```powershell
irm https://raw.githubusercontent.com/ItsWambarYT/ai-brain/main/setup.ps1 | iex
```

---

## Commands

```bash
# Full setup: profile scan + CLAUDE.md + brain vault + all agent configs
npx ai-brain

# Non-interactive (for AI agents to run)
npx ai-brain --yes

# Preview everything without writing
npx ai-brain --dry-run

# Skip brain vault
npx ai-brain --no-brain

# Custom brain vault location
npx ai-brain --brain ~/Documents/MyBrain

# Force overwrite existing CLAUDE.md
npx ai-brain --force

# Generate only CLAUDE.md
npx ai-brain generate

# Force a specific template
npx ai-brain generate --template python-fastapi

# See what's detected in your project
npx ai-brain scan

# Create / update brain vault only
npx ai-brain brain

# Rescan repos and refresh vault with new projects
npx ai-brain update
```

---

## Supported Project Types

Auto-detected. No config needed.

| Type | Detected by | Template |
|------|-------------|---------|
| Next.js | `next` in package.json | Full App Router patterns + RSC rules |
| React + Vite | `react` + `vite` | Component patterns + React Query + Zustand |
| Python FastAPI | `fastapi` in requirements | Route/service/store architecture + async rules |
| Python Data / ML | `pandas`, `torch`, `sklearn`… | Notebook conventions + reproducibility rules |
| Node.js CLI | `bin` in package.json | Unix CLI conventions + exit codes + testing |
| TypeScript Library | `tsconfig.json`, no framework | Dual CJS/ESM build + API design rules |
| Go | `go.mod` | Error wrapping + context propagation + testing |
| Anything else | fallback | Universal coding standards |

Sub-dependencies also detected: tRPC, Prisma, Drizzle, NextAuth, SQLAlchemy, Alembic, Celery, Zustand, Tailwind, and more.

---

## The Brain Protocol

The vault uses a dead-simple convention any agent can follow:

```
Every session start:
  1. Read ~/AgentBrain/Daily/YYYY-MM-DD.md (create if missing)
  2. Read ~/AgentBrain/Home.md

After every meaningful exchange:
  - Append summary to daily note under ### Session N
  - New topic → create ~/AgentBrain/TopicName.md
  - Add [[TopicName]] wikilink to daily note
  - Keep Home.md updated
```

After a few weeks your vault is a knowledge graph of every decision, every fix, every project — readable by any agent in any session.

---

## Privacy

The profiler reads **only**:
- File paths from git repos (not source code content)
- `package.json` / `pyproject.toml` dependency lists (not source code)
- Claude Code memory index files (summaries you wrote, not raw conversations)
- Config file existence (to detect which tools are installed)

No source code is read. No conversations are read. Everything stays local.

---

## Requirements

- **Node.js 18+** — `node --version`, install at [nodejs.org](https://nodejs.org)
- **Obsidian** (optional) — free at [obsidian.md](https://obsidian.md), for the visual knowledge graph

Works on macOS, Linux, and Windows.

---

## Contributing

PRs welcome.

**Add a project template:**
1. `src/templates/myframework.md` with `{{PROJECT_NAME}}`, `{{PACKAGE_MANAGER}}`, `{{EXTRA_STACK}}`
2. Detection in `src/scanner.js`
3. Example in `examples/myframework/CLAUDE.md`
4. Docs in `docs/templates.md`

**Add a new AI agent:**
1. Generator function in `src/wirer.js`
2. Call in `src/setup.js`
3. Doc entry in `docs/agents.md`

---

## License

MIT
