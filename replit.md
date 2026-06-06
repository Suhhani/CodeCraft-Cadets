# Procuris — Procurement Management System

A full-stack procurement platform for enterprise finance teams and vendors. Manage the complete procurement lifecycle: RFQs, quotations, approvals, purchase orders, and invoices, with role-based access for Procurement Officers and Vendors.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/procurement-app run dev` — run the frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed, `@clerk/react` + `@clerk/express`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, react-hook-form, TanStack Query
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle schema files (source of truth for DB shape)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated TanStack Query hooks & Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/procurement-app/src/pages/` — React page components (one folder per domain)
- `artifacts/procurement-app/src/components/` — Shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React hooks. Never write fetch calls manually.
- Clerk handles auth entirely client-side; backend validates via `@clerk/express` middleware. JIT user provisioning in `GET /api/auth/me`.
- Role-based access (`procurement_officer` | `vendor`) stored in local `users` table, not Clerk metadata.
- Counter-based PO/RFQ/Invoice numbers (in-memory, resets on restart) — acceptable for MVP.
- Activity logs are written inline in route handlers (no separate event bus).

## Product

- **Login/Signup** — Clerk-powered branded auth
- **Dashboard** — KPI metrics, recent activity, quick actions
- **Vendor Management** — Register, view, edit, rate vendors
- **RFQ Creation** — Create requests for quotation with line items and vendor assignment
- **Quotation Submission** — Vendors submit priced quotations against open RFQs
- **Quotation Comparison** — Side-by-side comparison highlighting lowest price & fastest delivery
- **Approval Workflow** — Procurement officers approve/reject RFQs, POs, and quotations
- **PO & Invoice Generation** — Create purchase orders from winning quotes; generate invoices from POs
- **Activity Logs** — Full chronological audit trail of all system actions
- **Reports & Analytics** — Spending summary, vendor performance, monthly trends with Recharts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after changing schema files in `lib/db/src/schema/`.
- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Do NOT run `pnpm dev` at the workspace root — use workflow restart or `pnpm --filter` instead.
- Clerk proxy path is `/clerk` — the `clerkProxyMiddleware` in `api-server` handles forwarding.
- `publishableKeyFromHost` must be used instead of the raw env var when constructing the Clerk publishable key.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/references/setup-and-customization.md` for Clerk wiring details
