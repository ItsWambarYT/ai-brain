# Agent Support

ai-brain generates config files for every major AI coding agent, all pointing to the same brain vault.

## Supported Agents

| Agent | Config file(s) | Scope |
|-------|---------------|-------|
| Claude Code | `~/.claude/CLAUDE.md` + `./CLAUDE.md` | Global + project |
| Gemini CLI | `~/.gemini/GEMINI.md` | Global |
| Cursor IDE | `.cursorrules` | Project |
| Windsurf IDE | `.windsurfrules` | Project |
| GitHub Copilot | `.github/copilot-instructions.md` | Project |
| Cline | `.clinerules` | Project |
| Aider | `AGENTS.md` + `.aider.conf.yml` | Project |
| Continue | `~/.continue/config.md` | Global |
| Codex CLI | `AGENTS.md` | Project |
| Any other | `AGENTS.md` | Project |

## Shared Brain Vault

All agents point to `~/AgentBrain/` (or your custom path). When any agent writes session notes, all others benefit on their next session:

```
Claude Code session  → writes to AgentBrain/Daily/2024-01-15.md
Gemini CLI session   → reads the same file, sees what Claude did
Cursor session       → reads the same file, continues with full context
```

One vault. All agents. Zero duplication.

## File Content

Every agent config file gets the same two things:
1. **Brain snippet** — reads daily note + Home.md on session start, writes summaries
2. **Project context** — same tailored content as CLAUDE.md (stack, structure, coding rules, commands)

## Agent-Specific Details

### Claude Code

Reads at two levels:
- **Global** (`~/.claude/CLAUDE.md`) — loaded on every `claude` session, every project
- **Project** (`./CLAUDE.md`) — loaded when inside that directory

Both get wired. The global file ensures Claude always reads the brain vault. The project file gives Claude full context about this specific codebase.

### Gemini CLI

Reads `~/.gemini/GEMINI.md` globally on every session start. ai-brain creates this file with the brain-reading instruction and behavior rules. Gemini CLI was confirmed to read this file on each invocation.

### Cursor

Reads `.cursorrules` from the workspace root. The file is injected as system context into every Cursor AI interaction in the project. Content is identical to the project CLAUDE.md (stack context + brain snippet).

### Windsurf

Reads `.windsurfrules` from the workspace root. Same as Cursor — injected as context into all Windsurf AI features.

### GitHub Copilot

Reads `.github/copilot-instructions.md` for Copilot Chat in VS Code and JetBrains. Affects inline suggestions and chat responses in that repo.

### Cline

Reads `.clinerules` from the workspace root (VS Code extension). Injected as system context into all Cline agent sessions.

### Aider

Aider reads `AGENTS.md` when `.aider.conf.yml` contains `read: AGENTS.md`. The AGENTS.md contains the project context and brain vault instructions. Aider respects the coding conventions automatically.

### Continue

Reads `~/.continue/config.md` globally. Gets the brain-reading snippet so Continue also has access to the shared memory.

## Adding a New Agent

If you use an agent not listed here, you can adapt the setup:

1. Find out what file your agent reads for system context
2. Run `ai-brain generate --dry-run` to see the generated CLAUDE.md content
3. Copy that content into your agent's config file
4. Add the brain vault snippet from `~/.claude/CLAUDE.md` to the top

Or open an issue / pull request to add native support.
