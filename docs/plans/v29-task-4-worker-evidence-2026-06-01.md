# v29 task-4 worker evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-4`  
Task: Operation console and run-result bridge  
Branch: `v29-task-4-operation-console-and-run-result-bridge`

## Branch and workspace

The preferred branch was created successfully from the current checkout. Repo-local/current-checkout fallback was not needed.

The checkout was already dirty when task-4 started. Existing task-1, task-2, and task-3 implementation files, evidence files, generated Workbench assets, and the v29 fixture were preserved. No previous task work was reverted.

## Implementation summary

Implemented the run-result bridge for confirmed controlled implementation runs:

- `goal-operation-runs.v1` now accepts a scoped `implementation` command kind and stores optional `output`, `runResult`, `artifactRefs`, `verifierSummary`, and `failureReason` fields.
- `POST /api/goals/<goal-id|latest>/implementation-run-confirm` still accepts only `goalId`, `taskId`, `planId`, and `planHash` from the matching preview. After the existing `symphony do --confirm-plan <plan-id> --json` path returns, the backend records the confirmed implementation operation and returns `operationRun` plus refreshed operations.
- Workbench Operation Console now shows implementation run id, run status, exit code, verifier status, artifact refs, failure reason, and stdout/stderr summary from the operation registry.
- Workbench Implementation path now shows a run-result bridge for the active task, using the same operation registry entry as the Operations panel.
- Tests cover registry persistence, backend confirm response, frontend projection, and shell component wiring.

## Files changed

Task-4 implementation and tests:

- `src/symphony/goal-operation-run-registry.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CTaiFEXY.js`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`

Generated Workbench assets replaced the previous tracked bundle files:

- deleted `src/symphony/workbench-static/assets/index-B9IfCFVY.css`
- deleted `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

Pre-existing dirty files carried from earlier task work were left in place, including `frontend/workbench/src/api/client.js`, task-1/task-2/task-3 evidence files, and `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`.

## Workbench user path changed

The user path is now:

```text
Active Goal -> Implementation -> confirm isolated workspace run -> Operations -> inspect implementation operation -> Implementation -> inspect bridged run result
```

After the isolated implementation run is confirmed, the Workbench can display:

- operation id, status, command preview, plan hash, and polling state in Operations
- run id, execution plan id, run status, exit code, verifier status, workspace boundary, source workspace refs, evidence artifact path, artifact refs, and failure reason in Operations
- the same run result, artifact refs, verifier summary, output summary, and changed-file count in the Implementation panel

## Command results

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

Exact test summary:

```text
tests 739
suites 115
pass 739
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4531.448542
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...
17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEceTgZX.css   20.62 kB | gzip:   3.69 kB
src/symphony/workbench-static/assets/index-CTaiFEXY.js   916.52 kB | gzip: 168.49 kB

built in 55ms
```

### `git diff --check`

Result: exit code `0`; no output.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit code `0`.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v29-active-task-controlled-implementation-workspace",
  "goalTitle": "v29 Active Task Controlled Implementation Workspace",
  "generatedAt": "2026-06-01T05:07:28.324Z",
  "baseline": {
    "tag": "v28",
    "commit": null,
    "evidenceRef": "docs/plans/v28-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 3,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Active task implementation eligibility",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_33fa8dc50fb698e1",
      "branch": "v29-task-1-active-task-implementation-eligibility",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v29-task-1-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-1-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Controlled implementation plan preview",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_da166b77aee1f85c",
      "branch": "v29-task-2-controlled-implementation-plan-preview",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v29-task-2-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-2-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Confirm isolated workspace execution",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_1736cbfe45b5ddce",
      "branch": "v29-task-3-confirm-isolated-workspace-execution",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v29-task-3-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-3-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Operation console and run-result bridge",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v29-task-4-operation-console-and-run-result-bridge",
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
      "title": "Worker evidence handoff after implementation run",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v29-task-5-worker-evidence-handoff-after-implementation-run",
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
      "label": "Start task-4",
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

## Additional targeted checks

Before the full acceptance run, these targeted checks were run and passed:

- `pnpm --silent node --test tests/v23-goal-operation-run-registry.test.js`
- `pnpm --silent node --test tests/workbench-api-client.test.js`
- `pnpm --silent node --test tests/workbench-shell.test.js`

After the required acceptance commands, `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json` returned exit code `0` with `next.taskId: "task-4"`, `next.role: "worker"`, `next.phase: "implement"`, and reason `No explicit worker evidence is recorded for task-4.`

## Boundary notes

- No generic shell runner, browser terminal, command DSL, permission framework, goal framework, artifact framework, model invocation path, merge path, push path, tag path, or publish path was added.
- The implementation confirm route still accepts only preview-returned `goalId`, `taskId`, `planId`, and `planHash`.
- The backend still maps run start to the existing `symphony do --confirm-plan <plan-id> --json` semantics.
- The operation registry remains operation output, not proof of worker evidence, reviewer approval, main verification, or release readiness.
- No `symphony goal update`, `symphony goal review`, or `symphony goal gate` command was run by this worker.
- No readiness is inferred from filenames, branches, commits, prompt text, task titles, or frontend state.

## Recovery steps

- If implementation confirm rejects body, context, or hash, rerun the active task implementation preview and confirm only with the returned `goalId`, `taskId`, `planId`, and `planHash`.
- If the isolated implementation run fails, inspect the Operation Console run result fields: `failureReason`, `verifierSummary`, `artifactRefs`, `evidenceArtifactPath`, `sourceWorkspacePath`, and changed files. Fix the worker implementation and rerun the bounded preview/confirm path.
- If the Operation Console is stale, refresh the scoped `GET /api/goals/<goal-id>/operations` contract or reload Workbench. Polling only rereads managed operation contracts.
- If task status still shows planned after this evidence, the controller should register `worker.evidence-recorded` for task-4 with this evidence ref after its own review policy allows it.

## Controller handoff

Evidence path: `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`

The controller can register `worker.evidence-recorded` for task-4 using this evidence path. This worker did not run the registration command.
