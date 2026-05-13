# Project Completion Plan

Date: 2026-05-13
Status: planning artifact
Scope: complete Multi Coding Agent Symphony from current prototype to V1 harness.

## Terms

- Harness = the orchestration system in this repository: contracts, queue, scheduler, adapters, verifier, artifacts, event log, eval plugin, and smoke checks.
- Runtime adapter = CLI-specific translation layer for Codex, Claude Code, or Kiro CLI.
- EvidencePackage = structured result object consumed by `src/verifier.js`.
- Real smoke = guarded command that invokes an actual model/CLI, not a fake process runner.
- V1 = one primary writer, separate review/QA workspaces, durable artifacts/events, Codex plus one additional real CLI adapter, and verifier-gated completion.

## Current Baseline

Implemented and tested:

- Documentation baseline: `README.md`, `docs/architecture.md`, `docs/core-contracts.md`, `docs/adapter-contract.md`, `docs/module-plan.md`, `docs/bdd-tdd-workflow.md`, `docs/eval-replay-plugin.md`, `docs/real-cli-integration.md`.
- Core validators: `src/contracts.js` validates `TaskSpec`, `CommandSpec`, `AdapterMapping`, `ModelProfile`, and `EvidencePackage`.
- Durable primitives: `src/artifact-store.js`, `src/session-event-log.js`, `src/failure-taxonomy.js`.
- Policy/context/capability: `src/policy-engine.js`, `src/context-builder.js`, `src/capability-registry.js`.
- Queue/routing/workspace/verification: `src/task-queue.js`, `src/router-scheduler.js`, `src/workspace-manager.js`, `src/verifier.js`.
- Orchestrator skeleton: `src/orchestrator.js` can route, allocate workspace, start adapter, store evidence, and verify.
- Adapter lifecycle foundation: `src/adapters/base-adapter.js`, `src/adapters/codex-adapter.js`, `src/adapters/claude-code-adapter.js`, `src/adapters/kiro-cli-adapter.js`.
- Real Codex path: `src/process-runner.js`, `src/evidence-parser.js`, `schemas/evidence-package.schema.json`, `src/codex-real-smoke.js`, `scripts/smoke-codex-real.js`.
- External eval prototype: `plugins/eval-replay/index.js`.
- Phase A contract reconciliation: `TaskSpec` optional metadata is validated, `EvidencePackage.checks` has explicit `name/status/output`, and the strict JSON schema matches the validator.
- Phase B queue persistence slice: `TaskQueue` can persist state, reload after restart, and recover expired running leases.
- Phase B workspace materialization slice: `WorkspaceManager` can create workspace directories and write workspace manifests when materialization is enabled.
- Phase B workspace cleanup slice: `WorkspaceManager` can remove temporary workspace content while retaining the workspace manifest and a cleanup record.
- Phase B workspace lock slice: materialized primary-writer locks survive `WorkspaceManager` restart and block duplicate writer allocation for the same task.
- Phase B lifecycle metadata slice: queue and workspace lifecycle changes expose event IDs and deterministic timestamps when provided.
- Phase B workspace clone slice: review workspaces can clone primary-writer content while retaining non-writable ownership metadata.
- Phase C workflow slice: `Orchestrator.runTaskWorkflow` can execute `implement -> review`, pass implementation evidence refs into review context, and clone review workspace metadata.
- Phase C verifier gate slice: workflow stops on verifier failure and records `command.failed`.
- Phase C retry planning slice: failed workflows classify verifier failures and return the scheduler retry plan.
- Phase C command run record slice: every command writes a run record artifact linking evidence, workspace, verification status, and context artifact refs.
- Phase C context hydration slice: later command context packs hydrate referenced artifact content from the Artifact Store.
- Phase C queue-backed workflow slice: `Orchestrator.runNextTask` leases a persisted queued task, runs the workflow, and completes the queue record on success.
- Phase C sequence policy slice: named `standard` workflow expands to `implement -> review -> qa`.
- Phase C failed queue state slice: failed queued workflows persist failure and retry metadata, and retryable failures return to queued status.
- Phase D process runner slice: `NodeProcessRunner` exposes startable handles that can be cancelled while preserving partial output, with `run()` compatibility retained.
- Phase D Codex cancellation slice: active real Codex runs store process handles, forward idempotent adapter cancellation, resume public state, and return cancelled evidence with partial output.
- Phase D timeout escalation slice: timed out process runs first send `SIGTERM`, then escalate to `SIGKILL` after the timeout grace period while preserving partial output.
- Phase E model profile mapping slice: Codex project profile IDs can defer to CLI config, map to concrete Codex `--model` names, or pass through as direct smoke override model names.
- Phase E prompt template slice: Codex renders command-specific role prompts for `plan`, `implement`, `review`, `fix-ci`, and `qa` while preserving EvidencePackage output instructions.
- Phase E log artifact slice: Codex raw stdout JSONL, stderr, parsed events, and final message capture are stored as adapter artifacts and linked from command run records.
- Phase E structured error slice: Codex JSONL error events map to `permission-denied`, `model-off-task`, or `adapter-crashed` through the shared failure taxonomy.
- Phase E writer smoke slice: `pnpm smoke:codex:writer` is separately gated by `MCAS_RUN_REAL_CODEX_WRITER=1`, runs `implement` with `primary-writer` policy, and defaults to an isolated temporary git workspace.
- Phase E workspace policy slice: Codex read-only smoke and review commands render `--sandbox read-only`, while writer smoke renders `--sandbox workspace-write`.
- Phase F Claude real runner slice: `ClaudeCodeAdapter` can run real mode through an injected `NodeProcessRunner`, parse stream-json structured evidence, and preserve raw output as verification-insufficient evidence.
- Phase F Claude smoke slice: `pnpm smoke:claude:help` checks local CLI assumptions, and gated `pnpm smoke:claude:real` defaults to no model call unless `MCAS_RUN_REAL_CLAUDE=1` is set.
- Phase G Kiro real runner slice: `KiroCliAdapter` can run real mode through an injected `NodeProcessRunner`, parse stdout structured evidence, and preserve raw output as verification-insufficient evidence.
- Phase G Kiro smoke slice: `pnpm smoke:kiro:help` checks local CLI assumptions, and gated `pnpm smoke:kiro:real` defaults to no model call unless `MCAS_RUN_REAL_KIRO=1` is set.
- Phase G Kiro trust-tool policy slice: denied shell or network policy decisions remove unsafe Kiro trusted tool categories while preserving read-only trust categories.
- Phase H verifier provenance slice: production checks require command-plus-exit-code or artifact provenance, read-only changed-file scope violations fail verification, and failed check lists contain only failed checks.
- Phase H command evidence slice: implementation evidence requires changed files or no-op rationale, review evidence requires findings or no-finding rationale, and production QA evidence requires at least one check artifact.
- Phase H workspace boundary slice: verifier rejects changed files that resolve outside the provided workspace manifest path, and the orchestrator passes the allocated workspace into verification.
- Phase I eval sample-builder slice: `buildReplaySampleFromSession` builds replay samples from `artifact.written` session events and evidence artifacts without adapter state.
- Phase I eval report artifact slice: `writeEvalReportArtifact` stores eval reports in ArtifactStore and returns the task/artifact reference without mutating routing config.
- Phase I eval resource/tradeoff slice: eval reports qualify baseline/candidate resource mismatches and recommendations can include higher-cost tradeoffs plus affected files/contracts.
- Phase I eval release-gate slice: `pnpm eval:replay` builds a replay sample from stored artifacts, writes an eval report artifact, and returns the report reference without mutating router config.
- Phase I eval fixture/task-class slice: bundled model-upgrade and adapter-regression fixtures drive task-class success summaries and failure deltas.
- Phase I eval real-resource slice: real smoke evidence records `resourceProfile` with CPU, memory, timeout, concurrency, network, and version fields for eval replay.
- Phase J registry slice: `ModelProfileRegistry` and `AdapterMappingRegistry` persist contract-validated JSON and reload/query profiles or CLI mappings by command and capability inputs.
- Phase J routing policy slice: `RouterScheduler.route` can exclude retryable adapter failures, prefer lower-cost review models, honor explicit model overrides, and return an explainable route decision.
- Phase J route decision artifact slice: orchestrator command runs write `<command>-route-decision` artifacts and link them from command run records.
- Phase J eval approval slice: eval recommendations stay advisory unless a release approval explicitly names the candidate model profile.
- Phase K GitHub issue intake slice: pure GitHub issue metadata conversion produces validated `TaskSpec` objects with source, repository, objective, acceptance, priority, and created timestamp.
- Phase K GitHub PR intake slice: pure pull request metadata conversion produces read-only review `TaskSpec` objects with PR number, base/head refs, and acceptance criteria.
- Phase K GitHub CI status slice: GitHub check runs normalize into artifact-ready CI summaries with aggregate status, conclusion, URLs, and failing check names.
- Phase K GitHub issue `gh` wrapper slice: injected-runner issue intake calls `gh issue view --json ...`, parses JSON, and returns validated `TaskSpec` objects.
- Phase K GitHub PR/CI `gh` wrapper slice: injected-runner PR intake calls `gh pr view --json ...`, and CI capture calls `gh api .../check-runs` through the pure normalizer.
- Phase K GitHub PR summary slice: PR summaries combine the validated review task, CI status, failing checks, and artifact references into an artifact-ready object plus markdown.
- Phase K GitHub naming policy slice: PR branch and workspace names are deterministic ASCII safe path segments derived from repository, PR number, and head ref.
- Phase L CLI entrypoint slice: `pnpm mcas doctor` emits JSON health data, `pnpm mcas github issue ...` performs read-only GitHub issue intake without invoking a model, `pnpm mcas queue manual ...` persists manual tasks into `TaskQueue`, and `pnpm mcas run-next ...` executes the standard dry-run workflow with verifier exit-code mapping.
- Test baseline: `pnpm test` currently covers 119 tests across 19 suites.
- Real Codex smoke result: `MCAS_RUN_REAL_CODEX=1 MCAS_CODEX_TIMEOUT_MS=180000 pnpm smoke:codex:real` passed with `verification.status = passed`.

