#!/usr/bin/env node
// @ts-check
import { program } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

import { runSetup, runUpdate } from '../src/setup.js';
import { runBrain } from '../src/brain.js';
import { runScan } from '../src/scanner.js';
import { runGenerate } from '../src/generator.js';
import { runDoctor } from '../src/doctor.js';
import { addAgent, loadAgents, removeAgent, REGISTRY_PATH } from '../src/agents-registry.js';

console.log(chalk.cyan.bold('\n  ai-brain') + chalk.gray(' v' + pkg.version) + '\n');

program
  .name('ai-brain')
  .description(
    'Set up every AI coding agent with a personalized context file and Obsidian brain vault — built from your real git history and AI usage',
  )
  .version(pkg.version);

program
  .command('init', { isDefault: true })
  .description(
    'Scan project + AI history, generate all agent configs, create personalized brain vault (default)',
  )
  .option('-p, --project <path>', 'Path to project (default: current directory)', process.cwd())
  .option('-b, --brain <path>', 'Brain vault path (default: ~/AgentBrain)', '')
  .option('--no-brain', 'Skip brain vault creation')
  .option('--no-gemini', 'Skip ~/.gemini/GEMINI.md')
  .option('--no-agents', 'Skip project-level agent config files')
  .option('--force', 'Overwrite existing CLAUDE.md without prompting')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('-y, --yes', 'Non-interactive: accept all defaults (ideal for AI-driven setup)')
  .option(
    '--mode <mode>',
    'When 2+ AI agents are detected, force a brain layout: ' +
      'combined (one shared vault, default) | ' +
      'individual (per-agent vault: ~/ClaudeBrain, ~/GeminiBrain, ~/ContinueBrain) | ' +
      'single (one vault, only one agent wired — pair with --only)',
  )
  .option('--only <agent>', 'With --mode single, the agent id to wire: claude | gemini | continue')
  .action(runSetup);

program
  .command('scan [path]')
  .description('Scan a project and show detected type + your AI profile')
  .action(async (path) => {
    await runScan(path || process.cwd());
  });

program
  .command('generate [path]')
  .description('Generate only CLAUDE.md (no brain, no agent configs)')
  .option('--force', 'Overwrite existing file')
  .option('--dry-run', 'Preview output without writing')
  .option(
    '--template <name>',
    'Force a template: nextjs | react-vite | python-fastapi | python-data | node-cli | typescript-lib | go | generic',
  )
  .action(async (path, opts) => {
    await runGenerate(path || process.cwd(), opts);
  });

program
  .command('brain')
  .description('Create or update the brain vault only')
  .option('-p, --path <path>', 'Vault path (default: ~/AgentBrain)', '')
  .option('--name <name>', 'Vault name shown in Obsidian', 'AgentBrain')
  .option('--register', 'Try to auto-register in Obsidian (only works when Obsidian is closed)')
  .action(async (opts) => {
    await runBrain(opts);
  });

program
  .command('update')
  .description('Rescan git repos and AI history, update the brain vault with new projects')
  .option('-b, --brain <path>', 'Brain vault path (default: ~/AgentBrain)', '')
  .action(async (opts) => {
    await runUpdate(opts);
  });

// ─── Diagnostics ───────────────────────────────────────────────────────────
program
  .command('doctor')
  .description('Diagnose brain vault + agent wiring health, suggest fixes for any problems')
  .option('-b, --brain <path>', 'Brain vault path (default: ~/AgentBrain)', '')
  .option('-p, --project <path>', 'Project to check (default: current directory)', process.cwd())
  .action((opts) => {
    const code = runDoctor({
      brainPath: opts.brain || undefined,
      projectDir: opts.project,
    });
    if (code !== 0) process.exitCode = code;
  });

// ─── Custom agent registry ─────────────────────────────────────────────────
//
// Lets users wire ANY AI tool that reads a markdown / config file, not just
// the built-in list. Stored at ~/.config/ai-brain/agents.json.

program
  .command('add-agent <name>')
  .description(
    'Register a custom AI agent so its config file gets generated alongside the built-ins. ' +
      'Example: ai-brain add-agent Roo --file .roorules',
  )
  .requiredOption(
    '-f, --file <path>',
    'Target file the agent reads — relative to project, or absolute for global wiring',
  )
  .option(
    '--format <mode>',
    'Content style: "markdown" (default, with H1) or "rules" (no leading heading)',
    'markdown',
  )
  .option('-n, --notes <text>', 'Optional description shown in `ai-brain list-agents`')
  .action((name, opts) => {
    const { action, agent } = addAgent({
      name,
      file: opts.file,
      format: opts.format === 'rules' ? 'rules' : 'markdown',
      notes: opts.notes,
    });
    const verb = action === 'added' ? chalk.green('added') : chalk.yellow('updated');
    console.log(`  ${verb} agent ${chalk.cyan(agent.name)} → ${agent.file}`);
    console.log(chalk.gray(`  registry: ${REGISTRY_PATH}`));
    console.log();
    console.log(chalk.gray('  Run `ai-brain` in a project to write this agent’s config file.'));
  });

program
  .command('list-agents')
  .alias('agents')
  .description('Show all custom agents registered with ai-brain')
  .action(() => {
    const list = loadAgents();
    if (list.length === 0) {
      console.log(chalk.gray('  No custom agents registered.'));
      console.log(chalk.gray('  Add one with: ai-brain add-agent <name> --file <path>'));
      return;
    }
    console.log(chalk.bold(`  ${list.length} custom agent${list.length === 1 ? '' : 's'}:\n`));
    for (const a of list) {
      console.log(`  ${chalk.cyan(a.name)}`);
      console.log(`    file:   ${a.file}`);
      console.log(`    format: ${a.format}`);
      if (a.notes) console.log(`    notes:  ${chalk.gray(a.notes)}`);
      console.log();
    }
    console.log(chalk.gray(`  registry: ${REGISTRY_PATH}`));
  });

program
  .command('remove-agent <name>')
  .alias('rm-agent')
  .description('Remove a previously-registered custom agent')
  .action((name) => {
    const removed = removeAgent(name);
    if (removed) {
      console.log(chalk.green(`  ✓ removed agent "${name}"`));
    } else {
      console.log(chalk.yellow(`  No agent named "${name}" found.`));
      console.log(chalk.gray('  Run `ai-brain list-agents` to see what is registered.'));
      process.exitCode = 1;
    }
  });

program.parse();
