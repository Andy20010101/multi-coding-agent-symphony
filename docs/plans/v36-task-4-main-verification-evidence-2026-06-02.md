# v36 task-4 main verification evidence

## Context

- Goal: `v36-artifact-evidence-index-workspace`
- Task: `task-4` (Evidence timeline and release bundle view)
- Verifier: `codex-v36-main-verifier`
- Verified at: `2026-06-03T05:32:30Z`
- Task branch: `v36-task-4-evidence-timeline-release-bundle-view`
- Task commit: `842a491ee00540a625986a81fd585f758558fc12`
- Main worktree: `/private/tmp/v24-task-3-mainverify-main`
- Main merge mode: fast-forward only from `99bbbccd312932baeaef4eee0673fa836b928b22` to `842a491ee00540a625986a81fd585f758558fc12`

## Evidence reviewed

- Worker evidence: `docs/plans/v36-task-4-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v36-task-4-review-evidence-2026-06-02.md`
- Worker event: `evt_c212964d0c491bb1`
- Reviewer event: `evt_5de4c59bb030a097`
- Reviewer verdict: `APPROVED`

## Files verified

- `src/symphony/evidence-timeline-contract.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v36-task-4-evidence-timeline-release-bundle.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BQMXRGdj.js`

## Main verification checks

| Check | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm test` | PASS: 976 tests, 148 suites, 976 pass, 0 fail |
| `pnpm workbench:build` | PASS: Vite build completed in 101 ms |
| `git diff --check` | PASS: no output |
| `symphony actions preview --action goal.main-verification-gate.record` | PASS: available, no blockers |
| Direct `/api/release/bundle` real-data route check | PASS |
| Direct `/api/evidence/timeline` real-data route check | PASS |
| Unsafe query checks for both new routes | PASS: both returned 400 |

## Direct API route checks

The verification started a temporary console server from the task-4 worktree and used the current v36 managed goal state.

Observed result:

```json
{
  "bundleStatus": 200,
  "bundleContractName": "release-bundle.v1",
  "bundleReadOnly": true,
  "bundleReleaseReady": false,
  "bundleReleaseGates": 0,
  "tasks": {
    "task-1": {
      "workerEvidence": 1,
      "reviewEvidence": 1,
      "mainVerification": 1,
      "reviewVerdicts": ["APPROVED"],
      "mainStatuses": ["passed"]
    },
    "task-2": {
      "workerEvidence": 1,
      "reviewEvidence": 1,
      "mainVerification": 1,
      "reviewVerdicts": ["APPROVED"],
      "mainStatuses": ["passed"]
    },
    "task-3": {
      "workerEvidence": 1,
      "reviewEvidence": 1,
      "mainVerification": 1,
      "reviewVerdicts": ["APPROVED"],
      "mainStatuses": ["passed"]
    },
    "task-4": {
      "workerEvidence": 1,
      "reviewEvidence": 1,
      "mainVerification": 0,
      "reviewVerdicts": ["APPROVED"],
      "mainStatuses": []
    }
  },
  "timelineStatus": 200,
  "timelineContractName": "evidence-timeline.v1",
  "timelineEntryCount": 11,
  "timelineReadOnly": true,
  "timelineArbitraryPathReadAvailable": false,
  "unsafeBundleStatus": 400,
  "unsafeTimelineStatus": 400
}
```

## Boundary verification

- Both new routes are GET-only and reject unsupported or unsafe query parameters.
- Evidence timeline and release bundle are derived from `buildArtifactIndex`, `readGoalEventJournal`, and `buildGoalProgressLedger`; no arbitrary path read is introduced.
- Timeline entries set `file_path: null`; the Workbench receives display data only.
- Release bundle recognizes real managed goal event types: worker evidence, reviewer verdicts, main verification gates, release gates, and release ready declarations.
- Release bundle deduplicates matching goal event refs and artifact index entries. Goal event records are kept when they carry verdict, actor, verifier, gate, or status metadata.
- `releaseReady` is set only by `release.ready-declared`; release gate pass events alone do not make the bundle release ready.
- Workbench panels are presentational. They do not add shell execution, model invocation, local file open, artifact download, git write, merge, push, tag, publish, or self-approval paths.
- ArtifactStore remains canonical; timeline and bundle are derived views only.

## Verdict

PASS. Task-4 is ready for main verification gate registration.
