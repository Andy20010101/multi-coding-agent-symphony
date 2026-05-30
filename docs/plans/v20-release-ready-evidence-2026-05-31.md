# v20 release-ready evidence

Date: 2026-05-31, Asia/Shanghai  
Goal: `v20-goal-workbench-active-goal-surface`  
Repository: `/Users/andy/Documents/project/multi-coding-agent-symphony`  
Role: release-manager final decision only. No product code was implemented, reviewed, or main-verified in this pass.

## Decision

Recommendation: `DECLARE_READY`.

The managed goal state is ready for the parent to register `release.ready-declared`. The closeout report shows worker evidence, review evidence, and main verification evidence complete for all 5 tasks. The goal status shows all 5 tasks are `main-verified`, and every release gate is `passed`, including `tagEvidence`.

The only remaining closeout item is the expected release-ready event:

```json
{
  "kind": "release-ready",
  "taskId": null,
  "expectedEvent": "release.ready-declared"
}
```

No remaining blocker was found for declaring release readiness.

## Task and gate state

`goal-status` reports:

- `completedTasks: 5`
- `blockedTasks: 0`
- `needsReviewTasks: 0`
- `needsRevisionTasks: 0`
- `releaseReady: false`
- `releaseReadySource: null`

Task evidence in the goal status output:

| Task | Status | Worker evidence | Review evidence | Review verdict | Main verification |
| --- | --- | --- | --- | --- | --- |
| `task-1` | `main-verified` | `docs/plans/v20-task-1-worker-evidence-2026-05-29.md` | `docs/plans/v20-task-1-review-evidence-2026-05-31.md` | `APPROVED` | `docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md` |
| `task-2` | `main-verified` | `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md` | `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md` | `APPROVED` | `docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md` |
| `task-3` | `main-verified` | `docs/plans/v20-task-3-worker-evidence-2026-05-31.md` | `docs/plans/v20-task-3-review-evidence-2026-05-31.md` | `APPROVED` | `docs/plans/v20-task-3-main-verification-evidence-2026-05-31.md` |
| `task-4` | `main-verified` | `docs/plans/v20-task-4-worker-evidence-2026-05-31.md` | `docs/plans/v20-task-4-review-evidence-2026-05-31.md` | `APPROVED` | `docs/plans/v20-task-4-main-verification-evidence-2026-05-31.md` |
| `task-5` | `main-verified` | `docs/plans/v20-task-5-worker-evidence-2026-05-31.md` | `docs/plans/v20-task-5-review-evidence-2026-05-31.md` | `APPROVED` | `docs/plans/v20-task-5-main-verification-evidence-2026-05-31.md` |

Release gates in the goal status and closeout outputs:

| Gate | Status |
| --- | --- |
| `pnpmCheck` | `passed` |
| `pnpmTest` | `passed` |
| `workbenchBuild` | `passed` |
| `mutationGate` | `passed` |
| `auditHigh` | `passed` |
| `diffCheck` | `passed` |
| `mcasDoctor` | `passed` |
| `docsUpdated` | `passed` |
| `tagEvidence` | `passed` |

`goal closeout` reports:

- `workerEvidenceComplete: true`
- `reviewEvidenceComplete: true`
- `mainVerificationComplete: true`
- `releaseReady: false`
- `releaseReadySource: null`
- missing only `release.ready-declared`

`goal next` reports the next action as release-manager release prep with reason: all runbook tasks are main-verified and release gates are passed, but `release.ready-declared` is missing.

## Git, tag, and evidence file state

Before this file was written, `git status --short --branch` returned a clean branch:

```text
## main...origin/main
```

The release payload commit is the peeled `v20` tag target:

```text
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6
```

The current local and remote `main` commit is:

```text
57bd331edc113b8a889a1c529a5d8e4e5bd0012d
```

The current `HEAD` is one commit after the release payload commit. `git log --oneline v20^{}..HEAD` returned:

```text
57bd331 Record v20 tag release evidence
```

That means the `v20` tag points to the release payload commit, while current `HEAD` contains the later tag-evidence commit. The release-ready evidence file created by this pass is not part of the `v20` tag. The existing tag evidence file is present at current `HEAD`:

```text
docs/plans/v20-tag-release-evidence-2026-05-31.md
```

`git ls-tree -r --name-only v20^{} -- docs/plans/v20-release-ready-evidence-2026-05-31.md docs/plans/v20-tag-release-evidence-2026-05-31.md` returned no output. That confirms neither the tag evidence file nor this release-ready evidence file is inside the tagged payload commit.

The local annotated tag object is:

```text
01b899e01e61fd18655950aa25fa987d6fe0a13d
```

The local peeled tag commit is:

```text
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6
```

The remote tag object and peeled commit match the local tag:

```text
01b899e01e61fd18655950aa25fa987d6fe0a13d	refs/tags/v20
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6	refs/tags/v20^{}
```

The annotated tag object contains:

```text
object fb970ac0a9b751c65525b54f46d1cadb8c2cbda6
type commit
tag v20
tagger Andy <andy@AndydeMacBook-Air.local> 1780176188 +0800

v20 Workbench Active Goal Surface release
```

GitHub release verification was run with:

```bash
gh release view v20 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish
```

It exited `1` with:

```text
release not found
```

No GitHub Release object exists for `v20` at the time of this verification. The current closeout and goal-status outputs do not list a GitHub Release object as a required release gate.

## Required command results

### `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json`

