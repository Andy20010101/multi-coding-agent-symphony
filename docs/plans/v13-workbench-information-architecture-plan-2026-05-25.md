# v13 Plan: Workbench Information Architecture

Date: 2026-05-25
Baseline: `v12`
Primary CLI: `symphony`

## Summary

v13 should make the local Workbench easier to use without weakening the v12 safety model. The current Workbench exposes a lot of valuable kernel detail at once: readiness, run state, diagnostics, artifacts, timelines, adoption plans, patch refs, journal refs, and copy-only commands. That density is useful for maintainers, but it makes the first screen feel like a maintenance panel instead of an operating surface.

The v13 direction is information architecture, not a new execution kernel. The Workbench should default to a compact "what is happening and what should I do next?" view, then let users drill into adoption recovery, run details, artifacts, and raw JSON when they need more context.

## Goals

- Reduce default Workbench information density.
- Keep all Workbench behavior read-only and copy-only.
- Make v12 adoption recovery visible and understandable from the browser.
- Separate operator views from maintainer/debug views.
- Preserve existing `/api/*` routes and product JSON compatibility.
- Improve terminal-facing inspect output only if it can remain copy-only and deterministic.

## Non-Goals

- Do not add browser buttons that execute commands.
- Do not add apply, retry, delete, rollback, install, or real-agent invocation controls.
- Do not expand v12 adoption support for deletion, rename, binary, symlink, or chmod-only diffs.
- Do not add a frontend build system unless the current static UI becomes unmaintainable.
- Do not replace JSON contracts with UI-only behavior.
- Do not hide diagnostic data from API consumers; reduce default visual exposure instead.

## Product Principle

The first screen should answer three questions:

1. Is the project safe to act on?
2. What is the latest meaningful state?
3. What copy-only command should I run next?

Everything else should be available by drill-down, not loaded into the user's eyes at once.

## Proposed Workbench Structure

### 1. Overview

Default route: `/`

Purpose: a calm operating surface.

Primary content:

- Overall status: `ready`, `attention`, `blocked`, or `no-runs`.
- Latest run summary.
- Top 1-3 risks by severity.
- Current next action.
- Adoption summary banner when relevant:
  - no pending adoption
  - pending adoption
  - applying adoption
  - post-apply evidence failed
  - stale adoption
  - dirty worktree blocks adoption
- Compact readiness state:
  - git clean/dirty
  - package manager available/unavailable
  - optional GitHub/real CLI status collapsed by default

Hidden by default:

- Full artifact refs.
- Raw run state.
- Full readiness payload.
- Full diagnostics risk list.
- Full command groups.

### 2. Adoption

Proposed route: `/adoptions`

Purpose: v12 adoption and recovery cockpit.

Primary content:

- Adoption plan list:
  - adoption id
  - source run
  - execution plan
  - changed file count
  - patch hash
  - status
  - created time
- Selected adoption detail:
  - plan refs
  - patch ref
  - journal ref if present
  - source run verifier status
  - latest confirmation run
  - current worktree matches `fileOperations.afterHash`
  - current worktree matches journal `beforeFiles`
- Copy-only commands:
  - `symphony adopt --inspect <adoption-id> --json`
  - `symphony adopt --confirm <adoption-id> --state-dir <state-dir>`
  - `symphony diagnose --json`
  - `git status --short`

Important UI rule:

- The confirm command may be shown and copied, but the browser must not run it.

### 3. Runs

Proposed route: `/runs`

Purpose: browse historical run state without overwhelming the overview.

Primary content:

- Existing filters:
  - `all`
  - `passed`
  - `failed`
  - `dry-run`
  - `real`
  - `scan`
  - `verify`
- Add adoption-aware filter if useful:
  - `adoption`
- Run list stays compact:
  - command
  - run id
  - status
  - verifier
  - updated time
- Details move into tabs or collapsible sections:
  - Summary
  - Timeline
  - Risks
  - Artifacts
  - Changes
  - Raw

