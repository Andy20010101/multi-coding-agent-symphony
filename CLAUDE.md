# CLAUDE.md

## Role

Claude agents are Medium execution workers for this repository. Codex High is the main controller. Claude implements scoped tasks, runs targeted validation, writes evidence, and reports blockers. Claude does not make release decisions.

## Source Plan

Follow the v34-v40 App Core plan, not the old v8 command surface.

Primary plan files:

- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/README_HOW_TO_START.md`

Version runbooks:

- `docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`

Goal fixtures:

- `fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v36-artifact-evidence-index-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json`

## Product Spine

The App Core line continues the goal/runbook product workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Do not model the App as generic browser buttons for:

```text
scan / do / review / verify / status / continue / artifacts
```

Those commands may remain compatibility or script commands. They are not the Workbench/App action baseline.

## Version Sequence

Work through one version at a time. Do not implement v35-v40 in one branch.

| Version | Goal id | Product value |
|---|---|---|
| v34 | `v34-action-registry-workspace` | Workbench buttons become declared controlled actions. |
| v35 | `v35-job-queue-run-control-workspace` | Actions become recoverable jobs. |
| v36 | `v36-artifact-evidence-index-workspace` | Evidence becomes browsable and searchable app memory while ArtifactStore stays canonical. |
| v37 | `v37-desktop-shell-mvp` | Web Workbench enters a desktop shell without bypassing the kernel. |
| v38 | `v38-provider-hub-capability-profiles` | Codex, Claude, Kiro, and DeepSeek become controlled provider lanes. |
| v39 | `v39-backup-diagnostics-migration-workspace` | App data can be backed up, diagnosed, migrated, and restored safely. |
| v40 | `v40-personal-workflow-router-app-core-release` | Inbox/capture routes work into the App Core and closes out the final app kernel release. |

## Current State

- v34 is released as `v34 Action Registry Workspace`.
- `v34` tag target before follow-up docs cleanup: `da4081e`.
- Current `main` after README/operator docs cleanup: `1a92347`.
- `main` and `origin/main` are expected to match at `1a92347`.
- v34 release evidence:
  - `docs/plans/v34-release-evidence-2026-06-02.md`
  - `docs/plans/v34-tag-evidence-2026-06-02.md`
- v34 follow-up docs cleanup updated:
  - `README.md`
  - `docs/troubleshooting.md`
  - `docs/workbench-operator-guide.md`

v34 delivered:

- `action-manifest.v1`
- `action-availability.v1`
- `action-preview.v1`
- `GET /api/actions/manifest`
- `GET /api/actions/availability`
- `GET /api/actions/preview`
- `symphony actions manifest|availability|preview`
- Workbench Action Registry Panel binding
- `docs/action-registry-migration-guide.md`

v35 starts from v34. v35 must create recoverable jobs from controlled Action Registry preview data. It must not let frontend code build shell commands directly.

## Local Worktree Notes

The local repo was cleaned after the v34 release:

- No uncommitted changes were left in the remaining worktrees at cleanup time.
- No local commits were left outside remote refs at cleanup time.
- Old v24-v26/v32 task worktrees and stale local branches were removed.
- Backup bundle and dirty-worktree patch backups were written to `/tmp/mcas-git-cleanup-20260602-165402`.

Remaining worktrees at cleanup time:

```text
/Users/andy/Documents/project/multi-coding-agent-symphony  v33-task-1-local-sidecar-health-api
/private/tmp/v24-task-3-mainverify-main                    main
```

Use `/private/tmp/v24-task-3-mainverify-main` or a controller-created worktree from `main` for v35+ work. The `/Users/andy/Documents/project/multi-coding-agent-symphony` checkout is a v33 task branch and may not contain the v34-v40 App Core materials.

## Planning Constraints

- Date context: Tuesday, 2026-06-02.
- Deadline: 2026-06-07.
- Practical work window: about three full workdays plus a half day on Saturday.
- Weekly model limit has about 40% remaining.
- The user has DeepSeek API budget available through Claude Code.

Use Claude/DeepSeek for Medium execution work:

- worker implementation
- targeted test failure analysis
- evidence drafts
- docs drafts
- focused review checklists

Reserve Codex High for:

- controller decisions
- task split and assignment
- cross-task consistency
- merge to `main`
- release gates
- tag and GitHub release operations

## Global Product Rules

- Every version must implement a user-visible App/Workbench workflow.
- UI must not execute raw shell commands.
- UI calls declared `action_id`s only.
- Action Registry is the button/action source for Web, Desktop, Notch/Menu Bar, and CLI surfaces.
- Job Queue owns execution state from v35 onward.
- Job state changes come from explicit backend job or goal events.
- ArtifactStore remains canonical.
- Artifact/Evidence Index is derived cache/search only.
- Status must come from explicit events and command outputs, not branch names, filenames, task titles, prompt text, or frontend inference.
- Workbench/Desktop may preview/confirm only controlled operations with plan hashes and matching context.
- Provider Hub may show provider health and gates but must not leak secrets.
- Worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.

Do not add:

- generic shell runner
- browser terminal
- arbitrary command palette
- arbitrary model invocation path
- arbitrary local file opener
- artifact download path
- auto-merge
- auto-push
- auto-tag
- publish path
- release-ready inference
- second source of truth replacing ArtifactStore or goal events

## Standard Role Split

Every task uses separate roles:

1. Worker implements one task and writes worker evidence.
2. Reviewer independently reviews diff, evidence, tests, and boundaries.
3. Main verifier runs only after reviewer approval, merges ff-only into clean `main`, records main-verification evidence, and registers the gate.

Claude agents may be workers or reviewers. Codex High stays controller and release manager.

## Version Bootstrap Pattern

Use Task 0 for each version only when the controller asks to register that version goal.

```sh
git checkout main
git pull --ff-only
git status -sb

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.<goal-id>.v1.json \
  --goal <goal-id> \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.<goal-id>.v1.json \
  --goal <goal-id> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal next --goal <goal-id> --json
