# v15 Workbench React/Vite Migration Plan

Date: 2026-05-26
Status: candidate

## Objective

Migrate the local, read-only Symphony Workbench display from the current server-rendered single HTML string to a React/Vite frontend, while preserving the v12 verified-adoption safety model, the v14 Stage kernel, the Stage Charter HTML/JSON boundary, and the v13/v14 Workbench principle that the UI is a Chinese-first, low-density, copy-only state surface.

This candidate discovery stage creates only documentation and Stage Charter artifacts. It does not change production code, does not modify `package.json` or `pnpm-lock.yaml`, and does not install dependencies.

## Inputs Reviewed

- `docs/plans/v14-release-evidence-2026-05-26.md`
- `docs/plans/v14-reviewer-approval-2026-05-26.md`
- `docs/plans/v14_stage_kernel_refactor_handoff.md`
- `docs/stages/v14-stage-kernel-refactor.stage.json`
- `docs/stages/v14-stage-kernel-refactor.html`
- `src/symphony/console.js`
- `src/symphony/stage.js`
- `src/symphony/adoption-inspect.js`
- `tests/symphony-cli.test.js`

## Stage Charter HTML vs React/Vite Workbench

Stage Charter HTML is a committed display artifact generated from `docs/stages/<stage-id>.stage.json`. JSON is the machine source of truth. HTML is display-only and participates in the Stage Charter consistency gate.

React/Vite Workbench is the runtime browser surface served by `symphony console`. It consumes local GET APIs and `.symphony` summaries/refs indirectly through those APIs. It must not replace, edit, or infer data from Stage Charter HTML.

## .symphony / ArtifactStore Boundary

`.symphony` continues to store only summary, ref, and pointer state. It is not canonical evidence storage.

Allowed `.symphony` state is limited to compact local product state such as active Stage pointers, latest run pointers, run ids, stage ids, adoption ids, artifact refs, local paths that already belong to registered run state, statuses, timestamps, counts, top risk summaries, blocker summaries, next-action summaries, and copy-only command text.

`.symphony` must not store:

- complete high-risk evidence;
- complete repair plans;
- complete blocked snapshots;
- complete adoption-aware evidence.

ArtifactStore remains canonical for TaskPackets, Harness output, evidence packages, full high-risk evidence, repair plans, blocked snapshots, adoption-aware evidence, patch artifacts, scaffold manifests, intake artifacts, and verifier-readable artifacts. `.symphony` may store compact summaries, paths, artifact refs, active Stage pointers, latest run pointers, blocker summaries, and next-action summaries.

React/Vite Workbench may read `.symphony` only through existing server-side readers and `/api/*` aggregate responses. It must not treat `.symphony` as a canonical evidence store, must not bypass ArtifactStore to interpret high-risk evidence directly, and must not add browser-side direct reads of high-risk evidence files.

## v13/v14 UI Principles

The migration is parity-first. It is not a UI redesign or visual system rebuild.

Workbench remains:

- Chinese-first / 中文优先: visible labels, empty states, status text, command descriptions, and primary Workbench copy are Chinese unless a stable JSON enum, id, command, or file path must remain literal;
- low information density / 低信息密度: the first screen stays compact and avoids dense evidence, raw JSON, or diagnostics dumps;
- read-only;
- copy-only;
- a state surface, not an execution surface.

The homepage default must show only:

- current Stage;
- Stage goal;
- Stage status;
- top risks;
- blocker;
- next action.

Run, evidence, adoption, diagnostics, and raw JSON details must stay behind folded or secondary detail surfaces.

## v12 Adoption Safety Boundaries

The v15 React/Vite migration is not allowed to modify the v12 adoption safety kernel.

Explicit non-goals:

- Do not change the v12 adoption apply safety kernel.
- Do not modify v12 fingerprint verification logic.
- Do not modify v12 dirty worktree check logic.
- Do not modify v12 `git apply --check` logic.

## v14 / Project Boundaries

The migration is a Workbench display migration only. It does not change the project workflow surface outside that scope.

Explicit non-goals:

- Do not rewrite the v14 Stage kernel.
- Do not rewrite the Stage gate.
- Do not rewrite blocked snapshot recovery.
- Do not add GitHub / PR integration.
- Do not make `mcas` the daily primary entry point again.

## Non-Goals

