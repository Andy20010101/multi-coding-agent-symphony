# v19 Execution Prompts: Goal Runbook + Next Action Control Center

Date: 2026-05-29  
Goal id: `v19-goal-runbook-next-action`  
Baseline: `v18` released tag  
Recommended repo path: `docs/plans/v19-execution-prompts-2026-05-29.md`

## 0. Purpose

This file gives copy-only prompts for executing v19 in the same rhythm used for v18:

```text
planning event -> task worker evidence -> independent reviewer verdict -> main verification -> release gates -> tag evidence
```

The intended release name is:

```text
v19 Goal Runbook + Next Action Control Center
```

v19 is not a pure safety extension. The product goal is to turn v18's explicit goal event log into an operator workflow:

```text
goal runbook -> next action -> copy-only prompt -> evidence registration -> closeout report
```

## 1. Current known state

The planning event has already been written successfully:

```text
status: appended
written: true
appendOnly: true
goalId: v19-goal-runbook-next-action
taskId: planning
eventId: evt_79a5cb787d2dc1b7
eventHash: sha256:c041dc4c606803737cbac2e8ffffc4b6c972e81291294846970110f563d2fc68
```

Do not re-register the planning event unless the event log was reset intentionally.

Correction note for this revision:
- Use `symphony goal update` only for worker/task-level events.
- Use `symphony goal review` for reviewer verdicts.
- Use `symphony goal gate --gate main-verification --status passed|failed` for `main.verification-*` events.
- Use `symphony goal gate --gate release.ready --status declared` for release-ready.

Before every task, run:

```bash
git checkout main
git pull --ff-only
git status -sb
```

The worktree should be clean before starting a new task branch.

Do not require `goal-status` until the v19 goal progress template has been registered. In v18, `goal update` can append an event for a goal id, but `goal-status --goal <goal-id>` only resolves goals known to the progress template/registry. If `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` returns `goal not found`, run the bootstrap section below first and do not re-register the planning event.

## 2. Global execution rules

Use one Codex `/goal` conversation per role. Do not let a worker self-review or self-approve.

Every task should follow this sequence:

```text
1. Create task branch from latest main.
2. Run worker prompt.
3. Run local worker verification.
4. Write worker evidence doc.
5. Commit worker implementation and evidence.
6. Register worker.evidence-recorded via dry-run then confirm.
7. Open a separate reviewer conversation.
8. Register reviewer.approved or reviewer.needs-revision via dry-run then confirm.
9. If approved, merge task branch into main.
10. Run main verification.
11. Write main verification evidence doc.
12. Register main verification via `symphony goal gate --gate main-verification --status passed` dry-run then confirm.
13. Push main.
```

Status must come from explicit events, not from branch names, commit messages, filenames, task titles, command text, or Workbench frontend inference.

## 2.1 Bootstrap: register v19 goal progress template if goal-status says goal not found

This bootstrap is only needed if this command fails with `goal not found`:

```bash
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

The planning event is already appended to `goal-event-log.v1`, so do not write it again. The failure means the goal-status resolver cannot find a registered progress template for `v19-goal-runbook-next-action`. Treat this as a tiny execution-bootstrap patch before Task 1.

### Bootstrap branch

```bash
git checkout main
git pull --ff-only
git checkout -b v19-bootstrap-goal-status-template
```

### Bootstrap worker prompt

```text
/goal
执行 v19 bootstrap：注册 v19-goal-runbook-next-action 的 goal progress template，使 `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` 能解析已写入的 v19 planning event，而不是返回 goal not found。

背景：
- v19 planning event 已经成功 append：evt_79a5cb787d2dc1b7。
- 不要重新登记 planning event。
- 当前问题不是 event log 写入失败，而是 goal-status 只识别已注册的 goal progress template/registry。

分支：
- 使用当前分支：v19-bootstrap-goal-status-template
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-execution-prompts-2026-05-29.md
- src/symphony/goal-progress-ledger.js
- src/symphony/goal-update.js
- src/symphony/goal-review.js
- src/symphony/goal-gate.js
- tests/v18-goal-event-ledger-resolver.test.js
- tests/v18-goal-update-cli.test.js

实现范围：
- 找到现有 goal-status / goal-progress-ledger 的 goal template/registry 入口。
- 新增 v19 goal template：goal id `v19-goal-runbook-next-action`。
- Baseline 应指向 v18 released tag。
- Template 至少包含 v19 Task 1 到 Task 8 的 planned task ids 和标题：
  - task-1: Contracts, fixtures, validators
  - task-2: Goal runbook registry and goal init
  - task-3: Next action resolver
  - task-4: Prompt pack generator
  - task-5: Goal next/prompt/closeout CLI
  - task-6: Read-only API and Workbench Active Goal Control Center
  - task-7: Docs, operator guide, and contract index
  - task-8: Release verification, final closure, and tag evidence
- Goal-status should read the already appended planning event without requiring it to be re-written.
- If no task events exist yet, tasks should remain planned/unknown; releaseReady must remain false.

禁止：
- 不实现 v19 product features。
- 不实现 goal-runbook.v1 / goal-next-action.v1 contracts。
- 不实现 CLI/API/Workbench。
- 不写新的 goal event。
- 不把 planning event 当作 task complete。
- 不把 releaseReady 推断为 true。
- 不修改 v18 goal template 语义。

验收命令：
- pnpm check
- pnpm test
- git diff --check
- pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Exact `goal-status` result summary
- Boundary notes
- Reviewer handoff
```

### Bootstrap worker evidence prompt

```text
/goal
为 v19 bootstrap 写 worker evidence 文档。

Evidence 文件：
- docs/plans/v19-bootstrap-goal-status-template-evidence-2026-05-29.md

必须记录：
- Goal id: v19-goal-runbook-next-action
- Branch: v19-bootstrap-goal-status-template
- Planning event 已存在：evt_79a5cb787d2dc1b7
- 问题：goal update 已 append event，但 goal-status 返回 goal not found
- 修改内容：注册 v19 goal progress template/registry
- 验证结果：
  - pnpm check
  - pnpm test
  - git diff --check
  - pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
