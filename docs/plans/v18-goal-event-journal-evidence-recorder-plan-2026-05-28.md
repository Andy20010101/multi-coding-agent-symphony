# v18 计划：Goal Event Journal + Evidence Recorder

日期：2026-05-28
状态：draft
基线：v17 已发布能力
目标仓库：`Andy20010101/multi-coding-agent-symphony`

## 目标

v18 增加受控 CLI 目标事件登记层。worker、reviewer、main verification、release gate evidence 必须通过显式事件登记进入 append-only goal event log，再由 resolver 生成现有 `goal-progress-ledger.v1`。Workbench 继续只读展示，不获得写入、执行、下载或打开本地文件能力。

v16 已提供：

- `guided-goal-handoff.v1`：大目标拆分、角色分工、copy-only handoff。
- `safe-artifact-preview.v1`：后端授权的受限安全预览。

v17 已提供：

- `goal-progress-ledger.v1`：只读目标进度 ledger。
- `capabilities.v1`：后端声明能力边界。
- `diagnostics.v1`：只读诊断合同。
- `error-envelope.v1`：安全 API 错误包络。

v18 补齐的问题：

- v17 ledger 能展示状态，但缺少受控、可审计的事件登记来源。
- worker/reviewer/main/release evidence 仍容易散落在聊天记录或临时文档里。
- `approved`、`main-verified`、`release-ready` 必须来自明确登记事件，不能由文件名、命令文本、分支名或 Workbench 前端推断。
- release gate evidence 需要和目标状态生成规则绑定，避免最后只靠人工总结宣称 ready。

## 本次规划提交范围

本次只新增规划文档：

- `docs/plans/v18-goal-event-journal-evidence-recorder-plan-2026-05-28.md`
- `docs/plans/v18-execution-prompts-2026-05-28.md`

本次不实现功能代码、不改测试、不改 README、不改 Workbench、不改 lockfile。

本文中的命令块均为 copy-only：用于后续人工复制执行或放入 prompt，不表示文档会自动执行命令。

## v18 产品边界

允许：

- 新增 `goal-event-log.v1` 合同、fixtures、validator、append-only 存储规则。
- 新增 `goal-update-plan.v1` 合同，作为 dry-run 输出和 confirm 输入校验依据。
- 新增受控 CLI：
  - `symphony goal update`
  - `symphony goal review`
  - `symphony goal gate`
- 每个 CLI 均采用 dry-run / confirm 双阶段。
- 新增 event log 到 `goal-progress-ledger.v1` 的 resolver 规则。
- 新增只读 events API：
  - `GET /api/goals/latest/events`
  - `GET /api/goals/<goal-id>/events`
- Workbench 新增只读 `Goal Events Timeline` 和 `Evidence Matrix`。
- 保持 v17 兼容：没有 events 时，`goal-status` 仍返回 planned/unknown 模板。
- 增加测试、route smoke、安全扫描、operator docs 和 release evidence。

不允许：

- 不包含 Autopilot。
- 不包含 Workbench execution。
- 不包含 browser terminal。
- 不包含 artifact download。
- 不包含 open local file。
- 不包含 arbitrary path preview。
- 不包含 model invocation。
- 不包含自动 merge。
- 不包含自动 tag。
- Workbench 不写入 event log。
- 浏览器不触发 CLI、不执行 shell、不调用模型、不提交 review、不登记 gate。
- CLI 不根据分支名、文件名、命令文本、路径、任务标题自动推断 `approved`、`main-verified` 或 `release-ready`。

## 设计原则

1. 事件先于状态。
   - `goal-progress-ledger.v1` 仍是展示合同。
   - v18 的事实来源是 append-only `goal-event-log.v1`。
   - resolver 只能从明确登记事件生成状态。

2. dry-run 默认安全。
   - `symphony goal update/review/gate` 默认输出 `goal-update-plan.v1`。
   - dry-run 不写文件、不创建 evidence、不修改 `.symphony`、不调用模型、不运行测试。
   - confirm 必须带回 dry-run 输出中的 plan hash 或同等校验字段。

3. confirm 只做 append。
   - confirm 只追加事件，不改写、不删除、不重排历史事件。
   - 修正错误只能追加 superseding event 或 blocker/resolution event。
   - event log 保留完整历史，resolver 按规则解释最新有效状态。

