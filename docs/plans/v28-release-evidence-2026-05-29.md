# v28 Release Evidence

Date recorded: 2026-06-01 Asia/Shanghai
Goal id: `v28-workbench-v1-release`
Release name: `v28 Workbench v1 Release`
Evidence path: `docs/plans/v28-release-evidence-2026-05-29.md`

## Release Basis

- Repository path used: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Required main checkout command: `git checkout main`
- Main checkout result: exit 128. Output: `fatal: 'main' is already used by worktree at '/private/tmp/v24-task-3-mainverify-main'`.
- Required pull command: `git pull --ff-only`
- Pull result: exit 1. Output: current branch `v27-task-5-review-revision-tests-docs` has no tracking information.
- Fallback used: current repo-local checkout.
- Fallback branch: `v27-task-5-review-revision-tests-docs`
- Fallback commit: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Local `main` commit observed: `ab714716e85d13c71c5643036292ede0594c48a6`
- Worktree boundary: the release validation ran from the dirty current checkout because `main` is already attached to another linked worktree. No checkout, merge, push, tag, or release publication was performed.
- Product boundary: Workbench mainline is based on the latest goal/runbook/next-action flow, not a v8 action dashboard.

## Command Results

### `git checkout main`

Result: exit 128.

```text
fatal: 'main' is already used by worktree at '/private/tmp/v24-task-3-mainverify-main'
```

### `git pull --ff-only`

Result: exit 1.

```text
There is no tracking information for the current branch.
Please specify which branch you want to merge with.
```

The release-manager fallback kept the existing checkout and continued validation without crossing the linked-worktree boundary.

### `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit 0.

```text
tests 734
suites 115
pass 734
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7205.862291
```

### `pnpm workbench:build`

Result: exit 0.

```text
vite v8.0.14 building client environment for production...
transforming... 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB | gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB | gzip: 160.11 kB
built in 55ms
```

### `pnpm test:mutation:gate`

Result: exit 0.

```text
All files mutation score: 74.22
Covered mutation score: 78.37
Killed: 1762
Timeout: 6
Survived: 488
No coverage: 126
Errors: 0
Final mutation score of 74.22 is greater than or equal to break threshold 60
Done in 46 minutes and 18 seconds.
```

### `pnpm audit --audit-level high`

Result: exit 0.

```text
1 vulnerabilities found
Severity: 1 moderate
```

The high-severity gate passes because the audit command exited 0 at `--audit-level high`; the remaining finding is moderate.

### `git diff --check`

Result: exit 0.

```text
<no output>
```

### `pnpm mcas doctor`

Result: exit 0.

```json
{
  "version": "1",
  "status": "ok",
  "nodeVersion": "24.14.0",
  "packageManager": "pnpm",
  "commands": [
    "doctor",
    "intake",
    "github issue",
    "harness run-taskpacket",
    "queue manual",
    "run-next",
    "run-task",
    "smoke",
    "eval replay"
  ]
}
```

### `pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --markdown`

Result: exit 0.

```text
Goal: v28-workbench-v1-release
Tasks: 5
Worker evidence complete: yes
Review evidence complete: yes
Main verification complete: yes
Release ready: no
Release ready source: missing

Missing Evidence
- none

Release Gate Gaps
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown
- tagEvidence: missing
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Result: exit 0.

```text
totalTasks: 5
completedTasks: 5
blockedTasks: 0
needsReviewTasks: 0
needsRevisionTasks: 0
releaseReady: false
releaseReadySource: null
releaseGates:
  pnpmCheck: unknown
  pnpmTest: unknown
  workbenchBuild: unknown
  mutationGate: unknown
  auditHigh: unknown
  diffCheck: unknown
  mcasDoctor: unknown
  docsUpdated: unknown
  tagEvidence: unknown
```

## Documentation And Tag Evidence

- README now presents Workbench v1 as the daily operator entry and keeps `symphony` CLI as the advanced/script and compatibility surface.
- `docs/workbench-operator-guide.md` documents the Workbench v1 path: active goal, next action, prompt handoff, event registration, review/revision, main verification, and closeout/release.
- The operator guide states that final release readiness requires explicit `symphony goal gate --gate release.ready --status declared` dry-run and confirm; Workbench must not infer release-ready from branch, file name, command text, or prompt text.
- This file is the v28 tag evidence prompt. It records the fallback commit, the validation commands, closeout gaps before gate registration, and the tag recommendation.

Tag recommendation: after the parent registers the release gates and declares `release.ready`, do not create a Git tag from fallback commit `7bc15cf4a303e2f81f85db21ee4f899921c89a92` unless the v28 release changes are committed there. The repository tag should point at the final committed release candidate that contains the v28 Workbench v1 changes. No automatic tag was created.

## Closeout Gaps

Current closeout gaps before parent gate registration:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.mutation-gate`
- `release.audit-high`
- `release.diff-check`
- `release.mcas-doctor`
- `release.docs-updated`
- `release.tag-evidence`
- `release.ready`

Release command blockers: none. The remaining gaps are managed-goal event registrations for gates already validated in this evidence.

## Release Gate Recommendation

- `release.pnpm-check`: pass. `pnpm check` exited 0.
- `release.pnpm-test`: pass. `pnpm test` exited 0 with 734 passing tests.
- `release.workbench-build`: pass. `pnpm workbench:build` exited 0 and rebuilt Workbench static assets.
- `release.mutation-gate`: pass. `pnpm test:mutation:gate` exited 0 with mutation score 74.22, above threshold 60.
- `release.audit-high`: pass. `pnpm audit --audit-level high` exited 0; the only reported vulnerability is moderate.
- `release.diff-check`: pass. `git diff --check` exited 0 with no output.
- `release.mcas-doctor`: pass. `pnpm mcas doctor` exited 0 with status `ok`.
- `release.docs-updated`: pass. README and operator guide describe Workbench v1 as the daily entry, CLI as advanced/script entry, and release-ready as explicit gate registration.
- `release.tag-evidence`: pass. This release evidence file records the tag recommendation and states that no automatic tag was created.

## Release Decision

Verdict: `release-ready`

The parent should register the release gates above through dry-run plus confirm. After those gate events are appended, the parent should declare `release.ready` with:

```bash
pnpm --silent symphony goal gate --goal v28-workbench-v1-release --gate release.ready --status declared --verifier codex-v28-release-manager --evidence-ref docs/plans/v28-release-evidence-2026-05-29.md
```
