# v32 release evidence

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Evidence path: `docs/plans/v32-release-evidence-2026-06-01.md`

Release manager verdict: `blocked-on-tag-evidence`. The mutation gate is registered passed. `release.tag-evidence` remains blocked because the current validation basis is a dirty non-main checkout and no clean v32 release target commit/ref is recorded. This recovery audit does not supersede failed tag-evidence event `evt_5ad498f2df4b4976`.

## Current release closeout status

`pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` exited `0` and returned `goal-progress-ledger.v1`. It reported `totalTasks: 5`, `completedTasks: 5`, `blockedTasks: 0`, `releaseReady: false`, and `releaseReadySource: null`. Current release gate state from the ledger:

- `release.pnpm-check`: `passed`
- `release.pnpm-test`: `passed`
- `release.workbench-build`: `passed`
- `release.mutation-gate`: `passed`
- `release.audit-high`: `passed`
- `release.diff-check`: `passed`
- `release.mcas-doctor`: `passed`
- `release.docs-updated`: `passed`
- `release.tag-evidence`: `failed`

`pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --json` exited `0` and returned `goal-closeout-report.v1`. It reported `workerEvidenceComplete: true`, `reviewEvidenceComplete: true`, `mainVerificationComplete: true`, `releaseReady: false`, and one missing release gate:

- `release.tag-evidence`, status `failed`

`pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` exited `0` and returned task `release`, role `release-manager`, phase `release-gate`, reason `release.tag-evidence is not passed in goal-progress-ledger.v1.`

## Task evidence completeness

Managed event log checked: `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson`.

| Task | Worker evidence event | Review evidence event | Main verification gate event |
| --- | --- | --- | --- |
| `task-1` | `evt_ccd571df76a98a06`, `docs/plans/v32-task-1-worker-evidence-2026-06-01.md` | `evt_3931b8825ce24556`, `docs/plans/v32-task-1-review-evidence-2026-06-01.md`, verdict `APPROVED` | `evt_c2652f3720d6053a`, `docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md`, status `passed` |
| `task-2` | `evt_e019a92eb5d9a721`, `docs/plans/v32-task-2-worker-evidence-2026-06-01.md` | `evt_cd61d10b4c8c0286`, `docs/plans/v32-task-2-review-evidence-2026-06-01.md`, verdict `APPROVED` | `evt_9ec0b67b0b9ca935`, `docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md`, status `passed` |
| `task-3` | `evt_d3c00ed58f954bc3`, `docs/plans/v32-task-3-worker-evidence-2026-06-01.md` | `evt_0b7b7ea493f72d25`, `docs/plans/v32-task-3-review-evidence-2026-06-01.md`, verdict `APPROVED` | `evt_5cb463288ee26ab9`, `docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md`, status `passed` |
| `task-4` | `evt_57b3ac130d866ca0`, `docs/plans/v32-task-4-worker-evidence-2026-06-01.md` | `evt_cb15c3eeee25b199`, `docs/plans/v32-task-4-review-evidence-2026-06-01.md`, verdict `APPROVED` | `evt_09dac99777fb2b2f`, `docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md`, status `passed` |
| `task-5` | `evt_5348de3bd739bed8`, `docs/plans/v32-task-5-worker-evidence-2026-06-01.md` | `evt_8e42a026093f6e2f`, `docs/plans/v32-task-5-review-evidence-2026-06-01.md`, verdict `APPROVED` | `evt_43eaea641d116739`, `docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md`, status `passed` |

Reviewer actors differ from worker actors for each task. Main verification was recorded through explicit `symphony goal gate --gate main-verification` events before this release-manager pass. This pass did not register goal events, release gates, or `release.ready`.

