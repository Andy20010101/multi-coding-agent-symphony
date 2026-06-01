# v29 task-2 main verification evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-2`  
Verifier id: `codex-v29-main-verifier`  
Validation checkout: `v29-task-2-controlled-implementation-plan-preview`  
Final checkout observed after evidence update: `v29-task-3-confirm-isolated-workspace-execution`  
Evidence path: `docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md`  
Final main-verification status: `PASSED`

This verification covers task-2 only. I did not implement product changes, change worker implementation, switch branches, run `symphony goal update`, run `symphony goal review`, run `symphony goal gate`, declare release readiness, create a tag, push, publish, or self-approve the task.

## Reviewer approval checked

- Reviewer approval event: `evt_3bb525dcb8f044e6`
- Reviewer evidence ref: `docs/plans/v29-task-2-review-evidence-2026-06-01.md`
- Reviewer verdict in event log: `APPROVED`
- Worker evidence event: `evt_2fd27316fc6a6a8e`
- Worker evidence ref: `docs/plans/v29-task-2-worker-evidence-2026-06-01.md`

The current `goal next` result still requires task-2 `role: "main-verifier"` and `phase: "main-verification"` because `mainVerificationRef` is not yet registered.

## Verification basis

The preferred clean-main flow was not used because the first `git status -sb` showed the checkout already carried uncommitted task-1/task-2/evidence/static changes on `v29-task-2-controlled-implementation-plan-preview`. Running `git checkout main`, `git pull --ff-only`, or `git merge --ff-only v29-task-2-controlled-implementation-plan-preview` would have required moving, staging, committing, stashing, or discarding active work, which is outside the verifier boundary.

Fallback used:

```text
repo-local current-checkout verification on v29-task-2-controlled-implementation-plan-preview
```

Fallback basis:

- Current task branch/worktree diff and generated static assets.
- Goal event journal `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson`.
- Worker evidence and reviewer evidence listed above.
- Runbook, plan, and execution prompt refs listed below.
- Fresh validation command results from this verifier run.

This fallback supersedes the clean-main merge blocker for this verification because the task implementation, event basis, evidence files, generated static assets, and validation commands were available in the current checkout.

## Docs and files checked

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md`
- `docs/plans/v29-task-2-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-2-review-evidence-2026-06-01.md`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-IJsKpjNP.js`
- `src/symphony/workbench-static/assets/index-g77dGHMD.css`

## Product verification

Task-2 adds a Workbench controlled implementation plan preview. The backend route is:

```text
GET /api/goals/<goal-id|latest>/implementation-plan-preview?task=<task-id>
```

The route returns `controlled-implementation-plan-preview.v1` only when `goal next` assigns the same task to the worker implementation or revision phase. It builds the preview from the managed runbook, `goal-next-action.v1`, `goal-prompt-pack.v1` worker prompt, and scoped `goal-event-log.v1`.

The preview maps to `symphony do --write --json` plan generation semantics. It returns `mode: "dry-run"`, `status: "planned"`, a plan id, a plan hash over the allowed preview payload, `command.previewOf: "symphony do --write --json"`, and isolated-workspace write semantics with `mainWorktreeWrites: false`.

The exposed preview surface is limited to active task constraints, worker prompt, goal/task/evidence refs, next-action context, existing allowlist route fields, endpoint restrictions, confirm handoff metadata for task-3, and safety flags. The route accepts only `task`; prompt, path, command, confirm, planHash, dry-run fields, and repeated query values are rejected.

The implementation does not run `symphony do`, start an isolated workspace run, invoke models, run shell commands, open local files, download artifacts, merge, push, tag, append goal events, approve review, perform main verification, or infer release readiness. The Workbench client constructs the preview route only when the active next action is a worker implementation or revision task. The UI renders the preview as display/copy-only context after Active Task Implementation Eligibility.

The task keeps the Workbench top-level model on the latest goal/runbook/next-action path. It does not present the v8 compatibility commands as the primary Workbench model.

## Commands run

### `git status -sb`

Exit code: 0

Initial result before evidence update:

```text
## v29-task-2-controlled-implementation-plan-preview
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 D src/symphony/workbench-static/assets/index-B9IfCFVY.css
 D src/symphony/workbench-static/assets/index-NKKg_tJp.js
 M src/symphony/workbench-static/index.html
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md
?? docs/plans/v29-task-1-review-evidence-2026-06-01.md
?? docs/plans/v29-task-1-worker-evidence-2026-06-01.md
?? docs/plans/v29-task-2-review-evidence-2026-06-01.md
?? docs/plans/v29-task-2-worker-evidence-2026-06-01.md
?? fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json
?? src/symphony/workbench-static/assets/index-IJsKpjNP.js
?? src/symphony/workbench-static/assets/index-g77dGHMD.css
```

Final status after writing this updated evidence showed the branch name as `v29-task-3-confirm-isolated-workspace-execution` and included this target evidence file as untracked. I did not perform that branch switch.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Exit code: 0

Relevant result:

```json
{
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false
  },
  "tasks": [
    {
      "taskId": "task-2",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_3bb525dcb8f044e6",
      "workerEvidenceRef": "docs/plans/v29-task-2-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-2-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null,
      "blockers": []
    }
  ]
}
```

### `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json`

Exit code: 0

Relevant result:

```json
{
  "status": "action-required",
  "next": {
    "taskId": "task-2",
    "role": "main-verifier",
    "phase": "main-verification",
    "reason": "Reviewer approved task-2 but main verification is missing.",
    "blocked": false
  },
  "evidenceState": {
    "workerEvidenceRef": "docs/plans/v29-task-2-worker-evidence-2026-06-01.md",
    "reviewEvidenceRef": "docs/plans/v29-task-2-review-evidence-2026-06-01.md",
    "mainVerificationRef": null
  }
}
```

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 736
suites 115
pass 736
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4586.019458
```

The run included `previews the controlled implementation plan from active task contracts without executing implementation`, which verifies the preview contract, plan hash shape, `symphony do --write --json` mapping, isolated-workspace write semantics, worker prompt exposure, endpoint restrictions, false execution/model/shell flags, rejected prompt input, and unchanged event count before and after preview.

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-g77dGHMD.css   20.38 kB | gzip:   3.66 kB
src/symphony/workbench-static/assets/index-IJsKpjNP.js   898.07 kB | gzip: 165.71 kB

built in 56ms
```

### `git diff --check`

Exit code: 0

```text
No output.
```

## Boundary notes

- The clean-main checkout/pull/ff-only merge flow was documented as blocked by the active uncommitted worktree and replaced with the allowed current-checkout fallback.
- A final status check after evidence update showed the checkout name had changed to `v29-task-3-confirm-isolated-workspace-execution`. The validation commands and inspected task-2 evidence were run before that observed checkout-name change.
- No worker or reviewer changes were reverted, overwritten, staged, committed, pushed, tagged, or published.
- Verification used explicit goal events and command output. It did not infer task state from branch names, filenames, commit messages, prompt text, task titles, or frontend state.
- Current `goal-status` reports `releaseReady: false`.

## Controller handoff

Controller can register `main-verification` as `passed` for task-2 with this evidence ref:

```text
docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md
```