Known gaps:

- Verifier still lacks external CI provider status checks.
- CLI currently covers doctor, GitHub issue intake, manual queue intake, and run-next; run-task, smoke, eval, and config commands remain.

## Target V1

V1 proves this workflow end to end:

1. A GitHub issue or manual task becomes a validated `TaskSpec`.
2. The orchestrator leases the task and chooses `plan`, `implement`, `review`, or `qa` commands through `CommandSpec`.
3. Exactly one primary writer workspace is created for implementation.
4. Review and QA run in separate read-only or isolated workspaces.
5. Codex real CLI and one additional real CLI adapter can run non-interactively.
6. Every command writes artifacts, structured evidence, and session events.
7. The verifier decides completion from evidence, not agent narrative.
8. Failures are classified and retried or escalated through `FailureTaxonomy`.
9. Eval/replay remains an external plugin and runs only for model, adapter, verifier, context, policy, or harness changes.

## Decision Drivers

1. Keep `CommandSpec` semantic and keep CLI flags inside adapters.
2. Prefer verifier-readable evidence over agent summaries.
3. Use BDD plus TDD for every module increment.
4. Make real CLI calls guarded, reproducible, and low-risk before making them part of normal routing.
5. Build durable state before expanding concurrency.
6. Add production features by tightening existing modules instead of adding parallel abstractions.

