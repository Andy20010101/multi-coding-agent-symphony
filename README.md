# Multi Coding Agent Symphony

Multi Coding Agent Symphony is a local Workbench for goal/runbook-driven coding-agent operations, with CLI commands for scripted flows, compatibility paths, and low-level diagnostics.

Current tagged release: `v60`, the Stable Personal Workbench Baseline. The annotated `v60` tag and GitHub Release are complete. Current `origin/main` is ahead of the `v60` tag because it includes the post-release supervisor status JSON fix and the v61 runbook carry-forward.

Current main starts v61 Workbench Operator Dry-run Evidence. v61 is a verification and evidence pass on the released v60 baseline: release-state reconcile, local Workbench route smoke, operator checklist, recovery drill notes, closeout, and v62 handoff. It does not add a generic terminal, renderer-side command execution, unsupported provider support, raw transcript exposure, frontend local session reads, git/tag/publish automation inside product code, GitHub Release automation inside product code, public distribution, notarization, auto-update, automatic worktree creation, or automatic next-version goal creation.

Start with Workbench v1 for daily operator work:

```sh
pnpm workbench:build
symphony console
```

Open `http://127.0.0.1:8765/workbench/desktop/` for the Project Launcher and App Home path, or `http://127.0.0.1:8765/workbench/` for the existing Workbench panels. The daily path now uses the v52-v60 Workbench baseline:

```text
Project Launcher -> App Home -> Supervisor -> Context Advisory -> Result Intake -> Event Preview / Confirm -> Review / Gate -> Closeout -> Release Publication Evidence -> Stable Baseline
```

The matching CLI spine remains:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Use the `symphony` CLI as the advanced/script entry point when you need repeatable terminal output, JSON contracts, dry-run/confirm event registration, CI checks, or compatibility commands such as `scan`, `do`, `verify`, `status`, `continue`, and `artifacts`. Workbench displays controlled state and copy-only commands; release tag, push, publish, and GitHub Release work stay outside product code.

Implemented adapter families include:

- Codex with GPT models.
- Claude Code connected to the DeepSeek API in the user's environment.
- Kiro CLI adapter and smoke paths for historical compatibility.

The system preserves each CLI's native harness instead of replacing it. The orchestrator owns task queueing, workspace isolation, routing, policy, verification, traces, and artifacts. Runtime adapters translate shared task contracts into the concrete CLI invocation, configuration, hooks, and output collection for each tool. Active Workbench provider execution remains limited to explicitly tested contracts and fixtures for that version; Kiro, Gemini, DeepSeek-as-a-provider, and unsupported providers are not v61 active Workbench execution targets.

## Current Documents

