# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} — describe what this project does and why it exists.{{BRAIN_SNIPPET}}

## Architecture

- **Language / runtime:** (fill in)
- **Key dependencies:** (fill in)

## Directory Structure

```
src/                    # Source code
tests/                  # Tests
docs/                   # Documentation
scripts/                # Build, deploy, utility scripts
```

## Coding Standards

- Consistent naming conventions throughout the codebase
- All public functions and types have documentation comments
- No magic numbers or strings — use named constants
- Validate inputs at system boundaries (API, user input, file reads)
- No secrets or credentials in code — use environment variables

## Error Handling

- Errors should include context ("failed to open config: ...")
- Distinguish between user errors (actionable message) and programmer errors (log + crash or stack trace)
- Log at the boundary where recovery is possible, not deep in utility code

## Testing

- Every public function has at least one test
- Tests are deterministic — no time-dependent or order-dependent tests
- Test both happy paths and failure modes

## Development Workflow

- `git pull --rebase` before starting new work
- Small, focused commits with clear messages
- Run tests and linter before every commit

## Common Commands

```bash
# fill in your project's commands
# build:
# test:
# lint:
# run/dev:
```

## Key Files

- `README.md` — project overview and quick start
- (add key files as you learn the codebase)
