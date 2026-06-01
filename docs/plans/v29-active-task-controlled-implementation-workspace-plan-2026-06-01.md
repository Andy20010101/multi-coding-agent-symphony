# v29 Plan: Active Task Controlled Implementation Workspace

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Baseline: `v28 Workbench v1 merged goal/runbook chain`  
Release name: `v29 Active Task Controlled Implementation Workspace`

## Product purpose

把 active goal task 接到受控实现内核：用户从 Workbench 预览 `symphony do --write` implementation plan，确认 frozen plan 后在 isolated workspace 运行，并把结果带回 worker evidence 登记路径。

## Product spine

```text
Open active task -> check implementation eligibility -> preview controlled implementation plan -> confirm isolated workspace run -> watch operation console -> inspect result -> register worker evidence.
```

## Tasks

- task-1: Active task implementation eligibility — 用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。
- task-2: Controlled implementation plan preview — 用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。
- task-3: Confirm isolated workspace execution — 用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。
- task-4: Operation console and run-result bridge — 用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。
- task-5: Worker evidence handoff after implementation run — 实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。

## Release gates

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

## Required validation

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Release-manager validation may additionally run:

```bash
pnpm test:mutation:gate
pnpm audit --audit-level high
pnpm mcas doctor
pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --markdown
```

## Non-goals

- Do not return to the v8 `scan/do/review/verify/status/continue/artifacts` dashboard model.
- Do not build a generic shell runner, browser terminal, model invocation path, new goal framework, new artifact framework, new permission system, or new command DSL.
- Do not let a worker approve its own task.
- Do not infer task approval, main verification, adoption readiness, or release readiness from file names, branch names, commit messages, task titles, prompt text, or frontend state.
- Do not auto-merge, auto-tag, auto-push, or publish a release.
- Do not bypass dry-run / plan-hash / confirm semantics for controlled operations.
