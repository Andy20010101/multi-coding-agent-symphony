# v36 task-2 review evidence: Indexer from existing ArtifactStore/event refs

- **Goal**: v36-artifact-evidence-index-workspace
- **Task**: task-2 (Indexer from existing ArtifactStore/event refs)
- **Branch**: v36-task-2-indexer-from-artifactstore-event-refs
- **Date**: 2026-06-03
- **Reviewer**: claude-v36-task-2-reviewer
- **Verdict**: APPROVED

## Validation results

| Check | Result |
|---|---|
| `pnpm check` | Pass — no errors |
| `pnpm test` | Pass — 899 tests, 0 failures, 135 suites, 4.5s |
| `pnpm workbench:build` | Pass — built in 65ms, 17 modules |
| `git diff --check` | Pass — no whitespace errors |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Pass — task-2 status: in-progress |

## Files inspected

| File | Change | Review notes |
|---|---|---|
| `src/symphony/artifact-indexer.js` | New (344 lines) | Clean implementation: `scanArtifactStore`, `scanEventRefs`, `buildArtifactIndex`, `validateIndexEntry` |
| `src/symphony/console.js` | +16/-4 | Import changed from `buildArtifactIndexContract` to `buildArtifactIndex`; route now builds live index from `stateDir/artifacts` + event log |
| `tests/v36-artifact-indexer.test.js` | New (633 lines) | 20 tests: store scan, event ref scan, dedup, entry validation, route integration, kind filtering, unsafe param rejection, cross-contract compatibility, boundary enforcement |
| `tests/v36-artifact-index-contract.test.js` | +4/-4 | Updated route test to validate live index shape (entries array) instead of contract validator |
| `fixtures/contracts/artifact-index.v1.json` | (unchanged, task-1) | Contract fixture validated by task-1 |
| `docs/plans/v36-task-2-worker-evidence-2026-06-02.md` | New | Factual, matches implementation |

## Findings

### No high or medium severity findings

### Low severity notes

1. **Validator alignment: content_hash nullability** — `validateIndexEntry` in `artifact-indexer.js:290-293` allows null `content_hash` (for event ref entries), while `validateArtifactIndexContract`'s `requireSha256Hash` at `artifact-index-contract.js:307-310` does not. This is intentional — event ref entries have null hashes because hashing arbitrary repo-doc paths would constitute an unrestricted local file read. The worker evidence explicitly documents this. No action needed.

2. **Run/job ID format validation** — `validateIndexEntry` in the indexer only type-checks `run_id` and `job_id` (null or string, lines 308-313) without format validation. The contract module at `artifact-index-contract.js:220-226` validates these with the stricter `requireSafeRef` pattern. The contract-level tests catch format drift. No impact on runtime safety since run/job IDs originate from controlled sources.

3. **Regex character class escaping** — `task_id` and `goal_id` patterns use `\._\-` inside character classes at lines 300 and 304. The backslashes before `.` and `_` are unnecessary inside `[]` but harmless. Functionally correct.

## Acceptance criteria verification

| Criterion | Status | Evidence |
|---|---|---|
| Index is derived cache of ArtifactStore/event refs | PASS | `context.canonicalSource: "ArtifactStore"`, `context.indexRole: "derived-cache-and-search-only"`, locked in boundaries and contract |
| Does not replace canonical source | PASS | `boundaries.canonicalSource` locked string, `secondArtifactStoreAvailable: false` |
| App/Workbench user path visible and testable | PASS | `GET /api/artifacts?goal=&task=&kind=` — route tested with 200, 400, 405 responses; kind filtering functional |
| State changes from explicit backend events only | PASS | `stateSource: "explicit-backend-contracts"`, data sources: artifact-store directory + event NDJSON files |
| No shell execution | PASS | All 14 boundary fields locked to false |
| No model invocation | PASS | `modelInvocationAvailable: false` |
| No arbitrary local file read | PASS | Only reads from configured artifact store dir + event log; event ref entries not hashed |
| No git write, merge, push, tag, publish | PASS | All locked false in boundaries |
| No self-approval | PASS | `selfApprovalAvailable: false` |

## Boundary notes

- The route accepts only GET method (405 for POST) and only `goal`, `task`, `kind` query params (400 for unsupported params).
- Unsafe query values (`../`, url-encoded traversal, empty strings) are rejected with 400.
- Cross-contract compatibility confirmed: v34 Action Registry (`/api/actions/manifest`) and v35 Job Model (`/api/jobs`) routes return 200 alongside v36 index route (`/api/artifacts`). The index context declares all source contracts.
- Deduplication: event ref entries are deduplicated against ArtifactStore entries by `artifact_ref`.
- The `/api/artifacts` route is registered in `frontend/workbench/src/api/contracts.js:524` as a managed route.
- task-1's `artifact-index-contract.js` module validates the contract fixture (single `indexEntry` example); task-2's `artifact-indexer.js` validates runtime entries (`entries` array). Both use the same contract name/version and compatible entry schemas.

## Handoff

- task-2 is approved for main-verifier.
- Main verifier should run: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json`
- task-3 (Safe preview/search/filter API) will consume this index.
