# Social Media Launch Posts

Copy-paste ready. Post in this order for maximum reach.

---

## 1. Twitter / X Thread

Post these as a thread (reply to yourself):

---

**Tweet 1 (hook):**
```
Your AI coding agent has amnesia.

Every session: blank slate. No memory of your stack, your projects, or what you did last week.

I built a fix. One command.

🧵
```

---

**Tweet 2 (the problem):**
```
You've spent hours teaching Claude your codebase.
Told Cursor your conventions.
Explained your stack to Gemini.

Tomorrow? It forgets everything.

The real problem isn't the AI — it's that there's no persistent brain connecting your sessions.
```

---

**Tweet 3 (the solution):**
```
npx ai-brain

That's it.

It scans your git repos, reads your Claude history, detects your stack — and builds a personalized Obsidian vault every agent reads automatically.

Not a generic template. YOUR actual projects.
```

---

**Tweet 4 (before/after):**
```
Before ai-brain:
AgentBrain/
  Home.md ← "Add your projects here"

After ai-brain:
AgentBrain/
  Home.md ← YOUR actual projects + stacks
  Me.md ← YOUR role, languages, frameworks
  Daily/2024-01-15.md ← what you worked on
  Skills/NextJS.md ← because you use Next.js
  Projects/my-saas.md ← your real repo
```

---

**Tweet 5 (works everywhere):**
```
Works with every agent:

✅ Claude Code → CLAUDE.md + ~/.claude/CLAUDE.md
✅ Cursor → .cursorrules
✅ Windsurf → .windsurfrules
✅ GitHub Copilot → copilot-instructions.md
✅ Gemini CLI → ~/.gemini/GEMINI.md
✅ Cline, Aider, Continue

One command wires them all.
```

---

**Tweet 6 (CTA):**
```
Open source, MIT, works on macOS/Linux/Windows.

npx ai-brain

GitHub: https://github.com/ItsWambarYT/ai-brain

⭐ Star it if this solves a real problem for you. It took me a while to build and I'd love to know people find it useful.
```

---

## 2. Hacker News — "Show HN"

**Title:**
```
Show HN: ai-brain – one command to give Claude, Cursor, Gemini a persistent personalized brain
```

**Body:**
```
Hey HN,

I got tired of re-explaining my projects to every AI coding agent every session. Claude Code, Cursor, Gemini CLI — they all start blank every time.

So I built ai-brain: a CLI that scans your actual git repos and AI history, then generates a personalized Obsidian vault + config files for every agent you use.

$ npx ai-brain

It reads only file paths, dependency lists (package.json / pyproject.toml), and Claude memory index files — never source code or raw conversations. Stays 100% local.

What it generates:
- ~/AgentBrain/ — Obsidian vault with Home.md (your real projects), Me.md (your detected role/stack), Skills/<framework>.md, Projects/<repo>.md, daily notes
- CLAUDE.md, .cursorrules, .windsurfrules, .github/copilot-instructions.md, AGENTS.md for the current project
- ~/.claude/CLAUDE.md, ~/.gemini/GEMINI.md wired to read the vault on every session

If it finds limited data (new machine, sparse history) it runs a 5-question onboarding interview instead of giving you an empty template.

Also has --yes for fully non-interactive setup (so you can just tell Claude "run npx ai-brain --yes" and it handles everything).

Code: https://github.com/ItsWambarYT/ai-brain
npm: https://www.npmjs.com/package/ai-brain

Happy to answer questions about how the profiler works or how the brain protocol is structured.
```

---

## 3. Reddit — r/ClaudeAI

**Title:**
```
I built a tool that gives Claude a persistent personalized brain — built from your real projects and history (npx ai-brain)
```

**Body:**
```
Hey everyone,

Like a lot of people here I was constantly re-explaining my projects to Claude at the start of every session. CLAUDE.md helps but maintaining it manually is annoying, and it doesn't carry your context across sessions.

I built **ai-brain**: a CLI that scans your git repos, reads your Claude memory index files, detects your stack, and builds a personalized Obsidian vault that Claude reads automatically on every session.

**One command:**
```
npx ai-brain
```

**What it builds for you:**
- `~/AgentBrain/Home.md` — your real projects with stacks and last-active dates
- `~/AgentBrain/Me.md` — your inferred role, languages, frameworks  
- `~/AgentBrain/Skills/NextJS.md` etc. — because it found Next.js in your repos
- `~/AgentBrain/Projects/my-saas.md` — per-repo notes
- `~/.claude/CLAUDE.md` — wired to read the brain on every session start

**Privacy note:** it only reads file paths, dependency lists, and your Claude memory index (the summaries you wrote). Never source code, never raw conversations. Everything stays local.

If your machine is new and detection finds nothing, it runs a quick 5-question interview to fill in the blanks.

GitHub: https://github.com/ItsWambarYT/ai-brain

Would love feedback — especially from people who've already built elaborate CLAUDE.md setups. Does this replace your workflow or complement it?
```

