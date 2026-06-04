# Workbench 中文操作指南

## 当前定位

Workbench v1 是日常操作入口。`symphony console` 启动本地服务器后，操作者打开 `/workbench/`，按 active goal、next action、prompt handoff、event registration、review/revision、main verification、closeout/release 的顺序推进工作。

当前仓库 release tag 是 `v35`。`v28` 发布 Workbench v1 的 v20-v28 完整链路；`v29` 到 `v32` 扩展 release-manager workspace；`v33` 发布本地 runtime foundation；`v34` 发布 Action Registry Workspace；`v35` 发布 Job Queue + Run Control Workspace。Workbench 继续把 goal/runbook 操作主线放在浏览器里，同时保留 `symphony` CLI 作为脚本化、JSON 输出、CI 和受控 dry-run/confirm 的入口。

Workbench 消费 console server 暴露的本地 API，用于查看 app runtime snapshot、active goal runbook、task queue、next action、prompt preview、operation registry、review workspace、closeout gaps、release closeout、Job Console、`.symphony` 摘要、latest run、readiness、guided handoff、timeline、artifact refs、safe preview、adoption summary、Stage summary、v17 goal progress、v18 goal events、capabilities 和 diagnostics。

`symphony` CLI 是高级/脚本入口。需要 JSON 输出、CI 命令、dry-run/confirm 事件登记、兼容命令或低层诊断时，在终端运行 CLI；Workbench 只显示受控状态、表单和可复制命令。

Workbench 默认是 read-only / display-only / copy-only。v21 增加两个受控例外：浏览器可以请求 `symphony goal update/review/gate` 的 dry-run plan preview；确认时只能带同一组字段和 dry-run 返回的 `planHash` 调用匹配的 confirm path，向 managed goal event journal append 一个 event。v23 另外记录 Workbench goal operation registry，用于追踪 preview 和 confirm 的 operation id、status 与 timestamps，不把 registry 当成任务完成或审批证据。v29 的 implementation confirm 只接受 preview 返回的 plan context，确认后把 isolated workspace run 的结果、artifact refs、verifier summary 和失败原因写回同一个 operation registry。task-5 的 worker evidence handoff 从同一个 registry 读取已确认的 implementation run，预填 `worker.evidence-recorded` dry-run 表单和 prompt handoff，仍通过 `event-plan-preview` 与 `event-plan-confirm` 登记 worker evidence。v31 的 verification confirm 只接受 active goal/task 的固定 verification suite，运行结果写入 operation registry，显示状态、stdout/stderr 摘要、exit code 和 artifact refs；命令成功只是 operation evidence，不会自动登记 `main-verification` gate。Workbench 同页生成 main verification evidence draft，来源是 verification operation、goal/task/run refs、worker/review evidence refs 和 adoption refs；draft 只供 operator/reviewer 检查，不写文件、不读 evidence 正文、不登记 gate、不宣称 passed。draft ready 后，Workbench 会预填 `main.verification-passed` 的 `goal gate` 表单，仍必须先 dry-run，再用返回的 plan hash confirm。v32 的 release baseline resolver 读取 `/api/readiness` 暴露的 git/GitHub 命令输出，显示 current branch、main HEAD、origin/main、worktree cleanliness 和 PR/CI ref；dirty、非 main 或 main/origin 不一致时只显示 stop/fix guidance，并阻止 `release.ready` 表单。v32 的 release checklist 逐项列出 required release gates、copy-only validation command、latest explicit gate evidence ref，并为每个 gate 提供受控 `goal gate` dry-run / plan-hash confirm 表单。v32 的 release evidence draft 和 tag evidence draft 显示 release evidence ref、tag evidence ref、target commit、release notes summary、逐项 command/result 字段、tag recommendation 和 copy-only `git tag` command；这些字段只来自 closeout、release baseline resolver 和 event log，不写 evidence 文件，不运行 tag/push/publish。v32 的 next-version handoff draft 继续在 release closeout 内显示，从 closeout、release/tag evidence draft、event log、ledger、latest run 和 Workbench capability flags 生成 copy-only v33 起步上下文；它不创建 v33 goal，不进入下一版本，不读取 evidence 正文，不运行命令，不登记 release.ready。

- 浏览器只展示状态、contract 字段和可复制的命令文本。
- 浏览器不执行 shell 命令，不写文件，不触发模型，不触发 agent。
- 浏览器不下载 artifact，不打开本地文件，不接受任意路径输入。
- 浏览器不是 canonical state；`.symphony` 只保存 summary、ref、pointer，完整 evidence 继续由 ArtifactStore 承担。

v18 增加 `goal-event-log.v1` 和 `goal-update-plan.v1`。v21 之前，`symphony goal update`、`symphony goal review`、`symphony goal gate` 的 dry-run / confirm 流程只在终端 CLI 中运行；Workbench 只展示后端已经写入的 event log 和 resolver 生成的 ledger。v21 后，Workbench 可以请求 dry-run 预览，并用 plan hash 完成受控 confirm。任何状态变化仍来自后端写入的 explicit event，不能由文件名、分支名、commit message 或前端判断替代。

v19 增加 Goal Runbook + Next Action Control Center 的实现草稿：`goal-runbook.v1`、`goal-next-action.v1`、`goal-prompt-pack.v1`、`goal-closeout-report.v1`、`symphony goal init`、`symphony goal next`、`symphony goal prompt`、`symphony goal closeout` 和 `symphony next`。v20 到 v32 把 active goal runbook、task queue、prompt handoff、controlled event registration、review/revision、main verification、release closeout、release baseline、release checklist 和 next-version handoff 放到 Workbench 主路径。v33 增加 Runtime 面板；v34 增加 Action Registry Panel；v35 增加 Job Console。summary、runs、handoff、events、capabilities 和 diagnostics 是支撑信息。release-ready 仍需要显式登记 `symphony goal gate --gate release.ready --status declared`，不能从 Workbench 文案、文件名、分支或测试结果推断。

## 日常操作路径

从当前 checkout 构建并启动 Workbench：

```sh
pnpm workbench:build
pnpm symphony console
```

打开：

```text
http://127.0.0.1:8765/workbench/
```

Workbench v1 的主线：

```text
Open Workbench -> active goal -> next action -> prompt handoff -> event registration -> review/revision -> main verification -> closeout/release
```

对应的 CLI spine 是：

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

日常判断先看 Workbench Runtime 面板确认当前 project、runtime health、active goal、next action、release state 和 known blockers，再看 active goal、task queue、prompt preview、operation registry、review workspace 和 closeout gaps。终端 CLI 用于脚本化读取同一批 contract、运行检查命令、生成 evidence、或执行 dry-run/confirm 登记。

旧的 `scan`、`do`、`review`、`verify`、`status`、`continue` 和 `artifacts` 命令仍可用于兼容流程和脚本，不作为 Workbench v1 顶层按钮或主任务列表。

## 构建 Workbench

从仓库 checkout 中构建 React/Vite Workbench：

```sh
pnpm workbench:build
```

当前脚本来自 `package.json`，执行：

```sh
vite build --config frontend/workbench/vite.config.js
```

构建产物写入 `src/symphony/workbench-static/`，console server 只从这个静态根目录服务 `/workbench` 资源。不要手动把仓库根目录、`docs/`、`src/` 或任意本地目录挂到 Workbench 静态服务上。

前端源码调试脚本当前存在：

```sh
pnpm workbench:dev
```

它来自 `package.json`，执行 Vite dev server：`vite --host 127.0.0.1 --config frontend/workbench/vite.config.js`。该脚本用于前端源码调试；验证 console API parity 和静态服务边界时，仍以 `pnpm workbench:build` 加 `symphony console` 为准。

建议的开发验证命令：

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

## 启动 Console / Workbench

安装了用户 CLI 时：

```sh
symphony console
```

从当前 checkout 使用 package script 时：

```sh
pnpm symphony console
```

默认监听地址是 `127.0.0.1:8765`。启动后：

- `http://127.0.0.1:8765/` 是既有 console HTML。
- `http://127.0.0.1:8765/workbench/` 是 React/Vite Workbench 入口。
- `/api/*` 仍由 console server 拥有，不由 React fallback 覆盖。