```

For v35:

```sh
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json \
  --goal v35-job-queue-run-control-workspace \
  --dry-run --json
```

## Standard Task Loop

Each task gets its own branch:

```text
v<version>-task-<n>-<short-name>
```

For v35, expected branches are:

```text
v35-task0-goal-runbook
v35-task-1-job-model-contract
v35-task-2-create-job-from-controlled-action
v35-task-3-job-event-timeline-log-stream
v35-task-4-pause-cancel-resume-recover
v35-task-5-workbench-job-console-binding
```

Worker startup:

```sh
git status --short --branch
pwd
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal next --goal <goal-id> --json
```

Before editing, report:

- current branch and cwd
- assigned goal id and task id
- relevant runbook section
- files expected to change
- targeted tests expected to run
- blockers or missing materials

Stop if the branch or task does not match the controller assignment.

## Event Registration Patterns

Worker evidence:

```sh
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor claude-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-06-02.md \
  --dry-run --json
```

Reviewer verdict:

```sh
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer claude-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-06-02.md \
  --dry-run --json
```

Main verification gate:

```sh
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-06-02.md \
  --dry-run --json
```

Release readiness:

```sh
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-06-02.md \
  --dry-run --json
```

Only confirm dry-runs after the controller verifies the plan hash and context.

## Validation Defaults

Default task validation:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal <goal-id> --json
```

Add version-specific validation only when the implementation exposes a real script or route. Do not invent fake scripts.

Action Registry compatibility checks for v35+:

```sh
pnpm --silent symphony actions manifest --json
pnpm --silent symphony actions availability --json
pnpm --silent symphony actions preview --action goal.worker-evidence.record --json
```

Run full `pnpm test` when a task touches shared contracts, console routing, Workbench API/client code, job queue state, artifact index state, provider profile state, or release verification.

## Evidence Requirements

Evidence should be short and factual:

- goal id and task id
- branch and commit, if committed
- files changed
- user-visible App/Workbench path changed
- commands run with exit status
- contract names touched
- boundaries confirmed
- known risks or next-task handoff

For v35+ evidence, explicitly state whether the task added any of these:

- job creation
- job execution
- shell execution
- model invocation
- git write
- release write
- artifact download
- local file open
- merge, push, tag, or publish path

If the task intentionally adds one of them, cite the runbook acceptance criteria and exact safety boundary.

Do not say a gate passed unless the command was run and the output supports it. Do not infer release readiness from tests, branch names, filenames, Workbench text, or commit messages.

## Report Writing Rules

- Do not write audience labels into the document body.
- Use normal workplace language.
- Titles should describe the content directly.
- Every paragraph should point to concrete files, versions, commands, evidence refs, validation steps, or recovery paths.
- Do not invent numbers.
- Avoid formulaic filler.
- Remove polite filler and self-explanations.

## Handoff Format

End every task response with:

```text
Task:
Branch:
Files changed:
Validation:
Evidence:
Risks:
Next suggested command:
```

If blocked, include the exact command, output summary, and the smallest decision needed from the controller.
