# Contributing to Procuris

Thank you for taking the time to contribute! Please follow these guidelines.

## Development Workflow

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Make your changes**, following the conventions below.

4. **Typecheck** before pushing:
   ```bash
   pnpm run typecheck
   ```

5. Open a **Pull Request** against `main` using the provided template.

---

## Conventions

### API changes

The OpenAPI spec is the source of truth. If you change the API:

1. Edit `lib/api-spec/openapi.yaml`
2. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
3. Update the Express route handler in `artifacts/api-server/src/routes/`
4. Never write manual `fetch()` calls in the frontend — use the generated hooks

### Database changes

1. Edit the relevant schema file in `lib/db/src/schema/`
2. Run: `pnpm --filter @workspace/db run push`

### Frontend pages

- One folder per domain under `artifacts/procurement-app/src/pages/`
- Shared UI components go in `artifacts/procurement-app/src/components/`
- Use `@workspace/api-client-react` hooks for all data fetching

### Logging

- **No `console.log`** in server code — use `req.log` in route handlers and the `logger` singleton elsewhere

### Currency

- All monetary values are displayed in Indian Rupees (₹) using `en-IN` locale formatting

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add vendor rating to quotation comparison
fix: correct invoice total calculation
refactor: extract shared INR formatter utility
docs: update architecture diagram
```

---

## Reporting Issues

Use the GitHub Issue templates — bug reports and feature requests both have dedicated forms.