当前已支持的 console 参数：

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
pnpm symphony console --state-dir .symphony
pnpm symphony console --snapshot --json
pnpm symphony console --snapshot --state-dir .symphony --json
```

`--snapshot --json` 只输出 `symphony.console-snapshot`，不启动浏览器服务器。`console --help` 不是当前支持的 console 选项，不要把它写进操作流程。

## v37 Desktop Shell MVP 路径

v37 task-1 增加一个可运行的桌面 shell renderer 路径：

```text
http://127.0.0.1:8765/workbench/desktop/
```

这个页面仍由 `pnpm workbench:build` 生成，仍由 `symphony console` 的 Workbench 静态根目录服务。它显示 sidecar health、project、active goal、next action、job/run state、artifact preview 和 evidence readiness。状态来自现有 `/api/runtime/snapshot`、goal、action、job、artifact/evidence routes，不从 branch、文件名、prompt、task title 或前端状态补推断。

task-2 在 `desktop/shell/src-tauri/` 增加 Tauri host workspace，并把 sidecar attach/launch boundary 接入 runtime health。Desktop route 仍不执行 shell、不调用模型、不打开任意本地文件、不写 git、不登记 reviewer/main/release gate。完整 native build smoke 和 packaging 边界仍由 task-5 处理。

task-2 的 sidecar 状态来源：

```text
GET /api/health -> local-runtime-health.v1.sidecarHost
GET /api/runtime/snapshot -> app-state-snapshot.v1.runtime_health.sidecarHost
DesktopShellMvpViewModel.sidecarHealth
```

`sidecarHost` 使用 `sidecar-host-lifecycle.v1` 子 contract。`attach.state` 来自当前 runtime health；`launcher.commandId` 固定为 `symphony.console.sidecar.launch`。renderer 只显示该状态，不调用 native launcher。

task-3 在同一路由增加项目和开发状态视图：

```text
GET /api/projects -> project-registry.v1 -> DesktopShellMvpViewModel.projectList
GET /api/runtime/snapshot -> app-state-snapshot.v1 -> activeGoalStatus
GET /api/goals/latest/next -> goal-next-action.v1 -> nextActionDetail
```

桌面页显示项目列表、active goal、next action、blocked、review、main verification 和 release state。所有状态仍来自 backend contracts、goal events、project registry、runbook/next-action/progress contracts；页面不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成、审批、main verification 或 release readiness。

task-4 在同一路由增加 job 和 artifact/evidence 状态视图：

```text
GET /api/jobs -> job-model.v1 -> jobRun
GET /api/jobs/create -> job-creation.v1 -> jobRun.creation
GET /api/jobs/timeline -> job-timeline-log-stream.v1 -> jobRun.timeline
GET /api/jobs/control -> job-run-control.v1 -> jobRun.runControl
GET /api/artifacts -> artifact-index.v1 -> artifactReadiness.artifactIndex
GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview -> safe-artifact-preview.v1 -> artifactReadiness.previewItems
GET /api/evidence/timeline -> evidence-timeline.v1 -> artifactReadiness.evidenceTimeline
GET /api/release/bundle -> release-bundle.v1 -> artifactReadiness.releaseBundle
```

桌面页显示 job id、status、queue state、action id、timestamps、blocker/failure、timeline/log counts、run-control transitions、artifact refs/status/missing、safe preview availability、evidence timeline readiness 和 release bundle state。transitions 是只读列表，不是按钮；safe preview 只展示后端 `safe-artifact-preview.v1` 的可用性和 inline safety 字段，不打开本地路径，也不从文件名或扩展名判断安全。

Tauri host smoke：

```sh
pnpm desktop:shell:smoke
```

该命令只检查 host manifest、受控命令名、loopback host、端口范围和禁止项。它不是 native build。

## 当前只读 API

Console / Workbench 当前可用的核心只读 API 包括：

```text
GET /api/summary
GET /api/health
GET /api/projects
GET /api/projects/current
GET /api/runtime/snapshot
GET /api/readiness
GET /api/handoff
GET /api/handoff/<ref>
GET /api/runs
GET /api/runs/latest
GET /api/runs/<run-id>
GET /api/runs/<run-id>/timeline
GET /api/runs/<run-id>/artifacts/<kind>
GET /api/runs/<run-id>/artifacts/<kind>/preview
GET /api/adoptions/<adoption-id>/inspect
GET /api/goals
GET /api/goals/latest/progress
GET /api/goals/<goal-id>/progress
GET /api/goals/latest/events
GET /api/goals/<goal-id>/events
GET /api/goals/latest/operations
GET /api/goals/<goal-id>/operations
GET /api/goals/latest/event-plan-preview
GET /api/goals/<goal-id>/event-plan-preview
POST /api/goals/latest/event-plan-confirm
POST /api/goals/<goal-id>/event-plan-confirm
GET /api/goals/latest/implementation-plan-preview
GET /api/goals/<goal-id>/implementation-plan-preview
POST /api/goals/latest/implementation-run-confirm
POST /api/goals/<goal-id>/implementation-run-confirm
POST /api/goals/latest/verification-run-confirm
POST /api/goals/<goal-id>/verification-run-confirm
GET /api/goals/latest/runbook
GET /api/goals/<goal-id>/runbook
GET /api/goals/latest/next
GET /api/goals/<goal-id>/next
GET /api/goals/latest/prompt
GET /api/goals/<goal-id>/prompt
GET /api/goals/latest/closeout
GET /api/goals/<goal-id>/closeout
GET /api/capabilities
GET /api/actions/manifest
GET /api/actions/availability
GET /api/actions/preview
GET /api/jobs
GET /api/jobs/create
GET /api/jobs/timeline
GET /api/jobs/control
GET /api/diagnostics
```

`GET /api/health` 返回 `local-runtime-health.v1`，用于确认本地 sidecar 已启动、当前进程 id、cwd/repo path、runtime 版本、v32 kernel source、startup time、read-only mode、`sidecarHost` 和 known blockers。这个 route 不接受 query 参数，不写 repo、不写 `.symphony`、不改 git、不执行 worker/reviewer/main verification/release、不调用模型、不创建 job queue。

`GET /api/projects` 返回 `project-registry.v1`，列出从当前 cwd/repo-local metadata 解析出的 registered project。`GET /api/projects/current` 返回 `current-project-resolver.v1`，从 console cwd 解析 current project；可选 `repoPath` 只用于显式 repo path 解析。两个 route 都不写 project registry 数据库、不扫描全盘、不执行 git 写入、不调用模型、不创建 job queue。`/api/projects` 不接受 query 参数，`/api/projects/current` 只接受 `repoPath`。

`GET /api/runtime/snapshot` 返回 `app-state-snapshot.v1`，把 freshness、current project、runtime health、active goal、current task、next action、review status、main verification status、release status、evidence refs 和 known blockers 聚合到同一份只读响应。Workbench 的 Runtime 面板和 `symphony runtime snapshot --json` 消费同一份 schema；healthy、missing project、missing goal、blocked 和 stale 都由后端 contract 字段表达。goal/task/release 字段来自 managed runbook、goal-status ledger、goal next、event/gate/release state 和 v33 runtime/project resolver；缺少 active goal 或 release state 时返回 `null` 和 blocker，不从文件名、branch、prompt 文本或前端状态补状态。route 只接受可选 `repoPath` 和 `goal` query，不登记 `goal update/review/gate/closeout`，不运行验证，不写 `.symphony`，不声明 release ready。

v35 Job Console 使用四个只读 job route：

```text
GET /api/jobs
GET /api/jobs/create
GET /api/jobs/timeline
GET /api/jobs/control
```

`GET /api/jobs` 返回 `job-model.v1`，用于显示 job identity、goal/task/action refs、queue state、status、blocker、failure、boundary fields 和 source contract refs。`GET /api/jobs/create` 返回 `job-creation.v1`，只展示从受控 `action-preview.v1` 生成 job 的 dry-run 计划；它不持久化 job、不执行 action、不确认 event。`GET /api/jobs/timeline` 返回 `job-timeline-log-stream.v1`，当前没有真实 job event store 时返回空 timeline 和 log refs。`GET /api/jobs/control` 返回 `job-run-control.v1`，展示 pause、cancel、resume、recover 的允许来源状态、目标状态、reversible、terminal 和 hiddenRetry 字段。四个 route 都只接受各自 allowlist query 参数，拒绝 unsupported 参数和非 GET 请求。

Workbench 的 Job Console 只把这些 contract 投影成界面字段。它不创建 job、不运行 job、不调用 shell、不调用模型、不写 `.symphony`、不写 git、不登记 review/main/release gate，也不从前端状态推断 job passed、review approved、main verified 或 release ready。

终端可用的同一份 health contract：

```sh
pnpm --silent symphony runtime health --json
pnpm --silent symphony runtime projects --json
pnpm --silent symphony runtime current --repo-path /path/to/repo --json
pnpm --silent symphony runtime snapshot --json
```

## v33 Runtime 操作流程

从当前 checkout 启动只读 console / Workbench：

```sh
pnpm workbench:build
pnpm symphony console --host 127.0.0.1 --port 8765
```

预期结果：build 生成 `src/symphony/workbench-static/index.html` 和 hashed assets；console 监听 `127.0.0.1:8765`。打开 `http://127.0.0.1:8765/workbench/` 后，首页先显示 Runtime 面板，再显示 active goal、task queue、prompt handoff、review workspace 和 closeout 路径。Runtime 面板只读取 `GET /api/runtime/snapshot`，不运行命令、不写 evidence、不登记 gate。

