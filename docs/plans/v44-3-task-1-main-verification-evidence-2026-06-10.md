# v44.3 task-1 main verification evidence

Local run date: 2026-06-10
Timezone: Asia/Shanghai
Goal: v44-3-app-contract-context-supervisor
Task: task-1
Role: main-verifier
Assigned thread: 019eaf86-9105-73d0-a322-66856cdfdcc2
Verified branch: codex/v44-3-pr1-app-facing-contracts-fixtures
Verified worktree: /Users/andy/.codex/worktrees/codex_v44-3-pr1-app-facing-contracts-fixtures
Base commit: abd7e1fc3cec4c48ced851cbb7cb5500ade99599
Reviewed worker evidence: docs/plans/v44-3-task-1-worker-evidence-2026-06-10.md
Reviewed reviewer evidence: docs/plans/v44-3-task-1-review-evidence-2026-06-10.md

## Verdict

Main verification passed.

## Verification notes

The task-1 implementation matches the PR-1 runbook scope. The diff is limited to the app-facing supervisor contract builder, the supervisor index export, replay fixtures, focused tests, and evidence files.

The builder emits `goal-supervisor-app-read-model.v1` with the required app-facing objects: `goalSnapshot`, `goalTimeline`, `activeLease`, `pendingResult`, `currentGate`, `recommendedNextAction`, `ownership`, `contextStatus`, and `commandBoundary`.

The replay fixture covers the nine PR-1 scenarios named in the runbook: dispatchable next action, active lease with recent transcript, active lease with stale transcript, pending escrow result, missing transcript, release closeout blocked, command boundary disabled, dry-run command preview, and confirm-required command preview.

The verified model remains read-only. `readOnly` is `true`, `willMutate` is `false`, command execution stays unavailable in the default, dry-run, and confirm-required paths, and the built model does not emit `latestResultText`, `rawTranscript`, or `agentMessage`.

No API route, CLI command, frontend binding, ledger write path, event registration path, daemon launcher, provider CLI call, release command, tag, push, publish, or closeout automation was added by this task.

## Commands run

| Command | Result |
| --- | --- |
| `pwd && rg --files -g 'AGENTS.md' -g 'docs/**' -g 'package.json' -g 'pnpm-lock.yaml'` | Exit 0. Confirmed assigned worktree and repository files. |
| `git status --short --branch && git rev-parse HEAD && git log --oneline -5` | Exit 0. Verified branch `codex/v44-3-pr1-app-facing-contracts-fixtures` at reviewer commit `22c8355755108b81a58cf45eb036d108a2871084` before this evidence file. |
| `sed -n '1,260p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md` | Exit 0. Confirmed PR-1 scope, required scenarios, and merge checks. |
| `sed -n '1,240p' docs/plans/v44-3-task-1-worker-evidence-2026-06-10.md` | Exit 0. Worker evidence present in the assigned worktree. |
| `sed -n '1,240p' docs/plans/v44-3-task-1-review-evidence-2026-06-10.md` | Exit 0. Reviewer approved task-1 in the assigned worktree. |
| `git diff --name-status abd7e1fc3cec4c48ced851cbb7cb5500ade99599...HEAD` | Exit 0. Changed files matched PR-1 scope plus evidence. |
| `sed -n '1,320p' src/symphony/goal-supervisor/app-read-model.js` and `sed -n '321,760p' src/symphony/goal-supervisor/app-read-model.js` | Exit 0. Verified app read-model builder, policy projection, context normalization, pending result handling, and command boundary defaults. |
| `sed -n '1,160p' src/symphony/goal-supervisor/index.js` | Exit 0. Verified the new app read-model export. |
| `sed -n '1,320p' tests/v44-goal-supervisor-app-read-model.test.js` | Exit 0. Verified focused contract tests. |
| `sed -n '1,760p' fixtures/contracts/goal-supervisor/app-read-model.v44-3.pr1.v1.json` | Exit 0. Verified all nine replay scenarios. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Exit 0. Three tests passed. |
| `node --test tests/v44-goal-supervisor-*.test.js` | Exit 0. Thirty-eight tests passed. |
| `pnpm check` | Exit 0. Repository syntax check passed. |
| `git diff --check abd7e1fc3cec4c48ced851cbb7cb5500ade99599...HEAD` | Exit 0. No whitespace errors. |
| `rg -n "goal-supervisor-app-read-model\|latest/supervisor\|supervisor status\|latestResultText\|rawTranscript\|agentMessage\|goal-ledger-write\|event-log-write\|release-closeout" src frontend tests fixtures/contracts/goal-supervisor` | Exit 0. Confirmed the new contract name, blocked command families, and test-only raw transcript assertions; no new API route, CLI route, or frontend binding appeared in the task diff. |
| `node --input-type=module - <<'NODE' ... fixture replay verification ... NODE` | Exit 0. Verified nine app read-model fixture scenarios, read-only flags, disabled execution, expected actions, boundary states, pending result states, transcript states, and no forbidden raw transcript field names in the built model JSON. |

## Boundary notes

I did not register `main.verification-passed` or any other goal event.

I did not run release closeout, tag, push, publish, provider CLI, real CLI, audit, doctor, mutation gate, or daemon-control commands.

This verification used the assigned worker/reviewer target worktree: `/Users/andy/.codex/worktrees/codex_v44-3-pr1-app-facing-contracts-fixtures`.

## Residual risk

This PR defines the contract and fixtures only. Later PRs still need to wire the read model into a read-only API or CLI without exposing raw transcripts or enabling command execution.
