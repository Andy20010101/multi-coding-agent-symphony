# Symphony Product JSON Contracts

v8.2 made the product CLI JSON surface stable for scripts and local UI consumers. v9 adds workbench-oriented console fields and read-only routes without changing `contractVersion`. v9.1 adds Workbench diagnostics, run filters, grouped commands, and risk summaries as additive fields. v10 adds the controlled `symphony diagnose` CLI report. v11 adds controlled kernel execution plans for `symphony do --write`. v12 adds verified adoption plans for applying verifier-passing isolated workspace changes through a separate frozen-patch confirmation step. v13 adds a compact Workbench information architecture with derived `overview` and `adoptionSummary` fields plus a read-only adoption inspect route. v17 adds `goal-progress-ledger.v1`, `capabilities.v1`, `diagnostics.v1`, and `error-envelope.v1` for the read-only console and Workbench. v18 adds `goal-event-log.v1` and `goal-update-plan.v1` for controlled goal event registration and read-only event display. v19 adds the `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1` contract family for Goal Runbook + Next Action Control Center work. v21 adds a Workbench dry-run preview route for the existing `goal-update-plan.v1` contract. v23 adds `goal-operation-runs.v1` for Workbench-started goal operation tracking. v25 adds a Workbench-only worker evidence handoff for `v25-controlled-implementation-lane`, derived from the latest confirmed isolated workspace run. v26 adds a read-only Adoption Candidate Panel derived from confirmed isolated workspace runs in `symphony.console-runs`. v27 adds Review Workspace projection and controlled review verdict registration from existing Workbench contracts. v28 adds Release Closeout Workspace projection with release verification checklist rows, a controlled `release.ready` gate registration form, and a copy-only tag evidence prompt derived from closeout/runbook/event contracts. The Workbench v1 v20-v28 chain is published as repository tag `v28`; the intermediate goal ids are part of that cumulative release rather than separate repository release tags. v29 adds `controlled-implementation-plan-preview.v1` for a Workbench active-task preview mapped to `symphony do --write --json` plan semantics without starting implementation, plus `controlled-implementation-run-confirmation.v1` for confirming the same frozen plan through `symphony do --confirm-plan <plan-id> --json`; confirmed implementation runs are also recorded in `goal-operation-runs.v1` with run result, artifact refs, verifier summary, and failure reason fields. The same v29 operation registry now feeds a worker evidence handoff that pre-fills `worker.evidence-recorded` through the existing `goal-update-plan.v1` dry-run and plan-hash confirm path. v30 normalizes adoption candidates from v29 implementation operations and run records, separating adoptable and blocked rows using explicit passed run status, artifact refs, workspace refs, source workspace fingerprints, verifier status, and main-worktree write fields. v30 also adds a controlled Workbench adoption plan freeze path that accepts only the selected active-goal implementation run context and maps it to existing `symphony adopt --run <confirmed-run-id> --json` semantics, showing patch summary, fingerprints, affected files, and recovery notes without confirming adoption. The same v30 adoption path adds an inspect/recovery view for the frozen adoption id from `goal-operation-runs.v1`, reusing `symphony adopt --inspect <adoption-id> --json` output to show journal state, before/after hashes, current worktree match results, patch refs, and evidence context. v30 then adds `controlled-adoption-confirmation.v1`, which accepts only the frozen adoption operation context and maps to existing `symphony adopt --confirm <adoption-id> --json`; successful confirms record `commandKind: "adoption-confirm"` and return refreshed active goal, events, runs, operations, and next action without merge, push, tag, publish, or approval/release event registration. v31 changes the Main Verification Readiness projection so it reads only `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, `goal-closeout-report.v1`, `goal-operation-runs.v1`, and `symphony.console-adoption-inspect` when a frozen adoption plan exists. The projection shows reviewer verdict, adoption-confirm status, inspect state, blockers, copy-only verification commands, and ignored inference sources; it does not derive readiness from branch names, file names, commit messages, prompt text, task titles, command text, or frontend state. v31 also adds `controlled-verification-run-confirmation.v1` for a fixed main verification command suite recorded in `goal-operation-runs.v1` with per-command status, stdout/stderr summaries, exit codes, operation artifact refs, and `gatePassed: false`. The same v31 Workbench projection renders a `MainVerificationEvidenceDraft` from the latest verification operation plus explicit goal/task/run, worker evidence, review evidence, adoption operation, and existing main-verification refs. The draft requires operator/reviewer checking and does not write files, read evidence bodies, declare passed, or register the `main-verification` gate. v32 adds `ReleaseBaselineResolver` inside release closeout. It is backed by `/api/readiness` git/GitHub command output for current branch, main HEAD, origin/main, worktree cleanliness, and PR/CI ref; dirty or non-main baselines show stop/fix guidance instead of a release-ready form. v32 also upgrades the release checklist so each required gate row shows copy-only validation commands, latest explicit gate evidence refs, and controlled `symphony goal gate` dry-run/plan-hash confirm forms for passed or failed gate events. v32 adds display-only release/tag evidence drafts that expose release evidence ref, tag evidence ref, target commit, release notes summary, per-gate command/result fields, tag recommendation, and a copy-only `git tag -a <tag> <commit> -m "<release>"` command. v32 also adds `NextVersionHandoffDraft` inside release closeout. It derives copy-only next-version context from `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, `goal-progress-ledger.v1`, the latest run id, release/tag evidence draft refs, and implemented Workbench capability flags. The drafts do not write files, read evidence bodies, run tag/push/publish commands, create the next managed goal, enter the next version, or declare release readiness. v29, v30, v31, and v32 are published as repository release tags. Existing contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only except the v21 controlled goal event confirm route, the v23 Workbench operation registry writes performed by goal event preview/confirm routes, the v29 controlled implementation confirm route that accepts only the preview plan context and records the resulting controlled implementation operation, the v30 adoption freeze/confirm routes that accept only scoped adoption context, and the v31 controlled verification confirm route that accepts only fixed suite context; unsupported non-GET HTTP requests return `405`.
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
- v21 Workbench dry-run preview uses `GET /api/goals/<goal-id|latest>/event-plan-preview`. It accepts only `command=update`, `command=review`, or `command=gate` plus that command's required goal event fields. It returns `goal-update-plan.v1` with an additive `eventSummary`; it does not run shell commands, accept arbitrary commands, append events, infer approval, or declare release readiness. v21 confirm uses `POST /api/goals/<goal-id|latest>/event-plan-confirm`; it accepts only JSON for the same three commands with the dry-run `planHash`, calls the matching goal command confirm implementation, appends one managed event, and returns refreshed goal progress/events/next-action contracts.
- v23 Workbench goal operation tracking records operation id, goal id, task id, role, command kind, status, and timestamps in `goal-operation-runs.v1`. Preview writes `dry-run-planned` to the operation registry, not to the goal event journal. Confirm appends the explicit goal event and updates the same operation id to `confirmed`; this registry is not evidence for approval, main verification, or release readiness. v29 extends the same registry with `commandKind: "implementation"` for controlled `symphony do --confirm-plan` runs and stores optional `output`, `runResult`, `artifactRefs`, `verifierSummary`, and `failureReason` fields. v30 adds `commandKind: "adoption-plan"` for frozen adoption plan operations and `commandKind: "adoption-confirm"` for controlled adoption confirmations. v31 adds `commandKind: "verification"` for controlled verification command suites and may use `status: "running"` before recording `confirmed` or `failed`.
- v27 Review Workspace is a frontend projection with one controlled write path. It combines active runbook task data, event-backed worker evidence refs, latest run source metadata, changed files, reviewer prompt text, reviewer handoff details, review checklist items, expected reviewer verdict events, and `symphony goal review` verdict registration forms. Reviewer handoff details come from the goal prompt route/command for `role=reviewer`, record the review evidence path, and mark that reviewer id must differ from the latest worker actor. Verdict registration may append only `reviewer.approved` or `reviewer.needs-revision` through the existing dry-run preview and plan-hash confirm endpoint. It does not read evidence bodies, open source workspaces, run shell commands, start agents, or infer approval from source run, file names, branch names, commit messages, or frontend state.
- v29 `GET /api/goals/<goal-id|latest>/implementation-plan-preview?task=<task-id>` accepts only `task`. It builds `controlled-implementation-plan-preview.v1` from the managed runbook, `goal-next-action.v1`, `goal-prompt-pack.v1` worker prompt, and scoped `goal-event-log.v1`. The preview exposes only active task constraints, worker prompt, goal/task/evidence refs, existing allowlist fields, plan id/hash, and safety flags. It rejects prompt/path/command/confirm/planHash input, does not run `symphony do`, does not create an isolated workspace run, does not call models, and does not infer approval/readiness from filenames, branches, prompts, titles, or frontend state.
- v29 `POST /api/goals/<goal-id|latest>/implementation-run-confirm` accepts only `goalId`, `taskId`, `planId`, and `planHash` from the matching preview. It recomputes the same preview context, rejects mismatched plan ids/hashes and unsupported fields before run start, then maps to the existing `symphony do --confirm-plan <plan-id> --json` isolated workspace semantics. Successful confirms return `operationRun` and refreshed `goal-operation-runs.v1` data; the Active Goal Operations panel and Implementation panel read the same registry entry for run status, output summary, artifacts, verifier status, changed-file count, and failure reason. It does not accept arbitrary shell commands, paths, prompts, model options, merge/push/tag options, approval fields, verification fields, or readiness fields.
- v29 worker evidence handoff is projected from the latest confirmed `commandKind: "implementation"` operation for the active goal/task. It requires `mainWorktreeWrites: false`, isolated workspace writes, and a managed evidence artifact ref; source workspace fields are displayed when the confirmed run exposes them. The handoff pre-fills the existing `symphony goal update --event worker.evidence-recorded` form and uses the existing event-plan preview and confirm endpoints; it does not read evidence bodies, open local files, run shell commands, start agents, approve review, mark main verification, merge, push, tag, or infer readiness from artifact names.
- v31 `POST /api/goals/<goal-id|latest>/verification-run-confirm` accepts only `goalId`, `taskId`, and `suiteId=v31-main-verification-command-suite`. It recomputes the active goal/task runbook context, runs only `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and exact active-goal JSON reads already allowed by the preview, and records the same operation id from `running` to `confirmed` or `failed`. The response includes `controlled-verification-run-confirmation.v1`, per-command status, stdout/stderr summaries, exit codes, operation artifact refs, refreshed operations, and safety fields showing that success does not pass the main-verification gate. It rejects arbitrary command text, shell fields, model options, merge/push/tag options, approval fields, and release-readiness fields.
- v31 `MainVerificationEvidenceDraft` is a Workbench projection under Main Verification Readiness. It derives markdown draft text from the latest `commandKind: "verification"` operation for the active goal/task, the active goal/task refs, worker and review evidence refs, adoption operation refs when present, latest run id/status, and any existing main-verification event refs. The active Workbench model exposes those values through explicit `verification`, `refs`, `adoptionRefs`, `copyOnlyGateDryRun`, and `markdown` fields rendered by the draft panel. It is not a managed artifact writer: it does not read evidence document bodies, write files, download artifacts, execute commands, invoke models, merge, push, tag, self-approve, declare passed, or register `main-verification`.
- v32 `ReleaseBaselineResolver` is a Workbench projection inside release closeout. It reads only `/api/readiness` git/GitHub command outputs plus existing goal closeout/progress/event fields, then displays current branch, current HEAD, `main` HEAD, `origin/main`, worktree cleanliness, and latest PR/CI ref. Dirty worktrees, non-`main` branches, unavailable git baseline output, or diverged `main` / `origin/main` refs block the `release.ready` form and show stop/fix guidance only. The same closeout projection lists release gates for `pnpm check`, `pnpm test`, `pnpm workbench:build`, `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, `git diff --check`, `pnpm mcas doctor`, docs updated, and tag evidence, then records each gate only through the existing goal gate preview/confirm flow. It does not run shell commands in the browser, merge, push, tag, publish, or infer release readiness from branch names or command text.
- v32 `ReleaseEvidenceDraftWriter` and `TagEvidenceDraftWriter` are Workbench projections inside release closeout. They read only `goal-closeout-report.v1`, `ReleaseBaselineResolver`, `goal-event-log.v1`, and release checklist fields. The release draft shows release evidence ref, tag evidence ref, target commit, target commit source, release notes summary, and command/result rows for each release gate. The tag draft shows tag recommendation, target commit, latest `release.tag-evidence` event/ref, release notes summary, copy-only tag command, and explicit command/result fields with `not-run-by-workbench` when the browser has not run anything. These drafts do not read evidence bodies, write evidence files, run shell commands, create tags, push tags, publish releases, merge branches, self-approve, declare `release.ready`, or infer status from branch names, filenames, commit messages, prompt text, task titles, or frontend state.
- v32 `NextVersionHandoffDraft` is a Workbench projection inside release closeout. It reads only the active closeout report, release baseline resolver, release/tag evidence draft models, event log, progress ledger, latest run id, and already-rendered Workbench capability flags. It shows the current goal id, release name, target commit, release-ready source, closeout missing count, task evidence anchors, release gate anchors, release/tag evidence refs, implemented capability states, and copy-only context commands for reading current contracts. It does not create a v33 managed goal, enter v33, write files, read evidence bodies, run commands, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, declare `release.ready`, or infer readiness from branch names, filenames, commit messages, prompt text, task titles, command text, or frontend-only state.

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
GET /api/goals/latest/operations
GET /api/goals/<goal-id>/operations
GET /api/goals/latest/event-plan-preview
GET /api/goals/<goal-id>/event-plan-preview
POST /api/goals/latest/event-plan-confirm
POST /api/goals/<goal-id>/event-plan-confirm
POST /api/goals/latest/verification-run-confirm
POST /api/goals/<goal-id>/verification-run-confirm
```

Preview routes accept only `GET`. Confirm routes accept only `POST` with `application/json`. Unknown goals and unsafe path segments return `error-envelope.v1`. Event plan preview query parameters are limited to the selected command shape; `path`, `confirm`, `planHash`, arbitrary command names, absolute paths, `file://`, `~/`, and encoded traversal do not trigger filesystem reads or shell execution. Confirm bodies are limited to the selected command shape plus `planHash`; unsupported fields are rejected. Evidence refs are identifiers only; the API, resolver, and Workbench do not read evidence document bodies.

