# v27 task-3 worker evidence

## Run context

- Goal id: `v27-review-revision-loop`
- Task id: `task-3`
- Runbook branch: `v27-task-3-review-verdict-registration`
- Actual branch/path: `v27-task-3-review-verdict-registration` at `/Users/andy/Documents/project/multi-coding-agent-symphony`
- User-visible value: review 结果能真实推进 ledger。

## Boundary notes

- Original checkout before task-3 branch setup: `v27-task-2-independent-reviewer-handoff`.
- Original safe branch command: `git switch -c v27-task-3-review-verdict-registration`.
- Result: succeeded with `Switched to a new branch 'v27-task-3-review-verdict-registration'`.
- Current-checkout fallback: not used.
- Existing dirty/untracked task-1/task-2 and prior-version artifacts were present before task-3 work. They were preserved. This evidence claims only the task-3 implementation listed below.
- Workbench primary path remains latest/v19 goal/runbook/next-action flow.
- No generic safety layer, shell runner, permission system, goal framework, or artifact framework was added.
- Worker evidence was registered with `worker.evidence-recorded` after the evidence file was written.
- No reviewer approval, main verification, release gate, or release-ready event was registered by this worker.

## Implementation summary

- Added a Review Workspace `reviewVerdictRegistration` model that builds `symphony goal review` forms for `approved` and `needs-revision`.
- The form uses the existing dry-run preview and plan-hash confirm routes, with reviewer id required and reviewer/worker separation still enforced by backend preconditions.
- Review evidence defaults from the reviewer prompt evidence path when it is a controlled evidence ref.
- Review Workspace now renders the verdict registration forms and refreshes Workbench contracts after successful confirm.
- Added focused coverage for:
  - Review Workspace projection of approved and needs-revision forms.
  - Browser shell wiring from Review Workspace confirm to Workbench refresh.
  - Workbench API review confirm writing `reviewer.needs-revision` and refreshing task state to `needs-revision`.
- Updated Workbench operator and contract docs for the controlled review verdict registration path.
- Regenerated the Workbench static bundle with `pnpm workbench:build`.

## Files changed for task-3

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v23-goal-operation-console-api.test.js`
- `docs/plans/v27-task-3-worker-evidence-2026-05-29.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-Cij6QcGP.css`
- `src/symphony/workbench-static/assets/index-DPQlSPKW.js`

## Acceptance commands

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

...
✔ v23 Workbench goal operation console API (112.583209ms)
✔ v15 Workbench read-only API client (79.577958ms)
✔ v15 Workbench React/Vite shell (24.912333ms)
✔ v15 Workbench static serving (30.492958ms)

ℹ tests 722
ℹ suites 114
ℹ pass 722
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6945.588458
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-DPQlSPKW.js   815.86 kB │ gzip: 151.54 kB

✓ built in 51ms
```

### `git diff --check`

Result: passed, exit code 0.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit code 0.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v27-review-revision-loop",
  "goalTitle": "v27 Review Revision Loop",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "main-verified",
      "reviewVerdict": "APPROVED"
    },
    {
      "taskId": "task-2",
      "status": "main-verified",
      "reviewVerdict": "APPROVED"
    },
    {
      "taskId": "task-3",
      "status": "in-progress",
      "statusSource": "goal-event-log.v1:evt_053638543517ac5a",
      "workerEvidenceRef": "docs/plans/v27-task-3-worker-evidence-2026-05-29.md",
      "reviewVerdict": null
    },
    {
      "taskId": "task-4",
      "status": "planned",
      "reviewVerdict": null
    },
    {
      "taskId": "task-5",
      "status": "planned",
      "reviewVerdict": null
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-3",
      "command": "pnpm check"
    }
  ]
}
```

## Worker evidence event

Dry-run command:

```bash
pnpm --silent symphony goal update --goal v27-review-revision-loop --task task-3 --event worker.evidence-recorded --actor codex-v27-task-3-worker --evidence-ref docs/plans/v27-task-3-worker-evidence-2026-05-29.md --dry-run --json
```

Dry-run result: passed, exit code 0.

```json
{
  "contractName": "goal-update-plan.v1",
  "planHash": "sha256:11fc3951854bab4be5374b6f2c8f2192bc1e832d0fd3168f782c9331d8e33a65",
  "goalId": "v27-review-revision-loop",
  "mode": "dry-run",
  "command": {
    "name": "symphony goal update",
    "intent": "record-worker-task-event"
  },
  "actor": {
    "role": "worker",
    "id": "codex-v27-task-3-worker"
  },
  "proposedEvents": [
    {
      "eventType": "worker.evidence-recorded",
      "taskId": "task-3",
      "evidenceRefs": [
        {
          "kind": "repo-doc",
          "ref": "docs/plans/v27-task-3-worker-evidence-2026-05-29.md"
        }
      ]
    }
  ],
  "wouldAppend": {
    "writesInDryRun": false
  },
  "ledgerPreview": {
    "changes": [
      {
        "taskId": "task-3",
        "toStatus": "needs-review"
      }
    ]
  }
}
```

Confirm command:

```bash
pnpm --silent symphony goal update --goal v27-review-revision-loop --task task-3 --event worker.evidence-recorded --actor codex-v27-task-3-worker --evidence-ref docs/plans/v27-task-3-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:11fc3951854bab4be5374b6f2c8f2192bc1e832d0fd3168f782c9331d8e33a65
```

Confirm result: passed, exit code 0.

```json
{
  "mode": "confirm",
  "status": "appended",
  "written": true,
  "appendOnly": true,
  "goalId": "v27-review-revision-loop",
  "taskId": "task-3",
  "eventType": "worker.evidence-recorded",
  "event": {
    "eventId": "evt_053638543517ac5a",
    "sequence": 7,
    "actor": {
      "role": "worker",
      "id": "codex-v27-task-3-worker"
    },
    "evidenceRefs": [
      {
        "kind": "repo-doc",
        "ref": "docs/plans/v27-task-3-worker-evidence-2026-05-29.md"
      }
    ]
  }
}
```

Goal next after registration:

```json
{
  "contractName": "goal-next-action.v1",
  "goalId": "v27-review-revision-loop",
  "status": "action-required",
  "next": {
    "taskId": "task-3",
    "role": "reviewer",
    "phase": "review",
    "reason": "Worker evidence exists for task-3 but reviewer verdict is missing."
  },
  "afterCompletion": {
    "registerWith": "symphony goal review",
    "allowedEvents": [
      "reviewer.approved",
      "reviewer.needs-revision"
    ]
  }
}
```

## Additional smoke check

- Started local console server: `pnpm --silent symphony console --host 127.0.0.1 --port 8767 --json`
- Browser URL: `http://127.0.0.1:8767/workbench/`
- Browser smoke result:

```json
{
  "reviewWorkspacePanel": true,
  "reviewVerdictRegistration": true,
  "allowedVerdictEvents": true,
  "approvedForm": true,
  "needsRevisionForm": true,
  "dryRunPreviewButton": true,
  "usesGoalReview": true,
  "genericShellRunnerFalse": true
}
```

## Reviewer handoff checklist

- Check that Review Workspace registers only `reviewer.approved` and `reviewer.needs-revision`.
- Check that reviewer id is operator input and is not defaulted to the worker actor.
- Check that confirm uses the existing dry-run `planHash` and refreshes goal progress, events, next action, and operation state.
- Check that task state advances only from the backend goal event ledger, not from file names, branch names, prompts, copy-only commands, or frontend state.
- Check that no worker self-approval, main verification, release gate, merge, tag, shell runner, model call, or generic framework was introduced.

Worker evidence is ready for independent review.
