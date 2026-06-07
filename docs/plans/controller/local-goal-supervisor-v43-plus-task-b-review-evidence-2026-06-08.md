# local-goal-supervisor v43+ task-B review evidence

Local review date: 2026-06-08
Timezone: Asia/Shanghai
Generated at UTC: 2026-06-07T18:13:00Z

## Review Target

Task: `task-1`, task-B daemon launcher and health wrapper.

Worker result reviewed:

- Thread: `019ea340-7744-7592-a0a5-744984143921`
- Branch: `v43-plus-task-b-daemon-launcher`
- Worktree: `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher`
- Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md`
- Worker head: `96246916cdf9dc6bd9186e5e79fc7127ab6d62b4`

Implementation files inspected:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- `/Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh`

## Verdict

`reviewer.needs-revision`

## Finding

`daemon-start` can record a stale daemon pid instead of the pid for the launch it just started.

In `startDaemonLauncher`, the launcher uses the goal's shared daemon pid path and then calls `waitForLauncherPid(pidPath, 5000)` after spawning `script`. `waitForLauncherPid` returns immediately when the file already exists and contains any positive integer. The start path does not remove the old pid file, compare file mtime, write a launch token, or otherwise verify that the pid file was written by this `script` invocation.

Relevant code:

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:665` sets `pidPath` to the goal daemon pid file.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:684` to `686` writes `$$` to that pid file inside the launched shell before `exec`.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:698` reads the pid through `waitForLauncherPid`.
- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs:880` to `884` returns the first existing positive pid without proving it came from the current launch.

Failure case:

1. A previous daemon leaves `<goal>.daemon.pid` behind after it exits or after a stale health state.
2. `daemon-status` no longer reports an active launcher, so `daemon-start` proceeds.
3. Before the new `script` shell writes its pid, `waitForLauncherPid` sees the old file and returns the stale pid.
4. The launcher record is written with the wrong pid and command line. Status can become stale/refused even though the newly launched daemon is running, and `daemon-stop` will not reliably stop the process that `daemon-start` created.

This misses the acceptance requirement that the PTY-backed start command records the daemon pid. It also weakens the stop requirement because the stop guard depends on the recorded pid being the daemon process created by the launcher.

Expected fix:

- Make `daemon-start` ignore pre-existing pid file contents for the new launch. A direct fix is to remove or rotate the pid file before spawning, then wait for a pid file with a fresh mtime and a command line matching the expected daemon command and daemon id before writing `status: started`.
- Keep the guarded stop behavior, but add selftest coverage for a stale pre-existing pid file before `daemon-start`.

## Commands Run

Commands run from `/Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher`:

- `pwd && git status --short --branch && git rev-parse HEAD && git diff --stat 09eafd63d4d51f3aad1f9cdc1273998f24cb0ffd...HEAD` passed.
- `sed -n '1,240p' docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md` passed.
- `rg --files -g 'AGENTS.md' -g '*runbook*' -g '*controller*' docs . | head -80` passed.
- `find /Users/andy/Documents/project/multi-coding-agent-symphony /Users/andy/.codex/worktrees/v43-plus-task-b-daemon-launcher -name AGENTS.md -print` passed and returned no on-disk `AGENTS.md`.
- `sed -n '1,260p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` passed.
- `git diff --name-status 09eafd63d4d51f3aad1f9cdc1273998f24cb0ffd...HEAD && git diff -- docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md` passed.
- `sed -n '1,260p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '1,220p' /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh` passed.
- `rg -n "daemon-start|daemon-stop|daemon-status|launcher|startedThroughExpectedLauncher|daemon-id|script -q|doctor" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs /Users/andy/.codex/local-goal-supervisor/bin/launch-daemon.zsh` passed.
- `sed -n '380,460p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '620,880p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '1240,1375p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '5720,5785p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs && sed -n '5920,5945p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '520,625p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '880,960p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `rg -n "function parseArgs|case '--force'|allow-closeout|daemonId|daemon-id|interval-ms|max-ticks" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '6500,6570p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '5950,6015p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `nl -ba /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs | sed -n '660,705p;880,895p'` passed.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v43-plus-local-goal-supervisor-stability` passed and reported `status: not-started`, `startedThroughExpectedLauncher: false`, with old direct daemon health still active.
- `git diff --check 09eafd63d4d51f3aad1f9cdc1273998f24cb0ffd...HEAD` passed.

No `daemon-start`, `daemon-stop`, `doctor`, mutation, audit, real CLI runner, provider CLI, tag, push, publish, or release closeout command was run during review.
