# v28 task-5 worker evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-5`

## Branch / fallback checkout

Ideal branch from runbook: `v28-task-5-readme-operator-guide-release-evidence`

Actual checkout used: `v27-task-5-review-revision-tests-docs`

Fallback reason: the checkout was already dirty at task start and was not on the ideal task branch. Per boundary-first instruction, this worker used the current checkout and did not roll back or overwrite existing dirty changes.

## User-visible value

项目定位正式从 dashboard 变成 Workbench。

## Implementation summary

- Updated `README.md` so Workbench v1 is the daily operator entry point.
- Described the `symphony` CLI as the advanced/script entry point for JSON output, checks, dry-run/confirm registration, diagnostics, and compatibility commands.
- Updated `docs/workbench-operator-guide.md` so the operator path follows active goal, next action, prompt handoff, event registration, review/revision, main verification, and closeout/release.
- Kept the v8 `scan/do/review/verify/status/continue/artifacts` surface as compatibility/script commands, not the Workbench v1 top-level action list.
- Initial worker pass wrote worker evidence only. The revision pass added the release evidence draft named by the runbook and still does not declare `release.ready`.

## Files changed

Files intentionally changed for this task:

- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v28-release-evidence-2026-05-29.md`
- `docs/plans/v28-task-5-worker-evidence-2026-05-29.md`

Boundary note: `docs/workbench-operator-guide.md` was already modified when this worker started. Other dirty files in the checkout are outside this task's intentional change set.

## Revision summary

Reviewer blocker fixed: created `docs/plans/v28-release-evidence-2026-05-29.md`, the release evidence artifact named by the v28 runbook.

The new release evidence is a task-5 revision draft. It records the goal id, release name, current checkout/fallback boundary, command results rerun during this revision, current goal-status output, current closeout gaps, and the boundary that the final release-manager owns final gates and any `release.ready` declaration.

This revision did not change README, the operator guide, implementation code, managed goal state, release gates, tags, merges, or approval status.

## Command results

### `pnpm check`

Result: exit 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

First run result: exit 1

Reason: README no longer contained the existing required boundary phrase `Workbench execution`.

```text
✖ failing tests:

test at tests/v18-docs-release-evidence.test.js:97:3
✖ keeps the README, Workbench guide, and contract index aligned to the v18 surface (1.244542ms)
  AssertionError [ERR_ASSERTION]: README should mention Workbench execution
```

Fix applied: restored the boundary phrase in README as part of the sentence listing unavailable Workbench capabilities.

Final post-evidence run result: exit 0

```text
ℹ tests 734
ℹ suites 115
ℹ pass 734
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6744.616334
```

### `pnpm workbench:build`

Result: exit 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB

✓ built in 50ms
```

### `git diff --check`

Result: exit 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Result: exit 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v28-workbench-v1-release",
  "goalTitle": "v28 Workbench v1 Release",
  "generatedAt": "2026-05-31T22:34:40.853Z",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 4,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task-5": {
    "title": "README/operator guide/release evidence",
    "status": "planned",
    "statusSource": "goal-runbook.v1",
    "workerEvidenceRef": null,
    "reviewEvidenceRef": null,
    "reviewVerdict": null,
    "mainVerificationRef": null
  },
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-5",
      "command": "pnpm check"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

## Revision command results

### `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit 0.

```text
ℹ tests 734
ℹ suites 115
ℹ pass 734
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6851.7975
```

### `pnpm workbench:build`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB

✓ built in 56ms
```

### `git diff --check`

Result: exit 0.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Result: exit 0.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v28-workbench-v1-release",
  "goalTitle": "v28 Workbench v1 Release",
  "generatedAt": "2026-05-31T22:39:35.812Z",
  "baseline": {
    "tag": "v27",
    "commit": null,
    "evidenceRef": "docs/plans/v27-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 4,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 1,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Workbench app navigation and state header",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_29fef4e4117fb95c",
      "branch": "v28-task-1-workbench-app-navigation-and-state-header",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Unified goal/task/run/evidence routes",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_bfcbc9d62e69863d",
      "branch": "v28-task-2-unified-goal-task-run-evidence-routes",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v28-task-2-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Golden path E2E",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_065a0bcc91e4f64d",
      "branch": "v28-task-3-golden-path-e2e",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v28-task-3-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Release closeout workspace",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_8b264f3782d72d7b",
      "branch": "v28-task-4-release-closeout-workspace",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-4-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-4-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v28-task-4-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-5",
      "title": "README/operator guide/release evidence",
      "status": "needs-revision",
      "statusSource": "goal-event-log.v1:evt_b53d8a259c4aaa34",
      "branch": "v28-task-5-readme-operator-guide-release-evidence",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-5-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-5-review-evidence-2026-05-29.md",
      "reviewVerdict": "NEEDS_REVISION",
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "blockers": [],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-5",
      "command": "pnpm check"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

### `pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --markdown`

Result: exit 0.

```text
# Goal Closeout

