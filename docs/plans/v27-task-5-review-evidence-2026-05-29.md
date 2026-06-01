# v27 task-5 independent review evidence

Goal id: `v27-review-revision-loop`
Task id: `task-5`
Branch reviewed: `v27-task-5-review-revision-tests-docs`
Review date: 2026-06-01
Reviewer: independent Codex reviewer

## Review boundary

The checkout is on `v27-task-5-review-revision-tests-docs`. The worktree also contains earlier task and prior-version artifacts that were already uncommitted in this branch. I used the current-checkout review boundary, did not revert unrelated files, and reviewed task-5 against the v27 runbook acceptance and worker evidence.

Worker evidence reviewed: `docs/plans/v27-task-5-worker-evidence-2026-05-29.md`

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- `docs/plans/v27-task-5-worker-evidence-2026-05-29.md`
- `tests/v27-review-revision-loop.test.js`
- `fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-prompt-pack.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/App.jsx`
- `tests/v19-goal-next-action-resolver.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Independent findings

The task-5 test covers the requested loop through the real goal/runbook event path where practical. It registers the v27 runbook fixture into temporary managed state, seeds task-1 through task-4 as main verified, then uses `runSymphonyCli` dry-run plus plan-hash confirm calls for task-5 worker evidence, reviewer verdicts, and main-verification failure. It then checks `goal next` and `goal prompt --next`, not just isolated helper output.

Coverage matches the task-5 acceptance:

- `reviewer.approved` moves task-5 to `main-verifier` / `main-verification`.
- `reviewer.needs-revision` moves task-5 back to worker revision.
- `main.verification-failed` moves task-5 back to worker revision.
- Revision prompts include failed commands, latest exposed run changed files, and acceptance delta.
- A later revision `worker.evidence-recorded` sends task-5 back to `reviewer` for another independent review instead of skipping to main verification.

The latest/v19 goal/runbook/next-action path remains the primary Workbench path. The reviewed docs and frontend projections describe `goal-status -> goal next -> goal prompt -> goal update/review/gate`; I did not find a new v8 `scan/do/review/verify/status/continue/artifacts` button model.

I did not find a new generic safety layer, generic shell runner, permission system, goal framework, or artifact framework in task-5 scope. The Workbench paths remain bounded to existing controlled `goal update`, `goal review`, and `goal gate` dry-run/confirm APIs, with command text treated as copy-only unless a plan-hash confirm route appends an explicit goal event.

I did not find frontend or docs logic that infers task approval or release readiness from filenames, branches, commits, prompt text, or frontend state. Review Workspace and related docs state that approval comes from explicit `reviewer.approved` events and release readiness requires explicit release gate evidence.

Task-5 does not declare release readiness and does not perform release-manager work. The v27 fixture keeps final-task release-manager expected evidence in the same fixture pattern as earlier goal runbooks, but the task-5 tests do not register release events and explicitly assert revision prompts do not include `release.ready` guidance.

## Command results

`pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit 0.

```text
▶ v27 review -> revision -> verify loop
  ✔ routes approved task-5 review evidence to main verification (27.379667ms)
  ✔ turns needs-revision into a revision prompt and hands revised task-5 evidence back to a reviewer (19.952875ms)
  ✔ turns failed main verification into a revision prompt and sends fixed task-5 work through reviewer again (19.629125ms)
✔ v27 review -> revision -> verify loop (67.491167ms)
ℹ tests 730
ℹ suites 115
ℹ pass 730
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4525.752708
```

`pnpm workbench:build`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-BGag3HMW.js   818.42 kB │ gzip: 152.07 kB

✓ built in 52ms
```

`git diff --check`

Result: exit 0. No output.

## Verdict

APPROVED for task-5 review scope only. This approval covers the task-5 tests/docs review-revision loop coverage on the current checkout. It does not claim main verification passed, release gates passed, or release readiness.

## Blockers

None.
