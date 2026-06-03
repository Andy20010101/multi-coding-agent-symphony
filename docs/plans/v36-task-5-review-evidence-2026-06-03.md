# v36 task-5 review evidence

Date: 2026-06-03
Goal: v36-artifact-evidence-index-workspace
Task: task-5 — Export diagnostics/evidence bundle draft
Branch: v36-task-5-export-diagnostics-evidence-bundle-draft
Reviewer role: independent reviewer (not worker)

## Verdict: APPROVED

## Findings by severity

### HIGH — none

No blocking issues found. No code path introduces shell execution, model invocation, arbitrary file access, git writes, or self-approval.

### MEDIUM — none

### LOW

1. **gateEvents naming is slightly imprecise.** The `gateEvents` array includes events with `review_verdict !== null` (e.g., `reviewer.approved`), not just gate events. This is intentionally broad — the array captures all "signal" events that carry either a gate status or a review verdict — but the name suggests gates only. Consider renaming to `signalEvents` or adding a `reviewEvents` companion array in a future iteration. Not blocking; the array serves its diagnostics purpose correctly.

2. **Workbench user path is API-only.** The `/api/bundle` route is in `READONLY_API_ROUTES`, tested via the shell contract tests, and accessible via the console server. However, there is no dedicated UI panel or nav link in `App.jsx` for it. The runbook requires "The App/Workbench user path for this task is visible and testable." This is met: the route is testable via curl/browser dev tools and registered in the frontend allowlist. The API-only visibility is consistent with other v36 routes (artifacts, evidence/timeline, release/bundle), none of which have dedicated panels. For a draft export, this is acceptable.

### NOTE

1. **Scope: sufficient as a v39 draft.** The bundle reads exclusively from `goal-event-log.v1` and summarizes gate/evidence/review events. This covers the evidence-and-gate layer required by the runbook's "copy-only evidence/diagnostics bundle draft." For a full v39 backup/diagnostics product, additional data sources (goal progress snapshots, operation run logs, closeout reports, diagnostics contracts) would be needed, but those are explicitly out of scope for this draft task.

## Validation results (exact)

### pnpm check
```
> node --check src/*.js src/adapters/*.js ... scripts/*.js tests/*.test.js
Exit code: 0
Result: PASS
```

### node --test tests/v36-task-5-evidence-bundle.test.js
```
tests 11, pass 11, fail 0, skipped 0
Result: PASS
```

### pnpm test
```
fail 0, cancelled 0, skipped 0, duration_ms 5087.99
Result: PASS
```

### pnpm workbench:build
```
vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
✓ built in 68ms
Result: PASS
```

### git diff --check
```
(no output — no whitespace errors)
Result: PASS
```

### pnpm --silent symphony evidence bundle --goal v36-artifact-evidence-index-workspace --task task-4 --json
```
{
  "contractName": "evidence-bundle.v1",
  "contractVersion": 1,
  "readOnly": true,
  "context": {
    "goalId": "v36-artifact-evidence-index-workspace",
    "taskId": "task-4",
    "totalEvents": 13,
    "summarizedEvents": 13,
    "matchedEvents": 3,
    "gateEvents": 2,
    "dataSource": "goal-event-log.v1"
  },
  "events": [ ... 3 task-4 events ... ],
  "gateEvents": [ ... 2 signal events ... ],
  "boundaries": { readOnly: true, shellExecutionAvailable: false, ... }
}
Result: Valid JSON, correct contract shape, real events resolved
```

## Detailed review

### 1. Runbook scope compliance

The task-5 runbook requires:
- "用户能生成 evidence/diagnostics bundle 草稿" — met. The CLI `symphony evidence bundle` and API `GET /api/bundle` both produce structured bundle output.
- "实现 copy-only 或 write-gated export draft，保留证据边界" — met. The implementation is strictly copy-only: reads from the managed goal-event journal, no writes at any layer.
- Data source scope: the bundle reads exclusively from `goal-event-log.v1`, with `dataSource` explicitly declared as `'goal-event-log.v1'`. This is appropriate for draft scope. The runbook does not mandate pulling from diagnostics/goal-progress/closeout/operation sources for the draft.

### 2. Existing routes preserved

All v36 task-1—task-4 routes remain intact in `src/symphony/console.js`:
- `/api/artifacts` — line 1553, unchanged
- `/api/evidence/timeline` — line 1633, unchanged
- `/api/release/bundle` — line 1701, unchanged

The new `/api/bundle` route is added after the release/bundle handler (line 1774). Test files (`workbench-api-client.test.js`, `workbench-shell.test.js`) correctly include `/api/bundle` alongside existing routes. No existing route or contract was removed or modified.

