# v36 task-3 worker evidence

## Task identity

- Goal: `v36-artifact-evidence-index-workspace`
- Task: `task-3` (Safe preview/search/filter API)
- Branch: `v36-task-3-safe-preview-search-filter-api`
- Role: worker
- Date: 2026-06-03

## Files changed

- `src/symphony/safe-preview-search.js` (new) — 209 lines
- `tests/v36-safe-preview-search.test.js` (new) — 310 lines
- `src/symphony/console.js` (modified) — +38/-6 lines

## What was implemented

### New module: `src/symphony/safe-preview-search.js`

Provides safe search and filter on derived artifact index entries. Key exports:

- `searchArtifactEntries(entries, filters)` — filters and searches index entries by `q`, `kind`, `goalId`, `taskId`, `evidenceKind`. Only operates on in-memory array data — never reads the file system.
- `validateSearchFilters(filters)` — validates all search params are safe. Rejects unexpected keys, path traversal in query strings, and arbitrary values.
- `assertSearchFilters(filters)` — assertion wrapper that throws on invalid input.
- `buildSearchResponse(entries, filters, options)` — builds a full `safe-preview-search.v1` contract response with boundaries, filter counts, and results.
- Constants: `ALLOWED_SEARCH_PARAMS`, `SAFE_PREVIEW_SEARCH_CONTRACT_NAME`, `SAFE_PREVIEW_SEARCH_CONTRACT_VERSION`.

Safety boundaries encoded in every response:

- `readOnly: true`
- `dataSource: derived-artifact-index-only`
- `canonicalSource: ArtifactStore is canonical, index is derived cache only`
- All execution/write/publish/download gates set to `false`.

### API change: `/api/artifacts` query parameter

Added `q` query parameter to `GET /api/artifacts`. The endpoint already supported `goal`, `task`, `kind` filter params. The new `q` param enables text search across entry fields (artifact_ref, goal_id, task_id, kind, evidence_kind, labels).

Query validation rejects:
- Empty strings
- Over 256 characters
- Unsafe characters (non-printable, non-text)
- Path traversal patterns (`..`, `file:`, `\`)

### Test: `tests/v36-safe-preview-search.test.js`

37 tests across 6 suites:

- `validateSearchFilters` (10 tests) — valid params, empty filters, non-plain-object, unexpected keys, empty/long/unsafe query, invalid kind, unsafe goalId/taskId, invalid evidenceKind
- `assertSearchFilters` (2 tests) — success return, throws on invalid
- `searchArtifactEntries` (15 tests) — non-array input, empty filters, filter by kind/goalId/taskId/evidenceKind, text search in artifact_ref/goal_id/labels, case-insensitive, combined filters, invalid filters return empty, no-match return empty
- `buildSearchResponse` (5 tests) — contract metadata, all entries, error response, boundaries, filterCounts
- `boundaries` (2 tests) — no file system read from entry file_path fields, search only on derived data
- `contract constants` (3 tests) — ALLOWED_SEARCH_PARAMS, contract name, contract version

## Validation results

| Command | Result |
|---|---|
| `pnpm check` | PASS (exit 0) |
| `pnpm test` (131 tests) | PASS (all 131 pass, 0 fail) |
| `pnpm workbench:build` | PASS (built in 65ms) |
| `git diff --check` | PASS (no output) |
| `symphony actions manifest --json` | PASS (5 actions registered) |
| `symphony actions availability --json` | PASS (all resolved) |
| `symphony actions preview --action goal.worker-evidence.record --json` | PASS (available) |
| `symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | PASS (clean) |

## App/Workbench user path

- `GET /api/artifacts?q=<text>` — search index entries by text across refs, labels, and metadata
- `GET /api/artifacts?goal=<id>&task=<id>&kind=<kind>&q=<text>` — combined filter + search
- The Workbench artifact index panel connects to `/api/artifacts` via the existing `READONLY_API_ROUTES` route definition

## What this task does NOT add

- Job execution, shell execution, model invocation
- Git write, merge, push, tag, publish
- Arbitrary path reading (search operates only on derived index data)
- Artifact download or local file open
- Auto-merge, auto-push, auto-tag
- Self-approval
- Second source of truth replacing ArtifactStore

## Boundary notes

- Search and filter only operate on in-memory index entry arrays — the `searchArtifactEntries` function never touches the file system
- The `buildSearchResponse` function only reads from passed-in entries, not from disk
- The `file_path` field on entries is not accessed or followed during search
- `validateSearchFilters` rejects path traversal patterns (`..`, `file:`, `\`) and chars outside the safe query charset
- ArtifactStore remains canonical; index is derived cache/search only

## Risks

- None. The module is read-only and copy-only. All search operates on derived data only.
- Task-4 (evidence timeline and release bundle view) may want to use the search module for timeline filtering.

## Reviewer handoff

- Worker evidence: `docs/plans/v36-task-3-worker-evidence-2026-06-02.md`
- Files to review: `src/symphony/safe-preview-search.js`, `tests/v36-safe-preview-search.test.js`, `src/symphony/console.js` diff
- Review focus: boundary enforcement (no file system reads from search), safe param validation, test coverage
