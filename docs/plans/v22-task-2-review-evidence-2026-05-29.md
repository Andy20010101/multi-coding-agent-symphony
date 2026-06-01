# v22 Task 2 review evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-2`

Branch reviewed: `v22-task-2-role-specific-prompt-renderer`

Review date: 2026-05-31

## Findings

No findings requiring worker revision.

## Verdict

APPROVED

Approval scope: task-2 role-specific prompt rendering and Prompt Workspace display of role guidance. This does not claim main verification or release readiness.

## Reviewed files and diff scope

Base used for review: task-1 branch tip `7126372 Add v22 task-1 main verification evidence`. The task-2 implementation is in the working tree on top of that base.

Reviewed changes:

- `src/symphony/goal-prompt-pack.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C9qSNaEa.css`
- `src/symphony/workbench-static/assets/index-GmlGAlrr.js`
- Removed generated assets: `src/symphony/workbench-static/assets/index-BvEjAy60.js`, `src/symphony/workbench-static/assets/index-D4CiDpgV.css`
- Worker evidence: `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`

`git diff --stat HEAD --` showed 9 tracked files changed, with 286 insertions and 16093 deletions. The new built asset files are untracked in the current worktree and must be included when the branch is staged.

## Prompt checks

I generated the four v22 prompts with:

- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role worker --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role reviewer --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task task-2 --role main-verifier --json`
- `pnpm --silent symphony goal prompt --goal v22-goal-prompt-handoff-workspace --task release --role release-manager --json`

Observed results:

- Worker prompt uses `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`, includes worker-only boundaries, validation commands, worker event guidance, and reviewer handoff notes.
- Reviewer prompt uses `docs/plans/v22-task-2-review-evidence-2026-05-29.md`, identifies the role as independent reviewer, requires findings-first review evidence, and provides both approved and needs-revision registration commands.
- Main verifier prompt uses `docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md`, requires explicit reviewer approval first, and registers only through `goal gate --gate main-verification`.
- Release manager prompt uses `docs/plans/v22-release-evidence-2026-05-29.md`, includes release gates, closeout, goal-status checks, and release-ready gating language.
- Each prompt includes `Role boundary`, `Role evidence checklist`, and `Handoff checklist`.
- No generated v22 task-2 prompt output contained `docs/plans/v19-`.

## Workbench check

Started the read-only console server:

```text
pnpm --silent symphony console --host 127.0.0.1 --port 8765
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8765/
```

Opened `http://127.0.0.1:8765/workbench/prompts` and selected `task-2`.

Observed page state:

```json
{
  "selects": [
    "v22-goal-prompt-handoff-workspace",
    "worker",
    "task-2"
  ],
  "hasTask2Evidence": true,
  "hasV19EvidenceLeak": false,
  "hasRoleBoundary": true,
  "hasEvidenceRequirements": true,
  "hasHandoffChecklist": true,
  "hasCopyOnlyNote": true,
  "buttonCount": 0,
  "anchorCount": 0
}
```

The Prompt Workspace displays `roleGuidance` fields and the copy-only prompt text. I did not find shell execution, model execution, local-open, download, approval, or auto-registration controls on the prompt route.

## Acceptance decision

Task-2 acceptance is met.

- Different subagents receive role-specific prompts with explicit boundaries and evidence expectations.
- Worker, independent reviewer, main verifier, and release manager prompt rendering works.
- v22 evidence paths are used for v22 task-2 prompts and release evidence.
- v19 evidence paths do not leak into v22 generated prompts.
- Prompt Workspace remains a read-only, copy-only display surface.
- Workbench remains on the latest/v19 goal/runbook/next-action flow: `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, and `goal closeout`; it does not revert to the v8 command button list.

## Boundary notes

- I did not implement task-2.
- I did not edit product code.
- I did not register goal events.
- I did not approve based on worker summary alone; I inspected the diff, worker evidence, generated prompt outputs, Workbench route behavior, tests, and goal-status output.
- The current review approval is not main verification and not release readiness.

## Command results

### `pnpm check`

Exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit 0.

```text
tests 693
suites 111
pass 693
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3690.184292
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
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-C9qSNaEa.css   12.35 kB │ gzip:   2.70 kB
src/symphony/workbench-static/assets/index-GmlGAlrr.js   705.67 kB │ gzip: 131.97 kB

✓ built in 146ms
```

The command also printed Node `ExperimentalWarning: WASI is an experimental feature and might change at any time`.

### `git diff --check`

Exit 0. No output.

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit 0.

Key fields observed:

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
task-2.workerEvidenceRef: docs/plans/v22-task-2-worker-evidence-2026-05-29.md
task-2.reviewEvidenceRef: null
task-2.mainVerificationRef: null
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.diffCheck: unknown
safety.readOnly: true
safety.copyOnly: true
```

## Next handoff

Controller can register `reviewer.approved` for task-2 using dry-run and confirm with this evidence ref:

`docs/plans/v22-task-2-review-evidence-2026-05-29.md`

After the review event is registered, task-2 should move to main verification.
