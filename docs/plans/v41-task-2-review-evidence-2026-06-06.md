# v41 task-2 review evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-2` - Backend runner execution adapter

Branch: `v41-task-2-backend-runner-execution-adapter`

Worktree: `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

## Review target

Reviewed worker evidence:

- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`

Reviewed implementation files:

- `src/symphony/controlled-provider-runner.js`
- `tests/v41-controlled-provider-runner.test.js`

## Findings

No blocking findings.

The adapter stays within the task-2 boundary. It adds a backend-owned controlled provider runner, validation helpers, sanitized preview/result output, and focused tests. It does not add a task-3 operation registry, evidence store, Workbench UI binding, release closeout, tag, push, or real provider CLI smoke flow.

The active provider surface is limited to `claude-code-cli` and `codex-cli`. Gemini, Kiro, DeepSeek, arbitrary provider ids, and generic shell inputs are rejected.

The request validator rejects direct command, argv, cwd, env, shell, stdin, prompt, path, executable, provider binary, timeout, and unknown UI/API execution fields. Reviewed refs reject absolute paths, parent traversal, shell metacharacters, and empty values. Secret-bearing field names and secret-looking values are rejected.

Command construction is backend-owned. The caller selects only provider id, role, mode, and reviewed refs; executable names and args are selected from internal templates. Public preview data exposes template ids, adapter ids, timeout, workspace policy, and safety flags, but not executable args, raw cwd paths, env values, raw provider settings, or raw provider output.

Output handling returns redacted previews and marks raw provider output unavailable. Failure layers cover schema, workspace, provider availability, command execution, and timeout paths used by this task.

## Validation

Commands run from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `node --test tests/v41-controlled-provider-runner.test.js` - pass; 9 tests, 1 suite, 9 pass, 0 fail.
- `pnpm check` - pass.
- `git diff --check` - pass.

Worker evidence records additional successful validation after dependency setup:

- `pnpm test` - pass; 1067 tests.
- `pnpm workbench:build` - pass.

`git diff --no-index --check /dev/null <new-file>` was also run for the three new task files. It produced no whitespace output; the non-zero no-index status is expected because the files differ from `/dev/null`.

## Verdict

APPROVED

Next action: register `reviewer.approved` for `docs/plans/v41-task-2-review-evidence-2026-06-06.md`, then route task-2 to main verification.

## Fresh reviewer recheck: thread 019e9a7f-8718-7830-b9de-d134dde3d4a8

Reviewed latest worker evidence:

- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`

Reviewed worker revision target:

- Worktree: `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`
- Branch: `v41-task-2-backend-runner-execution-adapter`
- Head commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Findings:

No blocking findings.

The worker revision addresses the prior main-verification blocker by adding a scoped, read-only `goal-status` fallback for the checked-in v41 managed runbook fixture. The fallback is limited to `v41-controlled-cli-provider-runner-backend-completion`, reuses the runbook-to-ledger path, and does not write `.symphony` state or infer worker/reviewer/main verification status.

The task-2 adapter remains within the backend runner execution adapter scope. Command templates for `claude-code-cli` and `codex-cli` are backend-owned in `src/symphony/controlled-provider-runner.js`; caller input is limited to provider, goal, task, role, mode, and reviewed refs. Arbitrary command text, cwd/path/env, shell controls, inactive providers, unknown UI/API execution fields, shell metacharacter refs, and secret-looking input are rejected. Preview/result output stays sanitized and does not expose executable args, raw cwd paths, env values, raw provider settings, or raw provider output.

Validation commands run from `/Users/andy/.codex/worktrees/v41-task-2-backend-runner-execution-adapter`:

- `node --test tests/v19-goal-template.test.js tests/v41-controlled-provider-runner.test.js` - pass; 14 tests, 2 suites, 14 pass, 0 fail.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` - pass; returned `goal-progress-ledger.v1` for the v41 goal with 5 planned tasks and task-2 present.
- `git diff --check` - pass.
- `git diff --no-index --check /dev/null src/symphony/controlled-provider-runner.js; git diff --no-index --check /dev/null tests/v41-controlled-provider-runner.test.js; git diff --no-index --check /dev/null docs/plans/v41-task-2-worker-evidence-2026-06-06.md` - no whitespace diagnostics; command exits non-zero because each new file differs from `/dev/null`.
- `pnpm check` - pass.
- `pnpm test` - pass; 1068 tests, 168 suites, 1068 pass, 0 fail.
- `pnpm workbench:build` - pass; Vite built `src/symphony/workbench-static/index.html` and assets.

No real `claude` or `codex` provider CLI was invoked. No mutation, audit, doctor, tag, push, publish, release closeout, provider CLI, or event registration command was run.

Verdict: APPROVED.