- Do not change the v12 adoption apply safety kernel.
- Do not modify v12 fingerprint verification logic.
- Do not modify v12 dirty worktree check logic.
- Do not modify v12 `git apply --check` logic.
- Do not rewrite the v14 Stage kernel.
- Do not rewrite the Stage gate.
- Do not rewrite blocked snapshot recovery.
- Do not add GitHub / PR integration.
- Do not make `mcas` the daily primary entry point again.
- Do not add browser write, execute, retry, adopt, adopt-confirm, confirm-adoption, apply, rollback, delete, package install, dependency install, model invocation, real agent invocation, arbitrary file read, arbitrary path read, arbitrary path input, mutation trigger, or audit trigger controls.
- Do not replace Stage Charter HTML with React/Vite Workbench.
- Do not implement full Autopilot.
- Do not implement Agent Capability Registry.
- Do not turn the React/Vite migration into a UI redesign or visual system rebuild.
- Do not modify `package.json` or `pnpm-lock.yaml` during discovery.
- Do not install dependencies during discovery.
- Do not install React/Vite during implementation without an approved dependency plan.

## Current Workbench API Contract Inventory

All current Workbench server routes are GET-only. Non-GET requests return HTTP 405 with `{ "status": "error", "message": "console is read-only" }`.

### `GET /api/health`

- Source: `createSymphonyConsoleServer`
- Response: `{ status: "ok", readOnly: true }`
- Current sufficiency: enough for a lightweight liveness/read-only check.
- v15 contract gap: no `contractName`, `contractVersion`, or generated timestamp.

### `GET /api/summary`

- Contract: `symphony.console-snapshot`
- Producer: `buildConsoleSnapshot`
- Important fields:
  - `contractVersion`, `contractName`, `contract`
  - `generatedAt`, `stateDir`, `status`
  - `overview`
  - `stageSummary`
  - `adoptionSummary`
  - `latestContext`
  - `latestRun`
  - `runs`
  - `adoptionPlans`
  - `adoptionJournals`
  - `runStats`
  - `riskSummary`
  - `recommendedCommands`
  - `commandGroups`
  - `action.next`
- Current sufficiency:
  - Enough for React overview, Stage panel, run list, adoption summary, risk panel, command copy rows, and top-level navigation badges.
  - `overview.status/headline/topRisks/nextAction` is sufficient for the first screen.
  - `stageSummary.stageId/active/status/goal/topRisks/blocker/consistency/gateEvents/blockedSnapshotRef/repairArtifactRef/nextAction` is sufficient for the v14 Stage overview.
  - `latestRun`, `runs`, `runStats`, `riskSummary`, and `commandGroups` are sufficient for current run and diagnostics panels.
- v15 contract gaps:
  - Add a fixture-backed schema or generated frontend type for `symphony.console-snapshot`.
  - Add a stable `capabilities` object, for example `readOnly: true`, `copyOnlyCommands: true`, `browserWrites: false`, `modelInvocation: false`.
  - Add stable Stage compact metadata for `owner`, `createdAt`, `updatedAt`, and `charterHash`; these exist in Stage Charter JSON but are not exposed in `compactStageCharter`.
  - Add explicit task/run/evidence/adoption relationship fields instead of requiring React to infer links from paths and ids.
  - Preserve `.symphony` as summary/ref/pointer state only; React must not infer canonical evidence from `.symphony` paths.
  - Avoid binding React to `rawRunState`; consume compact/decorated fields only.

### `GET /api/readiness`

- Contract: `symphony.console-readiness`
- Producer: `buildConsoleReadiness`
- Important fields:
  - `contractVersion`, `contractName`, `contract`
  - `generatedAt`, `stateDir`, `cwd`, `status`
  - `readOnly: true`
  - `modelInvocation: false`
  - `tools.node`
  - `tools.packageManager`
  - `tools.git`
  - `tools.github`
  - `tools.realCli`
  - `checks`
  - `riskSummary`
  - `recommendedCommands`
  - `commandGroups`
- Current sufficiency:
  - Enough for readiness panel, local environment badges, dirty worktree/adoption warnings, and copy-only remediation commands.
  - `readOnly` and `modelInvocation` are already explicit.
- v15 contract gaps:
  - Status enum and tool object shape should be documented as frontend contract, not just implementation shape.
  - Add a top-level `capabilities` object aligned with `/api/summary`.
  - Redaction expectations should be covered by fixtures.

### `GET /api/runs?filter=<filter>`

- Contract: `symphony.console-runs`
- Producer: route-local response using `listRunStates`, `compactRunState`, and `decorateConsoleRuns`
- Supported filters: `all`, `passed`, `failed`, `dry-run`, `real`, `scan`, `verify`, `adoption`
- Important fields:
  - `contractVersion`
  - `contractName`
  - `filter`
  - `availableFilters`
  - `runs`