## Validation commands

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `git status -sb` | 0 | Dirty checkout on `v30-task-3-adoption-inspect-and-recovery-view`; modified, deleted, and untracked v29-v32 docs/source/tests/static files are present. |
| `pnpm check` | 0 | Node syntax check completed for source, adapters, ensemble, integrations, intake, symphony, trackers, scripts, plugin eval replay, and tests. |
| `pnpm test` | 0 | Node test runner passed: `759` tests, `116` suites, `759` pass, `0` fail. |
| `pnpm workbench:build` | 0 | Vite built Workbench static output under `src/symphony/workbench-static/`; output included `index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-BDjDodcJ.js`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm test:mutation:gate` | 0 | Stryker completed in `73 minutes and 3 seconds`. Final mutation score `74.22`; covered score `78.37`; break threshold `60`; killed `1762`; survived `488`; timed out `6`; no errors. Final report basis: Stryker summary table for all files and `Final mutation score of 74.22 is greater than or equal to break threshold 60`. This supersedes the earlier interrupted exit `130` blocker. |
| `pnpm audit --audit-level high` | 0 | Audit passed at high threshold. Output reported `1` moderate vulnerability and no high-or-critical failure. |
| `pnpm mcas doctor` | 0 | Doctor returned JSON status `ok`, node version `24.14.0`, package manager `pnpm`. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | `goal-progress-ledger.v1`; all tasks main-verified; `releaseReady: false`; `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.mutation-gate`, `release.audit-high`, `release.diff-check`, `release.mcas-doctor`, and `release.docs-updated` are passed; `release.tag-evidence` is failed. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Next action is release-manager release-gate; first missing gate is `release.tag-evidence`. |
| `pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --json` | 0 | Task evidence complete; only missing release gate is `release.tag-evidence`, status `failed`; `releaseReady: false`. |
| `git tag --list 'v32*'` | 0 | No local `v32*` tag was listed. |
| `git log -1 --format=%H%n%D%n%s HEAD` | 0 | Current checkout HEAD is `07765f3b12023b83774e832d3c002384c82ddede`, subject `Add v29-v32 workbench runbooks`. |
| `git log -1 --format=%H%n%D%n%s main` | 0 | `main` points to `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`, also `origin/main`, subject `Fix v28 docs release wording`. |
| `git log -1 --format=%H%n%D%n%s origin/main` | 0 | `origin/main` points to `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`, subject `Fix v28 docs release wording`. |
| `kill 37597 || true; ps -p 37597,6813,6832,6833 -o pid,ppid,stat,command` | 0 | Canceled waiting shell PID `37597` so it could not launch a second mutation run. Active Stryker PID `6813` and worker PIDs `6832`, `6833` remained running at that check. |

## Release gate recommendations

| Gate | Recommendation | Command or evidence basis | Evidence ref |
| --- | --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited `0`. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.pnpm-test` | `passed` | `pnpm test` exited `0` with `759` passing tests. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited `0` and produced Workbench static assets. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.mutation-gate` | `passed` | `pnpm test:mutation:gate` exited `0`; Stryker final mutation score `74.22` is greater than or equal to break threshold `60`. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.audit-high` | `passed` | `pnpm audit --audit-level high` exited `0`; only a moderate advisory was reported. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.diff-check` | `passed` | `git diff --check` exited `0`. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.mcas-doctor` | `passed` | `pnpm mcas doctor` exited `0` and returned status `ok`. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.docs-updated` | `passed` | Checked `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`, `docs/release-checklist.md`, the v32 plan/runbook, this release evidence file, and all v32 task worker/review/main-verification evidence files. | `docs/plans/v32-release-evidence-2026-06-01.md` |
| `release.tag-evidence` | `blocked` | A bounded tag command draft is recorded below, but it does not satisfy the gate because there is no concrete clean v32 release target commit/ref. Task-1 requires clean main/ref for final release judgment; this validation used a dirty non-main checkout. | `docs/plans/v32-release-evidence-2026-06-01.md` |

## Tag evidence

Current checkout basis:

- Current branch: `v30-task-3-adoption-inspect-and-recovery-view`.
- Current HEAD: `07765f3b12023b83774e832d3c002384c82ddede`.
- `main`: `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`.
- `origin/main`: `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`.
- Merge-base of `main` and `HEAD`: `bacf1d846ee71fb8d5e60e5e5fc32b104ac4531b`.
- Worktree: dirty, with modified, deleted, and untracked files.
- `git tag --list 'v32*'`: exit `0`, no local `v32*` tag listed.

Fallback tag evidence recommendation: `blocked`. The fallback evidence documents exact refs, dirty/non-main boundary, no existing local v32 tag, and a copy-only tag command shape. It does not satisfy `release.tag-evidence` because `<CLEAN_V32_RELEASE_COMMIT>` is not a concrete clean v32 release target. Task-1 requires clean main/ref for final release judgment, and the observed current checkout is dirty, non-main, and different from `main` and `origin/main`.

Copy-only tag command shape after the coordinator confirms the target release commit:

```bash
git tag -a v32 <CLEAN_V32_RELEASE_COMMIT> -m "v32 Release Manager Workspace v2"
```

## Boundary-first tag-evidence recovery audit

Audit result: `blocked`. No bounded fallback path satisfies both constraints:

- Boundary-first recovery can inspect repo-local/current-checkout/readable-worktree evidence without checkout, merge, pull, clean, stash, reset, revert, tag, push, or publish.
- v32 task-1 and the runbook require clean main/ref for final release judgment. Dirty or non-main fallback state must stop at guidance only.

Authoritative current state:

- Goal ledger has all five tasks main-verified and release gates passed for `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.mutation-gate`, `release.audit-high`, `release.diff-check`, `release.mcas-doctor`, and `release.docs-updated`.
- `release.tag-evidence` latest gate state is `failed`, event `evt_5ad498f2df4b4976`.
- `goal next` and `goal closeout` report only `release.tag-evidence` as missing or not passed.
- `releaseReady` remains `false`.

Read-only recovery commands:

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | `mutationGate: "passed"`, `tagEvidence: "failed"`, `releaseReady: false`, `completedTasks: 5`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Next action reason: `release.tag-evidence is not passed in goal-progress-ledger.v1.` |
| `pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --json` | 0 | Missing only `release.tag-evidence`, status `failed`; `releaseReady: false`. |
| `rg -n "evt_5ad498f2df4b4976\|release\.tag-evidence\|release\.mutation-gate\|release\.ready" .symphony/goals/events/v32-release-manager-workspace-v2.ndjson` | 0 | Event `evt_87b2a0edf28f5641` registers `release.mutation-gate` passed; event `evt_5ad498f2df4b4976` registers `release.tag-evidence` failed. |
| `git status --short --branch` | 0 | Current worktree is on `v30-task-3-adoption-inspect-and-recovery-view` with modified, deleted, and untracked files. |
| `git rev-parse HEAD main origin/main && git merge-base HEAD main && git merge-base HEAD origin/main` | 0 | `HEAD` is `07765f3b12023b83774e832d3c002384c82ddede`; `main` and `origin/main` are `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`; both merge-bases are `bacf1d846ee71fb8d5e60e5e5fc32b104ac4531b`. |
| `git diff --name-status HEAD --` | 0 | Current worktree has modified/deleted tracked files, including Workbench source, generated static assets, docs, and tests. |
| `git diff --cached --name-status` | 0 | No staged diff output. |
| `git diff --name-status main...HEAD` | 0 | Current `HEAD` adds v29-v32 runbook and plan files relative to `main`; this is committed branch diff, not a clean release target. |
| `git diff --name-status origin/main...HEAD` | 0 | Same committed diff basis as `main...HEAD`; `main` and `origin/main` match. |
| `git for-each-ref --format='%(refname:short) %(objectname) %(subject)' refs/heads refs/remotes/origin refs/tags \| rg '^(main\|origin/main\|v32\|origin/v32\|v31\|origin/v31)' \|\| true` | 0 | Only `main` and `origin/main` are listed for this pattern; both point to `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`. No v31/v32 branch or tag ref was found by this check. |
| `git tag --list 'v32*'` | 0 | No local `v32*` tag listed. |
| `git ls-tree -r --name-only 07765f3b12023b83774e832d3c002384c82ddede -- docs/plans/v32-release-evidence-2026-06-01.md docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json` | 0 | The committed `HEAD` tree contains `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`; the release evidence and v32 contract are untracked in this checkout, not part of this commit. |
| `git worktree list --porcelain` | 0 | Current workspace is `v30-task-3-adoption-inspect-and-recovery-view` at `07765f3b12023b83774e832d3c002384c82ddede`; a separate readable `main` worktree exists at `/private/tmp/v24-task-3-mainverify-main` with `HEAD 4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`. |
| `git -C /private/tmp/v24-task-3-mainverify-main status --short --branch` | 0 | Clean `main...origin/main` worktree. |
| `git -C /private/tmp/v24-task-3-mainverify-main ls-tree -r --name-only HEAD -- docs/plans/v32-release-evidence-2026-06-01.md docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json` | 0 | No listed v32 release evidence, v32 plan, or v32 runbook contract exists in that clean main tree. |
| `git -C /private/tmp/v24-task-3-mainverify-main merge-base HEAD 07765f3b12023b83774e832d3c002384c82ddede` | 0 | Merge-base is `bacf1d846ee71fb8d5e60e5e5fc32b104ac4531b`, so the clean main worktree is not the same content line as current v32 evidence work. |
| `git for-each-ref --format='%(refname:short) %(objectname) %(subject)' refs/heads refs/remotes/origin \| rg '(^\|/)v32'` | 1 | No v32 local or origin branch ref matched. |

Failed fallback paths:

| Fallback path | Evidence | Result |
| --- | --- | --- |
| Current checkout `HEAD` | Branch `v30-task-3-adoption-inspect-and-recovery-view`, `HEAD 07765f3b12023b83774e832d3c002384c82ddede`, dirty tracked/untracked worktree, no concrete v32 tag target ref. | Blocked. It is repo-local and contains v32 evidence files in the working tree, but task-1 forbids final release judgment from dirty/non-main fallback checkout. |
| Readable clean `main` worktree | `/private/tmp/v24-task-3-mainverify-main`, clean `main...origin/main`, `HEAD 4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`. | Blocked. It is clean, but it does not contain the v32 release evidence, v32 plan, or v32 runbook contract checked by this release-manager pass. It is not a concrete v32 release target. |

Conclusion: no superseding `release.tag-evidence --status passed` event is supported by this audit. The failed event `evt_5ad498f2df4b4976` should remain authoritative until a clean v32 release target commit/ref exists and is recorded in this evidence file.

Command/result fields:

| Command field | Result |
| --- | --- |
| `git tag --list 'v32*'` | Exit `0`; no local `v32*` tag listed. |
| `git tag` | Not run. |
| `git push --tags` | Not run. |
| Release publish command | Not run. |

No tag, tag push, release publish, merge, pull, checkout, stash, reset, clean, stage, commit, or force operation was run by this release-manager pass.

## Docs updated evidence

Docs and evidence files checked:

- `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`
- `docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/release-checklist.md`
- `docs/plans/v32-task-1-worker-evidence-2026-06-01.md` through `docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md`
- `docs/plans/v32-release-evidence-2026-06-01.md`

The docs-updated recommendation is based on file contents reviewed with `sed`, `rg`, event-log evidence, closeout/status outputs, and current repo status. It is not based only on filenames.

## Boundary notes

- The runbook clean path is `git checkout main`, `git pull --ff-only`, `git status -sb`, then release validation on clean main/ref.
- Clean main/ref operations were skipped because `git status -sb` showed a dirty worktree on `v30-task-3-adoption-inspect-and-recovery-view`; switching or pulling risked mixing or overwriting existing work.
- Fallback used: repo-local current checkout validation, explicit goal event log, `goal-status`, `goal next`, `goal closeout`, `git diff --check`, release/tag evidence draft fields, exact git refs, and command outputs listed above.
- The fallback is enough to recommend pass/fail for command-backed release gates. It is not enough to recommend `release.tag-evidence` as passed.
- Current `HEAD` differs from `main` and `origin/main`; `main` and `origin/main` match each other at `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`.
- `pnpm workbench:build` refreshed generated static output in an already dirty checkout.
- A waiting shell PID `37597` that would have launched a second mutation run after PID `6813` completed was canceled. The active Stryker process was not killed.
- This release-manager pass did not modify product implementation.
- This release-manager pass did not run `symphony goal gate`, `symphony goal update`, `symphony goal review`, or any closeout confirm command.
- `pnpm test:mutation:gate` was allowed to complete naturally in the active release-manager session and exited `0`.
- `release.ready` was not declared and should not be dry-run while `release.tag-evidence` remains blocked.

## Recovery steps

For `release.tag-evidence`:

1. Establish a clean `main` or coordinator-approved release ref in a safe workspace.
2. Confirm `git status -sb` is clean on that ref.
3. Confirm the target ref contains the intended v32 release state and the registered release gates include `release.mutation-gate: passed`.
4. Record the exact target commit with `git rev-parse HEAD`, confirm `git tag --list 'v32*'`, and replace `<CLEAN_V32_RELEASE_COMMIT>` with the concrete target commit in the copy-only tag command.
5. Keep tag, push, publish, merge, clean, stash, reset, and revert commands outside the release-manager role unless coordinator explicitly changes the boundary.

## Remaining coordinator dry-run commands

No `release.tag-evidence --status passed` dry-run command is included because the gate is blocked, not passed. No superseding passed tag-evidence event should be registered from this evidence.

No `release.ready` dry-run command is included because `release.tag-evidence` does not have concrete passed evidence.
