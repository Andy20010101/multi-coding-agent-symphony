# v38 task-5 review evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-5`
Branch: `codex/v38-task-5-provider-hub-panel-evidence`
Reviewed commit: `6ed6432a7a3ef3d12dd33d4011bd1f5c079f2adb`
Reviewer actor: `codex-v38-task-5-reviewer`
Verdict: `approved`

## Review Scope

Reviewed task-5 diff from task-4 main-verified base `afaa644a6044d95679d4d59bdc794cf8b346a8f1` to `6ed6432a7a3ef3d12dd33d4011bd1f5c079f2adb`.

## Findings

No revision required.

## Boundary Checks

- `ProviderHubPanel` is additive Workbench/Desktop projection state over existing v38 provider and goal evidence contracts.
- The projection consumes `agent-cli-provider-health.v1`, `agent-cli-capability-profile.v1`, `agent-cli-lane-assignment-preview.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1` fields.
- Active provider ids remain limited to `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not promoted into active v38 provider instances or lane candidates.
- DeepSeek remains outside the task-5 active provider display and runner surface.
- Sanitized environment display exposes env names, presence booleans, and `valueAvailable=false`; secret values are not exposed.
- Evidence anchors display ledger evidence refs only; Workbench does not read evidence document bodies.
- Provider health, capability gates, blockers, lane separation, independent review state, and main-verifier lane fields are displayed as backend contract fields only.
- The Workbench and Desktop Shell UI do not add provider CLI execution, prompt dispatch, model invocation, generic shell execution, browser terminal, arbitrary local path access, merge, push, tag, publish, review approval inference, main-verification inference, release-ready declaration, or self-approval.
- The implementation does not replace canonical provider, goal event, goal progress, lane preview, or ArtifactStore contracts.

## Validation Reviewed

- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `1015` tests passed.
- `pnpm workbench:build`: exit `0`.
- `git diff --check`: exit `0`.