- Current sufficiency:
  - Enough for current run list and filter tabs.
  - `runs` entries are decorated with artifact health, timeline, recommended commands, command groups, and risk summary.
- v15 contract gaps:
  - Add explicit sort semantics; current behavior depends on `listRunStates`.
  - Add total counts or pagination policy for large local histories.
  - Add a stable compact run interface for list rows.

### `GET /api/runs/latest`

- Contract: `symphony.console-run`
- Producer: `writeRunResponse`
- Important fields:
  - `contractVersion`
  - `contractName`
  - `run`
  - `rawRunState`
- Current sufficiency:
  - `run` is enough for run detail, timeline, artifact refs, command groups, and risk summary.
  - `rawRunState` can support deep debug panels.
- v15 contract gaps:
  - React should not depend on `rawRunState` for normal UI.
  - Add documented debug-only status for `rawRunState`, or move raw state behind an explicit debug affordance.

### `GET /api/runs/<run-id>`

- Contract: `symphony.console-run`
- Producer: `writeRunResponse`
- Missing response: HTTP 404 with `{ status: "missing", runId }`
- Current sufficiency:
  - Same as `/api/runs/latest`; enough for selecting a specific run.
- v15 contract gaps:
  - Use a shared error envelope with `contractName`, `code`, and `message`.
  - Document whether `latest` is a reserved run id.

### `GET /api/runs/<run-id>/timeline`

- Contract: `symphony.console-run-timeline`
- Producer: `writeTimelineResponse`
- Important fields:
  - `contractVersion`
  - `contractName`
  - `runId`
  - `timeline`
  - `recommendedCommands`
- Current sufficiency:
  - Enough for timeline-only React panels and compact run drill-down.
- v15 contract gaps:
  - Timeline event ids/status enum should be fixed in a contract.
  - Stage gate events and adoption recovery events are not unified into this timeline; React must currently read those from `stageSummary` or adoption inspect.

### `GET /api/runs/<run-id>/artifacts/<kind>`

- Contract: `symphony.console-artifact`
- Producer: `writeArtifactResponse` and `previewArtifact`
- Success fields:
  - `contractVersion`
  - `contractName`
  - `runId`
  - `artifact`
- Artifact preview shapes:
  - Directory: `type: "directory"`, `entries`, `entryCount`, `limit`, `truncated`
  - File: `type: "file"`, `size`, `truncated`, `previewLimitBytes`, `format`, `content`, optional `json`, optional `parseError`, optional `message`
  - Missing file: `type: "missing"`, `message`
- Missing registered artifact kind:
  - HTTP 404 with `contractName: "symphony.console-artifact"`, `status: "missing"`, `runId`, `artifactKind`
- Current sufficiency:
  - Enough for current bounded preview UI.
  - Preview cap is 200 KiB and directory entries are capped at 100.
- v15 contract gaps:
  - Add stable artifact `uri` or `ref` separate from local path.
  - Add stable `size` or `sizeBytes`.
  - Add stable `mime`.
  - Add `title` or `displayTitle`.
  - Keep stable `type` and `format`.
  - Add `safeToRenderInline`.
  - Keep stable `truncated`.
  - Add source run id.
  - Add artifact kind.
  - Add preview availability, for example `previewAvailable: true | false` plus reason when unavailable.
  - Add a consistent error envelope for malformed, missing, and unregistered artifact cases.
  - Document local path display policy so React does not accidentally overexpose path detail.
  - Keep high-risk evidence interpretation behind ArtifactStore refs and server-side contract boundaries.

### `GET /api/adoptions/<adoption-id>/inspect`

- Contract: `symphony.console-adoption-inspect`
- Producer: `writeAdoptionInspectResponse` and `buildConsoleAdoptionInspectContract`
- Important fields:
  - `contractVersion`
  - `contractName`
  - adoption inspection summary fields from `buildAdoptionInspectionSummary`
  - `adoptionPlanId`
  - `adoptionPlanRefs`
  - `journalRef`
  - `sourceRun`
  - `executionPlanId`
  - `patchArtifactPath`
  - `patchHash`
  - `changedFiles`
  - `fileOperations`
  - `stageBinding`
  - `stageAdoptionSummary`
  - `journal`
  - `latestConfirmationRun`
  - worktree match booleans and details
  - `recommendedCommands`
  - `nextAction`