如果只需要在终端确认 console 可读状态，不启动服务器：

```sh
pnpm symphony console --snapshot --json
```

预期结果：返回 `symphony.console-snapshot`，用于确认本地摘要、runs 和 readiness 输入可读。这个命令不打开浏览器服务器。

v33 runtime health：

```sh
pnpm --silent symphony runtime health --json
```

预期结果：返回 `local-runtime-health.v1`；`status` 为 `ok`，`readOnly` 为 `true`，`runtime.version` 为 `v33-app-runtime-foundation.1`，`kernel.source` 为 `v32 Release Manager Workspace v2`，`process.cwd` 和 `process.repoPath` 指向当前 repo，`knownBlockers` 是数组。`sidecarHost.contractName` 为 `sidecar-host-lifecycle.v1`，`sidecarHost.attach.state` 为 `attached`，`sidecarHost.launcher.commandId` 为 `symphony.console.sidecar.launch`，`sidecarHost.launcher.rendererLaunchAvailable` 为 `false`。`boundaries.actionExecutionAvailable`、`jobQueueAvailable`、`modelInvocationAvailable`、`gitWriteAvailable`、`releaseWriteAvailable` 和 `arbitraryCommandExecutionAvailable` 都应为 `false`。

project registry：

```sh
pnpm --silent symphony runtime projects --json
```

预期结果：返回 `project-registry.v1`；`readOnly` 为 `true`；`projects` 中至少包含当前 repo 的 `project_id`、`project_name`、`repo_path`、`default_branch`、`remote_url`、`last_goal_id`、`last_run_id`、`health_status`、`last_opened_at` 和 `pinned`。它只读取 cwd 或显式 repo path 附近的 repo-local metadata，不创建 registry database，不扫描全盘。

current project resolver：

```sh
pnpm --silent symphony runtime current --json
pnpm --silent symphony runtime current --repo-path /path/to/repo --json
```

预期结果：返回 `current-project-resolver.v1`；正常 repo 下 `resolution.status` 为 `resolved`，`currentProject.repo_path` 是解析后的 repo。路径不存在时仍然 exit 0，`currentProject` 为 `null`，`resolution.status` 为 `unresolved`，blocker 包含 `project-path-missing`；非 git 目录返回对应 unresolved blocker。

runtime snapshot：

```sh
pnpm --silent symphony runtime snapshot --json
pnpm --silent symphony runtime snapshot --goal v33-app-runtime-foundation --json
pnpm --silent symphony runtime snapshot --repo-path /path/to/repo --json
```

预期结果：返回 `app-state-snapshot.v1`；包含 `freshness`、`current_project`、`runtime_health`、`active_goal`、`current_task`、`next_action`、`review_status`、`main_verification_status`、`release_status`、`evidence_refs`、`known_blockers` 和 `boundaries`。`runtime_health.sidecarHost` 继续暴露 sidecar attach/launcher 状态。当前 v33 goal 在 release ready 未登记前，`release_status.release_ready` 为 `false`，known blockers 应包含 release-ready 未声明的 blocker。缺 active goal 时，`active_goal` 和 `release_status` 保持 `null`，不会从文件名、分支、prompt 或前端状态补推断。

Workbench Runtime 面板检查：

```text
http://127.0.0.1:8765/workbench/
```

预期结果：Runtime 面板显示 freshness、runtime health、current project、active goal/current task、next action、release state、known blockers 和 read-only boundary flags。面板没有执行按钮、shell 输入、模型调用、git 写入、release 写入、下载 artifact 或打开本地文件入口。

managed goal 状态检查：

```sh
pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json
pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json
```

预期结果：`goal-status` 返回 `goal-progress-ledger.v1`，task 状态只来自 managed runbook 和 explicit event/gate evidence。task-1 到 task-4 已 main-verified 时，task-5 仍会保持 `planned`，直到 task-5 worker evidence 被单独登记。`goal next` 返回 `goal-next-action.v1`；没有 task-5 worker evidence 时，`next.taskId` 为 `task-5`，`next.role` 为 `worker`，reason 指向缺少 task-5 worker evidence。

v33 不执行 actions、jobs、models、git 写入、release 写入，也不创建 v34 goal。v33 的 value 是读取、解析和聚合 runtime state，为 v34 Action Registry 留出 contract handoff。

## v33 Runtime 恢复

dirty checkout：

先运行 `git status -sb --untracked-files=all`。如果已有 prior v33 task files、staged files 或 untracked evidence，继续使用当前 checkout 的 repo-local fallback；不要 checkout、pull、merge、stash、reset、revert、stage 或 commit。只做 scoped additive edits，并在 evidence 写明 fallback。release baseline 或 main verification 仍需要后续独立 verifier 在安全 git 边界下处理。

missing active goal：

运行 `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json`。如果返回缺失 managed runbook 或 snapshot 中 `active_goal: null`，用 runbook fixture 走 dry-run/confirm：

```sh
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json --goal v33-app-runtime-foundation --dry-run --json
```

只在 operator 核对 plan hash 后 confirm。Workbench 不自动创建 goal，v33 task-5 worker 也不创建 v34 goal。

missing project：

运行 `pnpm --silent symphony runtime current --repo-path /path/to/repo --json`。如果 `currentProject` 为 `null`，检查路径是否存在、是否在 git repo 内、是否从正确 checkout 启动 console。恢复方式是从 repo root 重新运行 runtime 命令或传入正确 `--repo-path`；不要让 runtime 扫描全盘。

stale runtime snapshot：

运行 `pnpm --silent symphony runtime snapshot --json`。如果 `freshness.status` 是 `stale`，刷新 Workbench 或重启 `pnpm symphony console --host 127.0.0.1 --port 8765`，再重新读取 snapshot。不要在前端根据旧 panel 状态登记 worker/review/main/release 事件。

invalid query / API request：

`/api/health` 和 `/api/projects` 不接受 query；`/api/projects/current` 只接受 `repoPath`；`/api/runtime/snapshot` 只接受 `repoPath` 和 `goal`；`/api/actions/manifest` 和 `/api/actions/availability` 只接受 `goal` 和 `task`；`/api/actions/preview` 只接受 `goal`、`task` 和 `action`。未知 query、非 GET、任意 path、confirm 或 command 字段应返回 `error-envelope.v1` 或 `405`。恢复方式是改用上面列出的受控 CLI/API shape。

release-ready not declared：

`goal-status` 或 runtime snapshot 中 `summary.releaseReady: false` / `release_status.release_ready: false` 是预期状态，直到 release manager 用 `symphony goal gate --gate release.ready --status declared` 的 dry-run/confirm 路径登记。测试通过、文件名、分支名、task title、Workbench 文案或 task-5 worker evidence 都不能代替 release-ready gate。

## v34 Action Registry 交接

v34 的目标是声明可用 actions 和 permission preview，不创建 job、不执行 action。v33 交给 v34 的输入是 `app-state-snapshot.v1`、`goal-progress-ledger.v1`、`goal-next-action.v1`、`goal-runbook.v1`、`goal-event-log.v1`、`goal-operation-runs.v1` 和 Workbench capability flags。

task-1 已实现 `action-manifest.v1`，task-2 已实现 `action-availability.v1`，task-3 已实现 `action-preview.v1`：

```text
GET /api/actions/manifest
GET /api/actions/manifest?goal=<goal-id>&task=<task-id>
GET /api/actions/availability
GET /api/actions/availability?goal=<goal-id>&task=<task-id>
GET /api/actions/preview
GET /api/actions/preview?goal=<goal-id>&task=<task-id>&action=<action-id>
pnpm --silent symphony actions manifest --goal <goal-id> --task <task-id> --json
pnpm --silent symphony actions availability --goal <goal-id> --task <task-id> --json
pnpm --silent symphony actions preview --goal <goal-id> --task <task-id> --action <action-id> --json
```

