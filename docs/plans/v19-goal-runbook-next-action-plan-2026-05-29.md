# v19 计划：Goal Runbook + Next Action Control Center

Date: 2026-05-29
Status: draft
Baseline: `v18` released tag
Target repo: `Andy20010101/multi-coding-agent-symphony`
Recommended release name: `v19 Goal Runbook + Next Action Control Center`

## 1. 一句话目标

v19 不做“单纯安全延展”。v19 的核心是把 v18 的目标事件登记能力产品化成一个可操作的目标执行中控：

```text
plan/runbook -> task queue -> next action -> copy-only Codex prompt -> evidence registration -> closeout report
```

v18 已经能登记事实；v19 要让 Symphony 根据这些事实告诉操作者：

- 当前 goal 还差什么。
- 下一步应该让哪个角色做什么。
- 应该复制哪段 `/goal` prompt 给 Codex。
- 做完后应该登记哪类 evidence event。
- release closeout 还缺哪些 gate 或 evidence。

这会让项目从“能记录状态”推进到“能指导执行”。

## 2. 为什么 v19 现在适合做这个

v18 已经补上 `goal-event-log.v1`、`goal-update-plan.v1`、`symphony goal update/review/gate`、event-backed `goal-progress-ledger.v1`、events API、Workbench Goal Events Timeline 和 Evidence Matrix。

但 v18 之后仍有一个产品空档：

- `goal-event-log.v1` 记录发生过什么，但不定义完整 goal runbook。
- `goal-progress-ledger.v1` 展示当前状态，但不生成下一步执行 prompt。
- v16 的 guided handoff 更像静态 handoff，不会根据 v18 event log 自动推进到下一个角色。
- 当前 `symphony next` 更偏 Stage summary，还没有把 active goal、event log、review state、release gate 合成一个 operator next action。
- Workbench 能看 timeline 和 matrix，但还不能展示“下一步该复制哪段 prompt”。

v19 的核心不应该是继续堆边界提示，而应该补“执行流产品体验”。安全边界继续继承 v16-v18，但不是 v19 的主卖点。

## 3. 产品定位

### v19 名称

`Goal Runbook + Next Action Control Center`

### 用户视角

理想命令面：

```sh
symphony goal init --from docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md --goal v19-goal-runbook-next-action --dry-run
symphony goal next --goal v19-goal-runbook-next-action
symphony goal prompt --goal v19-goal-runbook-next-action --task task-1 --role worker --markdown
symphony goal closeout --goal v19-goal-runbook-next-action --markdown
symphony next --goal latest
```

Workbench 视角：

```text
Active Goal
  Goal: v19-goal-runbook-next-action
  Current task: task-3
  Required role: independent reviewer
  Why: worker evidence exists, reviewer verdict missing
  Copy-only prompt: [text block]
  Evidence to register after completion: reviewer.approved or reviewer.needs-revision
  Release gaps: mutation gate unknown, audit high unknown, tag evidence missing
```

## 4. v19 范围

### 允许实现

1. 新增 `goal-runbook.v1` 合同、fixtures、validator。
2. 新增 `goal-next-action.v1` 合同、fixtures、validator。
3. 新增 `goal-prompt-pack.v1` 合同，用于生成 worker/reviewer/main-verifier/release-manager copy-only prompts。
4. 新增 `goal-closeout-report.v1` 合同，用于 release closeout 前的 evidence/gate gap report。
5. 新增 managed goal runbook registry，只保存 goal id、task plan、role policy、release gates、evidence policy 和 refs。
6. 新增 CLI：
   - `symphony goal init`
   - `symphony goal next`
   - `symphony goal prompt`
   - `symphony goal closeout`
7. 扩展 `symphony next`，优先读取 active goal next action；没有 active goal 时保留 Stage summary 行为。
8. Workbench 增加只读面板：
   - Active Goal Runbook
   - Next Action Card
   - Prompt Preview
   - Closeout Gaps
9. 新增 docs、operator guide、release evidence、task evidence index。
10. 新增测试覆盖 runbook、next-action resolver、prompt pack、Workbench read-only display、CLI JSON 稳定性。

### 不作为 v19 主范围

这些边界继续保持，但不是 v19 的“产品核心”：

