# Symphony Product JSON Contracts

v8.2 made the product CLI JSON surface stable for scripts and local UI consumers. v9 adds workbench-oriented console fields and read-only routes without changing `contractVersion`. v9.1 adds Workbench diagnostics, run filters, grouped commands, and risk summaries as additive fields. v10 adds the controlled `symphony diagnose` CLI report. v11 adds controlled kernel execution plans for `symphony do --write`. v12 adds verified adoption plans for applying verifier-passing isolated workspace changes through a separate frozen-patch confirmation step. v13 adds a compact Workbench information architecture with derived `overview` and `adoptionSummary` fields plus a read-only adoption inspect route. v17 adds `goal-progress-ledger.v1`, `capabilities.v1`, `diagnostics.v1`, and `error-envelope.v1` for the read-only console and Workbench. v18 adds `goal-event-log.v1` and `goal-update-plan.v1` for controlled goal event registration and read-only event display. v19 adds the implemented/draft `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1` contract family for Goal Runbook + Next Action Control Center work. v19 is not released or tagged by this document. Existing contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only; non-GET HTTP requests return `405`.
- File previews are capped at 200 KiB and return `truncated: true` when capped.
- v9 workbench commands are copy-only recommendations. The browser UI does not execute commands or write files.
- v9 readiness checks may inspect local CLI availability, git state, GitHub auth/CI visibility, and real CLI gate status; they do not invoke models and must not expose token values.
- v9.1 run filters are read-only selectors. `GET /api/runs?filter=<filter>` supports `all`, `passed`, `failed`, `dry-run`, `real`, `scan`, `verify`, and the v13 additive `adoption` filter.
- v9.1 diagnostics may add `runStats`, `riskSummary`, `artifactStatus`, and `commandGroups`; older consumers can ignore these fields.
- v10 `symphony diagnose` does not start a server, invoke models, execute recommended commands, read artifact content, or write project files. `--html` writes only to stdout and the generated report is static HTML with no scripts or external resources.
- v10 diagnostics command recommendations remain copy-only text. `--json` and `--html` are mutually exclusive output modes.
- v11 `symphony do --write` is planning-only until the returned `symphony do --confirm-plan <plan-id>` command is run. Confirmed execution writes only to a managed isolated workspace and keeps `mainWorktreeWrites: false`.
- v11 real-agent execution plans require the existing adapter gate, such as `MCAS_RUN_REAL_CODEX=1`, during confirmation before any adapter starts.
- v12 `symphony adopt --run <run-id>` is planning-only. It creates a frozen `symphony.adoption-plan` and a registered patch artifact, and keeps the main worktree unchanged.
- v12 `symphony adopt --confirm <adoption-id>` accepts only `--confirm`, `--state-dir`, and `--json`; it revalidates the frozen plan, patch hash, source workspace fingerprint, git HEAD, dirty-worktree fingerprint, and `git apply --check` before writing. After those checks and before `git apply`, it writes an adoption journal and an `applying` confirmation run state.
- v12 `symphony adopt --inspect <adoption-id> --json` accepts only `--inspect`, `--state-dir`, and `--json`. It is read-only and reports plan, journal, latest confirmation, and current worktree hash matches.
- v12 adoption does not invoke adapters, models, package installers, generated execution plans, or external services.
- v13 Workbench `overview` and `adoptionSummary` are derived summaries, not canonical storage. They can be recomputed from run states, adoption plans, adoption journals, readiness, and diagnostics.
- v13 `GET /api/adoptions/<adoption-id>/inspect` reuses the CLI adoption inspection builder. It is read-only, writes no state files, executes no recommended commands, and returns only copy-only command recommendations.
- v17 goal progress is evidence-based. `approved`, `needs-revision`, `main-verified`, and `release-ready` require explicit evidence refs or release gate evidence; task names, branch names, commands, filenames, and paths are not proof.
- v17 `capabilities.v1` declares unsupported browser capabilities as explicit `false` values. The Workbench displays those fields but does not turn them into write, execution, download, or model invocation controls.
- v17 `diagnostics.v1` is read-only. It does not run shell commands, tests, audit, mutation, package installs, or model calls.
- v17 `error-envelope.v1` is used for relevant Console API error responses. Error bodies must not contain stack traces, absolute local paths, secrets, or repository file contents.
- v18 `goal-event-log.v1` is the append-only source for worker evidence, independent review evidence, main verification evidence, release gate evidence, and release ready declaration.
- v18 `goal-update-plan.v1` is the dry-run contract used by `symphony goal update`, `symphony goal review`, and `symphony goal gate` before confirm appends to the managed journal.
- v18 keeps the `goal-progress-ledger.v1` contract name. The resolver reads `goal-event-log.v1`; with no events it returns the v17 planned/unknown template.
- v18 Workbench display uses `GET /api/goals/latest/events`, `GET /api/goals/<goal-id>/events`, Goal Events Timeline, and Evidence Matrix. It reads only backend contract fields.
- v18 does not include Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, or automatic tag.
- v19 runbook contracts define the operator control surface only. They do not execute CLI commands, read evidence documents, write managed state, call models, merge, tag, or mark release readiness.
- v19 goal status must come from explicit `goal-event-log.v1` evidence. Branch names, filenames, task titles, command text, and path strings are never approval, main verification, or release-ready proof.
- v19 prompt and command fields are copy-only text. Dry-run and confirm fields must stay explicit and consistent; dry-run fields must not imply writes.
- v19 release-ready requires an explicit `symphony goal gate --gate release.ready --status declared` confirm flow, which records `release.ready-declared`. Passing `pnpm check`, `pnpm test`, `pnpm workbench:build`, mutation, audit, doctor, or diff commands is command evidence only until the matching release gate events are registered.