manifest 只声明 `action_id`、label、scope、availability resolver、capability preview contract、event mapping 和 evidence expectations。它不执行 action、不创建 job、不追加 goal event、不读取 evidence 正文、不调用模型、不读任意本地路径、不合并、不 push、不 tag、不发布。

availability 从 `action-manifest.v1`、`goal-progress-ledger.v1` 和 `goal-next-action.v1` 计算每个 action 的 `available`、`unavailable` 或 `blocked` 状态，并返回 `reasons`、`missingContext` 和 `requiredInputs`。`requiredInputs` 是操作者需要填写的字段，比如 evidence ref；它不是后端状态缺失，也不会被当作文件读取。availability route 只接受 `goal` 和 `task`，不接受 command、path、confirm、planHash 或任意本地路径。

preview 从 `action-availability.v1` 生成 action 影响说明、capability preview、required confirmation 和 endpoint safety。preview route 只接受 `goal`、`task` 和 `action`，不接受 command、path、confirm、planHash、prompt 或任意本地路径；`action` 只是过滤已声明 action id，不执行 action。

Workbench 的 Active Goal 区域渲染 `Action Registry Panel`。面板条目来自 `action-manifest.v1`、`action-availability.v1` 和 `action-preview.v1`，按钮 label 使用后端 action label；按钮不绑定执行 handler，不拼 shell command，不触发 confirm。可执行状态、required input、planHash 要求、impact preview 和 boundary 都来自 backend contract 字段。

action preview 当前字段：

- `action_id`
- `state`
- `capability.previewContract`
- `capability.confirmationContract`
- `requiredConfirmation.requiredInputs`
- `requiredConfirmation.requiresPlanHash`
- `impactPreview.writesInPreview`
- `impactPreview.writesGoalEventOnConfirm`
- `boundaries.actionExecutionAvailable`

preview API shape：

```text
GET /api/actions/preview?goal=<goal-id>&task=<task-id>&action=<action-id>
symphony actions preview --goal <goal-id> --task <task-id> --action <action-id> --json
```

response 使用 `action-preview.v1`，包含 `contractName`、`contractVersion`、`context`、`actions`、`capabilities`、`requiredConfirmations`、`blockers`、`endpoint` 和 `boundaries`。v34 阶段 `boundaries.jobQueueAvailable`、`actionExecutionAvailable`、`modelInvocationAvailable`、`gitWriteAvailable`、`publishAvailable` 和 `selfApprovalAvailable` 仍为 `false`，直到后续版本显式设计 job queue 和 execution confirm。

第一批 candidate actions：

- `goal.workerEvidence.preview`：为当前 worker task 生成 `worker.evidence-recorded` dry-run plan 的表单上下文。
- `goal.reviewVerdict.preview`：为 reviewer verdict 生成 approved / needs-revision dry-run plan 的表单上下文。
- `goal.mainVerification.preview`：为 main verification gate 生成 dry-run plan 的表单上下文。
- `goal.releaseGate.preview`：为 release checklist gate 生成 passed / failed dry-run plan 的表单上下文。
- `runtime.snapshot.refresh`：重新读取 `app-state-snapshot.v1`。
- `project.current.resolve`：重新读取 `current-project-resolver.v1`。
- `prompt.copy`：展示 `goal-prompt-pack.v1` copy-only prompt。

no-job-execution boundary：

v34 Action Registry 只列出 actions、输入要求、preconditions、permission preview、copy-only command 和 dry-run/confirm 映射。它不启动 worker/reviewer/verifier，不创建 queue job，不运行 shell，不调用模型，不写 git，不合并、不 push、不 tag、不 publish，不打开本地文件，不下载 artifact，不登记 release ready，不自动创建 v34 或后续 goal。

v35 以及后续 Web、Desktop、Notch/Menu Bar surface 的迁移规则见 `docs/action-registry-migration-guide.md`。这些 surface 必须消费同一组 `action-manifest.v1`、`action-availability.v1` 和 `action-preview.v1` contract；v35 job queue 只能从受控 action preview 创建 job，不能从前端按钮拼 shell command。

除 `POST /api/goals/<goal-id|latest>/event-plan-confirm`、`POST /api/goals/<goal-id|latest>/implementation-run-confirm`、`POST /api/goals/<goal-id|latest>/verification-run-confirm`、`POST /api/goals/<goal-id|latest>/adoption-plan-freeze` 和 `POST /api/goals/<goal-id|latest>/adoption-confirm` 外，所有非 `GET` 请求都必须返回 `405`，并使用 `error-envelope.v1`。`/api/goals/<goal-id>/event-plan-preview` 是 dry-run 预览 GET route，只接受受控 query 字段，不接受任意 `path`、`confirm`、`planHash` 或未登记命令。event confirm route 只接受 JSON body 中的 `command=update|review|gate`、该 command 的字段和 `planHash`，不接受任意 command、path 或 shell 输入。implementation confirm route 只接受 implementation preview 返回的 `goalId`、`taskId`、`planId` 和 `planHash`，并重新读取同一 goal/task context 后才映射到 `symphony do --confirm-plan <plan-id> --json`。verification confirm route 只接受 `goalId`、`taskId` 和固定 `suiteId=v31-main-verification-command-suite`，后端重新读取 managed runbook task，只运行 `pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check` 和已允许的 active-goal JSON read commands。adoption confirm route 只接受 frozen adoption operation 返回的 `goalId`、`taskId`、`adoptionPlanId` 和 `operationId`，并重新读取同一 goal/task adoption-plan operation 后才映射到 `symphony adopt --confirm <adoption-id> --json`。`/api/handoff` 只暴露 registered handoff ref，当前为 `guided-goal-handoff.v1`。safe preview route 只接受 run state 已登记的 artifact kind，不接受 `path` query、encoded traversal 或任意本地路径。

`/workbench` 的静态资源服务只允许读取 `src/symphony/workbench-static/` 中的构建产物。`/workbench/api/*` 只会落到 Workbench HTML fallback，不返回 API JSON contract；`/workbench/docs/stages/*.html`、`/workbench/docs/stages/*.stage.json`、`/workbench/src/*`、`/workbench/package.json` 和 lockfile 路径不能暴露仓库文件内容。

## Guided Goal Handoff

Workbench 的 handoff panel 只读取：

- `GET /api/handoff`
- `GET /api/handoff/guided-goal-handoff.v1`

面板展示 contract 中已暴露的目标、角色、任务、review gate、release gate、停止条件和 copy-only commands。命令只作为文本出现；浏览器没有执行按钮、terminal action、模型调用、agent 调用、branch 操作、commit 操作或 push 操作。

如果 handoff contract 缺少某个字段，Workbench 应显示缺失或不可用状态，不从 task id、标题、命令文本或历史 evidence 推断状态。`/api/handoff?path=...`、`/api/handoff/<unknown-ref>`、encoded traversal 和非 GET 请求都应保持被拒绝。

## Goal Progress

Workbench 的 Goal Progress panel 只读取 `GET /api/goals/latest/progress`。该 route 返回 `goal-progress-ledger.v1`，展示 goal id、baseline、task status、statusSource、worker evidence、review evidence、review verdict、main verification、blockers、release gates 和 next copy-only commands。

状态只能来自后端 ledger 字段。前端不能根据 task id、标题、branch、commit、命令文本、文件名、路径或历史 run 文案判断任务是否完成。缺少 evidence 时，后端应返回 `unknown`、`missing` 或 `blocked`；前端只按字段展示。v18 没有 events 时继续返回 v17 planned/unknown 模板，不把计划、分支或文件名当成完成证据。

终端可用的只读命令：

```sh
pnpm symphony goal-status
pnpm symphony goal-status --json
pnpm symphony goal-status --markdown
pnpm symphony goal-status --goal v17-readonly-goal-progress-console-contracts --json
pnpm symphony goal-status --goal v18-goal-event-journal-evidence-recorder --json
```

这些命令只读取注册 goal state 和 evidence refs，不写 `.symphony`，不创建 evidence，不运行测试、audit、mutation，不调用模型。

## Goal Events Timeline 和 Evidence Matrix

Workbench 的 Goal Events Timeline 读取 `GET /api/goals/latest/events`，必要时也可以读取 `GET /api/goals/<goal-id>/events`。该 route 返回 `goal-event-log.v1`，用于展示 event sequence、event type、phase、task id、actor、recordedAt、verdict、gate status、evidence refs 和 hash chain 状态。