### 4. Diagnostics

Proposed route: `/diagnostics`

Purpose: show the full health model for users who are actively debugging.

Primary content:

- Full risk list.
- Readiness details.
- Missing artifacts.
- Dirty git details.
- Adoption risk categories:
  - `pending_adoption`
  - `stale_adoption`
  - `dirty_worktree_blocks_adoption`
  - `adoption_dirty_file_details`
  - `adoption_apply_in_progress`
  - `adoption_post_apply_failed`
  - `unsupported_adoption_changes`
- Copy-only grouped commands.

### 5. Artifacts

Proposed route: `/artifacts`

Purpose: artifact inspection only.

Primary content:

- Registered artifact refs by selected run.
- Existing bounded preview behavior.
- v12 artifact kinds:
  - `adoption-plan`
  - `adoption-patch`
  - `adoption-journal`
  - `evidence`
  - `workspace-manifest`

Security rule:

- Preview only paths already present in run-state `artifactRefs`.
- Keep 200 KiB preview cap.
- No arbitrary path input.

## Data Model Additions

Prefer additive API fields over breaking route changes.

### Console Snapshot

Add derived UI-oriented summary fields:

```json
{
  "overview": {
    "status": "attention",
    "headline": "Pending adoption is blocked by dirty files.",
    "latestRunId": "symphony-adoption-demo-planned",
    "topRisks": [],
    "nextAction": "git status --short"
  },
  "adoptionSummary": {
    "status": "pending",
    "pendingCount": 1,
    "applyingCount": 0,
    "postApplyFailedCount": 0,
    "dirtyBlocked": true
  }
}
```

These are derived from existing runs, adoption plans, journals, diagnostics, and readiness. They must not become canonical storage.

### Adoption Inspect Route

Options:

1. Reuse CLI only: browser displays copy-only `symphony adopt --inspect`.
2. Add read-only API route: `GET /api/adoptions/<adoption-id>/inspect`.

Preferred v13 path:

- Add the API route only if it reuses the same pure read-only inspect builder used by the CLI.
- Route must not write state, run git apply, invoke adapters, invoke models, or execute recommended commands.

