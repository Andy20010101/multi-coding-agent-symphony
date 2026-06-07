# How to start v43 Goal Supervisor work

Date: 2026-06-07
Baseline: v42 Goal Supervisor Runtime Context Loop

## Files

```text
multi-coding-agent-symphony/
  docs/
    plans/
      app-core-v43-goal-runbooks/
        00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
        v43_goal-supervisor-stabilization_goal_runbook_latest.md
        README_HOW_TO_START.md
      v43-goal-supervisor-stabilization-plan-2026-06-07.md
      v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
  fixtures/
    contracts/
      goal-runbook.v43-goal-supervisor-stabilization.v1.json
```

## Before starting v43

Use the tracked v42 release as the baseline. Start only from a clean `main` or an explicit planning branch based on current `origin/main`.

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Historical v42 inputs:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

Do not bootstrap v43 from untracked `.symphony` state alone.

## Register v43

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b codex/v43-bootstrap
```

Paste the Task 0 prompt from:

```text
docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
```

Then register the goal:

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json \
  --goal v43-goal-supervisor-stabilization \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json \
  --goal v43-goal-supervisor-stabilization \
  --confirm \
  --plan-hash sha256:<PLAN_HASH> \
  --json

pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json
pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json
```

## Run each task

For each task:

```bash
pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json
pnpm --silent symphony goal prompt --goal v43-goal-supervisor-stabilization --task <task-id> --role worker --markdown
```

Paste the worker prompt into a worker `/goal` conversation.

After the worker finishes:

- write worker evidence
- commit implementation and evidence
- register `worker.evidence-recorded`
- run independent review
- register reviewer verdict
- fast-forward merge the approved branch into `main`
- run main verification
- register `main-verification`

Do not enter release closeout until task-1 through task-4 are complete and an operator explicitly approves closeout.

## v43 task order

- task-1: App thread and result protocol contracts
- task-2: Workspace and evidence safety
- task-3: Route engine and status reconciliation
- task-4: Daemon, heartbeat, notifications, and progress visibility

## Boundaries

- Active provider boundary remains `claude-code-cli` and `codex-cli` only.
- Do not create raw provider CLI paths or a generic shell runner.
- Do not run mutation, audit, or doctor gates by default for scoped closeout.
- Do not infer status from filenames, branches, prompt text, or frontend state.
- Do not start a v44 follow-on module until v43 closeout or handoff evidence records the remaining blockers.
