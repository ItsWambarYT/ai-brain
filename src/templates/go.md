# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a Go project.{{BRAIN_SNIPPET}}

## Architecture

- **Language:** Go 1.21+
- **Module:** {{GO_MODULE}}{{EXTRA_STACK}}

## Directory Structure

```
cmd/
  {{PACKAGE_SLUG}}/
    main.go             # Entry point
internal/               # Private packages (not importable externally)
  server/               # HTTP server setup
  handler/              # Request handlers
  service/              # Business logic
  store/                # Database access layer
  model/                # Domain types
pkg/                    # Public packages (importable by other modules)
api/                    # OpenAPI specs / protobuf definitions
migrations/             # SQL migration files
config/                 # Configuration loading
scripts/                # Build and deploy scripts
```

## Coding Standards

- No named return values (confusing) — use explicit returns
- All errors wrapped with context: `fmt.Errorf("loading user %d: %w", id, err)`
- No `panic` in library code — return errors
- Context propagation: every function that does I/O takes `ctx context.Context` as first arg
- Interfaces defined in the package that uses them, not the package that implements them
- Struct fields in consistent order: IDs first, then data, then metadata (created_at, updated_at)
- Use `//nolint:...` sparingly and always with a reason comment

## Error Handling

- Sentinel errors with `errors.Is` / `errors.As` for expected failures
- Custom error types when callers need to branch on error type
- Never ignore errors — `_ = fn()` is forbidden except for `io.Close` defers

## HTTP / Web

- Middleware chain: logging → tracing → auth → rate-limit → handler
- Always set read/write timeouts on `http.Server`
- Use structured JSON logging with `slog` (stdlib) or `zerolog`
- Return consistent error shape: `{"error": "message", "code": "ERROR_CODE"}`

## Database

- Always use parameterized queries — never `fmt.Sprintf` into SQL
- Connection pool: set `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`
- Transactions: always `defer tx.Rollback()` + check error on `tx.Commit()`

## Testing

- Table-driven tests with `t.Run` for subtests
- Use `testify/assert` for readable assertions
- Integration tests in `_test` package to test exported API only
- Run: `go test ./...`
- Race detector in CI: `go test -race ./...`

## Common Commands

```bash
go run ./cmd/{{PACKAGE_SLUG}}/     # run locally
go build ./cmd/{{PACKAGE_SLUG}}/   # build binary
go test ./...                      # all tests
go test -race ./...                # race detector
go vet ./...                       # static analysis
golangci-lint run                  # linting
go mod tidy                        # clean up go.mod/go.sum
```
