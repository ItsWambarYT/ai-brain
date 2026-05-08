// @ts-check
/**
 * Brain-vault strategies for multi-agent setups.
 *
 * When more than one wireable AI agent is installed, the user can choose:
 *
 *   - combined     ONE shared vault that every detected agent reads
 *                  (default — original behavior; all agents share memory)
 *   - individual   SEPARATE vault per agent at ~/<Agent>Brain
 *                  (e.g., ~/ClaudeBrain, ~/GeminiBrain — agents drift apart
 *                  but no cross-bleed of conversations / topics)
 *   - single       ONE vault wired to ONLY ONE agent (all others stay
 *                  un-wired, even if installed)
 *
 * `detectWireableAgents()` finds which agents have a global config dir on
 * disk. `planStrategy()` turns a detection result + user choice into the
 * concrete list of (agent, vaultPath, wireFn) tuples the setup loop will
 * execute. `chooseStrategy()` is the interactive prompt. Together they
 * keep the setup flow readable and let tests drive the planning logic
 * without prompts.
 */

import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { wireGlobalClaude, generateGeminiMd, generateContinueMd } from './wirer.js';

const HOME = homedir();

/**
 * @typedef {Object} WireableAgent
 * @property {string} id          - stable lowercase id
 * @property {string} label       - human label
 * @property {string[]} detectDirs - any of these existing → installed
 * @property {string} brainName   - path stub for "individual" mode
 *                                  (e.g. "ClaudeBrain" → ~/ClaudeBrain)
 * @property {(vaultPath: string) => any} wire - global wiring fn from wirer.js
 */

/** @type {WireableAgent[]} */
export const WIREABLE_AGENTS = [
  {
    id: 'claude',
    label: 'Claude Code',
    detectDirs: [join(HOME, '.claude'), join(HOME, '.config', 'claude')],
    brainName: 'ClaudeBrain',
    wire: wireGlobalClaude,
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    detectDirs: [join(HOME, '.gemini')],
    brainName: 'GeminiBrain',
    wire: generateGeminiMd,
  },
  {
    id: 'continue',
    label: 'Continue',
    detectDirs: [join(HOME, '.continue')],
    brainName: 'ContinueBrain',
    wire: generateContinueMd,
  },
];

/** @returns {WireableAgent[]} */
export function detectWireableAgents() {
  return WIREABLE_AGENTS.filter((a) => a.detectDirs.some((d) => existsSync(d)));
}

/**
 * @typedef {'combined' | 'individual' | 'single'} StrategyMode
 *
 * @typedef {Object} PlanEntry
 * @property {WireableAgent} agent
 * @property {string} vaultPath
 *
 * @typedef {Object} StrategyPlan
 * @property {StrategyMode} mode
 * @property {PlanEntry[]} entries
 * @property {string[]} vaultPaths   - unique vaults to create (de-duped)
 */

/**
 * Translate a chosen mode + detected agents into a concrete plan.
 *
 * @param {object} args
 * @param {StrategyMode} args.mode
 * @param {WireableAgent[]} args.detected
 * @param {string} args.combinedVaultPath   - the vault path for "combined"/"single"
 * @param {string} [args.onlyId]            - required when mode === 'single'
 * @returns {StrategyPlan}
 */
export function planStrategy({ mode, detected, combinedVaultPath, onlyId }) {
  if (mode === 'individual') {
    const entries = detected.map((agent) => ({
      agent,
      vaultPath: join(HOME, agent.brainName),
    }));
    return {
      mode,
      entries,
      vaultPaths: [...new Set(entries.map((e) => e.vaultPath))],
    };
  }
  if (mode === 'single') {
    if (!onlyId) throw new Error("planStrategy: 'single' mode requires onlyId");
    const target = detected.find((a) => a.id === onlyId.toLowerCase());
    if (!target) {
      const list = detected.map((a) => a.id).join(', ') || '(none detected)';
      throw new Error(`Unknown agent "${onlyId}" — pick from: ${list}`);
    }
    return {
      mode,
      entries: [{ agent: target, vaultPath: combinedVaultPath }],
      vaultPaths: [combinedVaultPath],
    };
  }
  // combined (default): every detected agent points at the shared vault
  const entries = detected.map((agent) => ({ agent, vaultPath: combinedVaultPath }));
  return {
    mode: 'combined',
    entries,
    vaultPaths: [combinedVaultPath],
  };
}

/**
 * Interactive prompt — only invoked when 2+ agents are detected and the user
 * is in interactive mode. Returns the chosen mode + onlyId (when applicable).
 *
 * @param {WireableAgent[]} detected
 * @returns {Promise<{mode: StrategyMode, onlyId?: string}>}
 */
export async function chooseStrategy(detected) {
  const { select } = await import('@inquirer/prompts');
  const labels = detected.map((a) => a.label).join(' + ');
  const mode = /** @type {StrategyMode} */ (
    await select({
      message: `Detected ${detected.length} AI agents (${labels}). How should the brain be set up?`,
      default: 'combined',
      choices: [
        {
          value: 'combined',
          name: 'Combined — one shared vault every agent reads (recommended)',
          description: `One ~/AgentBrain that all ${detected.length} agents point at. Agents share memory.`,
        },
        {
          value: 'individual',
          name: `Individual — separate vault per agent (${detected
            .map((a) => '~/' + a.brainName)
            .join(', ')})`,
          description: `One vault per agent. Agents stay isolated — no cross-bleed of topics or chats.`,
        },
        {
          value: 'single',
          name: 'Single — pick one agent to wire',
          description: 'Only one agent gets a brain; others stay un-wired even if installed.',
        },
      ],
    })
  );
  if (mode !== 'single') return { mode };

  const onlyId = /** @type {string} */ (
    await select({
      message: 'Which agent should get the brain?',
      choices: detected.map((a) => ({ value: a.id, name: a.label })),
    })
  );
  return { mode, onlyId };
}

/**
 * Pretty-print a plan for the dry-run / confirmation summary.
 * @param {StrategyPlan} plan
 * @returns {string}
 */
export function describePlan(plan) {
  const lines = [];
  lines.push(`Mode: ${plan.mode}`);
  for (const entry of plan.entries) {
    lines.push(`  ${entry.agent.label} → ${entry.vaultPath}`);
  }
  const skipped = WIREABLE_AGENTS.filter(
    (a) =>
      a.detectDirs.some((d) => existsSync(d)) && !plan.entries.find((e) => e.agent.id === a.id),
  );
  if (skipped.length) {
    lines.push(`  Skipped (installed but un-wired): ${skipped.map((a) => a.label).join(', ')}`);
  }
  return lines.join('\n');
}