- 不做 Autopilot。
- 不做 Workbench execution。
- 不做 browser terminal。
- 不做浏览器 confirm。
- 不做自动 merge。
- 不做自动 tag。
- 不做 model invocation。
- 不做 arbitrary path preview。
- 不做 artifact download。
- 不把 prompt preview 变成执行按钮。
- 不让 `symphony goal next` 自己运行测试、audit、mutation 或 agent。

### 可留给 v20 的范围

- Mac Notch Companion。
- GitHub PR/Issue 状态同步。
- CI status sync。
- 更完整的 real Codex/Claude/Kiro controlled execution loop。
- 多 goal 并行 dashboard。

v19 可以为 Mac Notch Companion 提供 `goal-next-action.v1`，但不直接做 notch app。

## 5. 新合同设计

### 5.1 `goal-runbook.v1`

用途：定义一个 goal 的可执行任务蓝图。它不是 evidence，也不是完成状态。它只定义“应该怎么推进”。

建议 JSON 形状：

```json
{
  "contractName": "goal-runbook.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "goalTitle": "v19 Goal Runbook + Next Action Control Center",
  "baseline": {
    "tag": "v18",
    "commit": null,
    "evidenceRef": "docs/plans/v18-tag-release-evidence-2026-05-29.md"
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Add goal-runbook.v1 and goal-next-action.v1 contracts",
      "branch": "v19-task1-goal-runbook-contracts",
      "roleOrder": ["worker", "reviewer", "main-verifier"],
      "acceptance": [
        "Contracts validate valid fixtures.",
        "Invalid fixtures reject missing required fields and unsafe refs."
      ],
      "expectedEvidence": {
        "worker": "worker.evidence-recorded",
        "reviewer": ["reviewer.approved", "reviewer.needs-revision"],
        "mainVerifier": "main.verification-passed"
      },
      "copyOnlyCommands": [
        "git checkout main && git pull --ff-only && git checkout -b v19-task1-goal-runbook-contracts",
        "pnpm check",
        "pnpm test",
        "git diff --check"
      ]
    }
  ],
  "releaseGates": [
    "release.pnpm-check",
    "release.pnpm-test",
    "release.workbench-build",
    "release.mutation-gate",
    "release.audit-high",
    "release.diff-check",
    "release.mcas-doctor",
    "release.docs-updated",
    "release.tag-evidence"
  ],
  "rolePolicy": {
    "workerCannotApproveOwnTask": true,
    "reviewerApprovalRequiredBeforeMainVerification": true,
    "mainVerificationRequiredBeforeReleaseReady": true
  }
}
```

Validator 要求：

- `contractName === goal-runbook.v1`。
- `contractVersion === 1`。
- `goalId` 是安全 segment，不能含 `/`、`..`、`~`、绝对路径、URL。
- `taskId` 稳定唯一。
- `branch` 只是 copy-only 文本，不是完成证据。
- `acceptance` 必须非空。
- `expectedEvidence` 只能引用 v18 已支持或 v19 明确定义的 event type。
- `evidenceRef` 只能是受控 repo-doc 或 managed artifact ref，不允许 `file://`、绝对路径、encoded traversal。
- `copyOnlyCommands` 只能作为文本输出，不可执行。

### 5.2 `goal-next-action.v1`

用途：根据 runbook + event log + ledger + stage summary 生成下一步建议。

建议 JSON 形状：

```json
{
  "contractName": "goal-next-action.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "status": "action-required",
  "next": {
    "taskId": "task-2",
    "role": "reviewer",
    "phase": "review",
    "reason": "worker evidence exists but reviewer verdict is missing",
    "blocked": false
  },
  "evidenceState": {
    "workerEvidenceRef": "docs/plans/v19-task2-worker-evidence-2026-05-29.md",
    "reviewEvidenceRef": null,
    "mainVerificationRef": null
  },
  "copyOnlyPrompt": {
    "available": true,
    "format": "markdown",
    "text": "/goal\n审查 v19 Task 2..."
  },
  "copyOnlyCommands": [
    "pnpm check",
    "pnpm test",
    "git diff --check"
  ],
  "afterCompletion": {
    "registerWith": "symphony goal review",
    "allowedEvents": ["reviewer.approved", "reviewer.needs-revision"]
  }
}
```