## Completion Phases

### Phase A: Contract Reconciliation

Status: completed for V1 contract alignment.

Goal: make docs, validators, JSON schemas, and tests describe the same objects.

Work:

- Align `TaskSpec` in `docs/core-contracts.md` and `src/contracts.js`.
- Decide whether `constraints`, `priority`, and `createdAt` are required or optional in V1.
- Add explicit `CheckEvidence` shape used by `EvidencePackage.checks`.
- Make `schemas/evidence-package.schema.json` match `validateEvidencePackage`.
- Add schema fixtures for valid and invalid evidence.
- Add `SessionEvent` validator or document why events remain looser in V1.

Primary files:

- `docs/core-contracts.md`
- `schemas/evidence-package.schema.json`
- `src/contracts.js`
- `tests/contracts-complete.test.js`
- `features/core-contract-completion.feature`

BDD/TDD:

- Add scenario: optional task metadata is preserved when present.
- Add test: `validateTaskSpec` accepts V1 optional fields and rejects malformed optional fields.
- Add test: `validateEvidencePackage` rejects checks without `name`, `status`, and command output/provenance.

Acceptance:

- `docs/core-contracts.md`, `src/contracts.js`, and `schemas/evidence-package.schema.json` agree.
- Existing tests still pass.
- New contract tests fail before implementation and pass after implementation.

### Phase B: Durable State and Workspace Materialization

Status: completed for V1 durable state primitives. Queue persistence, expired lease recovery, workspace materialization, manifests, cleanup, retained cleanup records, primary-writer locks, lifecycle event IDs, and review clone policy are complete.

Goal: turn in-memory primitives into recoverable harness state.

Work:

- Persist task queue records to disk under a configured state directory.
- Add lease metadata: `leasedAt`, `leaseTimeoutMs`, `attempt`, `adapterId`, `command`.
- Add recovery behavior for expired running leases.
- Materialize workspace directories in `WorkspaceManager`.
- Add workspace cleanup and retained-artifact policy.
- Add a workspace manifest artifact containing task id, role, adapter id, writable flag, and path.
- Add event IDs and timestamps to queue/workspace lifecycle changes.

