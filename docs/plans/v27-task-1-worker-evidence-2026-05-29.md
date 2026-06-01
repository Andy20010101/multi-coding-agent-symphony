# v27 task-1 worker evidence

## Handoff boundary

Replacement worker: `codex-v27-task-1-worker-v27`.

Previous-worker state at handoff: branch `v27-task-1-review-workspace-for-active-task` already contained Workbench, API, docs, tests, and built static asset changes. The previous worker hung before writing task evidence. The expected evidence file did not exist.

I inspected the partial branch changes, confirmed the task-1 Review Workspace path was already present, ran the required acceptance commands, and wrote this evidence file. I did not revert prior worker changes. I did not register any goal event.

## Task

- Goal id: `v27-review-revision-loop`
- Task id: `task-1`
- Title: `Review workspace for active task`
- Runbook branch: `v27-task-1-review-workspace-for-active-task`
- Actual branch: `v27-task-1-review-workspace-for-active-task`
- Workspace path: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Worker evidence path: `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`
- User-visible value: reviewer 能从 UI 获取完整审查上下文。

## Implementation summary

The Workbench active goal path now includes a `Review Workspace` panel. It displays the active review context from existing goal/runbook/next-action/prompt/event/latest-run contracts:

- changed files from the latest exposed source run
- source run id, status, verifier status, source workspace path, manifest path, evidence artifact path, evidence ref, write boundary fields, and update time
- worker evidence ref from goal-status, goal events, next action, or latest run artifact ref
- copy-only reviewer prompt from `goal-prompt-pack.v1` or `goal-next-action.v1`
- review checklist from runbook acceptance, validation commands, role guidance, evidence requirements, handoff checklist, and required context
- expected verdict event with `reviewer.approved` and `reviewer.needs-revision`, plus a display-only dry-run `symphony goal review` command

The panel is display-only. It does not read evidence bodies, open source workspaces, run shell commands, start agents, append review events, or infer approval from source run metadata, file names, branch names, commit messages, or frontend state.

## Files changed in current branch diff

- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/contract.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DfZ2uJ6P.css` removed by the built asset swap
- `src/symphony/workbench-static/assets/index-wQbBCopW.js` removed by the built asset swap
- `tests/symphony-cli.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`

Untracked prior-version evidence, fixtures, and tests were already present in the worktree at handoff. I left them in place because they are outside task-1 and acceptance passed with them present.

## Acceptance commands

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
ℹ tests 720
ℹ suites 114
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6810.917916
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CVyMhr1m.css   16.31 kB │ gzip:   3.11 kB
src/symphony/workbench-static/assets/index-DG1Wr-LV.js   803.76 kB │ gzip: 149.47 kB

✓ built in 50ms
```

### `git diff --check`

Result: exit code `0`.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: exit code `0`.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v27-review-revision-loop",
  "goalTitle": "v27 Review Revision Loop",
  "generatedAt": "2026-05-31T18:56:37.386Z",
  "baseline": {
    "tag": "v26",
    "commit": null,
    "evidenceRef": "docs/plans/v26-release-evidence-2026-05-29.md"
  },
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
      "title": "Review workspace for active task",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v27-task-1-review-workspace-for-active-task",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Independent reviewer handoff",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v27-task-2-independent-reviewer-handoff",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Review verdict registration",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v27-task-3-review-verdict-registration",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Revision prompt generator",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v27-task-4-revision-prompt-generator",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-5",
      "title": "Review/revision tests/docs",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v27-task-5-review-revision-tests-docs",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
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
  "blockers": [],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-1",
      "command": "pnpm check"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

## Boundary notes

- Additional UI smoke: I started `pnpm --silent symphony console --host 127.0.0.1 --port 9876 --json`, opened `http://127.0.0.1:9876/workbench/` in the in-app browser, and verified `#review-workspace-panel` rendered with `changed files`, `source run`, `worker evidence`, `review prompt`, `review checklist`, and `expected verdict event`. I stopped the local console process after the smoke check.
- Workbench primary path stays on the latest/v19 goal/runbook/next-action flow.
- The implementation does not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench primary button model.
- No generic safety layer, generic shell runner, new permission system, new goal framework, or artifact framework was added for task-1.
- The Review Workspace does not infer task approval, reviewer approval, main verification, release readiness, or task state from file names, branch names, commit messages, source run metadata, or frontend heuristics.
- The worker did not self-approve.
- No reviewer verdict, main verification, release gate, merge, tag, or release-ready event was registered.

## Reviewer handoff checklist

- Review the branch diff against the v27 task-1 runbook scope.
- Open Workbench active goal path and inspect `Review Workspace`.
- Confirm the UI exposes changed files, source run, worker evidence, review prompt, review checklist, and expected verdict event.
- Confirm the panel is display-only and has no shell execution, browser execution, agent launch, evidence body read, workspace open, review confirm, merge, tag, or release-ready path.
- Confirm the task-1 tests cover the user-visible Review Workspace path, not just helper functions.
- Run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.
- Write `docs/plans/v27-task-1-review-evidence-2026-05-29.md` with verdict `APPROVED` or `NEEDS_REVISION`.