- Boundary：没有实现 v19 product features，没有写新 event，没有推断 releaseReady。
```

### Bootstrap review prompt

```text
/goal
执行 v19 bootstrap independent reviewer review。

目标：
- 审查 v19-bootstrap-goal-status-template 相对 main 的 diff。
- 判断它是否只注册 v19 goal-status template/registry，解决 `goal not found`，没有扩展到 v19 product implementation。

必须检查：
- v19 goal id 是否为 `v19-goal-runbook-next-action`。
- 是否包含 task-1 到 task-8 的 planned task definitions。
- `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` 是否不再返回 goal not found。
- 没有把 planning event 解释为 task complete。
- 没有把 releaseReady 推断为 true。
- 没有重新写入 planning event。
- 没有改变 v18 goal-status 语义。

必须运行：
- pnpm check
- pnpm test
- git diff --check
- pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json

返回：
- Verdict: APPROVED 或 NEEDS_REVISION
- Reviewed files
- Commands run with exact results
- Blockers, if any
- Evidence file path: docs/plans/v19-bootstrap-goal-status-template-review-evidence-2026-05-29.md
```

### Bootstrap merge and main verification

If approved:

```bash
git checkout main
git pull --ff-only
git merge --ff-only v19-bootstrap-goal-status-template
pnpm check
pnpm test
git diff --check
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
git push origin main
```

Write main verification evidence:

```text
docs/plans/v19-bootstrap-goal-status-template-main-verification-evidence-2026-05-29.md
```

After this bootstrap is merged, continue with Task 1.

## 3. Common event registration commands

Replace `sha256:<PLAN_HASH>` with the hash returned by the dry-run command.

### Worker evidence event

```bash
pnpm --silent symphony goal update \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-v19-<task-id>-worker \
  --evidence-ref docs/plans/v19-<task-id>-worker-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal update \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-v19-<task-id>-worker \
  --evidence-ref docs/plans/v19-<task-id>-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

### Reviewer approved event

```bash
pnpm --silent symphony goal review \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-v19-<task-id>-reviewer \
  --evidence-ref docs/plans/v19-<task-id>-review-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal review \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-v19-<task-id>-reviewer \
  --evidence-ref docs/plans/v19-<task-id>-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

### Reviewer needs-revision event

```bash
pnpm --silent symphony goal review \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --verdict needs-revision \
  --reviewer codex-v19-<task-id>-reviewer \
  --evidence-ref docs/plans/v19-<task-id>-review-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal review \
  --goal v19-goal-runbook-next-action \
  --task <task-id> \
  --verdict needs-revision \
  --reviewer codex-v19-<task-id>-reviewer \
  --evidence-ref docs/plans/v19-<task-id>-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

### Main verification event

`main.verification-passed` is not accepted by `symphony goal update`. Register main verification through `symphony goal gate` using `--gate main-verification` and `--status passed`.

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-v19-main-verifier \
  --evidence-ref docs/plans/v19-<task-id>-main-verification-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-v19-main-verifier \
  --evidence-ref docs/plans/v19-<task-id>-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Failure form to avoid:

```bash
symphony goal update --event main.verification-passed
```

`goal update` is worker/task-event only. `goal gate --gate main-verification --status passed` maps to the same event type internally after validation. If flag names ever drift, run `pnpm symphony goal gate --help`, then preserve dry-run first, plan-hash confirm second.

---

# Task 1: Contracts, fixtures, validators

Branch: `v19-task1-goal-runbook-contracts`  
Worker evidence: `docs/plans/v19-task1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task1-main-verification-evidence-2026-05-29.md`

## Task 1 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task1-goal-runbook-contracts
```

## Task 1 worker prompt

```text
/goal
执行 v19 Task 1 worker implement：新增 goal-runbook.v1、goal-next-action.v1、goal-prompt-pack.v1、goal-closeout-report.v1 的合同 fixtures、validator 和测试。

分支：
- 使用当前分支：v19-task1-goal-runbook-contracts
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

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

产品目标：
- v19 不是继续做纯安全延展。
- v19 的核心是把 v18 的 goal event log 推进成 Goal Runbook + Next Action Control Center。
- Task 1 只做 contracts / fixtures / validators，为后续 goal init、goal next、goal prompt、goal closeout 提供稳定合同。

禁止：
- 不实现 CLI。
- 不实现 API。
- 不实现 Workbench。
- 不写 managed runbook state。
- 不新增依赖，除非单独批准。
- 不修改 README release 状态。
- 不宣称 v19 已发布。
- 不根据分支名、文件名、命令文本、task title、路径自动推断 approved/main-verified/release-ready。

验收命令：
- pnpm check
- pnpm test
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Contract boundary notes
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 1 worker evidence prompt

```text
/goal
为 v19 Task 1 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task1-worker-evidence-2026-05-29.md

要求：
- 记录 goal id：v19-goal-runbook-next-action。
- 记录 task id：task-1。
- 记录分支：v19-task1-goal-runbook-contracts。
- 摘要说明新增的 contracts、fixtures、validators、tests。
- 精确记录已运行命令和结果：pnpm check、pnpm test、git diff --check。
- 明确边界：无 CLI、无 API、无 Workbench、无 managed state、无 release 状态更新。
- 写出 reviewer handoff：reviewer 需要检查合同字段稳定性、invalid fixture 覆盖、v18 兼容性。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 1 worker commit and event

```bash
pnpm check
pnpm test
git diff --check
git status -sb
git add .
git commit -m "Add v19 goal runbook contracts"
```

Register `worker.evidence-recorded` for `task-1` using the common worker evidence commands.

## Task 1 reviewer prompt

```text
/goal
执行 v19 Task 1 independent reviewer review。

