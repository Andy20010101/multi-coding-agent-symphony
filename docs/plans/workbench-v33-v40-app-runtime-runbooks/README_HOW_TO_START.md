# How to start v33-v40

This pack starts the local app runtime line after v32 Release Manager Workspace v2.

## Files

```text
multi-coding-agent-symphony/
  docs/
    plans/
      workbench-v33-v40-app-runtime-runbooks/
        00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
        v33_app-runtime-foundation_goal_runbook_latest.md
        README_HOW_TO_START.md
      v33-app-runtime-foundation-plan-2026-06-02.md
      v33-app-runtime-foundation-execution-prompts-2026-06-02.md
  fixtures/
    contracts/
      goal-runbook.v33-app-runtime-foundation.v1.json
```

## Before starting v33

Use v32 release closeout as the baseline. Start only from a clean main/ref.

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --markdown
```

If v32 closeout still has missing gates, finish the v32 release manager flow before registering v33.

## Register v33

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v33-task0-goal-runbook
```

Paste the Task 0 prompt from:

```text
docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
```

Then register the goal:

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json \
  --goal v33-app-runtime-foundation \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json \
  --goal v33-app-runtime-foundation \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json
pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json
```

## Run each task

For each task:

```bash
pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json
pnpm --silent symphony goal prompt --goal v33-app-runtime-foundation --task <task-id> --role worker --markdown
```

Paste the worker prompt into a worker `/goal` conversation.

After the worker finishes:

- write worker evidence
- commit implementation and evidence
- register `worker.evidence-recorded`
- run independent review
- register reviewer verdict
- merge approved branch to main
- run main verification
- register `main-verification`

Do not start v34 until v33 release closeout has passed, or until a deliberate handoff evidence document records the unresolved blockers.

## v33 task order

- task-1: Local sidecar skeleton and health API
- task-2: Project registry and current project resolver
- task-3: Goal and release state snapshot API
- task-4: App runtime contract, fixtures, and read-only Workbench surface
- task-5: Runtime operator guide and v34 handoff

## v34 starting point

v34 should begin with Action Registry. It should expose available actions and permission previews, but should not create jobs. Job creation belongs in v35.
