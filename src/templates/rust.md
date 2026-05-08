# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a Rust project.{{BRAIN_SNIPPET}}

## Architecture

- **Language:** Rust (edition 2021+){{EXTRA_STACK}}
- **Build:** Cargo workspace conventions

## Directory Structure

```
src/
  main.rs               # Binary entry point
  lib.rs                # Library root (if applicable)
  bin/                  # Additional binaries
  modules/              # Feature modules
tests/                  # Integration tests
benches/                # Criterion benches
Cargo.toml              # Manifest
Cargo.lock              # Pinned dependency graph
```

## Coding Standards

- **Edition 2021+**, MSRV declared in `Cargo.toml`. Avoid nightly features in stable crates.
- **Errors:** library code returns `Result<T, ThisError>` with a `thiserror`-derived enum; binaries
  use `anyhow::Result` and wrap with `.context()` at boundaries.
- **No `unwrap()` / `expect()` in non-test code** unless the invariant is documented in a comment
  on the same line.
- **Async:** `tokio` runtime; prefer `tokio::spawn` over manual `JoinSet` unless ordering matters.
- **Lifetimes:** prefer owned types in public APIs unless the lifetime makes the call site clearer.
  Avoid lifetime-elided closures crossing `await` points (compiler will reject; structure code so
  borrows don't span yield points).
- **Visibility:** default to `pub(crate)`; promote to `pub` only when the API is intentional.
- **Clippy:** treat `clippy::all` and `clippy::pedantic` warnings as errors in CI; allow specific
  lints case-by-case with `#[allow(clippy::lint_name)]` and a one-line reason.

## Testing

- Unit tests live in `#[cfg(test)] mod tests` next to the code they cover.
- Integration tests in `tests/` — one binary per file, `use crate_name::*` to import.
- Use `assert_eq!` / `assert!` with custom messages for non-trivial failures.
- Benchmarks: `criterion` via `benches/*.rs`, run with `cargo bench`.
- Run: `cargo test --all-features --workspace`. CI also runs `cargo test --no-default-features`.

## Common Commands

```bash
cargo build                  # debug build
cargo build --release        # optimized
cargo run -- <args>          # run main binary
cargo test                   # unit + integration
cargo clippy --all-targets --all-features -- -D warnings
cargo fmt --all              # rustfmt
cargo doc --open             # generate + open docs
cargo update                 # refresh Cargo.lock
```

## Things to Avoid

- `unsafe` blocks without a `// SAFETY:` comment naming the invariant being upheld
- `Arc<Mutex<T>>` when `tokio::sync::RwLock` or a channel fits better
- `.clone()` to silence the borrow checker — restructure ownership instead
- Panics in library code; binaries may panic at startup but never on a hot path
- `eprintln!` for logging — use the `tracing` or `log` crate so consumers can filter
- Dependencies on un-versioned `git = "..."` sources unless absolutely necessary; pin via tag