## `goal-event-log.v1`

`goal-event-log.v1` records explicit goal events for one registered goal. It is not a release summary and it is not editable Workbench state. The managed writer appends events, assigns sequence numbers, and links events with `previousEventHash` / `eventHash`.

```json
{
  "contractName": "goal-event-log.v1",
  "contractVersion": 1,
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "goalTitle": "v18 Goal Event Journal + Evidence Recorder",
  "baseline": {
    "tag": "v17",
    "commit": null,
    "evidenceRef": "docs/plans/v17-release-evidence-2026-05-28.md"
  },
  "log": {
    "appendOnly": true,
    "storage": "managed-goal-event-journal",
    "eventCount": 0,
    "firstSequence": null,
    "lastSequence": null,
    "lastEventId": null,
    "lastEventHash": null
  },
  "events": []
}
```

Supported event families include worker events, reviewer verdicts, main verification events, release gate events, blockers, and `release.ready-declared`. `approved`, `main-verified`, and `release-ready` must come from explicit events, not from branch names, filenames, command text, task titles, or paths.

Routes:

```text
GET /api/goals/latest/events
GET /api/goals/<goal-id>/events
```

These routes accept only `GET`. Unknown goals and unsafe path segments return `error-envelope.v1`. Query path, absolute paths, `file://`, `~/`, and encoded traversal do not trigger filesystem reads. Evidence refs are identifiers only; the API, resolver, and Workbench do not read evidence document bodies.

## `goal-update-plan.v1`

`goal-update-plan.v1` is the dry-run output for controlled goal event registration. It lets an operator inspect the event that would be appended, the evidence refs, the safety flags, and the copy-only confirm command.

```json
{
  "contractName": "goal-update-plan.v1",
  "contractVersion": 1,
  "planId": "plan_v18_task1_worker_started",
  "planHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "mode": "dry-run",
  "command": {
    "name": "symphony goal update",
    "intent": "record-worker-task-event",
    "confirmRequired": true
  },
  "wouldAppend": {
    "appendOnly": true,
    "eventCount": 1,
    "target": "managed-goal-event-journal",
    "writesInDryRun": false
  },
  "confirm": {
    "available": true,
    "requiredFlags": ["--confirm", "--plan-hash"],
    "copyOnlyCommand": "symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --confirm --plan-hash sha256:..."
  },
  "safety": {
    "dryRunWrites": false,
    "confirmWritesAppendOnly": true,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false,
    "arbitraryPathReadAvailable": false
  }
}
```

CLI entry points:

```sh
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --dry-run
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --dry-run
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.pnpm-check --status passed --verifier codex-release-verifier --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --dry-run
```

Confirm recalculates the plan hash from the current CLI input and refuses mismatches. Confirm does not run tests, audit, mutation, doctor, package installs, shell commands, model calls, merge, or tag operations. It only appends the explicit event to the managed goal event journal.

## `goal-runbook.v1`

`goal-runbook.v1` defines the executable blueprint for one goal. It is not evidence and does not store completion state.

```json
{
  "contractName": "goal-runbook.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "goalTitle": "v19 Goal Runbook + Next Action Control Center",
  "baseline": {
    "tag": "v18",
    "commit": null,
    "evidenceRef": "docs/plans/v18-tag-release-evidence-2026-05-29.md"
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Add goal runbook contracts and validators",
      "branch": "v19-task1-goal-runbook-contracts",
      "roleOrder": ["worker", "reviewer", "main-verifier"],
      "acceptance": ["Valid fixtures pass all v19 contract validators."],
      "expectedEvidence": {
        "worker": "worker.evidence-recorded",
        "reviewer": ["reviewer.approved", "reviewer.needs-revision"],
        "mainVerifier": "main.verification-passed"
      },
      "copyOnlyCommands": ["pnpm check", "pnpm test", "git diff --check"]
    }
  ],
  "releaseGates": ["release.pnpm-check", "release.pnpm-test", "release.tag-evidence"],
  "rolePolicy": {
    "workerCannotApproveOwnTask": true,
    "reviewerApprovalRequiredBeforeMainVerification": true,
    "mainVerificationRequiredBeforeReleaseReady": true
  }
}
```

Validator boundary:

- `goalId` and `taskId` must be safe path segments.
- `taskId` values are unique.
- `acceptance` is non-empty.
- `expectedEvidence` values must be supported goal event types.
- `baseline.evidenceRef` must be a controlled repo-doc or managed artifact ref.
- `copyOnlyCommands` are text recommendations only.

CLI and route boundary:

- `symphony goal init` registers managed runbook state only through dry-run and `--confirm --plan-hash`.
- The current implementation accepts `--from-json` for controlled `fixtures/contracts/goal-runbook.*.v1.json` refs. It rejects markdown sources, arbitrary JSON paths, output paths, absolute paths, `file://`, `~/`, traversal, encoded path markers, and backslashes.
- The read-only API exposes `GET /api/goals/latest/runbook` and `GET /api/goals/<goal-id>/runbook`. Missing managed runbook state is reported as a safe API error; the Workbench does not create or confirm runbooks.

## `goal-next-action.v1`

`goal-next-action.v1` describes the next recommended operator action after combining a runbook with explicit event evidence. It is a recommendation, not execution.

