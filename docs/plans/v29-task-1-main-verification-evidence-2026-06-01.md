# v29 task-1 main verification evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-1`  
Branch verified: `v29-task-1-active-task-implementation-eligibility`  
Verifier: `codex-v29-task-1-main-verifier`  
Evidence path: `docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md`

This evidence covers the task-1 main verification decision for the current checkout. No `symphony goal gate`, `symphony goal review`, or `symphony goal update` command was run by this verifier.

## Verification basis

Read and checked:

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-1-review-evidence-2026-06-01.md`
- `docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- Current Workbench source, generated Workbench static assets, task-1 test, v29 runbook fixture, and local managed goal event journal.

## Evidence chain

- Worker evidence file exists: `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`.
- Reviewer evidence file exists: `docs/plans/v29-task-1-review-evidence-2026-06-01.md`.
- Local event journal line 1: `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson` records `evt_1574ba475d93b83f`, `eventType: "worker.evidence-recorded"`, actor `codex-v29-task-1-worker`, evidence ref `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`.
- Local event journal line 2: `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson` records `evt_c4eb5e7a04b6eea4`, `eventType: "reviewer.approved"`, actor `codex-v29-task-1-reviewer`, evidence ref `docs/plans/v29-task-1-review-evidence-2026-06-01.md`, `review.verdict: "APPROVED"`.
- `goal-status` reports task-1 `status: "approved"`, `statusSource: "goal-event-log.v1:evt_c4eb5e7a04b6eea4"`, worker evidence ref and review evidence ref set, and `mainVerificationRef: null`.
- `goal next` reports task-1 role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-1 but main verification is missing.`

## Files checked

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DJFmHbI1.css`
- `src/symphony/workbench-static/assets/index-DMx8GR4N.js`
- `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-1-review-evidence-2026-06-01.md`

Current checkout status before writing this evidence showed the task-1 Workbench source and generated static assets as worktree changes, with the v29 runbook fixture and worker/reviewer evidence untracked. This verification is for the current checkout state, not a committed merge.

## Product verification

`frontend/workbench/src/api/contracts.js` adds `ActiveTaskImplementationEligibility` to the active-goal projection. The model is built from goal-status, `goal-next-action.v1`, `goal-runbook.v1`, scoped `goal-event-log.v1`, Workbench route context, and operation context. The eligibility decision requires ready scoped contracts, matching active goal/task route context, `goal next` assigning the active task to worker implementation or revision, and no unresolved explicit `blocker.opened` event.

The model exposes branch, title, prompt availability, copy-only commands, and runbook fields as context. It marks branch, filename, commit message, prompt text, task title, and frontend heuristics as unsupported inference sources. I did not find task approval, main verification, implementation eligibility, adoption readiness, or release readiness being inferred from those fields.

`frontend/workbench/src/App.jsx` renders the `Active Task Implementation Eligibility` panel in the active-goal path after the Active Goal Runbook and Task Queue. The panel shows the decision, route context, required contract routes, goal-status task fields, explicit events, runbook task fields, next action, operation context, blocking reasons, recovery steps, and safety fields. It does not add an execution button, model invocation, local file open, artifact download, merge, push, tag, or approval action.

`tests/workbench-api-client.test.js` covers eligible, waiting, and explicit blocker states. The test places approval-looking and release-ready-looking text in task title and branch fields, then verifies eligibility remains driven by contracts, `goal next`, route context, and explicit blocker events.

`pnpm workbench:build` regenerated `src/symphony/workbench-static/index.html`, `index-DJFmHbI1.css`, and `index-DMx8GR4N.js`. The served Workbench HTML references those assets. The served JS bundle contains `ActiveTaskImplementationEligibility`, `active-task-implementation-eligibility-panel`, `controlledImplementationStartsRun: false`, `modelInvocationAvailable: false`, and `genericShellRunner: false`.

## Boundary checks

