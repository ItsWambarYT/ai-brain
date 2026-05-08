// @ts-check
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// ─── Brain snippet (injected into every agent config) ──────────────────────

/** @param {string} vaultPath @returns {string} */
function brainSnippet(vaultPath) {
  const vp = vaultPath.replace(/\\/g, '/');
  return `## Brain Vault — READ FIRST

Vault: \`${vp}\`

On every session start:
1. Read today's daily note: \`${vp}/Daily/YYYY-MM-DD.md\` (create if missing)
2. Read \`${vp}/Home.md\` for the full topic index

After every meaningful exchange:
- Append a summary to today's daily note under a new \`### Session N\` heading
- For new topics, create \`${vp}/TopicName.md\` and add \`[[TopicName]]\` to the daily note's Topic Nodes section
- Keep \`${vp}/Home.md\` updated as the master index

New day format:
\`\`\`
# YYYY-MM-DD

## Sessions

## Topic Nodes
\`\`\`
`;
}

// ─── Global agent config writers ───────────────────────────────────────────

/** @param {string} vaultPath @returns {{ action: string, path: string }} */
export function wireGlobalClaude(vaultPath) {
  const p = join(homedir(), '.claude', 'CLAUDE.md');
  const snippet = brainSnippet(vaultPath);
  return writeGlobalConfig(p, 'Claude — Global Instructions', snippet);
}

/** @param {string} vaultPath @returns {string} */
export function generateGeminiMd(vaultPath) {
  const dir = join(homedir(), '.gemini');
  const p = join(dir, 'GEMINI.md');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const vp = vaultPath.replace(/\\/g, '/');
  const content = `# Gemini — Global Instructions

## ${brainSnippet(vaultPath)}
## Behavior

- Direct, no filler. Finish tasks completely. Verify before reporting done.
- Internal actions (files, code): proceed. External (email, posts, deploys): confirm first.
- Never stop at findings — apply the fix and verify it worked.
`;
  writeFileSync(p, content, 'utf8');
  return p;
}

/** @param {string} vaultPath @returns {string} */
export function generateContinueMd(vaultPath) {
  const dir = join(homedir(), '.continue');
  const p = join(dir, 'config.md');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const content = `# Continue — Global Instructions\n\n${brainSnippet(vaultPath)}\n## Behavior\n\n- Finish tasks completely before reporting done.\n- Apply fixes and verify they work.\n`;
  if (!existsSync(p)) writeFileSync(p, content, 'utf8');
  return p;
}

// ─── Project-level agent config writers ────────────────────────────────────

/** @param {string} projectDir @param {string} claudeMdContent @param {string} vaultPath */
export function generateAllProjectConfigs(projectDir, claudeMdContent, vaultPath) {
  const results = [];

  // AGENTS.md — read by Codex CLI, Copilot CLI, and many agents
  const agentsPath = join(projectDir, 'AGENTS.md');
  if (!existsSync(agentsPath)) {
    writeFileSync(agentsPath, agentsMdContent(claudeMdContent, vaultPath), 'utf8');
    results.push({ file: 'AGENTS.md', created: true });
  } else {
    results.push({ file: 'AGENTS.md', created: false });
  }

  // .cursorrules — Cursor IDE
  const cursorPath = join(projectDir, '.cursorrules');
  if (!existsSync(cursorPath)) {
    writeFileSync(cursorPath, agentRulesContent(claudeMdContent, vaultPath), 'utf8');
    results.push({ file: '.cursorrules', created: true });
  } else {
    results.push({ file: '.cursorrules', created: false });
  }

  // .windsurfrules — Windsurf IDE
  const windsurfPath = join(projectDir, '.windsurfrules');
  if (!existsSync(windsurfPath)) {
    writeFileSync(windsurfPath, agentRulesContent(claudeMdContent, vaultPath), 'utf8');
    results.push({ file: '.windsurfrules', created: true });
  } else {
    results.push({ file: '.windsurfrules', created: false });
  }

  // .github/copilot-instructions.md — GitHub Copilot Chat
  const copilotDir = join(projectDir, '.github');
  const copilotPath = join(copilotDir, 'copilot-instructions.md');
  if (!existsSync(copilotPath)) {
    if (!existsSync(copilotDir)) mkdirSync(copilotDir, { recursive: true });
    writeFileSync(copilotPath, agentRulesContent(claudeMdContent, vaultPath), 'utf8');
    results.push({ file: '.github/copilot-instructions.md', created: true });
  } else {
    results.push({ file: '.github/copilot-instructions.md', created: false });
  }

  // .clinerules — Cline VS Code extension
  const clinePath = join(projectDir, '.clinerules');
  if (!existsSync(clinePath)) {
    writeFileSync(clinePath, agentRulesContent(claudeMdContent, vaultPath), 'utf8');
    results.push({ file: '.clinerules', created: true });
  } else {
    results.push({ file: '.clinerules', created: false });
  }

  // .aider.conf.yml — Aider (conventions reference)
  const aiderConf = join(projectDir, '.aider.conf.yml');
  if (!existsSync(aiderConf)) {
    writeFileSync(aiderConf, `# Aider configuration\nread: AGENTS.md\n`, 'utf8');
    results.push({ file: '.aider.conf.yml', created: true });
  } else {
    results.push({ file: '.aider.conf.yml', created: false });
  }

  return results;
}

// ─── Content builders ──────────────────────────────────────────────────────

/** @param {string} claudeMdContent @param {string} vaultPath @returns {string} */
function agentRulesContent(claudeMdContent, vaultPath) {
  // Strip the first heading line and re-title generically, prepend brain snippet
  const withoutFirstLine = claudeMdContent.replace(/^# .+\n/, '');
  return `# Project Rules\n\n${brainSnippet(vaultPath)}\n${withoutFirstLine}`;
}

/** @param {string} claudeMdContent @param {string} vaultPath @returns {string} */
function agentsMdContent(claudeMdContent, vaultPath) {
  const vp = vaultPath.replace(/\\/g, '/');
  return `# Agent Instructions

This file is read by AI coding agents (Claude Code, Cursor, Windsurf, Gemini CLI, Cline, Copilot, Aider, Continue, and others).

## Brain Vault

All agents share a single brain vault at \`${vp}\`.

On every session start:
1. Read today's daily note: \`${vp}/Daily/YYYY-MM-DD.md\` (create if missing)
2. Read \`${vp}/Home.md\` for the full topic index

Log every meaningful session to the daily note. Create topic notes with \`[[wikilinks]]\`.

## Project Context

See \`CLAUDE.md\` in this directory for full project-specific context and coding standards.

## Behavior

- Finish tasks completely — don't stop at findings, apply the fix and verify it worked
- Direct, no filler
- Internal file/code actions: proceed. External actions (email, deploy, PR to production): confirm first
- Small, focused commits with clear messages
- Ask before making large architectural changes
`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * @param {string} filePath
 * @param {string} title
 * @param {string} snippet
 * @returns {{ action: string, path: string }}
 */
function writeGlobalConfig(filePath, title, snippet) {
  if (!existsSync(filePath)) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `# ${title}\n\n${snippet}`, 'utf8');
    return { action: 'created', path: filePath };
  }

  const content = readFileSync(filePath, 'utf8');
  if (
    content.includes('Brain Vault') ||
    content.includes('AgentBrain') ||
    content.includes('brain vault')
  ) {
    return { action: 'already_wired', path: filePath };
  }

  writeFileSync(filePath, content + '\n\n' + snippet, 'utf8');
  return { action: 'appended', path: filePath };
}
