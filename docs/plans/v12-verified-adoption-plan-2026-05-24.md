# v12 Plan: Verified Adoption

## Summary

v12 adds a controlled adoption flow for bringing verifier-passing isolated workspace changes back into the main worktree. It builds on v11 controlled kernel execution: first the kernel writes to a managed isolated workspace, then v12 generates a frozen adoption plan, and only a separate confirmation command may apply that frozen patch to the main worktree.

The safety model remains two-step and auditable. Workbench stays read-only. No model or adapter is invoked during adoption. Main worktree writes are allowed only during confirmed adoption, only after verifier evidence, fingerprint checks, dirty-worktree checks, patch validation, and path-boundary validation pass.

## Goals

- Add `symphony adopt --run <run-id>` to create a frozen adoption plan.
- Add `symphony adopt --confirm <adoption-id>` to apply the frozen adoption plan.
- Require the source run to be a confirmed v11 run with `status: "passed"` and `verifierStatus: "passed"`.
- Require the source run to have `writeBoundary: "isolated-workspace"` and `mainWorktreeWrites: false`.
- Record all adoption intent and patch metadata in a new `symphony.adoption-plan` artifact under `.symphony/adoptions/<adoption-id>.json`.
- Record an adoption patch artifact that can be inspected before confirmation.
- Refuse to apply if the project fingerprint, git HEAD, source run, source workspace, confirmation arguments, or adoption patch drift.
- Treat the adoption patch as frozen. Confirmation must not regenerate the patch from the current isolated workspace or reinterpret the original task prompt.
- Keep Workbench and diagnostics read-only, exposing adoption refs and copy-only commands only.

## Non-Goals

- Do not add Workbench execute/apply buttons.
- Do not automatically adopt changes after a v11 confirmed run.
- Do not invoke real agents, model CLIs, package installers, or external services during adoption.
- Do not adopt from failed, planned, stale, missing, or unverifiable runs.
- Do not support binary files, symlinks, renames, deletions, chmod-only diffs, or path traversal in v12.
- Do not resolve merge conflicts automatically.

## CLI Contract

### Plan

```sh
symphony adopt --run <run-id>
symphony adopt --run <run-id> --json
symphony adopt --run <run-id> --state-dir <path> --json
```

Expected behavior:

- Returns `status: "adoption-planned"` and exit code 0.
- Writes `.symphony/adoptions/<adoption-id>.json`.
- Writes a registered patch artifact containing the exact diff to apply.
- Does not write to the main worktree.
- Does not invoke adapters or models.
- Prints the exact confirm command.

### Confirm

```sh
symphony adopt --confirm <adoption-id>
symphony adopt --confirm <adoption-id> --json
symphony adopt --confirm <adoption-id> --state-dir <path> --json
```

Expected behavior:

- Accepts only `--confirm`, `--state-dir`, and `--json`.
- Loads the frozen adoption plan.
- Revalidates all plan invariants before writing.
- Runs patch preflight, including `git apply --check`.
- Applies only the frozen patch.
- Records an adoption run with `mainWorktreeWrites: true`.
- Sets `nextAction: "symphony status"` after success.

`symphony adopt` accepts exactly one mode: `--run <run-id>` or `--confirm <adoption-id>`.
Plan mode accepts only `--run`, `--state-dir`, and `--json`.
Confirm mode accepts only `--confirm`, `--state-dir`, and `--json`.
Duplicate mode args, unknown flags, prompt text, `--write`, `--real`, `--confirm-plan`, or mixed `--run`/`--confirm` fail with a usage error before reading or writing state.

## Implementation Stages

Stage 0: contracts and state helpers.

- Extend `symphonyStatePaths()` with adoption plan paths.
- Add read/write helpers for `.symphony/adoptions/<adoption-id>.json`.
- Add a deterministic `buildAdoptionPlanId()` helper mirroring execution-plan ids.
- Add artifact refs for `adoption-plan` and `adoption-patch` to the product summary contract layer.
- Add tests for safe adoption ids and missing/malformed plan reads before any patch logic exists.
- Exit criteria: parser tests reject invalid adoption ids, duplicate modes, mixed modes, unknown flags, and unexpected prompt text before state writes.

Stage 1: source run and workspace validation.

- Resolve source runs through existing `.symphony/runs/<run-id>.json` state.
- Validate that the run is a confirmed v11 run, not a planned run.
- Validate evidence, execution-plan refs, isolated workspace refs, and verifier status.
- Compute project, git HEAD, dirty-worktree, source workspace, and patch fingerprints through deterministic helpers.
- Reject unsafe source paths before generating any adoption artifact.
- Exit criteria: tests reject missing, planned, failed, stale, non-v11, missing-workspace-ref, and unsafe-workspace source runs.