## `goal-operation-runs.v1`

`goal-operation-runs.v1` records Workbench-started goal operation runs. It is a run-control registry for tracing a dry-run and confirm pair; it is not the evidence source for task approval, main verification, release gates, or release readiness.

```json
{
  "contractName": "goal-operation-runs.v1",
  "contractVersion": 1,
  "goalId": "v23-goal-operation-run-console",
  "storage": "managed-goal-operation-run-registry",
  "appendOnly": false,
  "operationCount": 1,
  "latestOperationId": "op_0000000000000000",
  "runs": [{
    "operationId": "op_0000000000000000",
    "goalId": "v23-goal-operation-run-console",
    "taskId": "task-1",
    "role": "worker",
    "commandKind": "update",
    "commandName": "symphony goal update",
    "status": "confirmed",
    "planHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    "eventIds": ["evt_task1_worker_evidence"],
    "source": "workbench.event-plan-confirm",
    "timestamps": {
      "startedAt": "2026-05-31T01:00:00.000Z",
      "updatedAt": "2026-05-31T01:01:00.000Z",
      "completedAt": "2026-05-31T01:01:00.000Z"
    }
  }]
}
```

Routes:

```text
GET /api/goals/latest/operations
GET /api/goals/<goal-id>/operations
```

Successful Workbench goal event preview responses include `operationRun` with `status: "dry-run-planned"`. Successful goal event confirm responses include `operationRun` with `status: "confirmed"` and the appended event id. Successful v29 implementation confirm responses include `operationRun` with `commandKind: "implementation"` plus the controlled run result, artifact refs, verifier summary, and failure reason when present. Successful v30 adoption freeze and confirm responses include `commandKind: "adoption-plan"` and `commandKind: "adoption-confirm"` respectively, with the frozen plan or confirmation run result and artifact refs. Successful v31 verification confirm responses include `commandKind: "verification"`, command status, stdout/stderr summaries, exit code, artifact refs, verifier summary, and `runResult.gatePassed: false`. The operation registry is managed state under `.symphony/goals/operations/` and is not a generic shell runner.

