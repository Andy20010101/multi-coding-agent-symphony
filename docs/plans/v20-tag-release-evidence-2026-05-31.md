# v20 tag release evidence

Date: 2026-05-31, Asia/Shanghai  
Goal: `v20-goal-workbench-active-goal-surface`  
Release name: `v20 Workbench Active Goal Surface`  
Repository: `/Users/andy/Documents/project/multi-coding-agent-symphony`  
Remote: `https://github.com/Andy20010101/multi-coding-agent-symphony.git`  
Role: release-manager only. No product code was implemented or reviewed in this pass.

## Decision

`release.tag-evidence` can be registered as PASSED.

The original `HEAD` was `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`, which only contained v19 evidence. Tagging that commit as `v20` would have been invalid because the v20 payload was still dirty and untracked in the working tree.

The release-manager action taken here was to package the already-present v20 payload into a release commit, push `main`, create an annotated `v20` tag on that commit, push the tag, and verify the local and remote tag object and peeled commit.

## State before packaging

Required checks before tag creation:

| Command | Result |
| --- | --- |
| `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` | Exit `0`; `completedTasks: 5`; all tasks `main-verified`; release gates passed except `tagEvidence: failed`; `releaseReady: false`; `releaseReadySource: null`. |
| `pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json` | Exit `0`; worker, review, and main verification evidence complete; missing only `release.tag-evidence`; `releaseReady: false`. |
| `git status --short` | Dirty v20 implementation, docs, fixtures, Workbench static bundle, runbook pack, and evidence files were present. |
| `git rev-parse HEAD` | `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`. |
| `git tag --list 'v20'` | Exit `0`; no output. |
| `git ls-remote --tags origin 'refs/tags/v20'` | Exit `0`; no output. |
| `git ls-remote origin refs/heads/main refs/tags/v20 'refs/tags/v20^{}'` | Exit `0`; remote `main` was `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`; no `v20` tag output. |

The existing closeout evidence was `docs/plans/v20-closeout-evidence-2026-05-31.md`. It recorded all release gates passed except tag evidence.

## Release verification rerun before packaging

These checks were rerun against the dirty v20 payload before staging and committing:

| Command | Result |
| --- | --- |
| `pnpm check` | Exit `0`. |
| `pnpm test` | Exit `0`; `tests 670`, `pass 670`, `fail 0`, `duration_ms 3812.653875`. |
| `pnpm workbench:build` | Exit `0`; Vite built `src/symphony/workbench-static/index.html`, `assets/index-DGOQN4eH.css`, and `assets/index-7IvGgo-R.js`. |
| `pnpm audit --audit-level high` | Exit `0`; output reported `1 vulnerabilities found`, `Severity: 1 moderate`; no high-severity vulnerability. |
| `pnpm --silent mcas doctor --json` | Exit `0`; `status: ok`; Node `24.14.0`; package manager `pnpm`. |
| `git diff --check` | Exit `0`; no output. |

The full mutation gate was not rerun in this tag-evidence pass. The managed goal status already reports `mutationGate: passed`, and this pass was scoped to the remaining `release.tag-evidence` blocker.

## Packaging commit

Rationale for committing: the v20 changes were present in the working tree but not in `HEAD`. A `v20` tag had to point to a commit that includes the v20 payload. No local or remote `v20` tag existed, and remote `main` still matched local base before the release commit.

Command:

```bash
git add -A
git -c user.name='Andy' -c user.email='andy@AndydeMacBook-Air.local' commit -m "Release v20 workbench active goal surface"
```

Commit result:

- Commit: `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6`
- Subject: `Release v20 workbench active goal surface`
- Summary: `54 files changed, 33325 insertions(+), 141 deletions(-)`

Staged and committed paths:

