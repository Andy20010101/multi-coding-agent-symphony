# v32 task-5 main verification evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-5`  
Task title: `Next-version handoff generator`  
mainVerificationStatus: passed

## Verification result

Task-5 passes main verification on the repo-local current-checkout fallback.

The checkout is dirty and currently on `v30-task-3-adoption-inspect-and-recovery-view`, so I did not attempt the standard `git checkout main`, `git pull --ff-only`, or `git merge --ff-only v32-task-5-next-version-handoff-generator` path. I did not clean, stash, reset, revert, merge, push, tag, publish, stage, commit, or register any goal event/gate/review/closeout.

Current managed goal state matches the requested handoff point. `goal-status` reports task-5 as `approved`, with worker evidence `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`, review evidence `docs/plans/v32-task-5-review-evidence-2026-06-01.md`, review verdict `APPROVED`, and `mainVerificationRef: null`. `goal next` reports task-5 role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.`

## Evidence basis

- Runbook and scope: `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`, task-5 section.
- Plan and fixture: `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`, `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`.
- Worker evidence: `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`.
- Review evidence: `docs/plans/v32-task-5-review-evidence-2026-06-01.md`.
- Event journal fallback: `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson`.
- Product docs: `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`.
- Source and tests: `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/styles/workbench.css`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`.
- Built Workbench assets: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BDjDodcJ.js`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`.

## Worker and review evidence checks

- Worker evidence exists at `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`.
- Event journal sequence 15 is `worker.evidence-recorded` for task-5 by `codex-v32-task-5-worker`, evidence ref `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`.
- Review evidence exists at `docs/plans/v32-task-5-review-evidence-2026-06-01.md`.
- Review evidence states `Verdict: approved`.
- Event journal sequence 16 is `reviewer.approved` for task-5 by `v32-task-5-reviewer`, evidence ref `docs/plans/v32-task-5-review-evidence-2026-06-01.md`, verdict `APPROVED`.
- Reviewer actor `v32-task-5-reviewer` is different from worker actor `codex-v32-task-5-worker`.
- The worker evidence command table records the pre-registration state where task-5 still had no worker event. That is consistent with the later event journal sequence 15, which records the worker evidence after the worker evidence file existed.

## Workbench path and implementation checks

- `projectGoalCloseoutGaps` passes the active `closeout`, `releaseBaseline`, `verificationChecklist`, `releaseEvidenceDraft`, `tagEvidencePrompt`, `eventLog`, `ledger`, and `latestRun` into `projectNextVersionHandoffDraft`.
- `projectNextVersionHandoffDraft` exposes `sourceRefs` for `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-operation-runs.v1`, `docs/workbench-operator-guide.md`, and `docs/symphony-product-contracts.md`.
- The draft includes release evidence and tag evidence refs from `ReleaseEvidenceDraftWriter` and `TagEvidenceDraftWriter`, task evidence anchors from the ledger, release gate anchors from the closeout/checklist, latest run id, target commit from the release baseline resolver, and implemented capability states.
- `App.jsx` renders `NextVersionHandoffDraft` under `Closeout Gaps -> next-version handoff draft`, after `release evidence draft` and `tag evidence draft / prompt`.
- The task-5 panel renders field lists and `<pre><code>{draft.markdown.text}</code></pre>`. I found no task-5 panel handler, form, clipboard call, file-open call, download path, shell execution path, model invocation path, goal creation path, event/gate registration path, or release-ready declaration path.
- Built Workbench assets served from `/workbench/` include `NextVersionHandoffDraft`, `next-version handoff draft`, `createsManagedGoal`, `entersNextVersion`, `downloadsArtifacts`, and `v8TopLevelModel`.

## Boundary checks

- The handoff draft is display-only and copy-only. Safety fields set `createsManagedGoal=false`, `entersNextVersion=false`, `runsShell=false`, `invokesModel=false`, `readsEvidenceBodies=false`, `opensLocalFiles=false`, `downloadsArtifacts=false`, `mergesBranches=false`, `pushesBranchesOrTags=false`, `createsTag=false`, `publishesRelease=false`, `declaresReleaseReady=false`, `selfApprovalAvailable=false`, and `v8TopLevelModel=false`.
- The draft reports `releaseReady` from `closeout.summary` and the latest explicit `release.ready-declared` event lookup only. It does not declare `release.ready`.
- The next-version label is derived from the managed current goal id version. The code does not treat that label as a created goal, an active next version, or a readiness signal.
- I did not find task-5 logic that infers state/readiness/next-version status from filenames, branch names, tags, commit messages, prompt text, frontend state, test names, or release notes text. Status fields are sourced from `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-operation-runs.v1`, release/tag draft projections, and latest run context.
- `tests/workbench-shell.test.js` checks the closeout panel exposes `NextVersionHandoffDraft`, `createsManagedGoal`, and `entersNextVersion`, and rejects `child_process`, `exec(`, `spawn(`, `window.open`, `navigator.clipboard`, `git merge`, and `git tag` in the relevant panel body.
- v8 compatibility commands remain compatibility/script commands. The active Workbench path is documented and rendered around `goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest`, not a top-level `scan/do/review/verify/status/continue/artifacts` model.

## Commands run

| Command | Exit code | Evidence |
| --- | ---: | --- |
| `pnpm check` | 0 | JavaScript syntax check completed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Node test runner reported `759` tests, `759` pass, `0` fail. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-BDjDodcJ.js`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Task-5 status `approved`; worker and review evidence refs present; review verdict `APPROVED`; `mainVerificationRef: null`; `releaseReady: false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Next action is task-5 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.` |
| `pnpm --silent symphony goal events --goal v32-release-manager-workspace-v2 --json` | 64 | Read-only event CLI fallback attempt failed because `events` is not a goal subcommand in this checkout. No state was changed. |
| `sed -n '15,16p' .symphony/goals/events/v32-release-manager-workspace-v2.ndjson` | 0 | Confirmed task-5 worker evidence event and independent reviewer approval event from the managed journal file. |
| `pnpm symphony console --help` | 64 | Read-only console option discovery failed because `--help` is not supported for `console`. No state was changed. |
| `pnpm symphony console` | 143 | Started the local read-only console on `http://127.0.0.1:8765/`; after route checks, I terminated the server I started. |
| `curl -sS -i http://127.0.0.1:8765/workbench/` | 0 | Served Workbench HTML with asset `index-BDjDodcJ.js` and stylesheet `index-BY5UaxlX.css`. |
| `curl -sS http://127.0.0.1:8765/workbench/assets/index-BDjDodcJ.js \| rg -n "NextVersionHandoffDraft|next-version handoff draft|createsManagedGoal|entersNextVersion|downloadsArtifacts|v8TopLevelModel"` | 0 | Served bundle contains the task-5 model, panel label, and safety fields. |

## Blockers

None.

## Suggested gate registration command

```bash
pnpm --silent symphony goal gate --goal v32-release-manager-workspace-v2 --task task-5 --gate main-verification --status passed --verifier codex-v32-task-5-main-verifier --evidence-ref docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md --dry-run --json
```
