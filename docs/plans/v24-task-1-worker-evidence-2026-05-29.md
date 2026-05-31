# v24 task-1 worker evidence

## Goal and task

- Goal id: `v24-main-verification-workbench`
- Task id: `task-1`
- Branch: `v24-task-1-main-verification-readiness-panel`
- User-visible value: 用户知道是否可以进入 main verification。

## Implementation summary

Workbench Active Goal 主路径新增 `Main Verification Readiness` panel，位置在 Active Goal Runbook / Task Queue 后、Next Action Card 前。

Panel 展示：

- `reviewer.approved` 状态、event id、actor、recordedAt、review evidence ref 和来源。
- 当前 Git branch/head、task branch、main branch、dirty 状态、dirty path 列表和 branch/main state。
- `git checkout main`、`git pull --ff-only`、`git merge --ff-only <task-branch>` copy-only 指引。
- 当前 task runbook 的 required verification commands。
- main verification evidence path，例如 `docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md`。
- copy-only `symphony goal gate --gate main-verification` dry-run 文本，不执行、不确认、不写 journal。

Readiness 只从 `goal-runbook.v1`、`goal-progress-ledger.v1`、`goal-event-log.v1`、`goal-next-action.v1`、`goal-closeout-report.v1` 和 `/api/readiness` 投影。测试覆盖了 reviewer approval 明确存在时的 ready 状态，也覆盖了 title、branch、copyOnlyCommands 看起来像 approved 时不能进入 main verification。

## Files changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BRTPIdb3.js` deleted by build asset rotation
- `src/symphony/workbench-static/assets/index-D6WeclLN.css` deleted by build asset rotation
- `src/symphony/workbench-static/assets/index-C-y1-j-H.js`
- `src/symphony/workbench-static/assets/index-D00NDVfk.css`
- `docs/plans/v24-task-1-worker-evidence-2026-05-29.md`

`pnpm workbench:build` refreshed Workbench static assets. The workspace already had unrelated dirty and untracked v23/Workbench files before task-1 work started; those were not cleaned or reverted.

## Command results

### `pnpm check`

Result: exit 0.

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

First full run found one static frontend scan failure because the evidence-path helper used RegExp `.exec(...)`, which matched the existing no-exec scanner. The helper was changed to `goalId.match(...)`.

Final result: exit 0.

Final summary:

```text
ℹ tests 711
ℹ suites 113
ℹ pass 711
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3769.107459
```

Targeted Workbench tests also passed before the full run:

```text
ℹ tests 41
ℹ suites 3
ℹ pass 41
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 99.902458
```

### `pnpm workbench:build`

Result: exit 0.

Output:

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D00NDVfk.css   15.41 kB │ gzip:   3.01 kB
src/symphony/workbench-static/assets/index-C-y1-j-H.js   768.56 kB │ gzip: 143.42 kB

✓ built in 153ms
```

The command also printed Node WASI ExperimentalWarning messages.

### `git diff --check`

Result: exit 0.

Output: no output.

### `pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json`

Result: exit 0.

Observed fields:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v24-main-verification-workbench",
  "goalTitle": "v24 Main Verification Workbench",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 0,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v24-task-1-main-verification-readiness-panel",
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null
    }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

The command showed task-1 still planned because this worker did not register goal events.

## Browser check

Started `pnpm symphony console --host 127.0.0.1 --port 8765`, opened `http://127.0.0.1:8765/workbench/` in the in-app browser, and checked the rendered page.

Observed:

- Page title: `v20 Workbench`
- URL: `http://127.0.0.1:8765/workbench/`
- `Main Verification Readiness` locator count: `1`
- `ff-only merge guidance` locator count: `1`
- `required verification commands` locator count: `1`
- `evidence path` locator count: `1`
- Browser console error/warn logs: `[]`

The local console server was stopped after the check.

## Boundary notes

- 不把 v8 command surface 当 Workbench 主按钮基线。
- 不新增安全框架、权限系统、goal framework 或 generic shell runner。
- 不执行 merge、verification commands、evidence 写入或 goal gate confirm。
- 不宣称 reviewer approved、main verified 或 release ready。
- 不从文件名、branch、commit message、prompt 文本、copy-only command 或前端状态推断 approval。
- Worker 没有做 reviewer approval、main verification、release gates 或 `release.ready`。

## Reviewer handoff checklist

- 检查 `Main Verification Readiness` 是否在 Workbench Active Goal 主路径中出现。
- 检查 reviewer approval 是否只来自 explicit event 或 event-backed ledger，不来自 branch/title/command 文本。
- 检查 ff-only 指引、verification commands、evidence path 是否可见且均为 copy-only。
- 检查 panel 没有 shell runner、merge action、file writer、confirm action、model invocation 或 release-ready 推断。
- 复跑 `pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`。