Primary files:

- `src/task-queue.js`
- `src/workspace-manager.js`
- `src/session-event-log.js`
- `src/artifact-store.js`
- `tests/task-queue.test.js`
- `tests/phase4.test.js`
- `features/task-queue.feature`
- `features/phase-4-routing-verification.feature`

BDD/TDD:

- Add scenario: expired running task is recoverable and can be leased again.
- Add scenario: workspace allocation creates a directory and manifest.
- Add scenario: cleanup removes temporary workspace content but preserves artifacts.
- Add scenario: materialized primary-writer lock survives manager restart.
- Add scenario: queue and workspace lifecycle metadata is recorded.
- Add scenario: review workspace clones primary-writer content while staying non-writable.

Acceptance:

- A process restart can reconstruct queued/running/completed tasks from disk.
- A primary writer workspace cannot be allocated twice for the same task.
- Review/QA workspace materialization is read-only or isolated by policy.

### Phase C: Orchestrator Command Loop

Status: completed for V1 command loop. The workflow path, verifier-gated failure stop, retry planning, command run records, context artifact hydration, queue-backed `runNextTask`, default command sequence policy, and failed queue retry state are complete.

Goal: make `Orchestrator` run command sequences from queue state, not just one direct `runCommand` call.

Work:

- Add a `runNextTask` or `runTaskWorkflow` entrypoint.
- Encode command sequence policies: `plan -> implement -> review -> qa`.
- Store command run records as artifacts.
- Feed previous artifacts and selected events into `ContextBuilder`.
- Apply failure taxonomy to choose retry, follow-up command, or terminal failure.
- Ensure `artifactRefs` from earlier commands are included in later context packs.
- Add `command.started`, `command.failed`, and retry event shapes if needed.

Primary files:

- `src/orchestrator.js`
- `src/context-builder.js`
- `src/failure-taxonomy.js`
- `src/router-scheduler.js`
- `tests/orchestrator.test.js`
- `features/orchestrator-dry-run-flow.feature`
- `features/orchestrator-policy-gate.feature`

BDD/TDD:

- Add scenario: implement then review runs as one workflow and review receives implementation artifact refs.
- Add scenario: verifier failure stops workflow and records `command.failed`.
- Add scenario: implement failure classified as retryable schedules QA or retry command.
- Add scenario: failed workflow returns retry plan from failure taxonomy.
- Add scenario: every command stores a run record artifact separate from evidence.
- Add scenario: later command context hydrates referenced artifact content.
- Add scenario: persisted queued task can be leased and completed by the orchestrator workflow.
- Add scenario: named standard command sequence runs implement, review, and qa.
- Add scenario: failed queued workflow persists retry metadata.
- Add scenario: review receives implementation evidence through artifact refs.
- Add scenario: verifier failure prevents task completion.

Acceptance:

- A task can progress through at least two commands in one orchestrator workflow.
- Every command writes evidence and a verifier result.
- Failure path is observable in `SessionEventLog`.

### Phase D: Process Lifecycle and Cancellation

Status: completed for V1 process lifecycle and cancellation.

Goal: support active process cancellation and terminal lifecycle states across adapters.

Work:

- Split `NodeProcessRunner.run()` into startable process handle plus awaitable result, or add a compatible active-run API.
- Store process handles inside real adapters until terminal state.
- Implement adapter `cancel(handle)` for real Codex.
- Add timeout escalation: `SIGTERM`, wait, then `SIGKILL`.
- Capture partial stdout/stderr and output files on cancellation.
- Normalize cancellation into failure taxonomy or terminal cancelled status.

Primary files:

- `src/process-runner.js`
- `src/adapters/base-adapter.js`
- `src/adapters/codex-adapter.js`
- `tests/codex-real-cli.test.js`
- `tests/adapter-lifecycle.test.js`
- `features/adapter-lifecycle-conformance.feature`

BDD/TDD:

- Add scenario: process runner handle cancellation preserves partial stdout.
- Add scenario: cancelling a real run terminates the child process and records cancelled status.
- Add scenario: timed out process termination escalates from `SIGTERM` to `SIGKILL`.
- Add test with a fake long-running process runner.
- Add test that timeout escalation preserves captured output.

Acceptance:

- Real Codex active run can be cancelled by adapter lifecycle.
- Cancellation is idempotent.
- Partial evidence is stored with known risk, not marked passed.
- Timed out process termination escalates after the configured grace period.

