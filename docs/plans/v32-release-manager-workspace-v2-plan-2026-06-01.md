# v32 Plan: Release Manager Workspace v2

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Baseline: `v31 main verification runner + evidence writer`  
Release name: `v32 Release Manager Workspace v2`

## Product purpose

把 release manager 收口做成 Workbench v2 能力：在干净 main/ref 上解析 release baseline，运行/记录 release gates，生成 release/tag evidence，并通过受控 `release.ready` gate 完成版本闭环。

## Product spine

```text
All tasks main-verified -> clean main/ref baseline -> release checklist -> record gates -> write release/tag evidence -> declare release.ready -> next-version handoff.
```

## Tasks

- task-1: Clean release baseline resolver — release manager 不再在 dirty fallback checkout 上做最终判断。
- task-2: Release gate checklist recorder — release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。
- task-3: Release and tag evidence workspace — tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。
- task-4: Release.ready closeout confirm — 所有 release gates passed 后，用户能受控声明 `release.ready`。
- task-5: Next-version handoff generator — v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。

## Release gates

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.mutation-gate`
- `release.audit-high`
- `release.diff-check`
- `release.mcas-doctor`
- `release.docs-updated`
- `release.tag-evidence`

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
pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --markdown
```

## Non-goals

- Do not return to the v8 `scan/do/review/verify/status/continue/artifacts` dashboard model.
- Do not build a generic shell runner, browser terminal, model invocation path, new goal framework, new artifact framework, new permission system, or new command DSL.
- Do not let a worker approve its own task.
- Do not infer task approval, main verification, adoption readiness, or release readiness from file names, branch names, commit messages, task titles, prompt text, or frontend state.
- Do not auto-merge, auto-tag, auto-push, or publish a release.
- Do not bypass dry-run / plan-hash / confirm semantics for controlled operations.