4. Workbench 只读。
   - Workbench 可展示 timeline、matrix、missing evidence、release gate 状态。
   - Workbench 不提供登记、编辑、删除、下载、打开文件、执行命令或模型调用入口。
   - Workbench 不从文本、路径、扩展名、任务名、分支名推断安全或状态。

5. 兼容 v17。
   - `goal-progress-ledger.v1` 合同名和版本不因为 v18 事件源而升级。
   - 没有 event log 时，resolver 输出 v17 既有 planned/unknown 模板。
   - v17 fixtures、CLI 和 read-only API 不应被破坏。

## `goal-event-log.v1` 合同设计

### 用途

`goal-event-log.v1` 记录一个 goal 的目标事件流。它不是 release evidence 总结，也不是 Workbench 可编辑状态。它是 append-only 的事件登记账本，供 resolver 生成 `goal-progress-ledger.v1`。

它回答：

- 哪个 goal 在哪个基线上登记了哪些事件。
- 每个 task 的 worker evidence、review evidence、main verification evidence 是否已显式登记。
- release gate evidence 是否已显式登记。
- 某个状态来自哪条事件，而不是来自推断。
- event log 是否保持追加链路完整。

### 建议 JSON 形状

```json
{
  "contractName": "goal-event-log.v1",
  "contractVersion": 1,
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "goalTitle": "Goal Event Journal + Evidence Recorder",
  "baseline": {
    "tag": "v17",
    "commit": null,
    "evidenceRef": "docs/plans/v17-release-evidence-2026-05-28.md"
  },
  "log": {
    "appendOnly": true,
    "storage": "managed-goal-event-journal",
    "eventCount": 2,
    "firstSequence": 1,
    "lastSequence": 2,
    "lastEventId": "evt_20260528_task1_review_approved",
    "lastEventHash": "sha256:..."
  },
  "events": [
    {
      "eventId": "evt_20260528_task1_worker_self_checked",
      "sequence": 1,
      "goalId": "v18-goal-event-journal-evidence-recorder",
      "taskId": "task-1",
      "eventType": "worker.self-check-passed",
      "phase": "implement",
      "actor": {
        "role": "worker",
        "id": "codex-worker-task-1"
      },
      "occurredAt": "2026-05-28T10:00:00.000Z",
      "recordedAt": "2026-05-28T10:02:00.000Z",
      "branch": "v18-task1-goal-event-contracts",
      "commit": null,
      "evidenceRefs": [
        {
          "kind": "repo-doc",
          "ref": "docs/plans/v18-task1-contracts-evidence-2026-05-28.md",
          "label": "Task 1 worker evidence"
        }
      ],
      "statement": "Worker self-check completed for contract fixtures and validator.",
      "previousEventHash": null,
      "eventHash": "sha256:..."
    },
    {
      "eventId": "evt_20260528_task1_review_approved",
      "sequence": 2,
      "goalId": "v18-goal-event-journal-evidence-recorder",
      "taskId": "task-1",
      "eventType": "reviewer.approved",
      "phase": "review",
      "actor": {
        "role": "reviewer",
        "id": "codex-reviewer-task-1"
      },
      "occurredAt": "2026-05-28T10:30:00.000Z",
      "recordedAt": "2026-05-28T10:31:00.000Z",
      "branch": "v18-task1-goal-event-contracts",
      "commit": "abc1234",
      "review": {
        "verdict": "APPROVED",
        "scope": "task-1 diff and contract tests"
      },
      "evidenceRefs": [
        {
          "kind": "repo-doc",
          "ref": "docs/plans/v18-task1-review-evidence-2026-05-28.md",
          "label": "Task 1 independent review evidence"
        }
      ],
      "statement": "Independent reviewer approved Task 1.",
      "previousEventHash": "sha256:...",
      "eventHash": "sha256:..."
    }
  ]
}
```

### Event 字段要求

