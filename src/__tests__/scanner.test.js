// @ts-check
/**
 * Scanner detection tests. Each test builds a tiny fixture directory with the
 * minimum files needed to trigger one of the template branches in scanner.js,
 * runs scan(), and asserts the template + a representative signal landed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { scan } from '../scanner.js';

/**
 * Build a temp dir, drop the given { filename: contents } map into it, run
 * scan(), and tear it down. Returns the ScanResult.
 * @param {Record<string, string>} files
 */
async function scanFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'aibrain-scan-'));
  try {
    for (const [name, contents] of Object.entries(files)) {
      const full = join(dir, name);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, contents);
    }
    return await scan(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('detects Next.js app', async () => {
  const result = await scanFixture({
    'package.json': JSON.stringify({
      name: 'demo-next',
      dependencies: { next: '14.0.0', react: '18.0.0', tailwindcss: '3.4.0' },
    }),
    'tsconfig.json': '{}',
  });
  assert.equal(result.template, 'nextjs');
  assert.ok(result.detected.includes('next'));
  assert.ok(result.detected.includes('tailwind'));
  assert.equal(result.meta.packageName, 'demo-next');
});

test('detects React + Vite', async () => {
  const result = await scanFixture({
    'package.json': JSON.stringify({
      name: 'demo-vite',
      dependencies: { react: '18.0.0', vite: '5.0.0' },
    }),
  });
  assert.equal(result.template, 'react-vite');
  assert.ok(result.detected.includes('react'));
  assert.ok(result.detected.includes('vite'));
});

test('detects Node CLI', async () => {
  const result = await scanFixture({
    'package.json': JSON.stringify({
      name: 'demo-cli',
      bin: { 'demo-cli': './bin/cli.js' },
      dependencies: { commander: '12.0.0' },
    }),
  });
  assert.equal(result.template, 'node-cli');
  assert.ok(result.detected.includes('node-cli'));
  assert.ok(result.detected.includes('commander'));
});

test('detects Python FastAPI from requirements.txt', async () => {
  const result = await scanFixture({
    'requirements.txt': 'fastapi==0.111.0\nuvicorn==0.30.0\nsqlalchemy==2.0.0\n',
  });
  assert.equal(result.template, 'python-fastapi');
  assert.ok(result.detected.includes('fastapi'));
  assert.ok(result.detected.includes('sqlalchemy'));
});

test('detects Python project from pyproject.toml', async () => {
  const result = await scanFixture({
    'pyproject.toml':
      '[project]\nname = "demo"\n[tool.poetry]\nname = "demo"\ndependencies = ["flask"]\n',
  });
  assert.ok(result.detected.includes('python'));
  assert.ok(result.detected.includes('flask'));
  assert.ok(result.detected.includes('poetry'));
});

test('detects Python data-science', async () => {
  const result = await scanFixture({
    'requirements.txt': 'pandas==2.2.0\nnumpy==1.26.0\nscikit-learn==1.5.0\ntorch==2.3.0\n',
  });
  assert.equal(result.template, 'python-data');
  assert.ok(result.detected.includes('data-science'));
  assert.ok(result.detected.includes('ml'));
});

test('detects Go module', async () => {
  const result = await scanFixture({
    'go.mod':
      'module github.com/example/svc\n\ngo 1.22\n\nrequire github.com/gin-gonic/gin v1.10.0\n',
  });
  assert.equal(result.template, 'go');
  assert.ok(result.detected.includes('go'));
  assert.ok(result.detected.includes('go-web'));
});

test('detects Rust', async () => {
  const result = await scanFixture({
    'Cargo.toml': '[package]\nname = "demo"\n\n[dependencies]\naxum = "0.7"\ntokio = "1"\n',
  });
  assert.equal(result.template, 'rust');
  assert.ok(result.detected.includes('rust'));
  assert.ok(result.detected.includes('rust-web'));
  assert.ok(result.detected.includes('tokio'));
});

test('falls back to generic when no signals', async () => {
  const result = await scanFixture({
    'README.md': '# nothing detectable here\n',
  });
  assert.equal(result.template, 'generic');
  assert.deepEqual(result.detected, []);
});

test('detects monorepo workspace layout', async () => {
  const result = await scanFixture({
    'package.json': JSON.stringify({ name: 'monorepo-root', private: true }),
    'packages/a/package.json': JSON.stringify({ name: '@x/a' }),
    'packages/b/package.json': JSON.stringify({ name: '@x/b' }),
  });
  assert.ok(result.detected.includes('monorepo'));
});