Resolver 规则：

1. 如果 runbook 缺失，返回 `status: missing-runbook`。
2. 如果 event log chain invalid，返回 `status: blocked`，不能继续推荐执行。
3. 如果某 task 无 worker evidence，next 是 `worker`。
4. 如果 worker evidence exists 且 reviewer verdict missing，next 是 `reviewer`。
5. 如果 reviewer.needs-revision 是最新 verdict，next 是 `worker` revision。
6. 如果 reviewer.approved exists 且 main verification missing，next 是 `main-verifier`。
7. 如果所有 tasks main-verified，但 release gate 缺失，next 是 `release-manager`。
8. 如果 release.ready-declared 且 tagEvidence passed，返回 `status: complete`。
9. 不根据分支名、文件名、commit message、command text 推断完成状态。

### 5.3 `goal-prompt-pack.v1`

用途：为每个 task 和 role 生成可复制 prompt，而不是让操作者每次手写。

建议支持角色：

- `worker`
- `reviewer`
- `main-verifier`
- `release-manager`

输出要求：

- prompt 明确 task scope。
- prompt 明确禁止 self-review。
- prompt 明确应运行哪些验证命令。
- prompt 明确 evidence file 命名。
- prompt 明确如何用 `symphony goal update/review/gate` 登记事件。
- prompt 中所有命令都是 copy-only text。

### 5.4 `goal-closeout-report.v1`

用途：release 前生成 evidence/gate gap report。

字段建议：

```json
{
  "contractName": "goal-closeout-report.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "summary": {
    "totalTasks": 8,
    "workerEvidenceComplete": true,
    "reviewEvidenceComplete": false,
    "mainVerificationComplete": false,
    "releaseReady": false
  },
  "missing": [
    {
      "kind": "review-evidence",
      "taskId": "task-4",
      "expectedEvent": "reviewer.approved"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "passed",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "tagEvidence": "missing"
  },
  "nextAction": "symphony goal next --goal v19-goal-runbook-next-action"
}
```

## 6. CLI 设计

### 6.1 `symphony goal init`

用途：注册一个 managed goal runbook。

```sh
symphony goal init --goal v19-goal-runbook-next-action --from docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md --dry-run
symphony goal init --goal v19-goal-runbook-next-action --from docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md --confirm --plan-hash sha256:...
```

v19 可以先支持两种输入：

1. `--from-json fixtures/contracts/goal-runbook.v1.json`
2. `--from docs/plans/<known-plan>.md`，只读取受控 docs/plans 内文档，并要求文档内有机器可读 runbook block。

为了避免第一版过难，建议先做 `--from-json`，然后 docs plan 内嵌 JSON fixture path。Markdown 自动解析可以留到后续。

### 6.2 `symphony goal next`

用途：读取 runbook + event log，输出下一步。

```sh
symphony goal next --goal v19-goal-runbook-next-action
symphony goal next --goal v19-goal-runbook-next-action --json
symphony goal next --goal latest --markdown
```

默认输出应该很短：

```text
Goal: v19-goal-runbook-next-action
Next: task-2 reviewer
Reason: worker evidence exists; reviewer verdict missing
Prompt: symphony goal prompt --goal v19-goal-runbook-next-action --task task-2 --role reviewer --markdown
After: symphony goal review --goal ... --task task-2 --verdict approved|needs-revision --evidence-ref ... --dry-run
```

### 6.3 `symphony goal prompt`

用途：生成指定 role 的 copy-only prompt。

```sh
symphony goal prompt --goal v19-goal-runbook-next-action --task task-2 --role reviewer --markdown
symphony goal prompt --goal latest --next --markdown
```

必须能输出完整 `/goal` block，方便直接复制给 Codex。

### 6.4 `symphony goal closeout`

用途：生成 closeout gap report。

```sh
symphony goal closeout --goal v19-goal-runbook-next-action
symphony goal closeout --goal v19-goal-runbook-next-action --json
symphony goal closeout --goal v19-goal-runbook-next-action --markdown
```

第一版建议只输出 stdout，不写 docs。若需要写入 `docs/plans/*release-evidence*`，放到 v19.1 或加 `--write-doc --confirm`。

