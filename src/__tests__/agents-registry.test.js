// @ts-check
/**
 * Custom agent registry tests. Each test points the registry at a temp file
 * via env override so the user's real ~/.config/ai-brain/agents.json is never
 * touched.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Override the home directory before importing so the registry's
// ~/.config/ai-brain path resolves into our sandbox.
const sandbox = mkdtempSync(join(tmpdir(), 'aibrain-reg-'));
process.env.HOME = sandbox;
process.env.USERPROFILE = sandbox; // Windows fallback

const reg = await import('../agents-registry.js');

beforeEach(() => {
  // Wipe the registry file between cases for isolation
  if (existsSync(reg.REGISTRY_PATH)) rmSync(reg.REGISTRY_PATH);
});

after(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

test('loadAgents returns empty when file missing', () => {
  assert.deepEqual(reg.loadAgents(), []);
});

test('addAgent creates the registry and persists the entry', () => {
  const result = reg.addAgent({ name: 'Roo', file: '.roorules', format: 'markdown' });
  assert.equal(result.action, 'added');
  assert.equal(result.agent.name, 'Roo');
  const round = reg.loadAgents();
  assert.equal(round.length, 1);
  assert.equal(round[0].name, 'Roo');
});

test('addAgent updates an existing entry by case-insensitive name', () => {
  reg.addAgent({ name: 'Roo', file: '.roorules', format: 'markdown' });
  const result = reg.addAgent({ name: 'ROO', file: '.roo/rules.md', format: 'rules' });
  assert.equal(result.action, 'updated');
  const list = reg.loadAgents();
  assert.equal(list.length, 1);
  assert.equal(list[0].file, '.roo/rules.md');
  assert.equal(list[0].format, 'rules');
});

test('removeAgent returns true on hit, false on miss', () => {
  reg.addAgent({ name: 'Codex', file: 'AGENTS.md', format: 'markdown' });
  assert.equal(reg.removeAgent('codex'), true);
  assert.equal(reg.removeAgent('nope'), false);
  assert.equal(reg.loadAgents().length, 0);
});

test('resolveAgentPath distinguishes project vs global by file shape', () => {
  const projectDir = '/tmp/myproj';
  const proj = reg.resolveAgentPath(
    { name: 'Foo', file: '.foorules', format: 'markdown' },
    projectDir,
  );
  assert.equal(proj.scope, 'project');
  assert.ok(proj.path.endsWith('.foorules'));

  const glob = reg.resolveAgentPath(
    { name: 'Bar', file: '/etc/bar.md', format: 'markdown' },
    projectDir,
  );
  assert.equal(glob.scope, 'global');
  assert.equal(glob.path, '/etc/bar.md');
});

test('writeAgentFile creates project-scoped file with claude content + brain snippet', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'aibrain-proj-'));
  try {
    const result = reg.writeAgentFile(
      { name: 'TestAgent', file: '.testrules', format: 'markdown' },
      projectDir,
      '# Hello Project\n\nReal content here.',
      '## Brain Vault\n\nVault: `~/AgentBrain`',
    );
    assert.equal(result.action, 'created');
    assert.equal(result.scope, 'project');
    const body = readFileSync(result.file, 'utf8');
    assert.ok(body.includes('Brain Vault'));
    assert.ok(body.includes('Real content here.'));
    assert.ok(body.includes('TestAgent'));
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test('writeAgentFile skips when target file already exists', () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'aibrain-proj2-'));
  try {
    writeFileSync(join(projectDir, '.testrules'), 'pre-existing\n');
    const result = reg.writeAgentFile(
      { name: 'TestAgent', file: '.testrules', format: 'markdown' },
      projectDir,
      '# Hello\n',
      '## Brain Vault\n',
    );
    assert.equal(result.action, 'skipped');
    assert.equal(readFileSync(join(projectDir, '.testrules'), 'utf8'), 'pre-existing\n');
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("'rules' format strips the leading H1 heading", () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'aibrain-proj3-'));
  try {
    const result = reg.writeAgentFile(
      { name: 'RulesAgent', file: '.rulesfile', format: 'rules' },
      projectDir,
      '# Original Heading\n\nbody.',
      '## Brain Vault\n',
    );
    const body = readFileSync(result.file, 'utf8');
    assert.doesNotMatch(body, /^# Original Heading/);
    assert.doesNotMatch(body, /^# RulesAgent/);
    assert.ok(body.includes('Brain Vault'));
    assert.ok(body.includes('body.'));
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});
