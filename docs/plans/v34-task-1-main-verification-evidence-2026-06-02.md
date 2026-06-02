# v34 Task 1 Main Verification Evidence

## Scope

- Goal id: `v34-action-registry-workspace`
- Task id: `task-1`
- Main branch commit verified: `cbad68e`
- Worker evidence: `docs/plans/v34-task-1-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v34-task-1-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-task-1`

## Verification Summary

Fast-forward merged `v34-task-1-action-manifest-contract` into local `main` and verified the task-1 action manifest contract implementation on `main`.

The verified user path is:

```text
GET /api/actions/manifest
GET /api/actions/manifest?goal=<goal-id>&task=<task-id>
pnpm --silent symphony actions manifest --goal <goal-id> --task <task-id> --json
```

The route and CLI expose `action-manifest.v1` only. They do not execute actions, create jobs, append events, read arbitrary paths, invoke models, merge, push, tag, publish, self-approve, or declare release readiness.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git switch main && git merge --ff-only v34-task-1-action-manifest-contract` | Exit `0`; fast-forwarded `main` to `cbad68e` |
| `pnpm check` | Exit `0` |
| `pnpm test` | Exit `0`; 779 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit `0`; task-1 approved, main verification missing before this evidence |
| `pnpm --silent symphony goal next --goal v34-action-registry-workspace --json` | Exit `0`; next role was `main-verifier` for task-1 |

## Result

Task 1 is ready for `main-verification` gate registration.

This evidence does not mark release ready and does not verify v34 task-2 through task-5.
