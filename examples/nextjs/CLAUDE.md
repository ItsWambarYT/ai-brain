# My SaaS App — Claude Instructions

## Project Overview

My SaaS App is a Next.js application.

## Brain Vault

On every session start, read today's daily note from your brain vault:

```
~/ClaudeBrain/Daily/YYYY-MM-DD.md
```

## Architecture

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **RPC:** tRPC
- **ORM:** Prisma
- **Auth:** NextAuth / Auth.js
- **Server state:** TanStack Query
- **Package manager:** pnpm

## Directory Structure

```
app/                    # App Router pages and layouts
  (auth)/               # Route groups
  api/                  # API routes (Route Handlers)
components/             # Shared React components
  ui/                   # Primitives (button, input, card…)
lib/                    # Utilities, helpers, shared logic
hooks/                  # Custom React hooks
types/                  # Global TypeScript types
public/                 # Static assets
```

## Coding Standards

- TypeScript strict mode — no `any`, explicit return types on all functions
- React Server Components by default; add `"use client"` only when needed
- Co-locate component, test, and styles: `components/foo/Foo.tsx`, `Foo.test.tsx`, `foo.module.css`
- Name files with the component they export (`UserCard.tsx` not `card.tsx`)
- Imports: external → internal (absolute `@/`) → relative — never mix `../` escaping with `@/`
- No barrel re-exports (`index.ts`) — import directly from the file

## State & Data

- Server state via React Server Components and Server Actions first
- Client mutations via `useOptimistic` + Server Actions
- Global client state: Zustand with slices — keep stores small
- Data fetching: `fetch` with `cache` / `revalidate` options in RSC; React Query in Client Components for real-time

## API Routes

- Route Handlers in `app/api/` — always type request and response with Zod schemas
- Validate every input at the boundary — never trust client data
- Return consistent shape: `{ data, error, meta }`
- Rate-limit public endpoints

## Performance Rules

- Images: always `<Image>` with explicit `width`/`height` or `fill` + `sizes`
- Fonts: `next/font` only — no external font CDN links
- Dynamic imports for heavy components: `dynamic(() => import(…), { ssr: false })`
- Minimize `"use client"` — push state down; keep layouts as RSC

## Testing

- Unit tests: Vitest + React Testing Library
- E2E tests: Playwright — test the happy path and auth flows
- Run before every commit: `pnpm run test`

## Environment Variables

- All vars in `.env.local` (never commit)
- Public vars prefixed `NEXT_PUBLIC_`
- Validate at startup with `@t3-oss/env-nextjs` or Zod

## Common Commands

```bash
pnpm run dev          # start dev server (localhost:3000)
pnpm run build        # production build
pnpm run lint         # ESLint
pnpm run type-check   # tsc --noEmit
pnpm run test         # unit tests
pnpm run test:e2e     # Playwright
```

## Key Files

- `app/layout.tsx` — root layout, fonts, metadata, providers
- `app/(auth)/` — authentication pages
- `middleware.ts` — auth guards, redirects
- `lib/db.ts` — database client singleton
- `lib/auth.ts` — auth config
- `next.config.ts` — Next.js config