目标：
- 审查当前分支 v19-task1-goal-runbook-contracts 相对 main 的 diff。
- 独立检查合同、fixtures、validator、测试是否符合 v19 plan。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。
- 如果有 blocker，返回 NEEDS_REVISION 和明确修改清单。
- 如果无 blocker，返回 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task1-worker-evidence-2026-05-29.md
- docs/symphony-product-contracts.md
- src/symphony/goal-event-contracts.js
- tests/v18-goal-event-contracts.test.js
- 当前分支相对 main 的 diff

必须检查：
- goal-runbook.v1 / goal-next-action.v1 / goal-prompt-pack.v1 / goal-closeout-report.v1 合同字段是否稳定。
- invalid fixtures 是否覆盖 unsafe refs、重复 task id、空 acceptance、未知 role、未知 event type、copy-only prompt 缺失、dry-run/confirm 字段不一致。
- 是否误加 CLI、API、Workbench 或 managed state。
- 是否新增依赖或破坏 v18 contracts。
- 是否保持 v18 event log / goal-progress-ledger 行为兼容。

必须运行：
- pnpm check
- pnpm test
- git diff --check

输出要求：
- 写入 docs/plans/v19-task1-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready。
```

If approved, register `reviewer.approved` for `task-1`. If needs revision, register `reviewer.needs-revision`, then return to a worker revision prompt.

## Task 1 main verification prompt

```text
/goal
执行 v19 Task 1 main verification。

前提：
- v19-task1-goal-runbook-contracts 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task1-goal-runbook-contracts；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 git diff --check。
- 写入 docs/plans/v19-task1-main-verification-evidence-2026-05-29.md。

Evidence 文档必须记录：
- goal id、task id、branch、main commit。
- merge 方式。
- 命令结果。
- 当前 task 是否 main verification passed。
- 不宣称 release ready。

完成后返回：
- Summary
- Main commit
- Commands and exact results
- Evidence file path
- 下一步应登记 main.verification-passed event
```

Register main verification for `task-1` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 2: Managed goal runbook registry + `symphony goal init`

Branch: `v19-task2-goal-runbook-registry`  
Worker evidence: `docs/plans/v19-task2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task2-main-verification-evidence-2026-05-29.md`

## Task 2 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task2-goal-runbook-registry
```

## Task 2 worker prompt

```text
/goal
执行 v19 Task 2 worker implement：新增 managed goal runbook registry 和 symphony goal init。

分支：
- 使用当前分支：v19-task2-goal-runbook-registry
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- Task 1 新增的 v19 contract validators 和 fixtures
- src/symphony/goal-update.js
- src/symphony/goal-event-journal.js 或现有 managed event journal 相关实现
- src/symphony/cli entrypoint / scripts/symphony.js 中 goal 子命令接线位置
- tests/v18-goal-update-cli.test.js
- tests/v18-goal-event-journal.test.js

实现范围：
- 新增 managed goal runbook state path。
- 新增 latest active goal pointer。
- 新增 symphony goal init --dry-run。
- 新增 symphony goal init --confirm --plan-hash。
- confirm 必须校验 plan hash。
- confirm 只写 managed runbook state，不写 arbitrary path。
- confirm 应支持 idempotent retry，同一 plan 不重复产生冲突状态。
- 第一版优先支持 --from-json fixtures/contracts/goal-runbook.valid.v1.json。
- 输出稳定 JSON，包含 contractName、goalId、planHash、write intent、confirm command、state refs。

禁止：
- 不解析任意 markdown 路径。
- 不读取任意本地路径。
- 不实现 next-action resolver。
- 不实现 goal prompt。
- 不实现 Workbench。
- 不运行模型。
- 不自动登记 reviewer/main/release events。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Managed state notes
- CLI output example
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 2 worker evidence prompt

```text
/goal
为 v19 Task 2 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task2-worker-evidence-2026-05-29.md

要求：
- 记录 goal id：v19-goal-runbook-next-action。
- 记录 task id：task-2。
- 记录分支：v19-task2-goal-runbook-registry。
- 摘要说明 managed runbook registry、active goal pointer、goal init dry-run/confirm/hash/idempotency。
- 精确记录已运行命令和结果。
- 粘贴或概述 `pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json` 的关键输出字段。
- 明确边界：不解析任意 markdown、不读 arbitrary path、不实现 next resolver、不实现 Workbench。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 2 worker commit and event

```bash
pnpm check
pnpm test
pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
git diff --check
git status -sb
git add .
git commit -m "Add v19 goal runbook registry"
```

Register `worker.evidence-recorded` for `task-2`.

## Task 2 reviewer prompt

```text
/goal
执行 v19 Task 2 independent reviewer review。

目标：
- 审查当前分支 v19-task2-goal-runbook-registry 相对 main 的 diff。
- 独立检查 managed runbook registry 和 symphony goal init 是否符合 v19 plan。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task2-worker-evidence-2026-05-29.md
- Task 1 的 v19 contract validator/fixtures
- 当前分支相对 main 的 diff

必须检查：
- dry-run 是否不写 managed state。
- confirm 是否必须带 plan hash，hash mismatch 是否拒绝写入。
- confirm 是否只写 managed runbook state 和 active goal pointer。
- idempotent confirm 是否不会重复破坏 state。
- --from-json 是否限制在受控 fixture/allowlisted path。
- 是否未加入 arbitrary markdown parsing、Workbench、next resolver、model invocation。
- 是否保持 v18 goal update/review/gate 行为兼容。

必须运行：
- pnpm check
- pnpm test
- pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json
- git diff --check

输出要求：
- 写入 docs/plans/v19-task2-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready。
```

Register reviewer verdict for `task-2`.

## Task 2 main verification prompt

```text
/goal
执行 v19 Task 2 main verification。

前提：
- v19-task2-goal-runbook-registry 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task2-goal-runbook-registry；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json。
- 运行 git diff --check。
- 写入 docs/plans/v19-task2-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-2` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 3: Event-aware next-action resolver

Branch: `v19-task3-next-action-resolver`  
Worker evidence: `docs/plans/v19-task3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task3-main-verification-evidence-2026-05-29.md`

