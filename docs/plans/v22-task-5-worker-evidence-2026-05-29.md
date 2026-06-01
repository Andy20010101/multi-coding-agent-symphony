# v22 task-5 worker evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Task id: `task-5`

Branch: `v22-task-5-prompt-workspace-tests-and-docs`

Implementation commit: `f45e70c91a68516bfa6d0ec68d1f6b870b36f1fe`

## Scope Checked

Task-5 scope from the v22 runbook: tests for role prompt, copy, event shortcut, reviewer independence prompt, and unsupported goal state.

## Changes

- `tests/v19-goal-prompt-pack.test.js`: expanded v22 reviewer prompt assertions so the prompt must say the reviewer is independent, must stop on self-review conflict, must not reuse the worker summary as the conclusion, and must return `APPROVED` or `NEEDS_REVISION`.
- `tests/workbench-shell.test.js`: added a Prompt Workspace source test that the prompt text is rendered in selectable copy-only text, with no clipboard API, shell execution, review gate, main gate, or release-ready path.
- `tests/workbench-api-client.test.js`: added a dry-run preview client test before confirm, and added unsupported Prompt Workspace goal/task/ref coverage that stays local and read-only without calling fetch.
- `docs/workbench-operator-guide.md`: documented Prompt Workspace copy behavior, worker-only event shortcuts, and unsupported goal state handling.

## Command Results

| Command | Result |
| --- | --- |
| `pnpm test -- tests/v19-goal-prompt-pack.test.js` | Exit 0. 6 pass, 0 fail. |
| `pnpm test -- tests/workbench-api-client.test.js` | Exit 0. 21 pass, 0 fail. |
| `pnpm test -- tests/workbench-shell.test.js` | Exit 0. 15 pass, 0 fail. |
| `pnpm check` | Exit 0. `node --check` completed for src, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. 700 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-D6WeclLN.css`, and `assets/index-BRTPIdb3.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json` | Exit 0. Contract `goal-progress-ledger.v1`; total tasks 5; completed tasks 4; task-5 status `in-progress`; task-5 status source `goal-event-log.v1:evt_47d68bfa064a31dd`; releaseReady `false`. |

## Boundary Check

- No generic shell runner was added.
- No v8 `scan/do/review/verify/status/continue/artifacts` dashboard path was added.
- No approval or release readiness is inferred from file names, branch names, commit messages, prompt text, command text, or frontend state.
- Worker self-approval is not possible from this change; reviewer prompt coverage now checks the independent reviewer wording.
- No merge, tag, or release operation was added.

## Acceptance Conclusion

Task-5 worker scope is complete. The tests and docs now cover role prompt rendering, manual copy-only prompt handoff, event shortcut dry-run before confirm, reviewer independence wording, and unsupported Prompt Workspace goal state.

Blockers: none.
