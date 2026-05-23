# v11 Plan: Controlled Kernel Execution

## Summary

v11 turns `symphony do --write` into a controlled kernel execution flow. A write request first creates a frozen `symphony.execution-plan` artifact and a planned run state. The plan can later be executed with `symphony do --confirm-plan <plan-id>`.

The safety boundary is intentionally narrow: confirmed execution writes only inside a managed isolated workspace, never directly into the main worktree. The Workbench remains read-only and continues to expose commands as copy-only text.

## Behavior

- `symphony do --write "task"` returns `status: "planned"` and writes `.symphony/plans/<plan-id>.json`.
- `symphony do --write --real codex "task"` creates a gated plan with `externalCalls: true` and `requiresGate: "MCAS_RUN_REAL_CODEX"`.
- `symphony do --confirm-plan <plan-id>` loads the frozen plan and executes it through the existing kernel workflow.
- Confirmation accepts only `--confirm-plan`, `--state-dir`, and `--json`; extra prompt text or execution flags return usage failure.
- Confirmation rejects missing plans, malformed plan ids, unsupported plan contracts, stale project fingerprints, unsupported write boundaries, and missing real-agent gates before adapter start.

## Contract

Execution plans use `contractName: "symphony.execution-plan"` and `contractVersion: "1"`. They record the frozen prompt, route decision, project root and fingerprint, context artifact refs, workflow mode, adapter, execution mode, write boundary, confirmation command, and created timestamp.

Planned run states add `executionPlanId`, `executionPlanArtifactPath`, `writeBoundary: "isolated-workspace"`, `workspaceWrites: true`, and `mainWorktreeWrites: false`. Confirmed runs preserve the plan links and add normal evidence, Harness, task-packet, verifier, and changed-file refs.

## Verification

- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`
