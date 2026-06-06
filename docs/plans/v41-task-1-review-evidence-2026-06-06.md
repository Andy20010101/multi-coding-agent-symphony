# v41 task-1 review evidence

Date: 2026-06-06
Goal: `v41-controlled-cli-provider-runner-backend-completion`
Task: `task-1`
Role: reviewer
Thread: `019e9a45-f1b1-71e2-9c2f-78a772480552`
Branch: `v41-task-1-controlled-runner-contract-provider-allowlist`
Worktree: `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`
Reviewed worker evidence: `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`

## Verdict

Approved.

## Review notes

No blocking findings.

The revision addresses the previous review gaps:

- `runnerOutput` rejects unexpected raw output fields before non-secret-looking raw transcripts can be accepted.
- `runnerInput.requiredFields` must match the exact goal/task/role/provider/mode/prompt/run context field set.
- Each command template id is bound to the matching provider id and role.

The contract remains scoped to task-1. It defines the backend runner contract, fixture, validator, focused tests, active provider allowlist, rejected provider/input/output boundaries, sanitized output shape, and failure layers. It does not implement the task-2 execution adapter or run provider CLIs.

## Commands run

- `pwd && rg --files -g 'AGENTS.md' -g 'docs/**' -g '*runbook*' -g '*controller*'` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: failed because `rg` is not installed; `pwd` returned the assigned worktree.
- `git status --short && git rev-parse --show-toplevel && git rev-parse HEAD && git branch --show-current` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; HEAD `5495261bc260fb16fc2a83e8b3dd1c921615a42c`, branch `v41-task-1-controlled-runner-contract-provider-allowlist`.
- `find .. -name AGENTS.md -print` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; no repo `AGENTS.md` found.
- `find docs -maxdepth 3 \( -iname '*runbook*' -o -iname '*controller*' -o -iname '*plan*' \) -print` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,260p' docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,280p' docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,220p' docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,220p' docs/plans/controller/subagent-result-format.md` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,220p' docs/plans/v41-task-1-worker-evidence-2026-06-06.md` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,620p' src/symphony/controlled-provider-runner-contract.js` and `sed -n '621,980p' src/symphony/controlled-provider-runner-contract.js` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,260p' tests/v41-controlled-provider-runner-contract.test.js` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed -n '1,620p' fixtures/contracts/controlled-provider-runner.v1.json` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `grep -R "controlled-provider-runner" -n . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `node --test tests/v41-controlled-provider-runner-contract.test.js` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; 9 tests passed, 0 failed.
- `git diff --check` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- Reviewer probe from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist` mutating `runnerOutput.rawProviderOutput`, `runnerInput.requiredFields`, and command template provider binding: passed; all three drifts returned `ok: false` with the expected validator errors.
- `pnpm check` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.

## Validation

- Worker evidence target reviewed: `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist/docs/plans/v41-task-1-worker-evidence-2026-06-06.md`.
- Focused contract test passed with 9 tests.
- `pnpm check` passed.
- `git diff --check` passed.
- Full `pnpm test` and `pnpm workbench:build` were not rerun in this reviewer phase to keep validation read-only. The worker evidence records both as passed.

## Risk

- The implementation files are still untracked in the assigned worktree. That is acceptable for this phase result but must be included before any merge or verification handoff.
