// @ts-check
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir, platform as osPlatform } from 'os';
import chalk from 'chalk';
import { relativeAge } from './profiler.js';

/** @returns {string} */
export function defaultBrainPath() {
  return join(homedir(), 'AgentBrain');
}

/**
 * @param {string} vaultPath
 * @param {import('./profiler.js').UserProfile} [profile]
 * @param {import('./onboarding.js').OnboardingAnswers} [answers]
 */
export function createVaultStructure(vaultPath, profile, answers) {
  const today = todayStr();

  const dirs = [vaultPath, 'Daily', 'Sessions', 'Skills', 'Projects', 'Architecture']
    .map((d, i) => i === 0 ? d : join(vaultPath, d));
  for (const d of dirs) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }

  // Core notes
  writeIfMissing(join(vaultPath, 'Home.md'), buildHome(profile, answers, today));
  writeIfMissing(join(vaultPath, 'Me.md'), buildMe(profile, answers));
  writeIfMissing(join(vaultPath, 'Workflow.md'), buildWorkflow(profile, answers));
  writeIfMissing(join(vaultPath, 'Daily', `${today}.md`), buildDaily(profile, answers, today));

  // Skill notes for each detected/answered framework
  const frameworks = mergeUnique(profile?.frameworks, answers?.frameworks);
  for (const fw of frameworks.slice(0, 8)) {
    writeIfMissing(join(vaultPath, 'Skills', `${fwSlug(fw)}.md`), buildSkillNote(fw));
  }

  // Project notes for each detected repo
  for (const project of (profile?.projects || []).slice(0, 10)) {
    writeIfMissing(join(vaultPath, 'Projects', `${slug(project.name)}.md`), buildProjectNote(project));
  }

  // AI agents setup note (always)
  writeIfMissing(join(vaultPath, 'Skills', 'AIAgents.md'), buildAgentNote(profile));

  // Architecture note (empty template — user fills it in)
  writeIfMissing(join(vaultPath, 'Architecture', 'Overview.md'), buildArchNote(answers));
}

// ─── Home.md ─────────────────────────────────────────────────────────────────

function buildHome(profile, answers, today) {
  const name = answers?.name ? `${answers.name}'s` : 'Your';
  const role = answers?.role || profile?.detectedRole || 'Developer';
  const languages = mergeUnique(profile?.languages, answers?.languages);
  const frameworks = mergeUnique(profile?.frameworks, answers?.frameworks);
  const aiTools = profile?.aiTools || [];
  const projects = profile?.projects || [];

  const projectRows = projects.length
    ? projects.map(p =>
        `| [[Projects/${slug(p.name)}\\|${p.name}]] | ${p.label} | ${relativeAge(p.lastActive)} |`
      ).join('\n')
    : '| *No projects detected — add yours below* | | |';

  const stackStr = mergeUnique(languages, frameworks.slice(0, 4)).join(' · ') || 'Fill in [[Me]]';
  const aiStr = aiTools.join(', ') || 'Fill in [[Me]]';

  const skillLinks = [
    ...mergeUnique([], frameworks.slice(0, 6)).map(fw => `- [[Skills/${fwSlug(fw)}]]`),
    '- [[Skills/AIAgents]]',
    '- [[Workflow]]',
  ].join('\n');

  const topicsBlock = profile?.claudeTopics?.length
    ? `\n## From Your Claude History\n\n${profile.claudeTopics.slice(0, 8).map(t => `- ${t}`).join('\n')}\n`
    : '';

  return `# ${name} Agent Brain

> Every AI agent reads this on session start. Keep it updated — it's your agents' single source of truth.

## Who I Am

- **Role:** ${role}
- **Stack:** ${stackStr}
- **AI tools:** ${aiStr}

→ Full profile in [[Me]] · Working style in [[Workflow]]

## Active Projects

| Project | Stack | Last Active |
|---------|-------|-------------|
${projectRows}

## Daily Log

| Date | Summary |
|------|---------|
| [[Daily/${today}]] | Vault created |

## Skills & Notes

${skillLinks}

## Architecture

- [[Architecture/Overview]]
${topicsBlock}
---

*Built by [ai-brain](https://github.com/ItsWambarYT/ai-brain) · Edit any note — your agents will read the changes next session*
`;
}