```json
{
  "contractName": "goal-next-action.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "status": "action-required",
  "next": {
    "taskId": "task-1",
    "role": "worker",
    "phase": "implement",
    "reason": "No explicit worker evidence is recorded for task-1.",
    "blocked": false
  },
  "evidenceState": {
    "workerEvidenceRef": null,
    "reviewEvidenceRef": null,
    "mainVerificationRef": null
  },
  "copyOnlyPrompt": {
    "available": true,
    "format": "markdown",
    "text": "/goal\n..."
  },
  "copyOnlyCommands": ["pnpm check", "pnpm test", "git diff --check"],
  "afterCompletion": {
    "registerWith": "symphony goal update",
    "allowedEvents": ["worker.evidence-recorded", "worker.self-check-passed"]
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

Supported statuses are `action-required`, `missing-runbook`, `blocked`, and `complete`. A prompt marked available must include copy-only prompt text. Allowed completion events must be supported goal event types.

CLI and route boundary:

- `symphony goal next --goal <goal-id> --json|--markdown` reads managed runbook state, `goal-event-log.v1`, and `goal-progress-ledger.v1`.
- `symphony next --goal latest` can surface the active goal next action. Without a managed runbook, it must keep the existing Stage summary behavior or return `missing-runbook` for explicit goal next calls.
- `GET /api/goals/latest/next` and `GET /api/goals/<goal-id>/next` return `goal-next-action.v1`. A `missing-runbook` response may recommend a copy-only `symphony goal init` dry-run command, but it does not write state.

## `goal-prompt-pack.v1`

`goal-prompt-pack.v1` packages copy-only `/goal` prompts for `worker`, `reviewer`, `main-verifier`, and `release-manager` roles.

Top-level fields are `contractName`, `contractVersion`, `goalId`, `generatedAt`, `prompts`, and `safety`. `generatedAt` is an ISO timestamp, `prompts` is the non-empty prompt list, and `safety` carries the read-only / copy-only display boundary.

Each prompt includes:

- `taskId`, `role`, and `title`.
- `copyOnly: true`.
- prompt `format` and `/goal` text.
- validation commands as copy-only strings.
- an evidence file ref under controlled refs.
- `registration` with separate dry-run and confirm commands.

Dry-run registration commands must include `--dry-run` and must not include `--confirm`. Confirm commands must include `--confirm` and `--plan-hash`. `writesInDryRun` is always `false`; `appendOnlyOnConfirm` is always `true`.

CLI and route boundary:

- `symphony goal prompt --goal <goal-id> --task <task-id> --role worker|reviewer|main-verifier|release-manager --markdown|--json` renders prompts only.
- `symphony goal prompt --goal <goal-id> --next --markdown` selects the task and role from `goal-next-action.v1`.
- `GET /api/goals/latest/prompt` and `GET /api/goals/<goal-id>/prompt` return prompt-pack data for display. The Workbench Prompt Preview copies text only; it does not run the prompt, register an event, start an agent, or call a model.

## `goal-closeout-report.v1`

`goal-closeout-report.v1` reports task evidence gaps and release gate gaps before release closeout.

```json
{
  "contractName": "goal-closeout-report.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "generatedAt": "2026-05-29T10:00:00.000Z",
  "summary": {
    "totalTasks": 2,
    "workerEvidenceComplete": true,
    "reviewEvidenceComplete": false,
    "mainVerificationComplete": false,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "missing": [
    {
      "kind": "review-evidence",
      "taskId": "task-2",
      "expectedEvent": "reviewer.approved"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "passed",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "missing"
  },
  "nextAction": "symphony goal next --goal v19-goal-runbook-next-action",
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

Closeout reports keep `releaseReady` evidence-based. `releaseReadySource` is `null` until an explicit `goal-event-log.v1:*` release readiness event is present. Missing items must name a supported expected event type, release gates use the existing `goal-progress-ledger.v1` gate status vocabulary, and `nextAction` is a copy-only command.

CLI and route boundary:

- `symphony goal closeout --goal <goal-id> --json|--markdown` reports gaps. It does not run tests, audit, mutation, doctor, or Workbench build, and it does not write release evidence files.
- `GET /api/goals/latest/closeout` and `GET /api/goals/<goal-id>/closeout` return `goal-closeout-report.v1` when a managed runbook exists.
- `summary.releaseReady` can be true only after task worker evidence, reviewer approval, main verification, all required release gate events, and the explicit `release.ready-declared` event are present. A passed command line by itself is not release-ready evidence.

## `goal-progress-ledger.v1`

`goal-progress-ledger.v1` summarizes one registered goal across tasks, evidence, review state, blockers, release gates, and next copy-only commands.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v17-readonly-goal-progress-console-contracts",
  "goalTitle": "v17 Read-only Goal Progress Ledger and Console Contract Hardening",
  "baseline": {
    "tag": "v16",
    "commit": null,
    "evidenceRef": "docs/plans/v16-tag-release-evidence-2026-05-28.md"
  },
  "summary": {
    "totalTasks": 10,
    "completedTasks": 0,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Add goal-progress-ledger.v1 contract fixtures and validator",
      "status": "planned",
      "statusSource": "registered-goal-template",
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "git checkout main && git pull --ff-only && git checkout -b v17-task1-goal-progress-contract"
    }
  ]
}
```

Supported task statuses are `not-started`, `planned`, `in-progress`, `self-checked`, `needs-review`, `needs-revision`, `approved`, `merged-to-main`, `main-verified`, `release-ready`, `blocked`, and `unknown`. Release gate statuses are `unknown`, `missing`, `pending`, `passed`, `failed`, and `blocked`.

Console routes:

```text
GET /api/goals
GET /api/goals/latest/progress
GET /api/goals/<goal-id>/progress
```

CLI:

```sh
symphony goal-status
symphony goal-status --json
symphony goal-status --markdown
symphony goal-status --goal v17-readonly-goal-progress-console-contracts --json
```

## `capabilities.v1`

`capabilities.v1` declares what the console and Workbench can display and what remains unavailable.

```json
{
  "contractName": "capabilities.v1",
  "contractVersion": 1,
  "readOnly": true,
  "displayOnly": true,
  "copyOnly": true,
  "mutationAvailable": false,
  "browserExecutionAvailable": false,
  "modelInvocationAvailable": false,
  "artifactDownloadAvailable": false,
  "safePreview": {
    "available": true,
    "inlineModes": ["bounded-text"],
    "rawHtmlInlineAvailable": false,
    "svgInlineAvailable": false,
    "javascriptInlineAvailable": false,
    "binaryInlineAvailable": false
  },
  "routes": {
    "handoff": true,
    "safePreview": true,
    "goalProgress": true,
    "diagnostics": true
  }
}
```

Route:

```text
GET /api/capabilities
```

## `diagnostics.v1`

`diagnostics.v1` exposes safe health fields for the local console and Workbench.

```json
{
  "contractName": "diagnostics.v1",
  "contractVersion": 1,
  "status": "ok",
  "checks": [
    {
      "id": "state-dir-readable",
      "label": "State directory readable",
      "status": "ok",
      "severity": "info"
    }
  ],
  "boundaries": {
    "readOnlyApi": true,
    "nonGetBlocked": true,
    "workbenchFallbackProtected": true,
    "arbitraryPathPreviewBlocked": true
  }
}
```

Route:

```text
GET /api/diagnostics
```

## `error-envelope.v1`

`error-envelope.v1` is the safe error body for relevant Console API failures.

```json
{
  "contractName": "error-envelope.v1",
  "contractVersion": 1,
  "ok": false,
  "error": {
    "code": "blocked-artifact-path",
    "message": "Artifact preview is blocked by safety policy.",
    "status": 403,
    "route": "/api/runs/<run-id>/artifacts/<artifact-kind>/preview",
    "method": "GET",
    "safeDetails": {
      "reason": "repo-source-path-blocked"
    }
  }
}
```

The envelope is for errors only. Successful handoff, preview, goal progress, capabilities, and diagnostics responses keep their own contract names.

## `symphony.product-json`

Product commands such as `symphony scan --json` keep their legacy fields and add the stable envelope.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.product-summary",
  "contract": {
    "name": "symphony.product-summary",
    "version": "1",
    "stability": "stable",
    "minimumCli": "v8.2"
  },
  "identity": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "intent": "scan-project",
    "semanticCommand": "scan"
  },
  "safety": {
    "mode": "read-only",
    "projectWrites": false,
    "runtimeWrites": true,
    "externalCalls": false,
    "destructiveWrites": false
  },
  "workflow": {
    "pipeline": ["scan"]
  },
  "artifactRefs": [
    {
      "kind": "context",
      "path": "tmp/symphony-scan/run/runtime/artifacts/project-intake/project-context.json"
    }
  ],
  "action": {
    "next": "symphony do --dry-run \"inspect README\""
  },
  "timestamps": {
    "createdAt": null,
    "updatedAt": null,
    "generatedAt": "2026-05-22T00:00:00.000Z"
  }
}
```

## `symphony.run-state`

New product runs persist the contracted state under `.symphony/runs/<run-id>.json` and `.symphony/runs/latest.json`.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-new-demo-abc123-1",
  "command": "symphony new",
  "semanticCommand": "new",
  "safetyMode": "dry-run",
  "status": "preview",
  "verifierStatus": "not-run",
  "routeDecision": {
    "intent": "new-project",
    "safetyMode": "dry-run"
  },
  "unsupportedRequests": [],
  "scaffoldPlan": {
    "template": "empty",
    "networkInstall": false
  },
  "changedFiles": [],
  "artifactRefs": [
    {
      "kind": "scaffold-plan",
      "path": "tmp/symphony-new/run/runtime/artifacts/symphony-new/scaffold-plan.json"
    }
  ],
  "action": {
    "next": "symphony new demo --template empty --write"
  }
}
```

Older run-state files can omit v8.2 fields. Consumers should treat missing optional fields as unavailable, not invalid.

Planned v11 write runs add controlled execution metadata without changing `contractVersion`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-plan-writer-reviewer-abc123",
  "command": "symphony do",
  "semanticCommand": "do",
  "safetyMode": "write",
  "status": "planned",
  "verifierStatus": "not-run",
  "projectWrites": true,
  "mainWorktreeWrites": false,
  "workspaceWrites": true,
  "runtimeWrites": true,
  "externalCalls": false,
  "writeBoundary": "isolated-workspace",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
  "artifactRefs": [
    {
      "kind": "execution-plan",
      "path": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json"
    }
  ],
  "action": {
    "next": "symphony do --confirm-plan symphony-plan-writer-reviewer-abc123"
  }
}
```

