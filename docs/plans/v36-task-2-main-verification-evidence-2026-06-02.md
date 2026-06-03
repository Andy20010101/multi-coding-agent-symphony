# v36 task-2 main verification evidence

Date: 2026-06-03

- Goal id: `v36-artifact-evidence-index-workspace`
- Task id: `task-2`
- Task title: Indexer from existing ArtifactStore/event refs
- Branch merged: `v36-task-2-indexer-from-artifactstore-event-refs`
- Main verifier: `codex-v36-main-verifier`
- Worker evidence: `docs/plans/v36-task-2-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v36-task-2-review-evidence-2026-06-02.md`
- Merge commit: `89fa7e210c44f748ed06348297dab94b845a2f7d`

## Verification summary

Fast-forward merged `v36-task-2-indexer-from-artifactstore-event-refs` into local `main` and verified the ArtifactStore/event-ref derived indexer on merged main.

The same main worktree used for task-1 verification remained checked out at `/private/tmp/v24-task-3-mainverify-main`. It was clean before merge and fast-forwarded from `762751a` to `89fa7e2`. The v36 managed goal journal is in the controller worktree, so goal-status and goal-next checks were read there.

## User-visible path

`GET /api/artifacts?goal=<goal-id>&task=<task-id>&kind=<kind>` now returns a live `artifact-index.v1` response with an `entries` array derived from the configured ArtifactStore directory and managed goal event evidence refs. The optional `kind` filter narrows entries without changing the canonical source boundary.

## Commands

| Command | Result |
| --- | --- |
| `git merge --ff-only v36-task-2-indexer-from-artifactstore-event-refs` | Exit 0; fast-forwarded `main` from `762751a` to `89fa7e2`. |
| `pnpm check` | Exit 0; Node syntax checks passed. |
| `pnpm test` | Exit 0; 899 tests, 135 suites, 899 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0; Vite built 17 modules with `index-CJQRcW6G.js` and `index-ooe-c3KL.css`. |
| `git diff --check` | Exit 0; no whitespace errors. |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Exit 0 from controller worktree; task-2 reviewer approval recorded, main verification missing before this evidence. |
| `pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json` | Exit 0 from controller worktree; next role is `main-verifier` for task-2. |

## Additional main-verifier check

Ran the indexer directly against the controller worktree's current `.symphony` journal before reviewer registration. It returned the three task-1 evidence refs as event-derived entries:

- `docs/plans/v36-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v36-task-1-review-evidence-2026-06-02.md`
- `docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md`

Each entry had `kind: evidence`, the expected evidence role, and `content_hash: null`, preserving the no arbitrary repo-doc body read boundary.

## Boundary notes

- ArtifactStore remains canonical; the index is a derived cache/search surface only.
- Event evidence refs are indexed as refs, not read or hashed from arbitrary repo paths.
- No shell execution, model invocation, arbitrary command execution, Workbench git write, merge/push/tag/publish path, artifact download path, local file open path, or self-approval path was added.
- `GET /api/artifacts` accepts only allowlisted query fields and rejects unsafe refs and non-GET methods.
- v34 Action Registry and v35 Job routes remain available alongside the v36 artifact index route.

## Gate recommendation

Register `main.verification-passed` for task-2 with this evidence ref:

```bash
pnpm --silent symphony goal gate \
  --goal v36-artifact-evidence-index-workspace \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v36-main-verifier \
  --evidence-ref docs/plans/v36-task-2-main-verification-evidence-2026-06-02.md \
  --dry-run --json
```