- `eventId`：稳定唯一 id。confirm 重试时同一 event id 必须幂等处理，不能重复登记为两条不同事件。
- `sequence`：由 append-only writer 分配，严格递增。
- `goalId`：目标 id，不能从路径推断。
- `taskId`：可选；release-level event 可为空或使用 `release`。
- `eventType`：枚举值。
- `phase`：`plan`、`implement`、`review`、`land`、`main-verification`、`release-gate`、`release-prep`。
- `actor.role`：`planner`、`worker`、`reviewer`、`main-verifier`、`release-verifier`、`release-manager`。
- `actor.id`：操作者标识。可为人工输入或 CLI profile，不作为权限证明。
- `occurredAt`：事件实际发生时间，由登记者提供或 CLI 生成。
- `recordedAt`：写入 event log 的时间。
- `branch` / `commit`：可为空；不能单独作为完成证据。
- `evidenceRefs`：只记录受控 evidence ref，不读取任意本地路径。
- `statement`：短说明，不能替代 evidence。
- `previousEventHash` / `eventHash`：用于 append chain 检查。

### Event type 枚举

```text
goal.planned
task.planned
worker.started
worker.evidence-recorded
worker.self-check-passed
worker.self-check-failed
reviewer.review-requested
reviewer.approved
reviewer.needs-revision
reviewer.blocked
main.merged
main.verification-passed
main.verification-failed
release.gate-passed
release.gate-failed
release.evidence-recorded
release.ready-declared
blocker.opened
blocker.resolved
```

### Evidence ref 规则

`evidenceRefs[]` 是引用，不是文件读取请求。允许的 ref 类型应由 validator 明确限定：

- `repo-doc`：仓库内已知 evidence 文档引用，建议限定在 `docs/plans/`，resolver/API/Workbench 不读取正文。
- `artifact-ref`：现有注册 artifact ref。
- `commit`：git commit sha。
- `command-evidence`：记录某个验证命令的 evidence 文档或受控运行 ref。
- `external-note`：只允许短文本标签，不允许 URL 自动抓取。

不允许：

- 任意绝对路径。
- `file://`。
- `~/`。
- `../` traversal。
- 浏览器可点击的本地打开路径。
- 通过 evidence ref 触发下载、预览、读取或命令执行。

### Append-only 存储规则

建议底层使用受控 state 目录内的 NDJSON 或等价追加格式，但 API 和 resolver 对外只暴露规范化 `goal-event-log.v1`。

写入规则：

- 只有 CLI confirm 可写入。
- dry-run 不写入。
- confirm 只追加一条或一组事件。
- 已存在 event 不修改。
- 撤销或修正通过追加新事件表达。
- 每条事件包含前一条事件 hash，形成 append chain。
- chain 校验失败时，resolver 返回 safe error 或 diagnostics warning，不能继续生成乐观状态。

## `goal-update-plan.v1` 合同设计

### 用途

`goal-update-plan.v1` 是 `symphony goal update/review/gate --dry-run` 的输出。它让用户和 reviewer 在写入前看到 CLI 准备追加哪些事件、哪些字段通过校验、哪些证据缺失、确认命令需要哪些参数。

它不是 event log。它是 confirm 前的可审查计划。

### 建议 JSON 形状

```json
{
  "contractName": "goal-update-plan.v1",
  "contractVersion": 1,
  "planId": "plan_20260528_task1_review_approved",
  "planHash": "sha256:...",
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "mode": "dry-run",
  "command": {
    "name": "symphony goal review",
    "intent": "record-review-verdict",
    "confirmRequired": true
  },
  "actor": {
    "role": "reviewer",
    "id": "codex-reviewer-task-1"
  },
  "proposedEvents": [
    {
      "eventType": "reviewer.approved",
      "taskId": "task-1",
      "phase": "review",
      "requiresEvidence": true,
      "evidenceRefs": [
        {
          "kind": "repo-doc",
          "ref": "docs/plans/v18-task1-review-evidence-2026-05-28.md",
          "label": "Task 1 independent review evidence"
        }
      ]
    }
  ],
  "validation": {
    "status": "ok",
    "errors": [],
    "warnings": []
  },
  "preconditions": [
    {
      "id": "reviewer-is-not-worker",
      "status": "ok",
      "message": "Reviewer id differs from worker id recorded for this task."
    }
  ],
  "wouldAppend": {
    "appendOnly": true,
    "eventCount": 1,
    "target": "managed-goal-event-journal",
    "writesInDryRun": false
  },
  "ledgerPreview": {
    "contractName": "goal-progress-ledger.v1",
    "statusSource": "goal-update-plan.v1 dry-run preview",
    "changes": [
      {
        "taskId": "task-1",
        "fromStatus": "needs-review",
        "toStatus": "approved",
        "reason": "explicit reviewer.approved event would be appended"
      }
    ]
  },
  "confirm": {
    "available": true,
    "requiredFlags": ["--confirm", "--plan-hash"],
    "copyOnlyCommand": "symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --confirm --plan-hash sha256:..."
  },
  "safety": {
    "dryRunWrites": false,
    "confirmWritesAppendOnly": true,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false,
    "arbitraryPathReadAvailable": false
  }
}
```

