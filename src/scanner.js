// @ts-check
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import fg from 'fast-glob';

/**
 * @typedef {Object} ScanResult
 * @property {string} template   - Template key to use
 * @property {string} label      - Human-readable label
 * @property {string[]} detected - List of detected signals
 * @property {Record<string,string>} meta - Extra metadata (packageName, pythonVersion, etc.)
 */

/** @param {string} dir @returns {any|null} */
function readJson(dir, file) {
  const p = join(dir, file);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

/** @param {string} dir @returns {ScanResult} */
export async function scan(dir) {
  const signals = [];
  const meta = {};

  const pkg = readJson(dir, 'package.json');
  const pyproject = existsSync(join(dir, 'pyproject.toml'));
  const setupPy = existsSync(join(dir, 'setup.py'));
  const requirementsTxt = existsSync(join(dir, 'requirements.txt'));
  const goMod = existsSync(join(dir, 'go.mod'));
  const cargoToml = existsSync(join(dir, 'Cargo.toml'));
  const gemfile = existsSync(join(dir, 'Gemfile'));
  const composerJson = existsSync(join(dir, 'composer.json'));
  const tsconfig = existsSync(join(dir, 'tsconfig.json'));
  const dockerFile = existsSync(join(dir, 'Dockerfile'));

  if (pkg) {
    meta.packageName = pkg.name || 'unknown';
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    const depNames = Object.keys(deps);

    // Next.js
    if (depNames.includes('next')) {
      signals.push('next');
      if (depNames.includes('@trpc/server') || depNames.includes('@trpc/client')) signals.push('trpc');
      if (depNames.includes('prisma') || depNames.includes('@prisma/client')) signals.push('prisma');
      if (depNames.includes('drizzle-orm')) signals.push('drizzle');
      if (depNames.includes('next-auth') || depNames.includes('@auth/core')) signals.push('auth');
      if (depNames.includes('@tanstack/react-query')) signals.push('react-query');
      if (depNames.includes('tailwindcss')) signals.push('tailwind');
    }

    // React (without Next.js)
    if (!depNames.includes('next') && depNames.includes('react')) {
      signals.push('react');
      if (depNames.includes('vite') || depNames.includes('@vitejs/plugin-react')) signals.push('vite');
      if (depNames.includes('@tanstack/react-query')) signals.push('react-query');
      if (depNames.includes('react-router-dom') || depNames.includes('@tanstack/react-router')) signals.push('router');
      if (depNames.includes('tailwindcss')) signals.push('tailwind');
      if (depNames.includes('zustand') || depNames.includes('jotai') || depNames.includes('recoil')) signals.push('state-mgmt');
    }

    // Node CLI
    if (pkg.bin && !depNames.includes('react') && !depNames.includes('next')) {
      signals.push('node-cli');
      if (depNames.includes('commander') || depNames.includes('yargs') || depNames.includes('meow')) signals.push('commander');
      if (depNames.includes('inquirer') || depNames.includes('@inquirer/prompts')) signals.push('inquirer');
    }

    // TypeScript library
    if (tsconfig && !signals.includes('react') && !signals.includes('next') && !signals.includes('node-cli')) {
      signals.push('typescript-lib');
    }

    // Node server
    if (depNames.includes('express') || depNames.includes('fastify') || depNames.includes('hono') || depNames.includes('koa')) {
      signals.push('node-server');
      meta.framework = depNames.includes('express') ? 'express' :
                       depNames.includes('fastify') ? 'fastify' :
                       depNames.includes('hono') ? 'hono' : 'koa';
    }

    if (depNames.includes('typescript') || depNames.includes('ts-node')) signals.push('typescript');
    if (depNames.includes('jest') || depNames.includes('vitest') || depNames.includes('mocha')) signals.push('tests');
    if (depNames.includes('eslint')) signals.push('eslint');
    if (depNames.includes('prettier')) signals.push('prettier');
    if (dockerFile) signals.push('docker');
  }

  if (pyproject || setupPy || requirementsTxt) {
    let content = '';
    if (pyproject) { content = readFileSync(join(dir, 'pyproject.toml'), 'utf8'); signals.push('python'); }
    if (requirementsTxt) { content = readFileSync(join(dir, 'requirements.txt'), 'utf8'); }

    if (content.includes('fastapi') || content.includes('FastAPI')) {
      signals.push('fastapi');
      if (content.includes('sqlalchemy') || content.includes('SQLAlchemy')) signals.push('sqlalchemy');
      if (content.includes('pydantic')) signals.push('pydantic');
      if (content.includes('alembic')) signals.push('alembic');
      if (content.includes('asyncpg') || content.includes('aiosqlite')) signals.push('async-db');
      if (content.includes('celery')) signals.push('celery');
    } else if (content.includes('django') || content.includes('Django')) {
      signals.push('django');
    } else if (content.includes('flask') || content.includes('Flask')) {
      signals.push('flask');
    }

    if (content.includes('pandas') || content.includes('numpy') || content.includes('jupyter') ||
        content.includes('matplotlib') || content.includes('scikit') || content.includes('torch') ||
        content.includes('tensorflow') || content.includes('xgboost') || content.includes('polars')) {
      signals.push('data-science');
      if (content.includes('torch') || content.includes('tensorflow')) signals.push('ml');
    }

    if (content.includes('pytest')) signals.push('pytest');
    if (content.includes('poetry') || (pyproject && readFileSync(join(dir, 'pyproject.toml'), 'utf8').includes('[tool.poetry]'))) signals.push('poetry');
    if (existsSync(join(dir, 'uv.lock'))) signals.push('uv');
    if (dockerFile) signals.push('docker');
  }

  if (goMod) {
    signals.push('go');
    const modContent = readFileSync(join(dir, 'go.mod'), 'utf8');
    if (modContent.includes('gin-gonic') || modContent.includes('echo') || modContent.includes('fiber')) signals.push('go-web');
    meta.goModule = modContent.split('\n')[0]?.replace('module ', '').trim() || '';
  }

  if (cargoToml) {
    signals.push('rust');
    const content = readFileSync(join(dir, 'Cargo.toml'), 'utf8');
    if (content.includes('actix-web') || content.includes('axum') || content.includes('warp')) signals.push('rust-web');
    if (content.includes('tokio')) signals.push('tokio');
  }

  // Detect monorepo
  const workspaceFiles = await fg(['packages/*/package.json', 'apps/*/package.json'], { cwd: dir, deep: 2 });
  if (workspaceFiles.length > 1) signals.push('monorepo');

  return pick(signals, meta);
}

/** @param {string[]} signals @param {Record<string,string>} meta @returns {ScanResult} */
function pick(signals, meta) {
  if (signals.includes('next')) {
    return { template: 'nextjs', label: 'Next.js App', detected: signals, meta };
  }
  if (signals.includes('react') && signals.includes('vite')) {
    return { template: 'react-vite', label: 'React + Vite', detected: signals, meta };
  }
  if (signals.includes('react')) {
    return { template: 'react-vite', label: 'React App', detected: signals, meta };
  }
  if (signals.includes('fastapi')) {
    return { template: 'python-fastapi', label: 'Python FastAPI', detected: signals, meta };
  }
  if (signals.includes('data-science')) {
    return { template: 'python-data', label: 'Python Data / ML', detected: signals, meta };
  }
  if (signals.includes('python') || signals.includes('django') || signals.includes('flask')) {
    return { template: 'python-fastapi', label: 'Python App', detected: signals, meta };
  }
  if (signals.includes('node-cli')) {
    return { template: 'node-cli', label: 'Node.js CLI', detected: signals, meta };
  }
  if (signals.includes('typescript-lib') || signals.includes('typescript')) {
    return { template: 'typescript-lib', label: 'TypeScript Library', detected: signals, meta };
  }
  if (signals.includes('go')) {
    return { template: 'go', label: 'Go', detected: signals, meta };
  }
  if (signals.includes('rust')) {
    return { template: 'generic', label: 'Rust', detected: signals, meta };
  }
  if (signals.includes('node-server')) {
    return { template: 'node-cli', label: 'Node.js Server', detected: signals, meta };
  }
  return { template: 'generic', label: 'Generic Project', detected: signals, meta };
}

/** @param {string} dir */
export async function runScan(dir) {
  console.log(chalk.gray(`Scanning: ${dir}\n`));
  const result = await scan(dir);
  console.log(chalk.bold('Detected:') + ' ' + chalk.green(result.label));
  console.log(chalk.bold('Template:') + ' ' + chalk.cyan(result.template));
  console.log(chalk.bold('Signals: ') + chalk.gray(result.detected.join(', ') || 'none'));
  if (Object.keys(result.meta).length) {
    console.log(chalk.bold('Meta:    ') + chalk.gray(JSON.stringify(result.meta)));
  }
}
