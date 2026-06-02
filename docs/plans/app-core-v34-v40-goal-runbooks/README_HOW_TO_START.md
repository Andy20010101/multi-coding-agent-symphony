# How to start v34-v40 App Core work

Date: 2026-06-02  
Baseline: v33 App Runtime Foundation

## 1. Put these files in the repository

Copy this directory into the repo root so paths resolve as:

```text
docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
docs/plans/app-core-v34-v40-goal-runbooks/...
```

## 2. Start with v34 only

Do not run v34-v40 as one large implementation. Register and execute v34 first:

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
git diff --check

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json \
  --goal v34-action-registry-workspace \
  --dry-run --json
```

Then confirm using the returned plan hash:

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json \
  --goal v34-action-registry-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Check next action:

```bash
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
pnpm --silent symphony goal prompt --goal v34-action-registry-workspace --task task-1 --role worker --markdown
```

## 3. Branch model

Each task gets its own branch:

```text
v34-task-1-action-manifest-contract
v34-task-2-action-availability-resolver
v34-task-3-action-preview-api
v34-task-4-workbench-action-panel-binding
v34-task-5-action-registry-evidence-migration-guide
```

Keep the same branch pattern for v35-v40.

## 4. Worker/reviewer split

- Worker implements only one task and writes worker evidence.
- Reviewer is a separate conversation/subagent and writes review evidence.
- Main verifier runs only after reviewer approval and writes main verification evidence.

Do not let the worker approve its own work.

## 5. After v34 release

Use v34 release closeout evidence to initialize v35:

```bash
pnpm --silent symphony next --goal latest --json
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json \
  --goal v35-job-queue-run-control-workspace \
  --dry-run --json
```

Repeat for v36-v40.
