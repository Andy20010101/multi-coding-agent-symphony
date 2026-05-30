# Workbench v20-v28 Latest-Command /goal Runbooks

Date: 2026-05-29  
Correction: these runbooks replace the earlier v8-command-centered pack.

## Core correction

Do **not** use the old v8 command surface as the primary Workbench action baseline:

```text
scan / do / review / verify / status / continue / artifacts
```

Those commands may still exist and some remain useful as lower-level or compatibility capabilities, but the Workbench v20-v28 product spine must follow the latest goal/runbook flow established by v18-v19:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Implementation/adoption lanes may use the latest controlled execution/adoption commands only when they are anchored to the active goal/task:

```text
symphony do --write --json "<task>"
symphony do --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --json
symphony adopt --inspect <adoption-id> --json
symphony adopt --confirm <adoption-id> --json
```

These are not top-level generic Workbench buttons. They are goal/task-specific lanes.

## Global product rules

- Every version must implement a user-visible Workbench workflow, not another horizontal safety layer.
- At least 70% of tasks should be Workbench/product workflow work.
- Reuse v18/v19 goal commands and event semantics.
- Do not introduce a new goal framework, artifact framework, permission system, command DSL, or generic shell runner.
- Worker and reviewer can be separate subagents/conversations.
- A worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.
- Status must come from explicit events and command outputs, not from branch names, filenames, task titles, or frontend inference.
- `goal update` is only for worker/task-level events.
- Reviewer verdicts use `goal review`.
- Main verification and release readiness use `goal gate`.

## Latest command basis

Assume v19 has landed before starting v20. If a command name has drifted, run the matching help command and preserve the semantics.

```bash
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from <plan-doc> --goal <goal-id> --dry-run --json
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
pnpm --silent symphony goal closeout --goal <goal-id> --markdown
pnpm --silent symphony next --goal latest --json
```

Event registration pattern:

```bash
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-05-29.md \
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
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-05-29.md \
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
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-05-29.md \
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
  --evidence-ref docs/plans/<version>-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-05-29.md \
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

- [v20 Workbench Active Goal Surface](v20_workbench-active-goal-surface_goal_runbook_latest.md)
- [v21 Workbench Goal Event Registration](v21_workbench-goal-event-registration_goal_runbook_latest.md)
- [v22 Prompt Handoff Workspace](v22_prompt-handoff-workspace_goal_runbook_latest.md)
- [v23 Goal Operation Run Console](v23_goal-operation-run-console_goal_runbook_latest.md)
- [v24 Main Verification Workbench](v24_main-verification-workbench_goal_runbook_latest.md)
- [v25 Controlled Implementation Lane](v25_controlled-implementation-lane_goal_runbook_latest.md)
- [v26 Verified Adoption Workbench](v26_verified-adoption-workbench_goal_runbook_latest.md)
- [v27 Review Revision Loop](v27_review-revision-loop_goal_runbook_latest.md)
- [v28 Workbench v1 Release](v28_workbench-v1-release_goal_runbook_latest.md)
