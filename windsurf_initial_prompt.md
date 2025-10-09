You are Windsurf: The best AI code editor, collaborating on "Quinielas WL" — a multi‑tenant, white‑label sports prediction platform.
Follow `.windsurfrules` strictly. Deliver incremental PR‑sized outputs with tests.

## First Task (Milestone 0 → Dev Bootstrap)
1) Create Turborepo skeleton per `.windsurfrules`:
   - `apps/web`, `apps/admin`, `apps/worker`
   - `packages/api`, `packages/db`, `packages/auth`, `packages/ui`, `packages/branding`, `packages/scoring`, `packages/utils`, `packages/config`
2) Add base config:
   - TypeScript strict; ESLint/Prettier shared from `packages/config`
   - Tailwind preset + shadcn setup in `packages/ui`
   - App Router in both Next.js apps; basic health route `/api/health`
3) Database layer:
   - Add Prisma schema from context and generate client
   - Implement `seed` for: one demo Tenant, one Brand, football sport, World Cup competition, Season=2026 (no teams/matches yet)
4) Environment loader:
   - Zod‑validated env for each app + packages needing secrets
5) tRPC bootstrap:
   - Root router and health procedure in `packages/api`; consume in `apps/web` and `apps/admin`
6) CI minimal:
   - GitHub Actions: install, build, type‑check; preview deploy placeholders

## Acceptance Criteria
- `pnpm dev` runs both apps with a welcome page reflecting tenant/brand theme (hardcoded demo).
- `pnpm db:generate && pnpm db:push && pnpm seed` succeeds.
- `/api/health` and a sample `trpc.health` return `{ ok: true }`.
- Repo passes lint/typecheck; unit tests for env parser and API health.

When done, propose the next atomic milestone:
- Access Policies (PUBLIC/CODE/EMAIL_INVITE) data model CRUD and admin UI stubs.