Workbench 的 Evidence Matrix 使用 events API 和 `goal-progress-ledger.v1` 字段展示每个 task 的 worker evidence、review verdict、independent review evidence、main verification evidence、blocker 状态和 release gate coverage。Evidence Matrix 不读取 evidence 文档正文，不下载 artifact，不打开本地文件，不把 ref 变成预览路径。

Prompt Workspace 的 Subagent Handoff Board 读取选中 goal 的 `goal-progress-ledger.v1`、`goal-event-log.v1`、`goal-next-action.v1` 和 `goal-closeout-report.v1`。每个 task 的 worker started 来自 event log；worker evidence、reviewer verdict 和 main verification 来自 goal-status 或对应 event；当前该谁接手只来自 goal next；缺口来自 goal closeout。这个 board 不读取 evidence 正文，不根据 branch、文件名、commit message、prompt 文案或 copy-only command 推断状态。

Prompt Workspace 的 prompt pack 区域只显示 `goal-prompt-pack.v1` 里的 copy-only prompt text。用户从页面选中 goal、task、role 后，把页面里的 prompt 文本复制给对应 subagent；Workbench 不调用剪贴板 API、不启动 agent、不运行 shell，也不登记 reviewer 或 main verification。worker event shortcut 只在 role 为 `worker` 时显示，且只生成 `worker.started` 和 `worker.evidence-recorded` 的 dry-run preview 与 plan-hash confirm。

如果选择的 goal ref 不符合受控 token，或后端返回缺失 managed runbook / unsupported goal state，Prompt Workspace 显示错误摘要或 unavailable 状态，不发起替代写入，不根据 prompt、路径、文件名、branch、commit message 或前端选项推断任务完成。缺失 runbook 的修复仍要回到终端里的 `symphony goal init --dry-run` 和 confirm 流程。

`goal-update-plan.v1` 来自终端 CLI dry-run，或 v21 Workbench dry-run preview endpoint。示例命令是 copy-only text：

```sh
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --dry-run
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --dry-run
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.pnpm-check --status passed --verifier codex-release-verifier --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --dry-run
```

Workbench dry-run preview route：

```text
GET /api/goals/latest/event-plan-preview?command=update&task=task-2&event=worker.evidence-recorded&actor=codex-worker&evidenceRef=docs/plans/example.md
GET /api/goals/<goal-id>/event-plan-preview?command=review&task=task-2&reviewer=codex-reviewer&verdict=approved&evidenceRef=docs/plans/example-review.md
GET /api/goals/<goal-id>/event-plan-preview?command=gate&task=task-2&gate=main-verification&status=passed&verifier=codex-main-verifier&evidenceRef=docs/plans/example-main.md
```

响应仍是 `goal-update-plan.v1`，并额外提供 `eventSummary`，包括 plan hash、command、event type、task、actor、evidence refs、gate/verdict 和 `writesInDryRun: false`。v23 起还会提供 `operationRun`，登记 operation id、goal id、task id、role、command kind、`dry-run-planned` status 和 timestamps。后端直接调用受控 goal update/review/gate plan builder，不通过 shell runner，不接受任意命令。

Confirm 阶段必须使用 dry-run 生成的 `planHash`。Workbench confirm route 会调用匹配的 `goal update`、`goal review` 或 `goal gate` confirm function，只向受控 managed-goal-event-journal append event，并把同一个 `operationRun.operationId` 更新为 `confirmed`。confirm 成功后，Workbench 重新读取 goal-status、events 和 next action。这个流程不会触发 shell、模型、merge 或 tag。

v29 的 controlled implementation plan preview route：

```text
GET /api/goals/<goal-id|latest>/implementation-plan-preview?task=<task-id>
```

该 route 只接受 `task` query 字段。后端从 registered runbook、`goal next`、`goal prompt --role worker` 和 scoped event log 生成 `controlled-implementation-plan-preview.v1`，显示与 `symphony do --write --json` 对齐的 isolated-workspace write semantics、plan id/hash、active task constraints、worker prompt、goal/task/evidence refs 和 safety flags。它不接受浏览器传入 prompt、path、command、confirm、planHash 或任意 shell 字段；不运行 `symphony do`、不调用模型、不创建 workspace run、不合并、不推送、不打 tag，也不登记 worker/reviewer/main-verification 状态。

v29 的 controlled implementation confirm route：

```text
POST /api/goals/<goal-id|latest>/implementation-run-confirm
```

该 route 只接受 JSON body 中的 `goalId`、`taskId`、`planId` 和 `planHash`。后端重新生成同一 active goal/task 的 `controlled-implementation-plan-preview.v1`，要求 plan id/hash 与 preview 完全一致，然后物化受控 execution plan，并调用既有 `symphony do --confirm-plan <plan-id> --json` 确认路径。失败的 context/hash/body 校验不会启动 run。确认成功后，响应包含 `controlled-implementation-run-confirmation.v1`、`operationRun` 和刷新后的 `goal-operation-runs.v1`；Operation Console 与 Implementation 面板从该 registry entry 显示 run status、stdout/stderr 摘要、artifact refs、verifier summary、changed-file count 和 failure reason。该 route 不接受 prompt、path、command、shell 字段、模型字段、merge/push/tag 字段，也不登记 reviewer、main verification 或 release readiness。

v29 的 worker evidence handoff 位于 Next Action 的 event registration forms 下。它只在 active task 仍由 worker 接手、afterCompletion 允许 `worker.evidence-recorded`，且 `goal-operation-runs.v1` 中同一 goal/task 存在 confirmed implementation operation 时出现。面板展示 operation id、run id、execution plan id、evidence artifact path、managed evidence ref，以及 confirmed run 暴露的 source workspace path，并预填 `symphony goal update --event worker.evidence-recorded` 表单。用户先运行 dry-run preview，检查 `goal-update-plan.v1` 和 plan hash，再用同一字段 confirm。这个 handoff 不读取 evidence 正文，不打开 source workspace，不运行 shell，不启动模型或 agent，不登记 reviewer/main verification/release 事件。

v31 的 controlled verification confirm route：

```text
POST /api/goals/<goal-id|latest>/verification-run-confirm
```

