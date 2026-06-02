# v33 release evidence

Date: 2026-06-02

Goal id: `v33-app-runtime-foundation`
Release name: `v33 App Runtime Foundation`
Baseline: `v32 Release Manager Workspace v2`
Evidence path: `docs/plans/v33-release-evidence-2026-06-02.md`
Release-manager scope: closeout validation and release evidence only

## Release scope

v33 adds the local app runtime foundation without changing the v32 workflow kernel:

- local sidecar health contract
- project registry
- current project resolver
- goal/runtime app state snapshot
- read-only Workbench runtime surface
- operator guide and v34 Action Registry handoff contract

This closeout did not create v34 work. It did not create a new managed goal, start a next-version controller, create execution threads, register release gates, declare `release.ready`, stage, commit, tag, push, publish, stash, reset, revert, merge, pull, or switch branches.

## Boundary basis

The release-manager boundary-first commands were run before validation:

| Command | Result |
| --- | --- |
| `git status -sb --untracked-files=all` | Exit 0. Current branch is `v33-task-1-local-sidecar-health-api`. The checkout is dirty and mixed with v33 task files, docs, fixtures, tests, Workbench source changes, and generated static assets. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; 5 total tasks, 5 completed tasks, 0 blockers, `releaseReady: false`; all release gates unknown. |
| `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-next-action.v1`; next action is release-manager, phase `release-gate`, reason `release.pnpm-check is not passed in goal-progress-ledger.v1`. |
| `pnpm --silent symphony goal closeout --goal v33-app-runtime-foundation --markdown` | Exit 0. Missing evidence: none. Release ready: no. Release gate gaps: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated` unknown. |

Clean main checkout and ff-only pull were not safe. The current worktree contains staged, unstaged, and untracked v33 files, so `git checkout main` and `git pull --ff-only` would cross the release-manager boundary. I used the current-checkout fallback and recorded it here.

After `pnpm workbench:build`, `git status -sb --untracked-files=all` still showed the same dirty v33 branch boundary, including generated Workbench static asset replacement:

```text
## v33-task-1-local-sidecar-health-api
MM README.md
M  docs/plans/v28-release-evidence-2026-05-29.md
A  docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A  docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
AM docs/plans/v33-task-1-review-evidence-2026-06-02.md
A  docs/plans/v33-task-1-worker-evidence-2026-06-02.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/README_HOW_TO_START.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
MM docs/symphony-product-contracts.md
MM docs/workbench-operator-guide.md
A  fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
A  fixtures/contracts/local-runtime-health.v1.json
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
MM scripts/symphony.js
MM src/symphony/console.js
A  src/symphony/local-runtime-health.js
 D src/symphony/workbench-static/assets/index-BDjDodcJ.js
 M src/symphony/workbench-static/index.html
