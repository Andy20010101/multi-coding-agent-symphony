# v38 task-3 review evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-3`
Branch: `codex/v38-task-3-capability-profile-mapping`
Reviewed commit: `680e8b2f34feefbda22202753abc3d3b2bc63979`
Reviewer actor: `codex-v38-task-3-reviewer`
Verdict: `approved`

## Review Scope

Reviewed task-3 diff from task-2 main-verified base `e26a8a9872e0031b371571a0b47a9a6affd54cc1` to `680e8b2f34feefbda22202753abc3d3b2bc63979`.

## Findings

No revision required.

## Boundary Checks

- `agent-cli-capability-profile.v1` maps `repo.write`, `model.invoke`, `test.run`, and `git.change` to provider/tool gates.
- Active provider ids remain limited to `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek remain inactive/non-active for v38.
- `model.invoke` maps to disabled provider CLI/model invocation gates.
- `test.run` maps to copy-only validation commands.
- `goal.event.append` maps to dry-run plus plan-hash confirmation.
- The new route is `GET /api/providers/capabilities`; non-GET and query probes are rejected.
- The new CLI command is `symphony providers capabilities --json`; it writes no repository state.
- The Workbench change adds only a read-only route registry entry and route allowlist updates.
- The implementation does not add provider CLI execution, provider capability probes, prompt dispatch, model invocation, generic shell execution, repo writes, merge, push, tag, publish, task-4 lane preview, or task-5 Provider Hub panel.

## Validation Reviewed

- `node --test tests/v38-agent-cli-capability-profile.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`: exit `0`; `90` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `1008` tests passed.
- `pnpm workbench:build`: exit `0`.
- `git diff --check`: exit `0`.