### Plan 校验规则

- dry-run 必须输出 `planHash`。
- confirm 必须重新计算同一 plan hash。
- confirm 输入和 dry-run 输入不一致时拒绝写入。
- `goal-update-plan.v1` 不从本地任意 path 读取计划文件。
- 不接受 `--plan-file <path>` 这类任意路径读取入口。
- 可以接受完整 CLI 参数加 `--plan-hash` 的确认方式。
- plan 中的 `ledgerPreview` 只是预览，不能写入 ledger。
- plan 的 `confirm.copyOnlyCommand` 只是文本，Workbench 不执行。

## CLI 设计：dry-run / confirm 双阶段

所有 v18 CLI 写入命令默认 dry-run。只有带 `--confirm --plan-hash <hash>` 时才允许 append-only 写入。

### `symphony goal update`

用途：登记 worker 或 task-level evidence event。

命令块仅供复制执行：

```text
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --dry-run
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.self-check-passed --actor codex-worker-task-1 --evidence-ref docs/plans/v18-task1-worker-evidence-2026-05-28.md --dry-run
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.self-check-passed --actor codex-worker-task-1 --evidence-ref docs/plans/v18-task1-worker-evidence-2026-05-28.md --confirm --plan-hash sha256:...
```

规则：

- `worker.started` 可无 evidence ref。
- `worker.self-check-passed` 必须有 worker evidence ref。
- worker 只能登记 worker 事件，不能登记 reviewer 或 release gate 事件。
- worker self-check 不等于 reviewer approval。

### `symphony goal review`

用途：登记独立 reviewer verdict。

命令块仅供复制执行：

```text
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --dry-run
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --confirm --plan-hash sha256:...
```

规则：

- verdict 只能是 `approved` 或 `needs-revision`。
- `approved` 映射为 `reviewer.approved` event。
- `needs-revision` 映射为 `reviewer.needs-revision` event。
- reviewer id 不能等于该 task 最近 worker id。
- reviewer evidence ref 必填。
- CLI 不能根据 review 文档标题、文件名或文本自动判断 verdict。

### `symphony goal gate`

用途：登记 main verification 和 release gate evidence。

命令块仅供复制执行：

```text
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate main-verification --task task-1 --status passed --verifier codex-main-verifier --evidence-ref docs/plans/v18-task1-main-verification-evidence-2026-05-28.md --dry-run
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.pnpm-check --status passed --verifier codex-release-verifier --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --dry-run
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.ready --status declared --verifier codex-release-manager --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --confirm --plan-hash sha256:...
```

规则：

- `main-verification --status passed` 映射为 `main.verification-passed`。
- `main-verification --status failed` 映射为 `main.verification-failed`。
- release gate pass/fail 映射为 `release.gate-passed` 或 `release.gate-failed`。
- `release.ready --status declared` 映射为 `release.ready-declared`。
- `release-ready` 不能只因为所有 gate passed 自动出现；必须存在明确 `release.ready-declared` event。

## Resolver：event log 到 `goal-progress-ledger.v1`

### 输入

resolver 可读取：

- `goal-event-log.v1` 规范化事件。
- v17 `guided-goal-handoff.v1` 中的 goal/task plan。
- v17 既有 registered goal state。
- 受控 release gate 配置。

resolver 不可读取：

- 用户传入任意路径。
- evidence ref 指向的正文内容。
- Workbench query/body。
- 浏览器本地文件。
- 网络资源。

### 无 events 兼容规则

如果 goal 没有 events：

- `symphony goal-status` 仍返回 v17 的 planned/unknown 模板。
- `goal-progress-ledger.v1.summary.releaseReady` 为 `false`。
- task status 使用 handoff/fixture 中的 `planned`，缺失字段为 `unknown`。
- `statusSource` 使用 `v17-template-no-events` 或同等明确来源。
- events API 返回空 `events: []`，不返回错误。
- Workbench Timeline 显示“未登记事件”，Evidence Matrix 显示 missing/unknown。

