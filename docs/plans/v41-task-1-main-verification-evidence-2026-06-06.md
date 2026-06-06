# v41 task-1 main verification evidence

Date: 2026-06-06
Goal: `v41-controlled-cli-provider-runner-backend-completion`
Task: `task-1`
Role: main-verifier
Thread: `019e9a48-9d8b-7af0-8b9e-eda6bfbc9152`
Branch: `v41-task-1-controlled-runner-contract-provider-allowlist`
Worktree: `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`
Reviewed worker evidence: `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`
Reviewed review evidence: `docs/plans/v41-task-1-review-evidence-2026-06-06.md`

## Verdict

Passed for task-1 main verification.

## Verification notes

The implementation defines `controlled-provider-runner.v1` as a contract, fixture, validator, tests, and product-contract documentation. It keeps active runner providers exactly to `claude-code-cli` and `codex-cli`, records Gemini, Kiro, and DeepSeek as inactive, and rejects arbitrary command text, shell fields, argv/args, cwd/path fields, env, credential fields, raw provider settings, raw provider output, and renderer-owned command templates.

The contract records provider CLI execution as available only through a backend controlled runner while leaving the task-2 execution adapter unimplemented. No provider CLI, release closeout, tag, push, publish, audit, doctor, mutation, or real provider command was run in this main verification phase.

## Commands run

- `pwd && rg --files -g 'AGENTS.md' -g 'docs/**' -g '*runbook*' -g '*controller*'` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: failed because `rg` is not installed; `pwd` returned the assigned worktree.
- `git status --short --branch && git rev-parse HEAD && git branch --show-current` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; branch `v41-task-1-controlled-runner-contract-provider-allowlist`, HEAD `5495261bc260fb16fc2a83e8b3dd1c921615a42c`.
- `find .. -name AGENTS.md -print` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; no repo `AGENTS.md` found.
- `find docs -maxdepth 3 \( -iname '*runbook*' -o -iname '*controller*' -o -path 'docs/plans/v41-task-1-*evidence-2026-06-06.md' \) -print` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `sed` reads of the v41 runbook, worker evidence, review evidence, implementation, fixture, tests, and product-contract docs from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `grep -R "controlled-provider-runner" -n . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.symphony` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `node --test tests/v41-controlled-provider-runner-contract.test.js` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; 9 tests passed, 0 failed.
- `git diff --check` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `pnpm check` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `pnpm test` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed; 1067 tests passed, 0 failed.
- `pnpm workbench:build` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: passed.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`: failed with exit code 64 and message `goal not found`. No goal init, event registration, or managed state mutation was attempted.

## Boundary checks

- Active provider ids are exactly `claude-code-cli` and `codex-cli`.
- `gemini-cli`, `kiro-cli`, and `deepseek` are not active runner providers.
- Runner input is limited to goal/task/role/provider/mode/prompt/evidence/run refs and rejects command, shell, args, cwd/path, env, credential, raw settings, and renderer template fields.
- Command template ids are backend-owned refs bound to provider id and role.
- Runner output is limited to sanitized fields and artifact refs; raw provider output is unavailable.
- Failure layers cover schema, provider availability, command execution, timeout, redaction, workspace, and expected-check failures.
- UI/backend boundaries still disable arbitrary shell execution, renderer provider invocation, model invocation from renderer, merge, push, tag, publish, and self-approval.

## Risk

The active goal is not registered in the local managed goal state used by `symphony goal-status`, which returned `goal not found`. The task contract and repository validation passed from the assigned worktree.

## Suggested event

```text
main.verification-passed
```

Evidence ref:

```text
docs/plans/v41-task-1-main-verification-evidence-2026-06-06.md
```
