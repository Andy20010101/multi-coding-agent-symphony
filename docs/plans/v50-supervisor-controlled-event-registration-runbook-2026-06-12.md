# v50 Supervisor Controlled Event Registration Runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v50-supervisor-controlled-event-registration`
Branch draft: `codex/v50-supervisor-controlled-event-registration-runbook`
Baseline checked for planning: `main`, `origin/main`, and `v49` at `9dafad52288c9268558da2a4f65df9b4314659d3`
GitHub Release: `v49: Context Session Observability and Supervisor Advisory`

## Reconcile

| Check | Result |
| --- | --- |
| `git status --short --branch` | Started from detached `HEAD`, then created `codex/v50-supervisor-controlled-event-registration-runbook` from `origin/main` after reconcile. |
| `git fetch origin main --tags --prune` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -8 origin/main` | `9dafad5` was `HEAD`, `tag: v49`, `origin/main`, `origin/HEAD`, and `main`; it merged PR #61. The next commits were `840c50e`, `9bd2f72`, `aab659c`, `0c2cfc6`, `ab0ac0a`, `668c504`, and `77a78f2`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `git tag --list 'v49'` | `v49` |
| `gh release view v49 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Release `v49: Context Session Observability and Supervisor Advisory`, URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v49`, not draft, not prerelease, published at `2026-06-12T04:38:28Z`, assets `[]`, targetCommitish `main`. |

Files checked before writing this runbook:

- `/Users/andy/.codex/skills/report-writing-no-slop/SKILL.md`
- `docs/plans/v49-context-session-observability-supervisor-advisory-runbook-2026-06-12.md`
- `docs/plans/v49-context-session-observability-supervisor-advisory-closeout-snapshot-2026-06-12.md`
- `docs/plans/v49-context-session-observability-supervisor-advisory-release-prep-2026-06-12.md`
- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/thread-continuation-decision.js`
- `src/symphony/goal-supervisor/policy.js`
- `src/symphony/goal-update.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-shell.test.js`
- `tests/workbench-api-client.test.js`
- `tests/v44-goal-supervisor-app-read-model.test.js`

No repository `AGENTS.md` file was present in this worktree or in `/Users/andy/Documents/project/multi-coding-agent-symphony` at planning time. The thread-provided AGENTS report-writing instructions apply to this document.

## Objective

v50 connects the v49 supervisor advisory surface to the existing goal event dry-run and `planHash` confirm channel. The first Workbench state advancement path is event registration for a supervisor-recommended worker or blocker event.

The implementation should start from `threadContinuationDecision.v1`, especially the `checkpoint` case where a pending result is ready for registration. Workbench should show whether the current supervisor state is eligible, show the exact event plan preview returned by the backend, and show the append result returned after confirm.

The event append path must use existing controlled command semantics:

- preview through the existing goal event plan preview path;
- confirm through the existing goal event plan confirm path;
- append only after the submitted `planHash` matches the preview input;
- refresh the displayed goal progress, event log, next action, closeout state, and supervisor state after confirm.

v50 does not authorize provider execution, transcript compaction, new thread creation, release automation, child dispatch, or direct frontend file access.

## Existing Baseline

v49 is already merged and tagged. It provides these backend-owned contracts in the supervisor route:

- `sessionSourceInventory.v1`
- `contextAdvisory.v1`
- `threadContinuationDecision.v1`
- `goal-supervisor-app-read-model.v1`

`src/symphony/goal-supervisor/app-read-model.js` normalizes the v49 contracts for Workbench. It returns `readOnly: true`, `willMutate: false`, and a command boundary with `executionAvailable: false`.

`src/symphony/goal-supervisor/thread-continuation-decision.js` can return `checkpoint` with `reason: result-awaits-registration`, a `checkpointRef`, `requiredEvidence`, and copy-only command boundary data. It does not append events.

`src/symphony/goal-supervisor/policy.js` defaults command execution to disabled and blocks provider CLI, real CLI, generic shell, daemon launch, child dispatch, goal ledger write, event-log write, mutation gate, audit, tag, push release, publish release, GitHub Release, and release closeout command families.