```text
A  docs/plans/v20-closeout-evidence-2026-05-31.md
A  docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md
A  docs/plans/v20-task-1-review-evidence-2026-05-31.md
A  docs/plans/v20-task-1-worker-evidence-2026-05-29.md
A  docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md
A  docs/plans/v20-task-2-review-evidence-2026-05-31.md
A  docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
A  docs/plans/v20-task-2-worker-evidence-2026-05-31.md
A  docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
A  docs/plans/v20-task-3-main-verification-evidence-2026-05-31.md
A  docs/plans/v20-task-3-review-evidence-2026-05-31.md
A  docs/plans/v20-task-3-worker-evidence-2026-05-31.md
A  docs/plans/v20-task-4-main-verification-evidence-2026-05-31.md
A  docs/plans/v20-task-4-review-evidence-2026-05-31.md
A  docs/plans/v20-task-4-worker-evidence-2026-05-31.md
A  docs/plans/v20-task-5-main-verification-evidence-2026-05-31.md
A  docs/plans/v20-task-5-review-evidence-2026-05-31.md
A  docs/plans/v20-task-5-worker-evidence-2026-05-31.md
A  docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
A  docs/plans/workbench-v20-v28-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A  docs/plans/workbench-v20-v28-goal-runbooks/README.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v20_workbench-active-goal-surface_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v23_goal-operation-run-console_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v24_main-verification-workbench_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v25_controlled-implementation-lane_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v26_verified-adoption-workbench_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md
A  docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md
M  docs/release-checklist.md
M  docs/symphony-product-contracts.md
M  docs/workbench-operator-guide.md
M  fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json
M  fixtures/contracts/goal-closeout-report.valid.v1.json
A  fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
M  frontend/workbench/index.html
M  frontend/workbench/src/App.jsx
M  frontend/workbench/src/api/contracts.js
M  frontend/workbench/src/styles/workbench.css
M  src/symphony/console.js
M  src/symphony/goal-closeout-report.js
M  src/symphony/goal-progress-ledger.js
M  src/symphony/goal-runbook-contracts.js
R  src/symphony/workbench-static/assets/index-Duy8jdh2.js -> src/symphony/workbench-static/assets/index-7IvGgo-R.js
R  src/symphony/workbench-static/assets/index-D3K9Dk14.css -> src/symphony/workbench-static/assets/index-DGOQN4eH.css
M  src/symphony/workbench-static/index.html
M  tests/v18-console-events-api.test.js
M  tests/v19-goal-next-cli.test.js
M  tests/v19-goal-runbook-contracts.test.js
M  tests/v19-goal-template.test.js
M  tests/workbench-api-client.test.js
M  tests/workbench-route-smoke.test.js
M  tests/workbench-shell.test.js
```

Publish command:

```bash
git push origin main
```

Result:

```text
To https://github.com/Andy20010101/multi-coding-agent-symphony.git
   a5778f2..fb970ac  main -> main
```

Remote main verification after push:

```text
git ls-remote origin refs/heads/main
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6	refs/heads/main
```

## Tag creation

Pre-tag checks after the release commit and `main` push:

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## main...origin/main` |
| `git tag --list 'v20'` | Exit `0`; no output. |
| `git ls-remote origin refs/heads/main refs/tags/v20 'refs/tags/v20^{}'` | Remote `main` was `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6`; no remote `v20` tag output. |

Tag command:

```bash
git -c user.name='Andy' -c user.email='andy@AndydeMacBook-Air.local' tag -a v20 -m "v20 Workbench Active Goal Surface release"
```

Local tag verification:

| Command | Result |
| --- | --- |
| `git tag --list 'v20'` | `v20` |
| `git rev-parse v20^{tag}` | `01b899e01e61fd18655950aa25fa987d6fe0a13d` |
| `git rev-parse v20^{}` | `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6` |
| `git rev-list -n 1 v20` | `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6` |

Tag push command:

```bash
git push origin v20
```

Result:

```text
To https://github.com/Andy20010101/multi-coding-agent-symphony.git
 * [new tag]         v20 -> v20
```

Remote tag verification:

| Command | Result |
| --- | --- |
| `git ls-remote --tags origin 'refs/tags/v20'` | `01b899e01e61fd18655950aa25fa987d6fe0a13d	refs/tags/v20` |
| `git ls-remote --tags origin 'refs/tags/v20^{}'` | `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6	refs/tags/v20^{}` |

`git show --no-patch --pretty=fuller v20` reported:

- Tagger: `Andy <andy@AndydeMacBook-Air.local>`
- TaggerDate: `Sun May 31 05:23:08 2026 +0800`
- Tag message: `v20 Workbench Active Goal Surface release`
- Commit: `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6`
- Commit subject: `Release v20 workbench active goal surface`

## Managed goal state after tag verification

`pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` still reports:

- `completedTasks: 5`
- all tasks `main-verified`
- `pnpmCheck: passed`
- `pnpmTest: passed`
- `workbenchBuild: passed`
- `mutationGate: passed`
- `auditHigh: passed`
- `diffCheck: passed`
- `mcasDoctor: passed`
- `docsUpdated: passed`
- `tagEvidence: failed`
- `releaseReady: false`
- `releaseReadySource: null`

`pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json` still reports the only missing item as:

```json
{
  "kind": "release-gate",
  "expectedEvent": "release.gate-passed",
  "gate": "release.tag-evidence",
  "gateId": "tagEvidence",
  "status": "failed"
}
```

This is expected because this release-manager pass did not register a goal gate event.

## Recommendation

Register `release.tag-evidence` as PASSED using this evidence file:

```bash
pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate release.tag-evidence \
  --status passed \
  --verifier codex-v20-release-manager \
  --evidence-ref docs/plans/v20-tag-release-evidence-2026-05-31.md \
  --dry-run --json
```

After the parent registers `release.tag-evidence`, rerun closeout. If the closeout report has no missing items, parent should declare `release.ready` with explicit `release.ready` gate evidence.

## Notes

- No existing tag was moved.
- No force push was used.
- No GitHub release was created in this pass.
- The `v20` tag points at the release payload commit `fb970ac0a9b751c65525b54f46d1cadb8c2cbda6`.
- This evidence file is written after tag creation and is not included in the `v20` tag, matching the repository's v19 tag evidence pattern.
