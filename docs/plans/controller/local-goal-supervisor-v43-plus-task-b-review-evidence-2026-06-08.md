# local-goal-supervisor v43+ task-B review evidence

Local review date: 2026-06-08
Timezone: Asia/Shanghai
Generated at UTC: 2026-06-07T18:19:14Z

## Review Target

Task: `task-1`, task-B daemon launcher and health wrapper.

Worker revision reviewed:

- Thread: `019ea340-7744-7592-a0a5-744984143921`
- Branch: `v43-plus-task-b-daemon-launcher`
- Worktree: `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher`
- Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md`
- Worker evidence commit: `9fb259fcb99c077986f58aa020f7e137b667ba81`

Implementation files inspected:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- `/Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh`

## Verdict

`reviewer.approved`

## Review Notes

The worker revision resolves the prior stale-pid finding.

`startDaemonLauncher` now removes the shared goal daemon pid file before spawning the PTY launcher, records the pid wait start time, and calls `waitForLauncherPid` with both a minimum pid file mtime and an expected daemon record. `waitForLauncherPid` now ignores pre-existing pid files, tolerates file races, and returns a pid only after the process command line matches the expected supervisor script, goal id, and daemon id.

The guarded stop behavior remains limited to the recorded launcher process. `daemon-stop` still refuses to signal a running pid unless launcher status confirms the pid matches the recorded daemon command and launcher health matches the same daemon id and goal id.

`daemon-status` and `doctor` expose launcher status through `daemonLauncherStatus`. Manual or old direct daemon freshness does not set `startedThroughExpectedLauncher: true`; the reviewer check against the active old direct daemon still reported `status: not-started` with `startedThroughExpectedLauncher: false`.

`launch-daemon.zsh` delegates to `daemon-start` with goal, interval, and max tick arguments, so the wrapper uses the same PTY-backed launcher path.

## Acceptance Mapping

- PTY-backed start command records pid, PTY log path, daemon id, goal id, interval, and max ticks: satisfied by `daemon-start` launch records and `daemon-status`.
- Stop command shuts down only the recorded daemon process: satisfied by command-line, daemon id, goal id, and health matching before `SIGTERM`.
- Doctor reports launcher status: satisfied through `daemon.launcher`.
- Manual tick freshness is not daemon health: satisfied by launcher status requiring a PTY launcher record, matching pid command, and matching daemon health.

## Commands Run

Commands run from `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher` unless another path is shown:

- `pwd && git status --short --branch && git rev-parse HEAD && rg --files -g 'AGENTS.md' -g 'docs/**' | head -80` passed and confirmed the assigned worktree and HEAD.
- `test -f AGENTS.md && sed -n '1,220p' AGENTS.md || true` passed and found no on-disk `AGENTS.md`.
- `sed -n '1,240p' docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md` passed.
- `sed -n '1,240p' docs/plans/controller/local-goal-supervisor-v43-plus-task-b-review-evidence-2026-06-08.md || true` passed and showed the prior needs-revision review.
- `sed -n '1,260p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` passed.
- `sed -n '1,220p' docs/plans/app-core-v43-plus-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` passed.
- `git log --oneline --decorate -6 && git diff --stat 46a8d712ebc746b5fadd58b494030a0b42aa38c6...HEAD && git diff --name-status 46a8d712ebc746b5fadd58b494030a0b42aa38c6...HEAD` passed.
- `git show --stat --oneline 9fb259f && git show -- docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md` passed.
- `rg -n "statSync|startDaemonLauncher|waitForLauncherPid|daemon-start|daemon-stop|daemon-status|launcher|startedThroughExpectedLauncher|script -q|daemon-id|doctor" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '1,35p;520,750p;860,940p;1220,1385p;5750,5835p;6500,6575p'` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '750,860p;5830,5860p;6590,6625p'` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh | sed -n '1,220p'` passed.
- `rg -n "function parseArgs|case '--goal'|case '--daemon-id'|case '--force'|case '--interval-ms'|case '--max-ticks'|case '--allow-closeout'" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '6000,6125p'` passed.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed and returned `staleLauncherPidIgnored: true`.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v43-plus-local-goal-supervisor-stability` passed and reported `status: not-started`, `startedThroughExpectedLauncher: false`, and active old direct daemon health.
- `git diff --check 46a8d712ebc746b5fadd58b494030a0b42aa38c6...HEAD` passed.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json` failed with exit code 64 and `goal not found` in the assigned worktree, matching the worker evidence.

No `daemon-start`, `daemon-stop`, `doctor`, mutation, audit, real CLI runner, provider CLI, tag, push, publish, or release closeout command was run during review.

## Risks

The current live daemon for this goal is still an old direct daemon with no launcher record. The new launcher correctly distinguishes it from the expected PTY-backed launcher path, but replacing that live daemon remains an operator-controlled recovery step.
