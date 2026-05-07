# Contributing to ai-brain

Thanks for wanting to make this better. Here's how.

## Quick wins

- **New stack template** — does your framework not get detected or generate a great CLAUDE.md? Add it.
- **New AI agent** — does your agent use a config file we don't generate? Add a wirer.
- **Better profiler detection** — improve git repo scanning or AI tool detection on your OS.
- **Bug fixes** — open issues are tagged `good first issue`.

## How to add a project template

1. Create `src/templates/<name>.md` — use these placeholders:
   - `{{PROJECT_NAME}}` — repo name
   - `{{PACKAGE_MANAGER}}` — npm / pnpm / yarn / bun
   - `{{EXTRA_STACK}}` — detected sub-dependencies (e.g. "Prisma, tRPC, Tailwind")
   - `{{PYTHON}}` — Python interpreter path (Python templates only)
   - `{{GO_MODULE}}` — Go module name (Go templates only)

2. Add detection in `src/scanner.js` — return `{ template: '<name>', label: 'Human Label' }` when the project matches.

3. Add an example output at `examples/<name>/CLAUDE.md`.

4. List it in the README template table.

## How to add a new AI agent

1. Add a generator function in `src/wirer.js`:
   ```js
   export function generateMyAgentConfig(projectDir, content) {
     const filePath = join(projectDir, '.myagentconfig');
     if (existsSync(filePath)) return { file: '.myagentconfig', created: false };
     writeFileSync(filePath, content, 'utf8');
     return { file: '.myagentconfig', created: true };
   }
   ```

2. Call it from `generateAllProjectConfigs()` in the same file.

3. Add a row to the README agent config table.

## How to add a new global agent wiring

Global wiring writes to `~/<agent-config>` and makes the agent read the brain vault on every session.

1. Add a function in `src/wirer.js` similar to `generateGeminiMd()`.
2. Call it from `runSetup()` in `src/setup.js`.
3. Add a row to the README global wiring table.

## Dev setup

```bash
git clone https://github.com/ItsWambarYT/ai-brain
cd ai-brain
npm install
node bin/ai-brain.js --dry-run   # preview without writing files
node bin/ai-brain.js scan        # see what gets detected in the current dir
```

## Guidelines

- Keep it zero-config. Auto-detect; never require manual JSON editing.
- No source code scanning. The profiler reads only metadata and dep lists.
- Preserve privacy. Everything stays local — no network calls except `npx` itself.
- Test your template against a real project before PRing.

## Reporting bugs

Use [GitHub Issues](https://github.com/ItsWambarYT/ai-brain/issues/new?template=bug_report.md). Include:
- OS + Node version (`node --version`)
- Command you ran
- Full terminal output (paste it, don't screenshot)
