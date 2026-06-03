# Action Registry Migration Guide

## Purpose

v34 defines the action layer that later App surfaces consume. It is not an execution layer. The shared contract sequence is:

```text
action-manifest.v1 -> action-availability.v1 -> action-preview.v1 -> existing controlled confirmation contract
```

Every UI surface should render declared actions from the same backend contracts, then hand off to the next controlled backend step. No surface should build shell commands from button state.

## Contract Inputs

Use these contracts as the source for action display and preview:

- `action-manifest.v1`: action id, label, scope, role, availability resolver, capability preview contract, event mapping, evidence expectation, and disabled execution boundary.
- `action-availability.v1`: available, unavailable, or blocked state for the active goal/task, plus reasons, missing context, and required operator inputs.
- `action-preview.v1`: preview contract, confirmation contract, required inputs, plan-hash requirement, impact preview, endpoint safety, and boundary flags.
- `goal-update-plan.v1`: dry-run and plan-hash confirmation contract for goal event writes.
- `goal-progress-ledger.v1`, `goal-next-action.v1`, `goal-event-log.v1`, and `goal-runbook.v1`: source state for current goal/task, next role, evidence refs, and task progression.

## v35 Job Queue Handoff

v35 should create jobs from a controlled action preview, not from a frontend command string. The implementation remains read-only: it models job identity, dry-run creation, timeline/log refs, and run-control semantics, but it does not add a live job runner or persistent execution queue.

Required handoff fields:

- `goalId`
- `taskId`
- `action_id`
- `state`
- `requiredConfirmation.confirmationContract`
- `requiredConfirmation.requiredInputs`
- `requiredConfirmation.requiresPlanHash`
- `impactPreview.writesInPreview`
- `impactPreview.writesGoalEventOnConfirm`
- `boundaries.actionExecutionAvailable`
- `boundaries.jobQueueAvailable`

For v34, `boundaries.jobQueueAvailable` remains `false`. v35 adds explicit job contracts without changing the v34 Action Registry execution boundary:

- `job-model.v1` from `GET /api/jobs`
- `job-creation.v1` from `GET /api/jobs/create`
- `job-timeline-log-stream.v1` from `GET /api/jobs/timeline`
- `job-run-control.v1` from `GET /api/jobs/control`

A v35 job carries the original `goalId`, `taskId`, `action_id`, preview contract name, required inputs, plan hash requirement, source contract refs, and evidence refs so it can be audited against the same goal event log.

## Surface Consumption

Web Workbench:

- Reads `/api/actions/manifest`, `/api/actions/availability`, and `/api/actions/preview`.
- Renders action labels and preview fields from backend contracts.
- Reads `/api/jobs`, `/api/jobs/create`, `/api/jobs/timeline`, and `/api/jobs/control` for the v35 Job Console.
- Renders queue state, dry-run creation status, timeline/log counts, pause/cancel/resume/recover transition semantics, route health, and safety boundaries.
- Keeps controls display-only until a later controlled runner/confirm path exists.

Desktop Shell:

- Connects to the local sidecar and reads the same action routes.
- Does not bypass the sidecar with local shell execution.
- Shows job/action status from backend contracts once it consumes the v35 job routes.

Notch or menu bar:

- Uses compact action labels, state, and blocker reasons from `action-availability.v1`.
- Opens the full Workbench/Desktop view for required inputs or preview details.
- Does not execute actions directly from a menu item.

CLI:

- Keeps `symphony actions manifest`, `symphony actions availability`, and `symphony actions preview` as stdout-only inspection commands.
- Uses existing `symphony goal update`, `symphony goal review`, and `symphony goal gate` dry-run/confirm commands for append-only goal events.

## Migration Rules

- Treat `action_id` as the stable identifier. UI label text is display text, not a routing key.
- Treat `requiredInputs` as form field names supplied by the operator, not as file paths to read.
- Treat `state` and `reasons` as backend results. Do not infer availability from branch names, filenames, commit messages, task titles, prompt text, or frontend state.
- Use `confirmationContract` to decide which backend confirm flow is allowed.
- Preserve `requiresPlanHash: true` for goal event writes.
- Keep `writesInPreview: false`. Preview routes do not append events or write repo files.
- Keep legacy v8 compatibility commands out of the top-level App/Workbench action model. They can remain CLI compatibility paths, but App surfaces should use action contracts.

## Boundaries

v34 action contracts and UI bindings do not:

- execute shell commands
- create jobs
- invoke models
- read arbitrary local files
- open local files
- merge, push, tag, or publish
- approve reviews
- pass main verification
- declare release readiness
- self-approve

Those behaviors require explicit later contracts and explicit goal events.