- [Architecture](docs/architecture.md)
- [Core Contracts](docs/core-contracts.md)
- [Adapter Contract](docs/adapter-contract.md)
- [Module Plan](docs/module-plan.md)
- [BDD and TDD Workflow](docs/bdd-tdd-workflow.md)
- [Eval Replay Plugin](docs/eval-replay-plugin.md)
- [Real CLI Integration](docs/real-cli-integration.md)
- [Symphony Layer](docs/symphony-layer.md)
- [Symphony Product JSON Contracts](docs/symphony-product-contracts.md)
- [Workbench Operator Guide](docs/workbench-operator-guide.md)
- [Daily Workflow Runbook](docs/daily-workflow-runbook.md)
- [Provider Boundary Guide](docs/provider-boundary-guide.md)
- [Recovery Guide](docs/recovery-guide.md)
- [Action Registry Migration Guide](docs/action-registry-migration-guide.md)
- [Operational Execution Order](docs/operational-execution-order.md)
- [Security Checklist](docs/security-checklist.md)
- [Release Checklist](docs/release-checklist.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Harness Symphony Integration](docs/harness-symphony-integration.md)
- [v10/v11 Release Evidence](docs/plans/v10-v11-release-evidence-2026-05-24.md)
- [v12 Verified Adoption Plan](docs/plans/v12-verified-adoption-plan-2026-05-24.md)
- [v12 Release Evidence](docs/plans/v12-release-evidence-2026-05-24.md)
- [v12 Execution Prompt](docs/plans/v12-execution-prompt-2026-05-24.md)
- [v13 Workbench Information Architecture Plan](docs/plans/v13-workbench-information-architecture-plan-2026-05-25.md)
- [v13 Release Evidence](docs/plans/v13-release-evidence-2026-05-25.md)
- [v13.1 Release Evidence](docs/plans/v13.1-release-evidence-2026-05-25.md)
- [v13 Execution Prompt](docs/plans/v13-execution-prompt-2026-05-25.md)
- [v14 Release Evidence](docs/plans/v14-release-evidence-2026-05-26.md)
- [v15 Task 11 Release Verification Evidence](docs/plans/v15-task11-release-verification-evidence-2026-05-27.md)
- [v15 Final Closure Evidence](docs/plans/v15-final-closure-evidence-2026-05-27.md)
- [v15 Release Bookkeeping Evidence](docs/plans/v15-release-bookkeeping-evidence-2026-05-27.md)
- [v15 Tag Release Evidence](docs/plans/v15-tag-release-evidence-2026-05-27.md)
- [v16 Guided Goal Handoff + Safe Artifact Preview Plan](docs/plans/v16-guided-goal-handoff-safe-artifact-preview-plan-2026-05-27.md)
- [v16 Task 10 Docs and Operator Guide Evidence](docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md)
- [v16 Task 11 Release Verification Evidence](docs/plans/v16-task11-release-verification-evidence-2026-05-27.md)
- [v16 Final Closure Evidence](docs/plans/v16-final-closure-evidence-2026-05-27.md)
- [v16 Final Release Review Evidence](docs/plans/v16-final-release-review-evidence-2026-05-28.md)
- [v16 Tag Release Planning Evidence](docs/plans/v16-tag-release-planning-evidence-2026-05-28.md)
- [v16 Tag Release Evidence](docs/plans/v16-tag-release-evidence-2026-05-28.md)
- [v17 Read-only Goal Progress Console Contract Hardening Plan](docs/plans/v17-readonly-goal-progress-console-contract-hardening-plan-2026-05-28.md)
- [v17 Execution Prompts](docs/plans/v17-execution-prompts-2026-05-28.md)
- [v17 Release Evidence](docs/plans/v17-release-evidence-2026-05-28.md)
- [v17 Tag Release Evidence](docs/plans/v17-tag-release-evidence-2026-05-28.md)
- [v18 Goal Event Journal + Evidence Recorder Plan](docs/plans/v18-goal-event-journal-evidence-recorder-plan-2026-05-28.md)
- [v18 Execution Prompts](docs/plans/v18-execution-prompts-2026-05-28.md)
- [v18 Task Evidence Index](docs/plans/v18-task-evidence-index-2026-05-28.md)
- [v18 Release Evidence](docs/plans/v18-release-evidence-2026-05-28.md)
- [v18 Final Closure Evidence](docs/plans/v18-final-closure-evidence-2026-05-29.md)
- [v18 Tag Release Evidence](docs/plans/v18-tag-release-evidence-2026-05-29.md)
- [v19 Goal Runbook + Next Action Control Center Plan](docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md)
- [v19 Execution Prompts](docs/plans/v19-execution-prompts-2026-05-29.md)
- [v19 Task Evidence Index](docs/plans/v19-task-evidence-index-2026-05-29.md)
- [v19 Release Evidence Draft](docs/plans/v19-release-evidence-2026-05-29.md)
- [v20 Release Ready Evidence](docs/plans/v20-release-ready-evidence-2026-05-31.md)
- [v20 Tag Release Evidence](docs/plans/v20-tag-release-evidence-2026-05-31.md)
- [v21 Release Evidence](docs/plans/v21-release-evidence-2026-05-29.md)
- [v22 Release Evidence](docs/plans/v22-release-evidence-2026-05-29.md)
- [v23 Release Evidence](docs/plans/v23-release-evidence-2026-05-29.md)
- [v25 Release Evidence](docs/plans/v25-release-evidence-2026-05-29.md)
- [v27 Release Evidence](docs/plans/v27-release-evidence-2026-05-29.md)
- [v28 Release Evidence](docs/plans/v28-release-evidence-2026-05-29.md)
- [v28 Workbench v1 Release Runbook](docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md)
- [v29-v32 Workbench Goal Runbooks](docs/plans/workbench-v29-v32-goal-runbooks/README_HOW_TO_START.md)
- [v29 Release Evidence](docs/plans/v29-release-evidence-2026-06-01.md)
- [v30 Release Evidence](docs/plans/v30-release-evidence-2026-06-01.md)
- [v31 Release Evidence](docs/plans/v31-release-evidence-2026-06-01.md)
- [v32 Release Manager Workspace v2 Plan](docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md)
- [v32 Release Evidence](docs/plans/v32-release-evidence-2026-06-01.md)
- [v33 App Runtime Foundation Plan](docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md)
- [v33 Release Evidence](docs/plans/v33-release-evidence-2026-06-02.md)
- [v34-v40 App Core Implementation Plan](docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md)
- [v34-v40 App Core Runbooks](docs/plans/app-core-v34-v40-goal-runbooks/README_HOW_TO_START.md)
- [v34 Action Registry Workspace Runbook](docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md)
- [v34 Release Evidence](docs/plans/v34-release-evidence-2026-06-02.md)
- [v34 Tag Evidence](docs/plans/v34-tag-evidence-2026-06-02.md)
- [v35 Job Queue + Run Control Workspace Runbook](docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md)
- [v35 Release Evidence](docs/plans/v35-release-evidence-2026-06-02.md)
- [v35 Tag Evidence](docs/plans/v35-tag-evidence-2026-06-02.md)
- [v36 Release Evidence](docs/plans/v36-release-evidence-2026-06-03.md)
- [v36 Tag Evidence](docs/plans/v36-tag-evidence-2026-06-03.md)
- [v37 Desktop Shell MVP Runbook](docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md)
- [v37 Desktop Shell UX Brief](docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md)
- [v37 Release Evidence](docs/plans/v37-release-evidence-2026-06-04.md)
- [v37 Tag Evidence](docs/plans/v37-tag-evidence-2026-06-04.md)
- [v38 Provider Hub MVP Plan](docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md)
- [v38 Release Evidence](docs/plans/v38-release-evidence-2026-06-05.md)
- [v39 Backup / Diagnostics / Migration Workspace Runbook](docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md)
- [v39 Release Evidence](docs/plans/v39-release-evidence-2026-06-02.md)
- [v40 Personal Workflow Router + App Core Release Runbook](docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md)
- [v40 Release Evidence](docs/plans/v40-release-evidence-2026-06-02.md)
- [v41 Controlled CLI Provider Runner Plan](docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md)
- [v41-v42 App Core Runbooks](docs/plans/app-core-v41-v42-goal-runbooks/README_HOW_TO_START.md)
- [v41 Release Evidence](docs/plans/v41-release-evidence-2026-06-06.md)
- [v42 Goal Supervisor Runtime Context Loop Plan](docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md)
- [v42 Release Evidence](docs/plans/v42-release-evidence-2026-06-06.md)
- [v43 Goal Supervisor Stabilization Plan](docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md)
- [v43 Release Evidence](docs/plans/v43-release-evidence-2026-06-08.md)
- [v44 Project-Internal Goal Supervisor Core Plan](docs/plans/v44-project-internal-goal-supervisor-core-plan-2026-06-08.md)
- [v44 Release Evidence](docs/plans/v44-release-evidence-2026-06-08.md)
- [v44.2 Supervisor Architecture Consolidation Closeout Snapshot](docs/plans/v44-2-supervisor-architecture-consolidation-closeout-snapshot-2026-06-10.md)
- [v44.3 App Contract and Context Supervisor Runbook](docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md)
- [v44.3 App Contract and Context Supervisor Closeout Snapshot](docs/plans/v44-3-app-contract-context-supervisor-closeout-snapshot-2026-06-10.md)
- [v44.4 Workbench Supervisor Dashboard Prototype Runbook](docs/plans/v44-4-workbench-supervisor-dashboard-prototype-runbook-2026-06-10.md)
- [v44.4 Workbench Supervisor Dashboard Prototype Closeout Snapshot](docs/plans/v44-4-workbench-supervisor-dashboard-prototype-closeout-snapshot-2026-06-10.md)
- [v45 Backend Entrypoint Decomposition Runbook](docs/plans/v45-backend-entrypoint-decomposition-runbook-2026-06-10.md)
- [v45 Backend Entrypoint Decomposition Closeout Snapshot](docs/plans/v45-backend-entrypoint-decomposition-closeout-snapshot-2026-06-10.md)
- [v46 Workbench Supervisor Dashboard State Contract](docs/plans/v46-workbench-supervisor-dashboard-state-contract-2026-06-11.md)
- [v46 Workbench Supervisor Dashboard Closeout Snapshot](docs/plans/v46-workbench-supervisor-dashboard-closeout-snapshot-2026-06-11.md)
- [v47 Mac App Shell Activation Runbook](docs/plans/v47-mac-app-shell-activation-runbook-2026-06-11.md)
- [v48 Project Launcher and Recent Projects Runbook](docs/plans/v48-project-launcher-recent-projects-runbook-2026-06-11.md)
- [v48 Project Launcher and Recent Projects Closeout Snapshot](docs/plans/v48-project-launcher-recent-projects-closeout-snapshot-2026-06-11.md)
- [v49 Context Session Observability and Supervisor Advisory Runbook](docs/plans/v49-context-session-observability-supervisor-advisory-runbook-2026-06-12.md)
- [v49 Context Session Observability and Supervisor Advisory Closeout Snapshot](docs/plans/v49-context-session-observability-supervisor-advisory-closeout-snapshot-2026-06-12.md)
- [v50 Supervisor Controlled Event Registration Runbook](docs/plans/v50-supervisor-controlled-event-registration-runbook-2026-06-12.md)
- [v50 Supervisor Controlled Event Registration Closeout Snapshot](docs/plans/v50-supervisor-controlled-event-registration-closeout-snapshot-2026-06-12.md)
- [v51 Result Intake Evidence Escrow Runbook](docs/plans/v51-result-intake-evidence-escrow-runbook-2026-06-12.md)
- [v51 Result Intake Evidence Escrow Acceptance](docs/qa/v51-result-intake-evidence-escrow-acceptance.md)
- [v51 Result Intake Evidence Escrow Closeout Snapshot](docs/plans/v51-result-intake-evidence-escrow-closeout-snapshot-2026-06-12.md)
- [v52 System Golden Path Closeout Runbook](docs/plans/v52-system-golden-path-closeout-runbook-2026-06-12.md)
- [v53 Controlled Child Dispatch Preview Closeout Snapshot](docs/plans/v53-controlled-child-dispatch-preview-closeout-snapshot-2026-06-12.md)
- [v54 Codex Provider Execution Pilot Runbook](docs/plans/v54-codex-provider-execution-pilot-runbook-2026-06-12.md)
- [v54 Codex Provider Execution Pilot Closeout Snapshot](docs/plans/v54-codex-provider-execution-pilot-closeout-snapshot-2026-06-12.md)
- [v55 Codex Provider Run Recovery and Reviewer Handoff Runbook](docs/plans/v55-codex-provider-run-recovery-reviewer-handoff-runbook-2026-06-12.md)
- [v55 Codex Provider Run Recovery and Reviewer Handoff Closeout Snapshot](docs/plans/v55-codex-provider-run-recovery-reviewer-handoff-closeout-snapshot-2026-06-13.md)
- [v56 Thread Continuation Reviewer Handoff Acceptance](docs/qa/v56-thread-continuation-reviewer-handoff-pack-acceptance.md)
- [v57 Review Gate Workbench Surface Runbook](docs/plans/v57-review-gate-workbench-surface-runbook-2026-06-14.md)
- [v57 Review Gate Workbench Surface Acceptance](docs/qa/v57-review-gate-workbench-surface-acceptance.md)
- [v58 Release Closeout Operator Handoff Acceptance](docs/qa/v58-release-closeout-operator-handoff-pack-acceptance.md)
- [v59 Release Publication Evidence Acceptance](docs/qa/v59-release-publication-evidence-and-next-start-audit-acceptance.md)
- [v59 Release Publication Evidence Closeout Snapshot](docs/plans/v59-release-publication-evidence-and-next-start-audit-closeout-snapshot-2026-06-14.md)
- [v60 Stable Personal Workbench Release Runbook](docs/plans/v60-stable-personal-workbench-release-runbook-2026-06-14.md)
- [v16 Goal Execution Plan](tmp/codex-prompts/v16_goal_execution_plan.md)
- [Post v4 Next Steps](docs/post-v2-alpha-next-steps.md)
- [Project Completion Plan](docs/plans/project-completion-plan-2026-05-13.md)
- [V1 to V2 Evolution Plan](docs/plans/v1-to-v2-evolution-plan-2026-05-14.md)
- [ADR 0001: Use BDD and TDD](docs/adr/0001-use-bdd-tdd.md)
- [ADR 0002: Harness Protocol Bridge](docs/adr/0002-integrate-harness-through-protocol-bridge.md)