## Task 3 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task3-next-action-resolver
```

## Task 3 worker prompt

```text
/goal
执行 v19 Task 3 worker implement：新增 event-aware next-action resolver。

分支：
- 使用当前分支：v19-task3-next-action-resolver
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- Task 1 v19 contracts/fixtures/validators
- Task 2 managed runbook registry
- src/symphony/goal-progress-ledger.js
- src/symphony/goal-event-journal.js 或现有 event log reader
- tests/v18-goal-event-ledger-resolver.test.js

实现范围：
- 根据 goal-runbook.v1 + goal-event-log.v1 + goal-progress-ledger.v1 生成 goal-next-action.v1。
- no events -> task-1 worker。
- worker evidence exists + reviewer verdict missing -> reviewer。
- reviewer.needs-revision 是最新 verdict -> worker revision。
- reviewer.approved + main verification missing -> main-verifier。
- all tasks main-verified + release gate missing -> release-manager。
- `release.ready` declared + tagEvidence passed -> complete。
- invalid event chain -> blocked，不能继续推荐执行。
- 输出 reason、afterCompletion allowed events、copy-only command hints。

禁止：
- 不生成 prompt pack。
- 不实现 symphony goal prompt。
- 不改 Workbench。
- 不运行测试/audit/mutation 作为 resolver 副作用。
- 不从 branch、filename、commit message、command text 推断完成状态。

验收命令：
- pnpm check
- pnpm test
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Resolver rule notes
- Scenario coverage list
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 3 worker evidence prompt

```text
/goal
为 v19 Task 3 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task3-worker-evidence-2026-05-29.md

要求：
- 记录 goal id、task id、branch。
- 摘要说明 next-action resolver 的输入、输出和规则。
- 逐条列出覆盖场景：no events、worker missing、review missing、needs revision、main verification missing、release gate missing、complete、blocked chain。
- 精确记录 pnpm check、pnpm test、git diff --check 的结果。
- 明确边界：resolver 不执行命令、不生成 prompt pack、不改 Workbench、不推断状态。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 3 worker commit and event

```bash
pnpm check
pnpm test
git diff --check
git status -sb
git add .
git commit -m "Add v19 next action resolver"
```

Register `worker.evidence-recorded` for `task-3`.

## Task 3 reviewer prompt

```text
/goal
执行 v19 Task 3 independent reviewer review。

目标：
- 审查当前分支 v19-task3-next-action-resolver 相对 main 的 diff。
- 独立检查 resolver 是否严格从 runbook + event log + ledger 生成 goal-next-action.v1。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task3-worker-evidence-2026-05-29.md
- Task 1/2 相关实现
- tests/v18-goal-event-ledger-resolver.test.js
- 当前分支相对 main 的 diff

必须检查：
- no events 是否从 task-1 worker 开始。
- worker evidence exists 是否推进到 reviewer。
- reviewer.needs-revision 是否回到 worker revision。
- reviewer.approved 是否推进到 main-verifier。
- all tasks main-verified 是否推进到 release-manager gate。
- `release.ready` declared + tagEvidence passed 是否 complete。
- invalid event chain 是否 blocked。
- resolver 是否没有运行测试、shell、model、audit、mutation 的副作用。
- resolver 是否没有从分支名、文件名、commit message、命令文本推断状态。

必须运行：
- pnpm check
- pnpm test
- git diff --check

输出要求：
- 写入 docs/plans/v19-task3-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-3`.

## Task 3 main verification prompt

```text
/goal
执行 v19 Task 3 main verification。

前提：
- v19-task3-next-action-resolver 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task3-next-action-resolver；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 git diff --check。
- 写入 docs/plans/v19-task3-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-3` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 4: Prompt pack generator + `symphony goal prompt`

Branch: `v19-task4-goal-prompt-pack`  
Worker evidence: `docs/plans/v19-task4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task4-main-verification-evidence-2026-05-29.md`

## Task 4 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task4-goal-prompt-pack
```

## Task 4 worker prompt

```text
/goal
执行 v19 Task 4 worker implement：新增 prompt pack generator 和 symphony goal prompt。

分支：
- 使用当前分支：v19-task4-goal-prompt-pack
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- Task 1 goal-prompt-pack.v1 validator
- Task 2 managed runbook registry
- Task 3 next-action resolver
- scripts/symphony.js / CLI goal 子命令接线
- tests covering CLI markdown/json output patterns

实现范围：
- worker prompt generator。
- reviewer prompt generator。
- main-verifier prompt generator。
- release-manager prompt generator。
- symphony goal prompt --goal <id> --task <id> --role <role> --markdown。
- symphony goal prompt --goal latest --next --markdown。
- JSON 输出返回 goal-prompt-pack.v1。
- Markdown 输出必须是 copy-only prompt，不出现执行按钮语义。
- Prompt 中必须包含 task scope、禁止 self-review、验证命令、evidence 文件命名、event registration guidance。

禁止：
- prompt 只输出文本，不执行命令。
- 不调用模型。
- 不写 docs。
- 不替代 reviewer approval。
- 不登记 event。
- 不从 prompt 文本推断完成状态。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Prompt examples
- Copy-only boundary notes
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 4 worker evidence prompt

```text
/goal
为 v19 Task 4 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task4-worker-evidence-2026-05-29.md

要求：
- 记录 goal id、task id、branch。
- 摘要说明 worker/reviewer/main-verifier/release-manager prompt generator。
- 记录 symphony goal prompt 的 markdown 和 JSON 输出能力。
- 精确记录 pnpm check、pnpm test、pnpm symphony goal prompt ...、git diff --check 的结果。
- 粘贴一个短 prompt 输出示例，确认是 copy-only。
- 明确边界：不执行 prompt、不调用模型、不写 docs、不替代 reviewer approval、不登记 event。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 4 worker commit and event

```bash
pnpm check
pnpm test
pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
git diff --check
git status -sb
git add .
git commit -m "Add v19 goal prompt pack"
```

