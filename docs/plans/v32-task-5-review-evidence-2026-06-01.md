# v32 task-5 review evidence

Date: 2026-06-01

Goal: `v32-release-manager-workspace-v2`  
Task: `task-5`  
Role: independent reviewer  
Verdict: approved

## Evidence inspected

- Runbook and task scope: `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`, task-5 section.
- Release plan and contract fixture: `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`, `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`.
- Worker evidence: `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`.
- Worker-touched product areas: `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/styles/workbench.css`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`, and `src/symphony/workbench-static/`.

## Code and UI review

- `projectNextVersionHandoffDraft` is projected inside release closeout. Its explicit inputs include `closeout`, `releaseBaseline`, `verificationChecklist`, `releaseEvidenceDraft`, `tagEvidencePrompt`, `eventLog`, `ledger`, and `latestRun`.
- The draft model exposes `sourceRefs` for `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-operation-runs.v1`, `docs/workbench-operator-guide.md`, and `docs/symphony-product-contracts.md`. The operator guide is referenced as a source ref, not read as a browser/local file body.
- The handoff draft includes release evidence and tag evidence refs, task evidence anchors, release gate anchors, implemented Workbench capability states, copy-only context commands, and markdown for `v33` starting context.
- Safety fields are explicit: `createsManagedGoal=false`, `entersNextVersion=false`, `runsShell=false`, `invokesModel=false`, `readsEvidenceBodies=false`, `opensLocalFiles=false`, `downloadsArtifacts=false`, `mergesBranches=false`, `pushesBranchesOrTags=false`, `createsTag=false`, `publishesRelease=false`, `declaresReleaseReady=false`, `selfApprovalAvailable=false`, and `v8TopLevelModel=false`.
- `App.jsx` renders `NextVersionHandoffDraft` under `Closeout Gaps` after release evidence and tag evidence sections. The component renders field lists and a `<pre><code>` markdown block only; it has no handler, button, form, clipboard call, file-open call, download path, shell execution path, goal creation path, or release-ready registration path.
- Existing release-ready registration remains a separate controlled task-4 path; the task-5 handoff panel does not trigger it.
- `tests/workbench-api-client.test.js` covers the v32 handoff projection: `NextVersionHandoffDraft`, `v33`, target commit, release/tag evidence refs, release gate anchors, copy-only closeout command, and the no-create/no-enter/no-shell/no-model/no-file/no-download/no-release-ready/no-v8 safety fields.
- `tests/workbench-shell.test.js` checks the Closeout Gaps panel exposes the next-version handoff draft and does not include `child_process`, `exec(`, `spawn(`, `window.open`, `navigator.clipboard`, `git merge`, or `git tag` in that panel body.
- Built Workbench static output contains `NextVersionHandoffDraft`, `next-version handoff draft`, `createsManagedGoal`, and `entersNextVersion` in `src/symphony/workbench-static/assets/index-BDjDodcJ.js`.

## Boundary checks

- State for task/review/main/release status comes from explicit closeout, event log, progress ledger, operation/run, release baseline, and release/tag draft projection fields. I did not find task-5 logic that treats filenames, branch names, tags, commit messages, prompt text, frontend state, test names, or release notes text as release readiness or next-version status.
- The handoff draft derives the `v33` label from the managed current goal id version, but does not treat that label as a created goal, active next version, or readiness state.
- The browser UI for the task-5 draft is display-only and copy-only. It does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, create goals, or declare `release.ready`.
- v8 compatibility commands are not used as the Workbench top-level model. The active Workbench path remains goal/runbook/next-action/closeout based.
- Worker evidence did not approve itself, declare main verification, or declare release readiness. The current goal ledger shows task-5 has `workerEvidenceRef`, `reviewEvidenceRef: null`, `mainVerificationRef: null`, and `releaseReady: false`.

## Validation commands

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | JavaScript syntax check completed. |
| `pnpm test` | 0 | `759` tests passed, `0` failed. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-BDjDodcJ.js`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Goal ledger shows 5 tasks, 4 completed, task-5 `in-progress` with worker evidence only, and `releaseReady: false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Next action is `task-5`, role `reviewer`, phase `review`, reason `Worker evidence exists for task-5 but reviewer verdict is missing.` |

## Findings and blockers

No blocker found for task-5.

## Boundary notes

- Current checkout was dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, not `v32-task-5-next-version-handoff-generator`. Per the requested boundary fallback, I reviewed the repo-local current checkout and did not clean, stash, reset, revert, merge, push, tag, publish, create a branch, or request manual approval.
- I did not run `symphony goal review`, `symphony goal update`, `symphony goal gate`, or `symphony goal closeout`.
- Review basis was the listed worker evidence, the current checkout diff/touched areas, static Workbench output, and the validation commands above.
