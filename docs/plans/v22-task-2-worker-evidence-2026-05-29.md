# v22 Task 2 worker evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-2`

Branch: `v22-task-2-role-specific-prompt-renderer`

User-visible value: 不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。

## Implementation summary

The role-specific prompt renderer now emits goal-specific evidence paths instead of hard-coded `v19-*` paths. For the v22 managed goal, task prompts point to paths such as `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`, and release-manager prompts point to `docs/plans/v22-release-evidence-2026-05-29.md`.

Each generated prompt now carries structured `roleGuidance` with:

- role label and phase
- role boundary
- evidence requirements
- handoff checklist

The Prompt Workspace displays those fields beside the generated prompt pack so the operator can see the subagent boundary and evidence expectations before copying the prompt text.

Release-manager prompts now include release closeout and goal-status checks in addition to release gate commands.

## Files changed

- `src/symphony/goal-prompt-pack.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C9qSNaEa.css`
- `src/symphony/workbench-static/assets/index-GmlGAlrr.js`
- Removed old built assets from the previous Workbench build hash.

## Command results

### `pnpm check`

Exit 0.

Exact output:

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
duration_ms 3679.969833
```

### `pnpm workbench:build`

Exit 0.

Exact build summary:

```text
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-C9qSNaEa.css   12.35 kB │ gzip:   2.70 kB
src/symphony/workbench-static/assets/index-GmlGAlrr.js   705.67 kB │ gzip: 131.97 kB

✓ built in 144ms
```

The command also printed Node `ExperimentalWarning: WASI is an experimental feature and might change at any time`.

### Browser check

Read-only console server:

```text
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8765/
```

In-app browser check on `http://127.0.0.1:8765/workbench/prompts` after selecting `task-2`:

```json
{
  "hasRouteTitle": true,
  "hasGoal": true,
  "hasRoleGuidance": true,
  "hasV22Evidence": true,
  "hasV22UnhyphenatedEvidenceLeak": false,
  "hasV19EvidenceLeak": false
}
```

### `git diff --check`

Exit 0. No output.

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit 0.

Exact key fields:

```text
contractName: goal-progress-ledger.v1
goalId: v22-goal-prompt-handoff-workspace
summary.totalTasks: 5
summary.completedTasks: 1
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-2.status: in-progress
task-2.workerEvidenceRef: null
task-2.reviewEvidenceRef: null
task-2.mainVerificationRef: null
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.diffCheck: unknown
safety.readOnly: true
safety.copyOnly: true
```

## Boundary notes

- Workbench main path remains on latest/v19 goal/runbook/next-action command surface: `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, `goal closeout`.
- The implementation does not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- No generic safety framework or generic shell runner was added.
- Prompt rendering does not infer approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- This worker did not run reviewer approval, main verification, release gates, or `release.ready`.
- No goal event was registered by this worker.

## Reviewer handoff checklist

- Check `buildGoalPromptPack` output for `worker`, `reviewer`, `main-verifier`, and `release-manager` on `v22-goal-prompt-handoff-workspace`.
- Confirm v22 prompts use hyphenated `docs/plans/v22-task-2-*` evidence paths and do not leak `docs/plans/v22-task2-*` or `docs/plans/v19-*` evidence paths.
- Confirm the Prompt Workspace displays `roleGuidance` without adding execution, model invocation, download, local-open, or approval controls.
- Confirm release-manager prompts require explicit task evidence, release gate evidence, closeout, and goal-status checks before `release.ready`.
