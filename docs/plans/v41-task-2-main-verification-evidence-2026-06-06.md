# v41 task-2 main verification evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-2` - Backend runner execution adapter

Role: `main-verifier`

Thread: `019e9a86-b23c-72c1-ab70-b6852e7350e0`

Branch: `v41-task-2-backend-runner-execution-adapter`

Worktree: `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Date: `2026-06-06`

## Reviewed evidence

- Worker evidence: `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- Review evidence: `docs/plans/v41-task-2-review-evidence-2026-06-06.md`

## Verification target

Verification ran against the assigned worker worktree:

`/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`

The target implementation is present as working-tree changes on top of the assigned base commit. The relevant changed files inspected were:

- `src/symphony/controlled-provider-runner.js`
- `src/symphony/goal-progress-ledger.js`
- `tests/v19-goal-template.test.js`
- `tests/v41-controlled-provider-runner.test.js`
- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-review-evidence-2026-06-06.md`

## Diff review

The backend runner adapter stays inside the task-2 boundary:

- Active provider ids are limited to `claude-code-cli` and `codex-cli`.
- Backend-owned command templates construct the `claude` and `codex` invocations.
- Caller input is limited to provider id, v41 goal id, task id, role, mode, and reviewed refs.
- Request validation rejects arbitrary command, args, cwd, env, path, shell, executable, prompt, model, timeout, unknown UI/API execution fields, inactive providers, unsafe refs, secret-bearing field names, and secret-looking values.
- Public preview and result output do not expose executable args, raw cwd paths, env values, raw provider settings, or raw provider output.
- Tests use injected fake process runners; no real `claude` or `codex` provider CLI was invoked.
- No generic shell runner, task-3 operation registry, sanitized evidence store, Workbench UI binding, release closeout, tag, push, publish, or event registration was added.

The prior main-verification blocker is resolved:

- `src/symphony/goal-progress-ledger.js` adds a read-only checked-in runbook fallback for `goal-status`.
- The fallback is scoped to `v41-controlled-cli-provider-runner-backend-completion`.
- It reads `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json` through the existing runbook-to-ledger path.
- It does not write `.symphony` state, register events, infer review approval, infer main verification, or mark task completion.
- `tests/v19-goal-template.test.js` covers the empty state-dir case for the v41 fixture fallback.

## Commands

Commands run from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `pwd && git rev-parse HEAD && git status --short` - pass; confirmed assigned worktree and head `5495261bc260fb16fc2a83e8b3dd1c921615a42c`.
- `sed -n '1,240p' docs/plans/v41-task-2-worker-evidence-2026-06-06.md` - pass; reviewed worker evidence.
- `sed -n '1,240p' docs/plans/v41-task-2-review-evidence-2026-06-06.md` - pass; reviewed reviewer evidence.
- `git diff --stat 5495261bc260fb16fc2a83e8b3dd1c921615a42c..HEAD && git diff --name-only 5495261bc260fb16fc2a83e8b3dd1c921615a42c..HEAD` - pass; confirmed committed head matches base, so the worker target is working-tree changes.
- `git diff -- src/symphony/controlled-provider-runner.js src/symphony/goal-progress-ledger.js tests/v19-goal-template.test.js tests/v41-controlled-provider-runner.test.js` - pass; inspected tracked diff for the v41 goal-status revision and related test.
- `sed -n '1,260p' src/symphony/controlled-provider-runner.js` - pass; inspected adapter implementation.
- `sed -n '260,620p' src/symphony/controlled-provider-runner.js` - pass; inspected invocation, workspace, validation, and redaction paths.
- `sed -n '1,320p' tests/v41-controlled-provider-runner.test.js` - pass; inspected focused adapter coverage.
- `sed -n '540,660p' src/symphony/goal-progress-ledger.js` - pass; inspected scoped checked-in runbook fallback.
- `rg -n "v41-controlled|CHECKED_IN_MANAGED|readCheckedInRunbook|goal-status" tests/v19-goal-template.test.js src/symphony/goal-progress-ledger.js fixtures/contracts` - pass; confirmed v41 fixture and regression-test references.
- `node --test tests/v19-goal-template.test.js tests/v41-controlled-provider-runner.test.js` - pass; 14 tests, 2 suites, 14 pass, 0 fail.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` - pass; returned `goal-progress-ledger.v1` for the v41 goal with 5 planned tasks and task-2 present.
- `git diff --check` - pass; no whitespace diagnostics.
- `pnpm check` - pass; Node syntax check completed.
- `pnpm workbench:build` - pass; Vite built `src/symphony/workbench-static/index.html` and assets.
- `pnpm test` - pass; 1068 tests, 168 suites, 1068 pass, 0 fail.
- `git status --short --branch` - pass; final status shows the task implementation and evidence as working-tree changes.
- `git rev-parse HEAD` - pass; head remains `5495261bc260fb16fc2a83e8b3dd1c921615a42c`.

## Result

Main verification passed.

Event to register: `main.verification-passed`

No blocker remains for task-2 main verification.

## Risks

The implementation is still in the working tree rather than committed in this leased checkout. That is expected for this verification target but should be reconciled by the supervisor before merge or release handling.
