# Core Contracts

This document defines the stable objects shared across orchestrator modules and external plugins.

## TaskSpec

`TaskSpec` is the work item contract.

Required fields:

```json
{
  "id": "task-123",
  "source": "github|linear|manual",
  "repository": "owner/repo",
  "objective": "Fix the failing login redirect test",
  "acceptance": ["Tests pass", "No unrelated files changed"],
  "version": "1"
}
```

V1 optional metadata:

```json
{
  "constraints": ["Do not change public API"],
  "priority": "low|normal|high",
  "createdAt": "2026-05-13T00:00:00Z"
}
```

If optional metadata is present, it is validated. `constraints` must be a string array with non-empty entries, `priority` must be `low`, `normal`, or `high`, and `createdAt` must be a parseable timestamp.

## CommandSpec

`CommandSpec` is the semantic command contract. It must not encode CLI-specific flags.

Core commands:

- `plan`: produce an implementation plan and risk list.
- `implement`: modify code in one writer workspace.
- `review`: inspect diff, behavior, and tests without owning writes by default.
- `fix-ci`: inspect failing checks and apply a targeted fix.
- `qa`: verify behavior through tests, browser checks, static analysis, or manual evidence.

Required fields:

```json
{
  "name": "implement",
  "version": "1",
  "inputSchema": {},
  "allowedTools": ["read", "write", "shell", "test"],
  "workspacePolicy": "primary-writer",
  "doneCriteria": ["diff-created", "tests-run", "evidence-written"],
  "evidenceSchema": "implementation-evidence.v1"
}
```

## AdapterMapping

`AdapterMapping` translates a command into a concrete CLI run.

Required fields:

```json
{
  "adapter": "codex|claude-code|kiro-cli",
  "command": "implement",
  "commandVersion": "1",
  "modelProfile": "gpt-codex-default|deepseek-claude-code|claude-kiro-default",
  "configTemplate": "path-or-inline-template",
  "promptTemplate": "path-or-inline-template",
  "outputParser": "parser-id",
  "failureMapper": "mapper-id"
}
```

## ModelProfile

`ModelProfile` captures model behavior and limits.

Required fields:

```json
{
  "id": "gpt-codex-default",
  "provider": "openai|deepseek|anthropic",
  "model": "model-name",
  "contextTokens": 400000,
  "maxOutputTokens": 128000,
  "supportsStructuredOutput": true,
  "supportsVisionInput": true,
  "reasoningControls": ["low", "medium", "high", "xhigh"],
  "costClass": "low|medium|high",
  "retryPolicy": "standard-coding",
  "version": "1"
}
```

## EvidenceSchema

Evidence is a verifier-readable result package.

Minimum implementation evidence:

```json
{
  "command": "implement",
  "taskId": "task-123",
  "workspaceId": "ws-abc",
  "diffSummary": [],
  "changedFiles": [],
  "checks": [
    {
      "name": "pnpm test",
      "status": "passed",
      "output": "48 tests passed"
    }
  ],
  "knownRisks": [],
  "agentSummary": "",
  "version": "1"
}
```

`CheckEvidence` is the minimum verifier-readable check record inside `checks`.

Required fields:

```json
{
  "name": "pnpm test",
  "status": "passed|failed",
  "output": "Relevant command output, log summary, or artifact provenance"
}
```

`diffSummary` is required and may be empty. `checks` must contain at least one record for a verifier-valid evidence package. Raw or incomplete adapter output may still be stored as an artifact, but it is not a valid completion evidence package.

`agentSummary` is informational only. Verifier decisions must use `checks`, `changedFiles`, logs, and other structured evidence.

## SessionEvent

`SessionEvent` is append-only.

Event types:

- `task.created`
- `command.queued`
- `route.selected`
- `policy.decision`
- `adapter.started`
- `tool.observed`
- `artifact.written`
- `check.started`
- `check.finished`
- `failure.classified`
- `verifier.result`
- `command.finished`

Required fields:

```json
{
  "id": "evt-123",
  "sessionId": "sess-123",
  "type": "adapter.started",
  "timestamp": "2026-05-13T00:00:00Z",
  "actor": "orchestrator|adapter|verifier|policy",
  "payload": {},
  "version": "1"
}
```

## Failure Taxonomy

Initial categories:

- `build-failed`
- `test-failed`
- `lint-failed`
- `context-missing`
- `permission-denied`
- `adapter-crashed`
- `cli-timeout`
- `model-off-task`
- `verification-insufficient`
- `workspace-conflict`
- `infrastructure-failure`

Each failure should include `retryable`, `owner`, and `recommendedNextCommand`.

## ResourceProfile

`ResourceProfile` belongs primarily to eval and replay, but main execution should still record observed resources.

Fields:

```json
{
  "cpu": "4",
  "memoryMb": 8192,
  "timeoutSeconds": 3600,
  "concurrency": 1,
  "network": "enabled|disabled|restricted",
  "version": "1"
}
```