Workbench may poll the scoped operations route for the active goal to keep the operation console output current while a goal operation is in progress or just completed. This polling is a read-only refresh of managed operation and active-goal contracts; it does not execute commands, stream a terminal, append goal events, or infer approval/main-verification/release-ready state.

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

Workbench dry-run preview route:

```text
GET /api/goals/<goal-id|latest>/event-plan-preview?command=update&task=<task-id>&event=<worker-or-blocker-event>&actor=<actor-id>[&evidenceRef=<ref>]
GET /api/goals/<goal-id|latest>/event-plan-preview?command=review&task=<task-id>&reviewer=<reviewer-id>&verdict=approved|needs-revision&evidenceRef=<ref>
GET /api/goals/<goal-id|latest>/event-plan-preview?command=gate&gate=main-verification|release.ready|release.<gate>&status=passed|failed|declared&verifier=<verifier-id>&evidenceRef=<ref>[&task=<task-id>]
```

The route calls the same controlled plan builders used by `symphony goal update`, `symphony goal review`, and `symphony goal gate`. The response keeps `mode: "dry-run"`, `wouldAppend.writesInDryRun: false`, and `confirm.available: true` as copy-only text. The additive `eventSummary` repeats the event that would be appended and the returned `planHash`; it is display data, not completion state. v23 also adds `operationRun`, which identifies the Workbench operation and records the dry-run status without appending a goal event.

