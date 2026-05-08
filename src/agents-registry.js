// @ts-check
/**
 * Custom AI agent registry — stored at `~/.config/ai-brain/agents.json`.
 *
 * Lets users wire ai-brain to ANY agent that reads a markdown / config file,
 * even ones we don't have built-in support for (Roo, Continue forks, custom
 * in-house agents, future-released tools, etc.). Each entry says:
 *   - name:  human label, for logs
 *   - file:  the file the agent reads
 *           ("." prefix → relative to project; absolute → wired globally)
 *   - format: 'markdown' (default) or 'rules' (no markdown headings)
 *
 * On `ai-brain init` every registered agent gets the same content the
 * built-ins do, written to its specified path.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname, isAbsolute } from 'path';

export const REGISTRY_DIR = join(homedir(), '.config', 'ai-brain');
export const REGISTRY_PATH = join(REGISTRY_DIR, 'agents.json');

/**
 * @typedef {Object} CustomAgent
 * @property {string} name      - Human-readable label (e.g. "Roo Code")
 * @property {string} file      - Target path; "." prefix = project-relative,
 *                                absolute = global
 * @property {'markdown'|'rules'} format - 'markdown' keeps headings; 'rules'
 *                                strips the leading H1 for tools that prefer
 *                                rule-list-style content
 * @property {string} [notes]   - Optional free-text description
 */

/** @returns {CustomAgent[]} */
export function loadAgents() {
  if (!existsSync(REGISTRY_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw.filter((a) => a && typeof a.name === 'string' && typeof a.file === 'string');
  } catch {
    return [];
  }
}

/** @param {CustomAgent[]} agents */
export function saveAgents(agents) {
  if (!existsSync(REGISTRY_DIR)) mkdirSync(REGISTRY_DIR, { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(agents, null, 2) + '\n', 'utf8');
}

/**
 * Add or update an agent by name.
 * @param {CustomAgent} agent
 * @returns {{action: 'added' | 'updated', agent: CustomAgent}}
 */
export function addAgent(agent) {
  const list = loadAgents();
  const existingIdx = list.findIndex((a) => a.name.toLowerCase() === agent.name.toLowerCase());
  const normalized = {
    name: agent.name,
    file: agent.file,
    format: agent.format === 'rules' ? 'rules' : 'markdown',
    ...(agent.notes ? { notes: agent.notes } : {}),
  };
  if (existingIdx === -1) {
    list.push(normalized);
    saveAgents(list);
    return { action: 'added', agent: normalized };
  }
  list[existingIdx] = normalized;
  saveAgents(list);
  return { action: 'updated', agent: normalized };
}

/**
 * Remove an agent by name (case-insensitive).
 * @param {string} name
 * @returns {boolean}
 */
export function removeAgent(name) {
  const list = loadAgents();
  const filtered = list.filter((a) => a.name.toLowerCase() !== name.toLowerCase());
  if (filtered.length === list.length) return false;
  saveAgents(filtered);
  return true;
}

/**
 * Resolve an agent's target file path against a project directory.
 * - Absolute path → returned as-is (global wiring)
 * - "." prefixed or no leading slash → joined with projectDir (project wiring)
 * @param {CustomAgent} agent
 * @param {string} projectDir
 * @returns {{ path: string, scope: 'global' | 'project' }}
 */
export function resolveAgentPath(agent, projectDir) {
  if (isAbsolute(agent.file)) return { path: agent.file, scope: 'global' };
  return { path: join(projectDir, agent.file), scope: 'project' };
}

/**
 * Write the appropriate content for a custom agent. Project agents get the
 * full claudeMdContent (with brain snippet); global agents get only the brain
 * snippet so they don't pollute home with project-specific context.
 *
 * @param {CustomAgent} agent
 * @param {string} projectDir
 * @param {string} claudeMdContent
 * @param {string} brainSnippet
 * @returns {{ file: string, action: 'created' | 'skipped', scope: 'global'|'project' }}
 */
export function writeAgentFile(agent, projectDir, claudeMdContent, brainSnippet) {
  const { path: targetPath, scope } = resolveAgentPath(agent, projectDir);
  if (existsSync(targetPath)) {
    return { file: targetPath, action: 'skipped', scope };
  }
  const dir = dirname(targetPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let body;
  if (scope === 'global') {
    body = `# ${agent.name} — Global Instructions\n\n${brainSnippet}\n`;
  } else {
    const stripped = (claudeMdContent || '').replace(/^# .+\n/, '');
    if (agent.format === 'rules') {
      body = `${brainSnippet}\n\n${stripped}`;
    } else {
      body = `# ${agent.name} — Project Rules\n\n${brainSnippet}\n${stripped}`;
    }
  }
  writeFileSync(targetPath, body, 'utf8');
  return { file: targetPath, action: 'created', scope };
}
