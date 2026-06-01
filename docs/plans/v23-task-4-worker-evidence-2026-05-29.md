# v23 Task 4 Worker Evidence

Goal id: `v23-goal-operation-run-console`
Task id: `task-4`
Branch: `v23-task-4-failure-recovery-shortcuts`

## User-visible value

用户能从失败直接进入下一步，而不是回终端重查。

## Implementation summary

- Added copy-only failure recovery shortcuts to the inline Goal Operation Console shown under the controlled dry-run / confirm form.
- When dry-run preview or confirm fails, Workbench now shows selectable text for retry dry-run, copy command, copy reviewer prompt, and copy issue prompt.
- Retry/copy text is derived from the controlled goal update/review/gate form state, preview path, and returned confirm command when available.
- The recovery panel records that it is copy-only and has no browser execution capability.
- Added focused Workbench shell coverage to keep the failure shortcuts free of clipboard APIs, execution calls, terminal runners, and direct confirm/dry-run execution from the shortcut panel.
- Rebuilt the Workbench static bundle.

## Files changed

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BRTPIdb3.js` (removed by Workbench rebuild)
- `src/symphony/workbench-static/assets/index-D6WeclLN.css` (removed by Workbench rebuild)
- `src/symphony/workbench-static/assets/index-BCmw_mw4.js`
- `src/symphony/workbench-static/assets/index-DhfUBgwe.css`

Existing task-1 through task-3 worktree changes were preserved and not reverted.

## Commands run with exact results

```text
pnpm check
Exit code: 0
```

```text
pnpm test
Exit code: 0
Tests: 704 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo.
Duration: 3735.604667 ms.
```

```text
pnpm workbench:build
Exit code: 0
Built:
- src/symphony/workbench-static/index.html
- src/symphony/workbench-static/assets/index-DhfUBgwe.css
- src/symphony/workbench-static/assets/index-BCmw_mw4.js
```

```text
git diff --check
Exit code: 0
No output.
```

```text
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
Exit code: 0
Summary: totalTasks=5, completedTasks=3, blockedTasks=0, needsReviewTasks=0, needsRevisionTasks=0, releaseReady=false.
Task-4 status: planned; workerEvidenceRef=null; reviewEvidenceRef=null; mainVerificationRef=null.
```

Additional focused check:

```text
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
Exit code: 0
Tests: 39 passed, 0 failed.
```

## Boundary notes

- 不把 v8 command surface 当 Workbench 主按钮基线。
- 不新增安全框架、权限系统、goal framework、generic shell runner 或 terminal emulator。
- Recovery shortcuts are selectable copy-only text blocks; they do not call clipboard APIs, shell execution, model invocation, open local files, merge, tag, or append goal events.
- The worker did not approve task-4, did not perform main verification, and did not declare release readiness.

## Reviewer handoff checklist

- Review the failure-only shortcut behavior in `GoalOperationInlineConsole`.
- Check that retry dry-run and command text stay constrained to goal update/review/gate form state and existing preview/confirm data.
- Confirm failed preview/confirm UI does not infer approval, main verification, or release readiness.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` if needed.
