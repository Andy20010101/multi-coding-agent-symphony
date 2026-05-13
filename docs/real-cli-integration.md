# Real CLI Integration

Real CLI execution is opt-in. Normal tests use injected fake runners and do not call model APIs.

## Codex

Implemented:

- `CodexAdapter.start({ executionMode: "real" })` spawns `codex exec`.
- The prompt is sent on stdin.
- Real runs pass `--output-schema schemas/evidence-package.schema.json`.
- Real runs pass `--output-last-message` and capture the final Codex message from a temp file.
- `--json` output is parsed as JSONL and streamed as `tool.observed` adapter events.
- stdout and stderr are preserved in evidence.
- A final JSON `EvidencePackage` is normalized with harness-owned `command`, `taskId`, and `workspaceId` metadata before verification.
- If no valid structured evidence is found, raw Codex output is marked with `real-cli-output-unverified` and contains no passing checks.
- Timeout results are normalized to `cli-timeout`.
- `Orchestrator.runCommand({ executionMode: "real" })` passes real execution mode and timeout settings through to the adapter.

Local binary smoke check:

```sh
pnpm smoke:codex:help
```

This checks the installed Codex CLI help path and does not invoke a model.

## Remaining CLI Work

- Add a guarded manual smoke path that invokes a cheap read-only Codex prompt.
- Wire real cancellation for an active child process.
- Repeat the real process-runner pattern for Claude Code.
- Repeat the real process-runner pattern for Kiro CLI.