### 6.5 `symphony next`

当前 `symphony next` 继续保留 Stage 行为，但 v19 扩展成：

1. 如果存在 active goal runbook，则返回 `goal-next-action.v1` 的摘要。
2. 如果没有 active goal，则返回现有 Stage summary。
3. 如果 goal 和 stage 同时存在，则输出 goal next，并附带 stage blocker/risk summary。

## 7. Workbench 设计

新增只读区域：`Active Goal Control Center`。

### Panel 1: Active Goal Runbook

显示：

- goal id/title/baseline。
- task list。
- 每个 task 的 expected worker/reviewer/main verifier evidence。
- 当前 task status，来自 ledger/event log，不从文本推断。

### Panel 2: Next Action Card

显示：

- next task。
- required role。
- reason。
- blocker。
- after-completion event registration command。

### Panel 3: Prompt Preview

显示：

- `goal-prompt-pack.v1` 生成的 copy-only prompt。
- 只允许复制文本。
- 不出现 execute/run/confirm 按钮。

### Panel 4: Closeout Gaps

显示：

- missing worker evidence。
- missing independent review。
- missing main verification。
- missing release gates。
- release ready source。

## 8. 实施任务拆分

### Task 1: Contracts, fixtures, validators

实现：

- `goal-runbook.v1` fixtures/validator。
- `goal-next-action.v1` fixtures/validator。
- `goal-prompt-pack.v1` fixtures/validator。
- `goal-closeout-report.v1` fixtures/validator。
- Invalid fixtures 覆盖 unsafe refs、重复 task id、空 acceptance、未知 role、未知 event type、copy-only 字段缺失。

验收：

```sh
pnpm check
pnpm test
git diff --check
```

### Task 2: Managed goal runbook registry + `symphony goal init`

实现：

- managed runbook state path。
- latest active goal pointer。
- dry-run plan。
- confirm + plan hash。
- idempotent confirm。
- 不接受任意 runbook path；第一版只接受受控 fixture 或 docs/plans 内显式 allowlisted path。

验收：

```sh
pnpm check
pnpm test
pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
git diff --check
```

### Task 3: Event-aware next-action resolver

实现：

- 从 runbook + `goal-event-log.v1` + `goal-progress-ledger.v1` 生成 `goal-next-action.v1`。
- 覆盖 worker missing、review missing、needs revision、main verification missing、release gate missing、complete、blocked 等场景。
- chain invalid 时 blocked。
- no event 时从 task-1 worker 开始。

验收：

```sh
pnpm check
pnpm test
git diff --check
```

### Task 4: Prompt pack generator + `symphony goal prompt`

实现：

- worker prompt。
- reviewer prompt。
- main-verifier prompt。
- release-manager prompt。
- `--next` 根据 resolver 自动选 task/role。
- Markdown/text/JSON 输出。

验收：

```sh
pnpm check
pnpm test
pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
git diff --check
```

### Task 5: CLI `goal next`, `goal closeout`, and `symphony next` integration

实现：

- `symphony goal next`。
- `symphony goal closeout`。
- `symphony next --goal latest`。
- 默认 `symphony next` 在有 active goal 时输出 goal next；无 active goal 时保持 Stage 行为。
- JSON 稳定合同。

验收：

```sh
pnpm check
pnpm test
pnpm symphony goal next --goal v19-fixture --json
pnpm symphony goal closeout --goal v19-fixture --json
pnpm symphony next --json
git diff --check
```

### Task 6: Workbench Active Goal Control Center

实现：

- 前端 API client contract parsing。
- Active Goal Runbook panel。
- Next Action Card。
- Prompt Preview。
- Closeout Gaps。
- Route smoke：API only GET；Workbench 不执行 prompt。

验收：

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

### Task 7: Docs, operator guide, evidence index

实现：

- README current status 更新。
- `docs/symphony-product-contracts.md` 增加 v19 contracts。
- `docs/workbench-operator-guide.md` 增加 v19 操作方式。
- `docs/plans/v19-task-evidence-index-2026-05-29.md`。
- `docs/plans/v19-release-evidence-2026-05-29.md` 初稿。

验收：

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

### Task 8: Release verification and tag evidence

实现：

