# v36 task-1 worker evidence: Artifact index contract

- **Goal**: v36-artifact-evidence-index-workspace
- **Task**: task-1 (Artifact index contract)
- **Branch**: v36-task-1-artifact-index-contract
- **Base commit**: d22595813ea10d6bfccb2b306af4300cf5a03023
- **Date**: 2026-06-03
- **Actor**: claude-v36-task-1-worker
- **Revision**: 1 (main-verifier flagged incomplete acceptance)

## Files changed

| File | Change |
|---|---|
| `src/symphony/artifact-index-contract.js` | New — contract module with build, validate, assert functions |
| `fixtures/contracts/artifact-index.v1.json` | New — static reference fixture |
| `tests/v36-artifact-index-contract.test.js` | New — 11 tests covering fixture, boundary drift, route, cross-contract compatibility |
| `src/symphony/console.js` | Added `GET /api/artifacts` route (read-only, safe refs only) |
| `frontend/workbench/src/api/contracts.js` | Added `artifactIndex` entry to read-only route allowlist |
| `tests/workbench-api-client.test.js` | Updated expected route list with `/api/artifacts` |
| `tests/workbench-shell.test.js` | Updated approved frontend API path list with `/api/artifacts` |
| `docs/action-registry-migration-guide.md` | Reworded v35 section to include required acceptance phrase |
| `src/symphony/workbench-static/index.html` | Updated bundle hash reference |
| `src/symphony/workbench-static/assets/index-DGKVua6N.js` | Deleted (old hashed JS bundle) |
| `src/symphony/workbench-static/assets/index-CJQRcW6G.js` | New (current hashed JS bundle from `pnpm workbench:build`) |

## Revision fixes

1. **`tests/workbench-shell.test.js`** — Added `/api/artifacts` to the approved frontend API path list at the alphabetically correct position (after `/api/adoptions/<adoption-id>/inspect`, before `/api/capabilities`).

2. **`docs/action-registry-migration-guide.md`** — Changed "v35 creates the job contract surface" to "v35 should create jobs from a controlled action preview" in the v35 Job Queue Handoff section. Minimal one-line edit; does not change v34/v35 boundaries.

## Contract design

Contract name: `artifact-index.v1`, version 1.

The artifact index is a derived cache and search layer over the canonical ArtifactStore.
It does not replace or duplicate ArtifactStore.

- `context.canonicalSource`: locked to `ArtifactStore`
- `context.indexRole`: locked to `derived-cache-and-search-only`
- `boundaries.canonicalSource`: locked to `ArtifactStore is canonical, index is derived cache only`

### Index entry fields

- `artifact_ref` — safe ref identifying the artifact in ArtifactStore
- `content_hash` — `sha256:<64 hex chars>` for integrity verification
- `kind` — one of: evidence, plan, runbook, fixture, log, artifact, bundle, summary
- `goal_id`, `task_id`, `run_id`, `job_id` — operational linkage (null allowed for run_id, job_id)
- `evidence_kind` — one of: worker, reviewer, main-verifier, release-manager (null if not evidence)
- `timestamps` — `created_at` and `indexed_at` (ISO timestamps)
- `labels` — string array
- `file_path` — null or string

### Boundary enforcement

All 14 write/execution/unsafe path boundary fields locked to `false`:

artifactExecutionAvailable, shellExecutionAvailable, modelInvocationAvailable,
arbitraryCommandExecutionAvailable, arbitraryPathReadAvailable,
gitWriteAvailable, mergeAvailable, pushAvailable, tagAvailable, publishAvailable,
selfApprovalAvailable, secondArtifactStoreAvailable,
artifactDownloadAvailable, localFileOpenAvailable.

## Validation results (revision 1)

| Check | Result |
|---|---|
| `pnpm check` | Pass — no errors |
| `pnpm test` | Pass — 879 tests, 0 failures |
| `pnpm workbench:build` | Pass — built in 64ms, output: `index-CJQRcW6G.js` (1,156.16 kB), `index-ooe-c3KL.css` (23.40 kB) |
| `git diff --check` | Pass — no whitespace errors |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Pass — task-1 status: planned |

## Boundaries confirmed

- No shell execution, model invocation, or arbitrary command execution added
- No git write, merge, push, tag, or publish path added
- No artifact download or local file open path added
- No self-approval path added
- No second artifact store created
- ArtifactStore remains canonical; index is derived cache/search only
- UI calls declared contracts only; no raw shell commands
- State changes come only from explicit backend contracts
- v8 compatibility commands not presented as top-level App model

## Handoff

- `artifact-store.v1` is a conceptual contract reference. task-2 (Indexer) should create a formal contract or map directly to `src/artifact-store.js`.
- `GET /api/artifacts` returns the contract model, not live index data. task-2 implements the actual indexer.
- All 879 tests pass including v34, v35, and v36 cross-contract compatibility.
