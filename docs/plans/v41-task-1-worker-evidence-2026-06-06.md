# v41 task-1 worker evidence

Date: 2026-06-06
Goal: `v41-controlled-cli-provider-runner-backend-completion`
Task: `task-1`
Branch: `v41-task-1-controlled-runner-contract-provider-allowlist`
Worktree: `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`
Thread: `019e9a42-1fd9-7060-af80-a0084f6109e8`

## Summary

Implemented `controlled-provider-runner.v1` as the v41 task-1 backend contract for provider runner entry and exclusion rules.

The contract keeps active runner providers exactly to `claude-code-cli` and `codex-cli`, reuses v38 provider profile, health, and capability contracts as source context, and defines backend-owned command template ids for worker and reviewer lanes. It records allowed input fields, rejected shell/path/secret fields, sanitized output fields, failure layers, and the boundary that provider CLI execution is available only through a backend controlled runner.

Revision update: `validateControlledProviderRunnerContract` now rejects forbidden `runnerInput` properties when they appear as actual extra keys, not only when they are listed inside `runnerInput.acceptedFields`. The focused regression covers command text fields, `args`/`argv`, cwd/path fields, `env`, credential/secret fields, `rawProviderSettings`, and `rendererCommandTemplate`.

Revision validation from thread `019e9932-0855-7872-99bd-75a8ee56f657` rechecked the reviewer probe. A fixture mutated with `runnerInput.command`, `runnerInput.cwd`, `runnerInput.env`, and `runnerInput.rendererCommandTemplate` returned `ok: false` with backend-scoped runner input errors.

Revision update from thread `019e9a42-1fd9-7060-af80-a0084f6109e8` addresses the reviewer findings recorded in `docs/plans/v41-task-1-review-evidence-2026-06-06.md`. `validateControlledProviderRunnerContract` now rejects unexpected `runnerOutput` keys before raw output can be added, requires the exact runner input context fields `goalId`, `taskId`, `role`, `providerId`, `mode`, `promptRef`, and `runId`, and binds each command template id to its matching provider id and role. Regression tests cover all three reviewer probes.

Task-2 execution adapter behavior was not implemented. No raw `claude`, raw `codex`, Gemini, Kiro, DeepSeek, provider CLI, release, tag, push, audit, doctor, or mutation commands were run.

## Files changed

- `src/symphony/controlled-provider-runner-contract.js`
- `fixtures/contracts/controlled-provider-runner.v1.json`
- `tests/v41-controlled-provider-runner-contract.test.js`
- `docs/symphony-product-contracts.md`
- `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`

## Validation

- `node --test tests/v41-controlled-provider-runner-contract.test.js`: passed; 9 tests passed.
- Reviewer probe with `runnerInput.command`, `runnerInput.cwd`, `runnerInput.env`, and `runnerInput.rendererCommandTemplate`: returned `ok: false`; errors included backend-scoped rejections for each forbidden key.
- Reviewer probe with `runnerOutput.rawProviderOutput`: returned `ok: false`; error included `runnerOutput.rawProviderOutput is not an allowed field because runner output must be sanitized`.
- Reviewer probe with `runnerInput.requiredFields = ["goalId"]`: returned `ok: false`; error included `runnerInput.requiredFields must match goalId,mode,promptRef,providerId,role,runId,taskId`.
- Reviewer probe with mismatched `commandTemplates[0].templateId`/`providerId`: returned `ok: false`; error included `commandTemplates[0].providerId must be "claude-code-cli"`.
- `pnpm check`: passed.
- `pnpm test`: passed; 1067 tests passed, 0 failed.
- `pnpm workbench:build`: passed; Vite built `src/symphony/workbench-static/`.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json`: returned exit code 64 with `goal not found`. No goal init, event registration, or state mutation was attempted in this worker phase.

Commands run from `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist` in thread `019e9a42-1fd9-7060-af80-a0084f6109e8`:

- `node --test tests/v41-controlled-provider-runner-contract.test.js`
- `node --input-type=module` reviewer probe for unexpected `runnerOutput.rawProviderOutput`
- `node --input-type=module` reviewer probe for narrowed `runnerInput.requiredFields`
- `node --input-type=module` reviewer probe for mismatched command template provider binding
- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json`

## Provider boundary notes

- Active provider ids are exactly `claude-code-cli` and `codex-cli`.
- `gemini-cli`, `kiro-cli`, and `deepseek` are inactive and rejected as active provider drift.
- Runner input accepts only `goalId`, `taskId`, `role`, `providerId`, `mode`, `promptRef`, `evidenceRef`, and `runId`.
- The validator rejects command text, shell fields, args/argv, cwd/path fields, env, credential fields, raw provider settings, renderer command templates, and secret-looking values.
- Command templates are backend-owned refs with `commandTextAvailable: false`, `rendererConstructionAvailable: false`, `shellExpansionAvailable: false`, `arbitraryArgsAvailable: false`, and `arbitraryCwdAvailable: false`.
- Output is limited to sanitized fields and artifact refs; raw provider output remains unavailable.
- Failure layers are `schema`, `provider-availability`, `command-execution`, `timeout`, `redaction`, `workspace`, and `expected-check`.

## Suggested event

Worker evidence event:

```text
worker.evidence-recorded
```

Evidence ref:

```text
docs/plans/v41-task-1-worker-evidence-2026-06-06.md
```
