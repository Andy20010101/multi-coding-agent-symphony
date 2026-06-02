# App Core v34-v40 Latest-Command /goal Runbooks

Date: 2026-06-02  
Baseline: v33 App Runtime Foundation  
Status: draft handoff pack

## Core correction

Do **not** use the old v8 command surface as the Workbench/App action baseline:

```text
scan / do / review / verify / status / continue / artifacts
```

Those commands can remain compatibility/script commands. The App core continues the current goal/runbook product spine:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Implementation/adoption lanes may use controlled execution/adoption commands only when anchored to an active goal/task and only through an explicit action/job path.

## v34-v40 product loop

```text
v34 action registry
  -> v35 job queue
  -> v36 artifact/evidence index
  -> v37 desktop shell
  -> v38 provider hub
  -> v39 backup/diagnostics/migration
  -> v40 personal workflow router + app core release
```

This is an App kernel loop, not a dashboard polish loop.

## Global product rules

- Every version must implement a user-visible App/Workbench workflow, not another horizontal safety-only layer.
- UI must not execute raw shell commands. UI calls declared `action_id`s only.
- Action Registry is the only button/action source for Web/Desktop/Notch surfaces.
- Job Queue owns execution state. State changes come from explicit backend job/goal events.
- ArtifactStore remains canonical. Artifact/Evidence Index is derived cache/search only.
- Status must come from explicit events and command outputs, not branch names, filenames, task titles, prompt text, or frontend inference.
- Worker and reviewer can be separate subagents/conversations.
- A worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.
- `goal update` is only for worker/task-level events.
- Reviewer verdicts use `goal review`.
- Main verification and release readiness use `goal gate`.
- Workbench/Desktop may preview/confirm only controlled operations with plan hashes and matching context.
- App surfaces must not create a browser terminal, generic shell runner, arbitrary path opener, arbitrary model invocation path, auto-merge, auto-push, auto-tag, or publish path.
- Capability previews are declarations for controlled actions, not a generic permission system for arbitrary commands.
- Provider Hub may show provider health/gates but must not leak secrets.

## Latest command basis

If a command name has drifted, run the matching help command and preserve dry-run then confirm semantics.

```bash
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.<goal-id>.v1.json --goal <goal-id> --dry-run --json
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
pnpm --silent symphony goal closeout --goal <goal-id> --markdown
pnpm --silent symphony next --goal latest --json
```

## Worker event registration pattern

```bash
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Reviewer verdict pattern

```bash
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification gate pattern

```bash
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release readiness pattern

```bash
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-02.md \
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

- [v34 Action Registry Workspace](v34_action-registry-workspace_goal_runbook_latest.md)
- [v35 Job Queue + Run Control Workspace](v35_job-queue-run-control-workspace_goal_runbook_latest.md)
- [v36 Artifact/Evidence Index Workspace](v36_artifact-evidence-index-workspace_goal_runbook_latest.md)
- [v37 Desktop Shell MVP](v37_desktop-shell-mvp_goal_runbook_latest.md)
- [v38 Provider Hub + Capability Profiles](v38_provider-hub-capability-profiles_goal_runbook_latest.md)
- [v39 Backup / Diagnostics / Migration Workspace](v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md)
- [v40 Personal Workflow Router + App Core Release Closeout](v40_personal-workflow-router-app-core-release_goal_runbook_latest.md)
