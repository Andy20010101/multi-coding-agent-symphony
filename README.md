# Multi Coding Agent Symphony

Multi Coding Agent Symphony is a planned orchestration layer for running multiple coding CLIs through stable task contracts.

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
- [Project Completion Plan](docs/plans/project-completion-plan-2026-05-13.md)
- [ADR 0001: Use BDD and TDD](docs/adr/0001-use-bdd-tdd.md)

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
pnpm test
pnpm check
pnpm smoke:codex:help
```

Run the project CLI:

```sh
pnpm mcas doctor
pnpm mcas github issue --repo OWNER/REPO --number 123
pnpm mcas queue manual --state-file .mcas/queue.json --id task-1 --repo OWNER/REPO --objective "Do the work" --acceptance "Verifier evidence is written"
pnpm mcas run-next --state-file .mcas/queue.json --runtime-dir .mcas
pnpm mcas run-task --task-file task.json --runtime-dir .mcas
pnpm mcas smoke codex
pnpm mcas eval replay -- --artifacts tmp/artifacts --events tmp/events --reason model-upgrade
```

`github issue` is read-only intake. It calls `gh issue view`, converts the response into a validated `TaskSpec`, and does not invoke a model.
`queue manual` writes a validated manual `TaskSpec` into a persistent `TaskQueue` state file without invoking adapters.
`run-next` leases the next queued task and runs the existing standard dry-run workflow, returning verifier status and artifact ids.
`run-task` runs a TaskSpec JSON file through the same dry-run workflow without reading or writing queue state.
`smoke <codex|claude|kiro>` dispatches the existing package smoke scripts and propagates their exit codes; add `--real` only when the underlying real smoke gate is intended.
`eval replay` dispatches the existing eval replay package script and passes through all remaining arguments.

Workflow commands also accept `--config mcas.config.json`. The config file can provide `runtime.stateFile`, `runtime.artifactDirectory`, `runtime.eventDirectory`, `runtime.workspaceDirectory`, and `runtime.sessionId`; explicit command flags take precedence.
