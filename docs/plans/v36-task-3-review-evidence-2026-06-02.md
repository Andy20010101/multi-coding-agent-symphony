# v36 task-3 review evidence

## Review identity

- Goal: `v36-artifact-evidence-index-workspace`
- Task: `task-3` (Safe preview/search/filter API)
- Branch: `v36-task-3-safe-preview-search-filter-api`
- Role: reviewer (`claude-v36-task-3-reviewer`)
- Date: 2026-06-03

## Files reviewed

- `src/symphony/safe-preview-search.js` (new, 236 lines)
- `tests/v36-safe-preview-search.test.js` (new, 397 lines)
- `src/symphony/console.js` (modified, +38/-6 lines)

## Findings

### 1. Boundary: searchArtifactEntries never reads file_path (PASS)

The text search at `safe-preview-search.js:138-151` checks only `artifact_ref`, `goal_id`, `task_id`, `kind`, `evidence_kind`, and `labels`. The `file_path` field is never accessed or followed. Test at `v36-safe-preview-search.test.js:331-351` confirms that an entry with `file_path: '/etc/passwd'` and text "etc" elsewhere does not match — the function only searches the declared safe fields.

### 2. Boundary: validateSearchFilters restricts all inputs (PASS)

The validator at `safe-preview-search.js:41-97` enforces:

- **Whitelist**: only `q`, `kind`, `goalId`, `taskId`, `evidenceKind` are allowed; unexpected keys are rejected with an error.
- **Query length**: max 256 characters; longer queries rejected.
- **Query charset**: `SAFE_QUERY_TOKEN_RE` restricts to alphanumeric, CJK, common punctuation. Backslash, null bytes, and non-printable characters are excluded.
- **Traversal rejection**: queries containing `..`, the `file:` prefix, or backslash are explicitly rejected regardless of the charset regex.
- **Enum validation**: `kind` must be in `ARTIFACT_KINDS`; `evidenceKind` must be in `EVIDENCE_KINDS`.
- **Safe ref validation**: `goalId` and `taskId` must match `SAFE_PARAM_TOKEN_RE` (`/^[A-Za-z0-9][A-Za-z0-9._-]*$/u`), which rejects path traversal and injection patterns.

### 3. Boundary: /api/artifacts route maintains contract integrity (PASS)

The `console.js` diff shows:

- `allowedParams` extended to include `q` — no other params added.
- Invalid queries return HTTP 400 with a descriptive error before any index processing.
- Filters are applied through `searchArtifactEntries` which validates internally and returns `[]` on invalid input.
- The response `context.searchQuery` field is set for transparency.
- No new routes, no new HTTP methods, no new write paths.

### 4. Observation: labels array assumption (LOW, non-blocking)

`searchArtifactEntries` at line 147 calls `entry.labels.some(...)` without a defensive guard for non-array labels. The artifact index contract guarantees labels is an array, and entries come from the validated indexer pipeline. Not exploitable under normal data flow; a defense-in-depth `Array.isArray` guard could be considered but is not required given the contract guarantee.

### 5. Observation: backtick in SAFE_QUERY_TOKEN_RE (LOW, non-blocking)

The query charset regex includes backtick (`` ` ``). Since the query value is only consumed by `String.prototype.includes()` for substring matching — never interpolated into template literals, never passed to `eval()`, never used as a filesystem path — this character presents no injection surface.

### 6. No impact on v34/v35/v36 contracts (PASS)

The change touches only `console.js` (`/api/artifacts` route handler) and adds only the new `safe-preview-search.js` module. It does not modify:

- v34 action registry routes or contracts
- v35 job model contract or job routes
- v36 artifact indexer (`artifact-indexer.js`)
- v36 artifact index contract (`artifact-index-contract.js`)
- Any frontend routing or API client definitions

### 7. No new capabilities added (PASS)

Every response from `buildSearchResponse` includes explicit boundary gates, all set to `false`:

- `shellExecutionAvailable`, `modelInvocationAvailable`, `arbitraryPathReadAvailable`
- `gitWriteAvailable`, `mergeAvailable`, `pushAvailable`, `tagAvailable`, `publishAvailable`
- `downloadAvailable`, `localFileOpenAvailable`, `selfApprovalAvailable`

The `readOnly` gate is set to `true`, and `dataSource` is locked to `derived-artifact-index-only`. ArtifactStore remains canonical.

## Test coverage

All 37 tests in `tests/v36-safe-preview-search.test.js` pass across 6 suites:

| Suite | Tests | Status |
|---|---|---|
| `validateSearchFilters` | 10 | PASS |
| `assertSearchFilters` | 2 | PASS |
| `searchArtifactEntries` | 15 | PASS |
| `buildSearchResponse` | 5 | PASS |
| `boundaries` | 2 | PASS |
| `contract constants` | 3 | PASS |

Related regression tests pass:

| Suite | Tests | Status |
|---|---|---|
| v34 action-manifest | 3 | PASS |
| v34 action-preview | 4 | PASS |
| v34 action-availability | 4 | PASS |
| v34 migration guide | 1 | PASS |
| v15 Workbench read-only API client | 43 | PASS |
| v16 Workbench route smoke | 11 | PASS |

Full test suite: 131 tests, all pass, 0 fail.

## Validation commands

| Command | Result |
|---|---|
| `pnpm check` | PASS (exit 0) |
| `pnpm test` (131 tests) | PASS (all pass, 0 fail) |
| `pnpm workbench:build` | PASS (built in 65ms) |
| `git diff --check` | PASS (no output) |
| `symphony actions manifest --json` | PASS (5 actions) |
| `symphony actions availability --json` | PASS (all resolved) |
| `symphony actions preview --action goal.worker-evidence.record --json` | PASS (available) |
| `symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | PASS (clean, task-3 in-progress) |

## Verdict

APPROVED. The implementation is read-only, copy-only, and correctly enforces all safety boundaries. Search operates only on derived index metadata fields. File paths are never accessed or followed. Input validation is comprehensive and correctly rejects traversal patterns, excessive lengths, and unexpected parameters. No new write, execute, or self-approval capabilities are added.

## Handoff

Task: v36-task-3 (Safe preview/search/filter API)
Branch: v36-task-3-safe-preview-search-filter-api
Files changed: src/symphony/safe-preview-search.js, tests/v36-safe-preview-search.test.js, src/symphony/console.js
Verdict: APPROVED
Risks: None blocking. Two LOW observations noted (labels array guard, backtick in charset) — neither exploitable given the data flow and usage context.
Next: Main verifier should run main-verification gate on this task.
