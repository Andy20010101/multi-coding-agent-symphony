# v41 task-3 worker evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-3` - Runner operation registry and sanitized evidence

Role: `worker`

Thread: `019e9a8e-38bb-71a0-aaa9-351b9dbe398e`

Branch: `v41-task-3-runner-operation-registry-sanitized-evidence`

Worktree: `/Users/andy/.codex/worktrees/v41-task-3-runner-operation-registry-sanitized-evidence`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit during worker validation: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Date: `2026-06-06`

## Implementation

Added controlled provider runner operation evidence in `src/symphony/controlled-provider-runner.js`.

The runner result now includes a `controlled-provider-runner-operation.v1` record with:

- provider id
- goal id
- task id
- role
- run id
- operation id
- command template id
- status
- exit code and signal
- started, finished, duration, timeout, and stall timing fields
- sanitized artifact refs
- redaction status
- failure layer and failure reason
- explicit boundary flags for reviewer approval, main verification, and release readiness

Added `runControlledProviderWithOperationRegistry` and `recordControlledProviderRunnerOperation`. These write provider runner operations through the existing managed `goal-operation-runs.v1` registry using `commandKind: provider-runner`. A completed provider run records `status: completed`; failed runs record `status: failed`. This does not create reviewer approval, main verification, release gate, or release-ready events.

Updated `src/symphony/goal-operation-run-registry.js` so the existing registry accepts `provider-runner` operations and the `completed` status. Existing terminal status handling still preserves `confirmed` and `failed` behavior for current Workbench event and verification operations.

Added `fixtures/contracts/controlled-provider-runner-operation.v1.json` as the task-3 operation evidence fixture.

Expanded `tests/v41-controlled-provider-runner.test.js` to cover:

- sanitized provider runner operation records persisted to the existing operation registry
- provider id, goal id, task id, role, run id, command template id, status, exit code, timing, artifact refs, redaction status, and failure layer fields
- sanitized evidence refs only
- inactive provider schema failure without invoking the process runner
- redaction failure layer
- expected-check failure layer
- generic shell and renderer provider invocation disabled in operation evidence
- rejection of operation records that expose raw provider output or secret-looking evidence

## Evidence and redaction notes

Operation artifact refs use `kind: sanitized-provider-run-summary` and refs shaped like `controlled-provider-run:<runId>:summary`.

The persisted operation record stores sanitized stdout/stderr previews only. It sets `rawProviderOutputAvailable: false` in redaction metadata, output summary, and boundary metadata.

Provider output redaction applies the shared redaction helper and an additional provider-evidence token pass for short secret-looking values such as API keys, OAuth bearer tokens, GitHub tokens, Slack tokens, and private key markers. Credential file path patterns such as `.env` are redacted by the shared helper.

Redaction failures produce `failureLayer: redaction` and do not copy raw provider output into the operation record.

Expected-check failures produce `failureLayer: expected-check` after command execution and redaction. This is separate from `command-execution`.

Schema, provider availability, command execution, timeout, redaction, workspace, and expected-check are all represented by the runner failure-layer contract.

## Boundary notes

No real `claude` or `codex` provider CLI was invoked. Tests use injected fake process runners.

No Gemini, Kiro, or DeepSeek active provider was added.

No generic shell runner was added.

No raw provider output, raw provider settings, env values, credential file contents, API keys, OAuth tokens, or secret-looking values are exposed by operation records.

Provider runner command success does not mark reviewer approval, main verification, release gates, or release readiness. Operation records explicitly set those boundary flags to `false`.

No mutation, audit, doctor, tag, push, publish, release closeout, real provider CLI, or event registration command was run.

## Files changed for task-3

- `src/symphony/controlled-provider-runner.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/v41-controlled-provider-runner.test.js`
- `fixtures/contracts/controlled-provider-runner-operation.v1.json`
- `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`

Inherited task-2 baseline files are still present in this worktree:

- `src/symphony/goal-progress-ledger.js`
- `tests/v19-goal-template.test.js`
- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`

## Validation commands

Commands run from `/Users/andy/.codex/worktrees/v41-task-3-runner-operation-registry-sanitized-evidence` unless noted otherwise.

| Command | Outcome |
| --- | --- |
| `node --test tests/v41-controlled-provider-runner.test.js` | Pass. 14 tests, 1 suite, 14 pass. |
| `node --test tests/v23-goal-operation-run-registry.test.js` | Pass. 3 tests, 1 suite, 3 pass. |
| `node --check src/symphony/controlled-provider-runner.js` | Pass. |
| `node --check src/symphony/goal-operation-run-registry.js` | Pass. |
| `node --test tests/v41-controlled-provider-runner.test.js tests/v23-goal-operation-run-registry.test.js` | Pass. 17 tests, 2 suites, 17 pass. |
| `pnpm check` | Pass. Node syntax check completed. |
| `pnpm test` | Initial run failed before full execution because this worktree did not have installed dependencies: missing `fast-check` and `react`. |
| `pnpm install --offline --frozen-lockfile` | Pass. Installed dependencies from the local pnpm store; lockfile stayed unchanged. |
| `pnpm test` | Pass after dependency setup. 1073 tests, 168 suites, 1073 pass. |
| `pnpm workbench:build` | Pass. Vite built `src/symphony/workbench-static/index.html` and assets. |
| `git diff --check` | Pass. No whitespace diagnostics. |
| `git diff --no-index --check /dev/null src/symphony/controlled-provider-runner.js` | No whitespace diagnostics. Exit code 1 is expected because the file differs from `/dev/null`. |
| `git diff --no-index --check /dev/null tests/v41-controlled-provider-runner.test.js` | No whitespace diagnostics. Exit code 1 is expected because the file differs from `/dev/null`. |
| `git diff --no-index --check /dev/null fixtures/contracts/controlled-provider-runner-operation.v1.json` | No whitespace diagnostics. Exit code 1 is expected because the file differs from `/dev/null`. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` from `/Users/andy/Documents/project/multi-coding-agent-symphony` | Pass. Returned `goal-progress-ledger.v1`; task-1 and task-2 main-verified, task-3 planned, releaseReady false. |

## Final worktree state

`git status --short` showed task-3 implementation changes plus inherited task-2 baseline files. Head remained `5495261bc260fb16fc2a83e8b3dd1c921615a42c`.