- 完整 release gate rerun。
- v19 final closure evidence。
- v19 tag release evidence。
- README latest release 更新为 v19。

Release gates：

```sh
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
```

## 9. 建议执行顺序

建议继续按你现在的模式逐 task 跑，不要一次给 Codex 全部实现。

每个 task 保持三段：

1. worker implement。
2. independent reviewer review。
3. main land / post-merge verification。

v19 可以比 v18 少一点纯 safety review，但 reviewer 仍要独立看 diff、测试和产品边界。原因是 v19 会改 CLI、Workbench、contracts，容易出现“看起来只是 prompt 文本，实际破坏 JSON contract 或 Workbench fallback”的问题。

## 10. 总控 `/goal` Prompt

```text
/goal
你是 v19 总控 agent，负责按任务顺序推进 multi-coding-agent-symphony 的 v19：Goal Runbook + Next Action Control Center。

基线：
- v18 已发布，released tag 为 v18。
- v18 已提供 goal-event-log.v1、goal-update-plan.v1、symphony goal update/review/gate、event-backed goal-progress-ledger.v1、read-only events API、Workbench Goal Events Timeline 和 Evidence Matrix。

v19 目标：
- 新增 goal-runbook.v1，把一个 goal 的 task queue、role order、acceptance、release gates 和 expected evidence 结构化。
- 新增 goal-next-action.v1，根据 runbook + event log + ledger 生成下一步。
- 新增 goal-prompt-pack.v1，为 worker/reviewer/main-verifier/release-manager 生成 copy-only `/goal` prompt。
- 新增 goal-closeout-report.v1，生成 release closeout evidence/gate gap report。
- 新增 CLI：symphony goal init、symphony goal next、symphony goal prompt、symphony goal closeout。
- 扩展 symphony next，让 active goal 的 next action 成为首要输出；无 active goal 时保持现有 Stage summary。
- Workbench 新增 Active Goal Control Center，只读展示 runbook、next action、prompt preview 和 closeout gaps。

产品重点：
- v19 不是单纯安全延展。
- v19 要让用户从“看状态”进入“知道下一步复制什么 prompt 去执行”。
- 安全边界继承 v16-v18，但不是本次唯一目标。

执行规则：
- 每个 task 单独分支。
- 每个 task 必须有 worker implement、independent reviewer review、main land/post-merge verification。
- worker 可以自测，但不能自批。
- reviewer 必须独立读 diff、测试和产品边界，不能只复述 worker 总结。
- reviewer 返回 APPROVED 后，才允许进入 land。
- reviewer 返回 NEEDS_REVISION 时，只修 blocker，不扩 scope。
- 不让同一个 agent 自写自批自合并。

硬边界：
- 不做 Autopilot。
- 不做 Workbench execution。
- 不做 browser terminal。
- 不做浏览器 confirm。
- 不做 artifact download。
- 不做 arbitrary path preview。
- 不做 model invocation。
- 不做自动 merge 或自动 tag。
- Workbench 只展示 copy-only prompt，不执行 prompt。
- 不根据分支名、文件名、命令文本、task title、路径自动推断 approved/main-verified/release-ready。

任务顺序：
1. contracts, fixtures, validators。
2. managed goal runbook registry + symphony goal init。
3. event-aware next-action resolver。
4. prompt pack generator + symphony goal prompt。
5. goal next / goal closeout / symphony next integration。
6. Workbench Active Goal Control Center。
7. docs、operator guide、task evidence index、release evidence draft。
8. release verification、final closure、tag evidence。

Release gates：
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- pnpm mcas doctor

每次返回：
- 当前 task 和角色
- 变更摘要
- 文件列表
- 验证命令和结果
- 产品边界确认
- 是否需要 reviewer 或 land
```

## 11. Task 1 Worker Prompt

