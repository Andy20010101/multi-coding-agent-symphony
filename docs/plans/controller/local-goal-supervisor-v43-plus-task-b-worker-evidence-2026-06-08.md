# local-goal-supervisor v43+ task-B worker evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Generated at UTC: 2026-06-07T18:07:55Z

## Scope

Task: `task-1`, task-B daemon launcher and health wrapper.

Implementation target:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- `/Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh`

Repository evidence file:

- `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md`

## Changes Made

The external supervisor now has first-class daemon launcher commands:

- `daemon-start --goal <id> [--interval-ms <ms>] [--max-ticks <n>] [--allow-closeout]`
- `daemon-stop --goal <id>`
- `daemon-status --goal <id>`

`daemon-start` launches the daemon through the PTY-backed `script` path and records a launcher metadata file under the local supervisor state directory. The record includes daemon id, goal id, daemon pid, launcher pid, PTY log path, pid path, interval, max tick budget, command line, launch time, and the node/supervisor script paths used.

The daemon accepts a launcher-provided `--daemon-id`, so the launch record, daemon health file, and daemon log can be cross-checked against the same id.

`daemon-stop` reads only the recorded launcher metadata. It refuses to kill a pid unless the running process command matches the recorded supervisor daemon command and daemon id. If the recorded pid is already gone, it marks the launcher record stopped instead of touching any other terminal or daemon.

`daemon-status` is read-only. It reports whether the recorded daemon was started through the expected PTY launcher, whether the pid is running, whether the command line matches the recorded daemon command, whether daemon health matches the launch record, and the PTY log path.

`doctor` now includes the same launcher status under `daemon.launcher`. Manual ticks can still appear in activity history, but they do not create a launcher record and do not make `startedThroughExpectedLauncher` true.

The existing `launch-daemon.zsh` wrapper now delegates to `daemon-start` instead of directly execing the daemon with plain redirected output.

## Validation

Commands run from `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher`:

- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v43-plus-local-goal-supervisor-stability` passed. It reported `status: not-started`, `startedThroughExpectedLauncher: false`, and current daemon health `status: daemon-active`, confirming that the currently running old daemon is distinguishable from the new expected launcher path.
- `git diff --check` passed.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json` failed with exit code 64 and `goal not found` in this assigned worktree.

No `daemon-start`, `daemon-stop`, `doctor`, release closeout, provider CLI, tag, push, publish, mutation, or audit command was run during this worker phase.

## Acceptance Mapping

- PTY-backed start command: implemented as `daemon-start`, using `script -q <pty log> /bin/sh -lc <daemon command>`.
- Start command records pid, PTY log path, daemon id, goal id, interval, and max tick budget: implemented in `<goal>.daemon.launcher.json` and returned by `daemon-start` / `daemon-status`.
- Stop command shuts down only the recorded daemon process: implemented as guarded `daemon-stop` with command-line and daemon-id matching before `SIGTERM`.
- Doctor reports launcher status: implemented under `daemon.launcher`.
- Manual tick freshness is not daemon health: selftest and `daemon-status` preserve the distinction by requiring a launcher record, matching pid, matching daemon id, and matching daemon health before reporting `startedThroughExpectedLauncher: true`.

## Risks

The current live daemon for this goal was started before task-B and has no launcher record. The new `daemon-start` command refuses to create a duplicate while that direct daemon is active unless the operator explicitly uses `--force`.

## Revision After Review

Local revision date: 2026-06-08
Timezone: Asia/Shanghai
Generated at UTC: 2026-06-07T18:16:11Z

Reviewer finding addressed:

- `daemon-start` could record a stale `<goal>.daemon.pid` value when a prior pid file existed before the PTY shell wrote the pid for the new launch.

External runner changes:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:3` imports `statSync` for pid file freshness checks.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:690` to `708` clears the goal daemon pid file immediately before spawning the PTY launcher, then waits only for a pid file written after that launch started and matching the expected goal, daemon id, and supervisor script.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:887` to `923` makes `waitForLauncherPid` ignore stale pid files, tolerate file races, and reject pids whose command line does not match the expected daemon command.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:5799` to `5821` adds selftest coverage for a pre-existing launcher pid file. The selftest verifies both stale mtime rejection and command-line mismatch rejection before a pid can be recorded.

Revision validation:

- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed and returned `staleLauncherPidIgnored: true`.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v43-plus-local-goal-supervisor-stability` passed. It still reported `status: not-started` and `startedThroughExpectedLauncher: false` while showing the pre-existing direct daemon health, so manual or old daemon freshness still does not satisfy launcher health.
- `git diff --check` passed.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json` still failed with exit code 64 and `goal not found` in this assigned worktree.

No `daemon-start`, `daemon-stop`, `doctor`, release closeout, provider CLI, tag, push, publish, mutation, or audit command was run during this revision phase.