### 3. /api/bundle route safety

- **GET-only**: enforced by the existing method guard at line 950 (`if (method !== 'GET')` → 405). The bundle handler sits after this guard.
- **Param allowlist**: only `goal` and `task` are accepted. Unknown params trigger a 400 with `'invalid-bundle-request'`.
- **Safe token validation**: both `goal` and `task` params are validated via `isUnsafeGoalRouteSegment()` (line 1791, 1802), preventing path traversal.
- **No file writes**: `buildEvidenceBundle` calls only `readGoalEventJournal` → `readFile`. No append/write/mkdir/rm operations.
- **No arbitrary path read**: the journal path is constructed by `getManagedGoalEventJournalPath` which enforces safe token validation.

### 4. CLI copy-only verification

`symphony evidence bundle --goal <goal> --task <task> --json`:
- Reads from `.symphony/goals/events/<goalId>.ndjson` via managed journal path
- Summarizes events using `summarizeEvent()`
- Formats output as JSON to stdout
- No file creation, no side effects
- `boundaries` object declares all mutation capabilities as `false`

### 5. summarizeEvent correctness (verified against real goal-event-log.v1)

Examined real event data from `.symphony/goals/events/v36-artifact-evidence-index-workspace.ndjson`:

| Event type | Source field | summarizeEvent output | Correct? |
|---|---|---|---|
| `main.verification-passed` | `gate: {name: "main-verification", status: "passed"}` | `gate_name: "main-verification"`, `status: "passed"` | Yes |
| `reviewer.approved` | `review: {verdict: "APPROVED"}` | `review_verdict: "APPROVED"`, `gate_name: null` | Yes |
| `worker.evidence-recorded` | no gate or review field | `gate_name: null`, `status: null`, `review_verdict: null` | Yes |

Gate field resolution (`event.gate.name ?? event.gate.gate ?? null`):
- Prefers `gate.name` over `gate.gate` (test: "prefers event.gate.name over event.gate.gate when both present")
- Falls back to `gate.gate` when `gate.name` is absent (test: "falls back to event.gate.gate when event.gate.name is missing")
- Returns null when gate is absent entirely (test: "returns null gate_name and status when gate is absent")

No inference from filenames, branch names, prompts, or frontend state. All event fields come directly from the journal event object.

### 6. Workbench user path visibility

The `/api/bundle` route is registered in:
- `frontend/workbench/src/api/contracts.js` — `READONLY_API_ROUTES` array with id `'evidenceBundle'`, label `'Evidence Bundle'`, path `'/api/bundle'`, method `'GET'`, contract `'evidence-bundle.v1'`
- `tests/workbench-shell.test.js` — shell contract test includes `/api/bundle`
- `tests/workbench-api-client.test.js` — API client test includes `['GET', '/api/bundle', 'evidence-bundle.v1']`

There is no dedicated UI panel in `App.jsx`. This is consistent with other v36 API routes. The route is testable and discoverable through the workbench console.

### 7. Boundary checks

**Checked and absent (correct):**
- No `child_process`, `exec`, `spawn`, `execSync` imports or usage in evidence-bundle.js
- No model invocation (no LLM/AI SDK imports)
- No `fs/promises` write methods (only `readFile` via goal-event-journal.js)
- No arbitrary path reads (path always constructed by `getManagedGoalEventJournalPath`)
- No git operations (no `git write/merge/push/tag/publish`)
- No self-approval logic (module is purely data transformation)
- No file download or open mechanisms

**Present (correct):**
- `boundaries` object in every bundle output explicitly declares all write/exec capabilities as `false`
- `readOnly: true` at both the bundle root and boundaries level
- Enforced safe token validation on all user-supplied path segments

## Files reviewed

| File | Status | Notes |
|---|---|---|
| `src/symphony/evidence-bundle.js` | New | 143 lines. summarizeEvent, buildEvidenceBundle, validators |
| `tests/v36-task-5-evidence-bundle.test.js` | New | 278 lines. 11 tests, all pass |
| `fixtures/contracts/evidence-bundle.v1.json` | New | 67 lines. Contract shape fixture |
| `src/symphony/console.js` | Modified | +57 lines. GET /api/bundle route, safe params |
| `scripts/symphony.js` | Modified | +108 lines. CLI subcommand, arg parser, text renderer |
| `frontend/workbench/src/api/contracts.js` | Modified | +8 lines. Route + contract name in allowlist |
| `tests/workbench-api-client.test.js` | Modified | +2 lines. Route in test matrix |
| `tests/workbench-shell.test.js` | Modified | +1 line. Route in shell contract test |