Confirmed v11 runs preserve `executionPlanId`, `plannedRunId`, and `executionPlanArtifactPath`, then add the usual evidence, Harness, task-packet, verifier, and changed-file fields from the kernel workflow.

Planned v12 adoption runs add frozen patch metadata while keeping `mainWorktreeWrites: false`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-adoption-source-abc123-planned",
  "command": "symphony adopt",
  "semanticCommand": "adopt",
  "status": "adoption-planned",
  "verifierStatus": "not-run",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionPlanArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.json",
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "mainWorktreeWrites": false,
  "writeBoundary": "main-worktree",
  "artifactRefs": [
    {
      "kind": "adoption-plan",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123.json"
    },
    {
      "kind": "adoption-patch",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123.patch"
    }
  ],
  "action": {
    "next": "symphony adopt --confirm symphony-adoption-source-abc123"
  }
}
```

V12 confirmation first writes an `applying` run state after the journal is durable and before `git apply`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
  "command": "symphony adopt",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-confirm"],
  "status": "applying",
  "verifierStatus": "not-run",
  "mainWorktreeWrites": false,
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionJournalArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json",
  "artifactRefs": [
    {
      "kind": "adoption-journal",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
    }
  ]
}
```

Confirmed v12 adoption runs set `mainWorktreeWrites: true` only after the frozen patch is applied, post-apply evidence is recorded, and journal status is advanced from `applying` to `applied`. Failed preflight confirmations write a failed adoption run with `mainWorktreeWrites: false`; post-apply evidence or final state persistence failures do not roll back and best-effort write a failed run with `mainWorktreeWrites: true`, `failurePhase: "post-apply-evidence"`, `adoptionJournalArtifactPath`, and `nextAction: "symphony status"`.

