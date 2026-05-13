# Real CLI Integration

Real CLI execution is opt-in. Normal tests use injected fake runners and do not call model APIs.

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

## Remaining CLI Work

- Repeat the real process-runner pattern for Claude Code.
- Repeat the real process-runner pattern for Kiro CLI.