该 route 只接受 JSON body 中的 `goalId`、`taskId` 和 `suiteId=v31-main-verification-command-suite`。后端重新读取同一 managed runbook task，固定运行 `pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，并且只附加已经 allowlist 的 active-goal JSON read commands，例如 `goal-status` 和 `goal next`。响应是 `controlled-verification-run-confirmation.v1`，每条命令都有 status、stdout/stderr 摘要、exit code、开始/结束时间；同一个 operation registry entry 从 `running` 更新为 `confirmed` 或 `failed`。即使所有命令 exit code 都是 0，`runResult.gatePassed` 和 `safety.successImpliesGatePassed` 也必须是 false；main verification 仍要单独用 `goal gate --gate main-verification` dry-run/confirm 登记。

`GET /api/goals/<goal-id|latest>/operations` 返回 `goal-operation-runs.v1`。这个 registry 只描述 Workbench goal operation 本身，不是 approval、main verification 或 release-ready 证据；dry-run 写入 operation registry 不等于写入 goal event journal。v29 implementation entries 使用 `commandKind: "implementation"`，结果来自受控 `symphony do --confirm-plan`，不是浏览器 shell runner。v31 verification entries 使用 `commandKind: "verification"`，结果来自固定 verification suite，不接受用户输入的 shell command。

Goal Operation Console 会对当前 active goal 的 operations route 做近实时轮询，刷新 command preview、stdout/stderr 风格输出、status、plan hash、event ids、implementation/verification run result、artifact refs、verifier summary 和 next action。轮询只重新读取受控 `GET /api/goals/<goal-id>/operations` 及既有 active goal contracts，不执行 shell、不提供终端模拟器、不追加 goal event，也不根据前端状态判断任务完成。

v31 的 Main Verification Evidence Draft 位于 Verification 路径下。Workbench 从 `goal-progress-ledger.v1`、`goal-event-log.v1`、`goal-next-action.v1`、`goal-operation-runs.v1`、review evidence ref、worker evidence ref、verification operation command results，以及存在时的 adoption refs 生成 copy-only markdown draft。面板只读取 active `mainVerificationEvidenceDraft` model 的显式字段：`verification`、`refs`、`adoptionRefs`、`copyOnlyGateDryRun` 和 `markdown`。缺少 reviewer approved、worker/review evidence ref、confirmed passed verification operation、command results 或 goal/task refs 时，面板显示 missing inputs/blockers，不补写正文。draft 明确需要 operator/reviewer 检查；它不写 evidence 文件、不读取 evidence 正文、不登记 `main.verification-passed`、不登记 reviewer approval、release readiness 或任何 gate。

v31 的 Main Verification Gate Registration 面板也在 Verification 路径下。它只在 readiness 为 true、draft 为 `draft-ready`、存在 target evidence ref、controlled verification run 已通过且 command results 存在时，把 `main.verification-passed` 表单预填为 `symphony goal gate --gate main-verification --status passed`。面板里的 gate 和 status 是固定字段，不提供任意 gate 名称、任意 status 或 shell command 输入。用户输入 verifier id 后，Workbench 先调用 event-plan-preview 生成 dry-run plan，再用同一字段和返回的 `planHash` 调用 event-plan-confirm。confirm 成功后只追加后端 event，并刷新 goal-status、events 和 next action；页面不运行验证命令、不写 evidence 文件、不读取 evidence 正文、不合并、不推送、不打 tag、不声明 release readiness，也不把 verification operation 成功当成 gate passed。

v32 的 Release Evidence Draft 位于 Closeout Gaps 路径下。Workbench 从 `goal-closeout-report.v1`、`ReleaseBaselineResolver`、`goal-event-log.v1` 和 release checklist projection 生成 copy-only markdown，显示 release name、goal id、release evidence ref、tag evidence ref、target commit、target commit source、release notes summary 和每个 release gate 的 command/result 字段。字段缺失时保持缺失状态，不从 README、branch、文件名、commit message 或前端状态补推断。这个 draft 不写文件、不运行 shell、不登记 release gate 或 `release.ready`。

v32 的 Tag Evidence Draft 同样位于 Closeout Gaps 路径下。Workbench 显示 tag recommendation、target commit、release notes summary、latest `release.tag-evidence` event/ref、copy-only `git tag -a <tag> <commit> -m "<release>"` command，以及 command/result 字段中的 `not-run-by-workbench` 状态。页面没有执行 tag、push tag、publish release、merge、下载 artifact、打开本地文件或登记 release.ready 的入口。

Workbench 不保存“前端状态”。用户看到的 worker、reviewer 和 main verification 状态都来自 confirm 后刷新的后端 contract：

- worker 路径：`command=update` 只允许 `worker.started`、`worker.evidence-recorded`、`worker.self-check-passed`、`worker.self-check-failed`、`blocker.opened` 和 `blocker.resolved`。dry-run 不写入；confirm 成功后 journal 里出现 `symphony goal update` 来源的 event。
- reviewer 路径：`command=review` 只允许 `verdict=approved` 或 `verdict=needs-revision`。reviewer id 如果等于该 task 最近 worker id，preview/confirm 会被拒绝，不会 append event。
- main verification 路径：`command=gate&gate=main-verification` 只允许 `status=passed` 或 `status=failed`，并且必须带 `task` 和受控 evidence ref。`status=passed` 写入 `main.verification-passed`；`status=failed` 写入 `main.verification-failed`。

这些失败路径必须保持无写入：不匹配的 `planHash`、未知 command、未知 body/query 字段、缺少 main-verification task、非 JSON confirm body、非受控 evidence ref、unsafe goal ref、reviewer 和 worker actor 冲突。前端可以显示错误摘要，但不能把错误、文件名、分支名、commit message、copy-only command 或 prompt 文案转成任务完成、review approved、main verified 或 release ready。

v23 的 console API 回归覆盖最新 goal workflow 的常用路径：成功 dry-run preview 只写 operation registry，不写 goal event journal；成功 confirm 使用 dry-run 返回的 `planHash` append 一个受控 event，并刷新 goal-status、events 和 next action；缺少 `planHash`、unknown goal、unsupported subcommand 都返回 `error-envelope.v1`，不追加 goal event，也不创建通用 shell 执行记录。

v25 的 worker evidence handoff 只服务 `v25-controlled-implementation-lane`。当 latest run 是 confirmed isolated workspace implementation，且暴露 `evidenceArtifactPath` 和 `sourceWorkspacePath` 时，Workbench 会显示 worker evidence registration form 和 prompt handoff。表单默认使用 `artifact-ref:artifact:<run-id>:evidence` 这类 managed artifact ref，仍然走 event-plan-preview 和 event-plan-confirm；页面不读取 evidence 正文，不打开 source workspace，不运行 shell，不让 worker 角色登记 reviewer approval 或 main verification。

v30 的 Adoption Candidate Panel 优先读取 `/api/goals/<goal-id>/operations` 暴露的 `goal-operation-runs.v1` implementation operation，缺失时回退到 `/api/runs` 的 `symphony.console-runs`。面板把记录分成 adoptable 和 blocked：adoptable 必须来自 passed run、passed verifier status、managed evidence artifact ref、isolated workspace refs、source workspace fingerprint，并且 `mainWorktreeWrites=false`。blocked 行保留在列表里并显示哪个显式字段不满足。面板不调用 `symphony adopt --run`，不冻结 patch，不检查 recovery state，不确认采纳，不合并、不打 tag，也不根据文件名、分支名、commit message、prompt text、task title 或前端状态推断 reviewer approved、main verified 或 release ready。

v30 的 Adoption Plan Preview Workspace 位于同一 Adoption 路径下。用户从 adoptable implementation run 点击 freeze 后，浏览器只提交 `goalId`、`taskId`、`sourceRunId` 和 `operationId` 到：

```text
POST /api/goals/<goal-id|latest>/adoption-plan-freeze
```

后端重新读取 scoped operation registry，确认该 run 仍是同一 active goal/task 的 adoptable implementation result，然后复用现有 `symphony adopt --run <confirmed-run-id> --json` 冻结 adoption plan。页面显示 `adoptionPlanId`、patch artifact、patch hash、file operations、affected files、source workspace fingerprint、project/git fingerprints、inspect command 和 frozen confirmation command。该路径不接受 prompt、path、shell command、planHash、adoption confirm 字段，也不运行 `symphony adopt --confirm`，不 apply patch，不合并、不 push、不 tag、不登记 reviewer/main/release 事件。

v30 的 Adoption Inspect and Recovery View 位于 freeze 面板后面。Workbench 从同一个 active goal scoped `goal-operation-runs.v1` 中读取最近的 `commandKind: "adoption-plan"` operation，只用其中的 frozen `adoptionPlanId` 生成：

```text
GET /api/adoptions/<adoption-id>/inspect
```

该 route 复用既有 `symphony adopt --inspect <adoption-id> --json` 的只读 builder。页面显示 journal status、adoption plan/patch refs、patch hash、file operation before/after hash、current worktree 是否匹配 after hash、current worktree 是否仍匹配 journal before files、latest confirmation run、source run/evidence context 和 copy-only recovery command。页面不接受用户输入 adoption id、path、shell command、confirm/apply 字段，不登记 reviewer/main/release 事件，也不从文件名、branch、commit message、prompt text、task title 或前端状态推断 readiness。

v30 的 controlled adoption confirm 位于 inspect/recovery 面板同一路径。用户确认前，Workbench 只从 scoped `goal-operation-runs.v1` 里的 frozen `commandKind: "adoption-plan"` operation 生成请求体：

```text
POST /api/goals/<goal-id|latest>/adoption-confirm
```

JSON body 只允许 `goalId`、`taskId`、`adoptionPlanId` 和 `operationId`。后端重新读取同一 active goal/task 的 frozen adoption-plan operation，确认 adoption id、operation id、patch refs 和 goal/task context 匹配后，复用既有 `symphony adopt --confirm <adoption-id> --json`。成功后返回 `controlled-adoption-confirmation.v1`、新的 `commandKind: "adoption-confirm"` operation、刷新后的 active goal progress、events、runs、operations 和 next action。这个 confirm 会让既有 adoption CLI 把 frozen patch 应用到 main worktree，但不会 merge、push、tag、publish，也不会登记 reviewer、main verification 或 release readiness。

v30 adoption evidence bridge 用 task worker evidence、route tests、Workbench build 和 release evidence 文档把这条路径接到 verified workflow。worker evidence 只说明 task-5 实现和验收命令结果；release evidence 只列出待 release manager 核验的 gate 输入。两者都不是 reviewer approval、main verification 或 release readiness。Workbench 页面可以显示 adoption confirm 的 `mainWorktreeWrites=true` 结果和 `reviewerEventRegistered=false`、`mainVerificationEventRegistered=false`、`releaseReadinessRegistered=false` safety 字段，但不能把它们变成审批、main verification 或 release gate。

v31 的 Main Verification Readiness 位于 Verification 路径下。面板只读取 active goal 的 `goal-progress-ledger.v1`、`goal-event-log.v1`、`goal-next-action.v1`、`goal-closeout-report.v1`、`goal-operation-runs.v1`，以及有 frozen adoption plan 时的 `symphony.console-adoption-inspect`。它展示当前 task、reviewer verdict、adoption state、blockers、验证命令、copy-only gate dry-run 命令、显式状态来源和被忽略的 inference source。进入 main verification 需要显式 `reviewer.approved` 或 event-backed goal-status verdict；如果同一 goal/task 有 confirmed `adoption-plan` operation，还要等 confirmed `adoption-confirm` run state passed。`reviewer.needs-revision`、`main.verification-failed`、未通过的 adoption confirm、缺失 review evidence 都会显示为 blocker。面板不读取 evidence 正文，不打开本地文件，不运行 merge 或验证命令，不写 main verification evidence，不登记 `goal gate`，也不从 branch、文件名、commit message、prompt text、task title、copy-only command 或前端状态判断 ready。

v31 的 allowlisted verification plan preview 挂在同一个 Main Verification Readiness 面板内。预览固定列出 `pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，并且只允许从 active goal/task contract 中带入受控上下文命令，例如当前 goal 的 `goal-status` 和 `goal next` JSON 读取命令。面板显示 goal id、task id、latest run id/status、worker/review evidence refs、adoption operation refs 和已有 main verification ref；这些字段只用于定位即将验证的上下文，不会被前端改写成通过状态。任意 shell 文本、浏览器输入、路径、prompt、branch 和 task title 都不会进入命令列表。浏览器只展示 copy-only 命令，不运行验证命令，不打开终端，不写 event，不登记 main-verification gate。

