# local-goal-supervisor v43+ task-B main verification evidence

Local verification date: 2026-06-08
Timezone: Asia/Shanghai
Generated at UTC: 2026-06-07T18:22:44Z

## Verification Target

Task: `task-1`, task-B daemon launcher and health wrapper.

Verified target:

- Branch: `v43-plus-task-b-daemon-launcher`
- Worktree: `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher`
- HEAD before this evidence file: `a4a321b6819d2e72111246705e66d2665d12c461`
- Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md`
- Reviewer evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-review-evidence-2026-06-08.md`
- Reviewer verdict: `reviewer.approved`

Implementation files checked:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- `/Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh`

## Result

`main.verification-passed`

The implementation satisfies the task-B runbook acceptance criteria. The launcher path is implemented as `daemon-start`, writes a launcher record with daemon id, goal id, pid fields, PTY log path, interval, max tick budget, command fields, and launch timestamps, and starts the daemon through `script -q ... /bin/sh -lc`.

`daemon-stop` reads the recorded launcher status before signalling a process. It returns without signalling when there is no launcher record, marks a recorded dead pid as stopped, and refuses to kill a live pid unless the process command matches the recorded supervisor daemon command and the launcher status is tied to the same daemon id, goal id, and health pid.

`daemon-status` is read-only and reports `startedThroughExpectedLauncher`, launcher record details, pid state, command-line match state, health match state, and daemon health. `doctor` includes the same status under `daemon.launcher`.

The current live daemon for `v43-plus-local-goal-supervisor-stability` was started before this task through the older direct path. The verification `daemon-status` command reported `status: not-started`, `startedThroughExpectedLauncher: false`, and active direct daemon health. That is the expected distinction for this task: old direct daemon activity or manual freshness does not satisfy launcher health.

## Acceptance Check

- PTY-backed start command records pid, PTY log path, daemon id, goal id, interval, and max ticks: passed by code inspection of `startDaemonLauncher` and launcher record fields.
- Stop command shuts down only the recorded daemon process: passed by code inspection of `stopDaemonLauncher`, `daemonLauncherStatus`, and `daemonCommandMatchesRecord`.
- Doctor reports launcher status: passed by code inspection of `runDoctor`, which returns `daemon.launcher`.
- Manual tick freshness is not daemon health: passed by selftest coverage and by `daemon-status` against the pre-existing direct daemon.

## Commands Run

Commands run from `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher` unless noted.

- `pwd && rg --files -g 'AGENTS.md' -g 'docs/plans/controller/**'` passed.
- `git status --short --branch && git rev-parse HEAD && git branch --show-current` passed and confirmed branch `v43-plus-task-b-daemon-launcher` at `a4a321b6819d2e72111246705e66d2665d12c461`.
- `sed -n '1,220p' docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md` passed.
- `sed -n '1,260p' docs/plans/controller/local-goal-supervisor-v43-plus-task-b-review-evidence-2026-06-08.md` passed.
- `sed -n '1,260p' /Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea34e-04ba-7c42-9570-dd6aaed87ff2.txt` passed and showed `reviewer.approved`.
- `sed -n '1,260p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` passed.
- `sed -n '1,240p' docs/plans/app-core-v43-plus-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` passed.
- `sed -n '1,260p' docs/plans/v43-plus-local-goal-supervisor-stability-plan-2026-06-08.md` passed.
- `git log --oneline --decorate -8` passed.
- `git diff --name-status 46a8d712ebc746b5fadd58b494030a0b42aa38c6...HEAD` passed.
- `git show --stat --oneline a4a321b6819d2e72111246705e66d2665d12c461` passed.
- `rg -n "function startDaemonLauncher|function stopDaemonLauncher|function daemonLauncherStatus|function waitForLauncherPid|startedThroughExpectedLauncher|daemon-start|daemon-stop|daemon-status|daemon-id|script -q|launch-daemon" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '1,40p;520,760p;860,945p;1220,1395p;5740,5865p;6490,6635p'` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '140,180p;750,886p;1395,1410p;6000,6135p'` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '380,440p;5980,6005p'` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh | sed -n '1,220p'` passed.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `zsh -n /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh` passed.
- `git diff --check 46a8d712ebc746b5fadd58b494030a0b42aa38c6...HEAD` passed.
- `git diff --check` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed and returned `staleLauncherPidIgnored: true`.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v43-plus-local-goal-supervisor-stability` passed and reported `status: not-started`, `startedThroughExpectedLauncher: false`, active direct daemon health, and latest tick for thread `019ea351-2c8e-75c1-baa4-c004619c20dc`.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json` failed with exit code 64 and `goal not found`, matching the worker and reviewer evidence for this assigned worktree.

No `daemon-start`, `daemon-stop`, `doctor`, mutation, audit, real CLI runner, provider CLI, tag, push, publish, or release closeout command was run during main verification.

## Risk

The active live daemon for this goal is still the older direct daemon and has no launcher record. Replacing it with the new launcher path remains an operator-controlled action outside this verification phase.
