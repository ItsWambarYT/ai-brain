// @ts-check
/**
 * `ai-brain doctor` — diagnostic health check.
 *
 * Walks the user's machine to answer four questions:
 *   1. Does the brain vault exist and is it usable?
 *   2. Which AI agents are installed, and are they wired to the vault?
 *   3. Are project-level config files present in the cwd?
 *   4. Are there any obvious red flags (corrupt JSON, broken symlinks, etc.)?
 *
 * Outputs a punch-list with green check / yellow warn / red error markers
 * plus an actionable next-step for each issue.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

import { loadAgents, REGISTRY_PATH, resolveAgentPath } from './agents-registry.js';
import { defaultBrainPath } from './brain.js';

/**
 * @typedef {Object} Check
 * @property {'ok'|'warn'|'error'} level
 * @property {string} title
 * @property {string} [detail]
 * @property {string} [fix]
 */

const HOME = homedir();

/**
 * Built-in agents we know how to detect by their on-disk footprint.
 * Each entry: detection paths (existsSync any of them = installed), the
 * file we expect to be wired, and a short fix hint.
 */
const BUILT_IN_AGENTS = [
  {
    name: 'Claude Code',
    detect: [join(HOME, '.claude'), join(HOME, '.config', 'claude')],
    wireFile: join(HOME, '.claude', 'CLAUDE.md'),
    fix: 'Run `npx ai-brain` to wire the brain vault into Claude Code.',
  },
  {
    name: 'Gemini CLI',
    detect: [join(HOME, '.gemini')],
    wireFile: join(HOME, '.gemini', 'GEMINI.md'),
    fix: 'Run `npx ai-brain` to wire the brain vault into Gemini CLI.',
  },
  {
    name: 'Continue',
    detect: [join(HOME, '.continue')],
    wireFile: join(HOME, '.continue', 'config.md'),
    fix: 'Run `npx ai-brain` to wire the brain vault into Continue.',
  },
  {
    name: 'Codex CLI',
    detect: [join(HOME, '.codex'), join(HOME, '.openai-codex')],
    wireFile: '', // codex reads project AGENTS.md, no global file
    fix: 'Codex reads AGENTS.md from each project — run `npx ai-brain` in each repo.',
  },
];

/** Project-level config files we generate */
const PROJECT_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  '.cursorrules',
  '.windsurfrules',
  '.github/copilot-instructions.md',
  '.clinerules',
  '.aider.conf.yml',
];

/**
 * Run all checks against the system and return the structured report.
 * @param {object} opts
 * @param {string} [opts.brainPath]
 * @param {string} [opts.projectDir]
 * @returns {Check[]}
 */
