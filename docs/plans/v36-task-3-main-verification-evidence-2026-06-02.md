# v36 task-3 main verification evidence

## Context

- Goal: `v36-artifact-evidence-index-workspace`
- Task: `task-3` (Safe preview/search/filter API)
- Verifier: `codex-v36-main-verifier`
- Verified at: `2026-06-03T04:22:59Z`
- Task branch: `v36-task-3-safe-preview-search-filter-api`
- Task commit: `2bb01e6f1037dd998193d73e67c253c8ef895a76`
- Main worktree: `/private/tmp/v24-task-3-mainverify-main`
- Main merge mode: fast-forward only from `5ff8697ffda869d0c6723b24c75cc55da58645cd` to `2bb01e6f1037dd998193d73e67c253c8ef895a76`

## Evidence reviewed

- Worker evidence: `docs/plans/v36-task-3-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v36-task-3-review-evidence-2026-06-02.md`
- Worker event: `evt_b5971cec32d3df53`
- Reviewer event: `evt_1d9c7d01a456e387`
- Reviewer verdict: `APPROVED`

## Files verified

- `src/symphony/safe-preview-search.js`
- `tests/v36-safe-preview-search.test.js`
- `src/symphony/console.js`
- `docs/plans/v36-task-3-worker-evidence-2026-06-02.md`
- `docs/plans/v36-task-3-review-evidence-2026-06-02.md`

## Main verification checks

| Check | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm test` | PASS: 936 tests, 142 suites, 936 pass, 0 fail |
| `pnpm workbench:build` | PASS: Vite build completed in 132 ms |
| `git diff --check` | PASS: no output |
| `symphony actions preview --action goal.main-verification-gate.record` | PASS: available, no blockers |
| Direct `/api/artifacts?q=...&kind=...` route check | PASS |

## Direct API route check

A temporary console server was started with a scoped temporary `.symphony` state directory. The check requested:

- `GET /api/artifacts?goal=v36-artifact-evidence-index-workspace&q=needle&kind=evidence`
- `GET /api/artifacts?goal=v36-artifact-evidence-index-workspace&q=..%2Fsecret`

Observed result:

```json
{
  "okStatus": 200,
  "contractName": "artifact-index.v1",
  "readOnly": true,
  "totalEntries": 1,
  "matchedRefs": ["task-1/worker-evidence"],
  "searchQuery": "needle",
  "kindFilter": "evidence",
  "arbitraryPathReadAvailable": false,
  "shellExecutionAvailable": false,
  "badStatus": 400,
  "badCode": "invalid-artifact-index-request"
}
```

## Boundary verification

- Search runs only over derived artifact index entry metadata: `artifact_ref`, `goal_id`, `task_id`, `kind`, `evidence_kind`, and `labels`.
- The search implementation does not read, open, download, or follow `file_path`.
- Query validation rejects traversal markers, `file:` syntax, backslashes, unsafe refs, unsupported filter keys, invalid enum values, empty queries, and queries over 256 characters.
- `/api/artifacts` remains a read-only GET route and still returns `artifact-index.v1`.
- The task adds no shell execution, model invocation, arbitrary command execution, git write, merge, push, tag, publish, local file open, download, or self-approval path.
- ArtifactStore remains the canonical source. The index and search layer remain derived cache/search only.

## Notes

The reviewer recorded two low-severity observations: `entry.labels` is assumed to be an array, and the search query regex allows a backtick. Main verification agrees these are non-blocking for this task because the indexer produces contract-shaped entries and the query is only used for in-memory substring matching.

## Verdict

PASS. Task-3 is ready for main verification gate registration.
