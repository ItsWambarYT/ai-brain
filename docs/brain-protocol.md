# The Brain Protocol

The brain protocol is a lightweight convention that turns Obsidian into persistent memory for AI coding agents.

## Core Idea

Claude has no memory across sessions by default. Every new `claude` session starts blank. The brain protocol solves this by having Claude:

1. **Read** a daily note on session start
2. **Write** a summary of every exchange to that note
3. **Create** topic notes for new subjects with `[[wikilinks]]`
4. **Index** everything in `Home.md`

Over time, the vault becomes a dense knowledge graph of your preferences, past decisions, project history, and technical notes — all readable by Claude without any extra setup.

## File Structure

```
ClaudeBrain/
  Home.md           # Master index (Claude keeps this updated)
  Daily/
    YYYY-MM-DD.md   # One file per day — session logs + wikilinks
  Sessions/         # Longer notes for complex multi-session tasks
  Skills/           # How-to notes per technology
  <TopicName>.md    # One note per topic/project/concept
```

## Daily Note Format

```markdown
# 2024-01-15

## Sessions

### Session 1 — Fixed auth bug in UserService

Root cause: JWT expiry was not being validated server-side.
Fixed `lib/auth.ts:validateToken()` to check `exp` claim.
[[AuthRefactor]] — see full notes there.

### Session 2 — Added dark mode

Used `next-themes` with system preference default.
[[DarkMode]]

## Topic Nodes

- [[AuthRefactor]]
- [[DarkMode]]
```

## Topic Note Format

```markdown
# AuthRefactor

## Status

Completed 2024-01-15.

## What Changed

- `lib/auth.ts` — added JWT expiry validation
- `middleware.ts` — added 401 response for expired tokens

## Decision Log

Chose server-side validation over client-side to prevent token replay attacks.
```

## What Claude Does Automatically

When the brain is wired via `~/.claude/CLAUDE.md`, Claude will:

- Read today's note at session start (even if it has to create it)
- Append a session summary after each meaningful exchange
- Create a `TopicName.md` for any new project, bug, or concept
- Add `[[TopicName]]` to the daily note's Topic Nodes section
- Add the topic to `Home.md`'s index

## What You Get

After a few weeks of use, your vault contains:
- A searchable log of every decision and fix
- A network of linked concepts (the Obsidian graph view is remarkable)
- Context that lets Claude immediately understand what you were working on last time
- Notes about your preferences that Claude carries into every new session

## Customization

You can add any notes you want to the vault. Claude will read them if they're linked from `Home.md` or the daily note. Good things to add:

- `Skills/React.md` — your React patterns and preferences
- `Skills/DatabaseMigrations.md` — your migration workflow
- `Me.md` — your background, preferred stack, current projects
- `Architecture.md` — how your main project is structured