Exit: `0`

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v20-goal-workbench-active-goal-surface",
  "goalTitle": "v20 Workbench Active Goal Surface",
  "generatedAt": "2026-05-30T21:28:37.658Z",
  "baseline": {
    "tag": "v19",
    "commit": null,
    "evidenceRef": "docs/plans/v19-tag-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 5,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Latest goal command inventory and Workbench view model",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_098ce6f827113c37",
      "branch": "v20-task-1-latest-goal-command-inventory-workbench-view-model",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v20-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v20-task-1-review-evidence-2026-05-31.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Active Goal Runbook panel and task queue",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_8c4deb4197dd309f",
      "branch": "v20-task-2-active-goal-runbook-panel-task-queue",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md",
      "reviewEvidenceRef": "docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Next Action Card and Prompt Preview Drawer",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_f3df61d29185b335",
      "branch": "v20-task-3-next-action-card-prompt-preview-drawer",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v20-task-3-worker-evidence-2026-05-31.md",
      "reviewEvidenceRef": "docs/plans/v20-task-3-review-evidence-2026-05-31.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v20-task-3-main-verification-evidence-2026-05-31.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Closeout Gaps panel",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_027eee3ae714ce88",
      "branch": "v20-task-4-closeout-gaps-panel",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v20-task-4-worker-evidence-2026-05-31.md",
      "reviewEvidenceRef": "docs/plans/v20-task-4-review-evidence-2026-05-31.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v20-task-4-main-verification-evidence-2026-05-31.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-5",
      "title": "Workbench tests, operator docs, and release evidence",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_b8016ad2803eb91a",
      "branch": "v20-task-5-workbench-tests-operator-docs-release-evidence",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v20-task-5-worker-evidence-2026-05-31.md",
      "reviewEvidenceRef": "docs/plans/v20-task-5-review-evidence-2026-05-31.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v20-task-5-main-verification-evidence-2026-05-31.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "passed",
    "pnpmTest": "passed",
    "workbenchBuild": "passed",
    "mutationGate": "passed",
    "auditHigh": "passed",
    "diffCheck": "passed",
    "mcasDoctor": "passed",
    "docsUpdated": "passed",
    "tagEvidence": "passed"
  },
  "blockers": [],
  "nextActions": [],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

### `pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json`

Exit: `0`

```json
{
  "contractName": "goal-closeout-report.v1",
  "contractVersion": 1,
  "goalId": "v20-goal-workbench-active-goal-surface",
  "generatedAt": "2026-05-30T21:28:37.653Z",
  "summary": {
    "totalTasks": 5,
    "workerEvidenceComplete": true,
    "reviewEvidenceComplete": true,
    "mainVerificationComplete": true,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "missing": [
    {
      "kind": "release-ready",
      "taskId": null,
      "expectedEvent": "release.ready-declared"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "passed",
    "pnpmTest": "passed",
    "workbenchBuild": "passed",
    "mutationGate": "passed",
    "auditHigh": "passed",
    "diffCheck": "passed",
    "mcasDoctor": "passed",
    "docsUpdated": "passed",
    "tagEvidence": "passed"
  },
  "nextAction": "symphony goal next --goal v20-goal-workbench-active-goal-surface",
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false,
    "writesInDryRun": false,
    "confirmRequiredForWrites": true,
    "releaseReadyRequiresEvidence": true
  }
}
```

### `pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json`

Exit: `0`

```json
{
  "contractName": "goal-next-action.v1",
  "contractVersion": 1,
  "goalId": "v20-goal-workbench-active-goal-surface",
  "status": "action-required",
  "next": {
    "taskId": "release",
    "role": "release-manager",
    "phase": "release-prep",
    "reason": "All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.",
    "blocked": false
  },
  "reason": "All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.",
  "evidenceState": {
    "workerEvidenceRef": null,
    "reviewEvidenceRef": null,
    "mainVerificationRef": null
  },
  "copyOnlyPrompt": {
    "available": false,
    "format": null,
    "text": null
  },
  "copyOnlyCommands": [
    "symphony goal-status --goal v20-goal-workbench-active-goal-surface --json"
  ],
  "afterCompletion": {
    "registerWith": "symphony goal gate",
    "allowedEvents": [
      "release.ready-declared"
    ]
  },
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

### `git status --short --branch`

Exit: `0`

```text
## main...origin/main
```

### `git rev-parse HEAD`

Exit: `0`

```text
57bd331edc113b8a889a1c529a5d8e4e5bd0012d
```

### `git rev-parse origin/main`

Exit: `0`

```text
57bd331edc113b8a889a1c529a5d8e4e5bd0012d
```

### `git tag --list 'v20'`

Exit: `0`

```text
v20
```

### `git rev-parse v20^{tag}`

Exit: `0`

```text
01b899e01e61fd18655950aa25fa987d6fe0a13d
```

### `git rev-parse v20^{}`

Exit: `0`

```text
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6
```

### `git ls-remote --tags origin 'refs/tags/v20'`

Exit: `0`

```text
01b899e01e61fd18655950aa25fa987d6fe0a13d	refs/tags/v20
```

### `git ls-remote --tags origin 'refs/tags/v20^{}'`

Exit: `0`

```text
fb970ac0a9b751c65525b54f46d1cadb8c2cbda6	refs/tags/v20^{}
```

## Recommendation

Parent should register `release.ready-declared` with evidence ref:

```text
docs/plans/v20-release-ready-evidence-2026-05-31.md
```

Recommendation: `DECLARE_READY`.

Remaining blockers: none.
