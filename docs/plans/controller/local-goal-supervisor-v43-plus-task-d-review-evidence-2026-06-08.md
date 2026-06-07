# Local goal supervisor v43+ task-D review evidence

Task: evidence date, runner snapshot, and worktree cleanup runbook

Local run date: `2026-06-08`

Timezone: `Asia/Shanghai`

UTC generated timestamp: `2026-06-07T18:48:36.383Z`

## Review Target

Worker result reviewed:

- thread: `019ea360-f71e-7101-8deb-bfd901ad2cef`
- worktree: `/Users/andy/.codex/worktrees/v43-plus-task-d-evidence-worktree-runbook`
- branch: `v43-plus-task-d-evidence-worktree-runbook`
- base commit: `6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43`
- worker head commit: `d8dddc412bfb645d4860281ae0823e3676d7432d`
- worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-worker-evidence-2026-06-08.md`

The repo commit adds the task-D runbook note, README link, and worker evidence. The functional runner changes are in the temporary external runner at `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`, which is outside the product repository by design.

## Acceptance Review

Result: approved.

Findings: none.

The worker evidence file name uses the local run date, and its body records local run date, timezone, and UTC generated timestamp. The bound prompt renderer now includes the same evidence clock fields in child prompts.

The runner snapshot implementation records the runner script path, SHA-256 digest, selftest command/result, daemon launcher command/status, doctor command, doctor output citation status, and supplied fixes. The reviewer snapshot reported script digest `sha256 13e623b4a20f26a67dd2370bf3c6d9d392d9383edf37659f16e0b2c3e0d32522`, matching the worker evidence and direct `shasum` check.

The cleanup plan is non-destructive. It reports goal/task, branch, head, dirty state, merge state, evidence state, cleanup decision, and refusal reasons. In the reviewer run, task-1, task-2, and task-3 were all preserved because their branch heads were not merged into `main` and recorded evidence was not present on the cleanup base. Task-3 was reported at head `d8dddc412bfb645d4860281ae0823e3676d7432d`, clean, unmerged, `evidence-not-merged`, and `removalAllowed: false`.

## Commands

- `sed -n '1,240p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md`: passed; confirmed task-D acceptance.
- `sed -n '1,260p' docs/plans/controller/local-goal-supervisor-v43-plus-task-d-worker-evidence-2026-06-08.md`: passed; reviewed worker evidence in the assigned worktree.
- `git diff --stat 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43..HEAD`: passed; confirmed repo file scope.
- `rg -n "evidence clock|local run date|UTC generated timestamp|runner-snapshot|worktree-cleanup-plan|doctor-output|script digest|cleanup" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`: passed; located external runner implementation paths.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`: passed.
- `shasum -a 256 /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`: passed; digest matched worker evidence.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest`: passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot --goal v43-plus-local-goal-supervisor-stability --fixes "reviewer task-D snapshot check" --skip-selftest`: passed; checked snapshot shape without re-running selftest inside the snapshot.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability --repo /Users/andy/Documents/project/multi-coding-agent-symphony --base-ref main`: passed; task worktrees were blocked from cleanup.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability --repo /Users/andy/Documents/project/multi-coding-agent-symphony --base-ref main | node -e "...task summary filter..."`: passed; produced compact task rows for task-1, task-2, and task-3.
- `git diff --check 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43..HEAD`: passed.
- `pnpm --silent check`: passed.
- `pnpm --silent test`: passed; 1113 tests passed.
- `pnpm --silent workbench:build`: passed.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json`: failed with exit code 64 and `goal not found`; this is expected in the assigned task worktree because `.symphony` goal state is root-only.

## Risks

The reviewed runner implementation lives outside the product repository. Review evidence records its path and digest so main verification can confirm the same external runner bytes before registration.