## `symphony.execution-plan`

`symphony do --write` writes a frozen plan to `.symphony/plans/<plan-id>.json` and persists a planned run. It does not start an adapter. `symphony do --write --real codex` may create a plan without the gate, but `symphony do --confirm-plan <plan-id>` requires `MCAS_RUN_REAL_CODEX=1` before adapter start.

```json
{
  "version": "1",
  "kind": "symphony.execution-plan",
  "contractVersion": "1",
  "contractName": "symphony.execution-plan",
  "planId": "symphony-plan-writer-reviewer-abc123",
  "command": "symphony do",
  "intent": "work",
  "semanticCommand": "do",
  "prompt": "inspect README",
  "pipeline": ["scan-if-needed", "do"],
  "safetyMode": "write",
  "projectWrites": true,
  "mainWorktreeWrites": false,
  "workspaceWrites": true,
  "runtimeWrites": true,
  "externalCalls": false,
  "destructiveWrites": false,
  "writeBoundary": "isolated-workspace",
  "projectRoot": "/repo",
  "projectFingerprint": "sha256:...",
  "contextArtifactPath": "tmp/symphony-scan/.../project-context.json",
  "summaryArtifactPath": "tmp/symphony-scan/.../intake-summary.json",
  "workflowMode": "writer-reviewer",
  "adapter": "codex",
  "executionMode": "dry-run",
  "workDir": "tmp/symphony-work",
  "requiresGate": null,
  "confirmationCommand": "symphony do --confirm-plan symphony-plan-writer-reviewer-abc123",
  "createdAt": "2026-05-23T00:00:00.000Z"
}
```

Confirmation accepts only `--confirm-plan <plan-id>`, `--state-dir <path>`, and `--json`. Extra prompt text or execution flags are rejected so the frozen plan cannot drift. The generated `confirmationCommand` includes the non-default state dir when a plan is stored outside `.symphony`. Confirmation also rejects missing plans, unsupported plan contracts, stale project fingerprints, unsupported write boundaries, invalid audit invariants, and missing real-agent gates before the kernel workflow starts.

## `symphony.adoption-plan`

`symphony adopt --run <run-id>` writes a frozen adoption plan to `.symphony/adoptions/<adoption-id>.json` and a registered patch artifact to `.symphony/adoptions/<adoption-id>.patch`. The source run must be a confirmed v11 run with `status: "passed"`, `verifierStatus: "passed"`, `writeBoundary: "isolated-workspace"`, `mainWorktreeWrites: false`, verifier evidence, and source workspace refs.

```json
{
  "version": "1",
  "kind": "symphony.adoption-plan",
  "contractName": "symphony.adoption-plan",
  "contractVersion": "1",
  "adoptionId": "symphony-adoption-source-abc123",
  "command": "symphony adopt",
  "intent": "adopt",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-plan"],
  "safetyMode": "write",
  "stateDir": ".symphony",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "sourceRunArtifactPath": ".symphony/runs/symphony-work-confirmed-abc123.json",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
  "plannedRunId": "symphony-adoption-source-abc123-planned",
  "projectRoot": "/repo",
  "projectFingerprint": "sha256:...",
  "gitHead": "0123456789abcdef...",
  "gitStatusFingerprint": "sha256:...",
  "sourceWorkspacePath": "/repo/.symphony/work/run/runtime/workspaces/task/ws",
  "sourceWorkspaceManifestPath": "/repo/.symphony/work/run/runtime/workspaces/task/ws/workspace-manifest.json",
  "sourceWorkspaceFingerprint": "sha256:...",
  "sourceEvidenceArtifactPath": "/repo/.symphony/work/run/runtime/artifacts/task/implement-evidence.json",
  "sourceVerifierStatus": "passed",
  "sourceWriteBoundary": "isolated-workspace",
  "writeBoundary": "main-worktree",
  "projectWrites": true,
  "mainWorktreeWrites": true,
  "workspaceWrites": false,
  "runtimeWrites": true,
  "externalCalls": false,
  "destructiveWrites": false,
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "unsupportedChanges": [],
  "confirmationCommand": "symphony adopt --confirm symphony-adoption-source-abc123",
  "createdAt": "2026-05-24T00:00:00.000Z"
}
```

v12 supports only text-file `add` and `modify` operations. Planning rejects deletion, rename, binary files, symlinks, chmod-only changes, ignored-root changes such as `.symphony/`, `.git/`, `node_modules/`, path traversal, missing workspace refs, missing evidence, stale source metadata, and dirty non-Symphony main worktree changes. Confirmation never regenerates the patch from the current isolated workspace; it uses the registered patch artifact and plan hashes only.

## `symphony.adoption-journal`

`symphony adopt --confirm <adoption-id>` writes `.symphony/adoptions/<adoption-id>-journal.json` after all pre-write checks and before `git apply`. The journal is also exposed through run-state `artifactRefs` with `kind: "adoption-journal"`.

