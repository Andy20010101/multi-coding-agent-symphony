# v36 Task 4 Review Evidence

Date: 2026-06-03

## Context

- Goal id: `v36-artifact-evidence-index-workspace`
- Task id: `task-4`
- Branch: `v36-task-4-evidence-timeline-release-bundle-view`
- Reviewer: `claude-v36-task-4-reviewer`
- Worker: `claude-v36-task-4-worker`
- Review type: independent (reviewer != worker)

## Review focus

Per review instructions:

1. `/api/evidence/timeline` and `/api/release/bundle` are GET-only/read-only, reject unsafe params.
2. `evidence-timeline.v1` shows only derived artifact index + goal event data, no arbitrary path reads, no downloads, no file opens.
3. `release-bundle.v1` recognizes real managed goal event types.
4. Release bundle deduplicates goalEvents + artifactIndex entries, goal events take priority.
5. `releaseReady` only triggered by `release.ready-declared`, not `release.gate-passed`.
6. Workbench panels are display-only, no shell/model/local-open/download/git/write/self-approval handlers.
7. Workbench route allowlist and API projection have explicit backend contract sources.

## Findings

### 1. GET-only / read-only routes — PASS

- `console.js:1632` — `/api/evidence/timeline` only responds to GET.
- `console.js:1700` — `/api/release/bundle` only responds to GET.
- Both routes use `allowedParams` whitelist (`{goal, task}` for timeline, `{goal}` for bundle) and reject unexpected query params with 400.
- Both routes validate params via `isUnsafeGoalRouteSegment`; reject path segments like `bad/goal` with 400.
- Both contracts enforce `readOnly: true` in `validateEvidenceTimelineContract` (`evidence-timeline-contract.js:376`) and `validateReleaseBundleContract` (`evidence-timeline-contract.js:405`).
- Both boundaries arrays assert all unsafe capabilities are `false`.

### 2. Evidence timeline data source — PASS

- `buildEvidenceTimelineContract` (`evidence-timeline-contract.js:32`) only consumes `entries` (artifact index) and `goalEvents`.
- Timeline entries do not carry `file_path` (`evidence-timeline-contract.js:113,144` — `file_path: null`).
- No filesystem read beyond `buildArtifactIndex` and `readGoalEventJournal`, both well-defined contracts.
- Context asserts `canonicalSource: 'ArtifactStore'`, `timelineRole: 'derived-view-only'`.
- All boundary fields (`shellExecutionAvailable`, `modelInvocationAvailable`, `arbitraryPathReadAvailable`, `arbitraryCommandExecutionAvailable`, `artifactDownloadAvailable`, `localFileOpenAvailable`, etc.) are `false`.

### 3. Release bundle event type recognition — PASS

- `worker.evidence-recorded` → `workerEvidence` — `evidence-timeline-contract.js:217-229`
- `reviewer.approved` / `reviewer.needs-revision` → `reviewEvidence` with `event.review.verdict` — lines 232-244
- `main.verification-passed` / `main.verification-failed` → `mainVerification` with `event.gate.status` and `event.gate.name` — lines 247-259
- `release.gate-passed` / `release.gate-failed` → `releaseGates` with `event.gate.name` and `event.gate.status` — lines 263-283
- `release.ready-declared` → sets `releaseReady = true` and records gate — lines 286-308
- Test coverage: `tests/v36-task-4-evidence-timeline-release-bundle.test.js:233-553`

### 4. Deduplication — PASS

- Goal events processed first; refs tracked per `taskId×kind` in `seenRefs` map — lines 184-202.
- Artifact index entries skipped if their `artifact_ref` was already covered by a goal event — lines 313-350.
- Artifact-only entries (not covered by any goal event) still supplemented.
- Release gates deduplicated by `eventId` — lines 267-272.
- Release-ready declarations deduplicated by `eventId` — lines 290-296.
- Real data test against `.symphony`: task-1, task-2, task-3 each show workerEvidence=1, reviewEvidence=1, mainVerification=1. No double-counting.

### 5. releaseReady trigger — PASS

- Only `release.ready-declared` sets `releaseReady = true` — line 298.
- `release.gate-passed` does NOT set `releaseReady` — the gate events go to `releaseGates` only (lines 263-283).
- Test confirms: 3 `release.gate-passed` events → `releaseReady = false` — test lines 424-465.
- Test confirms: full flow with `release.ready-declared` → `releaseReady = true` — test lines 467-553.

### 6. Workbench panels — PASS

- `EvidenceTimelinePanel` (`App.jsx:1650-1683`) — pure display: renders `FieldList`, `EvidenceTimelineEntryList`, and a panel note. No onClick handlers, no forms, no execution controls.
- `ReleaseBundlePanel` (`App.jsx:1708-1746`) — pure display: renders `FieldList`, `ReleaseGatesList`, `ReleaseBundleTaskList`, and a panel note. No execution handlers.
- Both panels include explicit notes that these are read-only derived views.
- No shell execution, model invocation, local file open, download, git write, or self-approval paths exist in either component.

### 7. Route allowlist and API projection — PASS

- `READONLY_API_ROUTES` includes `evidenceTimeline` and `releaseBundle` entries with `contractName` links — `contracts.js:530-543`.
- `projectEvidenceTimeline()` (`contracts.js:9834`) and `projectReleaseBundle()` (`contracts.js:9874`) derive from backend contract structures.
- `fetchWorkbenchContracts` includes both routes; results wired into `projectWorkbenchContracts()` return.
- Test assertions confirm allowlist entries have correct `id`, `path`, `method`, and `contractName` — test lines 872-911.

## Validation results

| Command | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm test` | PASS (976 tests, 0 failures) |
| `pnpm workbench:build` | PASS (17 modules, 64ms) |
| `git diff --check` | PASS |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | PASS (task-4: in-progress) |
| `pnpm --silent symphony actions manifest --json` | PASS |
| `pnpm --silent symphony actions availability --json` | PASS |
| `pnpm --silent symphony actions preview --action goal.worker-evidence.record --json` | PASS |
| `/api/release/bundle?goal=v36-artifact-evidence-index-workspace` (real data) | PASS (tasks 1-3 each show worker/review/main = 1) |

## Boundary notes

- No shell execution, model invocation, arbitrary path read, artifact download, or local file open added.
- No git write, merge, push, tag, or publish path added.
- No self-approval path added.
- No second source of truth — ArtifactStore is canonical; timeline and bundle are derived views only.
- All API routes are GET-only.
- UI panels are presentational only.
- Status derived only from explicit backend events (`readGoalEventJournal`, `buildArtifactIndex`, `buildGoalProgressLedger`).
- `releaseReady` is set only by `release.ready-declared`; `release.gate-passed` does not trigger it.
- Deduplication preserves goal event versions (which carry eventId, actor, verdict/gate/status) and supplements with artifact-index-only entries.

## Verdict

APPROVED — all 7 review points pass. Ready for main-verifier handoff.
