// @ts-check
/**
 * Profiler — scans a user's existing AI agent history and git repos to build
 * a personalized profile. Used to generate a custom brain vault instead of
 * a generic empty one.
 *
 * Privacy: reads ONLY file paths, dependency lists, git commit messages,
 * and memory/summary files. Never reads source code content.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, extname, resolve } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import fg from 'fast-glob';

const HOME = homedir();

/**
 * @typedef {Object} ProjectInfo
 * @property {string} name
 * @property {string} path
 * @property {string} template       - detected ai-brain template key
 * @property {string} label          - human-readable stack label
 * @property {string[]} signals      - detected dep signals
 * @property {string} lastActive     - ISO date string
 * @property {string} packageManager
 */

/**
 * @typedef {Object} UserProfile
 * @property {ProjectInfo[]} projects
 * @property {string[]} languages
 * @property {string[]} frameworks
 * @property {string[]} aiTools
 * @property {string[]} claudeTopics   - from Claude memory files
 * @property {string} detectedRole
 * @property {boolean} hasExistingBrain
 */

// ─── Entry point ────────────────────────────────────────────────────────────

/** @returns {Promise<UserProfile>} */
export async function buildUserProfile() {
  const [projects, claudeTopics, aiTools] = await Promise.all([
    scanGitRepos(),
    scanClaudeMemory(),
    detectAiTools(),
  ]);

  const languages = dedupe(projects.flatMap(p => signalsToLanguages(p.signals)));
  const frameworks = dedupe(projects.flatMap(p => signalsToFrameworks(p.signals)));
  const detectedRole = inferRole(languages, frameworks, projects);
  const hasExistingBrain = existsSync(join(HOME, 'AgentBrain', 'Home.md')) ||
                           existsSync(join(HOME, 'ClaudeBrain', 'Home.md'));

  return { projects, languages, frameworks, aiTools, claudeTopics, detectedRole, hasExistingBrain };
}

// ─── Git repo scanner ────────────────────────────────────────────────────────

const SEARCH_DIRS = [
  HOME,
  join(HOME, 'Desktop'),
  join(HOME, 'Documents'),
  join(HOME, 'Projects'),
  join(HOME, 'projects'),
  join(HOME, 'code'),
  join(HOME, 'Code'),
  join(HOME, 'src'),
  join(HOME, 'dev'),
  join(HOME, 'Dev'),
  join(HOME, 'repos'),
  join(HOME, 'Developer'),
  join(HOME, 'Development'),
  join(HOME, 'workspace'),
  join(HOME, 'Workspace'),
];

/** @returns {Promise<ProjectInfo[]>} */
async function scanGitRepos() {
  /** @type {Map<string, ProjectInfo>} */
  const found = new Map();

  for (const dir of SEARCH_DIRS) {
    if (!existsSync(dir)) continue;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const repoPath = join(dir, e.name);
        if (!existsSync(join(repoPath, '.git'))) continue;
        if (found.has(repoPath)) continue;

        const info = await analyzeRepo(repoPath);
        if (info) found.set(repoPath, info);
      }
    } catch {
      // permission denied or other OS error — skip silently
    }
  }

  // Sort by most recently active
  return Array.from(found.values())
    .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    .slice(0, 12); // max 12 projects to keep vault manageable
}

