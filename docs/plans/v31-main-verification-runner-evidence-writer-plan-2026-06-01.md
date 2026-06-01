# v31 Plan: Main Verification Runner + Evidence Writer

Date: 2026-06-01  
Goal id: `v31-main-verification-runner-evidence-writer`  
Baseline: `v30 verified adoption workspace v2`  
Release name: `v31 Main Verification Runner + Evidence Writer`

## Product purpose

把 reviewer approved / adoption applied 之后的主线验证做成 Workbench 闭环：预览 allowlisted verification plan，执行受控验证操作，生成 main verification evidence draft，并登记 main-verification gate。

## Product spine

```text
Reviewer approved or adoption applied -> verification readiness -> preview allowlisted verification plan -> run verification operation -> write evidence -> register main-verification gate.
```

## Tasks

- task-1: Main verification readiness from explicit state — 用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。
- task-2: Allowlisted verification plan preview — 用户能看清楚将要跑哪些验证命令，不能输入任意 shell。
- task-3: Verification operation console — 长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。
- task-4: Main verification evidence writer — 用户不用手写 main verification evidence。
- task-5: Main-verification gate registration flow — 验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。

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
pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --markdown
```

## Non-goals

- Do not return to the v8 `scan/do/review/verify/status/continue/artifacts` dashboard model.
- Do not build a generic shell runner, browser terminal, model invocation path, new goal framework, new artifact framework, new permission system, or new command DSL.
- Do not let a worker approve its own task.
- Do not infer task approval, main verification, adoption readiness, or release readiness from file names, branch names, commit messages, task titles, prompt text, or frontend state.
- Do not auto-merge, auto-tag, auto-push, or publish a release.
- Do not bypass dry-run / plan-hash / confirm semantics for controlled operations.