// ─── Me.md ───────────────────────────────────────────────────────────────────

function buildMe(profile, answers) {
  const name = answers?.name || '(your name)';
  const role = answers?.role || profile?.detectedRole || '(your role)';
  const languages = mergeUnique(profile?.languages, answers?.languages);
  const frameworks = mergeUnique(profile?.frameworks, answers?.frameworks);
  const aiTools = profile?.aiTools || [];
  const pm = answers?.packageManager ||
    profile?.projects?.find(p => p.packageManager !== 'npm')?.packageManager || 'npm';
  const projects = profile?.projects || [];

  return `# About Me

> Every AI agent reads this note. Be specific — the more detail here, the better every agent performs.

## Identity

- **Name:** ${name}
- **Role:** ${role}
- **Languages:** ${languages.join(', ') || '(fill in)'}
- **Frameworks:** ${frameworks.slice(0, 6).join(', ') || '(fill in)'}
- **Package manager:** ${pm}
- **AI tools I use:** ${aiTools.join(', ') || '(fill in)'}

## My Projects

${projects.length
  ? projects.slice(0, 6).map(p => `- [[Projects/${slug(p.name)}|${p.name}]] — ${p.label}, last active ${relativeAge(p.lastActive)}`).join('\n')
  : '- (detected none — add your projects here)'}

## Background

- (e.g. "5 years of TypeScript, new to Rust")
- (e.g. "strong backend, learning frontend")
- (add what's relevant — agents use this to calibrate explanations)

## What I'm Currently Building

${answers?.currentWork || '(fill in — one sentence about your current project)'}

## Context Agents Should Know

- (e.g. "This codebase uses a monorepo with Turborepo")
- (e.g. "We deploy to Vercel, database is PlanetScale")
- (e.g. "Auth is handled by Clerk")
- (add anything that would take an agent time to discover on their own)

## Learning / Goals

- (e.g. "Learning Rust to rewrite our CLI tools")
- (e.g. "Trying to ship a SaaS this month")
`;
}

// ─── Workflow.md ─────────────────────────────────────────────────────────────

function buildWorkflow(profile, answers) {
  const style = answers?.style || 'Pragmatic — whatever gets the job done cleanly';
  const agentRules = answers?.agentRules || 'Finish tasks completely — verify before reporting done';

  return `# My Workflow

> This is the most important note for AI agents. Be specific.

## Coding Style

${style}

- (add more: e.g. "functional > class-based", "composition over inheritance")
- (e.g. "no premature abstraction — three similar lines beats a helper")
- (e.g. "no comments unless the WHY is non-obvious")

## Testing Approach

- (e.g. "unit tests for pure logic, integration tests for APIs")
- (e.g. "I use Vitest + React Testing Library")
- (e.g. "e2e with Playwright for critical user flows")

## Git Workflow

- (e.g. "feature branches, squash merge to main")
- (e.g. "conventional commits: feat/fix/chore")
- (e.g. "small focused PRs — one thing per PR")

## Rules for All AI Agents

- **${agentRules}**
- Do not add features, refactor, or clean up beyond what I asked
- Do not add comments explaining what code does — well-named code explains itself
- When I ask to "fix X", fix X only — don't touch surrounding code
- Small, focused changes. If something is ambiguous, ask before doing
- External actions (emails, deploys, PRs, posts): always confirm first

## Things I Hate

- (e.g. "magic — I want to understand what's happening")
- (e.g. "over-engineered abstractions for a 3-file project")
- (e.g. "long paragraphs of explanation before doing the thing")
- (e.g. "assuming I want TypeScript when I wrote JavaScript")

## Things That Make Me Happy

- (e.g. "concise, direct responses")
- (e.g. "showing me the diff, not just describing it")
- (e.g. "asking one clarifying question instead of making assumptions")

## My Environment

- OS: ${osPlatform() === 'darwin' ? 'macOS' : osPlatform() === 'win32' ? 'Windows' : 'Linux'}
- Shell: (bash / zsh / PowerShell)
- Editor: (VS Code / Cursor / Windsurf / Zed / Neovim)
- Terminal: (iTerm2 / Ghostty / Windows Terminal / etc.)
`;
}

