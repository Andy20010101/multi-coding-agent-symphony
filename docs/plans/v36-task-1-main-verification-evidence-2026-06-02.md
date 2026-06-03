# v36 task-1 main verification evidence

Date: 2026-06-03

- Goal id: `v36-artifact-evidence-index-workspace`
- Task id: `task-1`
- Task title: Artifact index contract
- Branch merged: `v36-task-1-artifact-index-contract`
- Main verifier: `codex-v36-main-verifier`
- Worker evidence: `docs/plans/v36-task-1-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v36-task-1-review-evidence-2026-06-02.md`
- Merge commit: `e51e5b37a0465a49dcc987c64350cc680f9db6df`

## Verification summary

Fast-forward merged `v36-task-1-artifact-index-contract` into local `main` and verified the artifact index contract implementation on merged main.

The controller worktree could not check out `main` because `main` was already checked out at `/private/tmp/v24-task-3-mainverify-main`. Main verification therefore used that clean main worktree for the ff-only merge and validation commands. The v36 managed goal journal is present in the controller worktree, so `goal-status` was read there after the review gate was registered.

## User-visible path

Workbench read-only route declarations now include `GET /api/artifacts` with contract name `artifact-index.v1`. The backend route returns a read-only artifact index contract with stable artifact/evidence fields, canonical ArtifactStore boundaries, and no shell/model/git/local-file execution paths.

## Commands

| Command | Result |
| --- | --- |
| `git pull --ff-only` | Exit 0; already up to date. |
| `git merge --ff-only v36-task-1-artifact-index-contract` | Exit 0; fast-forwarded `main` from `d225958` to `e51e5b3`. |
| `pnpm check` | Exit 0; Node syntax checks passed. |
| `pnpm test` | Exit 0; 879 tests, 129 suites, 879 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0; Vite built `index-CJQRcW6G.js` and `index-ooe-c3KL.css`. |
| `git diff --check` | Exit 0; no whitespace errors. |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Exit 0 from controller worktree; task-1 reviewer approval recorded, main verification missing before this evidence. |
| `pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json` | Exit 0 from controller worktree; next role is `main-verifier` for task-1. |

## Boundary notes

- No shell execution, model invocation, arbitrary command execution, git write from Workbench, merge/push/tag/publish path, artifact download path, local file open path, or self-approval path was added.
- ArtifactStore remains canonical. The artifact index contract is a derived cache/search contract only.
- `GET /api/artifacts` accepts only allowlisted query fields and rejects unsafe refs.
- The static Workbench bundle was rebuilt from the React/Vite source change.

## Gate recommendation

Register `main.verification-passed` for task-1 with this evidence ref:

```bash
pnpm --silent symphony goal gate \
  --goal v36-artifact-evidence-index-workspace \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v36-main-verifier \
  --evidence-ref docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md \
  --dry-run --json
```
