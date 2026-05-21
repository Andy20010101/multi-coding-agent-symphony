# v8 Update Plan: Prompt-Driven Symphony CLI

Date: 2026-05-21
Status: execution-ready draft
Baseline: v7 project intake + Harness Bridge workflow
Repository: `Andy20010101/multi-coding-agent-symphony`
Package name: `multi-coding-agent-symphony`
Primary CLI: `symphony`
Kernel/debug CLI: `mcas`

## Codex Execution Brief

Implement v8 as a product-layer upgrade on top of the current v7 kernel.

The main goal is to let a user type natural-language commands such as:

```sh
symphony "扫描这个仓库，看看怎么跑测试"
symphony "审查当前改动"
symphony "修复失败的测试"
symphony "创建一个新的 node cli 项目"
```

The v8 implementation must not break existing v7 behavior. Keep `mcas` as the kernel/debug CLI. Keep existing `symphony intake`, `symphony work`, `symphony review`, `symphony qa`, `symphony harness`, and `symphony replay` compatible.

Implement the stages in order. Do not jump to later stages before earlier stage tests pass. Prefer small commits or small PR-sized diffs.

## Current Repo Facts To Preserve

Current `symphony` user-facing commands include:

```text
symphony doctor
symphony intake
symphony work
symphony review
symphony qa
symphony agent claude /review
symphony harness ...
symphony replay ...
```

Current `mcas` kernel/debug commands include:

```text
mcas doctor
mcas intake
mcas github issue
mcas queue manual
mcas run-next
mcas run-task
mcas harness run-taskpacket
mcas smoke <codex|claude|kiro>
mcas eval replay
```