## Current Status

Implemented:

- Contract validation for task, command, adapter, model, evidence, policy, and routing objects.
- Durable artifacts, session events, queue state, workspace allocation, and workflow run records.
- Real adapter paths for Codex, Claude Code, and Kiro CLI with opt-in model smokes.
- Workbench v1 daily operator path for active goal, prompt handoff, event registration, controlled implementation/adoption context, review/revision, main verification, and release closeout.
- User-facing `symphony` commands for advanced/script use, including doctor, goal status, goal next, goal prompt, goal closeout, dry-run work, native agent passthrough proof capture, Harness passthrough, and eval replay dispatch.
- User-facing `symphony intake` for read-only project scans that write reusable `project-context` and `intake-summary` artifacts without invoking real models.
- v8 compatibility commands: `symphony scan`, `symphony do`, `symphony verify`, `symphony status`, `symphony artifacts`, `symphony continue`, `symphony new`, and deterministic prompt routing through `symphony "<prompt>"`. These remain available for scripts and legacy workflows, but they are not the Workbench v1 top-level action model.
- Product state pointers under `.symphony/context/latest.json`, `.symphony/runs/latest.json`, and `.symphony/runs/<run-id>.json`; canonical evidence and artifacts remain in `ArtifactStore` runtime directories.
- Stable product JSON contract fields for automation: `contractVersion`, `contractName`, `contract`, `identity`, `safety`, `workflow`, `artifactRefs`, `action`, and `timestamps`.
- Local `symphony console` Workbench for daily goal operations. The React/Vite app under `/workbench/` shows active goal runbooks, task queue, next action, prompt preview, operation registry, review workspace, closeout gaps, latest runs, diagnostics, artifact pointers, and safe artifact preview contracts from `.symphony` state.
- Controlled diagnostics CLI `symphony diagnose` for terminal summaries, stable JSON reports, and redirectable static HTML reports without starting a browser server.
- v17 read-only goal progress ledger: `symphony goal-status`, `goal-progress-ledger.v1`, `/api/goals`, `/api/goals/latest/progress`, `/api/goals/<goal-id>/progress`, and Workbench Goal Progress display for task status, evidence refs, blockers, release gates, and next copy-only commands.
- v17 console contract hardening: `capabilities.v1`, `diagnostics.v1`, and `error-envelope.v1` are exposed through read-only API routes and Workbench panels without adding browser execution, Workbench writes, artifact download, arbitrary path preview, or frontend safety inference.
- v33 local runtime foundation: `symphony runtime health --json` and `GET /api/health` return `local-runtime-health.v1` with runtime/kernel version, process id, cwd/repo path, startup time, read-only mode, boundary flags, and known blockers. `symphony runtime projects --json`, `symphony runtime current --json`, `GET /api/projects`, and `GET /api/projects/current` return read-only `project-registry.v1` and `current-project-resolver.v1` contracts from cwd or an explicit repo path. `symphony runtime snapshot --json` and `GET /api/runtime/snapshot` return the shared `app-state-snapshot.v1` schema consumed by CLI and Workbench, combining current/stale freshness, current project, runtime health, active goal, current task, next action, review/main verification status, release gates/readiness, evidence refs, and known blockers without registering events or declaring release state.
- v18 goal event journal candidate: `goal-event-log.v1`, `goal-update-plan.v1`, `symphony goal update`, `symphony goal review`, and `symphony goal gate` provide dry-run / confirm event registration. Confirm writes append-only events to the managed journal; dry-run produces a reviewable plan and writes nothing.
- v18 event-backed goal progress: the resolver reads `goal-event-log.v1` into the existing `goal-progress-ledger.v1`. With no events, it keeps the v17 planned/unknown template instead of guessing status.
- v18 read-only goal events API and Workbench display: `GET /api/goals/latest/events`, `GET /api/goals/<goal-id>/events`, Workbench Goal Events Timeline, and Workbench Evidence Matrix expose registered events and evidence refs without reading evidence document bodies.
- v19 goal runbook workflow: `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, `goal-closeout-report.v1`, `symphony goal init`, `symphony goal next`, `symphony goal prompt`, `symphony goal closeout`, `symphony next`, and the Workbench Active Goal Control Center are present for Goal Runbook + Next Action Control Center work.
- v20-v28 Workbench v1 release chain: v20 adds the active goal surface, v21 adds controlled event registration from Workbench, v22 adds prompt handoff, v23 adds the goal operation run console, v24 adds main verification readiness, v25 adds the controlled implementation lane, v26 adds verified adoption inspection, v27 adds review/revision routing, and v28 adds the release closeout workspace.
- v29-v32 release-manager workspace chain: v29 adds controlled implementation plan preview and confirm, v30 adds adoption candidate/freeze/inspect/confirm workspace paths, v31 adds controlled main verification runs and evidence drafts, and v32 adds release baseline, release checklist, release/tag evidence drafts, and next-version handoff.
- v34 Action Registry Workspace: `action-manifest.v1`, `action-availability.v1`, and `action-preview.v1` are exposed through `symphony actions manifest|availability|preview` and `GET /api/actions/manifest|availability|preview`. The Workbench Action Registry Panel consumes those backend contracts and renders declared action labels, availability, preview impact, required confirmations, and boundaries without adding execution handlers, shell command construction, job creation, model invocation, git writes, release writes, push, tag, or publish.
- v35 Job Queue + Run Control Workspace: `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, and `job-run-control.v1` are exposed through `GET /api/jobs`, `GET /api/jobs/create`, `GET /api/jobs/timeline`, and `GET /api/jobs/control`. The Workbench Job Console consumes those contracts and renders queue state, dry-run creation status, timeline/log counts, controlled pause/cancel/resume/recover semantics, route health, and safety boundaries without adding job execution, shell execution, model invocation, job state mutation, git writes, push, tag, publish, or release writes.
- v37 Desktop Shell MVP task-2: `desktop/shell/src-tauri/` defines the Tauri host boundary, `sidecar-host-lifecycle.v1` is carried through `local-runtime-health.v1.sidecarHost` and `app-state-snapshot.v1.runtime_health.sidecarHost`, and `/workbench/desktop/` displays contract-backed sidecar attach/launcher state. The native bridge is limited to loopback health attach and the fixed `symphony.console.sidecar.launch` command shape; it does not add a generic shell runner, arbitrary file open, model invocation, git write, push, tag, publish, or release-ready path.
- v37 Desktop Shell MVP task-3: `/workbench/desktop/` now consumes `project-registry.v1`, `app-state-snapshot.v1`, `goal-progress-ledger.v1`, `goal-next-action.v1`, and `goal-event-log.v1` projections to show the project list, active goal, next action, blocked state, review status, main verification status, and release state. These fields remain read-only status displays; the renderer does not infer approval, main verification, or release readiness from branch names, filenames, prompt text, task titles, or frontend state.
- v37 Desktop Shell MVP task-4: `/workbench/desktop/` now consumes `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, `job-run-control.v1`, `artifact-index.v1`, `safe-artifact-preview.v1`, `evidence-timeline.v1`, and `release-bundle.v1` projections to show job status, queue/run state, read-only run-control transitions, artifact refs/status/missing counts, safe preview availability, evidence timeline readiness, and release bundle state. The Desktop route does not create, pause, cancel, resume, recover, or execute jobs; it does not open local files or decide preview safety from filenames, extensions, or frontend state.
- v38 Agent CLI Provider Hub MVP: `agent-cli-provider.v1`, `agent-cli-provider-health.v1`, `agent-cli-capability-profile.v1`, and `agent-cli-lane-assignment-preview.v1` expose provider identity, sanitized health, capability mapping, and read-only worker/reviewer/main-verifier lane previews. The Workbench Provider Hub panel and Desktop provider card display those contracts without running provider CLIs, invoking models, installing providers, opening OAuth, exposing credentials, dispatching prompts, or adding generic shell execution.
- v39 Backup / Diagnostics / Migration Workspace task-1: `app-data-inventory.v1`, `GET /api/app/data-inventory`, and the Workbench App Data Inventory panel list project registry, runtime snapshots, job state, artifact index, settings pointers, provider profiles, and evidence refs from existing backend contracts. The inventory is read-only and does not scan arbitrary paths, read evidence bodies, execute shell commands, invoke models, mutate jobs, expose secrets, write git state, self-approve, or declare release readiness.
- v39 Backup / Diagnostics / Migration Workspace task-2: `app-schema-migration.v1` is exposed through `symphony app-data migration --json` and `GET /api/app-data/migration`. The Workbench Schema Migration Preview panel shows the current and target app data schema versions, dry-run migration steps, affected app data areas, confirmation action id, plan hash requirement, and locked boundaries. The route and CLI preview do not write app data, execute shell commands, call models, open local files, change git state, approve review, pass main verification, or declare release readiness.
- v39 Backup / Diagnostics / Migration Workspace task-3 branch capability: `app-core-backup-export.v1`, `GET /api/backup/export`, `symphony backup export --json`, the Workbench `Backup Export` panel, and the Desktop Shell backup readiness fields expose managed app core state hashes, manifest hash, and ArtifactStore refs without copying repo source, docs, tests, `.git`, package manifests, lockfiles, artifact payloads, or arbitrary local paths.
- v39 Backup / Diagnostics / Migration Workspace task-4 branch capability: `app-core-diagnostics-bundle.v1`, `GET /api/diagnostics/bundle`, `symphony diagnostics bundle --json`, the Workbench `Diagnostics Bundle` panel, and Desktop Shell diagnostics readiness fields expose sanitized health, runtime versions, recent failures, gate status, and structured log refs without copying raw logs, secret values, repo source, artifact payloads, or arbitrary local paths.
- v39 Backup / Diagnostics / Migration Workspace task-5 branch capability: `app-core-restore-validation.v1`, `GET /api/restore/validate`, `symphony restore validate --json`, the Workbench `Restore Validation` panel, and Desktop Shell restore readiness fields validate backup manifest integrity and compatible restore path without reading arbitrary bundle paths, applying restore data, overwriting app state, or adding a confirm/apply route.
- v40 Personal Workflow Router + App Core Release Closeout task-1 branch capability: `inbox-capture.v1`, `GET /api/inbox/capture`, `symphony inbox capture --json`, and the Workbench `Inbox Capture` panel expose raw request, project clue, idea, and fault capture entrypoints before Workbench routing without persisting capture items, forcing goal creation, executing shell commands, invoking models, writing git state, self-approving, main-verifying, or declaring release readiness.
- v40 Personal Workflow Router + App Core Release Closeout task-2 branch capability: `workflow-router-categories.v1`, `GET /api/workflow/router-categories`, and the Workbench `Workflow Router` panel expose request categories for direct-answer, skill, automation, Workbench goal, research, and ignore/skip paths. The route is read-only, rejects query parameters, and does not persist route decisions, create goals, fetch research, invoke models, execute shell commands, or declare release readiness.
- v40 Personal Workflow Router + App Core Release Closeout task-3 branch capability: `goal-draft-handoff.v1`, `GET /api/workflows/goal-draft-handoff`, and the Workbench `Goal Draft Handoff` panel expose draft-only goal/runbook handoff fields, copy-only dry-run command text, checklist items, blockers, and endpoint fields. The contract sets draft-only and no-write flags and does not auto-register a goal, run `goal init`, invoke models, write files, merge, push, tag, publish, self-approve, or declare release readiness.
- v40 Personal Workflow Router + App Core Release Closeout task-4 branch capability: `app-core-release-manager.v1`, `GET /api/release/app-core-manager`, and the Workbench App Core Release Manager panel summarize v34-v39 capability status, closeout gaps, release gate status, final evidence draft sections, source counts, and locked safety boundaries without writing release evidence, emitting goal events, running closeout, tagging, pushing, publishing, invoking models, running provider CLIs, or inferring readiness from frontend state.
- v40 Personal Workflow Router + App Core Release Closeout task-5 branch capability: the closeout handoff draft creates a v41 starter context for menu bar, notch, native distribution, UX polish, and distribution evidence packages. The Workbench view remains display-only and copy-only; it does not start native distribution work, execute commands, publish, or declare release readiness.
- v41 Controlled CLI Provider Runner + Backend Completion defines a backend-owned runner contract and allowlist for `claude-code-cli` and `codex-cli`, provider-specific command templates, sanitized operation evidence, and Workbench preview/confirm binding. The release evidence records controlled timeout evidence for active provider attempts rather than successful provider CLI completion; Gemini, Kiro, and DeepSeek are not active providers, and the UI does not execute provider CLIs or arbitrary shell commands.
- v42 Goal Supervisor Runtime Context Loop records the managed-goal supervisor baseline for state store and routing, App thread adapter, workspace/evidence gates, daemon heartbeat/progress monitor, and Workbench/CLI projection. The tracked runbook treats the external local supervisor as historical/reconciliation input and does not claim that the full temporary supervisor was already merged into product code.
- v43 Goal Supervisor Stabilization completes the scoped supervisor stabilization runbook with goal status, closeout, release gate registration, and daemon health evidence. The release evidence does not include repository tag/full release checklist, mutation, audit, `pnpm mcas doctor`, provider CLI gates, push, publish, or repository release publication.
- v44/v44.1 Project-Internal Goal Supervisor Core integrates the internal supervisor core and records a partial release-gate phase for `pnpm check`, `pnpm test`, and `pnpm workbench:build`. The v44 release evidence still listed `release.diff-check` and `release.docs-updated` as remaining work and did not declare release readiness in that phase.
- v44.2 Supervisor Architecture Consolidation records the architecture consolidation closeout snapshot for supervisor ownership and migration boundaries before the app-facing contract work. It remains a planning/closeout snapshot, not an execution, daemon-control, provider-CLI, or release automation surface.
- v44.3 App Contract and Context Supervisor adds the app-facing `goal-supervisor-app-read-model.v1`, read-only supervisor API routes, read-only `symphony supervisor status --json`, `sessionContext.v1`, and conservative command-boundary projection. The default command boundary is disabled, `executionAvailable` is false, `copyOnly` is true, and blocked command families include provider CLI, real CLI, generic shell, daemon launch, child dispatch, goal ledger writes, event log writes, mutation, audit, tag, release push, release publish, GitHub Release, and release closeout.
- v44.4 Workbench Supervisor Dashboard Prototype adds a read-only `/workbench/supervisor/` prototype that reads `goal-supervisor-app-read-model.v1` when available and falls back to frontend fixtures when the live route is unavailable. The prototype covers supervisor summary, recommended next action, lease, context, pending result, command boundary, timeline, current gate, and ownership panels without mutating goal state, registering events, dispatching children, starting or stopping a daemon, consuming pending result escrow, or implementing v45 backend entrypoints.
- v45 Backend Entrypoint Decomposition splits HTTP helper, route registry, service, and CLI dispatch code out of `src/symphony/console.js` and `scripts/symphony.js` while keeping compatibility entrypoints, stable API paths, and stable CLI commands in place. It does not change `goal-supervisor-app-read-model.v1`, add Workbench command execution, change supervisor kernel semantics, or prepare tag, publish, GitHub Release, or release closeout automation.
- v46 Workbench Supervisor Dashboard is the read-only supervisor dashboard baseline at `/workbench/supervisor/`. It consumes the existing app-facing supervisor read model when live data is available, renders a local sample fallback through the same view projection when live data is unavailable, and shows route source/contract fields so operators can distinguish live state from fallback. It adds no executable dashboard controls, no form controls, no clickable evidence links, no frontend fetch path inside the v46 surface, no daemon start/stop/restart, no child dispatch, no provider CLI or real CLI invocation, no goal event registration, no git write, no release closeout automation, no tag, no publish, and no GitHub Release creation.
- v47 Mac App Shell Activation makes `/workbench/desktop/` the app-facing home surface for the current project, sidecar state, backend health, active goal, next action, supervisor summary, and read-only boundaries. It does not add a generic shell runner, provider CLI execution, daemon control, child dispatch, git push/tag/publish, or GitHub Release creation.
- v48 Project Launcher and Recent Projects puts Project Launcher before App Home, reads backend-known project registry state, and binds only backend-known project ids through `current-project-binding.v1`. It does not scan disk, accept arbitrary paths, mutate goals, launch providers, run jobs, or write git/release state.
- v49 Context Session Observability and Supervisor Advisory adds bounded `sessionContext.v1` extensions, `contextAdvisory.v1`, and advisory continuation state. It does not expose raw transcripts, compact transcripts, create new threads, dispatch children, start providers, or let the frontend read local session files.
- v50 Supervisor Controlled Event Registration connects the supervisor advisory surface to the existing `goal-update`, `goal-review`, and `goal-gate` dry-run preview and plan-hash confirm channel. It does not create a new event family, bypass `planHash`, or turn advisory text into provider execution.
- v51 Result Intake Evidence Escrow adds result intake preview/confirm contracts, evidence escrow, and `pendingResult.v1` projection for the supervisor event registration path. It does not treat pending result as a verdict, read raw transcript output, approve review, pass main verification, or declare release readiness.
- v52 System Golden Path adds `systemGoldenPath.v1` as a read-model projection over Project Launcher, App Home, Supervisor, Context Advisory, Result Intake, Event Preview / Confirm, Review / Gate, and Closeout state. It does not add provider execution, child dispatch, new thread product capability, transcript compaction, generic terminal, or release automation.
- v53 Controlled Child Dispatch Preview adds backend-owned child task preview evidence for worker/reviewer handoff planning. The Workbench surface remains preview/copy-only and does not dispatch children or create worktrees automatically.
- v54 Codex Provider Execution Pilot adds the tested Codex provider execution preview path behind explicit contracts. It does not turn Provider Hub into a generic provider launcher and does not make Kiro, Gemini, or unsupported providers active execution targets.
- v55 Codex Provider Run Recovery and Reviewer Handoff adds recovery and reviewer handoff evidence for controlled provider runs. It keeps raw provider output and local provider session paths out of the Workbench and evidence contracts.
- v56 Thread Continuation Reviewer Handoff Pack adds bounded continuation context for reviewer handoff. It does not expose raw transcripts, raw model output, local session JSONL files, or full provider payloads.
- v57 Review Gate Workbench Surface makes review gate state visible through explicit contracts and copy-only handoff. It does not auto-approve review, pass main verification, or infer release readiness from tests or UI state.
- v58 Release Closeout Operator Handoff Pack records closeout, release boundary, tag checklist, GitHub Release draft notice, and next-version context as read-only handoff data. Product code does not tag, push, publish, create a GitHub Release, or create the next goal.
- v59 Release Publication Evidence and Next Start Audit records v59 tag and GitHub Release publication facts, including empty assets and open-PR state, as read-only evidence. It does not create or edit tags, releases, PRs, or goals.
- v60 Stable Personal Workbench Release consolidates the v52-v59 Workbench chain into a documented local baseline with acceptance contracts, feature matrix, release boundary checklist, recovery guidance, and manual release prep. It does not add public distribution, notarization, auto-update, generic shell execution, renderer-side command execution, frontend local JSONL/session reads, raw transcript exposure, or release automation.
- v61 Workbench Operator Dry-run Evidence verifies the released v60 baseline from an operator session. It records release-state reconcile, route smoke evidence, operator checklist, recovery drill notes, closeout, and v62 handoff without adding product execution or release automation.
- v11 controlled kernel execution plans: `symphony do --write` creates an auditable isolated-workspace plan with the exact confirm command, and `symphony do --confirm-plan <plan-id>` executes only the frozen plan.
- v12 verified adoption: `symphony adopt --run <run-id>` freezes verifier-passing isolated workspace changes as a text-only patch plan, and `symphony adopt --confirm <adoption-id>` applies only that frozen patch after fingerprint and `git apply --check` validation.
- v12 adoption recovery visibility: confirmation writes a registered journal before `git apply`, and `symphony adopt --inspect <adoption-id> --json` reports plan refs, journal refs, latest confirmation state, and current worktree hash matches without writing files.
- v13 Workbench information architecture: the default console view is a compact Overview, with adoption recovery, runs, diagnostics, artifacts, and raw/debug detail behind dedicated read-only sections.
- v13.1 Workbench Chinese presentation layer: visible Workbench labels, empty states, status text, and command descriptions render in Chinese while JSON contracts, status enums, and copy-only commands remain stable.
- Curl-installable global `symphony` and `mcas` shims for use from any repository without `pnpm link --global`.
- Kernel/debug `pnpm mcas` commands for doctor, project intake, GitHub issue intake, manual queueing, task execution, smoke dispatch, Harness Bridge execution, and eval replay dispatch.
- V1.5 Harness Bridge dry-run execution across implemented TaskPacket modes, plus gated real CLI lanes from JSON TaskPackets into Symphony artifacts and Harness verification records.
- V2 ensemble flows for proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch, with verifier-readable role, lane, QA, and candidate evidence.
- Continuation turns and stall detection in `orchestrator.runCommand`, including retryable verifier failures, activity tracking, and `stall-timeout` records.
- Security gates for redaction, path/shell/network policy, and adapter-local permission mapping.
- External eval replay plugin flow for stored artifacts, including workflow-mode comparison reports for linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch evidence.

Latest completed mainline release: `v60`. Current released repository tag: `v60`. The `v8` tag remains the stable installer baseline, and `v7` remains available for historical installs. v20-v28 complete the Workbench v1 goal operation chain through release closeout; v29-v32 extend that chain with controlled implementation, adoption, main verification, release baseline/checklist, evidence drafts, and next-version handoff; v33-v40 add local runtime, app core, provider hub, backup/diagnostics/migration, workflow router, and read-only app surfaces; v41-v46 cover controlled provider-runner backend evidence, supervisor runtime/stabilization, supervisor app read model, dashboard prototype, backend entrypoint decomposition, and the read-only Workbench Supervisor Dashboard baseline; v47-v60 move the daily app path through Mac App Home, Project Launcher, Context Advisory, Event Preview / Confirm, Result Intake Evidence Escrow, System Golden Path, child dispatch preview, Codex provider execution preview, provider recovery, thread continuation, review gate, release closeout handoff, release publication evidence, and stable baseline evidence. Current main is v61 operator dry-run evidence work; `v61` is not tagged or released.

Current v60 release and v61 mainline work do not include Autopilot, generic Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation outside explicitly controlled provider contracts, live job runner, persistent job execution, Workbench command execution, daemon start/stop/restart, unsupported provider launch, real CLI invocation outside existing controlled preview/confirm paths, raw transcript exposure, raw model output exposure, frontend local JSONL/session/provider folder reads, automatic merge, automatic tag, push, publish, GitHub Release creation, release closeout automation, public distribution, notarization, auto-update, or release-ready inference. Browser views do not execute CLI commands shown as text. The Project Launcher, App Home, Supervisor Dashboard, Desktop Shell, Action Registry preview, Job Console, Provider Hub, Result Intake, Event Preview / Confirm, Review Gate, Release Closeout, Release Publication Evidence, and Stable Baseline views are contract/display or controlled preview/confirm surfaces, not generic execution surfaces.

Current v61 mainline: Workbench Operator Dry-run Evidence. The verification path is Project Launcher, App Home, Supervisor, Context Advisory, Result Intake, Event Preview / Confirm, Review / Gate, Closeout, Release Publication Evidence, and Stable Baseline. The operator records route, source contract, release boundary, disabled capability, recovery, validation, and handoff evidence without adding a provider launcher or release automation.

## Design Center

The central abstraction is `CommandSpec`, not a long prompt. A command such as `plan`, `implement`, `review`, `fix-ci`, or `qa` defines input schema, allowed tools, workspace policy, completion criteria, and evidence requirements.

CLI-specific behavior belongs in `AdapterMapping`. Model-specific behavior belongs in `ModelProfile`. Verification belongs in `Verifier` and should rely on evidence, not model self-report.

Project implementation follows BDD plus TDD. Behavior scenarios are written before implementation, failing tests are written before production code, and module completion requires verifier-readable evidence.

## V1 Scope

V1 should prove a single-writer, multi-review flow:

- One issue has one primary writer workspace.
- Review and QA agents run in separate workspaces.
- Shared state is stored as artifacts, session events, traces, and evidence.
- The first tracker should be one of GitHub or Linear, not both.
- The first adapters should be Codex plus one of Claude Code or Kiro CLI.

## Development

This repository currently uses Node.js built-in tooling with no third-party runtime or test dependencies.

Run checks:

```sh
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
pnpm mcas intake --project-dir . --runtime-dir tmp/v7-intake-runtime
node scripts/symphony.js doctor
pnpm symphony doctor
pnpm symphony scan
pnpm symphony do --dry-run "inspect README"
pnpm --silent symphony do --write --json "inspect README"
pnpm --silent symphony do --confirm-plan <plan-id> --json
pnpm --silent symphony adopt --run <confirmed-run-id> --json
pnpm --silent symphony adopt --inspect <adoption-id> --json
pnpm --silent symphony adopt --confirm <adoption-id> --json
pnpm symphony verify --dry-run "inspect README"
pnpm symphony "扫描这个仓库"
pnpm symphony "审查当前改动"
pnpm symphony status
pnpm symphony goal-status
pnpm symphony goal-status --json
pnpm symphony goal-status --markdown
pnpm --silent symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
pnpm --silent symphony goal next --goal v19-fixture --json
pnpm --silent symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
pnpm --silent symphony goal closeout --goal v19-fixture --json
pnpm symphony console --snapshot --json
pnpm --silent symphony diagnose --json
pnpm --silent symphony diagnose --html > tmp/symphony-diagnostics.html
pnpm --silent symphony runtime health --json
pnpm --silent symphony runtime projects --json
pnpm --silent symphony runtime snapshot --json
pnpm --silent symphony runtime current --json
pnpm --silent symphony actions manifest --json
pnpm --silent symphony actions availability --json
pnpm --silent symphony actions preview --action goal.worker-evidence.record --json
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Install the user CLI:

```sh
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v8/install.sh | sh
symphony doctor
```

The installer clones or updates the `v8` release under `~/.local/share/mcas`, writes `~/.local/bin/symphony` and `~/.local/bin/mcas` shims, installs dependencies with `pnpm install --frozen-lockfile`, and verifies the install with `symphony doctor`. The `v8` tag remains the stable installer baseline; set `MCAS_INSTALL_REF=v59` when you intentionally want the current tagged release. Set `MCAS_INSTALL_REF=v7` only when you need the historical v7 CLI; `MCAS_INSTALL_DIR`, `MCAS_BIN_DIR`, `MCAS_REPO_SLUG`, and `MCAS_REPO_URL` override the other defaults.

Development fallback from a checkout:

```sh
pnpm install
pnpm symphony doctor
```

Run Workbench v1:

```sh
pnpm workbench:build
symphony console
```

Then open `http://127.0.0.1:8765/workbench/`.

The v37 Tauri shell remains available as a native-shell boundary. The current daily app path is `/workbench/desktop/` and the broader Workbench remains available under `/workbench/`; both stay display-only or controlled preview/confirm by contract.

Advanced/script CLI entry:

```sh
symphony doctor
symphony goal-status --goal <goal-id> --json
symphony goal next --goal <goal-id> --json
symphony goal prompt --goal <goal-id> --next --markdown
symphony goal closeout --goal <goal-id> --json
symphony console --snapshot --json
symphony diagnose --json
symphony diagnose --html > report.html
symphony runtime health --json
symphony runtime projects --json
symphony runtime snapshot --json
symphony runtime current --repo-path /path/to/repo --json
symphony actions manifest --json
symphony actions availability --json
symphony actions preview --action goal.worker-evidence.record --json
symphony scan
symphony do --dry-run "inspect README"
symphony verify --dry-run "inspect README"
symphony status
symphony artifacts
```