/** @param {string} repoPath @returns {Promise<ProjectInfo|null>} */
async function analyzeRepo(repoPath) {
  // Get last commit date
  let lastActive = '';
  try {
    lastActive = execSync(`git -C "${repoPath}" log -1 --format=%ci 2>/dev/null`, {
      timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString().trim().slice(0, 10);
  } catch {
    return null; // no commits or git error
  }

  if (!lastActive) return null;

  // Skip if inactive for 6+ months
  const monthsAgo = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo > 6) return null;

  const name = basename(repoPath);
  const { template, label, signals } = detectStack(repoPath);
  const packageManager = detectPm(repoPath);

  return { name, path: repoPath, template, label, signals, lastActive, packageManager };
}

// ─── Stack detection (same logic as scanner.js but standalone) ───────────────

/** @param {string} dir @returns {{ template: string, label: string, signals: string[] }} */
function detectStack(dir) {
  const signals = [];

  const pkg = tryJson(join(dir, 'package.json'));
  if (pkg) {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    if (deps.includes('next')) signals.push('next', 'react', 'typescript');
    else if (deps.includes('react')) signals.push('react');
    if (deps.includes('vite') || deps.includes('@vitejs/plugin-react')) signals.push('vite');
    if (deps.includes('typescript') || deps.includes('ts-node')) signals.push('typescript');
    if (deps.includes('fastify') || deps.includes('express') || deps.includes('hono')) signals.push('node-server');
    if (pkg.bin && !deps.includes('react') && !deps.includes('next')) signals.push('node-cli');
    if (deps.includes('tailwindcss')) signals.push('tailwind');
    if (deps.includes('prisma') || deps.includes('@prisma/client')) signals.push('prisma');
    if (deps.includes('drizzle-orm')) signals.push('drizzle');
    if (deps.includes('@trpc/server')) signals.push('trpc');
    if (deps.includes('next-auth') || deps.includes('@auth/core')) signals.push('auth');
    if (deps.includes('@tanstack/react-query')) signals.push('react-query');
    if (deps.includes('zustand') || deps.includes('jotai')) signals.push('state-mgmt');
  }

  const pyproject = tryText(join(dir, 'pyproject.toml')) || tryText(join(dir, 'requirements.txt')) || '';
  if (pyproject) {
    signals.push('python');
    if (/fastapi/i.test(pyproject)) signals.push('fastapi');
    else if (/django/i.test(pyproject)) signals.push('django');
    else if (/flask/i.test(pyproject)) signals.push('flask');
    if (/pandas|numpy|jupyter|torch|tensorflow|sklearn|polars/i.test(pyproject)) signals.push('data-science');
    if (/sqlalchemy/i.test(pyproject)) signals.push('sqlalchemy');
    if (/alembic/i.test(pyproject)) signals.push('alembic');
  }

  if (existsSync(join(dir, 'go.mod'))) signals.push('go');
  if (existsSync(join(dir, 'Cargo.toml'))) signals.push('rust');
  if (existsSync(join(dir, 'tsconfig.json')) && !signals.includes('next') && !signals.includes('react')) {
    signals.push('typescript-lib');
  }

  return pickTemplate(signals);
}

/** @param {string[]} signals @returns {{ template: string, label: string, signals: string[] }} */
function pickTemplate(signals) {
  if (signals.includes('next')) return { template: 'nextjs', label: 'Next.js', signals };
  if (signals.includes('react') && signals.includes('vite')) return { template: 'react-vite', label: 'React + Vite', signals };
  if (signals.includes('react')) return { template: 'react-vite', label: 'React', signals };
  if (signals.includes('fastapi')) return { template: 'python-fastapi', label: 'Python FastAPI', signals };
  if (signals.includes('data-science')) return { template: 'python-data', label: 'Python / Data', signals };
  if (signals.includes('python')) return { template: 'python-fastapi', label: 'Python', signals };
  if (signals.includes('node-cli')) return { template: 'node-cli', label: 'Node CLI', signals };
  if (signals.includes('go')) return { template: 'go', label: 'Go', signals };
  if (signals.includes('rust')) return { template: 'generic', label: 'Rust', signals };
  if (signals.includes('typescript-lib') || signals.includes('typescript')) return { template: 'typescript-lib', label: 'TypeScript', signals };
  if (signals.includes('node-server')) return { template: 'node-cli', label: 'Node.js', signals };
  return { template: 'generic', label: 'Project', signals };
}

// ─── Claude memory scanner ────────────────────────────────────────────────────

/** @returns {Promise<string[]>} */
async function scanClaudeMemory() {
  const topics = [];
  const memoryBase = join(HOME, '.claude', 'projects');
  if (!existsSync(memoryBase)) return topics;

  try {
    const projectDirs = readdirSync(memoryBase, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => join(memoryBase, e.name));

    for (const pDir of projectDirs) {
      // Read MEMORY.md index files (summaries, not raw conversations)
      const memFile = join(pDir, 'memory', 'MEMORY.md');
      if (existsSync(memFile)) {
        const text = readFileSync(memFile, 'utf8');
        // Extract topic names from markdown links like [Topic Name](file.md)
        const matches = text.matchAll(/\[([^\]]+)\]\([^)]+\.md\)/g);
        for (const m of matches) {
          const topic = m[1].replace(/\s*\(.*\)/, '').trim();
          if (topic && topic.length < 60) topics.push(topic);
        }
      }
    }
  } catch {
    // permission or parse errors — skip
  }

  return dedupe(topics).slice(0, 20);
}

// ─── AI tool detector ─────────────────────────────────────────────────────────