`src/symphony/goal-update.js` is the narrow worker/blocker event path. It supports only:

- `worker.started`
- `worker.evidence-recorded`
- `worker.self-check-passed`
- `worker.self-check-failed`
- `blocker.opened`
- `blocker.resolved`

`src/symphony/goal-review.js` owns reviewer verdicts. It records only `reviewer.approved` and `reviewer.needs-revision` through `symphony goal review`.

`src/symphony/goal-gate.js` owns main verification and release gate events. It maps `main-verification` to `main.verification-passed` or `main.verification-failed`; release gates stay under `release.*`.

`src/symphony/console.js` already exposes:

- `GET /api/goals/<goal-id>/event-plan-preview`
- `GET /api/goals/latest/event-plan-preview`
- `POST /api/goals/<goal-id>/event-plan-confirm`
- `POST /api/goals/latest/event-plan-confirm`

The preview path returns `goal-update-plan.v1` and records an operation with source `workbench.event-plan-preview`. The confirm path returns `goal-event-confirmation.v1`, writes through the existing append-only goal event journal, records source `workbench.event-plan-confirm`, and refreshes `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1`.

`frontend/workbench/src/api/client.js` already has `fetchGoalEventPlanPreview` and `confirmGoalEventPlan`. These helpers use `GET` for preview and `POST` with JSON for confirm.

`frontend/workbench/src/App.jsx` already has a `GoalEventPlanPreview` component outside the supervisor route. It currently uses the labels `Preview dry-run plan` and `Confirm event append`; v50 supervisor UI must use the allowed labels listed in this runbook.

`tests/v44-goal-supervisor-app-read-model.test.js` verifies that supervisor contracts remain read-only and that command previews do not enable execution.

`tests/workbench-api-client.test.js` verifies that the supervisor route is GET-only and that goal event preview and confirm use the controlled contracts.

`tests/workbench-shell.test.js` currently bans `fetch`, `confirmGoalEventPlan`, `GoalEventPlanPreview`, buttons, forms, textareas, local session paths, JSONL paths, and shell execution from `frontend/workbench/src/v46SupervisorWorkbench.jsx`. v50 needs focused changes to that supervisor surface and tests that keep the new event lane bounded.

## Boundary Decision

Supervisor advice may recommend an event registration. It may not become a general action runner.

Allowed state transition for v50:

- Use the existing event plan preview route for an eligible supervisor event.
- Use the exact `planHash` from that preview for confirm.
- Confirm through the existing event plan confirm route.
- Append one controlled goal event through the existing backend command implementation.
- Refresh supervisor state after a successful confirm.

The initial supervisor-owned eligibility path should target worker/blocker events handled by `symphony goal update`. Reviewer verdicts and gate events remain explicitly routed to their existing command families and must not be repackaged as worker updates.

Do not put `main.verification-passed` into `symphony goal update`. Main verification and release gates must stay behind `symphony goal gate`.

Do not register reviewer verdicts through `symphony goal update`. Reviewer verdicts must stay behind `symphony goal review`.

## Allowed Scope

Implementation PRs may:

- Add a backend-owned `supervisorEventRegistrationEligibility.v1` projection.
- Project eligibility from `threadContinuationDecision.v1`, `pendingResult`, current task state, command boundary, and existing goal event definitions.
- Expose a Workbench event plan preview lane only when eligibility is present and bounded.
- Reuse the existing `GET /api/goals/<goal-id>/event-plan-preview` route.
- Reuse the existing `POST /api/goals/<goal-id>/event-plan-confirm` route.
- Show the returned `goal-update-plan.v1` fields needed for review: command name, event type, actor, task id, evidence refs, dry-run write status, append target, operation id, and `planHash`.
- Show the returned `goal-event-confirmation.v1` fields needed after append: status, written flag, event id, sequence, event hash, operation id, and refreshed contract names.
- Add `Refresh Supervisor State` to reread backend contracts after preview or confirm.
- Add focused tests for eligibility projection, preview request construction, confirm body construction, append-only behavior, and supervisor UI boundaries.
- Refresh generated Workbench assets only in the PR that changes Workbench source and only after `pnpm workbench:build`.

