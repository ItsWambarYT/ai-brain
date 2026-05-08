// @ts-check
import { existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { input, confirm, select } from '@inquirer/prompts';
import { scan } from './scanner.js';
import { buildClaudeMd } from './generator.js';
import { defaultBrainPath, createVaultStructure, registerInObsidian } from './brain.js';
import {
  wireGlobalClaude,
  generateGeminiMd,
  generateContinueMd,
  generateAllProjectConfigs,
} from './wirer.js';
import { buildUserProfile } from './profiler.js';
import { runOnboarding, shouldRunOnboarding } from './onboarding.js';

export async function runSetup(opts = {}) {
  const projectDir = resolve(typeof opts.project === 'string' ? opts.project : process.cwd());
  const isDryRun = opts.dryRun ?? false;
  const autoYes = opts.yes ?? false;

  console.log(chalk.bold('Project: ') + chalk.gray(projectDir));
  if (autoYes) console.log(chalk.gray('Mode: non-interactive (--yes)'));
  console.log('');

  // Step 1: Profile scan
  const profileSpinner = ora('Scanning your AI history and git repos…').start();
  let profile;
  try {
    profile = await buildUserProfile();
    profileSpinner.succeed(
      'Found ' +
        chalk.green(profile.projects.length) +
        ' projects · ' +
        (profile.aiTools.length
          ? chalk.green(profile.aiTools.join(', '))
          : chalk.gray('no AI tools detected')),
    );
  } catch (err) {
    profileSpinner.warn('Could not scan profile — using defaults');
    profile = {
      projects: [],
      languages: [],
      frameworks: [],
      aiTools: [],
      claudeTopics: [],
      detectedRole: '',
      hasExistingBrain: false,
    };
  }

  // Onboarding if profile is sparse and not --yes
  let answers = null;
  if (!autoYes && shouldRunOnboarding(profile)) {
    console.log('');
    console.log(chalk.yellow('  Auto-detection found limited data.'));
    const doInterview = await confirm({
      message: 'Run a quick 5-question setup to personalize your brain vault?',
      default: true,
    });
    if (doInterview) answers = await runOnboarding(profile);
  }

  // Step 2: Detect project type
  const scanSpinner = ora('Scanning project…').start();
  const scanResult = await scan(projectDir);
  scanSpinner.succeed('Detected: ' + chalk.green(scanResult.label));

  const templates = [
    'nextjs',
    'react-vite',
    'python-fastapi',
    'python-data',
    'node-cli',
    'typescript-lib',
    'go',
    'generic',
  ];
  if (!autoYes) {
    const choice = await select({
      message: 'Template to use:',
      default: scanResult.template,
      choices: templates.map((t) => ({
        value: t,
        name: t === scanResult.template ? t + ' (detected)' : t,
      })),
    });
    scanResult.template = choice;
  }

  // Step 3: Generate CLAUDE.md
  const claudeMdPath = join(projectDir, 'CLAUDE.md');
  const claudeExists = existsSync(claudeMdPath);
  let writeClaudeMd = !claudeExists || !!opts.force;

  if (claudeExists && !opts.force && !autoYes) {
    writeClaudeMd = await confirm({
      message: 'CLAUDE.md already exists — overwrite?',
      default: false,
    });
  }

  const claudeMdContent = buildClaudeMd(projectDir, scanResult);

  if (writeClaudeMd) {
    if (isDryRun) {
      console.log('\n' + chalk.yellow('--- CLAUDE.md preview ---'));
      console.log(claudeMdContent.slice(0, 900));
      console.log(chalk.yellow('--- end preview ---\n'));
    } else {
      writeFileSync(claudeMdPath, claudeMdContent, 'utf8');
      console.log(chalk.green('✓ CLAUDE.md'));
    }
  } else {
    console.log(chalk.gray('  CLAUDE.md (skipped — already exists)'));
  }

  // Step 4: Brain vault
  let brainPath = resolve(
    typeof opts.brain === 'string' && opts.brain ? opts.brain : defaultBrainPath(),
  );
  let setupBrain = opts.brain !== false;

  if (!autoYes && setupBrain && opts.brain === undefined) {
    setupBrain = await confirm({
      message: 'Create personalized brain vault at ' + brainPath + '?',
      default: true,
    });
    if (setupBrain) {
      const custom = await input({ message: 'Brain vault path:', default: brainPath });
      brainPath = resolve(custom);
    }
  }

  if (setupBrain && !isDryRun) {
    createVaultStructure(brainPath, profile ?? undefined, answers ?? undefined);
    if (profile?.projects.length) {
      console.log(chalk.green('✓ Brain vault: ' + brainPath));
      console.log(
        chalk.gray(
          '  Personalized with ' +
            profile.projects.length +
            ' projects, ' +
            profile.frameworks.length +
            ' skill notes',
        ),
      );
    } else {
      console.log(chalk.green('✓ Brain vault: ' + brainPath));
    }

    const wireResult = wireGlobalClaude(brainPath);
    if (wireResult.action === 'created')
      console.log(chalk.green('✓ ~/.claude/CLAUDE.md → wired to brain'));
    else if (wireResult.action === 'appended')
      console.log(chalk.green('✓ Global CLAUDE.md wired to brain'));
    else console.log(chalk.gray('  ~/.claude/CLAUDE.md already wired'));

    const obsResult = registerInObsidian(brainPath);
    if (obsResult.registered) console.log(chalk.green('✓ Registered in Obsidian'));
    else console.log(chalk.yellow('  ⚠ Open Obsidian → "Open folder as vault" → ' + brainPath));
  } else if (setupBrain && isDryRun) {
    console.log(chalk.yellow('[dry-run] Would create personalized brain vault at: ' + brainPath));
  }

  // Step 5: Gemini + Continue
  let doGemini = opts.gemini !== false;
  if (!autoYes && doGemini && opts.gemini === undefined) {
    doGemini = await confirm({
      message: 'Wire ~/.gemini/GEMINI.md for Gemini CLI?',
      default: true,
    });
  }
  if (doGemini && !isDryRun) {
    generateGeminiMd(brainPath);
    console.log(chalk.green('✓ ~/.gemini/GEMINI.md'));
  }
  if (!isDryRun && setupBrain) generateContinueMd(brainPath);

  // Step 6: Project agent configs
  let doAgents = opts.agents !== false;
  if (!autoYes && doAgents && opts.agents === undefined) {
    doAgents = await confirm({
      message:
        'Generate all agent configs? (AGENTS.md, .cursorrules, .windsurfrules, copilot-instructions, .clinerules)',
      default: true,
    });
  }

  if (doAgents && !isDryRun) {
    const results = generateAllProjectConfigs(projectDir, claudeMdContent, brainPath);
    for (const r of results) {
      if (r.created) console.log(chalk.green('✓ ' + r.file));
      else console.log(chalk.gray('  ' + r.file + ' (already exists)'));
    }
  } else if (doAgents && isDryRun) {
    console.log(
      chalk.yellow(
        '[dry-run] Would write: AGENTS.md, .cursorrules, .windsurfrules, .github/copilot-instructions.md, .clinerules',
      ),
    );
  }

  // Done
  console.log('');
  console.log(chalk.bold.green('All done!'));
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  if (setupBrain) {
    console.log(chalk.gray('  1. Open Obsidian → "Open folder as vault" → ' + brainPath));
    console.log(chalk.gray('  2. Edit ' + brainPath + '/Me.md — tell your agents who you are'));
  }
  console.log(
    chalk.gray('  3. Start a new AI session — all agents now read your brain automatically'),
  );
  console.log('');
}

export async function runUpdate(opts = {}) {
  const { readFileSync } = await import('fs');
  const brainPath = resolve(
    typeof opts.brain === 'string' && opts.brain ? opts.brain : defaultBrainPath(),
  );

  if (!existsSync(join(brainPath, 'Home.md'))) {
    console.log(chalk.red('No brain vault found at ' + brainPath));
    console.log(chalk.gray('Run `ai-brain` to create one first.'));
    return;
  }

  console.log('');
  const sp = ora('Rescanning your repos and AI history...').start();
  let profile;
  try {
    profile = await buildUserProfile();
    sp.succeed('Found ' + chalk.green(String(profile.projects.length)) + ' projects');
  } catch {
    sp.fail('Scan failed');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyPath = join(brainPath, 'Daily', today + '.md');
  const entry =
    '\n### ai-brain update\n\nRescanned: ' +
    profile.projects.length +
    ' projects. AI tools: ' +
    (profile.aiTools.join(', ') || 'none') +
    '.\n';

  try {
    if (existsSync(dailyPath)) {
      writeFileSync(dailyPath, readFileSync(dailyPath, 'utf8') + entry, 'utf8');
    } else {
      writeFileSync(
        dailyPath,
        '# ' + today + '\n\n## Sessions\n' + entry + '\n## Topic Nodes\n',
        'utf8',
      );
    }
  } catch {
    /* ignore write errors */
  }

  console.log(chalk.green('  Brain vault updated'));
  console.log('');
}
