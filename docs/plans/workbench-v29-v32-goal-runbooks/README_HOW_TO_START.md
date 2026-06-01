# How to start v29-v32

This pack follows the v20-v28 runbook style and continues the Workbench v1 goal/runbook spine.

## Where to put these files

Copy the whole `docs/` folder from this pack into the repository root:

```text
multi-coding-agent-symphony/
  docs/
    plans/
      workbench-v29-v32-goal-runbooks/
        00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
        v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
        v30_verified-adoption-workspace-v2_goal_runbook_latest.md
        v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
        v32_release-manager-workspace-v2_goal_runbook_latest.md
        README_HOW_TO_START.md
      v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
      v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
      v30-verified-adoption-workspace-v2-plan-2026-06-01.md
      v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
      v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
      v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
      v32-release-manager-workspace-v2-plan-2026-06-01.md
      v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
```

## First commit

```bash
git checkout main
git pull --ff-only
git status -sb

mkdir -p docs/plans/workbench-v29-v32-goal-runbooks
# copy files into the paths above

pnpm check
pnpm test
git diff --check

git add docs/plans/workbench-v29-v32-goal-runbooks \
  docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md \
  docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md \
  docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md \
  docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md \
  docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md \
  docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md \
  docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md \
  docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md

git commit -m "Add v29-v32 Workbench goal runbooks"
```

## Before starting v29

Run a quick v28 baseline normalization from current `main`:

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
pnpm audit --audit-level high
pnpm mcas doctor
git diff --check
pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --json
```

If closeout still says v28 is not `release.ready`, decide whether to register the remaining v28 release gates before v29. Do not spend a whole product version on this unless the repo state is inconsistent.

## Start v29 Task 0

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v29-task0-goal-runbook
```

Paste the Task 0 prompt from:

```text
docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
```

Then register the goal:

```bash
pnpm --silent symphony goal init \
  --from docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md \
  --goal v29-active-task-controlled-implementation-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md \
  --goal v29-active-task-controlled-implementation-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
```

## Run each task

For each task, use this order:

```bash
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
```

Paste the worker prompt into a worker `/goal` conversation.

After worker finishes, write evidence, commit, register `worker.evidence-recorded`.

Then open an independent reviewer `/goal` conversation:

```bash
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
```

After reviewer approval, merge to main and run main verification. Register `main-verification` with `goal gate`.

Do not start v30 until v29 is closed or deliberately marked as a deferred baseline.