- Workbench remains anchored to the latest goal/runbook/next-action flow. The task-1 diff does not present v8 `scan/do/review/verify/status/continue/artifacts` as the top-level Workbench model.
- The browser-facing task-1 panel is read-only and copy-only.
- The task-1 diff does not add a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, command DSL, arbitrary local path access, artifact download, merge, push, tag, self-approval, or release-ready declaration.
- Operation registry context is displayed as context only. It is not treated as worker evidence, reviewer approval, main verification, or release readiness.
- Worker and reviewer actors are separate in the event journal: `codex-v29-task-1-worker` and `codex-v29-task-1-reviewer`.

## Commands run

### `pnpm check`

Exit code: 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0.

```text
tests 735
suites 115
pass 735
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 5069.325583
```

### `pnpm workbench:build`

Exit code: 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB
src/symphony/workbench-static/assets/index-DJFmHbI1.css   19.88 kB
src/symphony/workbench-static/assets/index-DMx8GR4N.js   882.51 kB
built in 59ms
```

### `git diff --check`

Exit code: 0. No whitespace errors were reported.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Exit code: 0. Relevant fields:

```json
{
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
    "releaseReady": false
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_c4eb5e7a04b6eea4",
      "workerEvidenceRef": "docs/plans/v29-task-1-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-1-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null,
      "blockers": []
    }
  ]
}
```

### `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json`

Exit code: 0. Relevant fields:

```json
{
  "next": {
    "taskId": "task-1",
    "role": "main-verifier",
    "phase": "main-verification",
    "reason": "Reviewer approved task-1 but main verification is missing.",
    "blocked": false
  },
  "evidenceState": {
    "workerEvidenceRef": "docs/plans/v29-task-1-worker-evidence-2026-06-01.md",
    "reviewEvidenceRef": "docs/plans/v29-task-1-review-evidence-2026-06-01.md",
    "mainVerificationRef": null
  }
}
```

### Local Workbench serve fallback

Started `pnpm symphony console --host 127.0.0.1 --port 8765`, then checked served files with `curl`.

`curl -sS http://127.0.0.1:8765/workbench/` returned HTML referencing:

```text
/workbench/assets/index-DMx8GR4N.js
/workbench/assets/index-DJFmHbI1.css
```

`curl -sS http://127.0.0.1:8765/workbench/assets/index-DMx8GR4N.js | rg -n "ActiveTaskImplementationEligibility|active-task-implementation-eligibility-panel|controlledImplementationStartsRun|genericShellRunner|modelInvocationAvailable"` found the model, panel id, and false safety fields in the served bundle.

`curl -sS http://127.0.0.1:8765/workbench/assets/index-DJFmHbI1.css | rg -n "implementation-eligibility-grid"` found the panel layout class in the served stylesheet.

The console server was stopped after these checks.

## Browser verification boundary

The in-app Browser attach timed out while opening `http://127.0.0.1:8765/workbench/`. I did not use browser-rendered DOM or screenshot evidence. The fallback evidence is the passing Workbench/client tests, successful Workbench build, served Workbench HTML, and served static asset checks from the current checkout.

## Remaining risks

- The task-1 implementation and evidence files are still worktree changes in this checkout. A controller that requires a committed, fast-forward branch should commit or otherwise preserve this exact state before depending on it.
- Browser visual verification was not completed because the Browser attach step timed out. The local server and static assets were verified, but no screenshot was recorded.
- This evidence does not register the main-verification gate. The local goal ledger should continue to show `mainVerificationRef: null` until the controller records the gate.

## Recovery steps

- If Workbench does not show the panel after a fresh checkout, run `pnpm workbench:build`, start `pnpm symphony console --host 127.0.0.1 --port 8765`, and confirm `/workbench/` references `index-DMx8GR4N.js` and `index-DJFmHbI1.css`.
- If eligibility is unexpected, compare the same active goal/task across goal-status, goal next, goal-runbook, goal-event-log, route context, and operations. Do not override the decision with branch names, filenames, prompt text, task titles, commit messages, or frontend state.
- If a blocker is present, resolve it only through the existing `symphony goal update` dry-run plus matching plan-hash confirm path.
- If the controller needs a durable branch artifact, commit the current task-1 product changes, generated assets, fixture, and evidence files before further orchestration.

## Gate result

The controller can register `main.verification-passed` for task-1 with evidence ref `docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md`.
