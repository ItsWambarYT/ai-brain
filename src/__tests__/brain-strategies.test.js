// @ts-check
/**
 * planStrategy tests — pure logic, no filesystem prompts. Each case feeds a
 * fake `detected` array and asserts the resulting plan layout (vault paths,
 * which agents got wired, which got skipped).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planStrategy } from '../brain-strategies.js';

// Stand-in agent fixtures (real ones would come from detectWireableAgents)
const claude = {
  id: 'claude',
  label: 'Claude Code',
  detectDirs: ['/fake/.claude'],
  brainName: 'ClaudeBrain',
  wire: () => ({ action: 'created', path: '/fake/.claude/CLAUDE.md' }),
};
const gemini = {
  id: 'gemini',
  label: 'Gemini CLI',
  detectDirs: ['/fake/.gemini'],
  brainName: 'GeminiBrain',
  wire: () => ({ action: 'created', path: '/fake/.gemini/GEMINI.md' }),
};
const cont = {
  id: 'continue',
  label: 'Continue',
  detectDirs: ['/fake/.continue'],
  brainName: 'ContinueBrain',
  wire: () => ({ action: 'created', path: '/fake/.continue/config.md' }),
};

test('combined mode wires every agent to one shared vault', () => {
  const plan = planStrategy({
    mode: 'combined',
    detected: [claude, gemini, cont],
    combinedVaultPath: '/home/u/AgentBrain',
  });
  assert.equal(plan.mode, 'combined');
  assert.equal(plan.entries.length, 3);
  assert.deepEqual(plan.vaultPaths, ['/home/u/AgentBrain']);
  for (const e of plan.entries) assert.equal(e.vaultPath, '/home/u/AgentBrain');
});

test('individual mode forks one vault per agent (~/<Name>Brain)', () => {
  const plan = planStrategy({
    mode: 'individual',
    detected: [claude, gemini],
    combinedVaultPath: '/ignored',
  });
  assert.equal(plan.mode, 'individual');
  assert.equal(plan.entries.length, 2);
  assert.equal(plan.vaultPaths.length, 2);
  const claudeEntry = plan.entries.find((e) => e.agent.id === 'claude');
  const geminiEntry = plan.entries.find((e) => e.agent.id === 'gemini');
  assert.ok(claudeEntry.vaultPath.endsWith('ClaudeBrain'));
  assert.ok(geminiEntry.vaultPath.endsWith('GeminiBrain'));
  assert.notEqual(claudeEntry.vaultPath, geminiEntry.vaultPath);
});

test('single mode wires only the chosen agent', () => {
  const plan = planStrategy({
    mode: 'single',
    detected: [claude, gemini, cont],
    combinedVaultPath: '/home/u/AgentBrain',
    onlyId: 'gemini',
  });
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].agent.id, 'gemini');
  assert.equal(plan.entries[0].vaultPath, '/home/u/AgentBrain');
});

test('single mode is case-insensitive on onlyId', () => {
  const plan = planStrategy({
    mode: 'single',
    detected: [claude, gemini],
    combinedVaultPath: '/v',
    onlyId: 'GEMINI',
  });
  assert.equal(plan.entries[0].agent.id, 'gemini');
});

test('single mode without onlyId throws', () => {
  assert.throws(
    () => planStrategy({ mode: 'single', detected: [claude], combinedVaultPath: '/v' }),
    /requires onlyId/,
  );
});

test('single mode with unknown onlyId throws with a helpful message', () => {
  assert.throws(
    () =>
      planStrategy({
        mode: 'single',
        detected: [claude, gemini],
        combinedVaultPath: '/v',
        onlyId: 'cursor',
      }),
    /Unknown agent "cursor".*claude, gemini/,
  );
});

test('combined with one detected agent still produces a plan', () => {
  const plan = planStrategy({
    mode: 'combined',
    detected: [claude],
    combinedVaultPath: '/v',
  });
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].agent.id, 'claude');
  assert.deepEqual(plan.vaultPaths, ['/v']);
});

test('combined with no detected agents produces an empty plan', () => {
  const plan = planStrategy({
    mode: 'combined',
    detected: [],
    combinedVaultPath: '/v',
  });
  assert.equal(plan.entries.length, 0);
  assert.deepEqual(plan.vaultPaths, ['/v']);
});
