# v19 Task 7 review evidence

Date: 2026-05-29
Goal id: `v19-goal-runbook-next-action`
Task id: `task-7`
Branch reviewed: `v19-task7-docs-operator-guide`
Verdict: `APPROVED`

## reviewed files

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task7-worker-evidence-2026-05-29.md`
- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v19-task-evidence-index-2026-05-29.md`
- `docs/plans/v19-release-evidence-2026-05-29.md`
- Current branch diff against `main`
- Implementation references checked for doc accuracy:
  - `src/symphony/goal-runbook-contracts.js`
  - `src/symphony/goal-runbook-registry.js`
  - `src/symphony/goal-next-action-resolver.js`
  - `src/symphony/goal-prompt-pack.js`
  - `src/symphony/goal-closeout-report.js`
  - `src/symphony/console.js`
  - `frontend/workbench/src/api/client.js`
  - `frontend/workbench/src/api/contracts.js`
  - `frontend/workbench/src/App.jsx`
  - `fixtures/contracts/goal-runbook.valid.v1.json`
  - `fixtures/contracts/goal-next-action.valid.v1.json`
  - `fixtures/contracts/goal-prompt-pack.valid.v1.json`
  - `fixtures/contracts/goal-closeout-report.valid.v1.json`
  - `tests/v19-goal-runbook-contracts.test.js`
  - `tests/v19-goal-next-cli.test.js`
  - `tests/workbench-route-smoke.test.js`
  - `tests/workbench-api-client.test.js`

## review checks

- README keeps `Latest completed mainline release` and `Current released repository tag` at `v18`. It describes v19 as an implemented draft and does not make v19 the latest released/tagged version.
- `docs/symphony-product-contracts.md` covers all four v19 contracts: `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1`.
- The contract docs now match the implementation fields I checked: prompt packs include `generatedAt`, `prompts`, and `safety`; closeout reports include `generatedAt`, `releaseGates.mcasDoctor`, and the full closeout `safety` object required by `validateGoalCloseoutReportContract`.
- `docs/workbench-operator-guide.md` states Workbench is read-only / display-only / copy-only and describes Active Goal Control Center as a display surface only. It says Prompt Preview has no execute button, agent launch, model call, terminal write, or event confirm.
- The evidence index records task evidence by explicit event ids, evidence refs, and missing states. It keeps task-7 review and main verification unregistered until a reviewer verdict event and main verification event are explicitly confirmed.
- The release evidence draft keeps release gates `unknown`, status `NOT READY`, and tag evidence absent. It treats local command results as command evidence only.
- No reviewed file claims `release-ready`, a v19 tag, automatic tag, or tag evidence.

## local evidence checked

- `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` reports `summary.totalTasks: 9`, `summary.completedTasks: 7`, `summary.needsRevisionTasks: 0`, `summary.releaseReady: false`, and `summary.releaseReadySource: null`.
- The same goal-status output reports task-7 as `status: "in-progress"` from `goal-event-log.v1:evt_f7f1d97c224c6cdb`, with worker evidence ref `docs/plans/v19-task7-worker-evidence-2026-05-29.md`, review evidence `null`, and main verification `null`.
- The same goal-status output reports release gates `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `mutationGate`, `auditHigh`, `diffCheck`, `mcasDoctor`, `docsUpdated`, and `tagEvidence` as `unknown`.
- `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` returns `goal-next-action.v1` with `status: "missing-runbook"` and reason `No active managed goal runbook is registered.`
- `git tag --list 'v19'` returned no output. `git rev-parse --verify refs/tags/v18` returned `5b68630aded51007416cbf357546acad3b6a1f2e`.

## commands run

| Command | Result |
|---|---|
| `git status --short --branch` | Exit 0. Output: `## v19-task7-docs-operator-guide`. |
| `git merge-base main HEAD` | Exit 0. Output: `1e11bb57e4af8970711e3795cdfd2d7a47aa6538`. |
| `git diff --stat main...HEAD` | Exit 0. Output at review time: `README.md` 14 changed lines; `docs/plans/v19-release-evidence-2026-05-29.md` 89 added lines; `docs/plans/v19-task-evidence-index-2026-05-29.md` 52 added lines; `docs/plans/v19-task7-review-evidence-2026-05-29.md` 82 added lines before this rewrite; `docs/plans/v19-task7-worker-evidence-2026-05-29.md` 64 added lines; `docs/symphony-product-contracts.md` 43 changed lines; `docs/workbench-operator-guide.md` 59 changed lines; total `7 files changed, 398 insertions(+), 5 deletions(-)`. |
| `git diff --name-status main...HEAD` | Exit 0. Output: modified `README.md`, added `docs/plans/v19-release-evidence-2026-05-29.md`, added `docs/plans/v19-task-evidence-index-2026-05-29.md`, added `docs/plans/v19-task7-review-evidence-2026-05-29.md`, added `docs/plans/v19-task7-worker-evidence-2026-05-29.md`, modified `docs/symphony-product-contracts.md`, modified `docs/workbench-operator-guide.md`. |
| `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` | Exit 0. Key exact fields: `summary.totalTasks: 9`, `summary.completedTasks: 7`, `summary.needsRevisionTasks: 0`, `summary.releaseReady: false`, `summary.releaseReadySource: null`; task-7 `status: "in-progress"`, `statusSource: "goal-event-log.v1:evt_f7f1d97c224c6cdb"`, `workerEvidenceRef: "docs/plans/v19-task7-worker-evidence-2026-05-29.md"`, `reviewEvidenceRef: null`, `mainVerificationRef: null`; all release gates `unknown`. |
| `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` | Exit 0. Output contract `goal-next-action.v1`, `status: "missing-runbook"`, `next: null`, reason `No active managed goal runbook is registered.`, copy-only command `symphony goal init --goal v19-goal-runbook-next-action --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json`. |
| `git tag --list 'v19'` | Exit 0. No output. |
| `git rev-parse --verify refs/tags/v18` | Exit 0. Output: `5b68630aded51007416cbf357546acad3b6a1f2e`. |
| `pnpm check` | Exit 0. Output script: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`. |
| `pnpm test` | Exit 0. Node test runner summary: `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3525.161`. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html` (`0.42 kB`, gzip `0.27 kB`), `assets/index-D3K9Dk14.css` (`7.95 kB`, gzip `2.10 kB`), and `assets/index-Duy8jdh2.js` (`627.71 kB`, gzip `117.91 kB`) in `136ms`. Node printed the existing WASI experimental warning. |
| `git diff --check` | Exit 0. No output. |

## blockers

None for Task 7 docs review.

## verdict

`APPROVED`

This approval covers Task 7 docs, operator guide, evidence index, release evidence draft, and their alignment with the implemented v19 contract surface. It does not register a reviewer event, does not main-verify task-7, does not declare release-ready, and does not create tag evidence.
