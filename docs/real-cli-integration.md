# Real CLI Integration

Real CLI execution is opt-in. Normal tests use injected fake runners and do not call model APIs.

## MCAS CLI

`pnpm mcas` exposes the current user-facing entrypoint. It supports:

- `doctor`
- `github issue --repo OWNER/REPO --number N`
- `queue manual ...`
- `run-next ...`
- `run-task --task-file task.json ...`
- `smoke <codex|claude|kiro> [--real]`
- `eval replay -- ...`

Workflow commands accept `--config <file>`, where `runtime.stateFile`, `runtime.artifactDirectory`, `runtime.eventDirectory`, `runtime.workspaceDirectory`, and `runtime.sessionId` provide defaults. Explicit CLI flags override config values.

## Codex

Implemented:

- `CodexAdapter.start({ executionMode: "real" })` spawns `codex exec`.
- The prompt is sent on stdin.
- Real runs pass `--output-schema schemas/evidence-package.schema.json`.
- Real runs pass `--output-last-message` and capture the final Codex message from a temp file.
- The schema is strict structured-output compatible: object schemas use `additionalProperties: false`.
- `--json` output is parsed as JSONL and streamed as `tool.observed` adapter events.
- stdout and stderr are preserved in evidence.
- A final JSON `EvidencePackage` is normalized with harness-owned `command`, `taskId`, and `workspaceId` metadata before verification.
- If no valid structured evidence is found, raw Codex output is marked with `real-cli-output-unverified` and contains no passing checks.
- Timeout results are normalized to `cli-timeout`.
- Active real runs can be cancelled through the adapter lifecycle and preserve partial output as cancelled evidence.
- Timed out process runs send `SIGTERM`, then escalate to `SIGKILL` after the configured grace period.
- Model profile IDs are resolved before CLI execution: `gpt-codex-default` and `codex-config-default` defer to local Codex config, `modelProfileMappings` can map project IDs to concrete Codex `--model` names, and unmapped IDs are treated as direct CLI model names.
- Prompts are rendered per command role for `plan`, `implement`, `review`, `fix-ci`, and `qa` while retaining the structured EvidencePackage requirement.
- Raw stdout JSONL, stderr, parsed JSONL events, and final-message content are written as linked adapter artifacts when the orchestrator runs Codex.
- Structured Codex error events are normalized to `permission-denied`, `model-off-task`, or `adapter-crashed` failure categories.
- Codex sandbox flags preserve workspace policy: read-only smoke and review commands use `read-only`; writer smoke uses `workspace-write`.
- `Orchestrator.runCommand({ executionMode: "real" })` passes real execution mode and timeout settings through to the adapter.

Local binary smoke check:

```sh
pnpm smoke:codex:help
```

This checks the installed Codex CLI help path and does not invoke a model.

Guarded real model smoke check:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real
```

This invokes the configured Codex model in read-only mode, captures the final message through `--output-last-message`, parses `EvidencePackage`, and requires verifier status `passed`. Set `MCAS_CODEX_MODEL=<model>` to override the Codex CLI config model; when unset, the smoke uses the CLI config default and does not pass `--model`.

Guarded real writer smoke check:

```sh
MCAS_RUN_REAL_CODEX_WRITER=1 pnpm smoke:codex:writer
```

This invokes Codex in `implement` mode with `workspacePolicy: "primary-writer"`. When no workspace is supplied programmatically, it creates an isolated temporary git workspace and asks Codex to create `codex-writer-smoke.txt`, then requires verifier status `passed`. Set `MCAS_CODEX_WRITER_MODEL=<model>` to override only the writer smoke model.

## Claude Code

Implemented:

- `ClaudeCodeAdapter.start({ executionMode: "real" })` spawns `claude -p --output-format stream-json` through an injected `NodeProcessRunner`.
- The prompt is sent on stdin.
- Stream JSON stdout is parsed for structured `EvidencePackage` content.
- If no valid structured evidence is found, raw Claude Code output is marked with `real-cli-output-unverified` and contains no passing checks.

Local binary smoke check:

```sh
pnpm smoke:claude:help
```

Local `claude --help` on 2026-05-13 confirms support for `-p/--print`, `--output-format stream-json`, `--add-dir`, `--model`, `--permission-mode`, `--disallowedTools`, and `--json-schema`.

Guarded real model smoke check:

```sh
MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real
```

This invokes the configured Claude Code model in read-only mode, parses stream JSON for `EvidencePackage`, and requires verifier status `passed`. Set `MCAS_CLAUDE_MODEL=<model>` to override the default `deepseek-claude-code` profile.

## Remaining CLI Work

## Kiro CLI

Implemented:

- `KiroCliAdapter.start({ executionMode: "real" })` spawns `kiro-cli chat --no-interactive` through an injected `NodeProcessRunner`.
- The prompt is sent on stdin.
- stdout is parsed for structured `EvidencePackage` content.
- If no valid structured evidence is found, raw Kiro output is marked with `real-cli-output-unverified` and contains no passing checks.
- Policy deny overrides remove unsafe trusted tool categories, such as `bash` for denied shell or network requests, before `--trust-tools` is rendered.

Local binary smoke check:

```sh
pnpm smoke:kiro:help
```

Local `kiro-cli --help` and `kiro-cli chat --help` on 2026-05-13 confirm support for `chat`, `--no-interactive`, `--trust-tools`, `--model`, and `--require-mcp-startup`.

Guarded real model smoke check:

```sh
MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real
```

This invokes the configured Kiro CLI model in read-only mode with trusted read tools only, parses stdout for `EvidencePackage`, and requires verifier status `passed`. Set `MCAS_KIRO_MODEL=<model>` to override the default `claude-kiro-default` profile.

## Remaining CLI Work

- No adapter-specific Phase G work remains; verifier, eval, CLI entrypoint, and operations gates are tracked in `docs/plans/project-completion-plan-2026-05-13.md`.
