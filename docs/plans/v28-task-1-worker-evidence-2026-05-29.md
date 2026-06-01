# v28 task-1 worker evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-1`
Checkout: current checkout fallback on branch `v27-task-5-review-revision-tests-docs` at `/Users/andy/Documents/project/multi-coding-agent-symphony`

## User-visible value

用户打开 Workbench 后先看到当前 goal/task/next action/latest operation，再看到 Workbench v1 的八个主路径：Active Goal、Prompt Handoff、Operations、Implementation、Adoption、Review、Verification、Closeout。页面入口从信息面板集合收束成围绕 active goal 的操作台。

## Implementation summary

- Added a v28 Workbench state header sourced from existing goal/runbook/next-action/operation contracts.
- Converted the Workbench v1 section map into usable scoped navigation links for Active Goal, Prompt Handoff, Operations, Implementation, Adoption, Review, Verification, Closeout.
- `Prompt Handoff` navigates to `/workbench/prompts/`; the other Workbench paths navigate to owned `/workbench/#<section-id>` anchors.
- Kept the top-level workflow aligned to `goal-status`, `goal next`, `goal prompt`, controlled `goal update/review/gate`, `goal closeout`, and scoped `goal-operation-runs`.
- Replaced the v28 source-string-only test with a Vite SSR render test that opens the Workbench shell at `/workbench/` and `/workbench/prompts/`, checks the first-screen header/nav order, verifies all eight navigation entries, and exercises Prompt Handoff route activation.
- Updated the Workbench route-smoke static safety guard to allow only scoped Workbench navigation anchors while continuing to reject forms, download links, local-open APIs, shell process APIs, browser execution channels, model endpoints, and unexpected click handlers.
- Rebuilt the Workbench static bundle with `pnpm workbench:build`.

## Reviewer blocker resolution

- Blocker 1 fixed: `WorkbenchNavigation` now renders real `<a>` links instead of plain `<span>` wrappers. Links are scoped to `/workbench/prompts/` or `/workbench/#<known-section-id>` and use `aria-current="page"` for the active Workbench path.
- Blocker 2 fixed: `tests/workbench-shell.test.js` now renders `WorkbenchShell` through Vite SSR with stubbed Workbench contracts, asserts the actual first-screen state header and eight navigation entries on `/workbench/`, checks navigation appears before the Active Goal panels and before legacy information panels, and renders `/workbench/prompts/` to verify Prompt Handoff route activation.

## Files changed

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CKTfjAD4.js`
- `src/symphony/workbench-static/assets/index-SlXwZMej.css`
- Removed generated bundle files previously listed in the worktree: `src/symphony/workbench-static/assets/index-DfZ2uJ6P.css`, `src/symphony/workbench-static/assets/index-wQbBCopW.js`
- Replaced generated bundle files from the previous worker build: `src/symphony/workbench-static/assets/index-BQVpNXdz.css`, `src/symphony/workbench-static/assets/index-CRhEXRbx.js`

## Command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
ℹ tests 731
ℹ suites 115
ℹ pass 731
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6744.839875
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-SlXwZMej.css   18.74 kB │ gzip:   3.47 kB
src/symphony/workbench-static/assets/index-CKTfjAD4.js   824.44 kB │ gzip: 153.29 kB

✓ built in 51ms
```

### `git diff --check`

Exit code: 0

```text
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Exit code: 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v28-workbench-v1-release",
  "goalTitle": "v28 Workbench v1 Release",
  "generatedAt": "2026-05-31T21:44:43.709Z",
  "baseline": {
    "tag": "v27",
    "commit": null,
    "evidenceRef": "docs/plans/v27-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 0,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 1,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Workbench app navigation and state header",
      "status": "needs-revision",
      "statusSource": "goal-event-log.v1:evt_86d19992d631b81a",
      "branch": "v28-task-1-workbench-app-navigation-and-state-header",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "NEEDS_REVISION",
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Unified goal/task/run/evidence routes",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-2-unified-goal-task-run-evidence-routes",
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
      "title": "Golden path E2E",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-3-golden-path-e2e",
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
      "title": "Release closeout workspace",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-4-release-closeout-workspace",
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
      "title": "README/operator guide/release evidence",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-5-readme-operator-guide-release-evidence",
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

- Branch setup fell back to the current checkout because the repo already had a dirty v23-v27/v28 worktree on `v27-task-5-review-revision-tests-docs`. I did not switch branches, pull, reset, or overwrite unrelated changes.
- The v28 navigation is link-based, scoped to Workbench routes and known local section anchors. It does not add a shell runner, browser terminal, download, local-open action, or model invocation.
- The top-level Workbench path does not use the v8 `scan/do/review/verify/status/continue/artifacts` command list as the main action model.
- No new safety framework, permission system, or goal framework was added.
- I did not register goal events, approve review, perform main verification, declare release readiness, merge, or tag.

## Reviewer handoff checklist

- Confirm the header shows goal, task, next action, latest operation, and route readiness from existing contracts.
- Confirm the eight section labels are visible on `/workbench/` and `/workbench/prompts/`.
- Confirm Prompt Handoff remains copy-only and does not start subagents or write events outside controlled preview/confirm paths.
- Confirm Operations uses `goal-operation-runs.v1` only and is not a generic terminal surface.
- Confirm Implementation, Review, Verification, Adoption, and Closeout panels do not infer approval, main verification, or release readiness from filenames, branches, commits, or frontend state.