Stage 2: patch generation and adoption planning.

- Generate a text-only unified diff from the isolated workspace candidate files.
- Write the patch artifact through a registered runtime/artifact path.
- Write the frozen `symphony.adoption-plan`.
- Write an `adoption-planned` run state with `mainWorktreeWrites: false`.
- Emit human and JSON output with the exact confirm command.
- Exit criteria: fixture tests prove planning writes adoption refs and a patch artifact, returns the exact confirm command, and leaves the main worktree unchanged.

Stage 3: confirmation and patch application.

- Parse confirm mode separately from plan mode.
- Revalidate the frozen plan and every fingerprint before writing.
- Run `git apply --check` before applying.
- Apply only the frozen patch with `git apply`.
- Record post-apply evidence and a confirmed adoption run state.
- Do not regenerate a diff, reread user intent, or use current isolated workspace contents to decide what to apply.
- Never invoke adapters, models, package managers, or generated shell commands other than bounded git preflight/application commands.
- Exit criteria: tests prove failed `git apply --check` and all fingerprint drift cases fail before writing; successful confirmation applies exactly the frozen patch.

Stage 4: read-only surfaces and docs.

- Extend status, console snapshot, run detail, artifact preview refs, and diagnostics to expose adoption plan state.
- Keep all Workbench adoption commands copy-only.
- Update `docs/symphony-product-contracts.md`, README command examples, and release evidence.
- Exit criteria: status, console snapshot, diagnose JSON, and registered patch preview tests pass; non-GET Workbench routes remain rejected.

Stage 5: smoke and regression.

- Run the required local gates.
- Add a fixture smoke proving main-worktree contents remain unchanged until adoption confirmation.
- Confirm existing v10 diagnostics and v11 controlled execution tests still pass unchanged.
- Exit criteria: full local acceptance commands and the v12 smoke pass.

## Likely File Ownership

- `scripts/symphony.js`: command parsing, plan/confirm orchestration, product summaries, human output.
- `src/symphony/state.js`: adoption plan path helpers and JSON read/write helpers.
- `src/symphony/contract.js`: adoption artifact refs and product envelope additions.
- `src/symphony/console.js`: read-only adoption visibility in snapshot, diagnostics, run details, and artifact previews.
- `tests/symphony-cli.test.js`: product CLI behavior, rejection cases, console/diagnose visibility, and smoke-like fixture flows.
- `docs/symphony-product-contracts.md`: `symphony.adoption-plan`, adoption run-state, and read-only surface contract.
- `README.md`: user command examples and v12 safety boundary.

## Adoption Plan Artifact

New artifact kind:

- `version: "1"`
- `kind: "symphony.adoption-plan"`
- `contractName: "symphony.adoption-plan"`
- `contractVersion: "1"`
- Stored at `.symphony/adoptions/<adoption-id>.json`.

Required fields:

- `adoptionId`
- `command: "symphony adopt"`
- `intent: "adopt"`
- `semanticCommand: "adopt"`
- `pipeline: ["adopt-plan"]` for planning artifacts
- `safetyMode: "write"`
- `stateDir`
- `sourceRunId`
- `sourceRunArtifactPath`
- `executionPlanId`
- `executionPlanArtifactPath`
- `plannedRunId`
- `projectRoot`
- `projectFingerprint`
- `gitHead`
- `gitStatusFingerprint`
- `sourceWorkspacePath`
- `sourceWorkspaceManifestPath`
- `sourceWorkspaceFingerprint`
- `sourceEvidenceArtifactPath`
- `sourceVerifierStatus`
- `sourceWriteBoundary: "isolated-workspace"`
- `writeBoundary: "main-worktree"`
- `projectWrites: true`
- `mainWorktreeWrites: true`
- `workspaceWrites: false`
- `runtimeWrites: true`
- `externalCalls: false`
- `destructiveWrites: false`
- `patchArtifactPath`
- `patchHash`
- `changedFiles`
- `fileOperations`
- `unsupportedChanges`
- `confirmationCommand`
- `createdAt`

The plan must fail instead of being written when unsupported changes are present. `unsupportedChanges` exists so future versions can explain rejected candidates in diagnostics and tests.

## Run State

Planning writes a normal product run state:

