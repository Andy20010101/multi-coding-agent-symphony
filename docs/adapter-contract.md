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

Adapters may also expose `collectArtifacts(handle)` for non-evidence run material such as raw stdout, stderr, parsed events, and final-message files. The orchestrator writes those objects to `ArtifactStore` and links them from the command run record.

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
- Phase 3 dry-run mapping uses `codex exec --json --cd <workspace> --sandbox <mode>`, adds `--model <resolved-model>` when the profile does not resolve to config default, and supports optional `--output-schema <file>`; real runs set the default evidence schema and `--output-last-message`.
- Real execution is opt-in with `executionMode: "real"` and uses `NodeProcessRunner` to spawn `codex exec`; structured final output is parsed as `EvidencePackage`, while raw-only output remains verification-insufficient.
- `codex-config-default` is a special model profile that defers model selection to the local Codex CLI config instead of passing `--model`.
- Codex model profile IDs are resolved adapter-side before CLI execution: `gpt-codex-default` defaults to local Codex config, constructor-provided `modelProfileMappings` can map project profile IDs to concrete Codex `--model` names, and unmapped IDs remain direct CLI model names for smoke overrides.
- Codex prompts are rendered per command role, so `implement`, `review`, `qa`, `plan`, and `fix-ci` receive different instructions while preserving the same verifier-readable EvidencePackage requirement.
- Denied shell or network decisions force Codex to the strongest existing sandbox level, `read-only`; denied path, shell, and network decisions are also rendered into prompt-level policy restrictions.
- Codex exposes raw execution artifacts for stdout JSONL, stderr, parsed JSONL events, and final message capture; the orchestrator stores them as artifacts and links them from the command run record.
- Codex structured error events map into the shared failure taxonomy: permission errors become `permission-denied`, off-task errors become `model-off-task`, and unknown structured errors become `adapter-crashed`.

Claude Code:

- Native surfaces include settings, permission rules, hooks, MCP, memory files, slash commands, and resumable sessions.
- In this project it may point at DeepSeek-compatible API wiring, so adapter tests must verify model/provider behavior instead of assuming Anthropic defaults.
- Phase 3 dry-run mapping uses `claude -p --output-format stream-json --add-dir <workspace> --model <profile>` with permission flags and `--json-schema` for the shared `EvidencePackage`.
- Denied paths map to `Read(<rule>)`; denied shell maps to `Bash`; denied network maps to `WebFetch` and `WebSearch` through `--disallowedTools`.
- Real execution uses an injected `NodeProcessRunner` to spawn `claude -p --output-format stream-json`, require JSON EvidencePackage stdout, parse stream JSON for structured evidence, and preserve raw stdout/stderr as verification-insufficient evidence when structure is missing.

Kiro CLI:

- Native surfaces include custom agents, MCP, hooks, steering files, spec-driven workflows, and headless automation.
- Good fit for spec-heavy planning, requirements, and acceptance-criteria workflows.
- Phase 3 dry-run mapping uses `kiro-cli chat --no-interactive --trust-tools=<categories>` and optional `--require-mcp-startup`.
- Policy deny overrides are applied adapter-side; denied path requests remove `read` and `grep`, while denied shell or network requests remove unsafe trusted categories such as `bash`.
- Real execution uses an injected `NodeProcessRunner` to spawn `kiro-cli chat --no-interactive`, parse stdout for structured EvidencePackage content, and preserve raw stdout/stderr as verification-insufficient evidence when structure is missing.

## Phase 3 Source Notes

Command mappings are based on:

- OpenAI Codex CLI command line options and non-interactive mode docs.
- Local `codex exec --help` for installed `codex-cli 0.130.0`.
- Claude Code CLI reference and local `claude --help` for installed Claude Code `2.1.123`.
- Kiro CLI headless and CLI command reference plus local `kiro-cli 2.2.2`.

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
