# v36 Task 4 Worker Evidence

Date: 2026-06-03

## Context

- Goal id: `v36-artifact-evidence-index-workspace`
- Task id: `task-4`
- Branch: `v36-task-4-evidence-timeline-release-bundle-view`
- User-visible value: 用户能复盘每个版本为什么可 release。

## Implementation summary (revised ×2)

Added evidence timeline and release bundle read-only views to the Workbench.
Revised `buildReleaseBundle` to recognize real managed goal event types and structures.

### Backend

1. **`src/symphony/evidence-timeline-contract.js`** (new, revised)
   - Defines `evidence-timeline.v1` and `release-bundle.v1` contracts
   - `buildEvidenceTimelineContract()` — builds chronological evidence timeline from artifact index entries and goal events
   - `buildReleaseBundleContract()` — builds release bundle grouped by task with worker/reviewer/main-verifier/release-manager evidence kinds
   - **Revised**: `buildReleaseBundle` now recognizes real managed goal event types:
     - `worker.evidence-recorded` → workerEvidence
     - `reviewer.approved` / `reviewer.needs-revision` → reviewEvidence, reads `event.review.verdict`
     - `main.verification-passed` / `main.verification-failed` → mainVerification, reads `event.gate.status`
     - `release.gate-passed` / `release.gate-failed` → releaseGates, reads `event.gate.name` and `event.gate.status`
     - `release.ready-declared` → sets `releaseReady = true` and records in releaseGates
   - `releaseReady` is set **only** by `release.ready-declared`; `release.gate-passed` does NOT set it
   - Actor role mapping uses `ACTOR_ROLE_EVIDENCE_KIND` lookup including `release-verifier`
   - **Revised ×2**: Deduplication by evidence ref per task×evidenceKind. Goal events take priority (contain eventId, actor, verdict/gate). Artifact index entries only supplement uncovered refs. Release gates deduplicated by eventId.
   - Both contracts enforce read-only boundaries
   - Contract validation with boundary drift rejection

2. **`src/symphony/console.js`** (modified)
   - Added `GET /api/evidence/timeline` route — accepts `goal` and `task` query params
   - Added `GET /api/release/bundle` route — accepts `goal` query param
   - Both routes validate params with `isUnsafeGoalRouteSegment`, use existing `buildArtifactIndex`, `readGoalEventJournal`, and `buildGoalProgressLedger`

### Frontend

3. **`frontend/workbench/src/api/contracts.js`** (modified)
   - Added `evidenceTimeline` and `releaseBundle` entries to `READONLY_API_ROUTES`
   - Added `projectEvidenceTimeline()` and `projectReleaseBundle()` projection functions
   - Wired into `projectWorkbenchContracts()` return value

4. **`frontend/workbench/src/App.jsx`** (modified)
   - Added `EvidenceTimelinePanel` — displays evidence timeline entries in chronological order
   - Added `ReleaseBundlePanel` — displays release bundle grouped by task with evidence kinds
   - Both panels are read-only display components; no execution handlers, no shell, no model calls

### Tests

5. **`tests/v36-task-4-evidence-timeline-release-bundle.test.js`** (new, 40 tests, revised ×2)
   - Evidence timeline contract validation and boundaries
   - Release bundle contract validation and boundaries
   - **Revised**: tests use real managed goal event types (`reviewer.approved`, `main.verification-passed`, `release.gate-passed`, `release.ready-declared`)
   - **Revised**: tests read from real event structures (`event.review.verdict`, `event.gate.status`, `event.gate.name`, `event.actor.id`, `event.evidenceRefs[].ref`)
   - **Revised**: `releaseReady` only set by `release.ready-declared`; 3 `release.gate-passed` events do NOT trigger it
   - Full v36 task flow: worker → reviewer.approved → main.verification-passed → release.gate-passed → release.ready-declared
   - **Revised ×2**: 6 deduplication tests — matching goalEvents + artifact entries don't double-count; verdict/gate/status/actor preserved; artifact-only supplement still included; release gates deduplicated by eventId; releaseReady invariant preserved
   - Route allowlist verification
   - API route integration tests with server
   - Unsafe parameter rejection tests

6. **`tests/workbench-api-client.test.js`** (modified)
   - Updated READONLY_API_ROUTES and READONLY_API_ROUTE_ALLOWLIST assertions

7. **`tests/workbench-shell.test.js`** (modified)
   - Updated frontend API path assertion

## Files changed

- `src/symphony/evidence-timeline-contract.js` (new)
- `src/symphony/console.js` (modified, imports + 2 new route handlers)
- `frontend/workbench/src/api/contracts.js` (modified, routes + projections)
- `frontend/workbench/src/App.jsx` (modified, 5 new components)
- `tests/v36-task-4-evidence-timeline-release-bundle.test.js` (new)
- `tests/workbench-api-client.test.js` (modified, route assertions)
- `tests/workbench-shell.test.js` (modified, route assertions)

## Validation results

| Command | Result |
|---|---|
| `pnpm check` | PASS (no syntax errors) |
| `pnpm test` | PASS (976 tests, 0 failures) |
| `pnpm workbench:build` | PASS (17 modules, built in 62ms) |
| `git diff --check` | PASS (no whitespace issues) |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | PASS (task-4 status: planned) |

## Boundary notes

- No shell execution added
- No model invocation added
- No arbitrary file path open added
- No git write/merge/push/tag/publish added
- No artifact download added
- No self-approval path added
- No second source of truth — ArtifactStore remains canonical; timeline and bundle are derived views only
- All API routes are GET only, read-only
- UI components are presentational only; no execution handlers
- Evidence timeline and release bundle reuse existing artifact index, goal events, and goal progress contracts
- Status comes from explicit backend events and command outputs only

## Known limitations / Next task handoff

- Timeline and bundle views show data derived from artifact index and goal events; they do not create new evidence
- Release bundle groups events by task using event types; future versions may want more precise grouping
- v36 task-5 (Export diagnostics/evidence bundle draft) can build on the release bundle contract
- Reviewer handoff: `docs/plans/v36-task-4-review-evidence-2026-06-02.md`