export function diagnose(opts = {}) {
  const brainPath = opts.brainPath || defaultBrainPath();
  const projectDir = opts.projectDir || process.cwd();
  /** @type {Check[]} */
  const checks = [];

  // ─── Brain vault ────────────────────────────────────────────────────────
  if (!existsSync(brainPath)) {
    checks.push({
      level: 'error',
      title: `Brain vault missing at ${brainPath}`,
      fix: `Run \`npx ai-brain brain --path ${brainPath}\` to create it.`,
    });
  } else {
    let stat;
    try {
      stat = statSync(brainPath);
    } catch (e) {
      checks.push({
        level: 'error',
        title: `Cannot stat brain vault: ${e.message}`,
        fix: 'Check filesystem permissions or recreate with `npx ai-brain brain`.',
      });
    }
    if (stat && !stat.isDirectory()) {
      checks.push({
        level: 'error',
        title: `Brain vault path is not a directory: ${brainPath}`,
        fix: 'Move it aside and run `npx ai-brain brain` to recreate.',
      });
    } else if (stat) {
      const home = join(brainPath, 'Home.md');
      if (!existsSync(home)) {
        checks.push({
          level: 'warn',
          title: `Brain vault exists but Home.md is missing`,
          detail: brainPath,
          fix: 'Run `npx ai-brain brain` to regenerate the index.',
        });
      } else {
        checks.push({
          level: 'ok',
          title: `Brain vault healthy`,
          detail: brainPath,
        });
      }
    }
  }

  // ─── Built-in agents ────────────────────────────────────────────────────
  for (const agent of BUILT_IN_AGENTS) {
    const installed = agent.detect.some((p) => existsSync(p));
    if (!installed) continue; // skip ones the user doesn't have
    if (!agent.wireFile) {
      checks.push({
        level: 'ok',
        title: `${agent.name} detected (project-level wiring)`,
      });
      continue;
    }
    if (!existsSync(agent.wireFile)) {
      checks.push({
        level: 'warn',
        title: `${agent.name} installed but not wired`,
        detail: agent.wireFile,
        fix: agent.fix,
      });
    } else {
      const body = safeRead(agent.wireFile);
      if (body.includes('ai-brain') || body.includes('Brain Vault')) {
        checks.push({
          level: 'ok',
          title: `${agent.name} wired to brain vault`,
        });
      } else {
        checks.push({
          level: 'warn',
          title: `${agent.name} config exists but doesn't reference the brain vault`,
          detail: agent.wireFile,
          fix: agent.fix,
        });
      }
    }
  }

  // ─── Custom agent registry ──────────────────────────────────────────────
  const customAgents = loadAgents();
  if (customAgents.length === 0) {
    checks.push({
      level: 'ok',
      title: `Custom agents: none registered`,
      detail: `Use \`ai-brain add-agent\` to wire any other tool.`,
    });
  } else {
    for (const a of customAgents) {
      const { path: target, scope } = resolveAgentPath(a, projectDir);
      if (existsSync(target)) {
        checks.push({
          level: 'ok',
          title: `Custom agent "${a.name}" wired (${scope})`,
          detail: target,
        });
      } else {
        checks.push({
          level: 'warn',
          title: `Custom agent "${a.name}" registered but file missing`,
          detail: target,
          fix:
            scope === 'project'
              ? `Run \`npx ai-brain\` in the project to write ${a.file}.`
              : `Run \`npx ai-brain\` to write ${a.file}.`,
        });
      }
    }
  }

  // ─── Project-level files (cwd) ──────────────────────────────────────────
  let projectAny = false;
  for (const f of PROJECT_FILES) {
    if (existsSync(join(projectDir, f))) {
      projectAny = true;
      break;
    }
  }
  if (projectAny) {
    checks.push({
      level: 'ok',
      title: `Current project (${projectDir}) has agent config files`,
    });
  } else {
    checks.push({
      level: 'warn',
      title: `Current project has no agent config files`,
      detail: projectDir,
      fix: 'Run `npx ai-brain` here to generate CLAUDE.md, AGENTS.md, .cursorrules, etc.',
    });
  }

  // ─── Registry sanity ────────────────────────────────────────────────────
  if (existsSync(REGISTRY_PATH)) {
    try {
      JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    } catch (e) {
      checks.push({
        level: 'error',
        title: `Custom agent registry has invalid JSON`,
        detail: REGISTRY_PATH,
        fix: `Edit or delete ${REGISTRY_PATH} and re-add your agents with \`ai-brain add-agent\`.`,
      });
    }
  }

  return checks;
}

/** @param {string} p */
function safeRead(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Pretty-print the doctor report. Returns an exit code (0 if no errors).
 * @param {object} opts forwarded to diagnose()
 * @returns {number}
 */
export function runDoctor(opts = {}) {
  const checks = diagnose(opts);
  const counts = { ok: 0, warn: 0, error: 0 };
  console.log(chalk.bold('  ai-brain — diagnostic report\n'));
  for (const c of checks) {
    counts[c.level]++;
    const mark =
      c.level === 'ok' ? chalk.green('✓') : c.level === 'warn' ? chalk.yellow('⚠') : chalk.red('✗');
    console.log(`  ${mark}  ${c.title}`);
    if (c.detail) console.log(`     ${chalk.gray(c.detail)}`);
    if (c.fix && c.level !== 'ok') console.log(`     ${chalk.cyan('→')} ${c.fix}`);
  }
  console.log();
  const summary = [];
  if (counts.ok) summary.push(chalk.green(`${counts.ok} ok`));
  if (counts.warn) summary.push(chalk.yellow(`${counts.warn} warning`));
  if (counts.error) summary.push(chalk.red(`${counts.error} error`));
  console.log('  ' + summary.join(' · '));
  console.log();
  return counts.error > 0 ? 1 : 0;
}