### Phase E: Codex Production Readiness

Status: completed for V1 Codex production readiness.

Goal: make Codex adapter reliable enough for V1 writer/reviewer/QA use.

Work:

- Add model profile mapping so project profile IDs can map to real Codex model names or config default.
- Add prompt templates per command instead of one generic `buildRunPrompt`.
- Add Codex implement smoke behind a stronger gate, separate from read-only smoke.
- Add log artifact capture for raw JSONL, final message, stderr, and parsed events.
- Add workspace policy checks for read-only smoke, writer smoke, and review mode.
- Add failure parsing for structured Codex error events.

Primary files:

- `src/adapters/codex-adapter.js`
- `src/codex-real-smoke.js`
- `scripts/smoke-codex-real.js`
- `src/evidence-parser.js`
- `docs/real-cli-integration.md`
- `tests/codex-real-cli.test.js`
- `tests/codex-real-smoke.test.js`

BDD/TDD:

- Add scenario: Codex writes implementation evidence with changed files and checks.
- Add scenario: Codex structured error maps to `adapter-crashed`, `permission-denied`, or `model-off-task`.
- Add test for model profile ID to CLI model mapping.

Acceptance:

- Read-only smoke remains passed.
- Guarded writer smoke can run in an isolated temp repo and produce changed-file evidence.
- Raw Codex outputs are linked as artifacts.

### Phase F: Claude Code Real Adapter

Status: completed for V1 Claude Code real adapter.

Goal: connect Claude Code to the same real adapter lifecycle through the user's DeepSeek-compatible setup.

Work:

- Add injected `NodeProcessRunner` support to `ClaudeCodeAdapter`.
- Add real execution mode with `claude -p --output-format stream-json`.
- Add output-last-message equivalent if Claude Code supports it; otherwise parse final `stream-json` message.
- Add structured evidence prompt and parser using `extractEvidencePackageFromSources`.
- Add permission mapping tests for DeepSeek-backed Claude Code config.
- Add `pnpm smoke:claude:help` and gated `pnpm smoke:claude:real`.
- Record local `claude --help` assumptions in docs.

Primary files:

- `src/adapters/claude-code-adapter.js`
- `src/process-runner.js`
- `src/evidence-parser.js`
- `docs/real-cli-integration.md`
- `docs/adapter-contract.md`
- `tests/phase3.test.js`
- New `tests/claude-real-cli.test.js`
- New `src/claude-real-smoke.js`
- New `scripts/smoke-claude-real.js`

BDD/TDD:

- Add feature file or scenarios for Claude real CLI integration.
- Add fake-runner tests before real smoke.
- Add default skip behavior for gated real smoke.

Acceptance:

- Dry-run Claude tests still pass.
- Real Claude smoke invokes the configured CLI and returns verifier-passing structured evidence.
- Failure without structured evidence remains verification-insufficient.

### Phase G: Kiro CLI Real Adapter

Status: completed for V1 Kiro real adapter coverage.

Goal: connect Kiro CLI as the spec-heavy Claude-backed lane.

Work:

- Add injected `NodeProcessRunner` support to `KiroCliAdapter`.
- Add real execution mode for `kiro-cli chat --no-interactive`.
- Map `CommandSpec.allowedTools` to trusted tool categories with policy deny overrides.
- Add Kiro steering/spec context generation if needed.
- Parse stdout or JSON output into `EvidencePackage`.
- Add `pnpm smoke:kiro:help` and gated `pnpm smoke:kiro:real`.

Primary files:

- `src/adapters/kiro-cli-adapter.js`
- `src/evidence-parser.js`
- `docs/real-cli-integration.md`
- `docs/adapter-contract.md`
- `tests/phase3.test.js`
- New `tests/kiro-real-cli.test.js`
- New `src/kiro-real-smoke.js`
- New `scripts/smoke-kiro-real.js`

BDD/TDD:

- Add scenario: Kiro real smoke runs with trusted read tools only.
- Add test: denied shell/network policy removes or blocks unsafe trust categories.
- Add test: structured Kiro output verifies.

Acceptance:

- Real Kiro smoke passes or records a documented environment blocker.
- Kiro adapter preserves `CommandSpec` semantics and keeps CLI flags adapter-local.

### Phase H: Verifier Hardening

Status: completed for V1 verifier hardening. Live external CI provider validation remains a later hardening gap.

Goal: move from accepting self-reported checks to validating evidence provenance.

Work:

