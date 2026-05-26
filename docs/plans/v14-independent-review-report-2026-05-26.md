# v14 Independent Review Report

Date: 2026-05-26
Reviewer role: independent reviewer, not writer
Decision: NEEDS_REVISION

## Summary

The v14 Stage Kernel Refactor is not ready for release gate.

The required development checks pass, and the implementation adds Stage Charter files, Stage CLI commands, Stage-aware do/review/verify state, Stage-aware adoption wrapper summaries, and a read-only Workbench Stage overview. I did not find evidence that the v12 adoption apply core was rewritten or that React/Vite was introduced.

However, the Stage blocker and frozen snapshot recovery path is not strict enough for the v14 acceptance criteria. A blocked action can be resumed after the Stage JSON changes, and a different effective action can clear the blocker because the blocked action digest is too coarse. `.symphony/stages` also stores the full blocked snapshot rather than only summary and refs. Additionally, at least one project write path, `symphony new --write`, bypasses the Stage Charter consistency gate.

## Required Command Results

- `node --test tests/symphony-cli.test.js`: PASS, 43 tests passed.
- `pnpm check`: PASS.
- `pnpm test`: PASS, 510 tests passed.
- `git diff --check`: PASS.

Per the user's review instruction, I did not run mutation gate because the implementation already has release-blocking acceptance failures.

Not run:

- `pnpm audit --audit-level high`
- `pnpm test:mutation:gate`

## Stage Smoke Results

Executed with temporary state/docs directories using `pnpm --silent symphony` to avoid pnpm script banner in JSON output.

- `symphony stage --json`: PASS, emitted Stage status JSON.
- `symphony stage create --help`: PASS.
- `symphony stage create sample-v14-stage --json`: PASS, created draft JSON and HTML without activation.
- `symphony stage activate v14-stage-kernel-refactor --json`: PASS, wrote `.symphony/stages/latest.json`.
- `symphony stage render v14-stage-kernel-refactor --json`: PASS, preview mode when HTML exists.
- `symphony stage render v14-stage-kernel-refactor --write --json`: PASS, overwrote HTML from JSON.
- `symphony stage summary --json`: PASS.
- `symphony next --json`: PASS, read-only advisory output.

Note: plain `pnpm symphony ... --json` includes pnpm's script banner on stdout. Smoke parsing needs `pnpm --silent symphony ...` or direct `node scripts/symphony.js ...`.

## Findings

### 1. Blocker: Frozen snapshot recovery does not verify frozen hashes/refs

File: `src/symphony/stage.js`

Relevant area: `clearStageBlockerAfterPassedGate`

The recovery path only compares `blockedSnapshot.blockedAction` against the current action. It does not verify:

- frozen Stage JSON hash did not silently change;
- project fingerprint still matches;
- dirty worktree hash still matches;
- git head still matches;
- frozen refs still match;
- high-risk refs remain the same ArtifactStore refs.

I reproduced this by blocking on a Charter mismatch, changing the JSON goal, rendering HTML so consistency passed, and rerunning the same action. The blocker cleared even though `blockedSnapshot.stageCharterJsonHash` differed from the current Stage hash.

Required fix:

Recovery must compare the current gate state against the frozen blocked snapshot before clearing the blocker. If any frozen hash/ref/project state differs, the gate must stay blocked and emit a clear mismatch reason.

### 2. Blocker: Blocked action identity is too coarse

Files:

- `scripts/symphony.js`
- `src/symphony/stage.js`

Relevant areas:

- `executeProductWork`
- `buildStageBlockedAction`

For product work, the attempted command passed to the gate is only `symphony do`, `symphony review`, or `symphony verify`. The snapshot digest does not include the actual prompt, flags, stage docs dir, work dir, safety mode details beyond the target id, or other action-shaping fields.

I reproduced this by blocking a dry-run `do`, repairing the Charter HTML, then running a different `do` action with different effective risk. The blocker cleared because the frozen identity still matched `type=product-work`, `targetId=do`, and the digest of `symphony do`.

Required fix:

Build action identity from a canonical full action payload: command, semantic command, prompt or plan/adoption id, safety mode, write/real flags, target refs, and relevant confirmation identity. The digest must distinguish old action from new action.

### 3. Major: `.symphony/stages` stores full blockedSnapshot

File: `src/symphony/stage.js`

Relevant area: `recordStageGateFailure`

The implementation writes full `blockedSnapshot` into the Stage state under `.symphony/stages/<stage-id>.json` and `.symphony/stages/latest.json`. The checklist requires `.symphony` to store local pointers/summaries, while high-risk blocked snapshots live in ArtifactStore with frozen refs.

Required fix:

Persist the full `blockedSnapshot` only through `ArtifactStore`. Stage local state should keep a compact summary plus `blockedSnapshotArtifactPath` or an equivalent ref.