- `runId`
- `command: "symphony adopt"`
- `semanticCommand: "adopt"`
- `status: "adoption-planned"`
- `exitCode: 0`
- `verifierStatus: "not-run"`
- `adoptionPlanId`
- `adoptionPlanArtifactPath`
- `sourceRunId`
- `executionPlanId`
- `patchArtifactPath`
- `patchHash`
- `projectWrites: true`
- `mainWorktreeWrites: false`
- `workspaceWrites: false`
- `runtimeWrites: true`
- `externalCalls: false`
- `destructiveWrites: false`
- `writeBoundary: "main-worktree"`
- `artifactRefs`
- `nextAction: <exact confirm command>`

Planning rejections that discover unsupported source changes write a failed adoption-planning run state instead of an adoption plan:

- `status: "failed"`
- `verifierStatus: "not-run"`
- `sourceRunId`
- `adoptionPlanArtifactPath: null`
- `unsupportedChanges`
- `failurePhase: "adoption-planning"`
- `mainWorktreeWrites: false`
- `nextAction: "symphony status"`

Confirmation writes a separate adoption run state:

- `runId`
- `command: "symphony adopt"`
- `semanticCommand: "adopt"`
- `status: "passed"` only after the patch is applied and evidence is recorded.
- `status: "failed"` when preflight or application fails.
- `exitCode`
- `verifierStatus: "passed"` when post-apply checks pass.
- `adoptionPlanId`
- `adoptionPlanArtifactPath`
- `plannedAdoptionRunId`
- `sourceRunId`
- `executionPlanId`
- `patchArtifactPath`
- `patchHash`
- `projectWrites: true`
- `mainWorktreeWrites: true`
- `workspaceWrites: false`
- `runtimeWrites: true`
- `externalCalls: false`
- `destructiveWrites: false`
- `writeBoundary: "main-worktree"`
- `changedFiles`
- `evidenceArtifactPath`
- `artifactRefs`
- `nextAction: "symphony status"`

If patch application succeeds but post-apply evidence or state persistence fails, v12 must not attempt automatic rollback. It must best-effort write a failed run state with `mainWorktreeWrites: true`, `failurePhase: "post-apply-evidence"`, changed-file refs when available, and `nextAction: "symphony status"`.

## Source Workspace Contract

Adoption planning reads source workspace refs from the confirmed source run:

- Prefer `sourceWorkspacePath` and `sourceWorkspaceManifestPath` fields on the confirmed run state.
- Otherwise read a registered `artifactRefs[]` entry with `kind: "workspace-manifest"` and derive the workspace path from that manifest.
- If a confirmed v11 run lacks these fields, reject with `source-run-missing-workspace-ref`; legacy v11 runs without workspace refs are not adoptable.
- `sourceWorkspacePath` must resolve under the frozen execution plan `workDir` or a managed materialized workspace root; never trust arbitrary paths from evidence.
- Adoption plans must store `sourceWorkspaceManifestPath` and `sourceWorkspaceFingerprint`.

The v12 implementation may need a small v11 additive update so newly confirmed runs persist these workspace refs. That update must stay additive and must not change existing v11 plan/confirm behavior.

## Fingerprint Definitions

- `gitHead` is the full `git rev-parse HEAD` value.
- `gitStatusFingerprint` is `sha256` over normalized `git status --porcelain=v1 -z --untracked-files=all`, excluding `stateDir`, `.symphony/`, configured runtime dirs, and managed isolated workspace roots.
- Planning requires the filtered status entries to be empty; confirmation recomputes with the same exclusions and rejects on drift.
- `projectFingerprint` must be computed with the same state/runtime/workspace exclusions used by v11 plan confirmation.
- `sourceWorkspaceFingerprint` is `sha256` over the normalized supported source workspace candidate file set, including path, operation, size, text encoding, before hash, and after hash.
- `patchHash` is `sha256` over the exact bytes of the registered patch artifact.

## Guard Rails

Planning must reject before writing an adoption plan when:

- The source run is missing.
- The source run is not a confirmed v11 run.
- The source run is not `status: "passed"` and `verifierStatus: "passed"`.
- The source run lacks a registered isolated workspace or evidence artifact.
- The source run has `mainWorktreeWrites: true`.
- The source workspace is missing.
- The source workspace diff contains unsupported file operations.
- The source workspace diff touches paths outside the project root.
- The source workspace diff touches `.symphony/`, `.git/`, `node_modules/`, runtime directories, or other ignored roots.
- The main worktree has non-Symphony uncommitted changes.

Confirmation must reject before writing to the main worktree when:

