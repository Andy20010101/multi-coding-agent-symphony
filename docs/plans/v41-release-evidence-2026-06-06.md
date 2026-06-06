# v41 release gate evidence

Date: 2026-06-06

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Role: `release-manager`

Thread: `019e9af9-ad4f-71b1-a9f1-6675ff4b7653`

Branch: `codex/v41-bootstrap`

Worktree: `/Users/andy/Documents/project/multi-coding-agent-symphony`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit during gate run: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Final release commit: recorded by the `v41` tag peeled commit after tag creation.

## Scope

This was the scoped v41 release gate pass defined by `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`.

Scoped release gates in scope:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Mutation, audit, doctor, tag, push, publish, GitHub Release, raw provider CLI, Kiro, Gemini, DeepSeek, and arbitrary shell provider evidence were not part of the scoped v41 closeout. After the scoped closeout passed, the operator asked for v41 repository release work, so the repository tag/full release local validation also ran the release checklist commands that are outside the scoped v41 runbook.

## Applied verified changes

The release checkout started on `codex/v41-bootstrap` with only this unrelated untracked file present:

- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

That file was not included in v41.

Verified working-tree changes were applied from:

- `/Users/andy/.codex/worktrees/v41-task-1-controlled-runner-contract-provider-allowlist`
- `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`

The applied v41 set includes task-1 contract/evidence, task-2 through task-5 backend and Workbench implementation/evidence, the generated Workbench static bundle, and focused tests. The task-5 provider evidence remains timeout evidence from the backend-controlled runner for `claude-code-cli` and `codex-cli`; it is not described as successful provider CLI completion.

## Evidence refs checked

- `docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`
- `docs/release-checklist.md`
- `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-1-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-1-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-main-verification-evidence-2026-06-06.md`

## Gate commands

Commands run from `/Users/andy/Documents/project/multi-coding-agent-symphony`.

| Command | Result |
| --- | --- |
| `pnpm check` | Pass. Node syntax check completed. |
| `pnpm test` | Pass. 1085 tests, 169 suites, 1085 pass, 0 fail, duration 8606.117166 ms. |
| `pnpm workbench:build` | Pass. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CILC3208.css`, and `src/symphony/workbench-static/assets/index-3PVjv4nj.js`. |
| `git diff --check` | Pass. No whitespace diagnostics. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` | Pass. Returned `goal-progress-ledger.v1`; 5 tasks, 5 completed, 0 blocked, releaseReady false before external event registration. |
| `pnpm --silent symphony goal closeout --goal v41-controlled-cli-provider-runner-backend-completion --markdown` | Pass. Worker, review, and main verification evidence complete; release gate gaps remained unknown before this release evidence file was written. |
| `pnpm --silent symphony goal gate --goal v41-controlled-cli-provider-runner-backend-completion --gate release.ready --status declared --verifier local-goal-supervisor-release-manager --evidence-ref docs/plans/v41-release-evidence-2026-06-06.md --confirm --plan-hash sha256:68d755b0f4899e34542daafe11e403f32cf386a0f1824f95c485a1584fffe4dd` | Pass. Appended `release.ready-declared` event `evt_ecbb99bc738dea38`. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` | Pass after event registration. Returned `releaseReady: true` with source `goal-event-log.v1:evt_ecbb99bc738dea38`. |
| `pnpm --silent symphony goal closeout --goal v41-controlled-cli-provider-runner-backend-completion --markdown` | Pass after event registration. Missing evidence: none. Release gate gaps: none. |
| `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v41-controlled-cli-provider-runner-backend-completion` | Pass. Local supervisor plan status was `complete`; daemon stopped after recent progress with no active thread. |

## Repository tag/full release validation

Commands run from `/Users/andy/Documents/project/multi-coding-agent-symphony` after the scoped closeout reached `release.ready`.

| Command | Result |
| --- | --- |
| `pnpm check` | Pass. Node syntax check completed. |
| `pnpm audit --audit-level high` | Pass. Reported 1 moderate vulnerability and no high or critical vulnerability. |
| `pnpm mcas doctor` | Pass. Returned `status: ok`. |
| `pnpm test` | Pass. 1085 tests, 169 suites, 1085 pass, 0 fail, duration 7993.998542 ms. |
| `pnpm workbench:build` | Pass. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CILC3208.css`, and `src/symphony/workbench-static/assets/index-3PVjv4nj.js`. |
| `pnpm test:mutation:gate` | Pass. Stryker final mutation score 74.22, break threshold 60, 1761 killed, 7 timeout, 488 survived, 126 no coverage, 0 errors, duration 65 minutes 59 seconds. |
| `git diff --check` | Pass. No whitespace diagnostics after full release validation. |

## Release decision

The scoped v41 release gates passed in the assigned checkout after the verified task changes were applied. The external runner recorded all required release gate events and declared `release.ready` through append-only event `evt_ecbb99bc738dea38`.

## Risks

Both active provider attempts in task-5 are backend-controlled timeout evidence, not successful real provider completions. The runbook permits explicit failed provider execution evidence for task-5, but downstream release notes should keep that distinction.

The release checkout still contains the unrelated untracked v42 notes file. It was present before this release phase and was not included in the v41 evidence set.