## Forbidden Scope

v50 must not add:

- child dispatch;
- provider launch;
- generic shell execution;
- transcript compaction;
- new thread creation;
- terminal controls;
- model invocation;
- daemon start or stop;
- direct frontend reads of local JSONL, session files, `.symphony`, goal ledgers, event logs, runner internals, provider transcripts, or local provider folders;
- frontend file picker or directory picker;
- git writes, merge, tag, push, publish, release automation, or GitHub Release creation;
- result escrow consumption;
- result registration outside the controlled goal event preview and confirm path;
- `main.verification-passed` through `symphony goal update`;
- reviewer verdicts through `symphony goal update`;
- UI buttons or visible commands labeled `Run`, `Execute`, `Continue`, `Compact`, `New Thread`, `Dispatch`, or `Launch`.

Allowed UI labels for the new supervisor event lane:

- `Preview Event Plan`
- `Confirm Event Append`
- `Refresh Supervisor State`

## Contract Direction

### `supervisorEventRegistrationEligibility.v1`

Purpose: decide whether a supervisor continuation recommendation can be turned into a controlled event registration preview.

Required fields:

- `contractName`: `supervisorEventRegistrationEligibility.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `willMutate`: `false`
- `goalId`
- `taskId`
- `threadId`
- `sourceContracts[]`
- `state`: `eligible`, `blocked`, `not-applicable`, or `unknown`
- `reason`
- `recommendedEvent`
- `allowedEvents[]`
- `blockedEvents[]`
- `requiredInputs[]`
- `missingInputs[]`
- `previewRequest`
- `confirmRequestShape`
- `boundaries`

`sourceContracts[]` should include `goal-supervisor-app-read-model.v1`, `threadContinuationDecision.v1`, `contextAdvisory.v1`, and any goal event source used by the projection.

`recommendedEvent` fields:

- `eventType`
- `command`: `update`, `review`, or `gate`
- `commandName`: existing command name such as `symphony goal update`
- `actorRole`
- `actorId` when known
- `taskId`
- `evidenceRefs[]`
- `statement`
- `branch`
- `commit`
- `blocker` when applicable
- `sourceReason`

For the initial v50 supervisor path, `recommendedEvent.command` should be `update` unless a later PR deliberately extends this runbook. If `threadContinuationDecision.v1` points at review or gate work, eligibility should return `blocked` or `not-applicable` with the expected command family, not silently rewrite the event.

Allowed `symphony goal update` event types:

- `worker.started`
- `worker.evidence-recorded`
- `worker.self-check-passed`
- `worker.self-check-failed`
- `blocker.opened`
- `blocker.resolved`

Blocked examples:

- `reviewer.approved`: route to `symphony goal review`.
- `reviewer.needs-revision`: route to `symphony goal review`.
- `main.verification-passed`: route to `symphony goal gate`.
- `main.verification-failed`: route to `symphony goal gate`.
- `release.gate-passed`, `release.gate-failed`, and `release.ready-declared`: route to `symphony goal gate`.

`previewRequest` fields:

- `method`: `GET`
- `route`: `/api/goals/<goal-id>/event-plan-preview`
- `query.command`
- `query.task`
- `query.event`
- `query.actor`
- `query.evidenceRef[]`
- `query.statement`
- `query.branch`
- `query.commit`
- `query.blockerId`
- `query.blockerReason`
- `query.blockerSeverity`

`confirmRequestShape` fields:

- `method`: `POST`
- `route`: `/api/goals/<goal-id>/event-plan-confirm`
- `contentType`: `application/json`
- `requiredBodyFields`: `command`, `planHash`, `task`, `event`, `actor`
- `optionalBodyFields`: `evidenceRef`, `evidenceRefs`, `statement`, `branch`, `commit`, `blockerId`, `blockerReason`, `blockerSeverity`
- `confirmUsesPlanHash`: `true`

Boundaries:

- `dryRunWrites`: `false`
- `confirmWritesAppendOnly`: `true`
- `genericShellRunner`: `false`
- `providerLaunchAvailable`: `false`
- `childDispatchAvailable`: `false`
- `frontendFileReadAvailable`: `false`
- `transcriptCompactAvailable`: `false`
- `newThreadAvailable`: `false`
- `gitWriteAvailable`: `false`
- `releaseAutomationAvailable`: `false`

### Event Plan Preview Lane

Purpose: let the operator inspect the backend plan before any event append.

The lane should call the existing preview endpoint only after `supervisorEventRegistrationEligibility.v1.state` is `eligible` and required inputs are present.

Expected preview response:

- `contractName`: `goal-update-plan.v1`
- `mode`: `dry-run`
- `planHash`
- `command.name`
- `command.intent`
- `actor`
- `proposedEvents[]`
- `validation`
- `preconditions`
- `wouldAppend`
- `ledgerPreview`
- `confirm`
- `safety`
- `operationRun`
- `eventSummary`
- `previewEndpoint`

Display fields:

- event type;
- task id;
- actor role and id;
- evidence refs;
- statement when present;
- blocker fields when present;
- `writesInDryRun`;
- append target;
- operation id and operation status;
- `planHash`;
- copy-only confirm command.

The preview lane must not:

- append an event;
- call `POST /event-plan-confirm`;
- infer eligibility from branch names, commit messages, filenames, or raw transcript text;
- create a shell command runner;
- show provider launch, dispatch, compact, or new-thread controls.

### Event Confirm Result Display

Purpose: show what was appended after the operator confirms the exact preview by `planHash`.

The confirm action should submit only the body allowed by the existing confirm route. It must not accept arbitrary command text.

Expected confirm response:

- `contractName`: `goal-event-confirmation.v1`
- `mode`: `confirm`
- `status`
- `written`
- `appendOnly`
- `planHash`
- `command`
- `operationRun`
- `eventSummary`
- `refreshed.progress`
- `refreshed.events`
- `refreshed.nextAction`
- `refreshed.closeout`
- `confirmEndpoint`
- `safety`

Display fields:

- operation id and operation status;
- append status;
- written flag;
- event type;
- event id;
- sequence;
- event hash;
- refreshed contract names;
- refreshed next action summary;
- refreshed supervisor state after `Refresh Supervisor State`.

The confirm result display must not claim that review, main verification, release readiness, merge, tag, publish, or release creation happened unless the returned event contract records that exact event through the correct command family.

## PR Breakdown

### PR-0 Runbook

Scope:

- Add this v50 runbook.
- Record reconcile, objective, baseline, boundary, contract direction, PR split, validation, rollback, review checklist, and model policy.

Forbidden scope:

- Runtime code.
- Frontend code.
- Tests.
- Generated assets.
- Tags.
- Releases.
- GitHub Release work.
- Merge.

Validation:

```text
git diff --check
```

### PR-1 Supervisor Event Eligibility Projection

Scope:

- Add `supervisorEventRegistrationEligibility.v1` in backend supervisor code.
- Derive eligibility from `threadContinuationDecision.v1`, `pendingResult`, task id, event type, actor, evidence refs, and command boundary.
- Mark worker/blocker `symphony goal update` events eligible only when required fields are present.
- Mark reviewer verdicts as routed to `symphony goal review`.
- Mark main verification and release gates as routed to `symphony goal gate`.
- Preserve read-only projection fields and blocked reasons.
- Add fixtures for eligible worker evidence, blocker opened, missing evidence ref, reviewer verdict route, main verification route, release gate route, stale transcript, and missing transcript.

Forbidden scope:

- Event append.
- Preview or confirm API calls from Workbench.
- UI controls.
- Child dispatch.
- Provider launch.
- Transcript compact.
- New thread creation.
- Goal gate or review behavior changes.

Validation:

```text
node --test tests/v44-goal-supervisor-app-read-model.test.js
pnpm check
git diff --check
```

Add a focused backend test file for `supervisorEventRegistrationEligibility.v1` if the implementation creates a new module.

### PR-2 Workbench Dry-Run Preview Lane

Scope:

- Project `supervisorEventRegistrationEligibility.v1` into the Workbench supervisor model.
- Add a supervisor event plan preview lane that calls `fetchGoalEventPlanPreview` only for eligible events.
- Render `Preview Event Plan`.
- Display the returned `goal-update-plan.v1` preview and copy-only confirm command.
- Keep preview as `GET`, with no request body and no write in dry-run.
- Keep the v49 supervisor panels visible.

Forbidden scope:

- Confirm append.
- Event journal write.
- Generic shell execution.
- Provider launch.
- Child dispatch.
- Transcript compact.
- New thread creation.
- Frontend local file or JSONL reads.
- Generated assets unless Workbench source changes require build output in this PR.

Validation:

```text
node --test tests/workbench-api-client.test.js
node --test tests/workbench-shell.test.js
pnpm check
git diff --check
```

If Workbench source changes require generated assets, run:

```text
pnpm workbench:build
```

### PR-3 Confirm Append-Only Event Registration

Scope:

- Add the supervisor confirm lane using the existing `confirmGoalEventPlan` client helper.
- Render `Confirm Event Append` only after a successful preview returns a `planHash`.
- Submit only the constrained JSON body for the eligible event.
- Display the returned `goal-event-confirmation.v1` result.
- Refresh goal progress, events, next action, closeout, and supervisor state after confirm.
- Add tests that rejected extra fields do not append and that failed preview or hash mismatch leaves event count unchanged.

Forbidden scope:

- Confirming review verdicts through `symphony goal update`.
- Confirming `main.verification-passed` through `symphony goal update`.
- Launching any provider.
- Running arbitrary commands.
- Dispatching children.
- Compacting transcripts.
- Creating threads.
- Git, tag, publish, release, or GitHub Release work.

Validation:

```text
node --test tests/workbench-api-client.test.js
node --test tests/workbench-shell.test.js
pnpm check
git diff --check
```

Run focused console route tests if this PR touches `src/symphony/console.js`.

### PR-4 Supervisor UX Integration

Scope:

- Place eligibility, preview, confirm result, and refresh status inside the Workbench supervisor route.
- Use only these button labels: `Preview Event Plan`, `Confirm Event Append`, `Refresh Supervisor State`.
- Show blocked reasons beside the lane when eligibility is `blocked`, `not-applicable`, or `unknown`.
- Keep `sessionSourceInventory.v1`, `contextAdvisory.v1`, and `threadContinuationDecision.v1` visible.
- Keep unsafe live supervisor payload quarantine.
- Keep direct links to local files out of the rendered HTML.
- Update screenshots or browser verification notes if the layout changes.

Forbidden scope:

- UI labels `Run`, `Execute`, `Continue`, `Compact`, `New Thread`, `Dispatch`, or `Launch`.
- Forms that submit outside the controlled client helper.
- Textareas for command input.
- Browser terminal surfaces.
- Frontend reads of JSONL or local session paths.
- Primary CTA that suggests provider execution or dispatch.

Validation:

```text
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

