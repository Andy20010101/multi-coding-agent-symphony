# v27 Release Evidence

Date recorded: 2026-06-01 Asia/Shanghai
Goal id: `v27-review-revision-loop`
Release name: `v27 Review Revision Loop`
Evidence path: `docs/plans/v27-release-evidence-2026-05-29.md`

## Verification Basis

- Repository path used: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Branch used: `v27-task-5-review-revision-tests-docs`
- Current commit used: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Local `main` commit: `ab714716e85d13c71c5643036292ede0594c48a6`
- Diff basis: current branch `HEAD` plus the uncommitted worktree diff on `v27-task-5-review-revision-tests-docs`.
- Managed-goal state supplied by controller: task-1 through task-5 are main-verified in `goal-status`; release gates were unknown and `release.ready` was not declared before this closeout.

## Boundary Notes

- Original blocked operation: `git checkout main`.
- Blocker: the current checkout contained uncommitted v27 task changes and unrelated prior-version artifacts. Switching to `main` risked crossing release boundaries and carrying a dirty worktree into the wrong branch.
- Fallback used: release verification ran from the current checkout at `/Users/andy/Documents/project/multi-coding-agent-symphony` on branch `v27-task-5-review-revision-tests-docs`.
- `git pull --ff-only` was not run because checkout to `main` was blocked by the dirty-worktree boundary.
- This fallback supersedes the checkout/pull blocker for release verification because all requested release checks passed on the actual v27 worktree basis.
- Workbench product boundary: Workbench mainline is the latest goal/runbook flow, not the v8 action dashboard.
- No unrelated changes were reverted. No gate was registered. No merge, tag, or push was performed.

## Command Results

| Command | Result |
| --- | --- |
| `git checkout main` | Not executed. Blocked by dirty worktree boundary; fallback verification used current branch. |
| `git pull --ff-only` | Not executed. Depends on checkout to `main`, which was blocked by dirty worktree boundary. |
| `pnpm check` | Passed, exit 0. `node --check` completed for source, scripts, plugin, and test JavaScript files. |
| `pnpm test` | Passed, exit 0. Node test runner reported 730 tests, 115 suites, 730 pass, 0 fail, duration 4475.873333 ms. |
| `pnpm workbench:build` | Passed, exit 0. Vite built 17 modules into `src/symphony/workbench-static`; output assets were `index-Cij6QcGP.css` and `index-BGag3HMW.js`. |
| `pnpm test:mutation:gate` | Passed, exit 0. Stryker tested 2382 mutants; final mutation score 74.27, break threshold 60; killed 1763, timed out 6, survived 492, no coverage 121, errors 0. |
| `pnpm audit --audit-level high` | Passed, exit 0. Output reported 1 vulnerability at moderate severity and no high-severity audit failure. |
| `pnpm mcas doctor` | Passed, exit 0. Output status was `ok`; Node version `24.14.0`; package manager `pnpm`. |
| `git diff --check` | Passed, exit 0. No whitespace errors reported. |
| `pnpm --silent symphony goal closeout --goal v27-review-revision-loop --markdown` | Passed, exit 0. Closeout reported task evidence complete, main verification complete, release ready `no`, release ready source `missing`, missing evidence `none`, and release gate gaps still unknown or missing. |

## Closeout Gaps Observed

`goal closeout` reported:

- Missing evidence: none
- Release ready: no
- Release ready source: missing
- Release gate gaps:
  - `pnpmCheck`: unknown
  - `pnpmTest`: unknown
  - `workbenchBuild`: unknown
  - `mutationGate`: unknown
  - `auditHigh`: unknown
  - `diffCheck`: unknown
  - `mcasDoctor`: unknown
  - `docsUpdated`: unknown
  - `tagEvidence`: missing

The closeout gaps are managed-goal registration gaps. They do not reflect failing release verification commands in this run.

## Documentation Evidence

- `docs/workbench-operator-guide.md` documents the v27 Review Workspace, reviewer handoff, controlled review verdict registration, and review -> revision -> verify loop.
- `docs/symphony-product-contracts.md` documents the v27 Review Workspace projection, controlled review verdict registration, and revision routing through `goal-next-action.v1` and `goal-prompt-pack.v1`.
- `fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json` exists and names `v27-review-revision-loop`.
- Task evidence files exist for task-1 through task-5 worker, review, and main verification evidence.
- This release evidence file records command evidence, closeout gaps, boundary notes, gate recommendations, and tag/release recommendation.

## Gate Recommendations For Controller

Use dry-run plus confirm for each managed gate event. Do not auto-register from this file.

- `release.pnpm-check`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm check`, exit 0.
- `release.pnpm-test`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm test`, exit 0.
- `release.workbench-build`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm workbench:build`, exit 0.
- `release.mutation-gate`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm test:mutation:gate`, exit 0, mutation score 74.27 >= threshold 60.
- `release.audit-high`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm audit --audit-level high`, exit 0.
- `release.diff-check`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `git diff --check`, exit 0.
- `release.mcas-doctor`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`, command `pnpm mcas doctor`, exit 0, status `ok`.
- `release.docs-updated`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`; v27 docs and task evidence are present and referenced above.
- `release.tag-evidence`: recommend `passed`, evidence `docs/plans/v27-release-evidence-2026-05-29.md`; no tag was pushed, and the tag recommendation below records the required release basis.

## Tag And Release Recommendation

Release verification commands passed on the current v27 worktree fallback basis. The controller should register the release gates with dry-run plus confirm, then declare `release.ready` only after those gate events are present in the managed goal journal.

Do not tag or push from this dirty fallback checkout. After the controller registers gates and the release changes are committed or integrated to the intended release ref, tag `v27 Review Revision Loop` from that verified release ref and keep this evidence file as the tag evidence reference.

Release recommendation: `READY_FOR_GATE_REGISTRATION`.

## Blockers

No product, test, build, mutation threshold, audit-high, doctor, diff, or closeout command failure blocked release verification.

The only blocker was the checkout/pull boundary caused by the dirty worktree. The fallback verification path supersedes that blocker for deciding whether the controller can register release gates.
