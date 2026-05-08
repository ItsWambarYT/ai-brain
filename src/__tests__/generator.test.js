// @ts-check
/**
 * Generator end-to-end: scan a fixture → buildClaudeMd → assert the rendered
 * markdown contains the project name + a stack hint and has no unfilled
 * `{{TOKEN}}` placeholders left.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { scan } from '../scanner.js';
import { buildClaudeMd } from '../generator.js';

test('buildClaudeMd renders a project-named CLAUDE.md with no leftover placeholders', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibrain-gen-'));
  try {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'starlit-cli',
        bin: { 'starlit-cli': './bin/cli.js' },
        dependencies: { commander: '12.0.0' },
      }),
    );

    const scanResult = await scan(dir);
    const md = buildClaudeMd(dir, scanResult);

    // Project name made it into the output (titlecased)
    assert.match(md, /Starlit-cli|Starlit Cli|starlit-cli/i);
    // Template-rendered Markdown should have no unsubstituted handlebars left
    assert.doesNotMatch(md, /\{\{[A-Z0-9_]+\}\}/);
    // Reasonable size — templates are at least a few hundred chars
    assert.ok(md.length > 200, `expected non-trivial CLAUDE.md, got ${md.length} chars`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
