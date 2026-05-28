# v17 Update Plan: Read-only Goal Progress Ledger + Console Contract Hardening

Date: 2026-05-28
Status: draft
Baseline: v16 released tag
Target repo: `multi-coding-agents-symphony`

## Goal

v17 upgrades the v16 Workbench from two isolated read-only capabilities into a coherent read-only goal tracking console.

v16 already established two safe surfaces:

- `guided-goal-handoff.v1`: read-only/copy-only handoff instructions.
- `safe-artifact-preview.v1`: backend-authorized bounded text preview for registered artifacts only.

v17 should add a stable progress and contract layer on top:

- `goal-progress-ledger.v1`: a read-only ledger showing goal/task status, evidence coverage, blockers, review state, and release readiness.
- `capabilities.v1`: a backend-declared capability contract so Workbench does not infer what the console can do.
- `diagnostics.v1`: a read-only diagnostics contract for console/workbench state health.
- `error-envelope.v1`: a uniform API error contract across handoff, preview, goal progress, capabilities, and diagnostics routes.

The key product outcome:

```text
v16 tells the user what to copy next and safely previews artifacts.
v17 tells the user where the whole goal stands, what evidence is missing, what is blocked, and whether the release gate is ready.
```

## Product Boundary

v17 remains strictly read-only/copy-only in the browser and read-only for the new status/diagnostics APIs.

Allowed:

- Add contracts, fixtures, validators, and tests.
- Add read-only console API routes.
- Add read-only CLI status command output.
- Add Workbench display panels that render backend-provided contracts.
- Add docs, smoke tests, route tests, and release evidence.

Not allowed:

- Autopilot.
- Browser command execution.
- Browser terminal.
- Workbench writes.
- Workbench adopt/apply/retry/rollback/delete/install/audit/model invocation/mutation.
- Artifact download/open local file.
- Arbitrary path reading.
- Frontend safety inference from path/kind/MIME/extension.
- Rendering raw HTML/SVG/JavaScript/binary inline.

## Design Principles

1. Backend owns truth.
   - Workbench displays contract fields only.
   - Workbench must not infer status, safety, capability, or artifact previewability from text, filenames, extensions, MIME, route shape, or task ids.

2. Evidence is the source of progress.
   - Task status should come from registered run state, handoff metadata, review evidence, verifier evidence, and release evidence.
   - Unknown or missing evidence must render as `unknown`, `missing`, or `blocked`, not as guessed success.

3. Contracts must be stable and machine-readable.
   - Every new contract has `contractName` and `contractVersion` where existing repo conventions support it.
   - JSON shape must be covered by fixtures and validators.
   - CLI `--json` and API JSON should remain suitable for automation.

4. API failures must be safe and consistent.
   - No stack traces.
   - No absolute local paths.
   - No repo file contents in error bodies.
   - No inconsistent per-route ad hoc error shapes.

5. Keep v16 safety posture intact.
   - Existing handoff and safe preview behavior must not regress.
   - Existing Stage Charter and Workbench fallback boundaries must remain covered.

## New Contract 1: `goal-progress-ledger.v1`

### Purpose

`goal-progress-ledger.v1` summarizes progress for a guided goal across tasks, evidence, reviews, blockers, and release gates.

It should answer:

```text
What is the current goal?
What baseline is the goal based on?
Which tasks exist?
Which tasks are not started, in progress, approved, blocked, merged, or verified?
Where are worker/reviewer/main verification evidence refs?
What blockers remain?
What release gates are satisfied or missing?
What should the user copy next?
```

### Required Status Enum

Use a small explicit status enum:

```text
not-started
planned
in-progress
self-checked
needs-review
needs-revision
approved
merged-to-main
main-verified
release-ready
blocked
unknown
```

Rules:

- `unknown` is preferred over guessing.
- `needs-revision` requires explicit review/verifier evidence.
- `approved` requires explicit review/verifier evidence.
- `main-verified` requires explicit main/post-merge validation evidence.
- `release-ready` requires explicit release gate evidence.

