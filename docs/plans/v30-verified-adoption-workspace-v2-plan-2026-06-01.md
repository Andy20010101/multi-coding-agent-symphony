# v30 Plan: Verified Adoption Workspace v2

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Baseline: `v29 active task controlled implementation workspace`  
Release name: `v30 Verified Adoption Workspace v2`

## Product purpose

把 v29 isolated workspace implementation result 正式接入 verified adoption：用户从 Workbench 看到 adoption candidate，预览 adoption plan，inspect/recover patch，再通过受控 confirm 采纳到 main worktree。

## Product spine

```text
Passed isolated run -> adoption candidate -> preview adoption plan -> inspect patch/recovery -> confirm adoption -> show post-apply next action.
```

## Tasks

- task-1: Adoption candidate normalization — 用户知道哪些 v29 implementation run 可以采纳，哪些不能采纳。
- task-2: Adoption plan preview workspace — 用户能在 Workbench 里冻结 adoption plan，而不是直接 git apply。
- task-3: Adoption inspect and recovery view — 采纳失败或中断后，用户能在 Workbench 里看清楚恢复状态。
- task-4: Confirm adoption and post-apply next action — 用户确认 frozen adoption plan 后，结果能进入 main worktree 并出现下一步 review/verification。
- task-5: Adoption tests, docs, and evidence bridge — adoption 是 verified workflow，不是直接 patch/apply 按钮。

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
pnpm --silent symphony goal closeout --goal v30-verified-adoption-workspace-v2 --markdown
```

## Non-goals

- Do not return to the v8 `scan/do/review/verify/status/continue/artifacts` dashboard model.
- Do not build a generic shell runner, browser terminal, model invocation path, new goal framework, new artifact framework, new permission system, or new command DSL.
- Do not let a worker approve its own task.
- Do not infer task approval, main verification, adoption readiness, or release readiness from file names, branch names, commit messages, task titles, prompt text, or frontend state.
- Do not auto-merge, auto-tag, auto-push, or publish a release.
- Do not bypass dry-run / plan-hash / confirm semantics for controlled operations.
