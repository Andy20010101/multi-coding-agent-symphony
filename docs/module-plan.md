# Module Plan

This plan orders modules so implementation can start small and stay testable.

## Phase 0: Documentation Baseline

Artifacts:

- `README.md`
- `docs/architecture.md`
- `docs/core-contracts.md`
- `docs/adapter-contract.md`
- `docs/eval-replay-plugin.md`

Exit criteria:

- Core boundaries are written.
- V1 scope is explicit.
- Command semantics are separated from CLI execution.

## Phase 1: Contracts and Storage

Modules:

- `contracts`
- `artifact-store`
- `session-event-log`
- `failure-taxonomy`

Why first:

- Every other module reads or writes these objects.
- Eval and replay require durable artifacts from the beginning.

Suggested tests:

- Schema validation.
- Append-only event ordering.
- Artifact write/read integrity.
- Failure classification serialization.

BDD/TDD starting scenarios:

- A valid `TaskSpec` can be parsed and validated.
- Invalid command evidence is rejected with a typed failure.
- Session events are append-only and preserve timestamp order.
- Artifact retrieval is independent of the adapter that wrote the artifact.

## Phase 2: Policy and Context

Modules:

- `policy-engine`
- `capability-registry`
- `context-builder`

Why second:

- Adapters need policy decisions and context packs before they can safely run.
- Router needs capability data before assigning tasks.

Suggested tests:

- Deny sensitive files.
- Allow known safe test commands.
- Build context pack from TaskSpec plus selected session events.
- Verify capability reports are stored and queryable.

## Phase 3: Runtime Adapters

Modules:

- `adapter-codex`
- `adapter-claude-code`
- `adapter-kiro-cli`

Initial implementation order:

1. Codex adapter.
2. One of Claude Code or Kiro CLI.
3. The remaining adapter after contract tests stabilize.

Suggested tests:

- Adapter conformance test suite.
- Dry-run invocation rendering.
- Log parsing fixtures.
- Failure normalization fixtures.

## Phase 4: Routing and Verification

Modules:

- `router-scheduler`
- `workspace-manager`
- `verifier`

Why after adapters:

- Router choices need real adapter capabilities.
- Verifier needs real evidence formats from adapter runs.

Suggested tests:

- Single-writer lock enforcement.
- Multi-review workspace isolation.
- Retry on retryable adapter failure.
- Reject unverified model self-report.

## Phase 5: External Eval Plugin

Module:

- `eval-replay-plugin`

Why external:

- It is heavy and event-triggered.
- It should run only for model upgrades, adapter changes, harness refactors, anomaly investigation, or release gates.

Suggested tests:

- Replay from stored artifacts.
- Compare model profiles on the same task sample.
- Report resource profile and infra variance.
- Emit recommendations without mutating core configuration.

## Deferred: Migration Layer

Start with `version` fields and compatibility checks.

Create a migration module only when at least two live schema versions must coexist for `CommandSpec`, `ModelProfile`, or `EvidenceSchema`.
