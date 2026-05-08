// @ts-check
import { existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { input, confirm, select } from '@inquirer/prompts';
import { scan } from './scanner.js';
import { buildClaudeMd } from './generator.js';
import {
  defaultBrainPath,
  createVaultStructure,
  registerInObsidian,
  todayStr,
  buildHome,
} from './brain.js';
import {
  wireGlobalClaude,
  generateGeminiMd,
  generateContinueMd,
  generateAllProjectConfigs,
} from './wirer.js';
import { buildUserProfile } from './profiler.js';
import { runOnboarding, shouldRunOnboarding } from './onboarding.js';
import {
  detectWireableAgents,
  planStrategy,
  chooseStrategy,
  describePlan,
} from './brain-strategies.js';

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
  } catch {
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

  // ─── Strategy decision (multi-agent) ─────────────────────────────────
  // When 2+ agents are detected we ask whether to share one vault or fork
  // per-agent. Single-agent installs skip the prompt entirely (combined).
  const detected = detectWireableAgents();
  let strategyMode = (opts.mode || '').toLowerCase();
  let onlyId = (opts.only || '').toLowerCase();
  if (setupBrain && detected.length >= 2 && !autoYes && !strategyMode) {
    const choice = await chooseStrategy(detected);
    strategyMode = choice.mode;
    if (choice.onlyId) onlyId = choice.onlyId;
  }
  if (!strategyMode) strategyMode = 'combined';
  if (strategyMode === 'single' && !onlyId) {
    // --mode single without --only is invalid in non-interactive mode;
    // fall back to combined to avoid blocking with --yes.
    if (autoYes) {
      console.log(chalk.yellow('  --mode single needs --only <agent>; falling back to combined'));
      strategyMode = 'combined';
    } else {
      const choice = await chooseStrategy(detected);
      strategyMode = choice.mode;
      onlyId = choice.onlyId || '';
    }
  }

  /** @type {import('./brain-strategies.js').StrategyPlan | null} */
  let plan = null;
  if (setupBrain && detected.length > 0) {
    plan = planStrategy({
      mode: /** @type {any} */ (strategyMode),
      detected,
      combinedVaultPath: brainPath,
      onlyId,
    });
    if (plan.mode !== 'combined' || detected.length > 1) {
      console.log(
        chalk.gray(
          describePlan(plan)
            .split('\n')
            .map((l) => '  ' + l)
            .join('\n'),
        ),
      );
    }
  }

  if (setupBrain && !isDryRun) {
    // Create each unique vault path once
    const vaultsToCreate = plan ? plan.vaultPaths : [brainPath];
    for (const vp of vaultsToCreate) {
      createVaultStructure(vp, profile ?? undefined, answers ?? undefined);
      if (profile?.projects.length) {
        console.log(chalk.green('✓ Brain vault: ' + vp));
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
        console.log(chalk.green('✓ Brain vault: ' + vp));
      }
    }

    // Wire each agent in the plan to its specific vault
    if (plan && plan.entries.length) {
      for (const { agent, vaultPath } of plan.entries) {
        const r = agent.wire(vaultPath);
        const tag = r.action === 'skipped' ? chalk.gray : chalk.green;
        const verb =
          r.action === 'created'
            ? 'created'
            : r.action === 'updated'
              ? 'block updated'
              : r.action === 'appended'
                ? 'block appended'
                : 'already wired';
        console.log(tag(`✓ ${agent.label} → ${r.path} (${verb})`));
      }
    } else {
      // No agents detected — still wire Claude globally for first-run users
      // so installing Claude later picks up the brain without a re-run.
      const r = wireGlobalClaude(brainPath);
      if (r.action === 'created')
        console.log(chalk.green('✓ ~/.claude/CLAUDE.md → wired to brain'));
      else if (r.action === 'appended')
        console.log(chalk.green('✓ Global CLAUDE.md wired to brain'));
      else console.log(chalk.gray('  ~/.claude/CLAUDE.md already wired'));
    }

    const obsResult = registerInObsidian(plan ? plan.vaultPaths[0] : brainPath);
    if (obsResult.registered) console.log(chalk.green('✓ Registered in Obsidian'));
    else
      console.log(
        chalk.yellow(
          '  ⚠ Open Obsidian → "Open folder as vault" → ' + (plan ? plan.vaultPaths[0] : brainPath),
        ),
      );
  } else if (setupBrain && isDryRun) {
    const list = plan ? plan.vaultPaths : [brainPath];
    for (const vp of list)
      console.log(chalk.yellow('[dry-run] Would create personalized brain vault at: ' + vp));
    if (plan && plan.entries.length)
      for (const { agent, vaultPath } of plan.entries)
        console.log(chalk.yellow(`[dry-run] Would wire ${agent.label} → ${vaultPath}`));
  }

  // Step 6: Project agent configs — also gated on setupBrain since the agent
  // configs embed the brain path and instructions to read the vault.
  let doAgents = opts.agents !== false && setupBrain;
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

  // Walk the full structure builder. createVaultStructure() uses writeIfMissing
  // for every file, so this is safe — only NEW projects/skills/dirs get added.
  // Pre-existing files (your edited Me.md, Workflow.md, project notes) are
  // left untouched.
  try {
    createVaultStructure(brainPath, profile, undefined);
  } catch (err) {
    console.log(chalk.yellow('  Could not refresh vault structure: ' + (err?.message || err)));
  }

  // Home.md is the index — always refresh it so the project list / AI tools /
  // languages reflect today's state. (This was the missing piece — the prior
  // update only appended a daily-note line.)
  const homePath = join(brainPath, 'Home.md');
  try {
    writeFileSync(homePath, buildHome(profile, undefined, todayStr()), 'utf8');
  } catch {
    /* ignore */
  }

  // Append a single update entry to today's daily note.
  const today = todayStr();
  const dailyPath = join(brainPath, 'Daily', today + '.md');
  const skillCount = (profile.frameworks || []).length;
  const entry =
    '\n### ai-brain update\n\nRescanned: ' +
    profile.projects.length +
    ' projects · ' +
    skillCount +
    ' frameworks. AI tools: ' +
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
    /* ignore */
  }

  console.log(
    chalk.green('  Brain vault updated — ') +
      chalk.gray(profile.projects.length + ' projects · ' + skillCount + ' skills'),
  );
  console.log('');
}
