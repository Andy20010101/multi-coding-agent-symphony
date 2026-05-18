# Multi Coding Agent Symphony

Multi Coding Agent Symphony is an orchestration layer for running multiple coding CLIs through stable task contracts.

The target CLIs are:

- Codex with GPT models.
- Claude Code connected to the DeepSeek API in the user's environment.
- Kiro CLI using Claude models.

The system should preserve each CLI's native harness instead of replacing it. The orchestrator owns task queueing, workspace isolation, routing, policy, verification, traces, and artifacts. Runtime adapters translate shared task contracts into the concrete CLI invocation, configuration, hooks, and output collection for each tool.

## Current Documents

- [Architecture](docs/architecture.md)
- [Core Contracts](docs/core-contracts.md)
- [Adapter Contract](docs/adapter-contract.md)
- [Module Plan](docs/module-plan.md)
- [BDD and TDD Workflow](docs/bdd-tdd-workflow.md)
- [Eval Replay Plugin](docs/eval-replay-plugin.md)
- [Real CLI Integration](docs/real-cli-integration.md)
- [Symphony Layer](docs/symphony-layer.md)
- [Operational Execution Order](docs/operational-execution-order.md)
- [Security Checklist](docs/security-checklist.md)
- [Release Checklist](docs/release-checklist.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Harness Symphony Integration](docs/harness-symphony-integration.md)
- [Post v2-beta Next Steps](docs/post-v2-alpha-next-steps.md)
- [Project Completion Plan](docs/plans/project-completion-plan-2026-05-13.md)
- [V1 to V2 Evolution Plan](docs/plans/v1-to-v2-evolution-plan-2026-05-14.md)
- [ADR 0001: Use BDD and TDD](docs/adr/0001-use-bdd-tdd.md)
- [ADR 0002: Harness Protocol Bridge](docs/adr/0002-integrate-harness-through-protocol-bridge.md)

## Current Status

Implemented:

- Contract validation for task, command, adapter, model, evidence, policy, and routing objects.
- Durable artifacts, session events, queue state, workspace allocation, and workflow run records.
- Real adapter paths for Codex, Claude Code, and Kiro CLI with opt-in model smokes.
- User-facing `pnpm mcas` commands for doctor, GitHub issue intake, manual queueing, task execution, smoke dispatch, and eval replay dispatch.
- V1.5 Harness Bridge dry-run execution across implemented TaskPacket modes, plus gated real CLI lanes from JSON TaskPackets into Symphony artifacts and Harness verification records.
- V2 ensemble flows for proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch, with verifier-readable role, lane, QA, and candidate evidence.
- Continuation turns and stall detection in `orchestrator.runCommand`, including retryable verifier failures, activity tracking, and `stall-timeout` records.
- Security gates for redaction, path/shell/network policy, and adapter-local permission mapping.
- External eval replay plugin flow for stored artifacts, including workflow-mode comparison reports for linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch evidence.

Current baseline: `pnpm test` covers 431 tests across 74 suites.

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
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Run the project CLI:

```sh
pnpm mcas doctor
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

`github issue` is read-only intake. It calls `gh issue view`, converts the response into a validated `TaskSpec`, and does not invoke a model.
`queue manual` writes a validated manual `TaskSpec` into a persistent `TaskQueue` state file without invoking adapters.
`run-next` leases the next queued task and runs the existing standard dry-run workflow, returning verifier status and artifact ids.
`run-task` runs a TaskSpec JSON file through the same dry-run workflow without reading or writing queue state.
`harness run-taskpacket` converts a Harness JSON TaskPacket into Symphony artifacts and Harness verification records. Supported `workflow.mode` values are `linear`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch`; add `--real --adapter <codex|claude|claude-code|kiro|kiro-cli>` plus the matching `MCAS_RUN_REAL_*` gate to select a real CLI lane.
`smoke <codex|claude|kiro>` dispatches the existing package smoke scripts and propagates their exit codes; add `--real` only when the underlying real smoke gate is intended.
`eval replay` dispatches the existing eval replay package script and passes through all remaining arguments. Add `--workflow-comparison-file <json>` or `--workflow-comparison-fixture workflow-comparison` to write a verifier-first comparison report artifact without invoking real CLIs.

Workflow commands also accept `--config mcas.config.json`. The config file can provide `runtime.stateFile`, `runtime.artifactDirectory`, `runtime.eventDirectory`, `runtime.workspaceDirectory`, and `runtime.sessionId`; explicit command flags take precedence.
