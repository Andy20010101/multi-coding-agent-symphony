# v38 task-5 main verification evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-5`
Role: `main-verifier`
Branch: `codex/v38-task-5-provider-hub-panel-evidence`
Worktree: `/Users/andy/.codex/worktrees/v38-task-5/multi-coding-agent-symphony`
Base commit: `afaa644a6044d95679d4d59bdc794cf8b346a8f1`
Head commit: `b9711646c55117ce1a9a48fbed34dd1ecd70387d`
Verification date: `2026-06-05`
Verdict: `passed`

## Inputs Checked

- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`, task-5 fields.
- `docs/plans/v38-task-5-worker-evidence-2026-06-02.md`.
- `docs/plans/v38-task-5-review-evidence-2026-06-02.md`.
- `docs/plans/controller/subagent-result-format.md` was requested but is not present in this task worktree. The fixed result block from the dispatch is used as the reporting shape.

## Ledger Context

`pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` from the task worktree returned `goal not found` because this worktree has no `.symphony` managed-goal state. The same read-only command from `/Users/andy/Documents/project/multi-coding-agent-symphony` returned `goal-progress-ledger.v1` with task-5 status `approved`, branch `codex/v38-task-5-provider-hub-panel-evidence`, commit `b9711646c55117ce1a9a48fbed34dd1ecd70387d`, worker evidence `docs/plans/v38-task-5-worker-evidence-2026-06-02.md`, review evidence `docs/plans/v38-task-5-review-evidence-2026-06-02.md`, review verdict `APPROVED`, and `mainVerificationRef: null`.

## Acceptance Checks

- Workbench shows provider availability and blockers in `ProviderHubPanel`; Desktop Shell shows the same projection in `Provider Availability`.
- Provider Hub consumes `agent-cli-provider-health.v1`, `agent-cli-capability-profile.v1`, `agent-cli-lane-assignment-preview.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1`.
- Provider availability includes active provider ids, configured/missing counts, health state, blockers, capability gates, lane separation, and evidence refs.
- Sanitized env display renders env names, presence booleans, and `valueAvailable=false`; tests assert secret fixture values do not appear in the projected hub JSON.
- Active providers remain `claude-code-cli` and `codex-cli`. Gemini, Kiro, and DeepSeek are covered by existing v38 provider/lane tests as forbidden active provider drift.
- The App/Workbench path is visible in `frontend/workbench/src/App.jsx` through the active-goal supporting contracts area and `/workbench/desktop/`.
- Evidence anchors come from explicit task evidence refs in the goal ledger projection. The Workbench projection does not read evidence document bodies.
- State displayed by the panel comes from backend contract fields and command output projections. The panel source has no `fetch`, shell, spawn, form, textarea, clipboard, or window-open execution controls.
- The UI does not add provider CLI execution, prompt dispatch, model invocation, arbitrary shell execution, arbitrary local file access, merge, push, tag, publish, review approval inference, main verification inference, release-ready declaration, or self-approval.
- v8 compatibility commands are not presented as the top-level App/Workbench model; the relevant App path stays on Workbench/Desktop contract projections.

## Commands Run

| Command | Cwd | Result |
| --- | --- | --- |
| `git diff --check` | task worktree | Passed, exit 0 |
| `pnpm check` | task worktree | Passed, exit 0 |
| `pnpm test` | task worktree | Passed, exit 0; 1015 tests passed |
| `pnpm workbench:build` | task worktree | Passed, exit 0; built `src/symphony/workbench-static/assets/index-BNNs3KXL.js` |
| `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` | task worktree | Failed, exit 64, `goal not found`; task worktree has no `.symphony` goal state |
| `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Passed, exit 0; ledger shows task-5 approved and missing main verification |

No mutation, audit, doctor, provider CLI, model-provider CLI, tag, push, publish, or release closeout command was run.

## Result

Task-5 satisfies the main-verification acceptance checks. The only environment note is that the task worktree does not carry `.symphony` managed-goal state, so the ledger read was confirmed from the controller root that holds the active goal state.

Event to register: `main.verification-passed`
