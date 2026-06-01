# v22 task-5 review evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-5`

Branch: `v22-task-5-prompt-workspace-tests-and-docs`

Reviewed commits:
- `f45e70c91a68516bfa6d0ec68d1f6b870b36f1fe` - task-5 tests and docs
- `c4f0e9f6839fce7e475967dbcb2ab568e9fb7a3b` - worker evidence

Worker evidence: `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`

Verdict: `APPROVED`

## Goal state checked

`pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json` returned task-5 reviewer as the next required role because worker evidence exists and reviewer verdict is missing.

`pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json` returned `goal-progress-ledger.v1`. The ledger shows 5 total tasks, 4 completed tasks, task-5 status `in-progress`, worker evidence `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`, no review evidence, no main verification evidence, and `releaseReady: false`.

## Files reviewed

- `docs/workbench-operator-guide.md`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`

## Acceptance review

Task-5 scope in the v22 runbook is tests for role prompt, copy, event shortcut, reviewer independence prompt, and unsupported goal state.

The task-5 changes cover that scope:

- Role prompt rendering is covered in `tests/v19-goal-prompt-pack.test.js`. The v22 role-specific prompt test still validates worker, independent reviewer, main verifier, and release manager prompt packs, goal-specific evidence paths, role guidance shape, no v19 evidence path leakage, and the v22 goal-status command.
- Reviewer independence wording is covered in the same prompt test. The reviewer prompt must say `independent reviewer`, must stop on self-review conflict, must not reuse the worker summary as the conclusion, and must return `APPROVED` or `NEEDS_REVISION`.
- Copy behavior is covered in `tests/workbench-shell.test.js`. The Prompt Workspace prompt body is asserted as selectable `<pre><code>` copy-only text, with no clipboard API, shell execution, window open, review gate, main gate, or release-ready path in that prompt pack area.
- Event shortcut coverage is split across `tests/workbench-shell.test.js` and `tests/workbench-api-client.test.js`. The shell test checks that Prompt Workspace shortcuts are worker-only, limited to `worker.started` and `worker.evidence-recorded`, and wired through dry-run preview plus plan-hash confirm. The API client test checks the dry-run preview GET request before confirm and verifies `writesInDryRun: false`.
- Unsupported goal state is covered in `tests/workbench-api-client.test.js`. Unsafe goal/task refs stay local and read-only, return unavailable/missing board state, and do not call fetch.
- Operator docs now describe the Prompt Workspace copy-only prompt area, worker-only event shortcuts, unsupported goal handling, and the rule that task completion, approval, main verification, and release readiness are not inferred from prompt text, paths, filenames, branch names, commit messages, or frontend choices.

## Boundary review

- No generic safety layer was added.
- No generic shell runner was added.
- No v8 `scan/do/review/verify/status/continue/artifacts` dashboard path was introduced as the Workbench main action list.
- The reviewed tests reinforce that Workbench does not infer task approval or release readiness from files, branches, commits, prompt text, command text, or frontend state.
- The reviewer prompt test covers the self-review conflict language. The worker evidence does not claim reviewer approval, main verification, or release readiness.
- No auto-merge, auto-tag, or release operation was added.

## Commands run

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. 700 tests, 700 pass, 0 fail, duration 3714.339208 ms. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-D6WeclLN.css`, and `assets/index-BRTPIdb3.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json` | Exit 0. Contract `goal-progress-ledger.v1`; task-5 `in-progress`; worker evidence present; review evidence missing before this review event is registered; releaseReady `false`. |

## Approval scope

Approved for task-5 reviewer handoff. This approval covers the task-5 tests, docs, and worker evidence only. It does not declare main verification or release readiness.