---

## 4. Reddit — r/cursor

**Title:**
```
One command to auto-generate .cursorrules from your actual projects and wire it to a persistent Obsidian brain
```

**Body:**
```
Quick share — I built a CLI that:

1. Scans your git repos and detects your actual stack
2. Generates a personalized `.cursorrules` (and every other agent config)
3. Creates an Obsidian brain vault that Cursor reads on every session

```
npx ai-brain
```

Generated files for Cursor:
- `.cursorrules` — project-specific context
- `~/AgentBrain/` — persistent vault with your real projects, skills, daily notes

Also handles Claude Code, Windsurf, Copilot, Gemini CLI, Cline, Aider in the same run.

https://github.com/ItsWambarYT/ai-brain

MIT, Node 18+, works on Mac/Linux/Windows.
```

---

## 5. Reddit — r/webdev

**Title:**
```
Tired of re-explaining your stack to your AI agent every session? I built a fix (npx ai-brain)
```

**Body:**
```
Every time I started a new Claude or Cursor session I was copy-pasting the same context: "this is a Next.js app with Prisma and tRPC, we use pnpm, here's our folder structure..."

I got tired of it and built **ai-brain**: scans your repos, detects your stack, generates a personalized config for every AI agent you use, and creates an Obsidian brain vault that persists your context across sessions.

```bash
npx ai-brain
```

Supports: Claude Code, Cursor, Windsurf, GitHub Copilot, Gemini CLI, Cline, Aider, Continue.

Generates: CLAUDE.md, .cursorrules, .windsurfrules, copilot-instructions.md, AGENTS.md, and a brain vault at ~/AgentBrain.

Open source: https://github.com/ItsWambarYT/ai-brain

Anyone else have tricks for managing AI context between sessions?
```

---

## 6. Product Hunt

**Tagline:**
```
Give every AI coding agent a persistent brain — one command
```

**Description:**
```
ai-brain solves the biggest frustration with AI coding agents: they forget everything between sessions.

Run `npx ai-brain` and it:

🔍 Scans your git repos to find your real projects and detect your stack
📖 Reads your Claude history to surface past topics
🧠 Builds a personalized Obsidian brain vault with your actual data — not a blank template
⚡ Generates config files for every AI tool you use (CLAUDE.md, .cursorrules, .windsurfrules, copilot-instructions, AGENTS.md, and more)
🔗 Wires Claude Code, Gemini CLI, and Continue to read the vault on every session automatically

The result: every AI agent you open — Claude, Cursor, Windsurf, Gemini — already knows your stack, your projects, your coding style, and what you've been working on.

Works on macOS, Linux, and Windows. MIT license. Node 18+.

For teams using AI agents heavily, this turns every session from "let me re-explain my codebase" to "let's pick up where we left off."
```

---

## 7. Discord / Slack drop-in

Short version for Discord servers (Claude Discord, Cursor Discord, AI coding channels):

```
hey — I built a tool called ai-brain that gives every AI coding agent a persistent personalized brain: it scans your git repos, reads your Claude history, detects your stack, and builds an Obsidian vault + all your agent configs in one command.

npx ai-brain

Supports Claude Code, Cursor, Windsurf, Copilot, Gemini CLI, Cline, Aider. MIT, works on Mac/Windows/Linux.

GitHub: https://github.com/ItsWambarYT/ai-brain

would love feedback from people who've already been building their own brain setups
```

---

## Posting strategy

1. **Post the Twitter thread first** — it's the fastest reach and drives GitHub stars
2. **Reddit r/ClaudeAI** — highest intent audience, will actually try it
3. **Hacker News Show HN** — post on a weekday morning (9-10am ET) for best visibility
4. **r/cursor** and **r/webdev** — post on different days to avoid looking spammy
5. **Product Hunt** — needs a "hunter" to submit; save for when you have some GitHub stars already
6. **Discord servers** — drop in Claude Discord, Cursor Discord, any AI dev communities you're in