### 状态映射规则

task 状态只从显式事件生成：

| 状态 | 必需事件 | 说明 |
|---|---|---|
| `planned` | `task.planned` 或 v17 handoff task | 没有事件时可来自既有计划 |
| `in-progress` | `worker.started` | 不能由分支存在推断 |
| `self-checked` | `worker.self-check-passed` | worker 自测只算 self-check |
| `needs-review` | `reviewer.review-requested` 或 worker self-check 后显式请求 review | 不等于 approved |
| `needs-revision` | `reviewer.needs-revision` | 需要 review evidence |
| `approved` | `reviewer.approved` | 需要独立 review evidence |
| `merged-to-main` | `main.merged` | 不能由当前分支名推断 |
| `main-verified` | `main.verification-passed` | 需要 main verification evidence |
| `blocked` | 未解决的 `blocker.opened` 或 `reviewer.blocked` | `blocker.resolved` 后解除 |
| `release-ready` | `release.ready-declared` | goal-level release 状态，不能由 gate 全 passed 自动推断 |
| `unknown` | 缺少明确事件或计划 | 不猜测 |

优先级：

1. 未解决 blocker 优先显示 `blocked`。
2. 最新 `reviewer.needs-revision` 优先于较早 `reviewer.approved`。
3. `main.verification-failed` 优先于较早 `main.verification-passed`，直到新 passed event 覆盖。
4. `release.gate-failed` 优先于同 gate 较早 passed event。
5. 相同 task 的状态按 sequence 递增解释，不能重排历史。
6. hash chain 失败时不生成乐观状态，返回安全错误或 diagnostics warning。

### Evidence coverage 规则

`goal-progress-ledger.v1` 增加或填充已有 evidence 字段：

- `workerEvidenceRef` 来自最新有效 worker evidence event。
- `reviewEvidenceRef` 来自最新有效 reviewer verdict event。
- `reviewVerdict` 只来自 `reviewer.approved` 或 `reviewer.needs-revision`。
- `mainVerificationRef` 只来自 `main.verification-passed` 或 `main.verification-failed`。
- release gates 只来自 `release.gate-passed` / `release.gate-failed`。
- 缺失 evidence 显示 `missing` 或 `unknown`。
- resolver 不读取 evidence 文档正文来寻找命令结果。

## Read-only Events API

新增 API：

```text
GET /api/goals/latest/events
GET /api/goals/<goal-id>/events
```

行为：

- 只允许 GET。
- 非 GET 使用 `error-envelope.v1` 返回 405。
- unknown goal 使用 `error-envelope.v1` 返回 404。
- 没有 events 时返回有效 `goal-event-log.v1`，其中 `events: []`。
- 不接受路径参数以外的 filesystem input。
- 不读取 query/body 中的 path。
- 编码 traversal、绝对路径、`file://`、`~/` 一律不能触发本地读取。
- 响应不暴露本地绝对路径、stack trace、secret、repo 文件正文。

建议响应：

```json
{
  "contractName": "goal-event-log.v1",
  "contractVersion": 1,
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "goalTitle": "Goal Event Journal + Evidence Recorder",
  "baseline": {
    "tag": "v17",
    "commit": null,
    "evidenceRef": null
  },
  "log": {
    "appendOnly": true,
    "storage": "managed-goal-event-journal",
    "eventCount": 0,
    "firstSequence": null,
    "lastSequence": null,
    "lastEventId": null,
    "lastEventHash": null
  },
  "events": []
}
```

## Workbench 只读展示

### Goal Events Timeline

展示内容：

- event sequence。
- event type。
- phase。
- task id。
- actor role 和 id。
- recordedAt。
- verdict 或 gate status。
- evidence refs 的 label/ref。
- hash chain 状态。

行为限制：

- 不提供登记按钮。
- 不提供编辑、删除、重放、撤销按钮。
- 不提供打开本地文件。
- 不提供下载 evidence。
- 不调用非 GET route。
- 不从 evidence ref 读取正文。
- 不把 copy-only command 变成浏览器执行。

### Evidence Matrix

按 task 展示：

