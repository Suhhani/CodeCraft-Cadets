---
name: Clerk themes package install
description: @clerk/themes must be installed separately; design subagents don't always do it
---

When using Clerk with a shadcn/shadcn-style theme (`import { shadcn } from '@clerk/themes'` and `@import '@clerk/themes/shadcn.css'`), the `@clerk/themes` package must be explicitly installed in the frontend artifact:

```
pnpm --filter @workspace/<artifact> add @clerk/themes
```

**Why:** Design subagents may generate code that imports `@clerk/themes` without installing it, causing Vite to fail with "Can't resolve '@clerk/themes'" errors. This blocks the entire frontend from loading.

**How to apply:** After any design subagent finishes building a Clerk-authenticated frontend, check for `@clerk/themes` imports and install if missing before restarting the workflow.
