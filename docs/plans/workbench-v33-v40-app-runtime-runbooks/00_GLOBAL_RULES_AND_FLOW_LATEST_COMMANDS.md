# Workbench v33-v40 App Runtime Runbooks

Date: 2026-06-02
Baseline: v32 Release Manager Workspace v2
Status: draft handoff pack

## Product loop

```text
v33 app runtime foundation
  -> v34 action registry
  -> v35 job queue and run control
  -> v36 artifact/evidence index
  -> v37 desktop shell
  -> v38 provider hub
  -> v39 backup/diagnostics
  -> v40 personal workflow router
```

This sequence keeps the v20-v32 goal/runbook workflow as the kernel. Web Workbench, Desktop Shell, menu bar, CLI, and future surfaces must consume the same kernel action/runtime layer.

## Global product rules

- Every version must implement a user-visible workflow or runtime capability with a testable path.
- Keep the v20-v32 goal/runbook/next-action command spine:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

- Reuse existing goal commands, event semantics, runbook contracts, operation registry, adoption flow, verification gates, release gates, and Workbench route contracts.
- CLI, Web, Desktop Shell, and menu bar entrypoints must not fork separate workflow semantics.
- Status must come from explicit events, gates, command outputs, runtime contracts, or stored evidence.
- Do not infer task completion, approval, main verification, release readiness, adoption state, or provider readiness from branch names, filenames, commit messages, task titles, prompt text, or frontend state.
- Worker and reviewer can be separate subagents/conversations.
- A worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.
- `goal update` is only for worker/task-level events.
- Reviewer verdicts use `goal review`.
- Main verification and release readiness use `goal gate`.
- Workbench may preview/confirm only controlled operations with plan hashes and matching context.

## Runtime boundary by version

- v33 is read-only. It may start a sidecar and return runtime/project/goal snapshots, but it must not execute actions.
- v34 declares available actions and permission previews. It must not create jobs.
- v35 creates and controls jobs. It must preserve action registry permission previews and explicit event mapping.
- v36 indexes artifacts/evidence for search and browsing. ArtifactStore remains the canonical evidence source.
- v37 adds Desktop Shell. It must call the same sidecar/runtime APIs as Web Workbench.
- v38 adds Provider Hub. It must not leak secrets into evidence, logs, or app state snapshots.
- v39 adds backup, migration, diagnostics, and restore flows.
- v40 adds workflow routing before a task enters Workbench.

## Commands to avoid as top-level app model

Older compatibility/script commands such as:

```text
scan / do / review / verify / status / continue / artifacts
```

may still exist. Do not use them as the app action baseline. App surfaces should call runtime/action/job APIs that are anchored to goal/task/evidence context.

Controlled implementation/adoption lanes may still use existing commands when anchored to an active goal/task:

```bash
symphony do --write --json "<task>"
symphony do --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --json
symphony adopt --inspect <adoption-id> --json
symphony adopt --confirm <adoption-id> --json
```

## Latest command basis

If a command name has drifted, run the matching help command and preserve dry-run then confirm semantics.

```bash
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from-json <controlled-runbook-fixture> --goal <goal-id> --dry-run --json
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

Reviewer verdict pattern:

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

Main verification gate pattern:

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

Release readiness pattern:

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

pnpm check
pnpm test
pnpm workbench:build
git diff --check

# Worker writes evidence doc, commits implementation + evidence, then records worker event.
# Reviewer reads plan, evidence, tests, and diff; reviewer writes review evidence.
# If approved, merge to main and run main verification.

git checkout main
git pull --ff-only
git merge --ff-only <task-branch>
pnpm check
pnpm test
pnpm workbench:build
git diff --check
# Write main verification evidence and register main-verification gate.
```

## v37-v42 scoped release gates

For v37-v42 scoped closeout, the controlled runbook fixture `releaseGates` is the source of truth. When the fixture lists only:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

the default local evidence commands are:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Docs-updated evidence is written evidence tied to the task or closeout document. Do not add `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, or `pnpm mcas doctor` to a scoped v37-v42 closeout unless the active runbook fixture explicitly includes that gate or the operator requests a repository tag/full release validation.

For v43 and later, the active version plan or runbook must explicitly say whether this scoped gate set continues unchanged or is replaced.

## Version sequence

- [v33 App Runtime Foundation](v33_app-runtime-foundation_goal_runbook_latest.md)
- v34 Action Registry
- v35 Job Queue and Run Control
- v36 Artifact and Evidence Index
- v37 Desktop Shell MVP
- v38 Provider Hub
- v39 Backup, Migration, and Diagnostics
- v40 Personal Workflow Router
