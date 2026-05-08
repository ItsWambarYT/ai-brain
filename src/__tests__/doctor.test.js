// @ts-check
/**
 * Doctor diagnostic tests. Same sandbox technique as the registry tests —
 * override HOME so the doctor checks against a fully controlled fake home
 * directory and an isolated registry.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sandbox = mkdtempSync(join(tmpdir(), 'aibrain-doc-'));
process.env.HOME = sandbox;
process.env.USERPROFILE = sandbox;

const { diagnose } = await import('../doctor.js');
const reg = await import('../agents-registry.js');

beforeEach(() => {
  // Wipe sandbox between tests for clean state
  rmSync(sandbox, { recursive: true, force: true });
  mkdirSync(sandbox, { recursive: true });
});

after(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

test('reports brain vault missing as an error', () => {
  const checks = diagnose({ brainPath: join(sandbox, 'AgentBrain') });
  const errors = checks.filter((c) => c.level === 'error');
  assert.ok(
    errors.some((c) => /Brain vault missing/i.test(c.title)),
    'expected a "brain vault missing" error',
  );
});

test('reports brain vault healthy when Home.md exists', () => {
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  writeFileSync(join(vault, 'Home.md'), '# Home\n');
  const checks = diagnose({ brainPath: vault, projectDir: sandbox });
  assert.ok(
    checks.some((c) => c.level === 'ok' && /Brain vault healthy/i.test(c.title)),
    'expected a "brain vault healthy" ok check',
  );
});

test('warns when Home.md is missing inside the vault', () => {
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  const checks = diagnose({ brainPath: vault, projectDir: sandbox });
  assert.ok(checks.some((c) => c.level === 'warn' && /Home\.md is missing/i.test(c.title)));
});

test('detects an installed agent and warns when its config is missing', () => {
  // Simulate Claude Code being installed (just the directory, no CLAUDE.md)
  mkdirSync(join(sandbox, '.claude'));
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  writeFileSync(join(vault, 'Home.md'), '# Home\n');

  const checks = diagnose({ brainPath: vault, projectDir: sandbox });
  assert.ok(
    checks.some((c) => c.level === 'warn' && /Claude Code installed but not wired/i.test(c.title)),
  );
});

test('marks a properly-wired global agent as ok', () => {
  mkdirSync(join(sandbox, '.gemini'));
  writeFileSync(
    join(sandbox, '.gemini', 'GEMINI.md'),
    '# Gemini\n\n<!-- ai-brain:begin -->\n## Brain Vault\nVault: `~/AgentBrain`\n<!-- ai-brain:end -->\n',
  );
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  writeFileSync(join(vault, 'Home.md'), '# Home\n');

  const checks = diagnose({ brainPath: vault, projectDir: sandbox });
  assert.ok(checks.some((c) => c.level === 'ok' && /Gemini CLI wired/i.test(c.title)));
});

test('reports custom agents from the registry', () => {
  reg.addAgent({ name: 'TestRoo', file: '.roorules', format: 'markdown' });
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  writeFileSync(join(vault, 'Home.md'), '# Home\n');

  const projectDir = mkdtempSync(join(tmpdir(), 'aibrain-proj-doc-'));
  try {
    const checks = diagnose({ brainPath: vault, projectDir });
    // Custom agent file doesn't exist in the project → warn
    assert.ok(
      checks.some(
        (c) => c.level === 'warn' && /TestRoo.*registered but file missing/.test(c.title),
      ),
    );

    // Now create the file → should flip to ok
    writeFileSync(join(projectDir, '.roorules'), '# Roo\n');
    const checks2 = diagnose({ brainPath: vault, projectDir });
    assert.ok(checks2.some((c) => c.level === 'ok' && /TestRoo.*wired/.test(c.title)));
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test('reports invalid registry JSON as an error', () => {
  // Corrupt the registry on purpose
  mkdirSync(reg.REGISTRY_DIR, { recursive: true });
  writeFileSync(reg.REGISTRY_PATH, 'not json {{{');
  const vault = join(sandbox, 'AgentBrain');
  mkdirSync(vault);
  writeFileSync(join(vault, 'Home.md'), '# Home\n');

  const checks = diagnose({ brainPath: vault, projectDir: sandbox });
  assert.ok(checks.some((c) => c.level === 'error' && /registry has invalid JSON/i.test(c.title)));
});