Run `pnpm workbench:build` if Workbench source changed and generated static assets are part of the repository diff.

### PR-5 Acceptance, Closeout, and Release Prep

Scope:

- Add v50 acceptance evidence.
- Add closeout snapshot.
- Add release-prep notes.
- Record merged PRs, validation commands, generated asset changes if any, residual risks, rollback path, and release note draft.

Forbidden scope:

- Runtime feature expansion.
- New event registration behavior.
- Tag creation.
- Release creation.
- GitHub Release creation.
- Publish automation.
- Merge automation.

Validation:

```text
node --test tests/v44-goal-supervisor-app-read-model.test.js
node --test tests/workbench-api-client.test.js
node --test tests/workbench-shell.test.js
pnpm check
git diff --check
```

## Validation Plan

PR-0 validation is docs-only:

```text
git diff --check
```

Implementation validation should include the focused command for the changed surface:

- eligibility projection: backend supervisor tests, `tests/v44-goal-supervisor-app-read-model.test.js`, `pnpm check`, `git diff --check`;
- preview lane: Workbench API client and shell tests, `pnpm check`, `git diff --check`;
- confirm lane: Workbench API client and shell tests plus focused console route tests if backend route code changes;
- Workbench layout changes: `pnpm workbench:build` when generated assets are required, plus screenshot or browser verification for `/workbench/supervisor/`;
- closeout: all focused tests from PR-1 through PR-4, `pnpm check`, `git diff --check`.

