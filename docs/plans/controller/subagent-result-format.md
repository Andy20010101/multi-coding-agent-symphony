# Subagent Result Format

Every subagent must end with this block. The controller should treat missing fields as incomplete evidence.

```text
goalId:
taskId:
role:
threadId:
branch:
worktree:
baseCommit:
headCommit:
status:
eventToRegister:
evidenceRef:
filesChanged:
commandsRun:
validation:
risks:
blockers:
nextSuggestedAction:
```

## Field Rules

`goalId` must be the active goal id.

`taskId` must match a task in the runbook.

`role` must be one of:

```text
worker
reviewer
main-verifier
release-manager
controller
```

`status` must be one of:

```text
completed
needs-revision
blocked
dispatched
not-started
```

`eventToRegister` should be one of the runbook-supported events, for example:

```text
worker.evidence-recorded
reviewer.approved
reviewer.needs-revision
main.verification-passed
main.verification-failed
release.gate-passed
release.ready-declared
```

`evidenceRef` must be a repo-relative path when evidence was written. Do not use chat-only evidence as the final source of truth.

`commandsRun` must include exact commands and pass/fail status. If a command was not run, say `not run` with the reason.

`risks` should include scope drift, skipped validation, dirty worktree, missing evidence, or release gate mismatch.

## v38 Subagent Boundary

For v38, subagents must not:

- run Claude Code CLI or Codex CLI as real providers;
- send prompts to model CLIs;
- implement a generic shell runner;
- expose API keys, OAuth tokens, credential file contents, or raw provider settings;
- add Gemini, Kiro, or DeepSeek as active v38 providers.