v27 的 Review Workspace 位于 active goal 主路径。它从既有 contract 组合当前 task 的审查上下文：changed files、source run、source workspace 字段、worker evidence ref、copy-only reviewer prompt、runbook/prompt checklist、expected `reviewer.approved` / `reviewer.needs-revision` verdict event 和 dry-run review registration command。Reviewer handoff 区块显示由 `symphony goal prompt --role reviewer` 生成 prompt 的 route/command、review evidence path、最近 worker actor，以及 reviewer id 必须不同于 worker actor 的约束。Review verdict registration 区块复用 `symphony goal review` dry-run preview 和 plan-hash confirm，只允许登记 `approved` 或 `needs-revision`，confirm 成功后重新读取 goal progress、events、next action 和 operation state。面板不读取 evidence 正文，不打开 workspace，不运行 shell，不启动 subagent，也不从 source run、文件名、branch、commit message 或前端状态推断 approval。

v27 的完整 review -> revision -> verify loop 只看显式 event：

- `reviewer.approved` 后，`goal next` 把同一个 task 交给 `main-verifier`，等待 `main.verification-passed` 或 `main.verification-failed`。
- `reviewer.needs-revision` 后，`goal prompt --next` 生成 revision worker prompt，带上失败 verdict、review evidence、失败命令、latest run changed files 和需要重跑的验收命令。
- `main.verification-failed` 后，`goal prompt --next` 也生成 revision worker prompt，失败命令来自 gate event 或 latest failed run。
- revision worker 重新登记 `worker.evidence-recorded` 后，`goal next` 回到 `reviewer`，不会跳过二次独立审查，也不会因为之前曾经 approved 就直接进入 main verification。

这个 loop 仍然使用 `goal-status -> goal next -> goal prompt -> goal update/review/gate`。Workbench 可以展示 dry-run preview 和 confirm 结果，但不能替 worker 修复、替 reviewer 批准、替 main verifier 合并，不能从 evidence 文件名、分支名、commit message 或 prompt 文案推断状态。

## v20 Active Goal Workbench workflow

v20 Workbench 的主路径从 active goal 开始。打开 `/workbench/` 后，第一组面板是 Active Goal Runbook 和 Active Goal Task Queue；Next Action Card、Prompt Preview Drawer、Review Workspace、ActiveGoalViewModel 和 Closeout Gaps 紧跟其后。既有 summary、runs、handoff、events、capabilities 和 diagnostics 面板保留在后面，用于核对状态和安全边界。

这些面板把 managed runbook、event-backed ledger、next action、prompt pack 和 closeout gap report 合在一个 Workbench 区域展示，但不改变状态。

终端操作流程：

```sh
pnpm --silent symphony goal init --goal v20-goal-workbench-active-goal-surface --from-json fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json --dry-run --json
pnpm --silent symphony goal init --goal v20-goal-workbench-active-goal-surface --from-json fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json --confirm --plan-hash sha256:<PLAN_HASH> --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal prompt --goal v20-goal-workbench-active-goal-surface --task task-5 --role worker --markdown
pnpm --silent symphony goal prompt --goal v20-goal-workbench-active-goal-surface --next --markdown
pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony next --goal latest --json
```

当前 `goal init` 只接受受控 fixture JSON：`fixtures/contracts/goal-runbook.*.v1.json`。它不解析 markdown plan，不读取任意 JSON 路径，不写任意 output path。dry-run 只返回 `goal-runbook-init-plan.v1`；confirm 必须带同一输入生成的 `--plan-hash`，只写 managed runbook state 和 latest active goal pointer。

Workbench active goal 面板：

- Active Goal Runbook：第一屏展示 `goal-runbook.v1` 中的 goal、baseline、tasks、expected evidence、release gates 和 role policy。
- Active Goal Task Queue：第一屏展示 runbook task 顺序、ledger status/statusSource、event-backed evidence refs、next role 和 active events route 状态。
- Next Action Card：展示 `goal-next-action.v1` 中的 next task、required role、phase、reason、blocked 状态、copy-only commands 和 after-completion registration。
- Prompt Preview：展示 `goal-prompt-pack.v1` 或 next action 中的 copy-only `/goal` 文本。这里没有执行按钮、agent 启动、模型调用、终端写入或 event confirm。
- Review Workspace：展示 active task 的 changed files、source run、worker evidence、review prompt、review checklist 和 expected verdict event；review verdict 只能通过 `goal review` dry-run preview 和 plan-hash confirm 写入。这里没有 evidence 正文读取、workspace 打开、shell 执行、agent 启动或前端状态推断。
- ActiveGoalViewModel：展示 goal-status、goal next、goal prompt 和 goal closeout 这些 command-backed source 的 contract 与 route 状态，不回到旧的 scan/do/review/verify/status/continue/artifacts 顶层动作列表。
- Closeout Gaps：展示 `goal-closeout-report.v1` 的 missing worker evidence、review evidence、main verification、release gates 和 release-ready source。v28 同一面板增加 release verification checklist、`release.ready` gate dry-run/confirm 表单和 tag evidence prompt；v32 同一面板增加 release baseline resolver、release evidence draft、tag evidence draft 和 next-version handoff draft，显示 current branch、main HEAD、origin/main、worktree cleanliness、PR/CI ref、tag recommendation、target commit、release notes summary、task/release gate evidence anchors 和 v33 起步上下文。dirty、非 main 或 main/origin 不一致时，该面板只给 stop/fix guidance，不显示可确认的 `release.ready` 表单。release checklist 中的每个 gate 只显示 copy-only validation command，并通过固定的 `release.gate-passed` / `release.gate-failed` 表单登记 explicit gate event；tag command 和 next-version context commands 只作为 copy-only 文本展示，页面不运行 `pnpm`、`audit`、`mcas doctor`、`git diff`、`git tag`、push 或 publish，也不创建 v33 goal。

Active Goal API 只接受 `GET`：

```text
GET /api/goals/latest/runbook
GET /api/goals/<goal-id>/runbook
GET /api/goals/latest/next
GET /api/goals/<goal-id>/next
GET /api/goals/latest/prompt
GET /api/goals/<goal-id>/prompt
GET /api/goals/latest/closeout
GET /api/goals/<goal-id>/closeout
```

如果没有 managed runbook，`goal-next-action.v1` 可以返回 `status: missing-runbook`，并给出 copy-only `symphony goal init` dry-run 命令。Workbench 不能替操作者确认 runbook，也不能把 `missing-runbook` 修成浏览器写入流程。

release-ready 边界：