// ─── Daily note ───────────────────────────────────────────────────────────────

function buildDaily(profile, answers, today) {
  const name = answers?.name ? ` — ${answers.name}` : '';
  const projects = profile?.projects || [];
  const aiTools = profile?.aiTools || [];
  const languages = mergeUnique(profile?.languages, answers?.languages);
  const topics = profile?.claudeTopics || [];

  const projectLines = projects.slice(0, 5)
    .map(p => `  - [[Projects/${slug(p.name)}|${p.name}]] — ${p.label}, last active ${relativeAge(p.lastActive)}`)
    .join('\n') || '  - (no recent projects detected)';

  const topicLines = topics.slice(0, 5).map(t => `  - ${t}`).join('\n');

  return `# ${today}${name}

## Sessions

### Session 1 — Brain Vault Built by ai-brain

**[ai-brain](https://github.com/ItsWambarYT/ai-brain)** scanned your machine and built this personalized vault.

**What was found:**
- Git repos: ${projects.length} active in the last 6 months
- AI tools: ${aiTools.join(', ') || 'none detected'}
- Languages: ${languages.join(', ') || 'not detected'}

${projects.length ? `**Your projects:**\n${projectLines}\n` : ''}${topics.length ? `\n**Topics from your Claude history:**\n${topicLines}\n` : ''}
**What to do now:**
1. Open **[[Me]]** and fill in your name, background, and current project
2. Open **[[Workflow]]** and add your rules for AI agents
3. Start a new AI session — every agent now reads this vault automatically

## Topic Nodes

- [[Me]]
- [[Workflow]]
${projects.slice(0, 4).map(p => `- [[Projects/${slug(p.name)}]]`).join('\n')}
`;
}

// ─── Skill notes ─────────────────────────────────────────────────────────────

function buildSkillNote(framework) {
  const content = {
    'Next.js': `# Next.js

## Patterns I Follow

- App Router everywhere — no Pages Router
- React Server Components by default, \`"use client"\` only for browser APIs or interactivity
- Server Actions for mutations — no fetch to own routes
- TanStack Query for real-time client-side data
- Tailwind for all styling

## File Conventions

\`\`\`
app/
  (auth)/             ← route group, no URL segment
  api/route.ts        ← route handler (public API only)
  layout.tsx          ← RSC, wraps children
  page.tsx            ← RSC, data-fetching component
components/
  ui/                 ← design system primitives
lib/
  db.ts               ← singleton DB client
  auth.ts             ← auth config
\`\`\`

## Rules I Always Follow

- No \`useEffect\` for data fetching — use RSC or Server Actions
- \`next/image\` for all images with explicit dimensions
- \`next/font\` for all fonts — no external CDN links
- Dynamic import heavy components: \`dynamic(() => import(…), { ssr: false })\`

## My Notes

(add your own patterns and gotchas here)
`,
    'React': `# React

## Rules I Follow

- Function components only
- React Query for all server state
- Zustand for global client state (small, focused slices)
- \`useMemo\` / \`useCallback\` only when profiler proves it's needed

## Patterns

\`\`\`tsx
// Data fetching
const { data, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Mutations
const { mutate } = useMutation({ mutationFn: updateUser, onSuccess: () => queryClient.invalidateQueries(['users']) });
\`\`\`

## My Notes

(add your patterns here)
`,
    'FastAPI': `# FastAPI

## Architecture

\`\`\`
routes/ → services/ → stores/
\`\`\`
Never call the database in a route handler. Routes parse requests and call services. Services contain business logic. Stores handle DB.

## Patterns

- All input/output typed with Pydantic schemas
- Auth via \`Depends(get_current_user)\`
- Async everywhere: \`async def\` for all routes and DB calls
- Lifespan for startup/shutdown (not \`@app.on_event\`)

## My Notes

(add your patterns here)
`,
    'TypeScript': `# TypeScript

## My Rules

- Strict mode always (\`"strict": true\` in tsconfig)
- No \`any\` — use \`unknown\` + type narrowing
- Explicit return types on all exported functions
- \`interface\` for objects, \`type\` for unions and computed types
- Zod for all runtime validation (API boundaries, env vars)

## Common Patterns

\`\`\`ts
// Branded types for IDs
type UserId = string & { readonly __brand: 'UserId' };

// Exhaustive switch
function assertNever(x: never): never { throw new Error('Unhandled: ' + x); }
\`\`\`

## My Notes

(add your patterns here)
`,
    'Python': `# Python

## My Rules

- Full type hints everywhere — no untyped functions
- No bare \`except:\` — always catch specific exception types
- \`pathlib.Path\` for all file paths (no string concatenation)
- \`pydantic-settings\` for config/env vars
- \`structlog\` for logging with context
- \`ruff\` for linting, \`mypy\` for types

## My Notes

(add your patterns here)
`,
    'Go': `# Go

## My Rules

- Wrap all errors with context: \`fmt.Errorf("loading user %d: %w", id, err)\`
- Context as first parameter on every I/O function
- Interfaces defined in the consumer package, not the implementor
- No panic in library code — return errors
- Table-driven tests with \`t.Run\`

## My Notes

(add your patterns here)
`,
    'Tailwind CSS': `# Tailwind CSS

## Patterns I Use

- Utility classes directly — no custom CSS except for animations
- \`cn()\` helper (clsx + tailwind-merge) for conditional classes
- Component variants with \`cva\` (class-variance-authority)
- Dark mode via \`dark:\` prefix with \`class\` strategy

## My Notes

(add your patterns here)
`,
    'Prisma': `# Prisma

## Patterns

- Always use \`prisma.$transaction()\` for multi-table writes
- Never expose Prisma models directly in API responses — map to Zod schemas
- Seed script in \`prisma/seed.ts\`
- Migrations: \`npx prisma migrate dev --name description\`

## My Notes

(add your patterns here)
`,
  };

  return content[framework] || `# ${framework}

## My Patterns

(add your patterns, conventions, and gotchas here)

## Key Commands

(add the commands you use regularly)

## My Notes

(add your notes here)
`;
}