Acceptance conditions:

- `supervisorEventRegistrationEligibility.v1` is backend-owned, read-only, and does not expose raw transcript text.
- Eligibility uses supervisor contracts and explicit goal event state, not filenames, branches, commit messages, raw transcript text, or frontend heuristics.
- Preview returns `goal-update-plan.v1` and `writesInDryRun: false`.
- Confirm requires `planHash` and returns `goal-event-confirmation.v1`.
- Confirm appends only one controlled event for the submitted plan.
- Worker/blocker events use `symphony goal update`.
- Reviewer verdicts use `symphony goal review`.
- Main verification and release gates use `symphony goal gate`.
- Workbench supervisor route does not read local session files, JSONL files, `.symphony`, provider folders, or raw transcripts.
- Workbench supervisor route does not dispatch children, launch providers, compact transcripts, create threads, open terminals, write git state, tag, publish, or create releases.
- Supervisor UI uses `Preview Event Plan`, `Confirm Event Append`, and `Refresh Supervisor State` for this lane.

## Rollback Path

If PR-0 is wrong, revert this runbook and replace it before implementation starts.

If PR-1 produces unsafe eligibility, revert the eligibility projection and tests. The v49 supervisor route should continue to display advisory state without any event registration lane.

If PR-2 preview calls are wrong, revert the Workbench preview lane. Keep backend eligibility available for tests until the route wiring is corrected.

