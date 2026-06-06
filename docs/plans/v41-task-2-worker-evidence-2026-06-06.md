# v41 task-2 worker evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-2` - Backend runner execution adapter

Branch: `v41-task-2-backend-runner-execution-adapter`

Worktree: `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

## Implementation

Added `src/symphony/controlled-provider-runner.js`.

The adapter accepts only:

- `providerId`
- `goalId`
- `taskId`
- `role`
- `mode`
- reviewed refs: `promptRef`, `evidenceRef`, `handoffRef`

Active provider ids are exactly:

- `claude-code-cli`
- `codex-cli`

Backend-owned command templates are selected in code:

- `claude-code-cli` -> executable `claude`, template `v41.claude-code-cli.reviewed-prompt.v1`
- `codex-cli` -> executable `codex`, template `v41.codex-cli.reviewed-prompt.v1`

The public preview exposes template ids, adapter ids, timeout, workspace policy, and safety flags. It does not expose executable args, cwd paths, env values, raw provider settings, or raw provider output.

The runner rejects:

- arbitrary `command`, `args`, `cwd`, `env`, `path`, `workspace`, `prompt`, `model`, shell, executable, and provider-binary fields
- unknown UI/API execution fields such as renderer command, browser query, and plan hash
- inactive providers including Gemini, Kiro, and DeepSeek
- shell metacharacters and absolute or parent-traversal refs
- secret-bearing field names and secret-looking values
- workspace roots outside the backend allowlist

Provider execution is bounded by backend-selected cwd, allowed workspace roots, timeout/stall timeout, redacted output previews, and failure layers for schema, provider availability, command execution, timeout, redaction, workspace, and expected-check.

## Tests

Added `tests/v41-controlled-provider-runner.test.js`.

Coverage includes:

- active provider allowlist
- sanitized preview fields
- rejected arbitrary command/cwd/env/path/provider drift
- rejected unknown UI/API-controlled execution fields
- active goal/task/role/mode/ref anchoring
- backend-owned Claude and Codex invocation templates through an injected fake runner
- timeout and provider availability failure layers
- backend workspace allowlist enforcement

## Validation

Commands run from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `git status --short --branch` - pass; task branch with untracked adapter/test files before evidence.
- `git ls-files --others --exclude-standard` - pass; before evidence, untracked source files were `src/symphony/controlled-provider-runner.js` and `tests/v41-controlled-provider-runner.test.js`.
- `node --test tests/v41-controlled-provider-runner.test.js` - pass; 9 tests, 1 suite, 9 pass, 0 fail.
- `pnpm check` - pass.
- `git diff --check` - pass.
- `pnpm install --offline --frozen-lockfile` - pass; used only to populate missing `node_modules` from the local pnpm store after the first full test/build attempts reported missing packages.
- `pnpm test` - pass after dependency install; 1067 tests, 168 suites, 1067 pass, 0 fail.
- `pnpm workbench:build` - pass after dependency install; Vite built `src/symphony/workbench-static/index.html` and assets successfully.

Earlier environment note: before `node_modules` existed in this worktree, `pnpm test` failed on missing `fast-check`/`react`, and `pnpm workbench:build` failed because `vite` was unavailable. Those failures were dependency setup issues, not adapter failures. After `pnpm install --offline --frozen-lockfile`, both commands passed.

## Boundary notes

No real `claude` or `codex` provider CLI was invoked. Tests use an injected fake process runner.

No generic shell runner was added.

No task-3 operation registry, sanitized evidence store, Workbench UI, preview/confirm binding, release gate, tag, push, publish, or event registration was implemented.

The adapter does not approve review, pass main verification, or declare release readiness from command success.

Suggested worker evidence path: `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`

## Revision: goal-status visibility for v41 fixture

Main verification failed because:

- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` returned exit code 64 with `goal not found`.
- The checked-in v41 runbook fixture was present at `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`.
- No task-2 adapter test, syntax check, full test, Workbench build, or whitespace check failed in the verifier evidence.

Revision implemented:

- Added a read-only `goal-status` fallback in `src/symphony/goal-progress-ledger.js` for the checked-in v41 managed runbook fixture.
- Scoped the fallback to `v41-controlled-cli-provider-runner-backend-completion` so older checked-in fixtures such as v33 remain invisible without managed state.
- Reused the existing runbook-to-ledger path; the fallback does not write `.symphony` state, register events, mark review/main verification passed, or infer task completion.
- Added a regression test in `tests/v19-goal-template.test.js` covering an empty temporary state dir plus `goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json`.

Revision validation from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `node --test tests/v19-goal-template.test.js tests/v41-controlled-provider-runner.test.js` - pass; 14 tests, 2 suites, 14 pass.
- `node --test tests/v33-app-state-snapshot.test.js` - pass; 7 tests, 1 suite, 7 pass.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` - pass; returned `goal-progress-ledger.v1` for the v41 goal with 5 planned tasks and task-2 present.
- `pnpm test` - pass; 1068 tests, 168 suites, 1068 pass, 0 fail.
- `pnpm check` - pass.
- `pnpm workbench:build` - pass; Vite built `src/symphony/workbench-static/index.html` and assets.
- `git diff --check` - pass.

No real `claude` or `codex` provider CLI was invoked. No mutation, audit, doctor, tag, push, publish, provider CLI, or release closeout command was run.

## Fresh worker revision recheck: thread 019e9a77-0edc-7932-a8d3-18f1c28e7b6e

Reconciled from the assigned worktree and reran the failing verifier path. No implementation changes were needed beyond the existing scoped revision above.

Commands run from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `node --test tests/v19-goal-template.test.js tests/v41-controlled-provider-runner.test.js` - pass; 14 tests, 2 suites, 14 pass, 0 fail.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` - pass; returned `goal-progress-ledger.v1` for the v41 goal with 5 planned tasks and task-2 present.
- `git diff --check` - pass.
- `pnpm check` - pass.
- `pnpm test` - pass; 1068 tests, 168 suites, 1068 pass, 0 fail.
- `pnpm workbench:build` - pass; Vite built `src/symphony/workbench-static/index.html` and assets.

No real `claude` or `codex` provider CLI was invoked. No mutation, audit, doctor, tag, push, publish, provider CLI, or release closeout command was run.