`symphony scan` is the compatibility name for the v7 intake/grill-me-docs capability. In default `auto` mode it tries optional `grill-me-docs` first, records provider attempts in JSON output, and falls back to the built-in provider when grill-me-docs is unavailable. Use `--builtin` for built-in-only scans and `--require-grill` for a hard failure when grill-me-docs is unavailable.
`symphony do`, `symphony review`, `symphony qa`, `symphony verify`, `symphony status`, `symphony continue`, and `symphony artifacts` remain advanced/script and compatibility commands. They are not the Workbench v1 top-level action list. Prompt routing remains deterministic and model-free for these CLI flows.
`symphony do --write` is controlled in v11: without `--confirm-plan` it only writes a `symphony.execution-plan` artifact under `.symphony/plans/` and records a planned run. The confirm command reloads that frozen plan, rejects prompt drift, verifies the project fingerprint, checks any required real-agent gate, and then runs the existing kernel workflow in a materialized isolated workspace. It does not apply patches to the main worktree; `mainWorktreeWrites` remains `false`.
`symphony adopt` is controlled in v12: `symphony adopt --run <confirmed-run-id>` only reads a passed v11 isolated-workspace run, verifies source evidence/workspace refs, rejects dirty non-Symphony main worktree changes, and writes `.symphony/adoptions/<adoption-id>.json` plus a registered patch artifact. `symphony adopt --confirm <adoption-id>` accepts no prompt text or execution flags; it rechecks project/git/source/patch fingerprints, runs `git apply --check`, writes `.symphony/adoptions/<adoption-id>-journal.json` plus an `applying` confirmation state, and then applies only the frozen text add/modify patch to the main worktree. `symphony adopt --inspect <adoption-id> --json` is read-only and reports plan refs, journal refs, latest confirmation state, and current worktree matches against `afterHash` and journal `beforeFiles`. Adoption does not invoke adapters, models, package installers, or external services.
New-project prompts produce a `scaffoldPlan` and a separate `scaffold-manifest` artifact. Framework-shaped requests such as React or Vite are reported as unsupported generator requests; Symphony does not run npm installs, framework generators, or dependency installation, and `--write` is still required before any files are created.
Every product `--json` response keeps its legacy top-level fields and adds a stable machine-readable envelope: `contractVersion`, `contractName`, `identity`, `safety`, `workflow`, `artifactRefs`, `action`, and `timestamps`. `symphony console --snapshot --json` returns the same read-only run model without starting a server; see [Symphony Product JSON Contracts](docs/symphony-product-contracts.md) for v8.2 and v9 contract examples.
`symphony console` starts the local Workbench server on `127.0.0.1:8765` by default. The React/Vite Workbench build is served under `/workbench/` after `pnpm workbench:build`, while `/` remains the existing console HTML. Workbench v1 uses the active goal APIs for runbook, next action, prompt pack, events, operations, review workspace, closeout gaps, and release closeout. The legacy run APIs remain available for latest-run context, diagnostics, artifact refs, and safe previews. It does not add browser shell execution, generic write controls, retry, adopt, apply, rollback, delete, install, audit, model invocation, automatic merge, automatic tag, or arbitrary path-read controls. Safe artifact preview only reads registered artifact refs, never accepts a user path, and renders inline text only when the backend returns `safe-artifact-preview.v1` with `safeToRenderInline === true` and bounded text content. The React Workbench must not infer missing preview fields such as `safeToRenderInline`, `mime`, `previewAvailable`, `artifactKind`, `uri`, or `ref`. See the [Workbench Operator Guide](docs/workbench-operator-guide.md) for the current operator boundary and troubleshooting notes.
v18 extends the same console with `GET /api/goals/latest/events` and `GET /api/goals/<goal-id>/events`. Workbench adds Goal Events Timeline and Evidence Matrix panels that display `goal-event-log.v1` and `goal-progress-ledger.v1` fields only. v20-v32 make the goal/runbook flow the Workbench daily path from active goal through release closeout and next-version handoff. v33-v40 add runtime/project/snapshot state, Action Registry, Job Console, artifact/evidence views, Desktop Shell, Provider Hub, backup/diagnostics/migration previews, workflow routing, goal draft handoff, app-core release manager, and native UX handoff contracts. v41-v46 add controlled provider-runner backend evidence, supervisor runtime/stabilization records, supervisor app read model, dashboard prototype, backend entrypoint decomposition, and the read-only Workbench Supervisor Dashboard baseline. v47-v59 add App Home, Project Launcher, Context Advisory, Event Preview / Confirm, Result Intake Evidence Escrow, System Golden Path, child dispatch preview, Codex provider execution preview, provider recovery handoff, thread continuation, review gate, release closeout handoff, and release publication evidence. v60 consolidates those surfaces into a stable local Workbench baseline. Evidence refs remain references; the browser and renderer do not download, open, preview arbitrary paths, run actions/jobs, run provider CLIs, control daemons, automate release closeout, compact transcripts, create new threads, read local session files, or read evidence documents to decide whether a task is approved, main-verified, or release-ready.
`GET /api/diagnostics/bundle` returns `app-core-diagnostics-bundle.v1` with sanitized health, versions, recent failures, gate status, and structured log refs. It accepts only `goal` and `task` query parameters; it does not return raw log bodies, secrets, arbitrary local paths, shell execution controls, model invocation, git writes, self-approval, or release decisions.
`GET /api/restore/validate` returns `app-core-restore-validation.v1` with backup manifest integrity checks and restore compatibility status. It accepts only `goal` and `task` query parameters; it does not read arbitrary bundle paths, apply restore data, overwrite managed state, execute shell commands, call models, write git state, self-approve, or decide release readiness.
`symphony diagnose` reads the same `.symphony` state and readiness probes without starting the Workbench. The default output is a compact terminal summary; `--json` emits the stable `symphony.diagnostics-report` contract; `--html` writes a single static, script-free HTML document to stdout so it can be redirected with `symphony diagnose --html > report.html`. `--json` and `--html` are mutually exclusive, `--state-dir <path>` selects an alternate state directory, and all suggested commands remain copy-only text. v12 diagnostics surface pending/stale adoption plans, unsupported adoption changes, dirty-worktree blockers with dirty path details, applying adoption journals, and post-apply evidence failures.