- Goal: `v28-workbench-v1-release`
- Tasks: 5
- Worker evidence complete: yes
- Review evidence complete: no
- Main verification complete: no
- Release ready: no
- Release ready source: missing

## Missing Evidence
- review-evidence: task-5 expects reviewer.approved
- main-verification: task-5 expects main.verification-passed

## Release Gate Gaps
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown
- tagEvidence: missing

## Release Gates
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown
- tagEvidence: missing

Next: `symphony goal next --goal v28-workbench-v1-release`
```

## Boundary notes

- Did not register worker, reviewer, main verification, or release events.
- Did not self-approve.
- Did not declare main verified.
- Did not declare release ready.
- Did not tag, merge, push, or register `release.ready`.
- Did not claim closeout gaps are none.
- Did not add a safety framework, permission system, generic shell runner, or generic goal framework.
- Did not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench v1 top-level action list.
- Did not infer task approval or release readiness from filenames, branches, commits, frontend state, or passing commands.

## Reviewer handoff checklist

- Review README positioning: Workbench v1 should read as the daily operator entry point.
- Review CLI positioning: `symphony` should read as advanced/script and compatibility surface.
- Review operator guide: the flow should follow latest goal/runbook/next-action spine, not the old v8 action dashboard.
- Confirm evidence is worker evidence only and does not claim reviewer approval, main verification, or release readiness.
- Re-run acceptance commands from this file before approving.

## Revision after failed main verification

Role boundary: worker revision subagent after main-verification failed. This revision did not approve itself, did not register reviewer/main/release events, did not declare main verification passed, and did not declare release readiness.

Main verification failed because the required command sequence did not complete. The interrupted command from `docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md` was:

```sh
pnpm test:mutation:gate
```

Last observed progress from the failed main-verification evidence:

```text
Mutation testing 77% (elapsed: ~44m, remaining: ~12m) 1804/2382 tested (405 survived, 6 timed out)
```

Investigation result: this is a long-running release command boundary, not a task-5 product or documentation defect. `package.json` maps `test:mutation:gate` directly to `stryker run`. `stryker.config.mjs` mutates the same six source files, uses `concurrency: 2`, `timeoutMS: 30000`, and `thresholds.break: 60`. Prior release evidence in this repository records the same 2382-mutant gate completing successfully with a final mutation score above the break threshold while still having survivors and 6 timed out mutants. The failed main-verification evidence also shows the gate was still progressing when it was interrupted, not that it had produced a failing exit code or invalid final score.

Boundary-safe next action: do not invent a task-5 code or documentation change. Task-5 implementation artifacts remain unchanged in this revision. Main verification must be rerun with an uninterrupted window for the full mutation gate before later release commands and any gate registration can proceed.

Files changed in this revision:

- `docs/plans/v28-task-5-worker-evidence-2026-05-29.md`

Task-5 implementation artifacts unchanged in this revision:

- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v28-release-evidence-2026-05-29.md`

### Revision check: `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### Revision check: `pnpm test`

Result: exit 0.

```text
tests 734
suites 115
pass 734
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7191.044334
```

### Revision check: `pnpm workbench:build`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB

✓ built in 51ms
```

### Revision check: `git diff --check`

Result: exit 0.

```text
<no output>
```

### Revision check: `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Result: exit 0.

Relevant result:

```json
{
  "summary": {
    "totalTasks": 5,
    "completedTasks": 4,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task-5": {
    "status": "unknown",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": "docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md"
  },
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  }
}
```

### Main-verifier handoff

- Rerun main verification from the start with an uninterrupted `pnpm test:mutation:gate` window.
- Do not treat the interrupted mutation gate as passed; it produced no final Stryker score or passing exit code.
- After a completed mutation gate, continue with the remaining required release commands in the main-verification sequence.
- This worker revision did not register events or change release gate state.
