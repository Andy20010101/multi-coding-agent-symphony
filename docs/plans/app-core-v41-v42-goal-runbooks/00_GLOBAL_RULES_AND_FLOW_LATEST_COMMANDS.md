# v41-v42 App Runtime Runbooks

Date: 2026-06-06

Baseline: v40 Personal Workflow Router + App Core Release Closeout

## Product Loop

```text
v41 controlled CLI provider runner and backend completion
  -> v42 goal supervisor runtime context loop
```

v41 keeps the v20-v40 goal/runbook workflow as the kernel. CLI, Web Workbench, Desktop Shell, menu bar, and future supervisor surfaces must consume the same backend contracts and explicit event semantics.

## Provider Boundary

v41 active providers are exactly:

```text
claude-code-cli
codex-cli
```

Gemini CLI, Kiro CLI, and DeepSeek are not v41 active providers. DeepSeek may remain a future sanitized backend profile reference only. No v41 task should route work, real CLI gates, or Workbench controls to Gemini, Kiro, or DeepSeek.

Provider CLI execution in v41 must use a controlled backend runner. The runner may execute only backend-owned provider command templates for the active goal/task context. It must reject arbitrary shell text, arbitrary paths, renderer-submitted commands, and provider ids outside the active provider allowlist.

## Command Spine

Keep the current goal/runbook/next-action command spine:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

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

Worker event registration:

```sh
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-06.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-06.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Reviewer verdict registration:

```sh
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-06.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-06.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Main verification gate registration:

```sh
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-06.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-06.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Release readiness registration:

```sh
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-06.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-06.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Scoped Release Gates

For v41 scoped closeout, the controlled runbook fixture `releaseGates` is the source of truth. When the fixture lists only:

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

Docs-updated evidence is written evidence tied to the task or closeout document. Do not run mutation, audit, doctor, tag, publish, raw `claude`, raw `codex`, Kiro, Gemini, DeepSeek, or arbitrary shell commands for v41 scoped closeout unless a later controlled fixture/schema explicitly adds that gate.

## v42 Boundary

v42 is `Goal Supervisor Runtime Context Loop`. It should productize the local supervisor context loop, leases, fresh-controller dispatch, durable compact state, and daemon handoff. v41 can preserve state and handoff context for v42, but must not implement v42 controller lifecycle or supervisor daemon write behavior.