`.symphony/` stores local user-facing pointers and summaries. Add it to your local ignore rules if you do not want run pointers in source control. Full evidence, TaskPackets, Harness output, scaffold manifests, and intake artifacts stay in the runtime artifact directories written through `ArtifactStore`.

Advanced/script and compatibility commands:

```sh
symphony intake
symphony intake --project-dir . --output-dir tmp/symphony-intake
symphony work --dry-run "inspect README"
symphony work --preflight-intake --dry-run "inspect README"
symphony work --intake-artifact tmp/symphony-intake/<run-id>/runtime/artifacts/project-intake/project-context.json --dry-run "inspect README"
symphony work --mode writer-reviewer --dry-run "update README"
symphony work --mode qa-swarm --dry-run "inspect README"
symphony agent claude /review --dry-run
symphony replay --artifacts tmp/artifacts --events tmp/events --reason model-upgrade
```

Advanced kernel/debug commands remain under `pnpm mcas`:

```sh
pnpm mcas doctor
pnpm mcas doctor --real-cli --proof-dir tmp/real-cli-proofs
pnpm mcas intake --project-dir . --runtime-dir .mcas
pnpm mcas intake --project-dir . --provider grill-me-docs --provider-command grill-me-docs
pnpm mcas github issue --repo OWNER/REPO --number 123
pnpm mcas queue manual --state-file .mcas/queue.json --id task-1 --repo OWNER/REPO --objective "Do the work" --acceptance "Verifier evidence is written"
pnpm mcas run-next --state-file .mcas/queue.json --runtime-dir .mcas
pnpm mcas run-task --task-file task.json --runtime-dir .mcas
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
MCAS_RUN_REAL_CODEX=1 pnpm smoke:harness:codex:real
pnpm mcas smoke codex
pnpm mcas eval replay -- --artifacts tmp/artifacts --events tmp/events --reason model-upgrade
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

`symphony scan` scans a checkout in read-only mode, writes `project-context` and `intake-summary` JSON artifacts through `ArtifactStore` under task id `project-intake`, and writes latest context/run pointers under `.symphony/`. The built-in provider is deterministic and does not invoke models. Default `auto` and explicit `--grill` try the optional `grill-me-docs` adapter with builtin fallback; `--builtin` stays builtin-only; `--require-grill` fails when the provider is unavailable.
`symphony do` is the default product workflow entry. It creates a minimal Harness TaskPacket under `tmp/symphony-work/<run-id>/`, runs the existing Harness Bridge in dry-run mode by default, and prints intent, pipeline, safety mode, verifier status, artifact paths, and next action. Real CLI lanes are advanced compatibility paths and require the matching `MCAS_RUN_REAL_*` gate; they are not v60 Workbench execution controls.
`symphony intake` and `symphony work` remain advanced compatibility commands. Their default JSON behavior is preserved unless routed through the v8 aliases.
`symphony review` and `symphony qa` route through the v8 product work path; use `symphony work --mode qa-swarm` for the advanced legacy qa-swarm path.
`symphony agent claude /review --dry-run` captures native command metadata and a proof artifact without invoking Claude. Add `--real` only with `MCAS_RUN_REAL_CLAUDE=1`.
`symphony harness ...` and `symphony replay ...` are compatibility passthroughs to the existing `mcas harness ...` and `mcas eval replay ...` paths.
`mcas` remains the advanced kernel/debug CLI for queueing, TaskSpec files, direct Harness TaskPackets, smokes, and low-level diagnostics.

Command hierarchy:

```text
symphony intake   read-only project context scan
symphony work     advanced workflow entry
symphony scan     product project scan alias
symphony do       product work alias
symphony verify   product verification alias
symphony status   latest run state
symphony artifacts artifact and evidence pointers
symphony console  local Workbench v1 server
symphony diagnose read-only diagnostics report
symphony runtime  local runtime health and boundary status
symphony actions  local action registry manifest, availability, and preview
symphony adopt    controlled verified adoption
symphony new      limited dry-run/write project bootstrap
symphony agent    native CLI passthrough
symphony review   shortcut for review workflow
symphony qa       shortcut for QA workflow
symphony replay   eval replay reports
symphony doctor   environment and gate checks
mcas              advanced kernel/debug commands
```

`doctor --real-cli` preflights installed real CLI binaries, gate variables, configured model profiles, provider/auth alignment, and optional proof artifact writing without invoking a model.
`mcas intake` is the machine-facing project intake surface. It accepts `--project-dir`, `--runtime-dir`, `--artifact-dir`, `--event-dir`, `--session-id`, `--provider`, `--provider-command`, `--require-provider`, `--fail-on`, and `--format`. It writes `.mcas/artifacts/project-intake/project-context.json` and `.mcas/artifacts/project-intake/intake-summary.json` by default.
`github issue` is read-only issue intake. It calls `gh issue view`, converts the response into a validated `TaskSpec`, and does not invoke a model.
`queue manual` writes a validated manual `TaskSpec` into a persistent `TaskQueue` state file without invoking adapters.
`run-next` leases the next queued task and runs the existing standard dry-run workflow, returning verifier status and artifact ids.
`run-task` runs a TaskSpec JSON file through the same dry-run workflow without reading or writing queue state.
`harness run-taskpacket` converts a Harness JSON TaskPacket into Symphony artifacts and Harness verification records. Supported `workflow.mode` values are `linear`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch`; real CLI adapter selection is an advanced compatibility path gated by `MCAS_RUN_REAL_*`, not a v60 Workbench provider launcher.
`smoke <codex|claude|kiro>` dispatches the existing package smoke scripts and propagates their exit codes; add `--real` only when the underlying real smoke gate is intended. Set `MCAS_REAL_CLI_PROOF_DIR=<dir>` during real smokes to persist release proof artifacts; Claude proof artifacts include requested and observed model profiles when the CLI reports an init model.
`eval replay` dispatches the existing eval replay package script and passes through all remaining arguments. Add `--workflow-comparison-file <json>` or `--workflow-comparison-fixture workflow-comparison` to write a verifier-first comparison report artifact without invoking real CLIs.

Workflow commands also accept `--config mcas.config.json`. The config file can provide `runtime.stateFile`, `runtime.artifactDirectory`, `runtime.eventDirectory`, `runtime.workspaceDirectory`, and `runtime.sessionId`; explicit command flags take precedence.