- worker evidence。
- reviewer verdict。
- review evidence。
- merge/main verification evidence。
- blocker 状态。
- release gate 覆盖。

显示规则：

- 缺失显示 `missing` 或 `unknown`。
- `approved` 只显示在存在 `reviewer.approved` event 时。
- `main-verified` 只显示在存在 `main.verification-passed` event 时。
- `release-ready` 只显示在存在 `release.ready-declared` event 时。
- UI 不根据 task title、branch、commit、文件名、evidence ref 文本推断状态。

## 任务拆分和角色隔离

每个 task 必须拆成三步：

1. implement：worker 实现当前 task，并登记 worker evidence。
2. review：独立 reviewer 只读审查 diff、测试和安全边界，返回 `APPROVED` 或 `NEEDS_REVISION`。
3. land：main verifier 或 maintainer 在 reviewer approved 后合并，并登记 main/post-merge verification evidence。

禁止：

- 同一个 agent 自写自批。
- 同一个 agent 自写自合并。
- worker 把 self-check 当作 review approval。
- reviewer 只依据 worker 总结，不独立读 diff 和测试。
- release gate 自动从测试命令文本推断 passed。

## v18 实施任务

### Task 1：`goal-event-log.v1` 和 `goal-update-plan.v1` 合同

范围：

- 新增两个合同的 fixtures、validator、invalid cases。
- 覆盖 event type、phase、actor role、evidence ref、append chain、plan hash、dry-run safety。
- 不实现 CLI 写入。
- 不实现 API。
- 不实现 Workbench。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
git diff --check
```

### Task 2：append-only event journal writer

范围：

- 增加受控 event journal append writer。
- 支持 idempotent event id。
- 支持 sequence 和 hash chain。
- dry-run 不写入。
- confirm 只 append。
- chain 失败时拒绝继续写入。

禁止：

- 任意路径写入。
- 删除、修改、重排历史事件。
- Workbench 写入入口。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
git diff --check
```

### Task 3：`symphony goal update`

范围：

- worker/task-level event dry-run/confirm。
- 输出 `goal-update-plan.v1`。
- confirm 校验 plan hash 后 append。
- 验证 worker self-check 不等于 approval。

验收命令块仅供复制执行：

```text
symphony goal update --goal v18-goal-event-journal-evidence-recorder --task task-1 --event worker.started --actor codex-worker-task-1 --dry-run
pnpm check
pnpm test
git diff --check
```

### Task 4：`symphony goal review`

范围：

- independent reviewer verdict dry-run/confirm。
- 支持 `approved` 和 `needs-revision`。
- reviewer evidence ref 必填。
- reviewer id 不能等于最近 worker id。

验收命令块仅供复制执行：

```text
symphony goal review --goal v18-goal-event-journal-evidence-recorder --task task-1 --reviewer codex-reviewer-task-1 --verdict approved --evidence-ref docs/plans/v18-task1-review-evidence-2026-05-28.md --dry-run
pnpm check
pnpm test
git diff --check
```

### Task 5：`symphony goal gate`

范围：

- main verification event dry-run/confirm。
- release gate event dry-run/confirm。
- `release.ready-declared` 必须显式登记。
- 不根据命令名或 gate 名自动标记 ready。

验收命令块仅供复制执行：

```text
symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.pnpm-check --status passed --verifier codex-release-verifier --evidence-ref docs/plans/v18-release-evidence-2026-05-28.md --dry-run
pnpm check
pnpm test
git diff --check
```

### Task 6：event resolver 到 `goal-progress-ledger.v1`

范围：

- 从 `goal-event-log.v1` 生成 `goal-progress-ledger.v1`。
- 无 events 时保持 v17 planned/unknown 模板。
- 明确 statusSource。
- 覆盖 needs-revision、approved、main-verified、release-ready、blocked、unknown。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
git diff --check
```

### Task 7：read-only events API

范围：

- 新增 `GET /api/goals/latest/events`。
- 新增 `GET /api/goals/<goal-id>/events`。
- 非 GET、unknown goal、encoded traversal、query path 走 safe error。
- 没有 events 返回空 log。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
git diff --check
```

### Task 8：Workbench Goal Events Timeline 和 Evidence Matrix

范围：

- 只读消费 events API 和 ledger。
- 展示 timeline、hash chain、evidence refs、review verdict、main verification、release gate matrix。
- 缺失显示 missing/unknown。

