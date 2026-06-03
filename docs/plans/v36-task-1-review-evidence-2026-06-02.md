# v36 task-1 review evidence: Artifact index contract

- **Goal**: v36-artifact-evidence-index-workspace
- **Task**: task-1 (Artifact index contract)
- **Branch**: v36-task-1-artifact-index-contract
- **Commit**: None (reviewed from working tree)
- **Date**: 2026-06-03
- **Reviewer**: claude-v36-task-1-reviewer
- **Worker**: claude-v36-task-1-worker
- **Revision**: 1 (main-verifier previously flagged incomplete acceptance)

## Validation results

| Check | Result |
|---|---|
| `pnpm check` | Pass — no errors |
| `pnpm test` | Pass — 879 tests, 0 failures, 129 suites |
| `pnpm workbench:build` | Pass — 63ms, `index-CJQRcW6G.js` (1,156.16 kB), `index-ooe-c3KL.css` (23.40 kB) |
| `git diff --check` | Pass — no whitespace errors |
| `symphony actions manifest --json` | Pass — returns action-manifest.v1 with 5 actions |
| `symphony actions availability --json` | Pass — reviewer action correctly shown as available |
| `symphony actions preview --action goal.worker-evidence.record --json` | Pass — returns action-preview.v1 |
| `symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Pass — task-1 in-progress, awaiting reviewer verdict |

## Files changed

- `src/symphony/artifact-index-contract.js` — New contract module (build, validate, assert)
- `fixtures/contracts/artifact-index.v1.json` — New static reference fixture
- `tests/v36-artifact-index-contract.test.js` — New (11 tests)
- `src/symphony/console.js` — Added `GET /api/artifacts` route
- `frontend/workbench/src/api/contracts.js` — Added `artifactIndex` to READONLY_API_ROUTES
- `tests/workbench-api-client.test.js` — Updated expected routes
- `tests/workbench-shell.test.js` — Added `/api/artifacts` to approved paths
- `docs/action-registry-migration-guide.md` — Minimal rewording in v35 section
- `src/symphony/workbench-static/` — Bundle hash rotation (build output)

## Findings

### No blocking issues

### Minor observations (non-blocking)

1. **`kind` query parameter accepted but unused.** The `/api/artifacts` route accepts `kind` as an allowed parameter and validates it for safety, but does not pass it to `buildArtifactIndexContract`. This is forward-looking for task-2 filtering and is harmless — the route returns the full contract model, not live index data. Not a defect.

2. **Worker evidence validation table shows stale status.** The worker evidence table says "task-1 status: planned" in the validation results, but the actual status is "in-progress." This is a documentation snapshot timing artifact; does not affect correctness.

3. **`file_path` accepts any string.** The index entry's `file_path` field validates null vs string, but does not constrain string content. This is consistent with the boundary enforcement (`arbitraryPathReadAvailable: false`, `localFileOpenAvailable: false`) — the path is stored metadata, not an execution path.

### Boundaries confirmed

- All 14 write/execution/unsafe boundary fields locked to `false`
- `canonicalSource` locked to `ArtifactStore is canonical, index is derived cache only`
- `context.indexRole` locked to `derived-cache-and-search-only`
- `context.stateSource` locked to `explicit-backend-contracts`
- Route uses `isUnsafeGoalRouteSegment` for query parameter validation (same pattern as existing v34/v35 routes)
- Route only accepts GET; POST returns 405 with `method-not-allowed` code
- No shell execution, model invocation, git write, merge, push, tag, or publish added
- No job execution or job runner added
- ArtifactStore remains canonical; index is explicitly derived cache/search only
- v34 Action Registry and v35 Job Model routes verified alongside v36 route

### Test coverage

The 11 v36-specific tests cover:
- Fixture validation and build function output
- All 14 boundary fields individually drifted to `true`
- Canonical source value mutations (4 variants)
- Contract identity drift (readOnly, contractName, contractVersion, canonicalSource, indexRole)
- Unsafe refs on all index entry id fields (artifact_ref, goal_id, task_id, run_id, job_id)
- Unknown kind and evidence_kind values
- Invalid content_hash formats (4 variants including non-sha256 prefix)
- Missing required source contracts (each individually + combination)
- Route serving, query parameter rejection (unsupported params, unsafe values, POST method)
- Cross-contract compatibility (v34 Action Registry + v35 Job Model simultaneous availability)
- Edge cases (empty artifact_ref, invalid timestamps)

Full suite: 879 tests, 0 failures, 129 suites.

### Revision 1 fixes verified

The worker evidence documents two revision fixes from the prior main-verifier flag:
1. `tests/workbench-shell.test.js` — `/api/artifacts` added to approved paths (confirmed)
2. `docs/action-registry-migration-guide.md` — v35 wording corrected (confirmed)

Both fixes are present and correct.

## Verdict

**APPROVED**

The contract module is well-structured, follows the same build/validate/assert pattern as v34 and v35 contracts, enforces all boundary constraints correctly, and has thorough test coverage. The route is read-only, rejects unsafe parameters, and does not introduce any write, execution, or self-approval paths. All 879 tests pass. Cross-contract compatibility with v34 and v35 is verified.

## Handoff to main-verifier

task-1 is approved for main verification. The main-verifier should:
- Confirm branch merges cleanly into `main`
- Run `pnpm check && pnpm test && pnpm workbench:build && git diff --check`
- Run `symphony goal gate --goal v36-artifact-evidence-index-workspace --task task-1 --gate main-verification --status passed --verifier codex-v36-main-verifier --evidence-ref docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md`

No blockers were found. No dependencies on uncompleted tasks outside v36 task-1.