Register `worker.evidence-recorded` for `task-4`.

## Task 4 reviewer prompt

```text
/goal
执行 v19 Task 4 independent reviewer review。

目标：
- 审查当前分支 v19-task4-goal-prompt-pack 相对 main 的 diff。
- 独立检查 prompt pack generator 和 symphony goal prompt 是否符合 v19 plan。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task4-worker-evidence-2026-05-29.md
- Task 1/2/3 相关实现
- 当前分支相对 main 的 diff

必须检查：
- worker/reviewer/main-verifier/release-manager prompt 是否都存在。
- prompt 是否明确 task scope、禁止 self-review、验证命令、evidence 命名、event registration guidance。
- `--next` 是否通过 resolver 选 task/role，而不是猜测。
- JSON 输出是否符合 goal-prompt-pack.v1。
- markdown 输出是否 copy-only，不执行命令、不调用模型、不登记 event。
- 是否未破坏 existing CLI。

必须运行：
- pnpm check
- pnpm test
- pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
- git diff --check

输出要求：
- 写入 docs/plans/v19-task4-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-4`.

## Task 4 main verification prompt

```text
/goal
执行 v19 Task 4 main verification。

前提：
- v19-task4-goal-prompt-pack 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task4-goal-prompt-pack；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown。
- 运行 git diff --check。
- 写入 docs/plans/v19-task4-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-4` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 5: CLI `goal next`, `goal closeout`, and `symphony next` integration

Branch: `v19-task5-goal-next-cli`  
Worker evidence: `docs/plans/v19-task5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task5-main-verification-evidence-2026-05-29.md`

## Task 5 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task5-goal-next-cli
```

## Task 5 worker prompt

```text
/goal
执行 v19 Task 5 worker implement：新增 symphony goal next、symphony goal closeout，并扩展 symphony next。

分支：
- 使用当前分支：v19-task5-goal-next-cli
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- Task 1-4 实现
- 当前 symphony next / Stage summary 实现
- tests covering symphony next and CLI JSON output

实现范围：
- symphony goal next --goal <id>。
- symphony goal next --goal latest --json/--markdown。
- symphony goal closeout --goal <id> --json/--markdown。
- symphony next 在 active goal 存在时优先返回 goal-next-action summary。
- 无 active goal 时保持现有 Stage summary 行为。
- goal closeout 输出 goal-closeout-report.v1，列出 missing evidence 和 release gate gaps。
- CLI JSON 稳定字段。

禁止：
- 不执行 prompt。
- 不运行 release gates。
- 不写 release evidence docs。
- 不登记 events。
- 不破坏现有 Stage next fallback 行为。
- 不让 closeout 把 passed tests 自动解释为 release-ready。

验收命令：
- pnpm check
- pnpm test
- pnpm symphony goal next --goal v19-fixture --json
- pnpm symphony goal closeout --goal v19-fixture --json
- pnpm symphony next --json
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- CLI output examples
- Stage fallback notes
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 5 worker evidence prompt

```text
/goal
为 v19 Task 5 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task5-worker-evidence-2026-05-29.md

要求：
- 记录 goal id、task id、branch。
- 摘要说明 goal next、goal closeout、symphony next active-goal integration。
- 精确记录 pnpm check、pnpm test、goal next、goal closeout、symphony next、git diff --check 的结果。
- 记录 JSON contract names：goal-next-action.v1、goal-closeout-report.v1。
- 明确无 active goal 时 Stage summary fallback 未破坏。
- 明确边界：不执行 prompt、不运行 release gates、不写 release evidence、不登记 events、不推断 release-ready。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 5 worker commit and event

```bash
pnpm check
pnpm test
pnpm symphony goal next --goal v19-fixture --json
pnpm symphony goal closeout --goal v19-fixture --json
pnpm symphony next --json
git diff --check
git status -sb
git add .
git commit -m "Add v19 goal next CLI"
```

Register `worker.evidence-recorded` for `task-5`.

## Task 5 reviewer prompt

```text
/goal
执行 v19 Task 5 independent reviewer review。

目标：
- 审查当前分支 v19-task5-goal-next-cli 相对 main 的 diff。
- 独立检查 goal next、goal closeout、symphony next integration 是否符合 v19 plan。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task5-worker-evidence-2026-05-29.md
- Task 1-4 相关实现
- 现有 Stage next 行为
- 当前分支相对 main 的 diff

必须检查：
- goal next 是否读取 active runbook/event log/resolver，而不是猜测。
- goal closeout 是否输出 missing evidence/gates，而不是宣称 ready。
- symphony next 有 active goal 时是否优先 goal next，无 active goal 时是否保留 Stage summary。
- JSON 输出是否稳定且合同名正确。
- CLI 是否没有执行 prompt、release gate、model、shell 副作用。

必须运行：
- pnpm check
- pnpm test
- pnpm symphony goal next --goal v19-fixture --json
- pnpm symphony goal closeout --goal v19-fixture --json
- pnpm symphony next --json
- git diff --check

输出要求：
- 写入 docs/plans/v19-task5-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-5`.

## Task 5 main verification prompt

```text
/goal
执行 v19 Task 5 main verification。

前提：
- v19-task5-goal-next-cli 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task5-goal-next-cli；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm symphony goal next --goal v19-fixture --json。
- 运行 pnpm symphony goal closeout --goal v19-fixture --json。
- 运行 pnpm symphony next --json。
- 运行 git diff --check。
- 写入 docs/plans/v19-task5-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-5` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 6: Workbench Active Goal Control Center

Branch: `v19-task6-workbench-active-goal`  
Worker evidence: `docs/plans/v19-task6-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task6-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task6-main-verification-evidence-2026-05-29.md`

## Task 6 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task6-workbench-active-goal
```

## Task 6 worker prompt