Workbench confirm route:

```text
POST /api/goals/<goal-id|latest>/event-plan-confirm
```

The JSON body must include `command`, `planHash`, and the same controlled fields used for the matching preview command. Confirm recalculates the plan hash through `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate`; mismatches are rejected and do not append. A successful response uses `goal-event-confirmation.v1` and includes `operationRun`, refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1` payloads.

Workbench event registration tests cover the operator paths that can change goal evidence:

- `command=update` confirms worker success and failure events, including `worker.self-check-passed` and `worker.self-check-failed`. The refreshed ledger decides the displayed task status from the appended event.
- `command=review` confirms `approved` and `needs-revision` verdicts. The same route rejects a reviewer id that matches the latest worker id for the task.
- `command=gate&gate=main-verification` confirms `status=passed` and `status=failed`. Missing task input is rejected before any append.
- Rejected preview or confirm requests return `error-envelope.v1` and leave the managed journal unchanged.

v23 console API tests cover the operation console paths for the latest goal workflow: successful dry-run preview with `operationRun.status: "dry-run-planned"`, successful plan-hash confirm with `operationRun.status: "confirmed"`, missing `planHash`, unknown goal refs, and unsupported subcommands. Rejected requests do not append goal events, do not create generic operation runs, and do not expose stack traces or local repository paths.

v25 worker evidence handoff appears only when the active goal id is `v25-controlled-implementation-lane` and the latest run is a confirmed isolated implementation run with `evidenceArtifactPath`, `sourceWorkspacePath`, `workspaceWrites: true`, and `mainWorktreeWrites: false`. The form uses a managed artifact evidence ref such as `artifact-ref:artifact:<run-id>:evidence`, shows both source paths as context, and routes preview/confirm through the existing goal update dry-run and plan-hash confirm APIs. It does not run shell commands, merge, tag, or expose reviewer approval from the worker role.

v29 worker evidence handoff uses the active goal operation registry instead of the v25 latest-run special case. When the active task still expects `worker.evidence-recorded` and `goal-operation-runs.v1` has a confirmed implementation operation for the same goal/task, Workbench pre-fills the worker actor, managed evidence artifact ref, operation id, run id, execution plan id, source workspace when present, and prompt handoff. The registration still routes through `GET /api/goals/<goal-id>/event-plan-preview?command=update...` and `POST /api/goals/<goal-id>/event-plan-confirm` with the returned plan hash. Dry-run does not append events; confirm appends only the worker evidence event.

v30 Adoption Candidate Panel reads implementation records from `goal-operation-runs.v1` when available and falls back to `symphony.console-runs`. It lists adoptable rows only when the backend record has `status: "passed"`, verifier passed status, isolated workspace refs, `mainWorktreeWrites: false`, `sourceWorkspacePath`, `sourceWorkspaceManifestPath`, `sourceWorkspaceFingerprint`, and a managed evidence artifact ref. Runs that fail those explicit checks stay visible as blocked rows with the missing or failed field named. The panel does not use branch names, file names, commit messages, prompt text, task titles, or frontend heuristics to decide adoption status. It does not call `symphony adopt`, freeze a patch, inspect recovery state, confirm adoption, merge, tag, or infer reviewer approval, main verification, or release readiness.

v30 Adoption Plan Preview Workspace uses:

```text
POST /api/goals/<goal-id|latest>/adoption-plan-freeze
```

The JSON body may contain only `goalId`, `taskId`, `sourceRunId`, and `operationId`. The backend resolves the same active goal, requires the selected operation to be a confirmed implementation run for the same goal/task, and requires explicit adoption-candidate fields before calling existing `symphony adopt --run <sourceRunId> --json`. Successful freezes return `controlled-adoption-plan-freeze.v1`, record `commandKind: "adoption-plan"` in `goal-operation-runs.v1`, and show `adoptionPlanId`, patch artifact, patch hash, changed files, file operations, source workspace fingerprint, project/git fingerprints, inspect command, and frozen confirm command. This route does not accept prompts, arbitrary paths, shell commands, plan hashes, adoption confirm input, model options, merge/push/tag options, approval fields, main verification fields, or release readiness fields.

v30 Adoption Inspect and Recovery View uses the existing inspect route:

```text
GET /api/adoptions/<adoption-id>/inspect
```

The frontend derives `<adoption-id>` only from the active-goal `goal-operation-runs.v1` adoption-plan operation. The route returns `symphony.console-adoption-inspect`, generated by the same builder as `symphony adopt --inspect <adoption-id> --json`. Workbench displays journal status, latest confirmation run, adoption plan refs, patch refs, patch hash, file operation before/after hashes, current worktree after-hash matches, current worktree journal-before-file matches, source run refs, source evidence refs, and copy-only recovery commands. The inspect route is read-only: it does not accept arbitrary adoption ids, local paths, shell commands, prompt text, plan hashes, adoption confirm/apply fields, model options, merge/push/tag options, approval fields, main verification fields, or release readiness fields.

v30 controlled adoption confirm uses:

```text
POST /api/goals/<goal-id|latest>/adoption-confirm
```

The JSON body may contain only `goalId`, `taskId`, `adoptionPlanId`, and `operationId`. The backend resolves the same active goal, requires a confirmed `commandKind: "adoption-plan"` operation for the same goal/task/adoption id, checks that frozen plan and patch refs are present, and then calls existing `symphony adopt --confirm <adoption-id> --json`. Successful confirms return `controlled-adoption-confirmation.v1`, record `commandKind: "adoption-confirm"` in `goal-operation-runs.v1`, and include refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-operation-runs.v1`, `symphony.console-runs`, and `goal-next-action.v1`. The route rejects prompt text, arbitrary paths, shell commands, plan hashes, model options, merge/push/tag options, approval fields, main verification fields, and release readiness fields. It applies only the frozen adoption patch through the existing adoption CLI and does not merge, push, tag, publish, self-approve, or append reviewer/main/release events.

