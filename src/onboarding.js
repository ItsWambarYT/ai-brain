// @ts-check
/**
 * Onboarding interview — fills in the gaps when auto-detection can't find enough.
 * Asks a tight set of high-signal questions. Takes ~60 seconds.
 */
import { input, select, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

/**
 * @typedef {Object} OnboardingAnswers
 * @property {string} name
 * @property {string} role
 * @property {string[]} languages
 * @property {string[]} frameworks
 * @property {string} style
 * @property {string} packageManager
 * @property {string} currentWork
 * @property {string} agentRules
 */

const ROLES = [
  'Full-Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist / ML Engineer',
  'DevOps / Platform Engineer',
  'Mobile Developer',
  'Systems / Low-Level Developer',
  'Student / Learning',
  'Other',
];

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
  'Java', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C/C++',
];

const FRAMEWORKS = [
  'Next.js', 'React', 'Vue', 'Svelte', 'Angular',
  'FastAPI', 'Django', 'Flask', 'Express', 'Fastify', 'Hono',
  'Spring Boot', '.NET', 'Rails',
  'TailwindCSS', 'Prisma', 'Drizzle', 'SQLAlchemy',
  'PyTorch', 'TensorFlow', 'pandas', 'scikit-learn',
];

const STYLES = [
  'Functional, small functions, strict types',
  'Object-oriented, clean classes',
  'Pragmatic — whatever gets the job done cleanly',
  'Performance-first — micro-optimizations matter here',
  'Readability-first — code is for humans',
];

/**
 * Run the onboarding interview.
 * @param {Partial<import('./profiler.js').UserProfile>} detected - what we already found
 * @returns {Promise<OnboardingAnswers>}
 */
export async function runOnboarding(detected = {}) {
  console.log('');
  console.log(chalk.cyan.bold('  Quick setup — 5 questions to personalize your brain vault'));
  console.log(chalk.gray('  Takes about 60 seconds. You can edit the vault anytime after.\n'));

  const name = await input({
    message: 'Your name (shown in vault notes):',
    default: '',
  });

  const role = await select({
    message: 'Your role:',
    default: detected.detectedRole || 'Full-Stack Developer',
    choices: ROLES.map(r => ({ value: r })),
  });

  const languages = await checkbox({
    message: 'Primary languages (space to select, enter to confirm):',
    choices: LANGUAGES.map(l => ({
      value: l,
      checked: (detected.languages || []).includes(l),
    })),
    validate: (v) => v.length > 0 || 'Pick at least one',
  });

  const frameworks = await checkbox({
    message: 'Frameworks / tools you use regularly:',
    choices: FRAMEWORKS.map(f => ({
      value: f,
      checked: (detected.frameworks || []).includes(f),
    })),
  });

  const style = await select({
    message: 'Your coding style:',
    choices: STYLES.map(s => ({ value: s })),
  });

  const packageManager = await select({
    message: 'Default package manager:',
    default: 'pnpm',
    choices: ['pnpm', 'npm', 'yarn', 'bun', 'N/A'].map(v => ({ value: v })),
  });

  const currentWork = await input({
    message: 'What are you currently working on? (one line — agents will see this every session)',
    default: '',
    transformer: (v) => v || '(skipped)',
  });

  const agentRules = await input({
    message: 'One rule every AI agent must follow (e.g. "never add comments", "always verify before reporting done"):',
    default: 'Finish tasks completely — verify before reporting done',
  });

  console.log('');
  return { name, role, languages, frameworks, style, packageManager, currentWork, agentRules };
}

/**
 * Decide whether onboarding is needed.
 * Run if the profile is sparse (few projects, no role detected).
 * @param {import('./profiler.js').UserProfile} profile
 * @returns {boolean}
 */
export function shouldRunOnboarding(profile) {
  return profile.projects.length < 2 || !profile.detectedRole || profile.languages.length === 0;
}