```text
/goal
执行 v19 Task 6 worker implement：Workbench 新增 Active Goal Control Center。

分支：
- 使用当前分支：v19-task6-workbench-active-goal
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- Task 1-5 实现
- src/symphony/console.js
- src/symphony/workbench 或当前 React/Vite Workbench 源码
- tests/workbench-route-smoke.test.js
- v16/v17/v18 Workbench boundary tests

实现范围：
- 前端 contract parser 支持 goal-runbook.v1、goal-next-action.v1、goal-prompt-pack.v1、goal-closeout-report.v1。
- Workbench 显示 Active Goal Runbook panel。
- Workbench 显示 Next Action Card。
- Workbench 显示 Prompt Preview。
- Workbench 显示 Closeout Gaps。
- Route smoke 覆盖只读 API 和 Workbench fallback。
- Prompt Preview 只展示 copy-only 文本。

禁止：
- 不加执行按钮。
- 不加 confirm 按钮。
- 不调用 shell/model/agent。
- 不下载或打开 artifact。
- 不从 prompt 文本推断完成状态。
- 不让浏览器写 event log 或 runbook registry。
- 不破坏 v16 safe preview、v17 goal progress、v18 events timeline/matrix。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench boundary notes
- UI behavior notes
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 6 worker evidence prompt

```text
/goal
为 v19 Task 6 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task6-worker-evidence-2026-05-29.md

要求：
- 记录 goal id、task id、branch。
- 摘要说明 Active Goal Runbook、Next Action Card、Prompt Preview、Closeout Gaps。
- 精确记录 pnpm check、pnpm test、pnpm workbench:build、git diff --check 的结果。
- 说明 Workbench 仍为 read-only / display-only / copy-only。
- 明确没有 execute、confirm、terminal、download、open local file、model invocation、event log write。
- 说明 v16/v17/v18 panels 未破坏。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 6 worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Add v19 active goal workbench"
```

Register `worker.evidence-recorded` for `task-6`.

## Task 6 reviewer prompt

```text
/goal
执行 v19 Task 6 independent reviewer review。

目标：
- 审查当前分支 v19-task6-workbench-active-goal 相对 main 的 diff。
- 独立检查 Workbench Active Goal Control Center 是否符合 v19 plan 和既有边界。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task6-worker-evidence-2026-05-29.md
- Task 1-5 相关实现
- docs/workbench-operator-guide.md
- tests/workbench-route-smoke.test.js
- 当前分支相对 main 的 diff

必须检查：
- Active Goal Runbook、Next Action Card、Prompt Preview、Closeout Gaps 是否只读展示。
- Prompt Preview 是否 copy-only，没有执行/confirm/run 控件。
- 前端是否只根据后端 contracts 展示，不自己推断 approved/main-verified/release-ready。
- API route 是否保持 GET only。
- 是否未加入 artifact download、open local file、browser terminal、model invocation。
- 是否未破坏 v16 safe artifact preview、v17 progress、v18 event timeline/matrix。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 docs/plans/v19-task6-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-6`.

## Task 6 main verification prompt

```text
/goal
执行 v19 Task 6 main verification。

前提：
- v19-task6-workbench-active-goal 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task6-workbench-active-goal；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm workbench:build。
- 运行 git diff --check。
- 写入 docs/plans/v19-task6-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-6` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 7: Docs, operator guide, evidence index

Branch: `v19-task7-docs-operator-guide`  
Worker evidence: `docs/plans/v19-task7-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task7-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v19-task7-main-verification-evidence-2026-05-29.md`

## Task 7 branch setup

```bash
git checkout main
git pull --ff-only
git checkout -b v19-task7-docs-operator-guide
```

## Task 7 worker prompt

```text
/goal
执行 v19 Task 7 worker implement：docs、operator guide、task evidence index、release evidence draft。

分支：
- 使用当前分支：v19-task7-docs-operator-guide
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-execution-prompts-2026-05-29.md（如果已加入仓库）
- README.md
- docs/symphony-product-contracts.md
- docs/workbench-operator-guide.md
- docs/plans/v18-task-evidence-index-2026-05-28.md
- docs/plans/v18-release-evidence-2026-05-28.md
- docs/plans/v18-final-closure-evidence-2026-05-29.md

实现范围：
- README current status 增加 v19 implemented/draft 状态说明，但不要宣称 released/tagged。
- docs/symphony-product-contracts.md 增加 v19 contracts：goal-runbook.v1、goal-next-action.v1、goal-prompt-pack.v1、goal-closeout-report.v1。
- docs/workbench-operator-guide.md 增加 v19 操作方式和 Active Goal Control Center 只读边界。
- 新增 docs/plans/v19-task-evidence-index-2026-05-29.md。
- 新增 docs/plans/v19-release-evidence-2026-05-29.md 初稿。
- 文档应说明 release-ready 仍需 explicit `release.ready` gate with status `declared`。

禁止：
- 不宣称 v19 released。
- 不宣称 tag 已创建。
- 不把 passing commands 当作 release-ready。
- 不补造未运行的 gate 结果。
- 不修改 lockfile。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Docs consistency notes
- Release wording notes
- Reviewer handoff
- 建议的 worker evidence 文件路径
```

## Task 7 worker evidence prompt

```text
/goal
为 v19 Task 7 编写 worker evidence 文档。

目标文件：
- docs/plans/v19-task7-worker-evidence-2026-05-29.md

要求：
- 记录 goal id、task id、branch。
- 摘要说明 README、product contracts、operator guide、task evidence index、release evidence draft 的更新。
- 精确记录 pnpm check、pnpm test、pnpm workbench:build、git diff --check 的结果。
- 明确没有宣称 v19 released/tagged。
- 明确 release-ready 仍需要 explicit event，不由 passing commands 自动推断。
- 不宣称 reviewer approved、main verified 或 release ready。

完成后返回文件路径和摘要。
```

## Task 7 worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Document v19 goal runbook workflow"
```

Register `worker.evidence-recorded` for `task-7`.

## Task 7 reviewer prompt

