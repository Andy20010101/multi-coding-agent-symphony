# v22 task-4 main verification evidence

## Verification record

- Goal id: `v22-goal-prompt-handoff-workspace`
- Task id: `task-4`
- Task title: Prompt-to-event shortcuts
- Verification verdict: PASSED
- Checked commit: `5b4bb3b9474e5c17e84816739f62cadb5d990c45`
- Branch checked: `v22-task-4-prompt-to-event-shortcuts`
- Main verification evidence: `docs/plans/v22-task-4-main-verification-evidence-2026-05-29.md`

## Evidence files checked

- `docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md`
- `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`
- `docs/plans/v22-task-4-review-evidence-2026-05-29.md`

## Goal state checked

Command:

```bash
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
```

Result:

- Exit code: 0
- `generatedAt`: `2026-05-31T02:40:56.207Z`
- `summary.completedTasks`: `4`
- `summary.needsRevisionTasks`: `0`
- `summary.releaseReady`: `false`
- `task-4.status`: `approved`
- `task-4.statusSource`: `goal-event-log.v1:evt_537428b967fd1802`
- `task-4.workerEvidenceRef`: `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`
- `task-4.reviewEvidenceRef`: `docs/plans/v22-task-4-review-evidence-2026-05-29.md`
- `task-4.reviewVerdict`: `APPROVED`
- `task-4.mainVerificationRef`: `null`

Command:

```bash
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```

Result:

- Exit code: 0
- `next.taskId`: `task-4`
- `next.role`: `main-verifier`
- `next.phase`: `main-verification`
- `next.reason`: `Reviewer approved task-4 but main verification is missing.`
- `evidenceState.workerEvidenceRef`: `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`
- `evidenceState.reviewEvidenceRef`: `docs/plans/v22-task-4-review-evidence-2026-05-29.md`
- `evidenceState.mainVerificationRef`: `null`

## Behavior checked

Local route checked:

```text
http://127.0.0.1:9876/workbench/prompts
```

Browser verification results:

- The Prompt Workspace rendered `Worker Event Registration` for role `worker`.
- After switching the task selector to `task-4`, both shortcut forms showed task id `task-4`.
- Before dry-run, the shortcut panel rendered `0` `Confirm event append` buttons.
- `worker.started` dry-run from task `task-4` produced a preview containing `worker.started`, `task-4`, `writesInDryRun: false`, and a `sha256:` plan hash. The form then rendered `1` confirm button.
- After switching the task selector from `task-4` to `task-2`, the shortcut panel reset to `0` confirm buttons.
- After that switch, both shortcut forms showed task id `task-2`.
- `worker.evidence-recorded` dry-run after the switch used:
  - preview route: `/api/goals/v22-goal-prompt-handoff-workspace/event-plan-preview?command=update&task=task-2&event=worker.evidence-recorded&actor=codex-v22-task-4-main-verifier-browser&evidenceRef=docs%2Fplans%2Fv22-task-4-worker-evidence-2026-05-29.md`
  - command text: `symphony goal update --goal v22-goal-prompt-handoff-workspace --task task-2 --event worker.evidence-recorded --actor codex-v22-task-4-main-verifier-browser --evidence-ref docs/plans/v22-task-4-worker-evidence-2026-05-29.md`
  - plan result: `writesInDryRun: false`
- I did not click `Confirm event append`.

Code and test verification:

- `PromptWorkspaceEventShortcuts` builds only `worker.started` and `worker.evidence-recorded` forms.
- Shortcut identity is keyed by selected goal id, task id, and event type.
- `GoalEventPlanPreview` resets local values, preview state, and confirm state when the form identity changes.
- Preview route construction uses `values.taskId`.
- Confirm body construction uses `values.taskId`.
- `tests/workbench-shell.test.js` includes regression coverage for controlled dry-run/confirm wiring and remount/reset behavior after task selection changes.

## Required command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 697
suites 111
pass 697
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3711.967542
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-D6WeclLN.css   13.24 kB | gzip:   2.82 kB
src/symphony/workbench-static/assets/index-BRTPIdb3.js   732.18 kB | gzip: 136.50 kB
built in 149ms
```

The command also printed Node WASI experimental warnings before Vite output.

### `git diff --check`

Exit code: 0

```text
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit code: 0

Relevant result:

```text
task-4.status: approved
task-4.reviewVerdict: APPROVED
task-4.workerEvidenceRef: docs/plans/v22-task-4-worker-evidence-2026-05-29.md
task-4.reviewEvidenceRef: docs/plans/v22-task-4-review-evidence-2026-05-29.md
task-4.mainVerificationRef: null
summary.completedTasks: 4
summary.needsRevisionTasks: 0
summary.releaseReady: false
```

## Files committed before this evidence

Commit: `5b4bb3b9474e5c17e84816739f62cadb5d990c45`

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BRTPIdb3.js`
- `src/symphony/workbench-static/assets/index-D6WeclLN.css`
- removed build outputs replaced by the new asset names:
  - `src/symphony/workbench-static/assets/index-BRpcXqMt.js`
  - `src/symphony/workbench-static/assets/index-DiQWsXSk.css`
- `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`
- `docs/plans/v22-task-4-review-evidence-2026-05-29.md`

## Acceptance conclusion

PASSED.

The task-4 scope is satisfied: Prompt Workspace can generate `worker.started` and `worker.evidence-recorded` registration forms from the selected goal/task, and the forms reuse the controlled v21 dry-run and plan-hash confirm flow. The prior stale task issue is fixed because changing the selected task resets preview and confirm state, and both preview and confirm paths use the current form values.

No generic shell runner, generic safety layer, reviewer/main/release shortcut, worker self-approval path, release readiness inference, auto-tag, or auto-merge behavior was added in the checked task-4 state.

## Blockers

None.