### 4. Major: frozenRefs are not true hashes/ArtifactStore refs

File: `src/symphony/stage.js`

Relevant area: `recordStageGateFailure`

`frozenRefs.executionPlanHash` is assigned `latestRun.executionPlanId`, which is an id, not a hash. `repairPlanRef` is a local file path, not an ArtifactStore-style ref. This does not satisfy the frozen refs acceptance requirement.

Required fix:

Use real hashes for hash fields and stable ArtifactStore refs for stored artifacts. Rename fields if they hold ids rather than hashes.

### 5. Major: Stage Charter mismatch does not block all project writes

File: `scripts/symphony.js`

Relevant area: `runSymphonyNew`

`do/review/verify` and adoption paths invoke `enforceStageConsistencyGate`, but `symphony new --write` does not. I reproduced that with an active Stage whose HTML was stale: `symphony new <target> --template node-cli --write` still wrote project files and did not create a Stage blocker.

Required fix:

Either gate all project write paths, including `new --write`, or explicitly narrow the v14 acceptance criteria. The current plan says mismatch blocks new writes/executions/adoption confirm.

### 6. Major: `symphony stage` text output is not a compact Stage display

File: `scripts/symphony.js`

Relevant area: `writeStageStatusOutput`

JSON output is Stage-specific, but non-JSON `symphony stage` uses the generic `humanProductSummary`. It prints intent/pipeline/safety/status/next, but not active Stage id/title/goal/blocker as required.

Required fix:

Add a Stage-specific human formatter showing active Stage id/title, state/status, goal, blocker if present, and next action.

### 7. Evidence gap: Requested plan/checklist filenames are missing

The user requested validation against:

- `docs/plans/v14-stage-kernel-refactor-plan-2026-05-26.md`
- `docs/plans/v14-acceptance-checklist-2026-05-26.md`

Those exact files are absent. I reviewed the available equivalents:

- `docs/plans/v14_stage_kernel_refactor_handoff.md`
- `docs/plans/v14_acceptance_checklist.md`
- `docs/plans/v14-release-evidence-2026-05-26.md`

Required fix:

Add the expected filenames or document the rename clearly so future release review does not depend on path inference.

## Invariant Checks

- v12 adoption apply unchanged: mostly yes. The confirmation path still performs plan revalidation, dirty worktree fingerprint check, `git apply --check`, journal write before apply, `git apply`, and post-apply evidence. Stage additions are wrapper metadata and pre-gate calls. No core apply rewrite was found.
- Workbench read-only/copy-only: mostly yes. Server still rejects non-GET requests with 405. Browser commands remain copy-only; no browser-side execution/adopt/retry/rollback button was found in the v14 diff.
- ArtifactStore vs `.symphony` boundary: no. Repair and blocked snapshot artifacts are written through ArtifactStore, but full blocked snapshot is also stored in `.symphony/stages`.
- Charter JSON/HTML consistency gate: partial. Mismatch is detected and blocks do/review/verify/adoption gate paths, creates gate event, blocker, repair artifact, and blocked snapshot. It does not cover `new --write`, and recovery checks are insufficient.
- blocker/frozen snapshot recovery: no. Snapshot contains hashes/refs but recovery does not enforce them, and action identity is too weak.
- React/Vite: no new React/Vite dependency or migration found. Existing lockfile JSX parser references are transitive/dev tooling, not a v14 Workbench migration.
- Autopilot / Agent Capability Registry / new GitHub/PR integration: no new complete implementation found in v14 diff.

## Required Fixes Before Release Gate

1. Enforce frozen snapshot recovery checks for Stage JSON hash, current HTML consistency, project state, dirty hash, git head, and frozen refs.
2. Strengthen blocked action identity to include full canonical action details.
3. Keep full high-risk blocked snapshots out of `.symphony/stages`; store only summary and ArtifactStore refs there.
4. Correct frozenRefs semantics so hash fields contain hashes and artifact fields contain ArtifactStore refs.
5. Add Stage gate coverage for all project write paths required by the plan, especially `symphony new --write`.
6. Add tests for changed JSON after block, changed action after block, `.symphony` storage boundary, and `new --write` gate blocking.
7. Implement Stage-specific human output for `symphony stage`.
8. Add or rename the requested v14 plan/checklist files.

## Optional Improvements

- Add `--stage` and `--no-stage` support to `symphony adopt` if adopt is expected to be command-line Stage-selectable like do/review/verify.
- Document that Stage smoke should use `pnpm --silent symphony` when parsing JSON.
- Strengthen Workbench tests around folded details and absence of write controls.

## Release Gate Decision

Do not enter release gate.

The implementation has release-blocking issues in Stage blocker recovery, frozen snapshot enforcement, `.symphony` storage boundary, and write-path gate coverage.