// ─── Project notes ────────────────────────────────────────────────────────────

function buildProjectNote(project) {
  const extras = project.signals
    .filter(s => !['next','react','vite','python','go','rust','typescript','node-cli','node-server'].includes(s))
    .join(', ');

  return `# ${project.name}

## Overview

- **Stack:** ${project.label}${extras ? ` + ${extras}` : ''}
- **Path:** \`${project.path}\`
- **Package manager:** ${project.packageManager}
- **Last active:** ${relativeAge(project.lastActive)} (${project.lastActive})

## Status

- [ ] Active
- [ ] Paused
- [ ] Complete

## What It Does

(one paragraph — what problem does this solve?)

## Current Work

(what's in progress right now?)

## Key Decisions

(architectural choices, tech tradeoffs, things an agent would waste time rediscovering)

## Key Files

(the files an agent should know about immediately)

| File | Purpose |
|------|---------|
| (fill in) | (fill in) |

## Gotchas

(things that aren't obvious — non-standard patterns, known bugs, workarounds)

## Deploy

- **Platform:** (Vercel / Railway / AWS / etc.)
- **Environments:** dev → staging → prod
- **Commands:** \`(fill in)\`
`;
}

// ─── AI Agents note ───────────────────────────────────────────────────────────

function buildAgentNote(profile) {
  const tools = profile?.aiTools || [];
  return `# AI Agents Setup

## My Tools

${tools.length ? tools.map(t => `- ${t}`).join('\n') : '- (add your tools: Claude Code, Cursor, Gemini CLI, etc.)'}

## Config Files

| Agent | Config file | Scope |
|-------|-------------|-------|
| Claude Code | \`~/.claude/CLAUDE.md\` + project \`CLAUDE.md\` | Global + project |
| Gemini CLI | \`~/.gemini/GEMINI.md\` | Global |
| Cursor | \`.cursorrules\` | Project |
| Windsurf | \`.windsurfrules\` | Project |
| GitHub Copilot | \`.github/copilot-instructions.md\` | Project |
| Cline | \`.clinerules\` | Project |
| Aider | \`AGENTS.md\` | Project |
| Continue | \`~/.continue/config.md\` | Global |

All of these were generated by **ai-brain** and point to this vault.

## Brain Protocol

Every session, every agent:
1. Reads \`Daily/YYYY-MM-DD.md\` — what happened recently
2. Reads \`Home.md\` — active projects and index
3. Appends a session summary after meaningful work
4. Creates new topic notes with \`[[wikilinks]]\`

## Adding a New Agent

If you start using a new AI tool, add it here and check if there's a config file format it reads. Run \`npx ai-brain generate\` in the project to regenerate context files.
`;
}

