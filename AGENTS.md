# Repository Guidelines

## Project Structure & Module Organization

NAWO is a split frontend/backend event-ticketing platform. The React/TanStack Router client is in `frontend/`: routes live in `frontend/src/routes/`, reusable UI in `frontend/src/components/`, shared logic in `frontend/src/lib/` and `frontend/src/hooks/`, and static assets in `frontend/public/` or `frontend/src/assets/`. End-to-end tests are under `frontend/tests/e2e/`. The Laravel 10 API is in `backend/`: application code is under `backend/app/`, HTTP routes under `backend/routes/`, database migrations, factories, and seeders under `backend/database/`, and PHPUnit tests under `backend/tests/`. Deployment and database helpers are in the repository root (`compose*.yaml`, `scripts/`); production Dockerfiles and Nginx configuration are in `docker/`.

## Build, Test, and Development Commands

Run frontend commands from `frontend/`:

- `npm run dev` starts the Vite development server.
- `npm run api:dev` starts Laravel locally on `127.0.0.1:8000`.
- `npm run db:up` / `npm run db:down` starts or stops the Compose MySQL service.
- `npm run build` creates the production frontend build; `npm run typecheck` checks TypeScript.
- `npm run lint` runs ESLint; `npm run format` applies Prettier.
- `npm run test:api` runs backend PHPUnit tests, while `npm run test:e2e` runs Playwright browser tests.

For backend-only work, use `cd backend && php artisan test`; run migrations with `php artisan migrate` after configuring `.env` from `.env.example`.

## Coding Style & Naming Conventions

Use two-space indentation for TypeScript/TSX and follow existing Prettier/ESLint rules. Name React components in PascalCase, hooks as `use-*.ts(x)`, route files according to TanStack Router conventions, and utility functions in camelCase. Follow Laravel conventions: PascalCase classes, camelCase methods, and singular model names. Keep API-facing changes coordinated between frontend clients/types and backend routes/controllers.

## Testing Guidelines

Add PHPUnit coverage in `backend/tests/Feature` for API behavior and `backend/tests/Unit` for isolated logic. Name browser tests `*.spec.ts` in `frontend/tests/e2e/`. Run focused tests during development, then the API and end-to-end suites before opening a PR. No repository-wide coverage threshold is currently documented.

## Commit & Pull Request Guidelines

Existing history uses short imperative or descriptive subjects, though consistency varies (for example, `move frontend` and `Add project README`). Keep new commits concise and specific, such as `Fix ticket scan validation`. PRs should explain the behavior change, identify migrations or configuration updates, link related issues, and include screenshots or test evidence for UI changes. Call out any required `.env` or Docker setup explicitly.

## Security & Configuration

Never commit secrets or local `.env` files. Update `.env.example` when adding required configuration, and review authentication, payment, ticket QR-code, and withdrawal changes with extra care.
