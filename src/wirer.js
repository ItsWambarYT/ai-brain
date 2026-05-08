// @ts-check
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

import { loadAgents, writeAgentFile } from './agents-registry.js';

// ─── Brain snippet (injected into every agent config) ──────────────────────

/** Exported so external modules (custom-agent writer, doctor) can re-use it.
 * @param {string} vaultPath @returns {string} */
export function brainSnippet(vaultPath) {
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
  return writeGlobalBlock(p, 'Claude — Global Instructions', brainSnippet(vaultPath));
}

/** @param {string} vaultPath @returns {{ action: string, path: string }} */
export function generateGeminiMd(vaultPath) {
  const p = join(homedir(), '.gemini', 'GEMINI.md');
  const body = `${brainSnippet(vaultPath)}
## Behavior

- Direct, no filler. Finish tasks completely. Verify before reporting done.
- Internal actions (files, code): proceed. External (email, posts, deploys): confirm first.
- Never stop at findings — apply the fix and verify it worked.
`;
  return writeGlobalBlock(p, 'Gemini — Global Instructions', body);
}

/** @param {string} vaultPath @returns {{ action: string, path: string }} */
export function generateContinueMd(vaultPath) {
  const p = join(homedir(), '.continue', 'config.md');
  const body = `${brainSnippet(vaultPath)}
## Behavior

- Finish tasks completely before reporting done.
- Apply fixes and verify they work.
`;
  return writeGlobalBlock(p, 'Continue — Global Instructions', body);
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

  // Custom agents from ~/.config/ai-brain/agents.json — anything the user
  // has registered with `ai-brain add-agent`. Lets ai-brain wire ANY tool
  // that reads a markdown / config file, not just the built-in list.
  const snippet = brainSnippet(vaultPath);
  for (const agent of loadAgents()) {
    const { file, action, scope } = writeAgentFile(agent, projectDir, claudeMdContent, snippet);
    results.push({
      file: scope === 'global' ? file : agent.file,
      created: action === 'created',
      custom: true,
      name: agent.name,
    });
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

const AI_BRAIN_BEGIN = '<!-- ai-brain:begin -->';
const AI_BRAIN_END = '<!-- ai-brain:end -->';

/**
 * Write or update an ai-brain managed block in a global agent config file.
 *
 *  - File missing → create with `# title` + the fenced ai-brain block
 *  - File has the block already → replace ONLY the block content (preserve everything else)
 *  - File exists, no block → append the block (preserve all existing content)
 *
 * Fixes the prior bug where Gemini's existing GEMINI.md was overwritten —
 * we now own only the marked region.
 *
 * @param {string} filePath
 * @param {string} title  Top-of-file heading used when creating from scratch
 * @param {string} body   Markdown content to put inside the managed block
 * @returns {{ action: 'created' | 'updated' | 'appended', path: string }}
 */
function writeGlobalBlock(filePath, title, body) {
  mkdirSync(dirname(filePath), { recursive: true });
  const block = `${AI_BRAIN_BEGIN}\n${body.trim()}\n${AI_BRAIN_END}`;

  if (!existsSync(filePath)) {
    writeFileSync(filePath, `# ${title}\n\n${block}\n`, 'utf8');
    return { action: 'created', path: filePath };
  }

  const existing = readFileSync(filePath, 'utf8');
  const beginIdx = existing.indexOf(AI_BRAIN_BEGIN);
  const endIdx = existing.indexOf(AI_BRAIN_END);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = existing.slice(0, beginIdx);
    const after = existing.slice(endIdx + AI_BRAIN_END.length);
    writeFileSync(filePath, `${before}${block}${after}`, 'utf8');
    return { action: 'updated', path: filePath };
  }

  const sep = existing.endsWith('\n') ? '\n' : '\n\n';
  writeFileSync(filePath, `${existing}${sep}${block}\n`, 'utf8');
  return { action: 'appended', path: filePath };
}