- `pnpm check`、`pnpm test`、`pnpm workbench:build`、`pnpm test:mutation:gate`、`pnpm audit --audit-level high`、`git diff --check` 和 `pnpm mcas doctor` 通过，只是命令证据。
- 对应 release gate 需要用 `symphony goal gate --gate release.<gate> --status passed` dry-run / confirm 登记。
- Release baseline 必须来自 `/api/readiness` 的后端 git/GitHub 命令输出。dirty worktree、当前分支不是 `main`、或 `main` 与 `origin/main` 不一致时，Workbench 不提供最终 release-ready 判断入口。
- 最终 release-ready 需要 `symphony goal gate --gate release.ready --status declared` dry-run / confirm，产生 `release.ready-declared` event。
- Workbench 只展示 `summary.releaseReady`、`releaseReadySource`、closeout gaps、release checklist 状态、release evidence draft、tag evidence draft、copy-only gate commands 和 copy-only tag command，不能从命令文本、分支、文件名、prompt preview 或 closeout 文案推断 release-ready。

## Capabilities 和 Diagnostics

Workbench 的 Capabilities panel 读取 `GET /api/capabilities`，展示 `capabilities.v1`：

- `readOnly: true`
- `displayOnly: true`
- `copyOnly: true`
- `mutationAvailable: false`
- `browserExecutionAvailable: false`
- `modelInvocationAvailable: false`
- `artifactDownloadAvailable: false`
- safe preview inline mode 只允许 `bounded-text`

这些字段只用于展示可用性和不可用性，不能被前端用来打开写入、执行、下载或模型调用入口。

Diagnostics panel 读取 `GET /api/diagnostics`，展示 `diagnostics.v1` 的状态、checks 和 boundaries。该 route 只做安全的本地状态读取，不运行 shell、测试、audit、mutation、package install 或模型调用，也不接受 query path 或 body path。

## Error Envelope

Console API 的相关错误路径使用 `error-envelope.v1`：

```json
{
  "contractName": "error-envelope.v1",
  "contractVersion": 1,
  "ok": false,
  "error": {
    "code": "blocked-artifact-path",
    "message": "Artifact preview is blocked by safety policy.",
    "status": 403,
    "route": "/api/runs/<run-id>/artifacts/<artifact-kind>/preview",
    "method": "GET"
  }
}
```

错误响应不能包含 stack trace、绝对本地路径、secret、仓库源码内容或原始异常文本。Workbench 只展示 envelope 中的安全 code、message、status、route 和 method。

## Safe Artifact Preview

safe preview 的来源是后端返回的 `safe-artifact-preview.v1` contract。Workbench 只使用 artifact ref 上的后端 `uri`，不根据 artifact kind、path、扩展名、MIME 或内容片段拼接 preview route。

后端 contract 需要明确提供这些字段，Workbench 才能显示对应值：

- `uri`
- `ref`
- `mime`
- `displayTitle`
- `artifactKind`
- `sourceRunId`
- `sizeBytes`
- `previewAvailable`
- `safeToRenderInline`
- `truncated`
- `truncationReason`
- `maxPreviewBytes`
- `downloadAvailable`

只有同时满足以下条件时，Workbench 才能 inline 显示文本：

- payload 是 `safe-artifact-preview.v1`。
- `previewAvailable === true`。
- `safeToRenderInline === true`。
- 后端提供字符串 `contentText` 或 `previewText`。

inline 内容只能放在 `<pre><code>` 文本节点中。HTML、JavaScript、SVG、binary、directory、missing artifact、blocked artifact、未知 MIME 和缺少 safety 字段的 payload 都不能作为正文渲染。`downloadAvailable` 当前必须是 `false`；Workbench 不提供下载、打开本地路径、复制本地路径或任意路径输入。

后端 safe preview 边界：

- 只读取 run state 已登记 artifact ref。
- 只允许 `.symphony` state root 和同级 `artifacts/` safe root。
- 阻止 `package.json`、lockfile、`src/`、`docs/`、symlink、hardlink 和 safe root 外路径。
- 超过 200 KiB 的安全文本 preview 只返回截断内容，并标记 `truncated` 与 `truncationReason`。

字段缺失时按 contract gap 处理。前端不能推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`uri`、`ref`、`sourceRunId`、`sizeBytes` 或 truncation 状态。

## Stage Charter 边界

Stage Charter JSON / HTML 是独立的 Stage display artifact：

- JSON 路径形如 `docs/stages/<stage-id>.stage.json`。
- HTML 路径形如 `docs/stages/<stage-id>.html`。
- Stage Charter JSON 是机器源，HTML 是生成后的展示产物，并参与一致性检查。

React/Vite Workbench 不替换、不编辑、不解析 Stage Charter HTML / JSON。Console server 中 `/workbench` app route fallback 只覆盖 Workbench 路由；`/docs/stages/*.html`、`/docs/stages/*.stage.json`、`/workbench/docs/stages/*.html` 和 `/workbench/docs/stages/*.stage.json` 不会被 React app 替代。

## 禁止能力

Workbench 不提供也不应暗示以下能力：

- Autopilot
- Workbench execution
- browser terminal
- write
- execute
- retry
- adopt
- apply
- rollback
- delete
- install
- mutation
- audit
- model invocation
- arbitrary path read
- arbitrary path preview
- artifact download
- download artifact
- open local file
- automatic merge
- automatic tag

这些词如果出现在 Workbench 数据里，只能是只读状态、字段名、历史 run 信息、copy-only command 文本或文档说明。浏览器端不能把它们接成按钮、表单、链接、handler、HTTP mutation、terminal action、模型调用、真实 agent 调用、package installer、文件下载或本地文件打开。

## 故障排查

`/workbench/` 返回 404 或资源缺失：

先运行 `pnpm workbench:build`，确认 `src/symphony/workbench-static/index.html` 和 `src/symphony/workbench-static/assets/` 存在。不要把缺失资源问题修成任意目录静态服务。

端口 `8765` 被占用：

使用当前已支持的 `--port` 参数，例如 `pnpm symphony console --port 8766`。仍建议绑定 `127.0.0.1`。

Workbench 显示没有 runs：

这是合法状态。可以在终端运行 `pnpm symphony scan` 生成本地只读 scan state，再重新打开或刷新 Workbench。

Handoff panel 显示不可用：

先检查 `/api/handoff` 是否返回 registered ref，再检查 `/api/handoff/guided-goal-handoff.v1` 是否返回 `guided-goal-handoff.v1`。未知 ref、query path、encoded traversal 和非 GET 返回拒绝状态是预期安全边界。

Artifact preview 字段缺失：

按 contract gap 处理。前端不能推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`uri`、`ref` 等字段；需要后端 API contract 明确补齐。

HTML artifact 没有显示正文：

这是预期行为。`text/html` 可以作为 MIME 显示，但只要 `safeToRenderInline` 为 `false`，Workbench 就不能展示 HTML 正文，也不能把它交给浏览器解析。

Preview 返回 `blocked-artifact-path`：

这是安全边界，不是 Workbench 故障。v17 safe preview route 会通过 `error-envelope.v1` 返回这个 code。常见原因包括 artifact ref 指向仓库 `package.json`、lockfile、`src/`、`docs/`、symlink、hardlink 或 safe root 外路径。

在 `pnpm workbench:dev` 页面看到 API 读取失败：

`workbench:dev` 是前端源码调试入口，不是完整 console server parity 验证入口。使用 `pnpm workbench:build` 后通过 `pnpm symphony console` 访问 `/workbench/`。

看到 `405`：

这是安全边界，不是故障。Workbench 和 `/api/*` 当前只接受 `GET`；写入、执行、采纳、回滚、删除、安装、mutation、audit、下载、本地打开和模型调用必须保持不可由浏览器触发。

Stage Charter HTML / JSON 没有在 Workbench 中打开：

这是预期边界。Stage Charter 文件不是 React Workbench 的替代页面，也不由 `/workbench` fallback 服务。

## 已知限制

- React/Vite Workbench 当前是只读展示层，不是执行面。
- 当前 React frontend 只消费受控 `GET` contract；不直接读取 `.symphony` 私有结构、ArtifactStore 内部结构或 Stage Charter HTML。
- Handoff commands 只作为文本显示，不提供浏览器执行、复制按钮或队列入口。
- Goal Progress 只展示后端 ledger 状态，不从前端推断任务完成度或 release readiness。
- Artifact inline preview 只支持后端明确标记为 safe 的 bounded text。
- 没有 artifact 下载、打开本地路径、任意路径输入或任意 artifact 预览。
- 没有 browser write、execute、retry、adopt、apply、rollback、delete、install、mutation、audit、model invocation。
- `/` 仍保留既有 console HTML；React/Vite Workbench 当前入口是 `/workbench/`。
- Stage Charter HTML / JSON 继续独立存在，不被 React Workbench 替换。
