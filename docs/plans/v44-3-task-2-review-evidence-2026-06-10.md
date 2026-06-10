# v44.3 task-2 review evidence

Local run date: 2026-06-10
Timezone: Asia/Shanghai
Goal: v44-3-app-contract-context-supervisor
Task: task-2
Role: reviewer
Assigned thread: 019eaf94-dc34-79b1-84f5-533b45ec734d
Branch: codex/v44-3-pr2-projection-api-cli
Worktree: /Users/andy/.codex/worktrees/codex_v44-3-pr2-projection-api-cli
Base commit: 6a5919c43740b0593e7ea0aa5b1d9299e551c730
Reviewed worker result: /Users/andy/.codex/local-goal-supervisor/results/v44-3-app-contract-context-supervisor/019eaf89-53c1-7bc1-9303-9202f291c1ef.txt
Reviewed worker evidence: docs/plans/v44-3-task-2-worker-evidence-2026-06-10.md

## Verdict

Approved.

The task-2 implementation matches the PR-2 scope in the runbook: it composes the app read model from existing backend contracts, exposes read-only API routes, adds a JSON-only CLI mirror, and updates the Workbench API route allowlist without adding a frontend panel.

No reviewed path dispatches children, registers events, executes provider or real CLI commands, runs mutation or audit flows, writes `.symphony`, consumes result escrow, changes release closeout behavior, or changes the default command boundary away from `disabled`.

## Review checks

| Check | Result |
| --- | --- |
| `git status --short --branch` | Passed. Assigned worktree was clean before review evidence. |
| `sed -n '1,220p' /Users/andy/.codex/local-goal-supervisor/results/v44-3-app-contract-context-supervisor/019eaf89-53c1-7bc1-9303-9202f291c1ef.txt` | Passed. Worker result points to this worktree, branch, commit, and evidence ref. |
| `sed -n '260,420p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md` | Passed. PR-2 scope and stop conditions reviewed. |
| `sed -n '1,220p' docs/plans/v44-3-task-2-worker-evidence-2026-06-10.md` | Passed. Worker evidence reviewed. |
| `git diff --stat 6a5919c43740b0593e7ea0aa5b1d9299e551c730..HEAD` and `git diff --name-status 6a5919c43740b0593e7ea0aa5b1d9299e551c730..HEAD` | Passed. Reviewed the task-2 file set. |
| `git diff --unified=80 6a5919c43740b0593e7ea0aa5b1d9299e551c730..HEAD -- src/symphony/console.js scripts/symphony.js frontend/workbench/src/api/contracts.js` | Passed. API, CLI, and frontend allowlist boundaries reviewed. |
| `git diff --unified=80 6a5919c43740b0593e7ea0aa5b1d9299e551c730..HEAD -- tests/v44-goal-supervisor-app-read-model.test.js tests/workbench-api-client.test.js` | Passed. Focused tests cover read-model composition, JSON-only CLI, GET route, POST rejection, and route allowlist updates. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Passed. 5 tests passed. |
| `node --test tests/workbench-api-client.test.js` | Passed. 54 tests passed. |
| `node --test tests/v44-goal-supervisor-*.test.js` | Passed. 40 tests passed. |
| `pnpm --silent symphony supervisor status --goal v19-fixture --json \| node --input-type=module -e "..."` | Passed. Returned `goal-supervisor-app-read-model.v1`, kept command boundary disabled, kept execution unavailable, and did not expose `rawTranscript`. |
| `node --input-type=module` CLI rejection probe | Passed. `supervisor status` rejected `--confirm`, `--dry-run`, `--allow-closeout`, `--output`, and non-JSON format. |
| `git diff --check 6a5919c43740b0593e7ea0aa5b1d9299e551c730..HEAD` | Passed. No whitespace errors in the task diff. |
| `pnpm check` | Passed. Repository syntax check passed. |
| `node --input-type=module` route probe with `createSymphonyConsoleServer` | Passed. `GET /api/goals/latest/supervisor` returned the read model; query parameters and encoded slash route refs returned `invalid-goal-ref`; `POST` returned `method-not-allowed`. |

One ad hoc route probe used `%2e%2e` and expected a route-parser 400, but the HTTP URL normalized it before route parsing and returned 404. The corrected encoded-slash and query probes above covered stable invalid route inputs.

## Boundary review

- `src/symphony/goal-supervisor/app-read-model-pipeline.js` loads existing runbook, event log, progress ledger, goal-next action, supervisor observability, and the v44 core projection, then passes normalized fields into `goal-supervisor-app-read-model.v1`.
- `src/symphony/goal-supervisor/app-read-model.js` keeps `readOnly: true`, `willMutate: false`, `commandBoundary.state: disabled`, `executionAvailable: false`, and no raw transcript fields.
- `src/symphony/console.js` exposes `/api/goals/latest/supervisor` and `/api/goals/<goal-id>/supervisor` through the existing GET-only console path and goal route segment validation.
- `scripts/symphony.js` adds `supervisor status` as a read-only JSON output path and rejects write-flow, output-file, and non-JSON options.
- `frontend/workbench/src/api/contracts.js` only adds the latest and scoped supervisor routes to the read-only API list and route template allowlist.

## Residual risk

PR-3 still needs the real read-only Codex and Claude session hook runtime. Until then, `contextStatus` is limited to existing repository contract and observability inputs, not live transcript availability or token usage.

## Next action

Register `reviewer.approved` for `docs/plans/v44-3-task-2-review-evidence-2026-06-10.md`, then dispatch task-2 main verification.
