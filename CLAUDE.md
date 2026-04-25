# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite, HMR)
npm run build    # Type-check (tsc -b) then bundle
npm run lint     # ESLint with TypeScript rules
npm run preview  # Preview production build locally
```

No test suite exists in this project.

## Environment Variables

Three variables are required (create a `.env.local`):

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

### Auth & Data Flow

Authentication uses **Clerk**. After sign-in, `App.tsx` fetches a short-lived JWT via `session.getToken({ template: 'supabase' })` and passes it to both Zustand stores via `setToken()`. Each store module-level variable `_client` is then replaced with an auth-enabled Supabase client (see `src/lib/supabase.ts: createAuthClient`). This authenticated client is used for all subsequent queries so that Supabase **Row Level Security** policies (which validate `auth.jwt() ->> 'sub'`) are satisfied.

The Clerk `user.id` is stored as `user_id` in the database and is also used as a filter in every query as a defence-in-depth measure alongside RLS.

### Routing

**There is no React Router in use** despite `react-router-dom` being installed. Navigation is managed entirely by a `page` state (`useState<Page>`) in `App.tsx`. Pages are rendered conditionally, and navigation happens by calling `setPage()` passed down as `onNavigate`. URLs do not reflect the current page.

### State Management

Two Zustand stores:

- `useFinanceStore` — all `Transaction` CRUD + loading state
- `useCartaoStore` — all `Cartao` CRUD

Both stores apply **optimistic updates**: state is updated immediately, then the Supabase call is made. On error, the previous state is restored via rollback. Neither store is persisted to `localStorage`.

### Database Schema

Two main tables managed via **Flyway** migrations in `db/migrations/`:

**`transactions`** — `id`, `user_id`, `type` (`income`|`expense`), `description`, `amount`, `category`, `date`, `created_at`, `parcela` (e.g. `"01/12"`), `data_fatura`, `cartao`

**`cartoes`** — `id`, `user_id`, `nome`, `created_at`

Migrations follow the Flyway naming convention `V{n}__{description}.sql`. Applied versions are tracked automatically in `flyway_schema_history`. The CI pipeline runs `flyway migrate` on every push to `main`; the Docker image `flyway/flyway:10` is used (no local Flyway install needed in CI).

**Adding a new migration:** create `db/migrations/V{next}__{description}.sql`. Flyway applies it on the next deploy. Never edit an already-applied migration file — Flyway validates checksums and will reject it.

**Secrets required in GitHub Actions:**
- `SUPABASE_DB_HOST` — e.g. `db.xxxx.supabase.co`
- `SUPABASE_DB_PASSWORD` — database password from Supabase dashboard

### Key Patterns

**Parcelas (installments):** A purchase split into N installments is stored as N separate `Transaction` rows. They are linked only by matching `description` + `cartao` + `amount * N`. The `parcela` field stores the label (e.g. `"03/12"`). Grouping logic lives in `src/pages/Parcelas.tsx`.

**`date` vs `data_fatura`:** `date` is the transaction/purchase date; `data_fatura` is the credit card billing date. The Dashboard has a toggle between these two modes for filtering.

**CSV Import:** `src/pages/ImportarCSV.tsx` handles parsing with PapaParse, detects installment patterns in descriptions (`\d{2}/\d{2}` suffix), infers year from the selected billing month, and batch-inserts via `addTransactions()`.

**Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin) plus CSS custom properties defined in `src/index.css` (`--bg`, `--surface`, `--accent`, `--accent2`, `--text`, `--muted`, `--border`). Many components mix Tailwind classes with inline `style` objects referencing these CSS variables.

### CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`:
1. Runs Flyway migrations via Docker (`flyway/flyway:10`) against the Supabase PostgreSQL database
2. Builds the app with production env vars from GitHub Secrets
3. Deploys to GitHub Pages at `/App-financeiro/` (matches `vite.config.ts base`)