- The adoption plan is missing or malformed.
- The adoption id is not a safe path segment.
- Extra prompt args or execution flags are passed.
- The current project fingerprint differs from the frozen project fingerprint.
- The current git HEAD differs from the frozen git HEAD.
- The dirty-worktree fingerprint differs from the frozen dirty-worktree fingerprint, ignoring only Symphony-owned state/runtime paths explicitly captured by the adoption plan.
- The source run or source workspace fingerprint differs from the frozen plan.
- The patch hash differs from the frozen plan.
- `git apply --check` fails.
- The patch contains unsupported file operations or unsafe paths.

## Patch Semantics

v12 should support only text add/modify operations. The patch should be generated from the source isolated workspace against the project root baseline used by the confirmed run.

Patch candidate contract:

- Candidate paths are normalized POSIX relative paths from the actual diff between `sourceWorkspacePath` and the frozen project baseline.
- Evidence `changedFiles` must match the actual supported diff set after normalization; mismatch rejects planning.
- `fileOperations[]` entries use `{ path, operation: "add" | "modify", beforeHash, afterHash, size, textEncoding }`.
- Reject absolute paths, `..`, NUL, backslashes on POSIX-normalized paths, directories, symlinks, binary content, chmod-only changes, deletions, and renames.
- Confirmation evidence must prove every planned `afterHash` matches the main worktree after apply and no extra non-Symphony paths changed.

Recommended implementation:

- Compute candidate changed files from the source workspace manifest/evidence.
- Generate a unified diff artifact for supported files.
- Store and hash the patch artifact.
- On confirm, run `git apply --check <patch>`.
- Apply with `git apply <patch>`.
- Re-read the changed files and record an evidence artifact with file hashes.
- Never regenerate the patch during confirmation; the current source workspace is used only for fingerprint drift checks.

## Workbench and Diagnostics

Workbench remains read-only and copy-only:

- Show adoption-plan artifact refs in run details.
- Show source run, patch path, changed files, and confirm command.
- Preview patch artifacts only through registered artifact refs.
- Keep the 200 KiB preview cap.
- Do not add buttons that execute adoption.

`symphony diagnose --json` should expose adoption plan refs and risks:

- `pending_adoption`
- `stale_adoption`
- `dirty_worktree_blocks_adoption`
- `unsupported_adoption_changes`

Snapshot and run detail JSON should expose `adoptionPlanId`, `adoptionPlanArtifactPath`, `patchArtifactPath`, `patchHash`, `changedFiles`, and `confirmationCommand` when present.

## Residual Risks

- Text-only diffs can still be semantically wrong; v12 adoption verifies patch integrity, not product correctness.
- v12 intentionally does not handle binary files, renames, deletions, symlinks, chmod-only changes, or conflict resolution.
- Patch application and evidence/state persistence are not transactional; post-apply failures may leave main worktree changes that require manual inspection.
- Dirty-worktree gates depend on git availability and correct ignored-path normalization.
- Adoption does not run package/test commands; follow-up verification remains a separate user or CI action.

## Tests

Add focused tests before or alongside implementation:

- `symphony adopt --run <confirmed-run-id> --json` returns `status: "adoption-planned"`.
- Planning writes `symphony.adoption-plan` and patch artifacts.
- Planning does not modify the main worktree.
- Human output includes adoption id and exact confirm command.
- Planning rejects failed, planned, missing, stale, or non-v11 source runs.
- Planning rejects source workspaces with deletion, rename, symlink, binary, chmod-only, ignored-root, or path-traversal changes.
- `symphony adopt --confirm <adoption-id> --json` applies the frozen patch.
- Confirmation rejects extra prompt args or execution flags.
- Confirmation rejects missing adoption plans, invalid adoption ids, stale project fingerprints, changed git HEAD, dirty worktree drift, changed source workspace, changed patch hash, and failed `git apply --check`.
- Status, console snapshot, and diagnose JSON expose adoption-plan artifact refs.
- Console patch preview remains registered-ref only and capped at 200 KiB.
- v10 diagnostics and v11 controlled execution tests remain compatible.

## Verification

Required local gates:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
```

Recommended smoke:

```sh
symphony do --write --json "make a small README edit"
symphony do --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --json
symphony adopt --confirm <adoption-id> --json
symphony status --json
symphony console --snapshot --json
symphony diagnose --json
```

The smoke must prove that the main worktree remains unchanged until `symphony adopt --confirm <adoption-id>` and that the final changed files match the frozen adoption patch exactly.
