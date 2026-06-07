# v43 Goal Supervisor Latest-Command /goal Runbooks

Date: 2026-06-07
Baseline: v42 Goal Supervisor Runtime Context Loop
Status: planning pack

## Command Spine

Keep the current goal/runbook workflow as the kernel:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Do not fall back to branch names, filenames, prompt text, frontend state, or chat prose to decide task status.

## Historical Baseline

v43 starts from tracked v42 repository files, not only from managed `.symphony` state:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

## Provider Boundary

v43 does not change the active provider boundary established in v41:

```text
claude-code-cli
codex-cli
```

Gemini CLI, Kiro CLI, and DeepSeek are not active providers for v43 planning or implementation. When v43 surfaces provider progress, it may only consume sanitized v41 runner state, operation ids, and artifact refs. It must not create a raw provider CLI path or a generic shell runner.

## Global Product Rules

- v43 is a stabilization release for the supervisor runtime, not a provider expansion release.
- Child threads must be bound to explicit goal/task/role context and bounded terminal events.
- Result consumption must use explicit result blocks and validated fields, not raw chat summaries.
- Workspace preparation, dependency readiness, and evidence-location checks must happen before event registration.
- Supervisor route decisions must come from append-only events plus validated results.
- Reviewer approval is not main verification.
- Release closeout must remain blocked until explicit operator authorization exists.
- Daemon health, manual ticks, and runner progress must stay separate.
- UI and renderer code must not execute raw shell commands, raw provider CLIs, merge, push, tag, publish, or self-approve.

## Latest Commands

```sh
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from-json <controlled-runbook-fixture> --goal <goal-id> --dry-run --json
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
pnpm --silent symphony goal closeout --goal <goal-id> --markdown
pnpm --silent symphony next --goal latest --json
```

## Worker Event Registration

```sh
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-07.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-07.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Reviewer Verdict Registration

```sh
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-07.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-07.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main Verification Gate Registration

```sh
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-07.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-07.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release Readiness Registration

```sh
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-07.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-07.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Scoped Release Gates

The v43 fixture explicitly inherits the scoped closeout gate set used in v37-v42:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

Default local evidence commands:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Do not run `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, `pnpm mcas doctor`, tag, push, publish, or raw provider CLI commands unless the active runbook fixture or the operator explicitly requires them.

## Standard Branch Loop

```sh
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal next --goal <goal-id> --json

git checkout -b <task-branch>
# Paste the worker prompt into a /goal conversation or worker subagent.

pnpm check
pnpm test
pnpm workbench:build
git diff --check

# Worker writes evidence and registers worker.evidence-recorded.
# Reviewer is independent and registers goal review.
# Main verifier fast-forwards main, reruns gates, writes evidence, and registers main-verification.
```

## Version Sequence

- [v43 Goal Supervisor Stabilization](v43_goal-supervisor-stabilization_goal_runbook_latest.md)
