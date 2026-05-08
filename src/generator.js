// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { scan } from './scanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, 'templates');

/** @param {string} dir @param {any} scanResult @returns {string} */
export function buildClaudeMd(dir, scanResult) {
  const { template, detected, meta } = scanResult;

  const templatePath = join(TEMPLATES_DIR, `${template}.md`);
  let content = readFileSync(templatePath, 'utf8');

  // Project name
  const pkg = tryReadJson(join(dir, 'package.json'));
  const projectName = pkg?.name || basename(dir) || 'My Project';
  content = content.replaceAll('{{PROJECT_NAME}}', toTitleCase(projectName));

  // Package slug (for bin names etc)
  const slug = (pkg?.name || basename(dir)).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  content = content.replaceAll('{{PACKAGE_SLUG}}', slug);

  // Package manager
  const pm = detectPackageManager(dir);
  content = content.replaceAll('{{PACKAGE_MANAGER}}', pm);

  // Python interpreter
  const python = detectPython();
  content = content.replaceAll('{{PYTHON}}', python);

  // Go module
  content = content.replaceAll('{{GO_MODULE}}', meta.goModule || 'your/module/path');

  // Extra stack lines
  const extraLines = buildExtraStack(detected, meta);
  content = content.replaceAll('{{EXTRA_STACK}}', extraLines);

  // Brain snippet (empty by default — user adds their own)
  content = content.replaceAll('{{BRAIN_SNIPPET}}', '');

  return content;
}

/** @param {string[]} detected @param {Record<string,string>} meta @returns {string} */
function buildExtraStack(detected, meta) {
  const lines = [];
  if (detected.includes('trpc')) lines.push('- **RPC:** tRPC');
  if (detected.includes('prisma')) lines.push('- **ORM:** Prisma');
  if (detected.includes('drizzle')) lines.push('- **ORM:** Drizzle ORM');
  if (detected.includes('auth')) lines.push('- **Auth:** NextAuth / Auth.js');
  if (detected.includes('react-query')) lines.push('- **Server state:** TanStack Query');
  if (detected.includes('state-mgmt')) lines.push('- **Client state:** Zustand / Jotai');
  if (detected.includes('router')) lines.push('- **Routing:** React Router / TanStack Router');
  if (detected.includes('sqlalchemy')) lines.push('- **ORM:** SQLAlchemy (async)');
  if (detected.includes('alembic')) lines.push('- **Migrations:** Alembic');
  if (detected.includes('celery')) lines.push('- **Tasks:** Celery');
  if (detected.includes('ml')) lines.push('- **ML framework:** PyTorch / TensorFlow');
  if (detected.includes('poetry')) lines.push('- **Package manager:** Poetry');
  if (detected.includes('uv')) lines.push('- **Package manager:** uv');
  if (detected.includes('docker')) lines.push('- **Containers:** Docker');
  if (detected.includes('monorepo')) lines.push('- **Monorepo:** pnpm workspaces / Turborepo');
  if (detected.includes('go-web') && meta.framework)
    lines.push(`- **Web framework:** ${meta.framework}`);
  if (detected.includes('node-server') && meta.framework)
    lines.push(`- **Web framework:** ${meta.framework}`);
  if (detected.includes('tokio')) lines.push('- **Async runtime:** Tokio');
  return lines.length ? '\n' + lines.join('\n') : '';
}

/** @param {string} dir @returns {string} */
function detectPackageManager(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  return 'npm';
}

function detectPython() {
  return 'python3';
}

/** @param {string} path @returns {any|null} */
function tryReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** @param {string} s @returns {string} */
function toTitleCase(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @param {string} dir
 * @param {{ force?: boolean, dryRun?: boolean, template?: string }} opts
 */
export async function runGenerate(dir, opts = {}) {
  const scanResult = await scan(dir);

  if (opts.template) {
    const validTemplates = [
      'nextjs',
      'react-vite',
      'python-fastapi',
      'python-data',
      'node-cli',
      'typescript-lib',
      'go',
      'generic',
    ];
    if (!validTemplates.includes(opts.template)) {
      console.error(
        chalk.red(`Unknown template: ${opts.template}. Valid: ${validTemplates.join(', ')}`),
      );
      process.exit(1);
    }
    scanResult.template = opts.template;
  }

  console.log(chalk.gray(`Project:  ${dir}`));
  console.log(chalk.gray(`Detected: ${scanResult.label} → template/${scanResult.template}.md`));
  console.log('');

  const content = buildClaudeMd(dir, scanResult);
  const outPath = join(dir, 'CLAUDE.md');

  if (opts.dryRun) {
    console.log(chalk.yellow('--- DRY RUN: CLAUDE.md preview ---\n'));
    console.log(content);
    console.log(chalk.yellow('\n--- end preview ---'));
    return;
  }

  if (existsSync(outPath) && !opts.force) {
    console.log(chalk.yellow(`CLAUDE.md already exists at ${outPath}`));
    console.log(chalk.gray('Use --force to overwrite.'));
    return;
  }

  writeFileSync(outPath, content, 'utf8');
  console.log(chalk.green(`✓ CLAUDE.md written to ${outPath}`));
}
