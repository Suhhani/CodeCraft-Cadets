# Architecture Overview

## High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React + Vite SPA  (procurement-app)          │   │
│  │  Clerk SDK  │  TanStack Query  │  shadcn/ui           │   │
│  └──────────────────┬──────────────────────────────────┘   │
└─────────────────────│───────────────────────────────────────┘
                      │  HTTP (REST)
┌─────────────────────▼───────────────────────────────────────┐
│             Reverse Proxy  (Replit shared proxy)             │
│   /         → procurement-app   /api      → api-server       │
│   /clerk    → Clerk Frontend API (proxied)                   │
└──────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Express 5 API Server  (api-server)              │
│                                                              │
│   @clerk/express middleware  →  authenticates every request  │
│   Route handlers             →  one file per domain          │
│   Drizzle ORM                →  PostgreSQL queries           │
│   Activity log writes        →  inline in route handlers     │
└──────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    PostgreSQL Database                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Contract-First API

The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the single source of truth. [Orval](https://orval.dev) generates typed TanStack Query hooks and Zod schemas from it.

**Change flow:**
```
Edit openapi.yaml
    → pnpm --filter @workspace/api-spec run codegen
    → lib/api-client-react/src/generated/  (hooks)
    → lib/api-zod/src/generated/           (schemas)
    → Update matching Express route handler
```

Never write raw `fetch()` calls in the frontend.

### 2. Authentication

- **Clerk** manages all identity (passwords, OAuth, sessions).
- The frontend uses `<SignIn />` / `<SignUp />` components.
- The API server calls `clerkMiddleware()` on every request and rejects unauthenticated calls.
- On the first authenticated request, a local `users` row is JIT-provisioned from the Clerk JWT claims.
- **Roles** (`procurement_officer` | `vendor`) live in the local `users` table — not in Clerk metadata — so the business logic owns them.

### 3. Clerk Proxy

In development and production, Clerk's Frontend API is proxied through the API server at `/clerk`. This is wired up in `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` and declared in the Vite config so all Clerk SDK calls stay on the same domain (avoids cross-origin cookie issues behind the Replit proxy).

### 4. Monorepo Package Boundaries

| Package | Kind | Rule |
|---------|------|------|
| `lib/db` | composite lib | Only imported by api-server. Never by the frontend. |
| `lib/api-spec` | tool package | Owns codegen. No runtime imports. |
| `lib/api-client-react` | composite lib | Only imported by the frontend. |
| `lib/api-zod` | composite lib | Only imported by api-server for request validation. |
| `artifacts/api-server` | leaf | Imports `lib/db`, `lib/api-zod`. |
| `artifacts/procurement-app` | leaf | Imports `lib/api-client-react`. |

Artifacts never import each other. Shared logic must become a `lib/` package.

### 5. Activity Logs

All significant actions (create, approve, reject, status change) write a row to `activity_logs` inline in the route handler — no event bus. This keeps the system simple at the cost of coupling logs to routes.

### 6. PO / Invoice Numbering

Counters (e.g. `PO-2024-001`) are in-memory singletons in `artifacts/api-server/src/lib/counters.ts`. They reset on server restart. Acceptable for MVP; replace with a DB sequence for production.

---

## Data Model (entity relationships)

```
users
  └── vendors  (one user can be linked to one vendor)

rfqs  (created by procurement_officer)
  └── rfq_items
  └── quotations  (submitted by vendor)
        └── quotation_items
        └── approvals
        └── purchase_orders
              └── po_items
              └── invoices
                    └── invoice_items

activity_logs  (written for every significant action)
notifications  (per-user inbox)
approvals      (separate table; linked to rfq / purchase_order / quotation)
```

---

## Directory Reference

```
lib/api-spec/openapi.yaml          API contract (edit this first)
lib/db/src/schema/                 Drizzle table definitions (edit, then run push)
artifacts/api-server/src/routes/   Express route handlers
artifacts/procurement-app/src/pages/  React page components
lib/api-client-react/src/generated/  Auto-generated — do not edit by hand
lib/api-zod/src/generated/            Auto-generated — do not edit by hand
```