v30 adoption evidence bridge is documentary evidence for the verified workflow. Worker evidence, route-safety tests, Workbench build output, and release evidence docs can cite adoption candidate, freeze, inspect, and confirm contracts, but those refs do not become reviewer approval, main verification, release gate status, or release readiness. `controlled-adoption-confirmation.v1` may report `mainWorktreeWrites: true` for the existing adoption CLI apply step while also reporting `reviewerEventRegistered: false`, `mainVerificationEventRegistered: false`, and `releaseReadinessRegistered: false`.

v31 Main Verification Readiness appears in the active goal Workbench path. It selects the task from `goal-next-action.v1` when the next role or phase is main verification, otherwise from event-backed `goal-progress-ledger.v1` tasks with reviewer approval and missing main verification. The readiness decision requires explicit `reviewer.approved` or the equivalent event-backed goal-status verdict, no blocking `reviewer.needs-revision` or `main.verification-failed` event, and no pending adoption plan for the same goal/task. If `goal-operation-runs.v1` contains a confirmed `adoption-plan` operation for that task, the panel waits for a confirmed `adoption-confirm` operation with passed run state; when an inspect contract is available for the same adoption id, it displays journal and current-worktree match fields as evidence context. The panel exposes blockers, state sources, ignored inference sources, validation commands, and a copy-only `symphony goal gate --gate main-verification` dry-run command with an operator-supplied evidence ref. It does not execute merge or validation commands, write evidence, register a gate, open local files, download artifacts, call models, self-approve, or treat adoption evidence as reviewer approval.