### Suggested JSON Shape

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v17-readonly-goal-progress-console-contracts",
  "goalTitle": "v17 Read-only Goal Progress Ledger and Console Contract Hardening",
  "baseline": {
    "tag": "v16",
    "commit": null,
    "evidenceRef": null
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
      "statusSource": "contract-fixture",
      "branch": "v17-task1-goal-progress-contract",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "git checkout -b v17-task1-goal-progress-contract"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "blockers": [],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task 1 branch",
      "command": "git checkout main && git pull --ff-only && git checkout -b v17-task1-goal-progress-contract"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

### Resolver Requirements

The resolver must be read-only. It may read only existing state/artifacts/evidence refs already allowed by the repository's current state layer.

The resolver must not:

- Execute commands.
- Write files.
- Invoke models.
- Scan arbitrary paths.
- Read arbitrary user-provided paths.
- Treat a task title, branch name, command text, or filename as proof of completion.

If evidence is missing, the resolver must return explicit missing/unknown fields.

## New Contract 2: `capabilities.v1`

### Purpose

`capabilities.v1` declares what the console and Workbench can and cannot do.

Workbench should use it to render capability badges and disabled/unavailable states, not to unlock mutation or execution.

### Suggested JSON Shape

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

### API Route

```text
GET /api/capabilities
```

Requirements:

- Non-GET requests return 405.
- No filesystem path input.
- No environment secret leakage.
- No local absolute path leakage.

## New Contract 3: `diagnostics.v1`

### Purpose

`diagnostics.v1` exposes safe read-only health information for the local console and Workbench.

It should report health without running tests, scans, audits, model calls, package installs, mutation gates, or shell commands.

### Suggested JSON Shape

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
    },
    {
      "id": "handoff-ref-registered",
      "label": "Guided handoff ref registered",
      "status": "ok",
      "severity": "info"
    },
    {
      "id": "safe-preview-route-available",
      "label": "Safe preview route available",
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

Status enum:

```text
ok
warning
error
unknown
```

Severity enum:

```text
info
warning
error
```

### API Route

```text
GET /api/diagnostics
```

Requirements:

- Non-GET requests return 405.
- No shell execution.
- No package install.
- No audit/test/mutation execution.
- No filesystem traversal from user input.
- No stack trace or absolute path leakage.

## New Contract 4: `error-envelope.v1`

### Purpose

`error-envelope.v1` provides one safe, consistent error shape for Console API routes.

### Suggested JSON Shape

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

Requirements:

- All relevant API failures use the envelope.
- No stack traces.
- No absolute paths.
- No raw exception messages if they may include path/secrets.
- Workbench renders envelope fields only.
- Existing successful response contracts remain unchanged unless explicitly versioned.

## New CLI Surface

Add read-only user commands:

```sh
symphony goal-status
symphony goal-status --json
symphony goal-status --markdown
symphony goal-status --goal <goal-id> --json
```

Optional aliases if they fit existing CLI style:

```sh
symphony progress
symphony progress --json
```

CLI behavior:

- Read only existing state/evidence/artifact refs.
- Do not write `.symphony` files.
- Do not create new evidence.
- Do not invoke models.
- Do not run tests/audit/mutation.
- Human output is concise.
- `--json` returns stable contract JSON.
- `--markdown` returns a readable task/status table suitable for copy/paste into issue comments.

Suggested human output:

```text
Goal: v17 Read-only Goal Progress Ledger and Console Contract Hardening
Baseline: v16
Progress: 3/10 tasks approved, 1 needs revision, release not ready

Tasks:
- task-1 approved       goal-progress-ledger contract fixtures
- task-2 approved       resolver
- task-3 needs-review   goal-status CLI

Blockers:
- missing main verification evidence

Next:
copy-only: git checkout -b v17-task4-goal-progress-api
```

## New API Surface

Add read-only routes:

```text
GET /api/goals
GET /api/goals/latest/progress
GET /api/goals/<goal-id>/progress
GET /api/capabilities
GET /api/diagnostics
```

Route rules:

- Only GET is allowed.
- Non-GET returns 405 via `error-envelope.v1`.
- Unknown goal returns 404 via `error-envelope.v1`.
- Query path, encoded traversal, absolute paths, and arbitrary local file reads are blocked.
- Route smoke tests must cover happy path and rejected path/method cases.
- `/workbench/api/*` remains Workbench HTML fallback, not API JSON.

## Workbench Scope

Add three read-only panels/sections:

1. Goal Progress
   - Goal id/title.
   - Baseline tag/commit/evidence.
   - Task status list.
   - Evidence refs.
   - Review verdicts.
   - Blockers.
   - Next copy-only commands.
   - Release gates.

2. Capabilities
   - Read-only/display-only/copy-only state.
   - Explicit unsupported capabilities.
   - Safe preview modes.
   - Available API surfaces.

3. Diagnostics
   - Console state health.
   - Handoff registration health.
   - Safe preview availability.
   - Workbench fallback boundary status.
   - Read-only/non-GET boundary status.

Workbench must not:

- Add execution buttons.
- Add copy-to-clipboard automation unless it is already a permitted copy-only display pattern in the repo.
- Call non-GET routes.
- Construct artifact preview routes from path/kind/MIME/extension.
- Infer missing status from UI labels or text.
- Render raw HTML/SVG/JS/binary inline.

## Implementation Stages

### Stage 0: v17 plan materialization

Add the v17 implementation plan and execution prompts to repo docs.

Suggested file paths:

```text
docs/plans/v17-readonly-goal-progress-console-contract-hardening-plan-2026-05-28.md
docs/plans/v17-execution-prompts-2026-05-28.md
```

Acceptance:

```sh
git diff --check
```

### Stage 1: `goal-progress-ledger.v1` contract fixtures and validator

Add:

- Contract schema or validator following existing contract patterns.
- Fixtures for all major status states.
- Tests for valid and invalid payloads.

Must cover:

- `approved` with review evidence.
- `needs-revision` with review evidence.
- `blocked` with blocker reason.
- `unknown` when evidence is absent.
- `release-ready` only with all required gates.
- Invalid status rejection.
- Missing contract name rejection.

Acceptance:

```sh
pnpm check
pnpm test
```

### Stage 2: Goal progress resolver

Add a read-only resolver that computes `goal-progress-ledger.v1` from registered state/evidence refs.

Must cover:

- Latest goal/handoff fixture.
- Missing state pointer.
- Missing task evidence.
- Missing review evidence.
- Needs revision verdict.
- Main verification evidence.
- Release readiness gates.

Acceptance:

```sh
pnpm check
pnpm test
```

### Stage 3: `symphony goal-status`

Add CLI command:

```sh
pnpm symphony goal-status
pnpm symphony goal-status --json
pnpm symphony goal-status --markdown
```

Must be read-only and must not modify `.symphony` or runtime artifacts.

Acceptance:

```sh
pnpm symphony goal-status --json
pnpm symphony goal-status --markdown
pnpm check
pnpm test
```

### Stage 4: Goal progress read-only API routes

Add:

```text
GET /api/goals
GET /api/goals/latest/progress
GET /api/goals/<goal-id>/progress
```

Must test:

- Happy path.
- Unknown goal.
- Non-GET 405.
- Query path ignored or rejected.
- Encoded traversal blocked.
- No arbitrary path read.

Acceptance:

```sh
pnpm check
pnpm test
```

### Stage 5: Workbench Goal Progress panel

Add read-only UI panel consuming only backend ledger fields.

Must show:

- Task progress.
- Evidence refs.
- Review verdicts.
- Blockers.
- Release gates.
- Next copy-only commands.
- Missing/unavailable states.

Acceptance:

```sh
pnpm workbench:build
pnpm check
pnpm test
```

### Stage 6: `capabilities.v1`

Add contract, fixtures, validator, API route, tests, and Workbench display.

Route:

```text
GET /api/capabilities
```

Acceptance:

```sh
pnpm workbench:build
pnpm check
pnpm test
```

### Stage 7: `diagnostics.v1`

Add contract, fixtures, validator, API route, tests, and Workbench display.

Route:

```text
GET /api/diagnostics
```

Acceptance:

```sh
pnpm workbench:build
pnpm check
pnpm test
```

### Stage 8: `error-envelope.v1`

Add contract, helper, fixtures, tests, and apply to relevant API error paths.

Must include:

- Handoff error paths.
- Safe preview error paths.
- Goal progress error paths.
- Capabilities/diagnostics method errors.
- Workbench rendering of safe error messages.

Acceptance:

```sh
pnpm check
pnpm test
pnpm workbench:build
```

### Stage 9: Route smoke, fallback, and security hardening

Expand route smoke coverage across:

- Handoff.
- Safe preview.
- Goal progress.
- Capabilities.
- Diagnostics.
- Error envelope.
- Workbench fallback.
- Stage Charter boundary.
- Path traversal and encoded traversal.
- Non-GET 405.
- Repo source/package/lockfile/docs blocking where applicable.

Acceptance:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

### Stage 10: Documentation and release evidence

Update:

- README latest milestone and command list.
- Workbench Operator Guide.
- v17 release evidence document.
- Any contract docs/indexes used by the repo.

Must clearly document:

- v17 goal progress ledger.
- Capabilities contract.
- Diagnostics contract.
- Error envelope contract.
- Read-only/copy-only boundaries.
- Explicit non-goals.

Acceptance:

```sh
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
```

## Test Plan

### Unit tests

- `goal-progress-ledger.v1` validator accepts valid fixture.
- Validator rejects missing contract name/version.
- Validator rejects unknown task status.
- Validator rejects invalid release gate status.
- Resolver returns `unknown` when evidence is missing.
- Resolver returns `needs-revision` only with explicit evidence.
- Resolver returns `release-ready` only when all gates pass.
- `capabilities.v1` validator verifies supported/unsupported capability flags.
- `diagnostics.v1` validator verifies check status/severity enums.
- `error-envelope.v1` validator rejects unsafe/malformed error shapes.

### CLI tests

- `symphony goal-status` returns human-readable summary.
- `symphony goal-status --json` returns `goal-progress-ledger.v1`.
- `symphony goal-status --markdown` returns task table and blockers.
- Command does not create or modify state files.
- Unknown goal returns safe error.

### API tests

- `GET /api/goals` returns registered goal summaries.
- `GET /api/goals/latest/progress` returns ledger.
- `GET /api/goals/<goal-id>/progress` returns ledger.
- Unknown goal returns `error-envelope.v1`.
- Non-GET returns 405 envelope.
- Path traversal and query path are blocked.
- `GET /api/capabilities` returns `capabilities.v1`.
- `GET /api/diagnostics` returns `diagnostics.v1`.
- Existing `/api/handoff` and safe preview behavior does not regress.

### Workbench tests/build

- Goal Progress panel renders backend status fields.
- Missing fields render unavailable/missing states.
- Capabilities panel renders unsupported capabilities explicitly.
- Diagnostics panel renders status without invoking commands.
- Error envelope renders safe message only.
- No raw HTML/SVG/JS/binary inline rendering.
- No frontend preview safety inference.

### Integration smoke

```sh
pnpm symphony goal-status --json
pnpm symphony console --snapshot --json
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

### Release verification

```sh
pnpm test:mutation:gate
pnpm audit --audit-level high
```

## Risk and Mitigation

| Risk | Mitigation |
|---|---|
| Workbench starts inferring status from UI text | Require backend-only `status` and `statusSource`; tests cover missing fields |
| Goal progress duplicates handoff contract | Ledger references handoff/evidence but has distinct progress semantics |
| Resolver guesses from branch/task names | Resolver must return `unknown` without explicit evidence |
| Error envelope breaks existing clients | Apply envelope to error responses only; keep success contracts stable |
| Diagnostics becomes command execution | Diagnostics route is read-only and must not shell out |
| Capability flags become frontend feature gates for mutation | Explicitly keep mutation/browser execution false in v17 |
| Too many panels clutter Workbench | Add compact summary cards with detail sections; keep Overview readable |
| Security regression in preview/fallback | Extend existing v16 route smoke and boundary tests |

## Non-Goals

- No Autopilot.
- No browser-side execution.
- No browser terminal.
- No Workbench mutation flows.
- No adopt/apply/retry/rollback/delete/install/audit/model invocation from Workbench.
- No artifact download/open local file.
- No arbitrary path reads.
- No raw HTML/SVG/JavaScript/binary inline rendering.
- No frontend safety inference.
- No new package dependencies unless absolutely necessary and justified.
- No replacement of existing v16 handoff or preview contracts.

## Acceptance Criteria

v17 is complete when:

- `goal-progress-ledger.v1` contract, fixtures, validator, resolver, CLI, API, and Workbench display exist.
- `capabilities.v1` contract, fixtures, validator, API, and Workbench display exist.
- `diagnostics.v1` contract, fixtures, validator, API, and Workbench display exist.
- `error-envelope.v1` contract, helper, fixtures, tests, and relevant API usage exist.
- Workbench displays goal progress, blockers, release gates, capabilities, diagnostics, and safe errors without execution/mutation.
- Route smoke covers new routes and v16 boundaries.
- README and Workbench Operator Guide document v17 scope and non-goals.
- Release evidence records passing checks.
- All required verification commands pass.

Required final checks:

```sh
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
git status -sb
```

## Recommended Execution Handoff

Use per-task implementation branches and separate review prompts.

Recommended sequence:

```text
Task 0: docs plan/prompt materialization
Task 1: goal-progress-ledger contract fixtures and validator
Task 2: goal progress resolver
Task 3: goal-status CLI
Task 4: goal progress API
Task 5: Workbench Goal Progress panel
Task 6: capabilities contract/API/UI
Task 7: diagnostics contract/API/UI
Task 8: error envelope contract/helper/API/UI
Task 9: route smoke/security hardening
Task 10: docs/release evidence
```

Do not let the same agent self-approve its own implementation. Worker prompts may run tests and self-check, but the reviewer prompt must independently inspect the diff and return one of:

```text
APPROVED
NEEDS_REVISION
```

Merge each task to `main` only after reviewer approval and required checks pass.
