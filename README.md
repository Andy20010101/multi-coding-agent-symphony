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
