# Setup Instructions for AI Agents

> This file is written for AI coding agents. If you are an AI agent reading this, follow these steps to install ai-brain on the user's project.

## What ai-brain Does

Sets up every AI coding agent with:
1. A personalized brain vault built from the user's actual git repos and AI history
2. Context files for every agent: CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, copilot-instructions.md, .clinerules

## Steps

### Step 1 — Check Node.js

```bash
node --version
```

Must be v18 or higher. If not installed, tell the user to visit https://nodejs.org

### Step 2 — Run ai-brain

In the user's project directory:

```bash
npx ai-brain --yes
```

The `--yes` flag runs everything non-interactively. Do not run without it or it will prompt for input.

### Step 3 — Tell the user

After it completes, say:

> "ai-brain finished! Here's what was set up:
>
> - **~/AgentBrain/** — your personalized brain vault with your projects and skill notes already filled in
> - **CLAUDE.md** — project context file for this project
> - **Agent files** — .cursorrules, .windsurfrules, copilot-instructions.md, .clinerules, AGENTS.md
> - **Global wiring** — ~/.claude/CLAUDE.md and ~/.gemini/GEMINI.md now read your brain vault on every session
>
> **Open Obsidian** → "Open folder as vault" → select `~/AgentBrain/` to see your knowledge graph.
>
> Then edit `~/AgentBrain/Me.md` to add your name, preferences, and anything you want every AI agent to know about you."

## Flags Reference

| Flag | Effect |
|------|--------|
| `--yes` / `-y` | Non-interactive (required for AI-driven setup) |
| `--no-brain` | Skip brain vault |
| `--no-gemini` | Skip ~/.gemini/GEMINI.md |
| `--no-agents` | Skip .cursorrules etc. |
| `--force` | Overwrite existing CLAUDE.md |
| `--brain <path>` | Custom vault path |
| `--dry-run` | Preview without writing |