- Missing plan response: HTTP 404 with `{ status: "missing", message }`
- Current sufficiency:
  - Enough for adoption detail, recovery inspection, patch refs, journal status, changed files, and copy-only confirmation commands.
- v15 contract gaps:
  - Add a route manifest or API client method so React does not hand-build paths in each component.
  - Add a stable error envelope.
  - Mark `confirm-adoption` command as copy-only terminal command, not browser action.
  - Document safe adoption id encoding and validation expectations.

### Diagnostics-related routes

- There is no current `GET /api/diagnostics` route.
- Current diagnostics data is produced by `buildConsoleDiagnosticsReport` and exposed through `symphony diagnose --json`; the browser diagnostics view currently derives from `/api/summary` and `/api/readiness`.
- Contract: `symphony.diagnostics-report` for CLI/report output, not an HTTP route.
- Current sufficiency:
  - React can preserve current browser behavior using `/api/summary` plus `/api/readiness`.
- v15 contract gap:
  - Decide explicitly whether to keep diagnostics as derived frontend state or add a read-only `GET /api/diagnostics` route that wraps `buildConsoleDiagnosticsReport`.
  - If added, it must remain GET-only, model-free, write-free, and fixture-backed.

## Fields Already Sufficient for React/Vite

- `overview.status`, `overview.headline`, `overview.topRisks`, `overview.nextAction`
- `stageSummary.stageId`, `stageSummary.active`, `stageSummary.status`, `stageSummary.goal`, `stageSummary.topRisks`, `stageSummary.blocker`, `stageSummary.consistency`, `stageSummary.gateEvents`, `stageSummary.blockedSnapshot`, `stageSummary.blockedSnapshotRef`, `stageSummary.repairArtifactRef`, `stageSummary.nextAction`
- `stageSummary.stage.nonGoals`, `boundaries`, `tasks`, `risks`, `evidenceRefs`, `verificationProfile`, `riskPolicy`
- `adoptionSummary.status`, counts, and `dirtyBlocked`
- `latestRun` and `runs` compact/decorated fields, including timeline, artifact refs/status, risk summary, recommended commands, command groups
- `readiness.status`, `readOnly`, `modelInvocation`, tools, checks, risks, commands
- artifact preview `type`, `format`, `json`, `content`, `truncated`, `entries`
- adoption inspect refs, changed files, worktree match details, latest confirmation run, and copy-only commands

## Fields Needing v15 Contract Work

- Formal route manifest and frontend API client contract.
- Shared `capabilities` across summary/readiness/run responses.
- Shared error envelope for 400/404/405/500 responses.
- Stable enum documentation for statuses, risk severities, filter ids, timeline event status, artifact format, and command mode.
- Compact Stage metadata: `owner`, `createdAt`, `updatedAt`, `charterHash`.
- Task/run/evidence/adoption relationship fields that do not require path inference.
- Unified timeline model for runs, Stage gate events, adoption recovery, and blocked snapshot resolution.
- Blocker repair summary fields optimized for UI: repair steps, mismatch fields, frozen refs summary, and resolved event.
- Stable artifact refs with `uri` or `ref`, display label, MIME/language, path visibility policy, and inline rendering safety.
- Artifact preview contract fields: `uri` or `ref`, `size` or `sizeBytes`, `mime`, `title` or `displayTitle`, `type`, `format`, `safeToRenderInline`, `truncated`, `sourceRunId`, `artifactKind`, and `previewAvailable`.
- Frontend build metadata once React/Vite exists: app version, build time, and asset mode.

## Dependency Introduction Strategy

No dependencies are installed in discovery.

React/Vite dependency introduction is an independent high-risk task. It must be plan-only first, reviewer-approved, and no-auto-adopt.

Before any dependency install or `package.json` / `pnpm-lock.yaml` edit:

- write an explicit dependency plan;
- get independent reviewer approval;
- keep the dependency change as a separate commit or at least a separate change group;
- do not auto-adopt dependency changes; dependency introduction has no auto-adopt path;
- do not mix dependency changes with UI migration code in one large task;
- require reviewer inspection of `package.json` and `pnpm-lock.yaml`;
- do not run dependency installation in v15 implementation without the approved dependency plan.

Candidate dependency set for the later approved task:

- Runtime dependencies: `react`, `react-dom`
- Development dependencies: `vite`, `@vitejs/plugin-react`
- Optional only if chosen as a contract source: TypeScript and related test/type tooling

Rules:

- Do not use CDN-hosted frontend assets.
- Do not introduce a UI component framework in v15 unless a separate review approves the tradeoff.
- Keep the direct dependency set minimal.
- Update lockfile only in the dependency change.
- Run `pnpm audit --audit-level high` after dependency introduction.
- Keep React/Vite build output as static frontend assets served by the local console server; `/api/*` remains server-owned.

Discovery remains dependency-free and does not modify `package.json` or `pnpm-lock.yaml`.

## Phased Rollout and Fallback

v15 migration must preserve the existing console behavior until React bundle smoke and fixture parity gates pass.

Rules:

- Keep legacy Workbench fallback during migration.
- If the React bundle is missing, build fails, or static asset serving fails, `symphony console` must fall back to existing server-rendered or legacy static HTML, or provide an explicitly safe fallback page that preserves read-only status and access to `/api/*`.
- Do not remove or disable the legacy fallback until a separate reviewer-approved removal step after parity passes.
- Start with parity migration only; do not redesign interactions or visual language.
- Before replacing the root Workbench page with React, prove `/api/*` behavior remains v14-compatible.
- `POST`, `PUT`, `PATCH`, and `DELETE` requests continue to return HTTP 405.
- Migration must not affect `symphony console --snapshot --json`.
- Fixture parity gate must cover no runs, no active Stage, active Stage, blocked Stage, Charter mismatch, missing artifact, pending adoption, and dirty adoption.

## Scope Guard for This Candidate

This candidate changes only:

- `docs/plans/v15-workbench-react-vite-migration-plan-2026-05-26.md`
- `docs/stages/v15-workbench-react-vite-migration.stage.json`
- `docs/stages/v15-workbench-react-vite-migration.html`

This candidate must keep `package.json`, `pnpm-lock.yaml`, and production code under `src/` unchanged.

## Candidate Implementation Tasks

1. Freeze API fixtures for empty state, no active Stage, active Stage, blocked Stage, missing artifact, pending adoption, dirty adoption, and readiness attention.
2. Write the independent high-risk React/Vite dependency plan and obtain reviewer approval before any install.
3. Introduce React/Vite dependencies only as a separate approved change group.
4. Add a frontend API client boundary that maps route responses into stable UI types.
5. Add React/Vite shell with the existing Workbench navigation: overview, adoptions, runs, diagnostics, artifacts.
6. Port Stage overview first: Stage id, goal, status, blocker, top risks, next action.
7. Port run list/detail, timeline, artifact preview, readiness, diagnostics, and adoption inspect views as parity migration.
8. Add read-only safety tests proving non-GET requests still return 405 and the DOM exposes no prohibited controls.
9. Add static asset serving with legacy fallback and without weakening existing `/api/*` behavior.
10. Preserve CLI `symphony console --snapshot --json` behavior.

## Acceptance Suggestions

- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`
- `pnpm test:mutation:gate`
- `symphony console --snapshot --json` still returns `symphony.console-snapshot`
- `GET /api/summary`, `/api/readiness`, `/api/runs`, `/api/runs/latest`, timeline, artifact preview, and adoption inspect routes remain compatible
- `POST`, `PUT`, `PATCH`, and `DELETE` against Workbench API routes still return 405
- React Workbench first screen shows Stage, goal, status, top risks, blocker, and next action
- Workbench remains Chinese-first, low-density, read-only, copy-only, and state-focused
- Run, evidence, adoption, diagnostics, and raw JSON details are folded or secondary, not first-screen defaults
- The migration is parity-first and does not become a UI redesign or visual system rebuild
- Stage Charter HTML remains generated/display-only and is not replaced by React/Vite
- `.symphony` stores only summaries, refs, and pointers; complete high-risk evidence, repair plans, blocked snapshots, and adoption-aware evidence remain in ArtifactStore
- React/Vite Workbench does not treat `.symphony` as canonical evidence storage and does not bypass ArtifactStore to interpret high-risk evidence
- No browser controls appear for write, execute, retry, adopt, adopt-confirm, confirm-adoption, apply, rollback, delete, package install, dependency install, model invocation, real agent invocation, arbitrary file read, arbitrary path read, arbitrary path input, mutation trigger, or audit trigger actions
- All commands displayed in the browser are copy-only text
- Legacy Workbench fallback remains available until React bundle smoke and fixture parity gates pass
- Fixture parity covers no runs, no active Stage, active Stage, blocked Stage, Charter mismatch, missing artifact, pending adoption, and dirty adoption
- `package.json`, `pnpm-lock.yaml`, and production code changes are absent in discovery and require an independently reviewed high-risk dependency plan before implementation
