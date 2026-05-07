# My API — Claude Instructions

## Project Overview

My API is a Python backend API built with FastAPI.

## Architecture

- **Framework:** FastAPI
- **Language:** Python 3.11+ with strict type hints
- **ORM:** SQLAlchemy (async) / Alembic migrations
- **Containers:** Docker
- **Package manager:** uv

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

## Authentication

- JWT access tokens (short expiry) + refresh tokens (long expiry, stored hashed in DB)
- Hash passwords with `bcrypt` via `passlib`
- Auth dependency: `current_user: User = Depends(get_current_user)`

## Testing

- Run: `pytest -v`
- Use `pytest-asyncio` with `asyncio_mode = "auto"` in `pytest.ini`

## Common Commands

```bash
python3 -m uvicorn main:app --reload       # dev server
python3 -m pytest -v                       # tests
alembic upgrade head                       # run migrations
alembic revision --autogenerate -m "msg"   # generate migration
python3 -m ruff check . --fix             # linting
python3 -m mypy app/                      # type checking
```