Current package scripts include:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
pnpm symphony doctor
pnpm mcas doctor
```

The repo currently uses Node.js built-in tooling and should not add new runtime dependencies for v8.

## External Design References

Use these only as design references, not as implementation dependencies:

- Codex CLI has prompt-first and non-interactive `codex exec` patterns.
- Codex CLI exposes status and resume concepts through command/subcommand surfaces.
- Claude Code supports prompt-first `claude "query"`, print mode `claude -p "query"`, and continue/resume concepts.
- Claude Code command design uses workflow verbs and slash commands instead of making every low-level option the primary UX.

Reference URLs:

```text
https://developers.openai.com/codex/cli/reference
https://developers.openai.com/codex/cli/slash-commands
https://code.claude.com/docs/en/cli-usage
https://code.claude.com/docs/en/commands
```

## Product Goal

Turn `symphony` from a flag-heavy workflow wrapper into a prompt-driven task router.

The v8 product layer should hide these implementation details from first-time users:

```text
intake
TaskPacket
Harness Bridge
runtime dir
provider command
artifact ids
manual intake artifact flags
```

The user should see:

```text
Intent
Pipeline
Safety mode
Project writes
Runtime writes
External calls
Verifier status
Artifact/evidence paths
Next action
```

## Non-Negotiable Compatibility Rules

1. Existing v7 commands must keep passing their current tests.
2. `mcas` remains JSON-first and kernel/debug oriented.
3. Existing `symphony intake/work/review/qa` compatibility commands may remain JSON-first unless explicitly routed through new v8 aliases.
4. Do not remove `symphony intake` or `symphony work`.
5. Do not change real CLI gate names:
   - `MCAS_RUN_REAL_CODEX`
   - `MCAS_RUN_REAL_CLAUDE`
   - `MCAS_RUN_REAL_KIRO`
6. Do not invoke real CLIs unless the user explicitly requests real execution and the matching gate exists.
7. Do not mutate project files in default prompt-driven mode.
8. Do not add npm dependencies.

## Important Semantic Clarification

`dry-run` means no project/workspace mutations.

It does not mean no files are written at all. Dry-run may still write runtime files such as:

```text
taskpacket.json
runtime artifacts
evidence artifacts
harness summary
.symphony state pointers
```

Therefore every v8 preview and summary must distinguish:

```text
Project writes: yes/no
Runtime writes: yes/no
External calls: yes/no
Destructive writes: yes/no
```

Use this safety table:

| Mode | Project writes | Runtime writes | External calls | Default? |
|---|---:|---:|---:|---:|
| `read-only` | no | yes | no | scan/status/artifacts/review-only |
| `dry-run` | no | yes | no | default do/verify/new preview |
| `write` | yes | yes | no by default | explicit `--write` or explicit write wording |
| `external` | maybe | yes | yes | explicit `--real <adapter>` plus gate |
| `destructive` | yes | yes | maybe | explicit destructive confirmation only |

## Proposed v8 User Command Surface

| Command | User meaning | Internal mapping |
|---|---|---|
| `symphony "<prompt>"` | Prompt-driven router | classify intent, plan pipeline, execute safe default |
| `symphony doctor` | Check install/gates/native CLIs/config | current `symphony doctor` |
| `symphony scan` | Understand current project | v7 `symphony intake` with provider auto mode |
| `symphony do "task"` | Execute task in current project | v7 `symphony work`, using cached/latest context when valid |
| `symphony new <name>` | Create a new project skeleton | new bootstrap pipeline |
| `symphony review "scope"` | Review code or current diff | v7 review path, semantic intent preserved |
| `symphony verify "scope"` | Verify app/tests/change behavior | v7 qa path, semantic intent preserved |
| `symphony status` | Show recent runs and verifier state | new runtime state reader |
| `symphony continue` | Continue latest failed/incomplete Symphony run | new run-state resolver; native resume deferred |
| `symphony artifacts [run-id]` | Print artifact/proof/evidence paths | new artifact pointer reader |
| `pnpm mcas ...` | Kernel/debug/CI path | unchanged |

Compatibility aliases:

```text
symphony intake  -> keep existing behavior; advanced/internal name
symphony work    -> keep existing behavior; advanced/internal name
symphony qa      -> keep existing behavior; advanced/internal name
symphony verify  -> new product alias for qa semantics
symphony scan    -> new product alias for intake semantics
symphony do      -> new product alias for work semantics
```

## Output Contract

### New v8 product commands

For new v8 product commands, default output should be concise human-readable text.

Examples:

```text
Intent: work
Pipeline: scan-if-needed -> do
Safety: dry-run
Project writes: no
Runtime writes: yes
External calls: no
Status: passed
Verifier: passed
Context: tmp/.../project-context.json
Evidence: tmp/.../implement-evidence.json
Next: symphony status
```

`--json` must return stable JSON.

Example JSON shape:

```json
{
  "version": "1",
  "command": "symphony do",
  "intent": "work",
  "pipeline": ["scan-if-needed", "do"],
  "safetyMode": "dry-run",
  "projectWrites": false,
  "runtimeWrites": true,
  "externalCalls": false,
  "status": "passed",
  "verifierStatus": "passed",
  "runId": "symphony-work-...",
  "contextArtifactPath": "tmp/.../project-context.json",
  "summaryArtifactPath": "tmp/.../intake-summary.json",
  "evidenceArtifactPath": "tmp/.../implement-evidence.json",
  "harnessOutputPath": "tmp/.../harness",
  "nextAction": "symphony status"
}
```

### Existing v7 commands

Do not break existing v7 JSON tests. It is acceptable for these to remain JSON-first:

```text
symphony intake
symphony work
symphony review
symphony qa
symphony harness
symphony replay
```

Add human output first to new product aliases and prompt-routed workflows. Migrate compatibility command output only if tests are updated intentionally.

## Plan Preview Contract

Before any project write, external call, or destructive operation, print or return a compact preview.

Human preview:

```text
Intent: new-project
Pipeline: new -> scan
Safety: dry-run
Project writes: no
Runtime writes: yes
External calls: no
Destructive writes: no
Context: will create new scan
```

JSON preview:

```json
{
  "version": "1",
  "kind": "symphony-plan-preview",
  "intent": "new-project",
  "pipeline": ["new", "scan"],
  "safetyMode": "dry-run",
  "projectWrites": false,
  "runtimeWrites": true,
  "externalCalls": false,
  "destructiveWrites": false,
  "requiresConfirmation": false
}
```

Rules:

- `read-only` and `dry-run` may proceed automatically.
- `write` requires explicit `--write` or clearly explicit write wording.
- `external` requires explicit `--real <adapter>` or clear real-adapter wording plus matching `MCAS_RUN_REAL_*` gate.
- `destructive` requires explicit destructive wording and a confirmation flag. Do not infer destructive intent from vague prompts.

## Prompt Router

The v8 router must be deterministic and model-free.

Add a small router module, for example:

```text
src/symphony/prompt-router.js
```

Suggested exported API:

```js
classifyPrompt({ prompt, args, projectState }) -> RouteDecision
```

RouteDecision shape:

```json
{
  "version": "1",
  "intent": "work",
  "confidence": "high",
  "matchedSignals": ["修复", "测试失败"],
  "safetyMode": "dry-run",
  "adapter": "codex",
  "pipeline": ["scan-if-needed", "do"],
  "requiresGate": null,
  "requiresConfirmation": false,
  "reason": "Matched fix/work prompt in existing project"
}
```

### Router priority order

Apply rules in this order:

1. Parse explicit safety modifiers.
2. Parse explicit adapter modifiers.
3. Parse lifecycle intent.
4. Parse task intent.
5. Apply repository-state rules.
6. Produce a route decision with matched signals.

### Safety modifiers

| Prompt/flag signal | Effect |
|---|---|
| `--dry-run`, `dry run`, `no changes`, `不改文件`, `只预演` | force `dry-run` |
| `--write`, `write files`, `创建文件`, `写入文件` | allow `write` |
| `--real codex`, `用 codex 真实执行`, `真实修复` | `external`, adapter `codex`, require `MCAS_RUN_REAL_CODEX` |
| `--real claude`, `用 claude 真实执行` | `external`, adapter `claude`, require `MCAS_RUN_REAL_CLAUDE` |
| `--real kiro`, `用 kiro 真实执行` | `external`, adapter `kiro`, require `MCAS_RUN_REAL_KIRO` |
| `delete`, `reset`, `purge`, `overwrite`, `删除`, `重置`, `覆盖` | candidate `destructive`; require explicit confirmation |

### Intent routes

| Prompt signal | Intent | Pipeline |
|---|---|---|
| `create`, `new project`, `from scratch`, `新建`, `从头开始`, `创建一个新的` | `new-project` | `new -> scan` |
| `scan`, `analyze`, `understand`, `扫描`, `理解`, `分析项目` | `scan-project` | `scan` |
| `fix`, `implement`, `add`, `update`, `修复`, `实现`, `添加`, `改一下` | `work` | `scan-if-needed -> do` |
| `review`, `audit`, `审查`, `检查改动`, `代码审查` | `review` | `scan-if-needed -> review` |
| `verify`, `test`, `run tests`, `验证`, `测试`, `跑测试`, `跑起来` | `verify` | `scan-if-needed -> verify` |
| `continue`, `resume`, `继续`, `恢复` | `continue` | `continue latest` |
| `status`, `状态` | `status` | `status` |
| `artifacts`, `evidence`, `证据`, `产物` | `artifacts` | `artifacts` |

### Repository-state routes

Implement a lightweight project state detector:

```text
empty directory
existing git repository
dirty git diff if detectable
cached scan context exists
cached scan context fresh/stale
```

Rules:

- Empty directory plus new-project prompt -> `new-project`.
- Existing git repository plus work prompt -> `scan-if-needed -> do`.
- Existing uncommitted diff plus review prompt -> `review current diff`.
- Missing cached scan context -> run `scan` automatically before `do/review/verify`.
- Present cached scan context and unchanged fingerprint -> reuse latest scan context.
- Present cached context but stale fingerprint -> run scan again.

### Ambiguity rules

Do not ask interactive questions in CI/non-interactive mode. Instead choose the safest route.

Examples:

| Prompt | Expected safe route |
|---|---|
| `跑测试并修复失败` | `verify` first if no explicit write; then suggest `do` next |
| `审查当前改动，如果没问题就修复 CI` | `review` first; do not write by default |
| `创建 React 项目，不要写文件` | `new-project` dry-run preview only |
| `真实用 codex 修复失败测试` | external codex; require `MCAS_RUN_REAL_CODEX=1` |

## Scan Behavior

`scan` is the product name for v7 `intake`.

Default command:

```sh
symphony scan
```

Internal behavior:

```text
project dir: .
output dir: tmp/symphony-scan or tmp/symphony-intake-compatible path
provider: auto
runtime writes: yes
project writes: no
model invocation: no for builtin; provider result must report modelInvocation false unless provider changes that contract
```

### Provider auto mode

Add product-layer provider mode `auto`.

```text
symphony scan                 -> provider auto
symphony scan --builtin        -> provider builtin
symphony scan --grill          -> provider grill-me-docs with fallback builtin
symphony scan --require-grill  -> provider grill-me-docs and require provider
```

Mapping:

```text
--builtin        -> mcas intake --provider builtin
--grill          -> try mcas intake --provider grill-me-docs; if unavailable, retry builtin
--require-grill  -> mcas intake --provider grill-me-docs --require-provider
```

Compatibility:

```text
symphony intake --provider grill-me-docs --provider-command grill-me-docs
```

must continue to work as advanced compatibility.

### Scan output

After scan, write:

```text
project-context artifact
intake-summary artifact
.symphony/context/latest.json pointer
.symphony/runs/<run-id>.json state
.symphony/runs/latest.json pointer
```

## Do Behavior

Default command:

```sh
symphony do "修复失败的测试"
```

Internal behavior:

1. Read `.symphony/context/latest.json`.
2. Validate project fingerprint.
3. If missing or stale, run `scan` first.
4. Build TaskPacket constraints from project context:
   - `project_context_artifact:<path>`
   - `recommended_workflow:<mode>`
   - `verification_command:<command>`
5. Run existing Harness Bridge path using v7 work internals.
6. Write run state.
7. Print human summary or JSON summary.

Real execution:

```sh
MCAS_RUN_REAL_CODEX=1 symphony do --real codex "修复失败的测试"
```

Prompt-driven real execution:

```sh
MCAS_RUN_REAL_CODEX=1 symphony "用 codex 真实修复失败的测试"
```

If the matching gate is missing, return usage exit code `64` and include the exact missing environment variable in the error message.

## Review vs Verify Semantics

Do not collapse product semantics even if both temporarily reuse `qa-swarm` internally.

### `review`

User meaning:

```text
Inspect current changes, code quality, risk, missing evidence, and acceptance coverage.
```

Default:

```text
write-capable: false
project writes: no
workflow mode: qa-swarm is acceptable for v8
semanticCommand: review
```

### `verify`

User meaning:

```text
Run or plan verification checks, test commands, behavior checks, and evidence review.
```

Default:

```text
write-capable: false
project writes: no
workflow mode: qa-swarm is acceptable for v8
semanticCommand: verify or qa
```

Even if both paths call `runSymphonyWork({ args: ['--mode', 'qa-swarm', ...] })`, summaries must include distinct product intent:

```json
{
  "intent": "review",
  "semanticCommand": "review",
  "workflowMode": "qa-swarm"
}
```

and:

```json
{
  "intent": "verify",
  "semanticCommand": "verify",
  "workflowMode": "qa-swarm"
}
```

## New Project Behavior

Default commands:

```sh
symphony new my-app
symphony "创建一个新的 node cli 项目"
symphony "创建一个新的 React 看板项目"
```

Initial v8 scope:

| Template | Purpose | Files |
|---|---|---|
| `empty` | README + guidance + git only | `README.md`, `AGENTS.md` |
| `node-cli` | Minimal Node CLI package | `package.json`, `scripts/cli.js`, `README.md`, `AGENTS.md` |
| `web-app` | Minimal frontend placeholder | `package.json`, `src/index.html` or `index.html`, `README.md`, `AGENTS.md` |

Out of scope for v8:

```text
full React/Vue/Next framework generators
network dependency installation
npm install/pnpm install
opinionated deployment setup
large template ecosystem
```

Important mapping:

```text
Prompt says React/Vue/Next -> use `web-app` placeholder unless a real framework generator is implemented later.
```

### New project safety rules

- Default `symphony new <name>` is dry-run preview unless `--write` is supplied.
- `--dry-run` must not create the target directory.
- `--write` may create the target directory and files.
- Target directory exists and is non-empty -> fail by default.
- Allow existing empty directory only with explicit safe handling.
- Overwrite/delete/reset requires destructive confirmation. Do not implement destructive overwrite in first v8 unless fully tested.
- `git init` failure must be recorded in evidence/summary and must not be hidden.
- After successful scaffold write, run scan and write latest context state.

### Scaffold manifest artifact

Write a scaffold manifest in runtime artifacts/state:

```json
{
  "version": "1",
  "kind": "symphony-scaffold-manifest",
  "template": "node-cli",
  "targetDir": "tmp/v8-demo",
  "projectWrites": true,
  "createdFiles": ["README.md", "AGENTS.md", "package.json", "scripts/cli.js"],
  "skippedFiles": [],
  "gitInit": {
    "attempted": true,
    "status": "passed",
    "exitCode": 0
  }
}
```

## State Layer

Add a small product-layer state module, for example:

```text
src/symphony/state.js
```

The state layer is for user-facing pointers and summaries only. It must not replace `ArtifactStore`.

### State file layout

```text
.symphony/context/latest.json
.symphony/runs/latest.json
.symphony/runs/<run-id>.json
.symphony/artifacts/<run-id>.json      optional index, if useful
```

### Required properties

- State files must be redacted before writing.
- State writes must be atomic: write temp file, then rename.
- State must store pointers, not duplicate full evidence payloads.
- `.symphony/` should be recommended in docs as a local runtime directory.
- State reading must tolerate missing files and return clear status instead of crashing.

### Run state schema

```json
{
  "version": "1",
  "kind": "symphony-run-state",
  "runId": "symphony-work-...",
  "command": "symphony do",
  "intent": "work",
  "semanticCommand": "do",
  "pipeline": ["scan-if-needed", "do"],
  "safetyMode": "dry-run",
  "projectWrites": false,
  "runtimeWrites": true,
  "externalCalls": false,
  "projectRoot": ".",
  "projectFingerprint": "sha256:...",
  "contextArtifactPath": "tmp/.../project-context.json",
  "summaryArtifactPath": "tmp/.../intake-summary.json",
  "evidenceArtifactPath": "tmp/.../implement-evidence.json",
  "harnessOutputPath": "tmp/.../harness",
  "taskPacketPath": "tmp/.../taskpacket.json",
  "verifierStatus": "passed",
  "status": "passed",
  "createdAt": "2026-05-21T00:00:00.000Z",
  "updatedAt": "2026-05-21T00:00:00.000Z",
  "nextAction": "symphony status"
}
```

### Latest context pointer schema

```json
{
  "version": "1",
  "kind": "symphony-latest-context",
  "projectRoot": ".",
  "projectFingerprint": "sha256:...",
  "runId": "symphony-scan-...",
  "contextArtifactPath": "tmp/.../project-context.json",
  "summaryArtifactPath": "tmp/.../intake-summary.json",
  "recommendedWorkflow": "writer-reviewer",
  "verificationCommands": ["pnpm check", "pnpm test"],
  "createdAt": "2026-05-21T00:00:00.000Z"
}
```

### Project fingerprint

Implement a deterministic lightweight fingerprint.

Suggested inputs:

```text
absolute project root
package.json content if present
pnpm-lock.yaml/package-lock.json/yarn.lock if present
README.md if present
AGENTS.md if present
mcas.config.json if present
.git/HEAD if present
.git/index mtime or `git status --short` if cheap and available
```

Do not scan all source files for v8 fingerprint unless necessary. Keep it fast and deterministic.

## Status, Artifacts, Continue

### `symphony status`

Reads state only. Must not invoke models or real CLIs.

Output should include:

```text
latest run id
latest intent
status
verifier status
context path
evidence path
next action
```

If no state exists:

```text
Status: no runs yet
Next: symphony scan
```

### `symphony artifacts [run-id]`

Reads run state and prints artifact/proof/evidence paths.

Must include at least:

```text
contextArtifactPath
summaryArtifactPath
evidenceArtifactPath
harnessOutputPath
taskPacketPath
proofArtifactPath if present
```

### `symphony continue`

v8 scope:

```text
Symphony-level continuation only.
```

Behavior:

1. Read latest run.
2. If no run: suggest `symphony scan`.
3. If latest run passed: print that nothing needs continuation and show latest artifacts.
4. If latest run failed/incomplete: print next safe action or rerun the same TaskPacket dry-run when safe.

Do not claim native Codex/Claude session resume unless the adapter artifacts include a native session id.

Native session resume is v8.1+:

```text
symphony continue --native
```

Only implement native resume when there is a stored native session id and tests cover it.

## Real Gate Env Fix

Before adding more real execution paths, fix the current env propagation issue.

Problem:

```text
mcas assertRealCliGate currently reads process.env directly.
```

Required behavior:

```js
assertRealCliGate(adapterId, env = process.env)
```

Thread `env` through:

```text
runMcasCli -> resolveWorkflowOptions/createCliAdapter -> assertRealCliGate
```

Tests must prove that injected env works in unit tests and missing gates still fail with usage exit `64`.

## Implementation Stages

### Stage 0: Preflight Cleanup And Guardrails

Tasks:

- Confirm repo/package naming uses `multi-coding-agent-symphony` consistently.
- Do not rename repo or package in code unless needed.
- Update v8 docs references from v7 install examples where appropriate.
- Fix real gate env propagation.
- Add helper for global v8 flags where needed:
  - `--json`
  - `--dry-run`
  - `--write`
  - `--real <adapter>`
  - `--state-dir <dir>` optional; default `.symphony`

Acceptance commands:

```sh
pnpm check
pnpm test
node --test tests/symphony-cli.test.js
```

### Stage 1: Product Command Aliases

Tasks:

- Add `symphony scan` as product alias for intake.
- Add `symphony do "task"` as product alias for work.
- Add `symphony verify "scope"` as product alias for qa.
- Keep `symphony review "scope"` but add product intent metadata in v8 route summaries where possible.
- For new aliases, support `--json`. Human output may be default for aliases; JSON output must be stable.
- Existing `symphony intake/work/qa/review` tests must not break.

Acceptance commands:

```sh
pnpm symphony scan --json
pnpm symphony do --dry-run --json "inspect README"
pnpm symphony verify --dry-run --json "inspect README"
pnpm check
pnpm test
```

Expected:

- `scan` writes project context and summary artifacts.
- `do` runs current Harness Bridge dry-run path.
- `verify` runs qa-swarm-like dry-run path.
- Output includes `intent`, `pipeline`, `safetyMode`, `projectWrites`, `runtimeWrites`, `externalCalls`.

### Stage 2: State Layer And Latest Context Cache

Tasks:

- Add `src/symphony/state.js` or equivalent.
- Add project fingerprint helper.
- On `symphony scan`, write `.symphony/context/latest.json` and run state.
- On `symphony do/review/verify`, reuse latest context when fingerprint is fresh.
- If latest context is missing or stale, run scan automatically.
- Keep `--preflight-intake` and `--intake-artifact` compatibility for old `work` command.

Acceptance commands:

```sh
rm -rf .symphony tmp/v8-state-test
pnpm symphony scan --json
pnpm symphony do --dry-run --json "inspect README"
test -f .symphony/context/latest.json
test -f .symphony/runs/latest.json
pnpm check
pnpm test
```

Expected:

- Second command does not require `--intake-artifact`.
- Context pointer is reused when fingerprint is unchanged.
- Stale context triggers a fresh scan.
- Missing state produces clear messages, not crashes.

### Stage 3: Deterministic Prompt Router

Tasks:

- Add prompt router module.
- Support `symphony "<prompt>"` when the first arg is not a known command.
- Support flags before or after prompt where reasonable:
  - `symphony --json "扫描这个仓库"`
  - `symphony "扫描这个仓库" --json`
  - `symphony "创建一个新的 node cli 项目" --dry-run`
- Add route decision output in JSON.
- Add plan preview for write/external/destructive paths.
- Use safest route on ambiguity.

Acceptance commands:

```sh
pnpm symphony --json "扫描这个仓库"
pnpm symphony --json "审查当前改动"
pnpm symphony --json "修复失败的测试"
pnpm symphony --json "跑测试并验证这个项目"
pnpm check
pnpm test
```

Expected:

- Each command reports `intent`, `matchedSignals`, `pipeline`, `safetyMode`.
- No real CLI is invoked by default.
- No project files are modified by default.

### Stage 4: Status And Artifacts

Tasks:

- Implement `symphony status`.
- Implement `symphony artifacts [run-id]`.
- Read state only.
- Do not invoke models, providers, real CLIs, or Harness.
- Support `--json`.

Acceptance commands:

```sh
pnpm symphony scan --json
pnpm symphony do --dry-run --json "inspect README"
pnpm symphony status
pnpm symphony status --json
pnpm symphony artifacts
pnpm symphony artifacts --json
pnpm check
pnpm test
```

Expected:

- Status shows latest run and verifier status.
- Artifacts prints context/evidence/harness/taskpacket paths.
- Empty state is handled gracefully.

### Stage 5: New Project Bootstrap

Tasks:

- Implement `symphony new <target>`.
- Implement template detection from prompt route.
- Support templates:
  - `empty`
  - `node-cli`
  - `web-app`
- Default to dry-run preview.
- `--write` creates files.
- `--dry-run` must not create target directory.
- Existing non-empty target directory fails by default.
- Write scaffold manifest artifact/state.
- Run scan after successful write mode.

Acceptance commands:

```sh
rm -rf tmp/v8-demo-empty tmp/v8-demo-node
pnpm symphony new tmp/v8-demo-empty --template empty --dry-run --json
test ! -d tmp/v8-demo-empty
pnpm symphony new tmp/v8-demo-node --template node-cli --write --json
test -f tmp/v8-demo-node/README.md
test -f tmp/v8-demo-node/AGENTS.md
test -f tmp/v8-demo-node/package.json
pnpm symphony --json "创建一个新的 node cli 项目" --dry-run
pnpm check
pnpm test
```

Expected:

- Dry-run creates no project directory.
- Write creates expected files.
- Scan runs after write and records latest context for the new project.
- React/Vue/Next prompts map to `web-app` placeholder, not a full framework generator.

### Stage 6: Continue

Tasks:

- Implement `symphony continue` as Symphony-level continuation.
- Do not implement native Codex/Claude resume unless native session ids are available.
- Read latest run state.
- Passed run -> say no continuation needed.
- Failed/incomplete run -> print safe next action, or rerun dry-run if explicitly safe.
- Support `--json`.

Acceptance commands:

```sh
pnpm symphony status --json
pnpm symphony continue
pnpm symphony continue --json
pnpm check
pnpm test
```

Expected:

- No state -> suggest `symphony scan`.
- Passed latest run -> no continuation needed.
- Failed latest run -> safe next action is shown.
- No native resume claim unless stored native session id exists.

### Stage 7: Documentation And Migration

Tasks:

- Update README first-screen commands:

```sh
symphony doctor
symphony scan
symphony do "inspect README"
symphony "修复失败的测试"
symphony status
```

- Move advanced commands to an advanced section:
  - `symphony intake`
  - `symphony work`
  - `symphony harness`
  - `symphony replay`
  - `pnpm mcas ...`
  - provider flags
  - artifact/runtime flags
- Update install examples to v8 release ref when release is cut.
- Add docs for `.symphony/` state files and recommend adding it to local ignore if desired.
- Add migration note: v7 commands still work.

Acceptance commands:

```sh
pnpm check
pnpm test
git diff --check
```

## Test Plan

Add or extend tests. Suggested files:

```text
tests/symphony-cli.test.js
tests/symphony-router.test.js
tests/symphony-state.test.js
tests/symphony-new-project.test.js
```

### Router tests

- Chinese and English prompt routes:
  - scan
  - work
  - review
  - verify
  - new-project
  - status
  - artifacts
  - continue
- Safety modifier priority:
  - `--dry-run`
  - `--write`
  - `--real codex`
  - destructive keywords
- Mixed intent examples:
  - `跑测试并修复失败`
  - `审查当前改动，如果没问题就修复 CI`
  - `创建 React 项目，不要写文件`

### State tests

- Latest context write/read.
- Fresh fingerprint reuses context.
- Changed fingerprint reruns scan.
- State redaction removes token-looking values.
- Atomic write leaves no corrupt latest file.
- Missing state is handled gracefully.

### CLI tests

- `symphony scan` maps to intake behavior.
- `symphony do` maps to work behavior with cached context.
- `symphony verify` maps to qa behavior.
- `symphony "<prompt>"` routes deterministically.
- `--json` stable schema.
- Missing real CLI gate returns usage error.
- Existing v7 tests still pass.

### New project tests

- Dry-run does not create directory.
- Write mode creates expected files.
- Existing non-empty directory fails.
- Unsupported template fails with usage error.
- React prompt maps to `web-app` placeholder.
- No dependency install/network call happens.

### Safety tests

- Real prompt without gate fails with exact env var.
- Real prompt with injected env passes gate in unit tests.
- Destructive prompt without confirmation fails.
- Default prompt route never mutates project files.

## Verification Commands

Run after each stage:

```sh
pnpm check
pnpm test
git diff --check
```

Run before final handoff:

```sh
pnpm check
pnpm test
git diff --check
pnpm symphony doctor
pnpm symphony scan --json
pnpm symphony do --dry-run --json "inspect README"
pnpm symphony --json "扫描这个仓库"
pnpm symphony --json "审查当前改动"
pnpm symphony status --json
```

Run mutation gate only after the normal suite is stable:

```sh
pnpm test:mutation:gate
```

If mutation gate is too slow, report runtime and mutant count instead of hiding the result.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Natural-language router surprises users | Always expose intent, matched signals, pipeline, and safety mode |
| `dry-run` meaning is misunderstood | Distinguish project writes from runtime writes |
| Cached context gets stale | Store fingerprint and rerun scan when stale |
| State duplicates ArtifactStore | Store pointers only; ArtifactStore remains canonical |
| Real CLI accidentally runs | Require explicit real wording/flag plus `MCAS_RUN_REAL_*` gate |
| New project scope grows too broad | Start with three minimal templates only |
| Human output breaks tests | Keep legacy commands JSON-compatible; add `--json` for product commands |
| `continue` overpromises native resume | v8 only supports Symphony-level continuation |

## Definition Of Done

v8 is complete when:

- `symphony scan`, `symphony do`, and `symphony verify` work as product aliases.
- `symphony "<prompt>"` routes scan/work/review/verify/new/status/artifacts/continue deterministically.
- Prompt-routed workflows emit intent, pipeline, safety mode, verifier status, and artifact paths.
- `.symphony/context/latest.json` and `.symphony/runs/latest.json` are written and read safely.
- `symphony status` and `symphony artifacts` read state without invoking models or CLIs.
- `symphony new` supports dry-run and write mode for `empty`, `node-cli`, and `web-app` placeholders.
- Existing v7 commands still pass existing tests.
- No real CLI or project-writing path runs without explicit user intent and matching gates.
- README shows the short product command surface first.

## Recommended Codex Handoff Prompt

Use this file as the implementation plan.

Recommended Codex instruction:

```text
Read update_plan.md and implement v8 in order. Start with Stage 0 and Stage 1 only. Preserve all existing tests. Add tests for each new behavior before or alongside implementation. Do not add npm dependencies. Do not remove existing v7 commands. After Stage 0 and Stage 1 pass `pnpm check`, `pnpm test`, and `git diff --check`, summarize the diff and wait for the next stage instruction.
```

After Stage 0 and Stage 1 are stable, continue with:

```text
Continue update_plan.md with Stage 2 and Stage 3. Preserve existing behavior. Add tests for state cache and prompt router. Run `pnpm check`, `pnpm test`, and `git diff --check` before summarizing.
```

Then:

```text
Continue update_plan.md with Stage 4 and Stage 5. Implement status/artifacts and new-project bootstrap. Keep dry-run safe and write mode explicit. Add tests and run the full verification commands.
```

Final pass:

```text
Finish update_plan.md with Stage 6 and Stage 7. Implement safe Symphony-level continue, update docs, and run final verification.
```