```json
{
  "version": "1",
  "kind": "symphony.adoption-journal",
  "contractName": "symphony.adoption-journal",
  "contractVersion": "1",
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "confirmationRunId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "beforeFiles": [
    {
      "path": "README.md",
      "exists": true,
      "hash": "sha256:...",
      "size": 10,
      "textEncoding": "utf8"
    }
  ],
  "createdAt": "2026-05-24T00:00:00.000Z",
  "status": "applying"
}
```

If post-apply evidence succeeds, the same artifact status is advanced to `"applied"`. If patch application succeeds but post-apply evidence or state persistence fails, the journal may remain `"applying"` and diagnostics use it as recovery visibility.

## `symphony adopt --inspect`

`symphony adopt --inspect <adoption-id> --json` is a read-only inspection surface. It rejects prompt text, `--write`, execution flags, and mixed modes such as `--inspect` plus `--confirm`.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.product-summary",
  "command": "symphony adopt",
  "intent": "adopt-inspect",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-inspect"],
  "safety": {
    "mode": "read-only",
    "projectWrites": false,
    "mainWorktreeWrites": false,
    "runtimeWrites": false,
    "externalCalls": false,
    "destructiveWrites": false
  },
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionPlanRefs": {
    "adoptionPlanArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.json",
    "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
    "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
    "sourceRunArtifactPath": ".symphony/runs/symphony-work-confirmed-abc123.json"
  },
  "journalRef": {
    "kind": "adoption-journal",
    "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
  },
  "sourceRun": {
    "runId": "symphony-work-confirmed-abc123",
    "verifierStatus": "passed",
    "workspacePath": "/repo/.symphony/work/run/runtime/workspaces/task/ws"
  },
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "latestConfirmationRun": {
    "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
    "status": "passed",
    "mainWorktreeWrites": true
  },
  "currentWorktreeMatchesAfterHash": true,
  "currentWorktreeMatchesJournalBeforeFiles": false,
  "action": {
    "next": "symphony adopt --confirm symphony-adoption-source-abc123"
  }
}
```

## `symphony.console-snapshot`

`symphony console --snapshot --json` and `GET /api/summary` return the read-only state overview.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-snapshot",
  "stateDir": ".symphony",
  "status": "ready",
  "overview": {
    "status": "ready",
    "headline": "Latest run passed and no high-priority risks are visible.",
    "latestRunId": "symphony-scan-demo-abc123-1",
    "topRisks": [],
    "nextAction": "symphony status"
  },
  "adoptionSummary": {
    "status": "clear",
    "pendingCount": 0,
    "applyingCount": 0,
    "postApplyFailedCount": 0,
    "staleCount": 0,
    "unsupportedCount": 0,
    "completedCount": 0,
    "dirtyBlocked": false
  },
  "latestRun": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "status": "passed",
    "artifactHealth": {
      "status": "registered",
      "total": 1,
      "kinds": ["context"]
    },
    "timeline": [
      {
        "id": "verification",
        "label": "Verifier",
        "status": "done",
        "detail": "passed"
      }
    ],
    "artifactRefs": [],
    "recommendedCommands": [
      {
        "id": "status",
        "label": "Status",
        "command": "symphony status",
        "description": "Read the latest product state.",
        "mode": "copy-only"
      }
    ]
  },
  "runs": [],
  "adoptionPlans": [
    {
      "adoptionPlanId": "symphony-adoption-source-abc123",
      "sourceRunId": "symphony-work-confirmed-abc123",
      "executionPlanId": "symphony-plan-writer-reviewer-abc123",
      "status": "adoption-planned",
      "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
      "patchHash": "sha256:...",
      "changedFiles": ["README.md"],
      "confirmationCommand": "symphony adopt --confirm symphony-adoption-source-abc123"
    }
  ],
  "adoptionJournals": [
    {
      "adoptionPlanId": "symphony-adoption-source-abc123",
      "confirmationRunId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
      "status": "applied",
      "patchHash": "sha256:...",
      "changedFiles": ["README.md"],
      "adoptionJournalArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
    }
  ],
  "runStats": {
    "total": 1,
    "recentRuns": [
      {
        "runId": "symphony-scan-demo-abc123-1",
        "status": "passed",
        "verifierStatus": "passed",
        "artifactStatus": "ok"
      }
    ],
    "failedCount": 0,
    "verifier": {
      "total": 1,
      "passed": 1,
      "failed": 0,
      "passRate": 1
    },
    "artifacts": {
      "status": "ok",
      "registered": 1,
      "missing": 0,
      "runsWithMissing": 0
    }
  },
  "riskSummary": {
    "status": "ok",
    "total": 0,
    "counts": {
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "items": []
  },
  "recommendedCommands": [
    {
      "id": "console",
      "label": "Open workbench",
      "command": "symphony console",
      "description": "Return to this read-only dashboard.",
      "mode": "copy-only"
    }
  ],
  "commandGroups": [
    {
      "group": "Inspect",
      "commands": []
    }
  ],
  "action": {
    "next": "symphony status"
  }
}
```

When no runs exist, `status` and `overview.status` are `"no-runs"`, `latestRun` is `null`, and the next action is `symphony scan`. The v13 Workbench renders the compact Overview by default, with deeper details separated into Overview, Adoptions, Runs, Diagnostics, and Artifacts sections. v13.1 localizes visible Workbench presentation text to Chinese, but it does not localize JSON field names, status enum values, copy-only command strings, or raw/debug JSON blocks. Field ownership is:

- Overview: `overview`, latest run summary, top risks capped to three, compact readiness, and current next action.
- Adoptions: `adoptionSummary`, `adoptionPlans`, `adoptionJournals`, adoption run fields, and inspect match results.
- Runs: `runs`, `runStats`, filters, timelines, selected run details, and run-level commands.
- Diagnostics: full risk/readiness payloads and grouped copy-only commands.
- Artifacts: registered `artifactRefs`, artifact health/status, and bounded previews.
- Raw/debug: raw run state, route/provider blocks, unsupported requests, scaffold plans, and JSON detail blocks.

