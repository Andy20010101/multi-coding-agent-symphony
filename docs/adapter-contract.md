# Adapter Contract

Runtime adapters preserve native CLI behavior while presenting a common orchestrator interface.

## Adapter Interface

Required methods:

```ts
interface RuntimeAdapter {
  probe(): Promise<CapabilityReport>;
  prepare(input: PrepareInput): Promise<PreparedRun>;
  start(input: StartInput): Promise<RunHandle>;
  streamEvents(handle: RunHandle): AsyncIterable<AdapterEvent>;
  cancel(handle: RunHandle): Promise<CancelResult>;
  resume(input: ResumeInput): Promise<RunHandle>;
  collectEvidence(handle: RunHandle): Promise<EvidencePackage>;
  normalizeFailure(error: unknown): FailureClassification;
  cleanup(handle: RunHandle): Promise<void>;
}
```

## Capability Report

Each adapter must report:

- CLI name and version.
- Supported commands.
- Supported model profiles.
- Interactive and non-interactive execution support.
- Session resume support.
- Cancellation support.
- Hook support.
- MCP support.
- Structured output support.
- Workspace isolation requirements.
- Log locations and parsing strategy.

## Adapter Mapping Rules

The adapter may transform:

- `CommandSpec` into CLI flags, config files, slash commands, hooks, or prompt wrappers.
- `PolicyDecision` into CLI permissions, allowlists, denylists, approval modes, or hook blockers.
- `ContextPack` into native instruction files such as `AGENTS.md`, `CLAUDE.md`, Kiro steering files, or temporary run prompts.

The adapter must not change:

- `TaskSpec.objective`
- `CommandSpec.doneCriteria`
- `EvidenceSchema`
- workspace ownership rules
- policy decisions

## Initial Adapter Notes

Codex:

- Native surfaces include CLI, non-interactive mode, config, hooks, MCP, skills, subagents, and app-server style automation.
- Good fit for GPT coding models and structured local verification loops.

Claude Code:

- Native surfaces include settings, permission rules, hooks, MCP, memory files, slash commands, and resumable sessions.
- In this project it may point at DeepSeek-compatible API wiring, so adapter tests must verify model/provider behavior instead of assuming Anthropic defaults.

Kiro CLI:

- Native surfaces include custom agents, MCP, hooks, steering files, spec-driven workflows, and headless automation.
- Good fit for spec-heavy planning, requirements, and acceptance-criteria workflows.

## Conformance Tests

Every adapter must pass these tests before production routing:

1. `probe` returns stable capabilities.
2. Non-interactive `plan` can complete and produce evidence.
3. Non-interactive `implement` can modify only its assigned workspace.
4. Cancellation stops the CLI and records a terminal event.
5. Resume can continue or explicitly report unsupported.
6. Permission deny rules block a forbidden file read.
7. Logs are collected and linked in Artifact Store.
8. Failure codes map into Failure Taxonomy.
9. Evidence validates against the requested schema.

