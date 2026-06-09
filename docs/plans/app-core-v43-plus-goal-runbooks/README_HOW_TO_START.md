# v43+ Local Goal Supervisor Start

Use this goal only for the temporary project-external coding system.

```sh
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v43-plus-local-goal-supervisor-stability.v1.json \
  --goal v43-plus-local-goal-supervisor-stability \
  --dry-run --json
```

Then initialize the external runner state:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs init \
  --repo /Users/andy/Documents/project/multi-coding-agent-symphony \
  --goal v43-plus-local-goal-supervisor-stability
```

Start the PTY-backed daemon launcher when task-B provides it. Until then, use the known-good `script` wrapper:

```sh
nohup script -q /Users/andy/.codex/local-goal-supervisor/logs/v43-plus-local-goal-supervisor-stability.daemon.pty.out /bin/zsh -lc 'node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon --goal v43-plus-local-goal-supervisor-stability --interval-ms 10000 --max-ticks 5000' >/dev/null 2>&1 &
```
