# v31 Plan: Main Verification Runner + Evidence Writer

Date: 2026-06-01
Goal id: `v31-main-verification-runner-evidence-writer`
Baseline: `v30 verified adoption workspace v2`
Release name: `v31 Main Verification Runner + Evidence Writer`
Canonical runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`

## Product Purpose

把 reviewer approved / adoption applied 之后的主线验证做成 Workbench 闭环：预览 allowlisted verification plan，执行受控验证操作，生成 main verification evidence draft，并登记 main-verification gate。

## Product Spine

```text
Reviewer approved or adoption applied -> verification readiness -> preview allowlisted verification plan -> run verification operation -> write evidence -> register main-verification gate.
```

## Current Command Surface

Workbench 主线使用当前 goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` commands can remain as compatibility/script commands. They are not the Workbench action baseline for v31.

## Non-Goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval, adoption readiness, main verification, or release readiness from file names, branch names, commit messages, prompt text, task titles, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge, auto-tag, auto-push, or publish unless this exact version/task explicitly says so and the release manager has explicit evidence.

## Task Plan

### task-1: Main verification readiness from explicit state

Branch: `v31-task-1-main-verification-readiness-from-explicit-state`
Worker evidence: `docs/plans/v31-task-1-worker-evidence-2026-06-01.md`
Review evidence: `docs/plans/v31-task-1-review-evidence-2026-06-01.md`
Main verification evidence: `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md`

User-visible value: 用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。

Implementation scope: 建立 readiness model：只读取 goal-status、events、adoption inspect/run state 和 reviewer verdict，不从前端/文件名推断。

Acceptance:
- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

Prompts:
- Worker prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-1-main-verification-readiness-from-explicit-state`
- Reviewer prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-1-main-verification-readiness-from-explicit-state`
- Main verification prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-1-main-verification-readiness-from-explicit-state`

### task-2: Allowlisted verification plan preview

Branch: `v31-task-2-allowlisted-verification-plan-preview`
Worker evidence: `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`
Review evidence: `docs/plans/v31-task-2-review-evidence-2026-06-01.md`
Main verification evidence: `docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md`

User-visible value: 用户能看清楚将要跑哪些验证命令，不能输入任意 shell。

Implementation scope: 增加 allowlisted verification plan preview：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，可按 task scope 增加受控命令，不接受任意 command。

Acceptance:
- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

Prompts:
- Worker prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-2-allowlisted-verification-plan-preview`
- Reviewer prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-2-allowlisted-verification-plan-preview`
- Main verification prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-2-allowlisted-verification-plan-preview`

### task-3: Verification operation console

Branch: `v31-task-3-verification-operation-console`
Worker evidence: `docs/plans/v31-task-3-worker-evidence-2026-06-01.md`
Review evidence: `docs/plans/v31-task-3-review-evidence-2026-06-01.md`
Main verification evidence: `docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md`

User-visible value: 长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。

Implementation scope: 把 verification command suite 接进 operation registry 和 Workbench console；保存 command result contract，不把运行成功自动等于 gate passed。

Acceptance:
- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

Prompts:
- Worker prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-3-verification-operation-console`
- Reviewer prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-3-verification-operation-console`
- Main verification prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-3-verification-operation-console`

### task-4: Main verification evidence writer

Branch: `v31-task-4-main-verification-evidence-writer`
Worker evidence: `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`
Review evidence: `docs/plans/v31-task-4-review-evidence-2026-06-01.md`
Main verification evidence: `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md`

User-visible value: 用户不用手写 main verification evidence。

Implementation scope: 根据验证结果、goal/task/run refs、review evidence、adoption refs 生成 evidence draft；draft 需要 operator/reviewer 检查，不自动 declare passed。

Acceptance:
- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

Prompts:
- Worker prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-4-main-verification-evidence-writer`
- Reviewer prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-4-main-verification-evidence-writer`
- Main verification prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-4-main-verification-evidence-writer`

### task-5: Main-verification gate registration flow

Branch: `v31-task-5-main-verification-gate-registration-flow`
Worker evidence: `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`
Review evidence: `docs/plans/v31-task-5-review-evidence-2026-06-01.md`
Main verification evidence: `docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md`

User-visible value: 验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。

Implementation scope: 接入 existing `goal gate --gate main-verification --status passed` preview/confirm；补测试、docs、release evidence。

Acceptance:
- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

Prompts:
- Worker prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-5-main-verification-gate-registration-flow`
- Reviewer prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-5-main-verification-gate-registration-flow`
- Main verification prompt: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md#task-5-main-verification-gate-registration-flow`

## Common Event Registration Commands

Worker evidence uses `goal update` dry-run and confirm:

```bash
pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor <worker-id> \
  --evidence-ref <worker-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor <worker-id> \
  --evidence-ref <worker-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Independent review uses `goal review` dry-run and confirm:

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --verdict approved \
  --reviewer <reviewer-id> \
  --evidence-ref <review-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --verdict approved \
  --reviewer <reviewer-id> \
  --evidence-ref <review-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Main verification uses `goal gate` dry-run and confirm:

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier <main-verifier-id> \
  --evidence-ref <main-verification-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier <main-verifier-id> \
  --evidence-ref <main-verification-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release Closeout

Release evidence: `docs/plans/v31-release-evidence-2026-06-01.md`

Required release gates:
- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Release-manager validation:

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --markdown
```

Release gates use the same dry-run/confirm shape for each required gate:

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate <release-gate> \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate <release-gate> \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Only after every task has worker evidence, independent review, main verification evidence, main-verification gate, and required release gates may a release manager run the `release.ready` dry-run/confirm path. Task-0 does not register that gate.

## Task-0 Validation

Required:

```bash
pnpm check
pnpm test
git diff --check
```

Context validation:

```bash
pnpm workbench:build
```
