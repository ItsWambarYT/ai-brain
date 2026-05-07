# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a React application built with Vite.{{BRAIN_SNIPPET}}

## Architecture

- **Framework:** React 18+
- **Build tool:** Vite
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS{{EXTRA_STACK}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Directory Structure

```
src/
  components/           # Shared UI components
    ui/                 # Primitives (button, input, card…)
  pages/                # Route-level components
  hooks/                # Custom React hooks
  stores/               # Global state (Zustand / Jotai)
  lib/                  # Utilities and API clients
  types/                # TypeScript types and interfaces
  assets/               # Static assets imported by code
public/                 # Files served as-is (favicon, etc.)
```

## Coding Standards

- TypeScript strict mode — no `any`, explicit return types on exported functions
- Function components only — no class components
- Hooks follow `use` prefix naming convention
- Props interfaces defined inline above the component or in a co-located `types.ts`
- File naming: PascalCase for components (`UserCard.tsx`), camelCase for utils (`formatDate.ts`)
- Absolute imports via `@/` alias — never `../../` more than two levels deep

## State Management

- Local state: `useState` / `useReducer`
- Async server state: React Query (`@tanstack/react-query`) — use `queryClient.invalidateQueries` after mutations
- Global app state: Zustand slices — keep stores focused; avoid mega-stores
- URL state for filters/pagination: `useSearchParams`

## API Layer

- All API calls in `src/lib/api/` — typed with Zod schemas
- Use `fetch` wrapped in a typed helper that throws on non-2xx
- Never put API base URLs in components — use `import.meta.env.VITE_*`
- Handle loading, error, and empty states explicitly in every data-fetching component

## Styling

- Tailwind utility classes — no inline styles, no CSS-in-JS
- Component variants via `cva` (class-variance-authority) or `clsx`/`cn` helper
- Responsive-first: mobile classes baseline, `sm:` / `md:` / `lg:` overrides
- Animations: Framer Motion for complex; Tailwind `transition-*` for simple

## Testing

- Unit/component tests: Vitest + React Testing Library
- Mock API calls with `msw` (Mock Service Worker)
- Run: `{{PACKAGE_MANAGER}} run test`

## Performance

- Code-split routes: `lazy` + `Suspense` with a skeleton fallback
- Images: use `vite-imagetools` or pre-optimize — never raw PNG > 200 KB in src
- Bundle size: run `{{PACKAGE_MANAGER}} run build -- --analyze` to check

## Environment Variables

- `.env.local` for local (never commit)
- All public vars prefixed `VITE_`
- Validate with Zod at app startup

## Common Commands

```bash
{{PACKAGE_MANAGER}} run dev          # start dev server
{{PACKAGE_MANAGER}} run build        # production build
{{PACKAGE_MANAGER}} run preview      # preview production build
{{PACKAGE_MANAGER}} run lint         # ESLint
{{PACKAGE_MANAGER}} run type-check   # tsc --noEmit
{{PACKAGE_MANAGER}} run test         # Vitest
```
