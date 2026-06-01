# v32 task-3 worker evidence

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-3`  
Task title: `Release and tag evidence workspace`

## User-visible value

Workbench Closeout Gaps now shows a release evidence draft and a tag evidence draft. The operator can see release evidence ref, tag evidence ref, target commit, release notes summary, command/result rows for release gates, tag recommendation, and a copy-only `git tag` command. The browser does not execute tag, push, publish, merge, shell, model, download, or local-file actions.

## Implementation summary

- `ReleaseEvidenceDraftWriter` is projected under Closeout Gaps from `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, and release checklist fields.
- `TagEvidenceDraftWriter` shows `tagRecommendation`, `targetCommit`, `copyOnlyTagCommand`, release notes summary, latest `release.tag-evidence` event/ref, and command/result fields marked `not-run-by-workbench`.
- The Closeout Gaps UI renders release evidence draft markdown, command/result rows, tag command fields, latest tag evidence refs, and boundary text.
- Workbench shell/API tests cover v32 evidence refs, target commit, tag recommendation, release notes summary, command/result fields, and copy-only tag safety.
- Operator guide and product contract docs state that the release/tag drafts do not write evidence files, run `git tag`, push tags, publish releases, or declare `release.ready`.

## Files changed by this task

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B9blLPKD.js`
- `src/symphony/workbench-static/assets/index-BY5UaxlX.css`

Pre-existing dirty files and artifacts were present before this worker pass and were not cleaned or reverted, including v29-v32 evidence docs, runbook fixtures, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/styles/workbench.css`, `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`, `tests/symphony-cli.test.js`, `tests/v23-goal-operation-console-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`, `docs/release-checklist.md`, and old Workbench static asset deletions.

## Commands run

- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v32-release-baseline-resolver.test.js`: exit `0`. Focused Workbench release/baseline tests passed: `71` tests, `4` suites, `0` failures.
- `pnpm check`: exit `0`. Node syntax check passed for source, scripts, plugins, and tests.
- `pnpm test`: exit `0`. Full test suite passed: `758` tests, `116` suites, `0` failures.
- `pnpm workbench:build`: exit `0`. Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-B9blLPKD.js`.
- `git diff --check`: exit `0`. No whitespace errors.
- `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json`: exit `0`. Final output reported `totalTasks: 5`, `completedTasks: 2`, `blockedTasks: 0`, `releaseReady: false`; task-3 was `in-progress` from `goal-event-log.v1:evt_d3c00ed58f954bc3` with worker evidence ref `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`.
- `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json`: exit `0`. After this evidence file existed, output returned task `task-3`, role `reviewer`, phase `review`, reason `Worker evidence exists for task-3 but reviewer verdict is missing.`
- `git status --short --branch`: exit `0`. Current branch was `v30-task-3-adoption-inspect-and-recovery-view` with a dirty worktree.
- `git diff --name-only`: exit `0`. Used to inspect the current tracked dirty file set after the Workbench build.
- Browser check: started `pnpm symphony console --host 127.0.0.1 --port 8765`, opened `http://127.0.0.1:8765/workbench/#closeout-gaps-panel`, and verified the DOM contained `Closeout Gaps`, `release evidence draft`, `tag evidence draft / prompt`, `TagEvidenceDraftWriter`, `copyOnlyTagCommand`, `release notes summary`, and `targetCommit`. The local console process was stopped afterward.

## Workbench user path

Open Workbench, go to Active Goal, then Closeout Gaps:

- `release baseline resolver` shows backend git/GitHub command outputs and stop/fix guidance.
- `release verification checklist` shows release gate rows and controlled `goal gate` dry-run/plan-hash confirm forms.
- `release evidence draft` shows release evidence ref, tag evidence ref, target commit, target commit source, release notes summary, and command/result rows for each release gate.
- `tag evidence draft / prompt` shows `TagEvidenceDraftWriter` fields: tag recommendation, target commit, copy-only tag command, latest tag-evidence gate event/ref, release notes summary, command/result fields, and boundary text.

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, closeout confirm, tag, push, publish, merge, pull, stash, reset, checkout, staging, or commit commands.
- After the evidence file appeared, the managed v32 event log contained `evt_d3c00ed58f954bc3` for `worker.evidence-recorded` at `2026-06-01T12:40:23.439Z`. That state was observed through read-only commands; no review verdict, main verification gate, release gate, or release.ready event was registered by this worker pass.
- Browser changes are display-only except the existing controlled `goal gate` dry-run/plan-hash confirm forms for release gates. The tag command is text only.
- Release/tag draft fields come from explicit backend contracts: closeout report, release baseline resolver output, event log, and checklist projection. The draft does not infer task completion, gate status, target status, or release readiness from branch names, filenames, commit messages, prompt text, task titles, or frontend state.
- The runbook branch setup would normally start from clean `main` and create `v32-task-3-release-and-tag-evidence-workspace`. The checkout was already dirty on `v30-task-3-adoption-inspect-and-recovery-view`, so I used the current-checkout fallback and did not move branches or clean unrelated work.
- Task-4 `release.ready` closeout confirm and task-5 next-version handoff generator were not implemented.

## Reviewer handoff checklist

- Verify `ReleaseEvidenceDraftWriter` uses only closeout, release baseline resolver, event log, and release checklist fields.
- Verify `TagEvidenceDraftWriter` shows `copyOnlyTagCommand` and marks tag command results as `not-run-by-workbench`.
- Verify Workbench does not add a browser shell runner, tag execution, push/publish path, local file open, artifact download, or `release.ready` declaration in task-3.
- Verify tests cover v32 evidence refs, target commit, tag recommendation, release notes summary, command/result fields, and copy-only safety flags.
- Review current dirty checkout boundaries before registering any reviewer verdict.
