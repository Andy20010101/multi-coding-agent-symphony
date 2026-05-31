# v22 task-5 main verification evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-5`

Verification verdict: `PASSED`

Checked commit: `c4f0e9f6839fce7e475967dbcb2ab568e9fb7a3b`

## Evidence checked

- v22 runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`
- Review evidence: `docs/plans/v22-task-5-review-evidence-2026-05-29.md`
- Changed docs and tests:
  - `docs/workbench-operator-guide.md`
  - `tests/v19-goal-prompt-pack.test.js`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js`

## Goal state

`pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json` returned `goal-progress-ledger.v1` with 5 total tasks, 5 completed tasks, task-5 status `approved`, worker evidence `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`, review evidence `docs/plans/v22-task-5-review-evidence-2026-05-29.md`, review verdict `APPROVED`, and no main verification ref yet.

`pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json` returned task-5 role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.`

## Acceptance check

Task-5 scope in the v22 runbook is tests for role prompt, copy, event shortcut, reviewer independence prompt, and unsupported goal state.

Verified coverage:

- Role prompt rendering is covered by `tests/v19-goal-prompt-pack.test.js`, including worker, independent reviewer, main verifier, and release manager prompt packs for the v22 goal.
- Reviewer independence wording is covered by the same test file. The reviewer prompt must identify the role as independent, stop on self-review conflict, avoid using the worker summary as the conclusion, and return `APPROVED` or `NEEDS_REVISION`.
- Copy behavior is covered by `tests/workbench-shell.test.js`. The Prompt Workspace prompt pack is rendered as manual copy-only text and the checked source has no clipboard API, shell execution, window open path, review gate path, main gate path, or release-ready path in the prompt pack area.
- Event shortcut coverage is in `tests/workbench-shell.test.js` and `tests/workbench-api-client.test.js`. The tests cover worker-only shortcuts for `worker.started` and `worker.evidence-recorded`, dry-run preview before confirm, plan-hash confirm, no writes during dry-run, and refresh from backend goal contracts after confirm.
- Unsupported goal state is covered by `tests/workbench-api-client.test.js`. Unsafe or unsupported Prompt Workspace goal refs stay local and read-only and do not call fetch.
- `docs/workbench-operator-guide.md` describes Prompt Workspace copy-only behavior, worker-only event shortcuts, unsupported goal handling, and the boundary that task completion, approval, main verification, and release readiness are not inferred from prompt text, paths, filenames, branch names, commit messages, or frontend choices.

## Command results

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. `node --check` completed for src, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. 700 tests, 111 suites, 700 pass, 0 fail, duration 3736.673833 ms. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-D6WeclLN.css`, and `assets/index-BRTPIdb3.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json` | Exit 0. Contract `goal-progress-ledger.v1`; task-5 status `approved`; worker evidence and review evidence present; review verdict `APPROVED`; main verification ref missing before this gate is registered; releaseReady `false`. |

## Conclusion

Task-5 main verification passed. The approved task-5 state matches the v22 runbook scope, and the validation commands passed.

Blockers: none for task-5 main verification.
