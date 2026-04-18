# Project Guidelines

## Code Style
- Use TypeScript with strict typing enabled. Follow existing patterns in app files.
- Use the App Router conventions already present in `app/layout.tsx` and `app/page.tsx`.
- Keep imports and path aliases aligned with `@/*` from `tsconfig.json`.
- Run lint before finishing work: `npm run lint`.

## Architecture
- Framework: Next.js 16 App Router with React 19.
- Layout and global setup live in `app/layout.tsx`.
- Route-level UI starts in `app/page.tsx` and additional routes should follow `app/<route>/page.tsx`.
- Global styles and theme variables live in `app/globals.css`.
- Static assets belong in `public/`.

## Build And Test
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Create production build: `npm run build`
- Start production server: `npm run start`
- Run lint checks: `npm run lint`

Note: no test runner is currently configured in this workspace.

## Conventions
- This project uses Next.js 16.2.4 and may differ from older Next.js APIs and patterns.
- Before implementing framework-specific changes, check relevant docs under `node_modules/next/dist/docs/` and watch for deprecations.
- Tailwind CSS v4 is configured via `@tailwindcss/postcss` and `@import "tailwindcss"`; keep styling compatible with current setup.
- Prefer linking to docs rather than duplicating them. For onboarding and general framework context, see `README.md`.