/** @returns {Promise<string[]>} */
async function detectAiTools() {
  const tools = [];

  if (existsSync(join(HOME, '.claude'))) tools.push('Claude Code');
  if (existsSync(join(HOME, '.gemini'))) tools.push('Gemini CLI');

  // Cursor
  const cursorPaths = [
    join(HOME, '.cursor'),
    join(HOME, 'AppData', 'Roaming', 'Cursor'),
    join(HOME, 'Library', 'Application Support', 'Cursor'),
    join(HOME, '.config', 'Cursor'),
  ];
  if (cursorPaths.some(p => existsSync(p))) tools.push('Cursor');

  // Windsurf
  const windsurfPaths = [
    join(HOME, '.codeium'),
    join(HOME, 'AppData', 'Roaming', 'Windsurf'),
    join(HOME, 'Library', 'Application Support', 'Windsurf'),
  ];
  if (windsurfPaths.some(p => existsSync(p))) tools.push('Windsurf');

  // VS Code (Copilot/Cline/Continue)
  const vscodePaths = [
    join(HOME, '.vscode'),
    join(HOME, 'AppData', 'Roaming', 'Code'),
    join(HOME, 'Library', 'Application Support', 'Code'),
    join(HOME, '.config', 'Code'),
  ];
  if (vscodePaths.some(p => existsSync(p))) tools.push('VS Code');

  // Aider
  try {
    execSync('aider --version', { stdio: 'pipe', timeout: 2000 });
    tools.push('Aider');
  } catch { /* not installed */ }

  // Continue extension marker
  if (existsSync(join(HOME, '.continue'))) tools.push('Continue');

  return tools;
}

// ─── Profile synthesis helpers ────────────────────────────────────────────────

/** @param {string[]} signals @returns {string[]} */
function signalsToLanguages(signals) {
  const langs = [];
  if (signals.includes('typescript') || signals.includes('next') || signals.includes('react') ||
      signals.includes('typescript-lib') || signals.includes('node-cli') || signals.includes('node-server')) {
    langs.push('TypeScript');
  }
  if (signals.includes('python') || signals.includes('fastapi') || signals.includes('django') ||
      signals.includes('flask') || signals.includes('data-science')) {
    langs.push('Python');
  }
  if (signals.includes('go')) langs.push('Go');
  if (signals.includes('rust')) langs.push('Rust');
  if (signals.some(s => ['next', 'react', 'vite', 'node-cli', 'node-server'].includes(s)) &&
      !signals.includes('typescript')) {
    langs.push('JavaScript');
  }
  return langs;
}

/** @param {string[]} signals @returns {string[]} */
function signalsToFrameworks(signals) {
  const map = {
    next: 'Next.js', react: 'React', vite: 'Vite', tailwind: 'Tailwind CSS',
    prisma: 'Prisma', drizzle: 'Drizzle ORM', trpc: 'tRPC', auth: 'NextAuth',
    'react-query': 'TanStack Query', 'state-mgmt': 'Zustand',
    fastapi: 'FastAPI', django: 'Django', flask: 'Flask',
    sqlalchemy: 'SQLAlchemy', alembic: 'Alembic', 'data-science': 'pandas/numpy',
    'node-server': 'Node.js (server)', 'node-cli': 'Node.js (CLI)',
    'typescript-lib': 'TypeScript', go: 'Go', rust: 'Rust',
  };
  return signals.filter(s => map[s]).map(s => map[s]);
}

/** @param {string[]} langs @param {string[]} frameworks @param {ProjectInfo[]} projects @returns {string} */
function inferRole(langs, frameworks, projects) {
  const isFullstack = langs.includes('TypeScript') && (langs.includes('Python') || frameworks.some(f => ['FastAPI', 'Django'].includes(f)));
  const isFrontend = frameworks.some(f => ['Next.js', 'React'].includes(f)) && !langs.includes('Python') && !langs.includes('Go');
  const isBackend = langs.includes('Python') || langs.includes('Go') || langs.includes('Rust');
  const isDataSci = frameworks.some(f => f.includes('pandas') || f === 'FastAPI') && langs.includes('Python');
  const isCLI = projects.some(p => p.template === 'node-cli');

  if (isDataSci) return 'Data Scientist / ML Engineer';
  if (isFullstack) return 'Full-Stack Developer';
  if (isFrontend) return 'Frontend Developer';
  if (isBackend) return 'Backend Developer';
  if (isCLI) return 'Developer / CLI Tooling';
  if (langs.includes('Go')) return 'Go Developer';
  if (langs.includes('Rust')) return 'Systems Developer';
  return 'Software Developer';
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** @param {string} p @returns {any|null} */
function tryJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

/** @param {string} p @returns {string|null} */
function tryText(p) {
  try { return existsSync(p) ? readFileSync(p, 'utf8') : null; } catch { return null; }
}

/** @param {string} dir @returns {string} */
function detectPm(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  return 'npm';
}

/** @param {string[]} arr @returns {string[]} */
function dedupe(arr) {
  return [...new Set(arr)];
}

// ─── Age helper (for display) ────────────────────────────────────────────────

/** @param {string} isoDate @returns {string} */
export function relativeAge(isoDate) {
  const days = Math.round((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
