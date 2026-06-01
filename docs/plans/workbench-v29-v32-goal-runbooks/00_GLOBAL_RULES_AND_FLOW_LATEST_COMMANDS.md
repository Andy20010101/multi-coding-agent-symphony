# Workbench v29-v32 Latest-Command /goal Runbooks

Date: 2026-06-01  
Baseline: v28 Workbench v1 merged goal/runbook chain  
Status: draft handoff pack

## Core correction

Do **not** use the old v8 command surface as the Workbench action baseline:

```text
scan / do / review / verify / status / continue / artifacts
```

Those commands can remain compatibility/script commands, but the Workbench v29-v32 product spine continues the v20-v28 goal/runbook flow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Implementation/adoption lanes may use the existing controlled execution/adoption commands only when anchored to an active goal/task:

```bash
symphony do --write --json "<task>"
symphony do --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --json
symphony adopt --inspect <adoption-id> --json
symphony adopt --confirm <adoption-id> --json
```

These are not generic browser buttons. They are goal/task-scoped Workbench workflows.

## v29-v32 product loop

```text
v29 active task implementation
  -> v30 verified adoption
  -> v31 main verification + evidence
  -> v32 release manager closeout
```

This is a backend/workbench-kernel loop, not a dashboard polish loop.

## Global product rules

- Every version must implement a user-visible Workbench workflow, not another horizontal safety layer.
- At least 70% of tasks should be Workbench/product workflow work.
- Reuse v18-v28 goal commands, event semantics, operation registry, runbook contracts, and Workbench route contracts.
- Do not introduce a new goal framework, artifact framework, permission system, command DSL, generic shell runner, or browser terminal.
- Worker and reviewer can be separate subagents/conversations.
- A worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.
- Status must come from explicit events and command outputs, not from branch names, filenames, task titles, prompt text, or frontend inference.
- `goal update` is only for worker/task-level events.
- Reviewer verdicts use `goal review`.
- Main verification and release readiness use `goal gate`.
- Workbench may preview/confirm only controlled operations with plan hashes and matching context.
- Workbench must not invoke arbitrary shell commands, models, agents, merge, push, tag, publish, download artifacts, open local files, or accept arbitrary local paths.

## Latest command basis

If a command name has drifted, run the matching help command and preserve the dry-run then confirm semantics.

```bash
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from <plan-doc> --goal <goal-id> --dry-run --json
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
pnpm --silent symphony goal closeout --goal <goal-id> --markdown
pnpm --silent symphony next --goal latest --json
```

Worker event registration pattern:

```bash
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Reviewer verdict pattern:

```bash
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Main verification gate pattern:

```bash
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Release readiness pattern:

```bash
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Standard branch loop

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal next --goal <goal-id> --json

git checkout -b <task-branch>
# Paste the worker prompt into a Codex /goal conversation or worker subagent.
# Worker implements only the selected task.

pnpm check
pnpm test
pnpm workbench:build
git diff --check

# Worker writes evidence doc, commits implementation + evidence, then records worker event.

# Open a separate reviewer /goal conversation or reviewer subagent.
# Reviewer reads plan, evidence, tests, and diff; reviewer writes review evidence.
# Register reviewer verdict.

# If approved:
git checkout main
git pull --ff-only
git merge --ff-only <task-branch>
pnpm check
pnpm test
pnpm workbench:build
git diff --check
# Write main verification evidence and register main-verification gate.
git push origin main
```

## Version sequence

- [v29 Active Task Controlled Implementation Workspace](v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md)
- [v30 Verified Adoption Workspace v2](v30_verified-adoption-workspace-v2_goal_runbook_latest.md)
- [v31 Main Verification Runner + Evidence Writer](v31_main-verification-runner-evidence-writer_goal_runbook_latest.md)
- [v32 Release Manager Workspace v2](v32_release-manager-workspace-v2_goal_runbook_latest.md)

## Before starting v29

Run a small v28 baseline normalization on current `main` if v28 release gates and README/tag wording are not yet clean:

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

Do not spend a full product version on bookkeeping. Use it only to ensure v29 starts from a clean main/ref.