If PR-3 confirms the wrong event, accepts extra fields, skips `planHash`, or appends outside the existing goal event confirm path, revert the confirm lane and any backend route changes from that PR.

If PR-4 makes supervisor advice look like provider execution, dispatch, compaction, or new-thread creation, revert the UX integration and keep v50 backend contracts unavailable from the supervisor route until the UI is corrected.

If generated Workbench assets drift, rerun `pnpm workbench:build` from the intended source state and commit only the generated asset refresh tied to that source change.

If PR-5 closeout overstates shipped behavior, revert the closeout and release-prep docs and replace them before tagging.

## Review Checklist

- Reconcile records `main`, `origin/main`, open PR state, `v49` tag, and `v49` release state.
- PR-0 changes only the runbook.
- `supervisorEventRegistrationEligibility.v1` is read-only and backend-owned.
- Eligibility never reads provider session files from frontend code.
- Eligibility does not expose raw transcript text, raw JSONL, command stdout, prompt text, or secrets.
- Worker/blocker events are the only events allowed through `symphony goal update`.
- Reviewer verdicts stay behind `symphony goal review`.
- Main verification and release gates stay behind `symphony goal gate`.
- `main.verification-passed` is not accepted by `symphony goal update`.
- Preview uses the existing `GET /event-plan-preview` route.
- Confirm uses the existing `POST /event-plan-confirm` route.
- Confirm requires `planHash`.
- Dry-run preview does not append events.
- Confirm append remains append-only.
- Workbench does not add generic shell, terminal, provider launch, child dispatch, transcript compact, new thread, git, tag, publish, release, or GitHub Release controls.
- Workbench visible labels avoid `Run`, `Execute`, `Continue`, `Compact`, `New Thread`, `Dispatch`, and `Launch`.
- Tests cover blocked reviewer/gate routing and hash mismatch behavior.
- Generated assets are refreshed only in the PR that changes Workbench source.

## Cost/Model Policy

PR-0 planning was requested with `gpt-5.5` and reasoning effort `xhigh`. The local tool surface did not return token usage or cost.

Use Codex for v50 implementation PRs by default. Do not use Claude Code or Fable by default for v50. Each implementation PR should record provider, model, usage if returned, and cost if returned. If usage or cost is not returned, record that directly in the PR body or closeout note.

Do not spend provider/runtime execution budget on v50. This runbook does not authorize provider launch, child execution, transcript compaction, new thread creation, release automation, or GitHub Release creation.
