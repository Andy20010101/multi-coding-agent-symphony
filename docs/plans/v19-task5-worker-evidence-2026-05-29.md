# v19 Task 5 worker evidence

Date: 2026-05-29

Goal id: `v19-goal-runbook-next-action`
Task id: `task-5`
Branch: `v19-task5-goal-next-cli`

## Implemented scope

Task 5 added the read-only CLI surface for goal next-action and closeout reporting:

- `symphony goal next --goal <id|latest>` now prints `goal-next-action.v1` in JSON, Markdown, or short text.
- `symphony goal closeout --goal <id|latest>` now prints `goal-closeout-report.v1` with missing task evidence and release gate gaps.
- `symphony next` now checks for an active managed goal first. When one exists, it returns a goal next-action summary and includes a compact Stage summary. When no active goal exists, it keeps the existing Stage summary behavior.
- The controlled fixture goal id `v19-fixture` is supported for Task 5 CLI smoke commands without writing managed runbook state.

The implementation uses explicit runbook, event log, and ledger data. It does not infer task completion from branch names, file names, commit messages, command text, or prompt text.

## Files changed

- `scripts/symphony.js`
- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-progress-ledger.js`
- `src/symphony/goal-runbook-context.js`
- `src/symphony/goal-closeout-report.js`
- `tests/v19-goal-next-cli.test.js`

## Verification results

| Command | Result |
|---|---|
| `pnpm check` | Exit 0. `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. `659` tests, `109` suites, `659` pass, `0` fail, duration `3614.342ms`. |
| `pnpm symphony goal next --goal v19-fixture --json` | Exit 0. Output contract `goal-next-action.v1`; `status: action-required`; next task `task-1`, role `worker`, phase `implement`; copy-only commands include `pnpm check`, `pnpm test`, `git diff --check`. |
| `pnpm symphony goal closeout --goal v19-fixture --json` | Exit 0. Output contract `goal-closeout-report.v1`; `totalTasks: 2`; worker, review, and main verification complete flags are `false`; `releaseReady: false`; release gate gaps include `pnpmCheck` through `docsUpdated` as `unknown` and `tagEvidence` as `missing`. |
| `pnpm symphony next --json` | Exit 0. Current workspace had no active managed goal pointer, so output used `nextSource: stage-summary`, `activeGoal: null`, `goalNextAction: null`, and preserved the Stage next action `symphony stage activate v14-stage-kernel-refactor`. |
| `git diff --check` | Exit 0. No whitespace errors reported. |

## JSON contracts observed

- `goal-next-action.v1`
- `goal-closeout-report.v1`

## Stage fallback check

The no-active-goal path was checked with `pnpm symphony next --json`. The output stayed on the Stage summary path:

- `nextSource: stage-summary`
- `activeGoal: null`
- `goalNextAction: null`
- Stage id: `v14-stage-kernel-refactor`
- Next action: `symphony stage activate v14-stage-kernel-refactor`

The new active-goal branch is covered by `tests/v19-goal-next-cli.test.js`, which registers a managed runbook in a temporary state directory and verifies that `symphony next --json` returns `nextSource: goal-next-action`.

## Boundary notes

- The new commands do not execute prompts.
- The new commands do not run release gates.
- The implementation does not write release evidence documents.
- The implementation does not register goal events automatically. Event registration remains a separate explicit dry-run and confirm flow.
- The closeout report does not treat passed `pnpm check` or `pnpm test` as release-ready.
- This worker evidence does not claim reviewer approval, main verification, or release readiness for Task 5.

## Reviewer handoff

Review should focus on CLI JSON stability, the fixture fallback scope, the active-goal priority in `symphony next`, and closeout semantics. In particular, check that closeout lists missing evidence and release gate gaps without declaring release readiness from successful tests.
