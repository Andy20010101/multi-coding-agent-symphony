# v34–v40 Final App Core Implementation Plan

Date: 2026-06-02  
Status: draft / ready for `/goal` registration  
Baseline: v33 App Runtime Foundation  
Target: final local App kernel completion before native UX expansion

## Correction note

This plan intentionally continues the current v20-v32 goal/runbook/next-action Workbench workflow. It does **not** return to the old prompt-router command surface as the Workbench app model.

Primary product flow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Compatibility/script commands may continue to exist, but the App kernel must not be modeled as generic browser buttons for `scan/do/review/verify/status/continue/artifacts`.

## Product purpose

把 v32 已完成的 Workbench 闭环继续推进成最终本地 App 内核：

```text
active goal / next action / handoff / event registration / review / main verification / release closeout
```

升级为：

```text
project registry / local sidecar / action registry / job queue / artifact index / desktop shell / provider hub / backup diagnostics / personal workflow router
```

核心不是“网页套壳”，而是让 Web Workbench、Desktop Shell、CLI、Notch/Menu Bar 未来共享同一个 App kernel action layer。

## Product spine

```text
v33 App Runtime Foundation
  -> v34 Action Registry Workspace
  -> v35 Job Queue + Run Control Workspace
  -> v36 Artifact/Evidence Index Workspace
  -> v37 Desktop Shell MVP
  -> v38 Provider Hub + Capability Profiles
  -> v39 Backup / Diagnostics / Migration Workspace
  -> v40 Personal Workflow Router + App Core Release Closeout
```

## Global architecture target

```text
UI renderer: Web Workbench / Desktop Shell / Notch / CLI
  -> App API: read-only state + controlled action preview
  -> Action Registry: action_id, availability, capability preview, event mapping
  -> Job Queue: queued/running/blocked/failed/passed/recovered state
  -> Workflow Kernel: existing goal/runbook/event/review/gate/release contracts
  -> Evidence Layer: ArtifactStore canonical, app index as searchable cache only
```

## Non-goals

- Do not build a generic shell runner, browser terminal, arbitrary command palette, or generic model invocation path.
- Do not let UI execute shell commands directly.
- Do not infer task approval, main verification, release readiness, or job completion from branch names, filenames, prompt text, frontend state, or task titles.
- Do not replace the existing goal framework, ArtifactStore, or event semantics.
- Do not let worker self-approve.
- Do not auto-merge, auto-push, auto-tag, publish, or call external providers unless a specific version/task explicitly implements a controlled path and evidence gate.
- Do not do a wholesale Rust rewrite of the workflow kernel. Rust/Tauri may later own hard local boundaries, but goal/runbook/review/release policy remains in the current kernel until it stabilizes.
- Do not make cloud sync part of the App core completion path.

## Version goals

| Version | Goal id | Product value | Completion meaning |
|---|---|---|---|
| v34 | `v34-action-registry-workspace` | Workbench buttons become declared controlled actions | UI can ask kernel what actions are available and why |
| v35 | `v35-job-queue-run-control-workspace` | Actions become recoverable jobs | App can track running/blocked/failed/passed work |
| v36 | `v36-artifact-evidence-index-workspace` | Evidence becomes browsable/searchable app memory | ArtifactStore remains canonical; app gets index/search/export |
| v37 | `v37-desktop-shell-mvp` | Web Workbench enters desktop shell without bypassing kernel | Desktop shell launches sidecar and displays project/goal/job state |
| v38 | `v38-provider-hub-capability-profiles` | Codex/Claude/Kiro/DeepSeek become controlled provider lanes | Model/tool availability is explicit and gate-bound |
| v39 | `v39-backup-diagnostics-migration-workspace` | Long-running app data becomes safe to upgrade/restore | app.db/index/snapshots can be exported, diagnosed, migrated |
| v40 | `v40-personal-workflow-router-app-core-release` | App kernel connects inbox/capture to Workbench goals | The final app core can route work before it enters a goal |

## Task breakdown by version

### v34 — Action Registry Workspace

- task-1: Action manifest contract — define action_id, label, scope, availability, capability preview, event mapping, evidence expectations.
- task-2: Action availability resolver — available/unavailable reasons anchored to active goal/task/runbook/next action.
- task-3: Action preview API — read-only endpoint returns actions and required confirmations without executing.
- task-4: Workbench action panel binding — UI reads action registry; no hard-coded command buttons.
- task-5: Action registry evidence + migration guide — document how future UI surfaces consume actions.

### v35 — Job Queue + Run Control Workspace

