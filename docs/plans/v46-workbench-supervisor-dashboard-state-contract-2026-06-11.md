# v46 Workbench Supervisor Dashboard State Contract

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal: `v46-workbench-supervisor-dashboard-state-contract`

## Scope

This document defines the read-only state contract for the v46 Workbench Supervisor Dashboard. It extends the v44.3 app-facing supervisor read model for the v46 dashboard layout without adding runtime execution, daemon control, provider CLI calls, release closeout, or git tag paths.

Frontend implementation should consume one immutable dashboard state object. The live source remains `goal-supervisor-app-read-model.v1` from the existing read-only supervisor route. A local sample fallback is allowed while frontend layout is being built, but the fallback must keep the same field names and safety values.

## Preflight

Commands run in the repository:

```text
pwd
```

Result:

```text
/Users/andy/Documents/project/multi-coding-agent-symphony
```

Command:

```text
git status --short
```

Result:

```text
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/styles/workbench.css
?? frontend/workbench/src/v46SupervisorWorkbench.jsx
?? src/symphony/workbench-static/assets/index-CTRiRePT.js
?? src/symphony/workbench-static/assets/index-CnukrjhF.css
```

Those frontend and generated asset changes were treated as existing implementation work and were not edited for this contract.

## Sources Inspected

- `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`
- `docs/plans/v44-3-app-contract-context-supervisor-closeout-snapshot-2026-06-10.md`
- `docs/plans/v44-4-workbench-supervisor-dashboard-prototype-runbook-2026-06-10.md`
- `docs/plans/v45-backend-entrypoint-decomposition-runbook-2026-06-10.md`
- `docs/plans/controller/README.md`
- `docs/plans/controller/supervisor-runner.md`
- `docs/plans/controller/supervisor-hooks.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`
- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/app-read-model-pipeline.js`
- `src/symphony/goal-supervisor/core-projection.js`
- `src/symphony/goal-supervisor/core-projection-handoff-metadata.js`
- `src/symphony/goal-supervisor/policy.js`
- `src/symphony/goal-supervisor/route-progress.js`
- `src/symphony/goal-supervisor/state-vocabulary.js`
- `src/symphony/supervisor-runner.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/v44-goal-supervisor-app-read-model.test.js`
- `tests/workbench-api-client.test.js`
- v46 OpenDesign handoff files under `/Users/andy/Documents/Codex/2026-06-11/v46-opendesign-claude-warm-v2-focused/outputs/`

## Existing Contract Baseline

`goal-supervisor-app-read-model.v1` already exposes these app-facing objects:

```text
contractName
contractVersion
readOnly
willMutate
generatedAt
goalSnapshot
goalTimeline
activeLease
pendingResult
currentGate
recommendedNextAction
ownership
contextStatus
commandBoundary
```

The dashboard must not rebuild those objects by reading lower-level sources. The frontend consumes the read model or the local sample fallback, then projects it into `SupervisorDashboardStateV46`.

Allowed live read routes remain:

```text
GET /api/goals/latest/supervisor
GET /api/goals/<goal-id>/supervisor
```

The CLI mirror remains operator inspection only:

```text
pnpm --silent symphony supervisor status --goal <goal-id|latest> --json
```

Frontend code must not call that CLI.

## Temporary Daemon Status

The temporary coding-system daemon script exists locally:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Repository references treat it as an external fallback, not product-owned runtime:

- `src/symphony/goal-supervisor/core-projection-handoff-metadata.js` exposes it as `TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH`.
- v44.2 and v44.3 docs state that launcher, PTY ownership, real CLI, provider CLI, generic shell execution, browser terminal automation, live goal append confirmation, release automation, and release closeout execution remain outside repository-owned behavior.
- Controller docs describe daemon lifecycle states such as `daemon-active`, `daemon-stale`, `daemon-stopped`, and `waiting-operator`, but keep launcher/process mechanics temporary.

v46 Workbench may display daemon state only when the read model or local sample provides it. It must not start, stop, restart, tick, inspect pid files, or shell out to the temporary daemon.

## Dashboard State

The v46 frontend view model is:

```ts
type SupervisorDashboardStateV46 = {
  contractName: "supervisor-dashboard-state.v46";
  contractVersion: 1;
  source: "goal-supervisor-app-read-model.v1" | "local-sample-fallback";
  goalId: string | null;
  generatedAt: string;
  readOnly: true;
  willMutate: false;
  activeTask: string | null;
  activeRole: string | null;
  health: {
    state: "healthy" | "waiting" | "stale" | "blocked" | "missing" | "observed-only" | "unknown";
    observedOnly: true;
    daemonState: string | null;
    contextState: "fresh" | "stale" | "missing" | "near-limit" | "drift" | "unknown";
    gateState: string | null;
    duplicateDispatchAllowed: false;
    reason: string | null;
  };
  currentGate: {
    gateId: string | null;
    status: string;
    requiredCommandFamily: string | null;
    evidenceRequirement: string | null;
    blockingReason: string | null;
    closeoutAuthorizationState: string;
  };
  recommendedNextAction: {
    actionId: "continue" | "wait" | "checkpoint" | "compact" | "open-handoff-thread" | "recover-drift" | "block" | string;
    label: string;
    reason: string;
    targetRole: string | null;
    taskId: string | null;
    safeCommandPreview: string | null;
    requiredConfirmationFields: string[];
    checkpointRef: string | null;
    mismatchList: string[];
    manualInterventionReason: string | null;
    waitPolicy: {
      staleThresholdMs: number | null;
      activeLeaseAgeMs: number | null;
    } | null;
    blockedFields: string[];
  };
  activeLease: {
    leaseId: string | null;
    threadId: string | null;
    taskId: string | null;
    role: string | null;
    phase: string | null;
    status: string;
    startedAt: string | null;
    updatedAt: string | null;
    ageMs: number | null;
    duplicateDispatchGuard: {
      blocked: boolean;
      reason: string | null;
    };
  };
  context: {
    state: "fresh" | "stale" | "missing" | "near-limit" | "drift" | "unknown";
    providerSummaries: Array<{
      provider: string | null;
      status: string;
      threadId: string | null;
      latestTurnAt: string | null;
    }>;
    transcriptAvailability: string;
    exchangeCount: number;
    latestTurnState: Record<string, unknown> | null;
    latestToolCall: {
      name: string | null;
      status: string | null;
      updatedAt: string | null;
    } | null;
    tokenUsage: Record<string, unknown> | null;
    utilizationPercent: number | null;
    staleTranscriptState: {
      stale: boolean;
      reason: string | null;
      thresholdMs?: number | null;
      ageMs?: number | null;
    };
    missingTranscriptState: {
      missing: boolean;
      reason: string | null;
    };
    resultBlockEvidence: {
      status: string;
      present: boolean;
      evidenceRef?: string | null;
      sourceRef?: string | null;
    };
    checkpointRef: string | null;
    driftMarkers: string[];
  };
  pendingResult: {
    source: string | null;
    status: "pending" | "missing" | "invalid" | "unavailable" | "consumed" | string;
    eventToRegister: string | null;
    evidenceRef: string | null;
    parserReason: string | null;
    stale: boolean;
    missing: boolean;
    resultId: string | null;
  };
  commandBoundary: {
    state: "disabled" | "dry-run" | "confirm-required";
    executionAvailable: false;
    copyOnly: true;
    allowedCommandFamilies: string[];
    blockedCommandFamilies: string[];
    blockedMutationFamilies: Array<"daemon-control" | "provider-cli" | "real-cli" | "release-closeout" | "git-tag">;
    safeCommandPreview: string | null;
    confirmationFields: string[];
    confirmation: Record<string, unknown> | null;
  };
  timeline: Array<{
    eventId: string;
    taskId: string | null;
    role: string | null;
    status: string | null;
    evidenceRef: string | null;
    hashChainState: string | null;
    occurredAt: string | null;
  }>;
  ownership: {
    orchestrationOwner: string;
    deliveryBoundary: string;
    activePr: string | null;
    branch: string | null;
    rollbackBoundary: string;
    daemonState: string;
    controllerInterventionReason: string | null;
  };
};
```

## Field Owners

| Dashboard field | Primary owner | Live source | Local sample fallback |
| --- | --- | --- | --- |
| `goalId` | supervisor-monitor | `goalSnapshot.goalId` | Sample `goalId`. |
| `generatedAt` | supervisor-monitor | top-level `generatedAt` | Sample `generatedAt`. |
| `readOnly` | supervisor-monitor | top-level `readOnly`; must be `true` | Always `true`. |
| `willMutate` | supervisor-monitor | top-level `willMutate`; must be `false` | Always `false`. |
| `activeTask` | controller | `goalSnapshot.activeTask` | Sample active task string. |
| `activeRole` | controller | `goalSnapshot.activeRole` | Sample active role string. |
| `health` | supervisor-monitor | Derived from `activeLease`, `contextStatus`, `currentGate`, and `ownership.daemonState` | Sample health object with `observedOnly: true`. |
| `currentGate` | controller | `currentGate` | Sample gate object. |
| `recommendedNextAction` | controller | `recommendedNextAction` from supervisor policy | Sample recommended action. |
| `activeLease` | daemon | `activeLease` composed from supervisor observability | Sample active lease. |
| `context` | supervisor-monitor | `contextStatus` | Sample context object. |
| `pendingResult` | controller | `pendingResult` from recorded result intake | Sample pending result. |
| `commandBoundary` | supervisor-monitor | `commandBoundary` from policy projection | Sample command boundary with all blocked mutation families. |
| `timeline` | supervisor-monitor | `goalTimeline` | Sample timeline events. |
| `ownership` | supervisor-monitor | `ownership` plus daemon state surfaced by observability | Sample ownership object. |

The frontend is not the owner of any live state. It can normalize names for rendering, but it cannot infer readiness, approval, lease health, or release state from branch names, file names, PR titles, command text, or CSS state.

## Blocked Mutation Families

The v46 dashboard uses five canonical blocked mutation families:

```text
daemon-control
provider-cli
real-cli
release-closeout
git-tag
```

Mapping from existing v44.3 command families:

| v46 family | Covers | Existing aliases to normalize |
| --- | --- | --- |
| `daemon-control` | daemon start, stop, restart, tick, launcher, PTY, pid-file inspection, and frontend daemon shell calls | `daemon-launch`, `daemon start`, `daemon stop`, `daemon-status` when invoked by UI |
| `provider-cli` | direct provider model CLI calls and provider operation launch | `provider-cli` |
| `real-cli` | real Codex, Claude, Kiro, or other real CLI smoke/release calls | `real-cli` |
| `release-closeout` | release ready declaration, closeout automation, publish, GitHub Release, and release push automation | `release-closeout`, `push-release`, `publish-release`, `github-release` |
| `git-tag` | local tag creation, annotated tag creation, tag push, and tag evidence automation | `tag`, `git tag`, `git-tag` |

`commandBoundary.blockedMutationFamilies` must contain all five canonical values for v46. `commandBoundary.blockedCommandFamilies` may preserve raw backend families for diagnostics.

## Refresh Semantics

Each refresh returns a complete immutable snapshot. The frontend replaces the prior dashboard state atomically after a successful read. It does not patch individual panels from separate sources.

Live refresh path:

1. Use the existing Workbench read-only client path for `GET /api/goals/latest/supervisor` or `GET /api/goals/<goal-id>/supervisor`.
2. Accept only a model with `readOnly === true` and `willMutate === false`.
3. Project `goal-supervisor-app-read-model.v1` into `SupervisorDashboardStateV46`.
4. Preserve `generatedAt` from the source model. Do not overwrite it with browser render time.
5. Treat stale, missing, blocked, or drift states as visible dashboard states. Do not repair them from the frontend.

Local sample refresh path:

1. Use a local fixture only when the live route is intentionally not wired for the current implementation PR.
2. Set `source: "local-sample-fallback"`, `readOnly: true`, `willMutate: false`, `executionAvailable: false`, and `copyOnly: true`.
3. Keep all five canonical blocked mutation families present.
4. Make missing values explicit as `null`, `missing`, or empty arrays. Do not fill unknown values with successful-looking labels.

Staleness:

- Use source-provided fields such as `staleTranscriptState`, `missingTranscriptState`, `contextUtilization`, daemon `staleAfterMs`, and `ageMs`.
- Do not add a frontend-only stale threshold unless a later backend contract exposes that threshold.
- If `generatedAt` is old but the source does not provide a threshold, show the timestamp and avoid a pass/fail claim.

## `copyOnly` And Dry-Run Handling

`commandBoundary.executionAvailable` is always `false` in v46 Workbench.

`commandBoundary.copyOnly` is always `true` in v46 Workbench.

When `state` is `disabled`:

- render status text only;
- do not render a copy preview unless `safeCommandPreview` is non-null and explicitly marked copy-only by the source;
- do not render run, execute, apply, dispatch, release, publish, tag, closeout, approve, or register labels.

When `state` is `dry-run`:

- render `safeCommandPreview` as copy-only text;
- show `dry-run` as a status label;
- do not call the CLI, API write routes, shell, daemon, provider CLI, or real CLI.

When `state` is `confirm-required`:

- render required confirmation fields as missing/present status;
- show `safeCommandPreview` only as copy-only text;
- do not create a confirm action;
- keep all five canonical blocked mutation families visible.

## No Execution Paths

The v46 dashboard contract does not authorize these paths:

- daemon start, stop, restart, tick, status shelling, launcher, or PTY ownership;
- child dispatch or controller thread creation;
- provider CLI or real CLI invocation;
- generic shell command execution;
- event registration, goal ledger writes, event log writes, result escrow consumption, or state writer confirmation;
- mutation gate, audit, doctor, release gate execution, release closeout, publish, GitHub Release, push release, or git tag;
- direct frontend reads of `.symphony`, goal ledger files, event logs, runner state, provider JSONL, Codex session JSONL, Claude session JSONL, or temporary daemon files.

## Frontend Consumption Rules

Implementation should use the v46 static sample while building layout and then switch to the existing read-only supervisor route through the Workbench client. The same projection function should handle both sources.

Panel bindings:

- `StatusHeader`: `goalId`, `generatedAt`, `readOnly`, `willMutate`, `activeTask`, `activeRole`, `health`.
- `GoalSnapshotPanel`: `goalId`, `activeTask`, `activeRole`, `readOnly`, `willMutate`.
- `ActiveLeasePanel`: `activeLease`, plus `health.duplicateDispatchAllowed`.
- `CurrentGatePanel`: `currentGate`.
- `RecommendedNextActionBand`: `recommendedNextAction`, with command preview only when `commandBoundary.copyOnly === true`.
- `ContextStatusPanel`: `context`.
- `PendingResultPanel`: `pendingResult`.
- `CommandBoundaryPanel`: `commandBoundary`, especially `blockedMutationFamilies`.
- `GoalTimelinePanel`: `timeline`.
- `OwnershipPanel`: `ownership`.

If the live model is missing a field, render the field as missing and keep the route read-only. Do not fetch lower-level files to compensate.

## Open Questions

- Should `blockedMutationFamilies` be added to the backend `goal-supervisor-app-read-model.v1`, or should the v46 frontend projection derive it from `blockedCommandFamilies` for this release?
- Should `health` become a backend field after v46, or remain a dashboard projection from `activeLease`, `contextStatus`, `currentGate`, and `ownership`?
- Should the first v46 implementation PR stay fully local-sample-only, or may it use the existing read-only supervisor route after the static read-only checks pass?
