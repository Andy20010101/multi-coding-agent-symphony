# Architecture

## Goal

Build a durable orchestrator for coding agents that can evolve as models, CLI tools, and harness assumptions change.

The system should support these independent upgrade paths:

- Model upgrade: update `ModelProfile`.
- CLI behavior change: update `RuntimeAdapter` and `AdapterMapping`.
- Harness refactor: update orchestrator modules without changing task semantics.
- Evaluation workflow change: update the external eval plugin without slowing the main execution path.

## Layer Model

```text
Tracker
  -> TaskSpec
  -> Orchestrator
  -> CommandSpec
  -> Router/Scheduler
  -> RuntimeAdapter
  -> CLI Harness
  -> Workspace/Sandbox
  -> Verifier
  -> Evidence
  -> Artifact Store + Session Event Log
```

## Core Boundaries

`TaskSpec` describes the user-facing work item: source, objective, constraints, repository, branch policy, deadline, and acceptance criteria.

`CommandSpec` describes the semantic command contract: what must be done, what tools are allowed, how workspaces are assigned, what evidence is required, and what counts as done.

`AdapterMapping` describes how a `CommandSpec` is executed by a concrete CLI such as Codex, Claude Code, or Kiro CLI.

`ModelProfile` describes model-specific limits and behavior: context window, output limits, reasoning controls, structured output support, retry strategy, cost class, known strengths, and known failure modes.

`Verifier` decides whether the result is trustworthy. It consumes tests, diffs, logs, browser evidence, CI status, and review findings.

## Main Execution Flow

Current user-facing CLI entrypoint: `scripts/mcas.js`. Current dry-run orchestration entrypoint: `src/orchestrator.js`.

1. Intake creates a `TaskSpec` from GitHub, Linear, a manual request, or another tracker.
2. Orchestrator selects one `CommandSpec`, such as `implement` or `review`.
3. Router picks a CLI adapter and model profile from capabilities, policy, cost, and history.
4. Context Builder compiles a small context pack from artifacts, repo metadata, and session events.
5. Runtime Adapter starts the native CLI with the correct workspace, config, hooks, and prompt wrapper.
6. Session Event Log records every durable event.
7. Artifact Store saves inputs, diffs, logs, evidence, and final outputs.
8. Verifier checks the evidence and returns pass, fail, or needs-followup.
9. Failure Taxonomy classifies failures for retry, routing, and future evals.

## Durable State

The session is not the model context window. The session is an append-only event log outside any CLI context. A future run can reconstruct what happened without relying on a preserved chat window.

The context window should be rebuilt each run by `ContextBuilder`, using selective slices of the session log and artifacts.

## Internal vs External Modules

Core harness modules:

- Task Queue
- Capability Registry
- Artifact Store
- Session Event Log
- Failure Taxonomy
- Policy Engine
- Router/Scheduler
- Context Builder
- Runtime Adapters
- Verifier

External plugin:

- Eval/Replay

Deferred module:

- Migration Layer

Early versions should use explicit `version` fields and compatibility checks before building a full migration subsystem.