v31 also adds `AllowlistedVerificationPlanPreview` under the readiness projection. The preview always includes only the fixed verification commands `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`, plus task-scoped controlled context commands that exactly match the active goal's `goal-status` or `goal next` JSON reads. The preview carries goal id, task id, latest run id/status, worker/review evidence refs, adoption operation refs, and any existing main verification ref so the operator can see what context the commands belong to. Unsupported runbook or next-action command text is counted as rejected display data and is not copied into the executable list.

v31 `POST /api/goals/<goal-id|latest>/verification-run-confirm` accepts only `goalId`, `taskId`, and `suiteId: "v31-main-verification-command-suite"`. The backend re-reads the managed runbook, expands only the fixed command suite plus allowed active-goal JSON read commands, records a running `verification` operation, then records the final command result contract as `confirmed` or `failed`. The response contract is `controlled-verification-run-confirmation.v1`. It does not accept arbitrary shell commands, prompts, paths, model options, merge/push/tag fields, approval fields, or gate fields. Passing commands do not append goal events and do not mark `main-verification` passed.

v31 `MainVerificationGateRegistration` connects the existing `symphony goal gate --gate main-verification --status passed` dry-run and confirm contract to the Verification path. The model is built from `main-verification-evidence-draft.v1`, `goal-operation-runs.v1`, `goal-event-log.v1`, and `goal-update-plan.v1`. It becomes available only when readiness is true, the evidence draft is `draft-ready`, the target evidence ref is present, the controlled verification run passed, command results exist, and no main verification ref already exists. The rendered form pre-fills `gate=main-verification`, `status=passed`, the active task, and the target evidence ref; gate and status are fixed to that allowlisted path, while the operator still supplies the verifier id. Confirm requires the dry-run plan hash and appends only the backend event. It does not write evidence, read evidence bodies, rerun commands, merge, push, tag, publish, declare release readiness, or treat command success as a gate.