Expected route shape:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-adoption-inspect",
  "adoptionPlanId": "symphony-adoption-demo",
  "journalRef": {
    "kind": "adoption-journal",
    "path": ".symphony/adoptions/symphony-adoption-demo-journal.json"
  },
  "latestConfirmationRun": {
    "runId": "symphony-adopt-confirm-demo",
    "status": "failed",
    "failurePhase": "post-apply-evidence",
    "mainWorktreeWrites": true
  },
  "currentWorktreeMatchesAfterHash": true,
  "currentWorktreeMatchesJournalBeforeFiles": false,
  "recommendedCommands": [
    {
      "command": "symphony status",
      "mode": "copy-only"
    }
  ]
}
```

## UX Rules

- Default view should avoid raw JSON.
- Show at most three risks on overview.
- Use progressive disclosure:
  - summary first
  - details second
  - raw JSON last
- Keep commands visually copy-only.
- Use plain, concrete labels:
  - "Patch applied, evidence failed"
  - "Worktree matches adopted files"
  - "Worktree no longer matches pre-apply journal"
- Avoid showing every low-level field in compact panels.
- Keep artifact previews in a dedicated area, not mixed into overview.

## Implementation Stages

### Stage 0: UI Inventory

- Capture current Workbench sections and fields.
- Classify each field as:
  - overview
  - adoption
  - run detail
  - diagnostics
  - artifact/debug
- Identify duplicated command lists and risk lists.

Exit criteria:

- A short field inventory exists in the v13 implementation PR or release notes.

### Stage 1: Derived Overview Model

- Add `overview` and `adoptionSummary` to console snapshot as additive derived fields.
- Keep existing fields unchanged.
- Add tests for:
  - no runs
  - clean passed latest run
  - pending adoption
  - applying adoption
  - post-apply evidence failure
  - dirty worktree blocked adoption

Exit criteria:

- Existing console/diagnostics tests pass unchanged.
- New overview tests verify top risks and next action.

### Stage 2: Workbench Layout Split

- Convert the current single dense page into route-like sections or local tabs:
  - Overview
  - Adoptions
  - Runs
  - Diagnostics
  - Artifacts
- Keep the static no-build implementation unless route complexity forces a small internal structure cleanup.
- Preserve all existing read-only routes.

Exit criteria:

- Browser smoke shows overview by default.
- Existing artifact preview route remains unchanged.
- Non-GET routes still return `405`.

### Stage 3: Adoption Recovery View

- Render adoption plans and journals in a dedicated view.
- Surface inspect-style match results.
- Show copy-only confirm/inspect/status commands.
- Highlight recovery states:
  - pending
  - applying
  - post-apply evidence failed
  - stale
  - dirty blocked
  - unsupported source changes

Exit criteria:

- Fixture tests cover pending, applying, and post-apply-failed adoption UI model.
- The view never executes a command from the browser.

### Stage 4: Diagnostics and Debug Cleanup

- Move full risk list and readiness internals out of the default overview.
- Keep diagnostics route/detail section dense and complete.
- Add dirty path display only in diagnostics/adoption recovery, not as default overview noise.

Exit criteria:

- Overview remains compact in snapshot tests.
- Diagnostics still exposes all v10-v12 risk categories.

### Stage 5: Documentation and Release Evidence

- Update `docs/symphony-product-contracts.md` with additive `overview`, `adoptionSummary`, and any new inspect route contract.
- Update README command examples only if user-facing commands change.
- Add v13 release evidence with browser smoke and CLI gates.

Exit criteria:

- Required gates pass:
  - `node --test tests/symphony-cli.test.js`
  - `pnpm check`
  - `pnpm test`
  - `git diff --check`
  - `pnpm audit --audit-level high`
- Optional release gate:
  - `pnpm test:mutation:gate`

## Test Plan

Add focused tests in `tests/symphony-cli.test.js`:

- Console snapshot includes compact `overview`.
- Console snapshot includes `adoptionSummary`.
- Overview top risks are capped.
- Pending adoption sets adoption summary status.
- Applying journal or run sets adoption summary status.
- Post-apply evidence failure is visible in adoption summary.
- Workbench HTML contains top-level navigation for Overview, Adoptions, Runs, Diagnostics, and Artifacts.
- Non-GET requests remain rejected.
- Artifact preview remains bounded to registered refs.

If `GET /api/adoptions/<id>/inspect` is added:

- Route is read-only.
- Route rejects unsafe ids.
- Route returns the same match booleans as CLI inspect.
- Route does not write state files.

## Acceptance Criteria

- First viewport no longer shows every artifact, run, readiness, and diagnostic detail at once.
- A user can identify the next safe action from the overview without reading raw JSON.
- A user can inspect v12 adoption recovery state from a dedicated Workbench area.
- Existing JSON contracts remain backward compatible.
- Workbench remains local, read-only, copy-only, model-free, and installer-free.

## Risks

- Over-simplifying the overview could hide actionable risk. Mitigation: show top risks and keep diagnostics one click away.
- Adding route complexity to the static Workbench could make the file harder to maintain. Mitigation: use small pure render helpers and avoid a build system for v13.
- Adoption inspect data can become expensive if repeated too often. Mitigation: compute it only for a selected adoption detail, not for every list item.
- Users may read copy-only confirm commands as clickable actions. Mitigation: label commands consistently as copy-only and avoid action-colored buttons for dangerous commands.

## Recommended V13 Cut

The smallest useful v13 should include:

1. Derived `overview` and `adoptionSummary`.
2. A compact default Workbench overview.
3. A dedicated Adoptions view using existing plan/journal/run data.
4. Documentation and tests proving read-only behavior.

This keeps the release focused: no new execution semantics, just a better cockpit for the v12 kernel.