`GET /api/runs` also accepts an optional v9.1 filter query:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-runs",
  "filter": "failed",
  "availableFilters": ["all", "passed", "failed", "dry-run", "real", "scan", "verify", "adoption"],
  "runs": []
}
```

## `symphony.console-run`

`GET /api/runs/latest` and `GET /api/runs/<run-id>` return a compact run plus the raw persisted state for compatibility.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-run",
  "run": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "semanticCommand": "scan",
    "safetyMode": "read-only",
    "providerMode": "auto",
    "providerFallback": {
      "from": "grill-me-docs",
      "to": "builtin",
      "reason": "unavailable"
    },
    "verifierStatus": "passed",
    "nextAction": "symphony do --dry-run \"inspect README\"",
    "timeline": [
      {
        "id": "safety",
        "label": "Safety boundary",
        "status": "done",
        "detail": "read-only"
      }
    ],
    "recommendedCommands": [
      {
        "id": "next",
        "label": "Suggested next",
        "command": "symphony do --dry-run \"inspect README\"",
        "description": "Copy the next action recorded by the latest run.",
        "mode": "copy-only"
      }
    ],
    "artifactStatus": {
      "status": "ok",
      "total": 1,
      "available": 1,
      "missing": 0,
      "unknown": 0,
      "missingKinds": []
    },
    "riskSummary": {
      "status": "ok",
      "total": 0,
      "items": []
    },
    "commandGroups": [
      {
        "group": "Inspect",
        "commands": []
      }
    ]
  },
  "rawRunState": {}
}
```

## `symphony.console-adoption-inspect`

`GET /api/adoptions/<adoption-id>/inspect` returns read-only adoption recovery data using the same inspection builder as `symphony adopt --inspect <adoption-id> --json`. It rejects unsafe ids before reading state and does not write files, run `git apply`, invoke adapters, invoke models, run installers, or execute recommended commands.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-adoption-inspect",
  "status": "inspected",
  "safetyMode": "read-only",
  "runtimeWrites": false,
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "journalRef": {
    "kind": "adoption-journal",
    "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
  },
  "latestConfirmationRun": {
    "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
    "status": "passed",
    "mainWorktreeWrites": true
  },
  "currentWorktreeMatchesAfterHash": true,
  "currentWorktreeMatchesJournalBeforeFiles": false,
  "recommendedCommands": [
    {
      "id": "inspect-adoption",
      "label": "Inspect adoption",
      "command": "symphony adopt --inspect symphony-adoption-source-abc123 --json",
      "mode": "copy-only"
    }
  ]
}
```

## `symphony.console-readiness`

`GET /api/readiness` returns local readiness data for the v9 workbench. It is read-only and model-free.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-readiness",
  "status": "ready",
  "readOnly": true,
  "modelInvocation": false,
  "tools": {
    "node": {
      "status": "available",
      "version": "v24.11.1"
    },
    "packageManager": {
      "name": "pnpm",
      "status": "available",
      "version": "10.30.3",
      "command": "pnpm --version"
    },
    "git": {
      "status": "available",
      "branch": "main",
      "head": "abc1234",
      "dirty": false,
      "dirtyFilesCount": 0,
      "dirtyPaths": []
    },
    "github": {
      "status": "authenticated",
      "account": "Andy20010101",
      "ci": {
        "status": "available",
        "latest": {
          "workflowName": "CI",
          "status": "completed",
          "conclusion": "success"
        }
      }
    },
    "realCli": {
      "status": "available",
      "adapters": [
        {
          "adapterId": "codex",
          "status": "available",
          "gate": {
            "envName": "MCAS_RUN_REAL_CODEX",
            "status": "not-enabled"
          },
          "modelInvocation": false
        }
      ]
    }
  },
  "checks": [
    {
      "id": "pnpm",
      "label": "pnpm",
      "status": "ok",
      "detail": "10.30.3"
    }
  ],
  "recommendedCommands": [
    {
      "id": "doctor",
      "label": "Doctor",
      "command": "symphony doctor",
      "description": "Check the base CLI environment.",
      "mode": "copy-only"
    }
  ],
  "riskSummary": {
    "status": "attention",
    "total": 1,
    "items": [
      {
        "id": "dirty_git",
        "category": "dirty_git",
        "severity": "medium",
        "title": "Dirty git worktree",
        "detail": "1 dirty file(s) may affect run trust.",
        "command": {
          "command": "git status --short",
          "mode": "copy-only"
        }
      }
    ]
  },
  "commandGroups": [
    {
      "group": "Inspect",
      "commands": []
    }
  ]
}
```

If optional tools such as `gh`, Codex, Claude, or Kiro are missing, their status is reported as unavailable or optional rather than failing the read-only console route.

## `symphony.diagnostics-report`