- Define `CheckEvidence` fields: `name`, `status`, `command`, `exitCode`, `output`, `artifactId`, `startedAt`, `finishedAt`.
- Require failed checks to include output or artifact reference.
- Add changed-file scope checks against workspace manifest and command policy.
- Validate that `implementation` evidence includes either changed files or explicit no-op rationale.
- Validate that `review` evidence includes findings or explicit no-finding rationale.
- Validate that `qa` evidence includes at least one check artifact.
- Emit richer verifier reasons: `checks-missing`, `check-failed`, `scope-violation`, `artifact-missing`.

Primary files:

- `src/verifier.js`
- `src/contracts.js`
- `schemas/evidence-package.schema.json`
- `tests/phase4.test.js`
- `tests/contracts-complete.test.js`
- `docs/core-contracts.md`

BDD/TDD:

- Add scenario: check without artifact provenance is rejected for production commands.
- Add scenario: changed file outside workspace policy fails verification.
- Add scenario: failed check returns exact failed check list.

Acceptance:

- Verifier can still pass current real smoke.
- Verifier rejects narrative-only and weak structured self-report.
- Verification failures are actionable and machine-readable.

### Phase I: Eval/Replay Productionization

Status: completed for V1 eval/replay productionization. Session-log sample building from stored evidence artifacts, eval report artifact writing, resource comparison qualification, richer recommendation metadata, the external release-gate command, task-class summaries, model-upgrade/adapter-regression fixtures, and real-run resource profile capture are complete.

Goal: make external eval useful for model updates, adapter changes, and harness refactors.

Work:

- Add artifact sample builder from session logs and evidence.
- Add plugin report artifact writer.
- Add resource profile capture from real runs.
- Add baseline/candidate comparison by task class.
- Add release-gate command that runs eval without mutating router config.
- Add recommendations that name affected files and contracts.
- Add fixtures for model upgrade and adapter regression.

Primary files:

- `plugins/eval-replay/index.js`
- `docs/eval-replay-plugin.md`
- `tests/phase5.test.js`
- `src/artifact-store.js`
- `src/session-event-log.js`
- Possible new `scripts/eval-replay.js`

BDD/TDD:

- Add scenario: eval sample is built from prior command artifacts.
- Add test: candidate with higher verified success but higher cost reports tradeoff.
- Add test: resource mismatch prevents direct comparison or marks comparison qualified.

Acceptance:

- Eval report can be generated from stored artifacts only.
- Report includes resource profile, failure deltas, and recommendations.
- Plugin never mutates core routing or model config.

### Phase J: Model Profiles and Routing Policy

Status: completed for V1 model profiles and routing policy. Persisted model profile and adapter mapping registries, deterministic route selection policy, route decision artifact persistence, explicit model override behavior, and eval recommendation approval boundaries are complete.

Goal: route based on adapter capability, model profile, prior failures, cost class, and eval recommendations.

Work:

- Add persisted model profile registry.
- Add adapter mapping registry.
- Add route selection inputs: command, excluded adapters, model class, cost class, known failure history.
- Add policy for config-default model profiles vs explicit model names.
- Add route decision artifact explaining why an adapter/model was chosen.
- Keep eval recommendations advisory until approved by a release step.

Primary files:

- `src/router-scheduler.js`
- `src/capability-registry.js`
- `src/contracts.js`
- `docs/core-contracts.md`
- `docs/adapter-contract.md`
- New `src/model-profile-registry.js`
- New `src/adapter-mapping-registry.js`

BDD/TDD:

- Add scenario: router skips adapter after retryable adapter failure.
- Add scenario: router chooses lower-cost model for review when capability is equal.
- Add scenario: explicit model override beats default profile.

Acceptance:

- Route decisions are deterministic and explainable.
- Model profile changes can be evaluated before becoming default.

### Phase K: GitHub Intake and CI Feedback

Status: completed for V1 intake primitives. Pure GitHub issue/PR metadata conversion, CI status artifact normalization, live issue/PR/CI `gh` wrappers, PR summary artifacts, and deterministic branch/workspace naming policy are complete; posting PR comments stays optional and outside the V1 hot path.

Goal: support one real tracker first. Choose GitHub for V1 because the repository already uses GitHub and `gh` is available.

Work:

- Add GitHub task intake from issue or PR.
- Convert GitHub metadata into `TaskSpec`.
- Add CI status artifact capture.
- Add optional PR comment or artifact summary output.
- Add branch/workspace naming policy.
- Add read-only PR review command path.

Primary files:

- New `src/trackers/github-intake.js`
- New `scripts/intake-github.js`
- `src/contracts.js`
- `src/orchestrator.js`
- `docs/architecture.md`
- `README.md`

BDD/TDD:

- Add scenario: GitHub issue becomes TaskSpec.
- Add test with fixture JSON from `gh issue view`.
- Add test: missing acceptance criteria falls back to issue body summary with known risk.

Acceptance:

- A GitHub issue can be converted into a queued task without invoking a model.
- CI status can be stored as evidence for `fix-ci` or `qa`.

### Phase L: User-Facing CLI

Status: in progress. The first CLI slices are complete: `scripts/mcas.js` exposes `doctor`, read-only GitHub issue intake, persistent manual task queue intake, and verifier-gated `run-next` through `pnpm mcas`.

Goal: expose project workflows without requiring ad hoc Node imports.

Work:

- Add command entrypoint, for example `scripts/mcas.js`.
- Commands: `queue`, `run-next`, `run-task`, `smoke`, `eval`, `doctor`.
- Add config file support for artifact directory, state directory, adapter binaries, smoke gates, and default model profiles.
- Add clear nonzero exit codes for verifier failure, policy denial, adapter crash, and config error.
- Document commands in `README.md`.

Primary files:

- New `scripts/mcas.js`
- `package.json`
- `README.md`
- `docs/real-cli-integration.md`
- New `tests/cli.test.js`

BDD/TDD:

- Add scenario: CLI queues a manual task and prints task id.
- Add scenario: CLI run-next returns nonzero when verifier fails.
- Add test: config defaults are applied when env vars are absent.

Acceptance:

- Main workflows can be executed through `pnpm mcas ...` or equivalent package script.
- CLI output includes artifact paths and verifier status.

### Phase M: Security, Redaction, and Policy Enforcement

Goal: prevent adapters and artifacts from leaking secrets or bypassing policy.

Work:

- Add secret/path redaction in event log and artifacts.
- Add shell command allow/deny policy with exact command matching and pattern matching.
- Add network policy field to `CommandSpec` or execution config.
- Add artifact redaction tests for `.env`, tokens, and auth paths.
- Add adapter-specific permission mapping for Codex, Claude Code, and Kiro.
- Add security review checklist to docs.

Primary files:

- `src/policy-engine.js`
- `src/artifact-store.js`
- `src/session-event-log.js`
- `src/adapters/*.js`
- `docs/adapter-contract.md`
- `docs/bdd-tdd-workflow.md`
- New `tests/security-policy.test.js`

BDD/TDD:

- Add scenario: secret-looking output is redacted before artifact write.
- Add scenario: denied file path blocks adapter before real CLI execution.
- Add test: policy deny is represented in CLI-specific permission flags.

Acceptance:

- Sensitive paths and token-looking strings are not written raw into artifacts/events.
- Policy decisions are visible and enforced before adapter start.

### Phase N: Documentation and Release Readiness

Goal: make the project usable after clone and safe to extend.

Work:

- Update `README.md` with current status, scripts, and V1 workflow.
- Add adapter setup docs for Codex, Claude Code, and Kiro CLI.
- Add development guide for BDD/TDD workflow.
- Add release checklist.
- Add troubleshooting docs for structured output schema failures and CLI auth/config issues.
- Add project roadmap summary that links this plan.

Primary files:

- `README.md`
- `CONTRIBUTING.md`
- `docs/real-cli-integration.md`
- `docs/adapter-contract.md`
- `docs/bdd-tdd-workflow.md`
- New `docs/release-checklist.md`
- New `docs/troubleshooting.md`

BDD/TDD:

- Documentation changes do not need red tests unless they alter contracts.
- Any documented command must have a smoke, unit, or fixture test.

Acceptance:

- A new contributor can run test/check/help smoke from README.
- Real model smoke gates are documented and default to no model call.

## Recommended Execution Order

1. Phase A: Contract Reconciliation.
2. Phase B: Durable State and Workspace Materialization.
3. Phase D: Process Lifecycle and Cancellation.
4. Phase E: Codex Production Readiness.
5. Phase F: Claude Code Real Adapter.
6. Phase G: Kiro CLI Real Adapter.
7. Phase H: Verifier Hardening.
8. Phase C: Orchestrator Command Loop.
9. Phase I: Eval/Replay Productionization.
10. Phase J: Model Profiles and Routing Policy.
11. Phase K: GitHub Intake and CI Feedback.
12. Phase L: User-Facing CLI.
13. Phase M: Security, Redaction, and Policy Enforcement.
14. Phase N: Documentation and Release Readiness.