```text
/goal
执行 v19 Task 1 worker implement：新增 goal-runbook.v1、goal-next-action.v1、goal-prompt-pack.v1、goal-closeout-report.v1 的合同 fixtures、validator 和测试。

分支：
- 从最新 main 创建或使用：v19-task1-goal-runbook-contracts

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/symphony-product-contracts.md
- src/symphony/goal-event-contracts.js
- src/symphony/goal-progress-ledger.js
- tests/v18-goal-event-contracts.test.js

实现范围：
- 新增 goal-runbook.v1 validator。
- 新增 goal-next-action.v1 validator。
- 新增 goal-prompt-pack.v1 validator。
- 新增 goal-closeout-report.v1 validator。
- 新增 valid fixtures 和 invalid fixtures。
- 测试 unsafe ref、重复 task id、空 acceptance、未知 role、未知 event type、copy-only prompt 缺失、dry-run/confirm 字段不一致。

禁止：
- 不实现 CLI。
- 不实现 API。
- 不实现 Workbench。
- 不写 managed runbook state。
- 不新增依赖，除非单独批准。

验收命令：
- pnpm check
- pnpm test
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Contract boundary notes
- Reviewer handoff
```

## 12. Task 2 Worker Prompt

```text
/goal
执行 v19 Task 2 worker implement：新增 managed goal runbook registry 和 symphony goal init。

分支：
- 从 Task 1 合并后的最新 main 创建：v19-task2-goal-runbook-registry

实现范围：
- managed goal runbook state path。
- latest active goal pointer。
- symphony goal init --dry-run。
- symphony goal init --confirm --plan-hash。
- idempotent confirm。
- plan hash mismatch 拒绝写入。
- 第一版优先支持 --from-json fixtures/contracts/goal-runbook.valid.v1.json。

禁止：
- 不解析任意 markdown 路径。
- 不读取任意本地路径。
- 不实现 next resolver。
- 不实现 Workbench。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Managed state notes
- Reviewer handoff
```

## 13. Task 3 Worker Prompt

```text
/goal
执行 v19 Task 3 worker implement：新增 event-aware next-action resolver。

分支：
- 从 Task 2 合并后的最新 main 创建：v19-task3-next-action-resolver

实现范围：
- 根据 goal-runbook.v1 + goal-event-log.v1 + goal-progress-ledger.v1 生成 goal-next-action.v1。
- 支持 no events -> task-1 worker。
- 支持 worker evidence exists -> reviewer。
- 支持 reviewer.needs-revision -> worker revision。
- 支持 reviewer.approved -> main-verifier。
- 支持 all tasks main-verified -> release-manager gate。
- 支持 release.ready-declared + tagEvidence passed -> complete。
- 支持 invalid event chain -> blocked。

禁止：
- 不生成 prompt pack。
- 不改 Workbench。
- 不运行测试/audit/mutation 作为 resolver 副作用。

验收命令：
- pnpm check
- pnpm test
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Resolver rule notes
- Reviewer handoff
```

## 14. Task 4 Worker Prompt

```text
/goal
执行 v19 Task 4 worker implement：新增 prompt pack generator 和 symphony goal prompt。

分支：
- 从 Task 3 合并后的最新 main 创建：v19-task4-goal-prompt-pack

实现范围：
- worker prompt generator。
- reviewer prompt generator。
- main-verifier prompt generator。
- release-manager prompt generator。
- symphony goal prompt --goal <id> --task <id> --role <role> --markdown。
- symphony goal prompt --goal latest --next --markdown。
- JSON 输出返回 goal-prompt-pack.v1。

禁止：
- prompt 只输出文本，不执行命令。
- 不调用模型。
- 不写 docs。
- 不替代 reviewer approval。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Prompt examples
- Reviewer handoff
```

## 15. Task 5 Worker Prompt

```text
/goal
执行 v19 Task 5 worker implement：新增 symphony goal next、symphony goal closeout，并扩展 symphony next。

分支：
- 从 Task 4 合并后的最新 main 创建：v19-task5-goal-next-cli

实现范围：
- symphony goal next --goal <id>。
- symphony goal next --goal latest --json/--markdown。
- symphony goal closeout --goal <id> --json/--markdown。
- symphony next 在 active goal 存在时优先返回 goal-next-action summary；无 active goal 时保持 Stage summary。
- CLI JSON 稳定字段。

禁止：
- 不执行 prompt。
- 不运行 release gates。
- 不写 release evidence docs。
- 不破坏现有 Stage next 行为。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal next --goal v19-fixture --json
- pnpm symphony goal closeout --goal v19-fixture --json
- pnpm symphony next --json
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- CLI output examples
- Reviewer handoff
```