```text
/goal
执行 v19 Task 7 independent reviewer review。

目标：
- 审查当前分支 v19-task7-docs-operator-guide 相对 main 的 diff。
- 独立检查 README、contracts docs、operator guide、task evidence index、release evidence draft 是否准确。
- 不能只复述 worker 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task7-worker-evidence-2026-05-29.md
- README.md
- docs/symphony-product-contracts.md
- docs/workbench-operator-guide.md
- docs/plans/v19-task-evidence-index-2026-05-29.md
- docs/plans/v19-release-evidence-2026-05-29.md
- 当前分支相对 main 的 diff

必须检查：
- README 是否没有提前把 latest released tag 改成 v19。
- Product contracts 是否覆盖 v19 四个 contracts，字段与实现一致。
- Operator guide 是否说明 Active Goal Control Center 是 read-only / display-only / copy-only。
- Evidence index 是否按 task 记录 worker/reviewer/main verification，而不是推断。
- Release evidence draft 是否没有伪造 gates。
- 是否未宣称 release-ready 或 tag evidence。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 docs/plans/v19-task7-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-7`.

## Task 7 main verification prompt

```text
/goal
执行 v19 Task 7 main verification。

前提：
- v19-task7-docs-operator-guide 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge v19-task7-docs-operator-guide；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm workbench:build。
- 运行 git diff --check。
- 写入 docs/plans/v19-task7-main-verification-evidence-2026-05-29.md。

完成后返回 Summary、main commit、命令结果、evidence file path，并提示通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification。
```

Register main verification for `task-7` through `symphony goal gate --gate main-verification --status passed`, then push main.

---

# Task 8: Release verification, final closure, and tag evidence

Branch: `v19-task8-release-verification` or main release bookkeeping branch  
Worker evidence: `docs/plans/v19-task8-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v19-task8-review-evidence-2026-05-29.md`  
Final closure evidence: `docs/plans/v19-final-closure-evidence-2026-05-29.md`  
Tag release evidence: `docs/plans/v19-tag-release-evidence-2026-05-29.md`

Task 8 is not normal feature implementation. It is release verification and bookkeeping.

## Task 8 preflight

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

Expected before release-ready declaration:

```text
completedTasks: 7
needsRevisionTasks: 0
releaseReady: false
releaseGates.tagEvidence: unknown or missing
```

If any task lacks worker evidence, reviewer approval, or main verification, stop and resolve that task first.

## Task 8 release verifier prompt

```text
/goal
执行 v19 Task 8 release verification：完成 v19 release gates、final closure evidence 和 release readiness evidence。

分支：
- 使用 main 或 release bookkeeping 分支：v19-task8-release-verification。
- 如果当前工作区不 clean，先停止并说明。

先读：
- README.md
- docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md
- docs/plans/v19-task-evidence-index-2026-05-29.md
- docs/plans/v19-release-evidence-2026-05-29.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- pnpm scripts / package.json

实现范围：
- 运行完整 release gates。
- 更新 docs/plans/v19-release-evidence-2026-05-29.md，记录真实命令结果。
- 新增 docs/plans/v19-final-closure-evidence-2026-05-29.md。
- 如果所有 task worker/reviewer/main verification 完整，且 release gates 通过，可准备 `release.ready` gate with status `declared`。
- README latest completed mainline release 只有在 release closure 已准备好后才能更新为 v19；不要提前宣称 tag 已存在。

Release gates 必须运行并记录精确结果：
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- pnpm mcas doctor

禁止：
- 不自动创建 tag。
- 不自动发布 GitHub release。
- 不伪造未运行命令结果。
- 不把 partial gate pass 当作 release-ready。
- 不跳过 mutation gate 或 audit high。
- 不把 Workbench frontend 推断当作 release evidence。

完成后必须返回：
- Summary
- Gate command results with exact output summary
- Files changed
- Evidence file paths
- Whether `release.ready` declaration is justified
- Remaining blockers, if any
```

## Task 8 worker evidence prompt

```text
/goal
为 v19 Task 8 编写 worker/release verification evidence 文档。

目标文件：
- docs/plans/v19-task8-worker-evidence-2026-05-29.md

要求：
- 记录 goal id：v19-goal-runbook-next-action。
- 记录 task id：task-8。
- 记录 release gate command results。
- 指向 docs/plans/v19-release-evidence-2026-05-29.md 和 docs/plans/v19-final-closure-evidence-2026-05-29.md。
- 明确哪些 release gates 已 passed。
- 明确 tag evidence 仍未 passed，除非 tag 已实际创建并验证。
- 不伪造 GitHub release 或 tag。

完成后返回文件路径和摘要。
```

## Task 8 worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
pnpm mcas doctor
git status -sb
git add .
git commit -m "Add v19 release verification evidence"
```

Register `worker.evidence-recorded` for `task-8`.

## Task 8 independent reviewer prompt

```text
/goal
执行 v19 Task 8 independent reviewer review。

目标：
- 审查 v19 release verification、release evidence、final closure evidence 和 README release wording。
- 独立确认 release-ready 是否有足够 evidence 支撑。
- 不能只复述 release verifier 总结。
- 不能因为测试通过就自动 APPROVED。

必须先读：
- README.md
- docs/plans/v19-task-evidence-index-2026-05-29.md
- docs/plans/v19-release-evidence-2026-05-29.md
- docs/plans/v19-final-closure-evidence-2026-05-29.md
- docs/plans/v19-task8-worker-evidence-2026-05-29.md
- 当前分支相对 main 的 diff

必须检查：
- task-1 到 task-7 是否都有 worker evidence、reviewer approval、main verification。
- release gates 是否全部真实运行并记录：pnpm check、pnpm test、workbench build、mutation gate、audit high、diff check、mcas doctor。
- README 是否没有提前宣称 tag evidence passed，除非 tag 已实际创建。
- final closure 是否明确 release-ready 来自 explicit event，而不是命令通过自动推断。
- release evidence 是否没有伪造或遗漏失败信息。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