Rationale:

- Contracts first prevent repeated rewrites.
- Durable state and cancellation should exist before more real CLIs run.
- Codex is already connected, so it should become the reference production adapter.
- Claude Code and Kiro should reuse the Codex real adapter pattern and shared evidence parser.
- Verifier hardening should land before multi-command autonomous workflows are trusted.
- Eval and routing should consume real run data, not guesses.

## Milestones

### Milestone 1: Core Harness Stabilized

Includes Phases A, B, and D.

Exit criteria:

- Queue state survives restart.
- Workspace directories are materialized and cleaned safely.
- Real Codex cancellation works.
- `pnpm test`, `pnpm check`, and `pnpm smoke:codex:help` pass.

### Milestone 2: Codex Reference Adapter

Includes Phase E and first part of Phase H.

Exit criteria:

- Codex read-only real smoke passes.
- Codex guarded writer smoke passes in a disposable workspace.
- Verifier rejects weak evidence and accepts command-backed evidence.

### Milestone 3: Multi-CLI Real Adapter Coverage

Includes Phases F and G.

Exit criteria:

- Claude Code real smoke passes or records documented environment blocker.
- Kiro CLI real smoke passes or records documented environment blocker.
- Adapter conformance tests cover all three adapters.

### Milestone 4: V1 Orchestration Flow

Includes Phases C, J, and K.

Exit criteria:

- A manual or GitHub task can run through implement, review, and QA commands.
- One writer workspace and separate review/QA workspaces are enforced.
- Artifacts and event logs reconstruct the run.
- Failed verification prevents completion.

### Milestone 5: Release Gate and Operations

Includes Phases I, L, M, and N.

Exit criteria:

- Eval/replay can compare baseline and candidate runs from stored artifacts.
- CLI entrypoint exposes queue/run/smoke/eval flows.
- Security policy and redaction tests pass.
- README and docs reflect actual commands and current behavior.

## Verification Matrix

For every phase:

- Run `pnpm test`.
- Run `pnpm check`.
- Run affected smoke scripts.
- Confirm `git diff --check`.
- Update feature scenarios before production code when behavior changes.
- Update docs when contract, workflow, or command behavior changes.

Additional gates:

- Real Codex: `MCAS_RUN_REAL_CODEX=1 MCAS_CODEX_TIMEOUT_MS=180000 pnpm smoke:codex:real`.
- Claude Code real smoke: `MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real`.
- Kiro real smoke: `MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real`.
- Eval release gate: `pnpm eval:replay -- --artifacts <dir> --events <dir> --session <id> --tasks <ids> --reason <reason> --baseline <id> --candidate <id> --resource-profile-json <json>`.

## Risk Register

- Structured output schema drift: mitigated by strict schema tests and real smoke.
- CLI flag drift: mitigated by help smoke scripts and adapter docs.
- Model self-report false positives: mitigated by verifier provenance checks in Phase H.
- Workspace leakage or accidental writes: mitigated by materialized workspace policies and read-only smoke defaults.
- Queue state corruption: mitigated by persisted queue tests and lease recovery.
- Adapter divergence: mitigated by shared `RuntimeAdapter` conformance tests and shared evidence parser.
- Eval overreach into core routing: mitigated by plugin non-mutation tests.
- Secret leakage into artifacts: mitigated by Phase M redaction tests.

## Immediate Next Task

Continue Phase L with `run-task`.

First red test:

- Add CLI tests proving `run-task` reads a TaskSpec JSON file, runs the existing dry-run workflow, and prints artifact ids plus verifier status.

First implementation:

- Add `run-task` wiring that reuses the same runtime builder as `run-next` without touching queue state.
- Run `pnpm test`, `pnpm check`, and `git diff --check`.

## Handoff Guidance

Solo `$ralph` path:

- Use for Phase A, Phase B, Phase D, and Phase H because each phase touches shared contracts or lifecycle invariants and benefits from one owner maintaining consistency.

Parallel `$team` path:

- Use after Phase D when adapter lanes can split cleanly:
  - Lane 1: Codex production readiness.
  - Lane 2: Claude Code real adapter.
  - Lane 3: Kiro CLI real adapter.
  - Lane 4: Verifier/evidence hardening.
  - Lane 5: Eval/replay productionization.

Write-set rule:

- Adapter lanes must own separate adapter files and tests.
- Shared files such as `src/process-runner.js`, `src/evidence-parser.js`, `src/contracts.js`, and `schemas/evidence-package.schema.json` require a single integrating owner.