禁止：

- Workbench 写入。
- 浏览器执行。
- 下载。
- 打开本地文件。
- 从 evidence ref 读取正文。

验收命令块仅供复制执行：

```text
pnpm workbench:build
pnpm check
pnpm test
git diff --check
```

### Task 9：route smoke 和安全边界回归

范围：

- 覆盖 v16/v17/v18 read-only routes。
- 覆盖 events API 非 GET、traversal、path query、绝对路径。
- 覆盖 Workbench fallback 和 Stage Charter 边界。
- 增加静态扫描，确认无执行、写入、下载、打开本地文件、模型调用入口。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

### Task 10：docs、operator guide、release evidence

范围：

- 更新 README、Workbench Operator Guide、合同索引和 v18 release evidence。
- 记录所有 task evidence、review evidence、main verification evidence、release gate evidence。
- 明确 v18 不包含 Autopilot、Workbench execution、browser terminal、artifact download、open local file、arbitrary path preview、model invocation、自动 merge 或自动 tag。

验收命令块仅供复制执行：

```text
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
```

## Release gates

v18 release 前必须在 main 上有独立 release evidence，命令块仅供复制执行：

```text
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
```

通过标准：

- 每条命令结果记录在 release evidence。
- `git diff --check` 无输出。
- audit high 无 high 级阻断项，或按仓库既有策略记录 approved exception。
- `pnpm mcas doctor` 结果不包含 v18 发布阻断项。
- 每个 task 都有 worker evidence、independent review evidence、main/post-merge verification evidence。
- release gate events 已通过 `symphony goal gate` 显式登记。
- `release-ready` 只在 `release.ready-declared` event 存在后出现。

## 风险和处理

| 风险 | 处理 |
|---|---|
| CLI confirm 被误用为任意写入 | confirm 只能 append 到受控 journal，plan hash 不匹配就拒绝 |
| Workbench 被扩成操作台 | Workbench 只 GET events/ledger，不提供写入 handler |
| resolver 从文本猜状态 | 测试覆盖文件名、分支名、命令文本不能生成 approved/main-verified/release-ready |
| release-ready 被 gate 全 passed 自动触发 | 需要显式 `release.ready-declared` event |
| event log 损坏后仍显示乐观状态 | hash chain 失败时返回 error/diagnostics warning，不生成 ready |
| evidence ref 变成任意路径读取 | evidence ref 只作引用，API/Workbench/resolver 不读取正文 |
| 角色隔离被绕过 | reviewer id 与最近 worker id 校验；prompt 要求独立 reviewer |

## 非目标

- 不做 Autopilot。
- 不做 Workbench execution。
- 不做 browser terminal。
- 不做 Workbench 写入。
- 不做 artifact download。
- 不做 open local file。
- 不做 arbitrary path preview。
- 不做 model invocation。
- 不做自动 merge。
- 不做自动 tag。
- 不替换 `goal-progress-ledger.v1` 合同版本。
- 不让 CLI 自动跑 release gate 命令。
- 不把 evidence 文档正文解析成状态。

## v18 验收标准

v18 完成时应满足：

- `goal-event-log.v1` 合同、fixtures、validator、append-only writer 存在。
- `goal-update-plan.v1` 合同、fixtures、validator 存在。
- `symphony goal update/review/gate` 均支持 dry-run/confirm 双阶段。
- confirm 只 append 事件，dry-run 无写入。
- resolver 从 events 生成 `goal-progress-ledger.v1`，无 events 时保留 v17 planned/unknown 模板。
- `GET /api/goals/latest/events` 和 `GET /api/goals/<goal-id>/events` 只读可用。
- Workbench 显示 `Goal Events Timeline` 和 `Evidence Matrix`，只读展示。
- no-events、missing evidence、needs-revision、approved、main-verified、release-ready、blocked 都有测试覆盖。
- 每个 task 的 implement/review/land 均有 evidence，且不是同一个 agent 自写自批自合并。
- release gates 全部有 evidence。
- 明确记录 v18 不包含 Autopilot、Workbench execution、browser terminal、artifact download、open local file、arbitrary path preview、model invocation、自动 merge 或自动 tag。

最终验收命令块仅供复制执行：

```text
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
```