如果你认为必须重跑 mutation/audit 才能 approve，请明确说明；不要伪造结果。

输出要求：
- 写入 docs/plans/v19-task8-review-evidence-2026-05-29.md。
- 返回 Verdict: APPROVED 或 NEEDS_REVISION。
- 返回 reviewed files。
- 返回 commands run with exact results。
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项。
```

Register reviewer verdict for `task-8`.

## Task 8 main verification prompt

```text
/goal
执行 v19 Task 8 main verification and release-ready preparation。

前提：
- v19 Task 8 已有 reviewer.approved evidence。

执行：
- 切到 main。
- git pull --ff-only。
- fast-forward merge release bookkeeping branch；如果不能 ff-only，停止并说明。
- 运行 pnpm check。
- 运行 pnpm test。
- 运行 pnpm workbench:build。
- 运行 git diff --check。
- 检查 docs/plans/v19-final-closure-evidence-2026-05-29.md 是否记录 release gates。
- 写入或更新 docs/plans/v19-final-closure-evidence-2026-05-29.md 的 main verification section。

完成后返回：
- Summary
- Main commit
- Commands and exact results
- Evidence file path
- 是否可以通过 `symphony goal gate --gate main-verification --status passed` 登记 main verification
- 是否可以登记 `release.ready` declared gate
```

Register `main.verification-passed` for `task-8`.

## Release gate registration commands

After release gates pass, register each gate through dry-run then confirm.

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.mutation-gate \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.audit-high \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.mcas-doctor \
  --status passed \
  --verifier codex-v19-release-verifier \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

For each dry-run, confirm with the returned plan hash.

## Release-ready declaration

Only after task-1 through task-8 have worker evidence, reviewer approval, main verification, and all release gates have passed:

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.ready \
  --status declared \
  --verifier codex-v19-release-manager \
  --evidence-ref docs/plans/v19-final-closure-evidence-2026-05-29.md \
  --dry-run --json
```

Confirm with returned plan hash.

Then verify:

```bash
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

Expected before tag:

```text
completedTasks: 8
needsRevisionTasks: 0
releaseReady: true
releaseGates.tagEvidence: unknown or missing
```

## Tag release prompt

```text
/goal
执行 v19 tag release evidence preparation。

目标：
- 检查 v19 release-ready 已通过 `release.ready` declared gate 产生的 explicit event。
- 准备 annotated v19 tag 和 GitHub release 的人工执行命令。
- 创建 tag 前先检查本地/远程是否已有 v19 tag。
- tag 创建和 GitHub release 发布必须由人工明确执行；不要在 prompt 中自动执行，除非操作者明确授权。

必须运行并记录：
- git status -sb
- git tag --list 'v19'
- git ls-remote --tags origin 'refs/tags/v19'
- gh release view v19 --repo Andy20010101/multi-coding-agent-symphony
- pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json

准备命令：
- git tag -a v19 -m "v19 Goal Runbook and Next Action Control Center release"
- git push origin v19
- gh release create v19 --title "v19 Goal Runbook + Next Action Control Center" --latest

写入：
- docs/plans/v19-tag-release-evidence-2026-05-29.md

Evidence 必须记录：
- pre-tag checks。
- tag plan。
- 如果 tag 已创建，post-tag evidence：git show、git ls-remote peeled commit、gh release view JSON。
- 不伪造 tag 或 release。

完成后返回 Summary、commands run、evidence file path、remaining blockers。
```

After tag and GitHub release are actually created, register tag evidence:

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.tag-evidence \
  --status passed \
  --verifier codex-v19-tag-verifier \
  --evidence-ref docs/plans/v19-tag-release-evidence-2026-05-29.md \
  --dry-run --json
```

Confirm with returned plan hash, then verify:

```bash
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

Expected final state:

```text
completedTasks: 8
needsRevisionTasks: 0
releaseReady: true
releaseGates.tagEvidence: passed
```

---

# 4. Revision prompts

Use this when a reviewer returns NEEDS_REVISION.

```text
/goal
执行 v19 <TASK_ID> worker revision。

背景：
- Reviewer verdict: NEEDS_REVISION。
- Review evidence file: docs/plans/v19-<task-id>-review-evidence-2026-05-29.md。
- 当前分支：<branch-name>。

要求：
- 只修 reviewer blocker。
- 不扩 scope。
- 不顺手实现下一个 task。
- 修复后运行该 task 原验收命令。
- 更新或新增 worker revision evidence：docs/plans/v19-<task-id>-worker-revision-evidence-2026-05-29.md。
- 不宣称 reviewer approved、main verified 或 release ready。

返回：
- Fixed blockers
- Files changed
- Commands run with exact results
- Updated evidence path
- Reviewer re-review handoff
```

After revision, register another `worker.evidence-recorded` or supported superseding evidence event using the revision evidence ref, then re-run the reviewer prompt.

# 5. Status checkpoints

After every event confirm:

```bash
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

Check that the state changes only after explicit events.

Expected task-complete requirements:

```text
worker.evidence-recorded
reviewer.approved
main.verification-passed
```

Expected release-complete requirements:

```text
all tasks complete
release gates passed
`release.ready` gate declared explicit event
release.tag-evidence passed after actual tag and GitHub release
```

# 6. Final acceptance

v19 is done only when:

- `goal-runbook.v1` defines task queue, role order, acceptance, expected evidence, and release gates.
- `symphony goal init` registers active goal runbook through dry-run + confirm.
- `symphony goal next` returns event-aware next action.
- `symphony goal prompt --next --markdown` returns copy-only `/goal` prompt.
- `symphony goal closeout` reports missing evidence and release gate gaps.
- `symphony next` prefers active goal next action and preserves Stage fallback.
- Workbench displays Active Goal Control Center as read-only / display-only / copy-only.
- README, product contracts, operator guide, evidence index, release evidence, final closure, and tag evidence are updated.
- Release gates pass.
- `goal-status` reports completedTasks 8, needsRevisionTasks 0, releaseReady true, tagEvidence passed.
