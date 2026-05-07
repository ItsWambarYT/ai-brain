# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a Python backend API built with FastAPI.{{BRAIN_SNIPPET}}

## Architecture

- **Framework:** FastAPI
- **Language:** Python 3.11+ with strict type hints
- **ORM:** SQLAlchemy (async) / Alembic migrations{{EXTRA_STACK}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Directory Structure

```
app/
  api/
    v1/
      routes/           # One file per resource (users.py, items.py)
      deps.py           # Shared FastAPI dependencies (auth, db)
  core/
    config.py           # Settings via pydantic-settings
    security.py         # JWT, password hashing
  db/
    session.py          # Async SQLAlchemy engine + session factory
    base.py             # Base model class
    models/             # SQLAlchemy ORM models
  schemas/              # Pydantic request/response schemas
  services/             # Business logic (no DB calls in routes)
  tests/
    conftest.py         # Fixtures (test DB, test client)
    api/                # Route tests
    services/           # Unit tests
main.py                 # App factory + lifespan + router mounting
alembic/                # Migration files
```

## Coding Standards

- All functions have full type annotations — no `Any` except in generic helpers
- No bare `except:` — always catch specific exception types
- Async all the way down — `async def` for all route handlers and DB calls
- Dependency injection via FastAPI `Depends()` — never import db session directly in routes
- Validate all input with Pydantic schemas; never pass raw dicts between layers
- Services contain business logic; routes only parse request, call service, return response
- Never put secrets in code — use `pydantic-settings` with `.env`

## Database

- Async sessions: `async with AsyncSessionLocal() as session:`
- Never call `session.commit()` inside a service — commit in the route or a transaction helper
- Migrations: `alembic revision --autogenerate -m "description"` then `alembic upgrade head`
- Soft-delete pattern: `deleted_at` timestamp column, never hard-delete user data

## Authentication

- JWT access tokens (short expiry) + refresh tokens (long expiry, stored hashed in DB)
- Hash passwords with `bcrypt` via `passlib`
- Auth dependency: `current_user: User = Depends(get_current_user)`
- Role checks: `Depends(require_role("admin"))`

## Error Handling

- Raise `HTTPException` in routes for client errors (400, 404, 403)
- Create custom exception classes for domain errors; map them to HTTP in an exception handler
- All 500 errors logged with `structlog` including request ID

## Testing

- Run: `pytest -v`
- Use `pytest-asyncio` with `asyncio_mode = "auto"` in `pytest.ini`
- Test DB: SQLite in-memory or a dedicated test Postgres via `pytest-postgres`
- Every route has at least one happy-path and one auth-failure test

## Common Commands

```bash
{{PYTHON}} -m uvicorn main:app --reload       # dev server
{{PYTHON}} -m pytest -v                       # tests
{{PYTHON}} -m pytest --cov=app --cov-report=term-missing  # with coverage
alembic upgrade head                          # run migrations
alembic revision --autogenerate -m "msg"      # generate migration
{{PYTHON}} -m ruff check . --fix              # linting
{{PYTHON}} -m mypy app/                       # type checking
```

## Environment Variables

Store in `.env`, loaded by `pydantic-settings`:

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname
SECRET_KEY=...
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
```