The browser accepts no command input, starts no shell outside this controlled suite, writes no goal events from verification, invokes no models, and does not infer readiness from filenames, branches, prompts, task titles, or copied command text.

v27 Review Workspace appears inside the active goal Workbench path. It uses the selected active task from `goal-next-action.v1` when present, then displays source run id, source workspace fields, worker evidence ref, changed files, copy-only reviewer prompt, reviewer handoff details, checklist items from runbook/prompt guidance, and the expected `reviewer.approved` / `reviewer.needs-revision` verdict events. The reviewer handoff details come from the goal prompt route/command for `role=reviewer`, include the review evidence path, and expose the reviewer/worker separation requirement. The expected verdict command is display text for terminal dry-run review registration. It is not a browser review approval path and does not replace the controlled `goal review` preview/confirm flow.

The browser may render the returned `eventSummary`, refreshed progress, refreshed events, and refreshed next action. It must not create a local approval, verification, or release-ready state from form selections, evidence filenames, branch names, commit messages, or copied commands.

v27 closes the review/revision loop through `goal-next-action.v1` and `goal-prompt-pack.v1`:

- `reviewer.approved` makes the next task action `role: "main-verifier"` with `phase: "main-verification"`.
- `reviewer.needs-revision` makes the next task action `role: "worker"` with `phase: "revision"` and lets `goal prompt --next` render the revision prompt from the failure event, evidence refs, failed commands, latest run changed files, and runbook acceptance.
- `main.verification-failed` follows the same revision prompt path, with failed commands from the gate event or latest failed run.
- A newer revision `worker.evidence-recorded` event supersedes the earlier failed review or failed main verification for next-action routing. The task returns to `role: "reviewer"` for a second independent review; prior approval, branch names, file names, commit messages, and prompt text do not move it to main verification.

