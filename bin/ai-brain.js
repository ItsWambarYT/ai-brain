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

console.log(chalk.cyan.bold('\n  ai-brain') + chalk.gray(' v' + pkg.version) + '\n');

program
  .name('ai-brain')
  .description('Set up every AI coding agent with a personalized context file and Obsidian brain vault — built from your real git history and AI usage')
  .version(pkg.version);

program
  .command('init', { isDefault: true })
  .description('Scan project + AI history, generate all agent configs, create personalized brain vault (default)')
  .option('-p, --project <path>', 'Path to project (default: current directory)', process.cwd())
  .option('-b, --brain <path>', 'Brain vault path (default: ~/AgentBrain)', '')
  .option('--no-brain', 'Skip brain vault creation')
  .option('--no-gemini', 'Skip ~/.gemini/GEMINI.md')
  .option('--no-agents', 'Skip project-level agent config files')
  .option('--force', 'Overwrite existing CLAUDE.md without prompting')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('-y, --yes', 'Non-interactive: accept all defaults (ideal for AI-driven setup)')
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
  .option('--template <name>', 'Force a template: nextjs | react-vite | python-fastapi | python-data | node-cli | typescript-lib | go | generic')
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

program.parse();