- task-1: Job model contract — job_id, project_id, goal_id, task_id, action_id, status, refs, timestamps, failure/blocker fields.
- task-2: Create job from controlled action — dry-run by default; no arbitrary commands.
- task-3: Job event timeline + log stream contract — app-visible state changes come from backend job events.
- task-4: Pause/cancel/resume/recover semantics — controlled states, explicit blockers, no hidden retry.
- task-5: Workbench job console binding — show queued/running/blocked/failed/passed jobs.

### v36 — Artifact/Evidence Index Workspace

- task-1: Artifact index contract — stable schema for artifact refs, hashes, kind, goal/task/run/job linkage.
- task-2: Indexer from existing ArtifactStore/event refs — index is derived cache, not source of truth.
- task-3: Safe preview/search/filter API — no arbitrary local path reading.
- task-4: Evidence timeline and release bundle view — user can inspect task/review/main verification/release evidence.
- task-5: Export diagnostics/evidence bundle draft — copy-only or write-gated export with evidence.

### v37 — Desktop Shell MVP

- task-1: Desktop shell decision and minimal workspace — Tauri/Electron choice documented with no workflow rewrite.
- task-2: Sidecar launcher + health bridge — shell starts/attaches to local sidecar and reads app state.
- task-3: Project list + active goal + next action view — desktop displays core app kernel state.
- task-4: Job status + artifact preview binding — desktop consumes existing APIs only.
- task-5: Desktop build smoke + packaging boundary evidence — build works; no auto-update/publish yet.

### v38 — Provider Hub + Capability Profiles

- task-1: Provider profile contract — Codex/Claude/Kiro/DeepSeek availability, lane, gate, health, secrets boundary.
- task-2: Provider health check API — read-only status; no model invocation from UI.
- task-3: Capability profile mapping — action requirements mapped to provider/tool gates.
- task-4: Worker/reviewer lane assignment preview — separates implementation and independent review lanes.
- task-5: Provider hub panel + evidence — UI shows availability and blocked reasons without leaking secrets.

### v39 — Backup / Diagnostics / Migration Workspace

- task-1: App data inventory — registry, snapshots, job state, artifact index, settings, provider profiles.
- task-2: Schema version + migration runner — dry-run migration preview, explicit confirm for writes.
- task-3: Backup/export bundle — app core state export with hashes and manifest.
- task-4: Diagnostics bundle — health, versions, recent failures, gate status, sanitized logs.
- task-5: Restore validation — verify bundle integrity and compatible restore path without overwriting by default.

### v40 — Personal Workflow Router + App Core Release Closeout

- task-1: Inbox/capture contract — capture raw requests without forcing every item into Workbench.
- task-2: Router categories — direct answer, skill, automation, workbench goal, research, ignore/skip.
- task-3: Goal/runbook draft handoff — repeated or project-scoped work can become a goal draft.
- task-4: App core release manager — final release checklist covers v34-v39 capabilities.
- task-5: Native UX handoff generator — generate v41+ handoff for menu bar/notch, UX polish, distribution.

## Standard worker/reviewer/main verification split

Every task uses three separate roles:

1. Worker: implements one task and writes worker evidence.
2. Reviewer: independently reviews diff, evidence, tests, and boundaries. Reviewer may return `APPROVED` or `NEEDS_REVISION`.
3. Main verifier: only after reviewer approval, merges ff-only into clean main and records main-verification evidence/gate.

The worker may self-check but must not approve its own work.

## Required validation commands

Default validation for every task:

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal <goal-id> --json
```

Add version-specific validation only when the implementation exposes a new script. Do not invent fake scripts.

## File placement

```text
docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
docs/plans/app-core-v34-v40-goal-runbooks/README_HOW_TO_START.md
docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
```

## Recommended execution order

Start with v34 only. Do not try to execute v34-v40 in one giant branch.

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
git diff --check

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json \
  --goal v34-action-registry-workspace \
  --dry-run --json
```

Then confirm with the returned plan hash.

## Final App kernel completion criteria

The App core is complete when:

- Current project, active goal, next action, review state, main verification state, release state, and provider availability are visible from app state.
- UI surfaces never execute raw commands; they call declared actions.
- Actions create jobs; jobs produce explicit state/evidence; blocked/failed states are recoverable.
- ArtifactStore remains canonical and the app index can search/browse/export evidence without arbitrary path access.
- Desktop shell can launch/attach to sidecar and display project/goal/job/artifact state.
- Provider hub exposes availability/gates without leaking secrets or invoking providers from the renderer.
- Backup/diagnostics/migration make the app safe to use long-term.
- Inbox/router can decide whether a request becomes a Workbench goal, skill, automation, research item, direct answer, or skipped item.
- v40 release closeout generates v41+ native UX/distribution handoff.