`symphony diagnose --json` returns a stable v10 report for terminals, CI, and static HTML generation. It combines the v9.1 console snapshot and readiness data without changing the `/api/*` Workbench contracts.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.diagnostics-report",
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "stateDir": ".symphony",
  "cwd": "/repo",
  "status": "attention",
  "snapshot": {
    "contractName": "symphony.console-snapshot",
    "runStats": {
      "total": 2,
      "failedCount": 1,
      "artifacts": {
        "status": "missing",
        "registered": 2,
        "missing": 1,
        "runsWithMissing": 1
      }
    },
    "riskSummary": {
      "status": "attention",
      "total": 2,
      "items": []
    },
    "commandGroups": []
  },
  "readiness": {
    "contractName": "symphony.console-readiness",
    "status": "attention",
    "readOnly": true,
    "modelInvocation": false,
    "riskSummary": {
      "status": "attention",
      "total": 1,
      "items": []
    },
    "commandGroups": []
  },
  "risks": {
    "status": "attention",
    "total": 3,
    "counts": {
      "high": 1,
      "medium": 1,
      "low": 1
    },
    "items": [
      {
        "id": "run-1:verifier_failed",
        "category": "verifier_failed",
        "severity": "high",
        "title": "Verifier failed",
        "runId": "run-1",
        "command": {
          "command": "symphony status",
          "mode": "copy-only"
        }
      }
    ]
  },
  "commands": {
    "mode": "copy-only",
    "items": [
      {
        "id": "status",
        "label": "Status",
        "command": "symphony status",
        "description": "Read the latest product state.",
        "group": "Inspect",
        "mode": "copy-only"
      }
    ],
    "groups": [
      {
        "group": "Inspect",
        "commands": [
          {
            "id": "status",
            "label": "Status",
            "command": "symphony status",
            "description": "Read the latest product state.",
            "group": "Inspect",
            "mode": "copy-only"
          }
        ]
      }
    ],
    "commandGroups": [
      {
        "group": "Inspect",
        "commands": [
          {
            "id": "status",
            "label": "Status",
            "command": "symphony status",
            "description": "Read the latest product state.",
            "group": "Inspect",
            "mode": "copy-only"
          }
        ]
      }
    ]
  },
  "action": {
    "next": "symphony status",
    "mode": "copy-only"
  }
}
```

Report `status` is `"no-runs"` when no run states exist, `"attention"` when high-severity risks or required tool gaps are visible, and `"ready"` otherwise. Required readiness currently means Node.js is running and `pnpm` plus git worktree checks are available; optional GitHub and real-agent CLI gaps appear in `risks` but do not by themselves make a report unusable.

`symphony diagnose` without flags renders a short terminal summary. `symphony diagnose --html` renders the same report as a single HTML document to stdout, suitable for `symphony diagnose --html > report.html`. The HTML report escapes all dynamic text, has no `<script>` block, has no external resource references, and presents commands only as copyable text.

v12 diagnostics add adoption-specific risk categories as additive values:

- `pending_adoption` for frozen plans waiting on copy-only confirmation.
- `stale_adoption` for confirmation preflights that detect drift.
- `dirty_worktree_blocks_adoption` when local git dirtiness blocks pending adoption.
- `adoption_dirty_file_details` when pending or stale adoption is blocked by dirty files; the risk includes `dirtyPaths` when available and always includes `dirtyPathCount`.
- `adoption_apply_in_progress` when an adoption confirmation run is `applying` or an adoption journal remains `applying`.
- `adoption_post_apply_failed` when patch application succeeded but post-apply evidence or final state persistence failed with `failurePhase: "post-apply-evidence"`.
- `unsupported_adoption_changes` when the source workspace contains changes outside v12 text add/modify support.

## `symphony.console-run-timeline`

`GET /api/runs/<run-id>/timeline` derives a compact v9 timeline from persisted run state. It does not introduce new canonical storage.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-run-timeline",
  "runId": "symphony-scan-demo-abc123-1",
  "timeline": [
    {
      "id": "created",
      "label": "Run created",
      "status": "done",
      "detail": "symphony-scan-demo-abc123-1",
      "at": "2026-05-23T00:00:00.000Z"
    },
    {
      "id": "artifacts",
      "label": "Artifacts",
      "status": "done",
      "detail": "2 registered"
    }
  ],
  "recommendedCommands": [
    {
      "id": "artifacts",
      "label": "Artifacts",
      "command": "symphony artifacts symphony-scan-demo-abc123-1",
      "description": "Print registered artifact references for this run.",
      "mode": "copy-only"
    }
  ]
}
```

## `symphony.console-artifact`

`GET /api/runs/<run-id>/artifacts/<kind>` reads only a path already registered in that run's `artifactRefs`. v12 adoption patch and journal previews use the normal `adoption-patch` and `adoption-journal` artifact refs and keep the same 200 KiB cap.

JSON file preview:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-artifact",
  "runId": "symphony-scan-demo-abc123-1",
  "artifact": {
    "kind": "context",
    "path": "tmp/context.json",
    "type": "file",
    "size": 512,
    "truncated": false,
    "format": "json",
    "content": "{\"kind\":\"project-context\"}",
    "json": {
      "kind": "project-context"
    }
  }
}
```

Directory preview:

```json
{
  "contractName": "symphony.console-artifact",
  "artifact": {
    "kind": "evidence",
    "path": "tmp/evidence",
    "type": "directory",
    "entryCount": 1,
    "limit": 100,
    "entries": [
      {
        "name": "summary.json",
        "type": "file"
      }
    ],
    "truncated": false
  }
}
```

Missing or malformed previews stay read-only and structured:

```json
{
  "contractName": "symphony.console-artifact",
  "status": "missing-artifact",
  "artifact": {
    "kind": "context",
    "path": "tmp/missing.json",
    "type": "missing",
    "message": "artifact file is missing"
  }
}
```

```json
{
  "contractName": "symphony.console-artifact",
  "artifact": {
    "kind": "summary",
    "path": "tmp/summary.json",
    "type": "file",
    "format": "malformed-json",
    "parseError": "Unexpected end of JSON input"
  }
}
```

Large file previews include the same `content` field capped at 200 KiB plus `truncated: true`, `previewLimitBytes: 204800`, and a human-readable `message`. Truncated JSON-shaped files are reported as `format: "truncated-json"` rather than malformed, because the Workbench has intentionally read only the preview window.
