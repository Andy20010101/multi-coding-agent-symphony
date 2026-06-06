# v41 task-4 worker evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-4` - Workbench preview and confirm binding

Role: `worker`

Thread: `019e9aa9-ab3b-7541-8066-345cfc71d62d`

Branch: `v41-task-4-workbench-preview-confirm-binding`

Worktree: `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit during worker validation: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Date: `2026-06-06`

## Implementation

Added backend preview and confirm contracts in `src/symphony/controlled-provider-runner.js`.

The preview contract is `controlled-provider-runner-plan-preview.v1`. It returns:

- provider id
- goal id, task id, role, and mode
- reviewed prompt, evidence, and handoff refs
- backend-owned command template id and adapter id
- expected sanitized provider runner artifact refs
- safety flags for command, provider binary, cwd, prompt text, secrets, renderer invocation, generic shell runner, and status inference
- preview endpoint rules
- confirm endpoint rules
- deterministic plan id and plan hash

The confirm contract is `controlled-provider-runner-confirmation.v1`. It accepts only the previewed context fields plus `planId` and `planHash`, rebuilds the preview on the backend, rejects mismatched plan ids or hashes, and then records the provider runner operation through the existing operation registry. It does not accept arbitrary command text, provider binaries, cwd paths, raw prompt text, secret values, or inactive providers.

Added console API routes in `src/symphony/console.js`:

- `GET /api/goals/latest/provider-runner-preview`
- `GET /api/goals/<goal-id>/provider-runner-preview`
- `POST /api/goals/latest/provider-runner-confirm`
- `POST /api/goals/<goal-id>/provider-runner-confirm`

Preview only accepts these query fields: `task`, `role`, `provider`, `mode`, `promptRef`, `evidenceRef`, and `handoffRef`.

Confirm requires `application/json`, rejects query parameters, and only accepts these body fields: `goalId`, `taskId`, `role`, `providerId`, `mode`, `promptRef`, `evidenceRef`, `handoffRef`, `planId`, and `planHash`.

Updated the Workbench API model in `frontend/workbench/src/api/contracts.js` and `frontend/workbench/src/api/client.js`.

The Workbench now fetches the v41 provider runner preview only for the active v41 controlled provider runner goal and allowed next-action roles. The projected model exposes the plan hash, template id, expected artifacts, confirm endpoint, allowed fields, backend safety flags, and the latest `provider-runner` operation status from `goal-operation-runs.v1`.

Updated `frontend/workbench/src/App.jsx` with a controlled provider runner panel. The panel displays the backend preview, reviewed context, expected artifacts, endpoint restrictions, safety boundary fields, and operation status. Its confirm action posts only the previewed context plus `planId` and `planHash`.

Rebuilt the Workbench static bundle in `src/symphony/workbench-static`.

## Boundary notes

No real `claude` or `codex` provider CLI was invoked. Backend route tests used an injected fake runner.

No generic shell runner or renderer-side provider invocation was added.

No UI field was added for arbitrary command text, provider binary path, cwd path, prompt text, or secrets.

Workbench status display reads operation status and artifact refs from backend contracts. It does not infer reviewer approval, main verification, release gate passage, or release readiness from provider runner output.

No mutation, audit, doctor, tag, push, publish, release closeout, real provider CLI, or event registration command was run.

## Tests added or updated

Updated `tests/v41-controlled-provider-runner.test.js` to cover backend preview and confirm binding:

- preview contract name, plan hash, reviewed context, safety fields, and expected artifacts
- confirm writes one provider runner operation with the fake runner
- confirm rejects arbitrary `command` body fields before runner invocation
- confirm rejects plan hash mismatch
- HTTP preview route returns `controlled-provider-runner-plan-preview.v1`
- HTTP preview rejects arbitrary query fields
- HTTP confirm returns `controlled-provider-runner-confirmation.v1` with refreshed operations
- HTTP confirm rejects arbitrary body fields before a second fake runner invocation

Updated `tests/workbench-api-client.test.js` to cover the Workbench projection for `activeGoal.controlledProviderRunnerPreview`, including plan hash, expected artifacts, confirm plan hash requirement, endpoint rejection flags, safety flags, operation bridge status, and false reviewer/main/release inference fields.

Updated `tests/workbench-shell.test.js` so the new preview route is listed in the approved frontend API paths.

## Files changed for task-4

- `src/symphony/controlled-provider-runner.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/App.jsx`
- `tests/v41-controlled-provider-runner.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-3PVjv4nj.js`
- `src/symphony/workbench-static/assets/index-CWx2oU-7.js`
- `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`

Inherited task-2 and task-3 baseline files are still present in this worktree:

- `src/symphony/goal-progress-ledger.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/v19-goal-template.test.js`
- `fixtures/contracts/controlled-provider-runner-operation.v1.json`
- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`

## Validation commands

Commands run from `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`.

| Command | Outcome |
| --- | --- |
| `node --test tests/v41-controlled-provider-runner.test.js` | Pass. 16 tests, 1 suite, 16 pass. |
| `node --test tests/workbench-api-client.test.js` | Pass. 53 tests, 1 suite, 53 pass. |
| `node --check src/symphony/controlled-provider-runner.js && node --check src/symphony/console.js && node --check frontend/workbench/src/api/client.js && node --check frontend/workbench/src/api/contracts.js` | Pass. |
| `node --check frontend/workbench/src/App.jsx` | Unsupported for this file type in Node; failed before validation because `.jsx` is not handled by `node --check`. |
| `pnpm check` | Pass. |
| `pnpm test` | Initial run failed before full execution because this worktree did not have installed dependencies: missing `fast-check` and `react`. |
| `pnpm workbench:build` | Initial run failed because this worktree did not have installed dependencies: missing `vite`. |
| `pnpm install --offline --frozen-lockfile` | Pass. Installed dependencies from the local pnpm store; lockfile stayed unchanged. |
| `pnpm test` | One intermediate run failed because `tests/workbench-shell.test.js` did not yet list the new provider runner preview route. |
| `pnpm test` | Final pass. 1076 tests, 168 suites, 1076 pass. |
| `pnpm workbench:build` | Final pass. Vite built `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-3PVjv4nj.js`. |
| `git diff --check` | Pass. No whitespace diagnostics. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` | Pass. Returned `goal-progress-ledger.v1`; 5 planned tasks, releaseReady false. |

## Final worktree state

Head remained `5495261bc260fb16fc2a83e8b3dd1c921615a42c`.

The worktree contains task-4 implementation files, rebuilt Workbench static assets, this evidence file, and inherited task-2/task-3 baseline files copied into the assigned worktree.
