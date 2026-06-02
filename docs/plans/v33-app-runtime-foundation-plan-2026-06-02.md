# v33 Plan: App Runtime Foundation

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Baseline: `v32 Release Manager Workspace v2`
Release name: `v33 App Runtime Foundation`

## Product purpose

在不改变 v32 workflow kernel 的前提下，新增本地 app runtime 基础层：project registry、local sidecar、current project resolver、read-only app state API 和 runtime health summary。v33 只做读取、解析和状态聚合，为 v34 Action Registry 留出明确接口。

## Product spine

```text
Clean v32 kernel -> local sidecar skeleton -> project registry -> current project resolver -> goal/runtime state snapshot -> read-only app API -> v34 action-registry handoff.
```

## Tasks

- task-1: Local sidecar skeleton and health API - sidecar 能启动并返回 runtime/kernel 版本、进程状态和只读边界。
- task-2: Project registry and current project resolver - app 能列出注册项目，并从 cwd/repo path 解析当前项目。
- task-3: Goal and release state snapshot API - app 能读取当前 project 的 active goal、next action、verification 和 release 状态。
- task-4: App runtime contract, fixtures, and read-only Workbench surface - UI/CLI 消费同一份 app state schema，不执行命令。
- task-5: Runtime operator guide and v34 handoff - 写清楚 v33 如何启动、验证、恢复，以及 v34 如何接入 Action Registry。

## Acceptance

- v33 不重写 goal/runbook/review/verification/release kernel。
- v33 不执行 worker、reviewer、main verification、release、模型调用、git 写入、文件写入或 shell 命令。
- sidecar health、project registry、current project resolver 和 app state snapshot 都有稳定 JSON contract。
- app state 的 goal/task/release 字段来自现有 goal-status、goal next、goal closeout、event/gate 数据，不能从文件名、分支名、prompt 文本或前端状态推断。
- Workbench 用户路径可见：用户能看到 runtime health、current project、active goal、next action 和 release state。
- v34 handoff 明确列出 Action Registry 的输入 contract、输出 contract、禁止执行边界和第一批 candidate actions。

## Required validation

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json
pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json
```

If v33 introduces a sidecar command or runtime snapshot command, add the exact dry-run/read-only command to the task evidence and release evidence.

## Non-goals

- Do not build Desktop Shell MVP in v33.
- Do not package Electron or Tauri in v33.
- Do not implement Action Registry execution in v33.
- Do not implement Job Queue in v33.
- Do not add Provider Hub, secret storage, model invocation, budget tracking, backup/restore, or Personal Workflow Router in v33.
- Do not introduce a generic shell runner, browser terminal, command DSL, new goal framework, new artifact framework, or new permission system.
- Do not let the UI execute arbitrary commands, invoke models, open local files, download artifacts, merge, push, tag, publish, or self-approve.
- Do not infer completion, approval, verification, release readiness, or adoption state from filenames, branch names, commits, task titles, prompt text, or frontend state.

## v33-v40 sequence

- v33: App Runtime Foundation - read-only local runtime, project registry, sidecar health, app state snapshot.
- v34: Action Registry - declare available actions, permission previews, dry-run outputs, event mapping.
- v35: Job Queue and Run Control - create jobs, stream logs, pause/cancel/resume, recover interrupted jobs.
- v36: Artifact and Evidence Index - SQLite search/index/cache over canonical ArtifactStore evidence.
- v37: Desktop Shell MVP - Tauri/React shell that starts sidecar and displays app state/jobs/artifacts.
- v38: Provider Hub - provider profiles, health checks, model lane config, secret storage boundary.
- v39: Backup, Migration, and Diagnostics - app.db backup/export, schema migrations, diagnostics bundle, restore path.
- v40: Personal Workflow Router - inbox/capture and routing into direct answer, skill, automation, research, or Workbench goal.
