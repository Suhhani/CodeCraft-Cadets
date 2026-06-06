# Procuris — Procurement Management System

A full-stack procurement platform for enterprise finance teams and vendors. Manages the complete procurement lifecycle from RFQs through quotations, approvals, purchase orders, and invoices, with role-based access for Procurement Officers and Vendors.

---

## Features

| Module | Description |
|--------|-------------|
| **Auth** | Clerk-powered sign-in / sign-up with branded layout |
| **Dashboard** | KPI cards, recent activity, quick actions |
| **Vendor Management** | Register, view, edit, and rate suppliers |
| **RFQ Creation** | Create Requests for Quotation with line items and vendor assignment |
| **Quotation Submission** | Vendors submit priced bids against open RFQs |
| **Quotation Comparison** | Side-by-side view highlighting lowest price & fastest delivery |
| **Approval Workflow** | 4-step approval chain (Submitted → L1 Review → L2 Approval → Generate PO) |
| **Purchase Orders** | Generate POs from winning quotes; track status through delivery |
| **Invoices** | Generate invoices from delivered POs; mark as paid |
| **Activity & Logs** | Full chronological audit trail with entity-level filtering |
| **Reports & Analytics** | Spend by category, top vendors, monthly trends — all in ₹ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24, TypeScript 5.9 |
| Package manager | pnpm workspaces |
| API | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk (`@clerk/react` + `@clerk/express`) |
| Validation | Zod (v4), drizzle-zod |
| API contract | OpenAPI 3 → Orval codegen (TanStack Query hooks + Zod schemas) |
| Frontend | React + Vite, Tailwind CSS, shadcn/ui, Recharts, react-hook-form |
| Build | esbuild (CJS bundle for API server) |

---

## Monorepo Layout

```
procuris/
├── artifacts/
│   ├── api-server/          # Express 5 REST API (port 8080)
│   │   └── src/
│   │       ├── routes/      # One file per domain (rfqs, vendors, approvals…)
│   │       ├── middlewares/ # Clerk proxy, auth guard
│   │       └── lib/         # Logger, auth helpers, counters
│   └── procurement-app/     # React + Vite SPA
│       └── src/
│           ├── pages/       # One folder per domain
│           ├── components/  # Shared shadcn/ui components
│           ├── hooks/       # Custom React hooks
│           └── lib/         # Utilities
├── lib/
│   ├── api-spec/            # openapi.yaml  ← source of truth for the API contract
│   ├── api-client-react/    # Generated TanStack Query hooks (from Orval)
│   ├── api-zod/             # Generated Zod schemas (from Orval)
│   └── db/                  # Drizzle schema + migration config
│       └── src/schema/      # One file per domain entity
└── scripts/                 # Shared utility scripts
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 24
- pnpm ≥ 9
- PostgreSQL database
- A [Clerk](https://clerk.com) application (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/your-org/procuris.git
cd procuris
pnpm install
```

### 2. Set environment variables

Create a `.env` file in the repo root (or set them in your host):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/procuris
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
SESSION_SECRET=your-random-secret
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Run the API server

```bash
pnpm --filter @workspace/api-server run dev
# Listens on port 8080
```

### 5. Run the frontend

```bash
pnpm --filter @workspace/procurement-app run dev
# Opens on the port shown in terminal output
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm run typecheck` | Full typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks & Zod schemas from `openapi.yaml` |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |

> **Note:** Never run `pnpm dev` at the workspace root — run each service individually with `--filter`.

---

## Architecture

### Contract-First API

The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the **single source of truth** for the API contract. Never write fetch calls manually in the frontend — always use the generated hooks:

```
openapi.yaml  →  pnpm codegen  →  lib/api-client-react/src/generated/
```

### Auth Flow

- Clerk handles all auth client-side (`<SignIn />`, `<SignUp />` components)
- The API server validates sessions via `@clerk/express` middleware
- On first request, users are JIT-provisioned in the local `users` table
- Roles (`procurement_officer` | `vendor`) are stored in the local DB — not in Clerk metadata

### Role-Based Access

| Role | Can do |
|------|--------|
| `procurement_officer` | Create RFQs, manage vendors, approve/reject, generate POs & invoices |
| `vendor` | Submit quotations, acknowledge POs, view own invoices |

---

## Database Schema

Entities: `users` · `vendors` · `rfqs` · `rfq_items` · `quotations` · `quotation_items` · `purchase_orders` · `po_items` · `invoices` · `invoice_items` · `approvals` · `activity_logs` · `notifications`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
https://web-structure-manager--suhanibavaghela.replit.app

---

## License

MIT
