# v22 Task 2 main verification evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-2`

Branch: `v22-task-2-role-specific-prompt-renderer`

Checked commit: `1e71a57f08107772ce8a5a02e35509b7688feb1c`

Merge mode: not merged to `main` in this verifier turn. Verification was performed on the task branch checked commit because the controller owns the follow-up gate dry-run and confirm.

## Prechecks

- Runbook source checked: `docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md`.
- Task-2 acceptance from runbook:
  - 不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。
  - 支持 worker、independent reviewer、main verifier、release manager 四种 prompt 渲染和 copy。
- Product spine checked: Select goal task -> choose worker/reviewer/main-verifier/release role -> render goal prompt -> copy to subagent -> record started/evidence from same workspace.
- Worker evidence read: `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`.
- Reviewer evidence read: `docs/plans/v22-task-2-review-evidence-2026-05-29.md`.
- Goal-status precheck confirmed task-2 worker evidence and reviewer approval:
  - `task-2.status`: `approved`
  - `task-2.workerEvidenceRef`: `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`
  - `task-2.reviewEvidenceRef`: `docs/plans/v22-task-2-review-evidence-2026-05-29.md`
  - `task-2.reviewVerdict`: `APPROVED`
  - `task-2.statusSource`: `goal-event-log.v1:evt_07d6d27b3cc046d4`
  - `task-2.mainVerificationRef`: `null`

Reviewer approval source: `docs/plans/v22-task-2-review-evidence-2026-05-29.md`, verdict `APPROVED`.

## Implementation checked

- `src/symphony/goal-prompt-pack.js` now returns structured `roleGuidance` with role label, phase, boundary, evidence requirements, and handoff checklist.
- v22 evidence paths are goal-specific and task-hyphenated, for example `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`.
- Release-manager prompts use `docs/plans/v22-release-evidence-2026-05-29.md` and include closeout and goal-status validation commands.
- `frontend/workbench/src/App.jsx` renders role guidance beside the generated prompt pack for the selected goal/task/role.
- Tests cover v22 worker, reviewer, main-verifier, and release-manager prompt generation, evidence paths, role guidance, and Workbench API exposure.

Supplemental prompt checks run:

- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role worker --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role reviewer --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role main-verifier --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task release --role release-manager --json`

Observed result: all four prompt packs returned `contractName: goal-prompt-pack.v1`, `copyOnly: true`, `safety.copyOnly: true`, role-specific labels/phases, role boundaries, evidence checklists, handoff checklists, and the expected v22 evidence paths. No checked prompt used a `docs/plans/v19-` evidence path.

## Required command results

### `pnpm check`

Exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit 0.

Exact summary:

```text
tests 693
suites 111
pass 693
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3688.982
```

Relevant suite result:

```text
v19 goal prompt pack generator and CLI
pass 6
fail 0
```

### `pnpm workbench:build`

Exit 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:24800) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:24800) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:24800) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-C9qSNaEa.css   12.35 kB │ gzip:   2.70 kB
src/symphony/workbench-static/assets/index-GmlGAlrr.js   705.67 kB │ gzip: 131.97 kB

✓ built in 144ms
```

### `git diff --check`

Exit 0. No output.

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit 0.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T01:36:34.209Z",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task-2": {
    "status": "approved",
    "statusSource": "goal-event-log.v1:evt_07d6d27b3cc046d4",
    "branch": "v22-task-2-role-specific-prompt-renderer",
    "workerEvidenceRef": "docs/plans/v22-task-2-worker-evidence-2026-05-29.md",
    "reviewEvidenceRef": "docs/plans/v22-task-2-review-evidence-2026-05-29.md",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": null,
    "blockers": []
  },
  "releaseReady": false,
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

## Acceptance decision

PASSED.

- Worker, independent reviewer, main verifier, and release manager prompt rendering works for the v22 managed goal.
- Each role receives explicit role boundary text, evidence requirements, and handoff checklist.
- Prompt Workspace exposes the role guidance and generated prompt pack without execution, model invocation, approval, or release-ready controls.
- The implementation stays on the latest goal/runbook workflow: `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, and `goal closeout`.

## Boundary notes

- I did not register goal gate events. The controller owns dry-run and confirm after this output.
- I did not declare release ready.
- I did not add a safety framework, permission system, shell runner, goal framework, or artifact framework.
- I did not stage unrelated changes; task-2 implementation plus worker/review evidence were committed as `1e71a57f08107772ce8a5a02e35509b7688feb1c`.

## Blockers

None.