The loop does not add a shell runner, permission framework, goal framework, artifact framework, automatic merge, automatic tag, or release-ready inference.

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
- v28 Workbench derives `ReleaseCloseoutWorkspaceModel` from `goal-closeout-report.v1`, runbook, ledger, event log, and latest run identifiers. The model can show release verification checklist rows, copy-only release gate registration commands, a `release.ready` dry-run/confirm form, and a tag evidence prompt. It does not execute checklist commands, create evidence files, merge, tag, or infer release-ready from command text.
- v32 adds `ReleaseBaselineResolver` to the same closeout model. It displays current branch, current HEAD, main HEAD, origin/main, worktree cleanliness, and latest PR/CI ref from `/api/readiness`. Dirty worktrees, non-`main` branches, unavailable git baseline output, or diverged main/origin refs block the `release.ready` form and show stop/fix guidance only. v32 release checklist rows also include latest explicit gate evidence refs and fixed `goal gate` forms for recording `release.gate-passed` or `release.gate-failed`; the forms append only through `goal-update-plan.v1` preview and confirm. Release/tag evidence drafts display target commit, release notes summary, command-result fields, tag recommendation, and a copy-only tag command without writing files, tagging, pushing, publishing, or declaring release readiness.
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
      "currentHead": "abc1234full",
      "mainHead": "abc1234",
      "originMainHead": "abc1234",
      "dirty": false,
      "dirtyFilesCount": 0,
      "dirtyPaths": [],
      "commands": {
        "branch": "git branch --show-current",
        "head": "git rev-parse --short HEAD",
        "currentHead": "git rev-parse HEAD",
        "mainHead": "git rev-parse --short main",
        "originMainHead": "git rev-parse --short origin/main",
        "worktreeStatus": "git status --short"
      }
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