// ─── Architecture note ────────────────────────────────────────────────────────

function buildArchNote(answers) {
  return `# Architecture Overview

> Use this note for high-level system design that every agent should understand at a glance.

## System Overview

(e.g. "Monorepo: Next.js frontend, FastAPI backend, PostgreSQL, deployed on Vercel + Railway")

## Key Services / Components

| Component | Tech | Purpose |
|-----------|------|---------|
| (fill in) | (fill in) | (fill in) |

## Data Flow

(describe how data moves through your system)

## External Dependencies

| Service | Purpose | Notes |
|---------|---------|-------|
| (fill in) | (fill in) | (fill in) |

## Environments

| Env | URL | Notes |
|-----|-----|-------|
| Development | localhost | (port, setup) |
| Staging | (URL) | |
| Production | (URL) | |

## Non-Obvious Decisions

(things an engineer joining the project would spend days figuring out)
`;
}

// ─── Obsidian registration ────────────────────────────────────────────────────

function obsidianConfigPath() {
  const p = osPlatform();
  const home = homedir();
  if (p === 'darwin') return join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json');
  if (p === 'win32') return join(home, 'AppData', 'Roaming', 'obsidian', 'obsidian.json');
  return join(home, '.config', 'obsidian', 'obsidian.json');
}

/** @param {string} vaultPath @returns {{ registered: boolean, warning?: string }} */
export function registerInObsidian(vaultPath) {
  const cfgPath = obsidianConfigPath();
  if (!cfgPath || !existsSync(cfgPath)) return { registered: false, warning: 'Obsidian not found' };

  let cfg;
  try { cfg = JSON.parse(readFileSync(cfgPath, 'utf8')); }
  catch { return { registered: false, warning: 'Could not parse obsidian.json' }; }

  const vaults = cfg.vaults || {};
  for (const v of Object.values(vaults)) {
    if ((v.path || '').replace(/\\/g, '/') === vaultPath.replace(/\\/g, '/')) return { registered: true };
  }

  const id = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  cfg.vaults = { ...cfg.vaults, [id]: { path: vaultPath, ts: Date.now() } };

  try { writeFileSync(cfgPath, JSON.stringify(cfg, null, '\t'), 'utf8'); return { registered: true }; }
  catch { return { registered: false, warning: 'Could not write obsidian.json — add vault manually in Obsidian' }; }
}

/** @param {{ path?: string, name?: string, register?: boolean }} opts */
export async function runBrain(opts = {}) {
  const vaultPath = resolve(opts.path || defaultBrainPath());
  const already = existsSync(join(vaultPath, 'Home.md'));
  console.log(chalk.gray(`Brain vault: ${vaultPath}\n`));
  createVaultStructure(vaultPath, undefined, undefined);
  console.log(already
    ? chalk.green(`✓ Brain vault already exists — structure verified`)
    : chalk.green(`✓ Brain vault created: ${vaultPath}`)
  );
  if (opts.register) {
    const r = registerInObsidian(vaultPath);
    r.registered ? console.log(chalk.green(`✓ Registered in Obsidian`)) : console.log(chalk.yellow(`⚠ ${r.warning}`));
  }
  console.log('');
  console.log(chalk.cyan('Open in Obsidian: ') + chalk.gray(`Obsidian → "Open folder as vault" → ${vaultPath}`));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function writeIfMissing(filePath, content) {
  if (!existsSync(filePath)) writeFileSync(filePath, content, 'utf8');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function slug(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function fwSlug(fw) {
  return fw.replace(/[^a-zA-Z0-9]/g, '');
}

function mergeUnique(a, b) {
  return [...new Set([...(a || []), ...(b || [])])];
}

function currentPlatform() {
  return osPlatform();
}