## 16. Task 6 Worker Prompt

```text
/goal
执行 v19 Task 6 worker implement：Workbench 新增 Active Goal Control Center。

分支：
- 从 Task 5 合并后的最新 main 创建：v19-task6-workbench-active-goal

实现范围：
- 前端 contract parser 支持 goal-runbook.v1、goal-next-action.v1、goal-prompt-pack.v1、goal-closeout-report.v1。
- Workbench 显示 Active Goal Runbook。
- Workbench 显示 Next Action Card。
- Workbench 显示 Prompt Preview。
- Workbench 显示 Closeout Gaps。
- Route smoke 覆盖只读 API 和 Workbench fallback。

禁止：
- 不加执行按钮。
- 不加 confirm 按钮。
- 不调用 shell/model/agent。
- 不下载或打开 artifact。
- 不从 prompt 文本推断完成状态。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench boundary notes
- Reviewer handoff
```

## 17. Task 7 Worker Prompt

```text
/goal
执行 v19 Task 7 worker implement：docs、operator guide、task evidence index、release evidence draft。

分支：
- 从 Task 6 合并后的最新 main 创建：v19-task7-docs-operator-guide

实现范围：
- README current status 增加 v19 draft/current release note。
- docs/symphony-product-contracts.md 增加 v19 contracts。
- docs/workbench-operator-guide.md 增加 v19 操作方式。
- 新增 docs/plans/v19-task-evidence-index-2026-05-29.md。
- 新增 docs/plans/v19-release-evidence-2026-05-29.md 初稿。

禁止：
- 不宣称 v19 released。
- 不宣称 tag 已创建。
- 不把 passing commands 当作 release-ready，release-ready 仍需 explicit event。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

返回：
- Summary
- Files changed
- Tests run with exact results
- Docs consistency notes
- Reviewer handoff
```

## 18. Task 8 Worker Prompt

```text
/goal
执行 v19 Task 8 release verification：完成 v19 release gates、final closure evidence 和 tag release evidence。

分支：
- main 或 release bookkeeping 分支，按仓库现有流程执行。

实现范围：
- 运行完整 release gates。
- 登记 release gate events。
- 新增 final closure evidence。
- README latest completed mainline release 更新为 v19。
- 创建并发布 annotated v19 tag 的计划和 post-tag evidence。

Release gates：
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- pnpm mcas doctor

禁止：
- 不自动 tag；tag 由人工确认执行。
- 不自动 release；release 由人工确认执行。
- 不在 evidence 中伪造未运行结果。

返回：
- Summary
- Gate command results
- Event ids registered
- Release readiness status
- Remaining blockers
```

## 19. v19 验收标准

v19 完成时应满足：

- `goal-runbook.v1` 能定义一个 goal 的 task queue、role order、acceptance、expected evidence 和 release gates。
- `symphony goal init` 能注册 active goal runbook，dry-run 不写，confirm hash 校验后只写 managed state。
- `symphony goal next` 能基于 v18 event log 给出正确下一步。
- `symphony goal prompt --next --markdown` 能输出可直接复制给 Codex 的 `/goal` prompt。
- `symphony goal closeout` 能列出 missing evidence 和 release gates。
- `symphony next` 能在 active goal 存在时优先显示 goal next action，无 active goal 时保留 Stage summary。
- Workbench 能只读展示 Active Goal、Next Action、Prompt Preview 和 Closeout Gaps。
- 所有状态仍来自后端 contracts 和 explicit events，不从文件名、路径、branch、command text 推断。
- README、product contracts、operator guide、release evidence 都更新。
- Release gates 全部通过。
- v19 tag evidence 记录 annotated tag 和 GitHub release 状态。

## 20. 我建议的 v19 取舍

优先做：

1. `goal-runbook.v1`。
2. `goal-next-action.v1`。
3. `symphony goal next`。
4. `symphony goal prompt --next --markdown`。
5. Workbench Next Action Card。

可以压缩或后置：

- Markdown 自动解析 runbook。
- 写入 docs/plans closeout report。
- Mac Notch Companion。
- GitHub PR/CI 同步。

最小有价值版本是：

```text
v18 tells me what happened.
v19 tells me what to do next and gives me the exact prompt to copy.
```
