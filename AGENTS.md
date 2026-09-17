# Repository Guidelines

## Project Structure & Module Organization

This wardriving application uses React 19, TypeScript, Vite, Tailwind CSS, Leaflet maps, and Recharts. `src/main.tsx` is the entry point; `src/pages/` contains user and admin screens. Shared UI lives in `src/components/`, with map, analysis, admin, and UI subdirectories. Use `src/layouts/` for page shells, `src/context/` for shared Wi-Fi state, `src/utils/` for parsing and analysis, and `src/type/wifi.ts` for Wi-Fi types. Imported assets live in `src/assets/`; directly served CSV and JSON files live in `public/`. Root-level `server.js` provides the Express game-results API.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev:all`: start Vite on port 5173 and the API on port 3001.
- `npm run dev` / `npm run server`: start either service separately.
- `npm run build`: run TypeScript project checks and generate `dist/` with Vite.
- `npm run lint`: run the configured ESLint checks.
- `npm run preview`: serve the production frontend build locally; start the API separately when needed.

See `GAME_SETUP.md` for game workflow and API details.

## Coding Style & Naming Conventions

Follow the surrounding file: frontend code generally uses two-space indentation; `server.js` uses four spaces. Preserve local quote and semicolon conventions. Use PascalCase for React components, camelCase for functions and variables, and `use` prefixes for hooks. Existing UI primitives use lowercase or kebab-case filenames. Prefer `@/` imports for modules under `src/`. Keep strict TypeScript compatibility and follow ESLint's React Hooks and React Refresh rules. No formatter is configured.

## Testing Guidelines

No automated test runner, test script, or coverage threshold is configured. Before submitting, run lint and build, report any failures, and manually exercise affected map filters, CSV loading, charts, or game flows. For game changes, check result persistence and dashboard display. Keep local test results out of commits to `public/json/result.json`.

## Commit & Pull Request Guidelines

History uses short, informal subjects such as `update chart`; no enforced commit format is evident. Write concise, descriptive subjects identifying the affected feature. PRs should explain behavior changes, link relevant issues, list validation performed, and include screenshots for visual changes. Call out API or dataset changes explicitly.
