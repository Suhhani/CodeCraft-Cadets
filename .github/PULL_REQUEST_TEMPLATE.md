## Summary

<!-- What does this PR do? Describe the change in 1–3 sentences. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / code improvement
- [ ] Documentation update
- [ ] Dependency update

## Checklist

- [ ] `pnpm run typecheck` passes with no errors
- [ ] API changes are reflected in `lib/api-spec/openapi.yaml` and codegen has been re-run
- [ ] DB schema changes are accompanied by a migration (`pnpm --filter @workspace/db run push`)
- [ ] No `console.log` added to server code (use `req.log` / `logger`)
- [ ] All monetary values display in ₹ using `en-IN` locale

## Screenshots / recordings (if UI change)

<!-- Add before/after screenshots or a short screen recording -->

## Related issues

<!-- Closes #123 -->
