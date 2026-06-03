# v36 task-2 worker evidence: Indexer from existing ArtifactStore/event refs

- **Goal**: v36-artifact-evidence-index-workspace
- **Task**: task-2 (Indexer from existing ArtifactStore/event refs)
- **Branch**: v36-task-2-indexer-from-artifactstore-event-refs
- **Date**: 2026-06-03
- **Actor**: claude-v36-task-2-worker

## Files changed

| File | Change |
|---|---|
| `src/symphony/artifact-indexer.js` | New — indexer module: scans ArtifactStore directories and event logs, builds index entries, returns contract envelope |
| `src/symphony/console.js` | Updated `/api/artifacts` route to use indexer — scans `stateDir/artifacts` for artifacts and event logs for evidence refs; supports `kind` filtering |
| `tests/v36-artifact-indexer.test.js` | New — 20 tests covering artifact store scanning, event ref scanning, entry validation, route integration, cross-contract compatibility, boundary enforcement |
| `tests/v36-artifact-index-contract.test.js` | Updated route test to validate indexer response format (entries array vs single indexEntry) |

## What was added

- **`buildArtifactIndex({ artifactStoreDir, stateDir, goalId, taskId })`** — scans the ArtifactStore directory tree (`<dir>/<taskId>/<artifactId>.json`), reads each artifact, computes sha256 hash, infers kind and evidence_kind from content, builds index entries following the `artifact-index.v1` entry schema.
- **`scanEventRefs(stateDir, goalId)`** — reads event log NDJSON files, extracts evidence refs, creates index entries with `content_hash: null` (repo-doc refs are not hashed — that would be an arbitrary local file read).
- **`validateIndexEntry(entry)`** — validates individual index entries against the contract schema (safe refs, allowed kinds, sha256 format, ISO timestamps).
- **Route `GET /api/artifacts`** — now builds a live index from `stateDir/artifacts` (ArtifactStore) and `stateDir/goals/events/<goalId>.ndjson` (event log). Accepts optional `kind` filter. Returns the contract envelope with `entries` array.
- **Deduplication** — event ref entries are deduplicated against artifact store entries by `artifact_ref`.

## Validation results

| Check | Result |
|---|---|
| `pnpm check` | Pass — no errors |
| `pnpm test` | Pass — **899 tests, 0 failures**, 135 suites |
| `pnpm workbench:build` | Pass — built in 64ms |
| `git diff --check` | Pass — no whitespace errors |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Pass — task-2 status: planned |

## Boundaries confirmed

- **ArtifactStore remains canonical** — `context.canonicalSource: "ArtifactStore"`, `context.indexRole: "derived-cache-and-search-only"`
- **No shell execution** added — all 14 boundary fields locked to `false`
- **No model invocation** added
- **No arbitrary local file read** — event ref entries have `content_hash: null` (not hashing repo files); only ArtifactStore files within the configured directory are read and hashed
- **No git write, merge, push, tag, or publish** added
- **No second artifact store** — `secondArtifactStoreAvailable: false`
- **No artifact download or local file open** — `artifactDownloadAvailable: false`, `localFileOpenAvailable: false`
- **No self-approval path** — `selfApprovalAvailable: false`
- **State changes only from explicit backend contracts** — `stateSource: "explicit-backend-contracts"`
- **UI does not execute shell commands or invoke models**
- **v8 compatibility commands not presented as top-level App model**

## App/Workbench user path

`GET /api/artifacts?goal=<goal-id>&task=<task-id>&kind=<kind>`

- Returns a read-only artifact index with entries from the ArtifactStore and event log evidence refs
- Supports optional `kind` filter (`evidence`, `plan`, `runbook`, `fixture`, `log`, `artifact`, `bundle`, `summary`)
- Rejects unsupported query parameters (400), unsafe values (400), and non-GET methods (405)
- Cross-contract: v34 Action Registry and v35 Job Model routes verified alongside v36 index route

## Handoff

- task-2 is ready for reviewer. Reviewer evidence path: `docs/plans/v36-task-2-review-evidence-2026-06-02.md`
- Reviewer should run: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json`
- task-3 (Safe preview/search/filter API) will consume the index built by this task