M  tests/symphony-cli.test.js
A  tests/v33-local-runtime-health.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v33-task-1-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-2-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-2-review-evidence-2026-06-02.md
?? docs/plans/v33-task-2-worker-evidence-2026-06-02.md
?? docs/plans/v33-task-3-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-3-review-evidence-2026-06-02.md
?? docs/plans/v33-task-3-worker-evidence-2026-06-02.md
?? docs/plans/v33-task-4-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-4-review-evidence-2026-06-02.md
?? docs/plans/v33-task-4-worker-evidence-2026-06-02.md
?? docs/plans/v33-task-5-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-5-review-evidence-2026-06-02.md
?? docs/plans/v33-task-5-worker-evidence-2026-06-02.md
?? docs/plans/v34-v40-final-app-core-materials.zip
?? fixtures/contracts/app-state-snapshot.blocked.v1.json
?? fixtures/contracts/app-state-snapshot.healthy.v1.json
?? fixtures/contracts/app-state-snapshot.missing-goal.v1.json
?? fixtures/contracts/app-state-snapshot.missing-project.v1.json
?? fixtures/contracts/app-state-snapshot.stale.v1.json
?? fixtures/contracts/app-state-snapshot.v1.json
?? fixtures/contracts/project-registry.v1.json
?? src/symphony/app-state-snapshot.js
?? src/symphony/project-registry.js
?? src/symphony/workbench-static/assets/index-CkJzWTCM.js
?? tests/v33-app-state-snapshot.test.js
?? tests/v33-project-registry.test.js
```

## Task event coverage

`pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` returned all five tasks as `main-verified`:

| Task | Title | Status source | Evidence coverage |
| --- | --- | --- | --- |
| `task-1` | Local sidecar skeleton and health API | `goal-event-log.v1:evt_240bfabb0fc196cc` | worker, review `APPROVED`, main verification evidence present |
| `task-2` | Project registry and current project resolver | `goal-event-log.v1:evt_6d7d3d52c9c43b4e` | worker, review `APPROVED`, main verification evidence present |
| `task-3` | Goal and release state snapshot API | `goal-event-log.v1:evt_70f8022ddfff686a` | worker, review `APPROVED`, main verification evidence present |
| `task-4` | App runtime contract, fixtures, and read-only Workbench surface | `goal-event-log.v1:evt_62ded9a2296189e1` | worker, review `APPROVED`, main verification evidence present |
| `task-5` | Runtime operator guide and v34 handoff | `goal-event-log.v1:evt_b261d33f9b7b9be1` | worker, review `APPROVED`, main verification evidence present |

Task-5 main verification event is `goal-event-log.v1:evt_b261d33f9b7b9be1`.

## Release validation

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. Ran Node syntax checks for `src/*.js`, `src/adapters/*.js`, `src/ensemble/*.js`, `src/integrations/*.js`, `src/intake/*.js`, `src/symphony/*.js`, `src/trackers/*.js`, `scripts/*.js`, `plugins/eval-replay/*.js`, and `tests/*.test.js`. |
| `pnpm test` | Exit 0. Node test runner passed: 776 tests, 119 suites, 776 pass, 0 fail, duration `6123.381166` ms. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` built 17 modules; output included `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-CkJzWTCM.js`; built in 67 ms. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. 5 tasks complete, 0 blockers, `releaseReady: false`; release gates all unknown. |
| `pnpm --silent symphony goal closeout --goal v33-app-runtime-foundation --markdown` | Exit 0. Missing evidence none; release ready no; release gate gaps `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated` unknown. |

## Focused runtime probes

| Command | Result |
| --- | --- |
| `pnpm --silent symphony runtime health --json` | Exit 0. Returned `local-runtime-health.v1`; `status: "ok"`; `readOnly: true`; runtime version `v33-app-runtime-foundation.1`; kernel source `v32 Release Manager Workspace v2`; repo path `/Users/andy/Documents/project/multi-coding-agent-symphony`; execution, job, model, git, release, and arbitrary command boundary flags false; `knownBlockers: []`. |
| `pnpm --silent symphony runtime projects --json` | Exit 0. Returned `project-registry.v1`; `readOnly: true`; one project for `/Users/andy/Documents/project/multi-coding-agent-symphony`; required registry fields present; disk scan scope `cwd-or-explicit-repo-path-only`; registry database, action, job, model, git, release, and arbitrary command boundary flags false. |
| `pnpm --silent symphony runtime current --json` | Exit 0. Returned `current-project-resolver.v1`; `resolution.status: "resolved"`; current project repo path `/Users/andy/Documents/project/multi-coding-agent-symphony`; write and execution boundary flags false. |
| `pnpm --silent symphony runtime snapshot --json` | Exit 0. Returned `app-state-snapshot.v1`; freshness `current`; active goal `v33-app-runtime-foundation`; current task `release`; role `release-manager`; phase `release-gate`; release ready false; all release gates unknown; known blocker `release-ready-not-declared`; write, execution, model, git, release, arbitrary command, and confirm boundary flags false. |

## Closeout before coordinator gate registration

Closeout is ready for coordinator gate registration, but the goal ledger has not yet been updated with release gate events:

- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Missing evidence: none
- Release ready: no
- Release ready source: missing
- Release gate gaps: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated`
- Release gates currently recorded in ledger: all unknown

`goal next` correctly remains at release-manager because `release.pnpm-check` has not been registered as passed in `goal-progress-ledger.v1`.

## Release gate readiness mapping

These gate registrations are ready for the coordinator to register through the controlled dry-run plus confirm flow, using this release evidence file:

| Gate | Coordinator registration readiness | Evidence basis |
| --- | --- | --- |
| `pnpmCheck` | Ready to register `passed` | `pnpm check` exited 0. |
| `pnpmTest` | Ready to register `passed` | `pnpm test` exited 0 with 776/776 tests passing. |
| `workbenchBuild` | Ready to register `passed` | `pnpm workbench:build` exited 0 and produced the v33 Workbench static bundle. |
| `diffCheck` | Ready to register `passed` | `git diff --check` exited 0 with no output. |
| `docsUpdated` | Ready to register `passed` | v33 plan, execution prompts, runbook, task evidence docs, operator guide, product contracts, and this release evidence are present; task-5 specifically verifies operator guide and v34 handoff docs. |
| `mutationGate` | Not assessed for registration in this closeout | Not part of requested minimum release validation. |
| `auditHigh` | Not assessed for registration in this closeout | Not part of requested minimum release validation. |
| `mcasDoctor` | Not assessed for registration in this closeout | Not part of requested minimum release validation. |
| `tagEvidence` | Not ready and intentionally not registered | No tag was created or requested; v33 closeout stops before tag/push/publish. |

After these release gates are registered, the coordinator can evaluate whether to declare `release.ready` through dry-run plus confirm. This release-manager did not declare it.

## Known blockers and recovery

No product validation blocker remains for the requested release gates.

Operational blockers before coordinator registration:

- The current checkout is dirty and not clean `main`; use the current-checkout evidence above for gate registration, or clean/merge separately in a coordinator-controlled flow.
- Release gates are still unknown in the ledger until the coordinator registers them.
- `release.ready` remains false until explicit coordinator registration.
- `tagEvidence` remains unknown because no release tag was created in this scope.

Recovery steps:

1. If any coordinator dry-run fails, do not confirm. Re-run the matching validation command from this evidence and inspect the generated plan hash inputs.
2. If Workbench static assets drift, rerun `pnpm workbench:build`, then rerun `git diff --check`.
3. If the ledger still reports unknown gates after confirmation, rerun `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` and `pnpm --silent symphony goal closeout --goal v33-app-runtime-foundation --markdown` before declaring `release.ready`.
4. Do not create v34 execution state from this v33 closeout. Stop after v33 release gate and `release.ready` handling.

## Final recommendation

Coordinator can register the minimum v33 release gates with dry-run plus confirm:

- `pnpmCheck: passed`
- `pnpmTest: passed`
- `workbenchBuild: passed`
- `diffCheck: passed`
- `docsUpdated: passed`

The coordinator should then rerun closeout and decide `release.ready` through the controlled dry-run plus confirm flow. This release-manager did not register any gate, did not declare `release.ready`, and did not perform tag, push, publish, stage, or commit actions.
