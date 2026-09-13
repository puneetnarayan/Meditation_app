# Meditation App

A calm, modern meditation web app (React + TypeScript + Vite), designed to
run as a PWA and deploy to Vercel. See `MEDITATION_APP_MASTER_SPEC.md` (if
present) for the full product/architecture specification.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run format` / `npm run format:check` — run/check Prettier
- `npm test` — run the Vitest suite once
- `npm run test:watch` — run Vitest in watch mode

## Environment variables

Copy `.env.example` to `.env` and fill in client-safe (`VITE_`-prefixed)
values only. Server-only secrets must never use the `VITE_` prefix and
must never be committed.

## Project structure

```text
src/
├── components/   UI components, grouped by domain
├── pages/        route-level screens
├── layouts/      shared page layouts
├── hooks/        reusable React hooks
├── services/     external integrations (audio, database, auth, analytics)
├── engines/      framework-agnostic business logic (meditation, breathing, audio)
├── store/        app state
├── data/         static/mock content data
├── types/        shared TypeScript types
├── utils/        pure utility functions
├── config/       app configuration (env, constants)
└── styles/       design tokens and global styles
```
