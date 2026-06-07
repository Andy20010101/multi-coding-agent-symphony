# v43 Planning PR Brief

Date: 2026-06-07
Branch: `codex/v43-planning`
Suggested PR title: `Formalize v43 goal supervisor stabilization planning pack`

## Scope

This PR turns v43 planning into a tracked repository entry point. It adds the v43 plan, execution prompts, formal runbook pack, controlled fixture, replay/test matrix, and evidence skeletons.

This PR does not implement v43 product code. It does not reopen released v42 scope. It does not expand the provider boundary beyond `claude-code-cli` and `codex-cli`. It does not add raw provider CLI execution, a generic shell runner, release closeout, tagging, or publishing.

## Files in this PR

- `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/app-core-v43-goal-runbooks/README_HOW_TO_START.md`
- `fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`

## Validation on branch

Use these as the minimum PR-side validation checks:

| Command | Expected result |
| --- | --- |
| `node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates }));"` | Returns `ok: true` for the v43 fixture. |
| `pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json --goal v43-goal-supervisor-stabilization --dry-run --json` | Returns valid `goal-runbook-init-plan.v1` dry-run output with no validation errors. |
| `git diff --check` | Returns no whitespace diagnostics. |

## Review focus

Reviewers should focus on these points:

1. v43 now starts from tracked v42 repository files, not from missing fixture refs or untracked `.symphony` state alone.
2. The v43 planning pack is explicit about scope: stabilization only, no v42 reopen, no provider allowlist expansion, no raw provider CLI path.
3. The v43 fixture explicitly inherits the scoped closeout gate set already used in v37-v42: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and docs-updated evidence.
4. The replay/test matrix and evidence skeletons align with `task-1` through `task-4` and give reviewers concrete acceptance surfaces instead of leaving coverage implicit.
5. The runbook pack is formalized under `docs/plans/app-core-v43-goal-runbooks/` and no longer relies on a `-draft` filename as the canonical entry point.

## Merge conditions

Merge this PR only when all of these are still true:

1. `main` is still compatible with the reconciled v42 historical baseline. If `main` moves materially, fast-forward/rebase this branch and rerun the fixture validation plus `goal init --dry-run`.
2. The diff stays limited to v43 planning assets and the v43 runbook fixture. No product code, no release evidence edits, no tag movement, and no unrelated planning churn.
3. Review confirms this PR is planning-only. It must not claim v43 implementation started, main verification passed, or v43 release completed.
4. The provider boundary remains unchanged: active providers are still only `claude-code-cli` and `codex-cli`, and no raw provider CLI or generic shell path is introduced.
5. Scoped closeout rules remain unchanged unless a follow-up planning change intentionally updates the v43 fixture, runbook, execution prompts, and checklist references together.

## Copy-ready PR body

```md
## Summary

Formalize the tracked planning pack for `v43-goal-supervisor-stabilization`.

This PR adds the v43 plan, execution prompts, formal runbook pack, controlled runbook fixture, replay/test matrix, and evidence skeletons. It uses the reconciled tracked v42 files as the historical baseline and keeps the scope planning-only.

## What this PR adds

- v43 plan
- v43 execution prompts
- v43 runbook pack under `docs/plans/app-core-v43-goal-runbooks/`
- v43 controlled goal-runbook fixture
- v43 replay/test matrix
- v43 worker/reviewer/main-verification evidence skeletons

## What this PR does not do

- no v43 product implementation
- no v42 scope reopen
- no provider allowlist expansion
- no raw provider CLI path
- no generic shell runner
- no release closeout, tag, or publish work

## Validation

- fixture contract validation passes
- `symphony goal init --from-json ... --dry-run --json` passes
- `git diff --check` passes

## Review focus

1. Historical baseline references point to tracked v42 files.
2. The scope remains stabilization-only.
3. The scoped closeout gate set remains the inherited v37-v42 set.
4. Replay/test matrix and evidence skeletons match task-1 through task-4.
5. Canonical v43 runbook entry point is the formal `goal_runbook_latest` file, not the old draft path.

## Merge conditions

- merge only if the branch is still aligned to current `main`
- merge only if validation still passes on PR HEAD
- merge only if the diff remains planning-only
- merge only if provider and release boundaries remain unchanged
```
