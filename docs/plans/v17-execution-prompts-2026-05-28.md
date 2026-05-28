# v17 Execution Prompts: Read-only Goal Progress Ledger + Console Contract Hardening

Date: 2026-05-28
Status: draft prompt pack
Baseline: v16 released tag
Target repo: `multi-coding-agents-symphony`

## How to Use This File

Use these prompts with Codex `/goal` or another coding agent.

Recommended workflow:

1. Start from clean `main`.
2. Run one task prompt at a time.
3. Let the worker implement and self-test, but do not let it approve itself.
4. Run the matching reviewer prompt in a separate session/model/lane.
5. Only merge after reviewer returns `APPROVED`.
6. If reviewer returns `NEEDS_REVISION`, run the revision prompt for that same task.
7. After all tasks are merged, run the final release prompt.

Global invariant:

```text
v17 browser/Workbench remains read-only, display-only, and copy-only.
No browser execution, no Workbench write path, no frontend safety inference, no arbitrary path preview.
```

---

## Global Worker System Prompt

Paste this above every task prompt if the agent supports a persistent instruction block.

```text
You are implementing v17 for multi-coding-agents-symphony.

Baseline:
- v16 is already released.
- v16 added guided-goal-handoff.v1 and safe-artifact-preview.v1 across read-only API and Workbench.

v17 goal:
Add read-only goal progress and console contract hardening:
- goal-progress-ledger.v1
- capabilities.v1
- diagnostics.v1
- error-envelope.v1
- symphony goal-status
- read-only API routes
- Workbench read-only display panels
- route smoke/security/docs/release evidence

Hard boundaries:
- Do not add Autopilot.
- Do not add browser command execution.
- Do not add browser terminal.
- Do not add Workbench writes or mutation flows.
- Do not add adopt/apply/retry/rollback/delete/install/audit/model invocation from Workbench.
- Do not add artifact download/open local file.
- Do not add arbitrary path reads.
- Do not render raw HTML/SVG/JavaScript/binary inline.
- Do not infer safety/status/capability in frontend from path/kind/MIME/extension/task id/command text.
- Backend owns truth; Workbench only renders backend contract fields.

Implementation rules:
- First inspect existing v16 contract, fixture, validator, console route, Workbench, and route smoke patterns.
- Reuse existing architecture and style.
- Avoid new dependencies unless absolutely necessary and justified.
- Add tests before or alongside implementation.
- Keep success contracts stable unless explicitly adding a new versioned contract.
- Error responses must not leak stack traces, absolute local paths, secrets, or repo file contents.
- Run relevant checks and report exact commands/results.

Output format:
- Summary
- Files changed
- Tests run with results
- Safety boundary notes
- Remaining risks or follow-up
```

---

## Task 0 Prompt: Materialize v17 Plan and Prompt Files

```text
/goal
Implement Task 0 for v17: materialize the v17 implementation plan and execution prompts in repository docs.

Branch:
- Create or use branch: v17-task0-plan-materialization

Context:
- v16 is released.
- v17 scope is read-only goal progress ledger plus console contract hardening.
- This task is docs-only except tests/checks needed for markdown hygiene.

Required files:
- Add docs/plans/v17-readonly-goal-progress-console-contract-hardening-plan-2026-05-28.md
- Add docs/plans/v17-execution-prompts-2026-05-28.md

Content requirements for the plan:
- Goal
- Product boundary
- Design principles
- goal-progress-ledger.v1 contract
- capabilities.v1 contract
- diagnostics.v1 contract
- error-envelope.v1 contract
- CLI/API/Workbench scope
- 10 implementation stages
- Test plan
- Risks and mitigations
- Non-goals
- Acceptance criteria
- Recommended execution handoff

Content requirements for prompts:
- Global worker system prompt
- Task 1-10 worker prompts
- Matching reviewer prompts
- Revision prompt template
- Final release prompt

Safety boundaries:
- Emphasize read-only/copy-only Workbench.
- Explicitly exclude Autopilot, browser execution, Workbench writes, arbitrary path reads, downloads, and frontend safety inference.

Acceptance:
- git diff --check passes.
- No code behavior changes.

Return:
- Summary
- Files changed
- Commands run
- Any docs gaps
```

### Task 0 Reviewer Prompt

```text
/goal
Review Task 0 implementation for v17 plan materialization.

You are reviewer only. Do not modify files unless explicitly producing a tiny reviewer evidence note requested by the repo process. Inspect the diff and verify:

- Plan file exists under docs/plans/ with v17 scope.
- Prompt file exists under docs/plans/ with executable task prompts.
- v17 remains read-only/copy-only in Workbench/API boundaries.
- Non-goals explicitly exclude Autopilot, browser execution, Workbench writes, artifact download/open local file, arbitrary path reads, and frontend safety inference.
- The prompt file separates worker and reviewer roles so the same agent does not self-approve.
- git diff --check passes.

Return exactly one verdict:
- APPROVED, with evidence and commands run.
- NEEDS_REVISION, with specific blockers and line/file references.
```

---

## Task 1 Prompt: `goal-progress-ledger.v1` Contract Fixtures and Validator

```text
/goal
Implement Task 1 for v17: add goal-progress-ledger.v1 contract fixtures and validator.

Branch:
- Start from updated main.
- Create branch: v17-task1-goal-progress-contract

Before coding:
- Inspect existing v16 contract/fixture/validator patterns for guided-goal-handoff.v1 and safe-artifact-preview.v1.
- Follow existing file naming and validation style.

Implement:
- Add goal-progress-ledger.v1 contract support.
- Add fixtures for:
  - planned / not-started
  - approved with review evidence
  - needs-revision with review evidence
  - blocked with blocker reason
  - unknown when evidence is absent
  - release-ready with all required release gates
- Add validator coverage for:
  - required contractName/contractVersion
  - task status enum
  - review verdict enum
  - release gate status enum
  - nextActions copy-only command shape
  - safety flags
  - invalid/missing fields

Required status enum:
- not-started
- planned
- in-progress
- self-checked
- needs-review
- needs-revision
- approved
- merged-to-main
- main-verified
- release-ready
- blocked
- unknown

Rules:
- Do not implement resolver yet unless required for validator tests.
- Do not add API routes yet.
- Do not add Workbench UI yet.
- Do not add dependencies unless unavoidable.

Acceptance commands:
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Notes on how the contract follows existing patterns
```

### Task 1 Reviewer Prompt

```text
/goal
Review Task 1 for v17: goal-progress-ledger.v1 contract fixtures and validator.

Reviewer role only. Inspect diff and tests. Verify:

- Existing contract architecture/style is followed.
- Fixtures cover planned, approved, needs-revision, blocked, unknown, and release-ready.
- Validator rejects invalid status, missing contract name/version, invalid review verdict, invalid release gate, and malformed copy-only nextActions.
- No resolver/API/UI scope creep.
- No new dependencies unless justified.
- pnpm check, pnpm test, and git diff --check pass.

Return exactly:
- APPROVED with evidence, or
- NEEDS_REVISION with specific blockers.
```

---

## Task 2 Prompt: Goal Progress Resolver

```text
/goal
Implement Task 2 for v17: add a read-only goal progress resolver that outputs goal-progress-ledger.v1.

Branch:
- Start from updated main after Task 1 merge.
- Create branch: v17-task2-goal-progress-resolver

Before coding:
- Inspect existing run state, handoff, evidence refs, artifact refs, and latest pointer readers.
- Inspect how v16 handoff and safe preview routes read registered refs.

Implement:
- Add a read-only resolver for goal-progress-ledger.v1.
- It should aggregate only existing registered state/evidence/handoff refs.
- It must return explicit unknown/missing/blocked fields when evidence is absent.
- It must not infer completion from task title, branch name, command text, filename, or path.
- It must not write files, create evidence, execute commands, invoke models, or scan arbitrary paths.

Test cases:
- Latest goal/handoff fixture resolves.
- Missing state pointer returns safe unknown/missing state.
- Missing task evidence returns unknown, not approved.
- Missing review evidence returns needs-review or unknown, not approved.
- Needs revision verdict produces needs-revision.
- Main verification evidence produces main-verified.
- Release gates produce release-ready only when all required gates pass.

Do not implement:
- CLI command.
- API routes.
- Workbench UI.

Acceptance commands:
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Explicit note confirming no write/model/shell/arbitrary-path behavior was added
```

### Task 2 Reviewer Prompt

```text
/goal
Review Task 2 for v17: goal progress resolver.

Verify:
- Resolver is read-only.
- Resolver only consumes registered state/evidence/handoff refs.
- Missing evidence maps to unknown/missing/blocked rather than guessed success.
- Task title/branch/command/filename/path are not treated as proof.
- No CLI/API/UI scope creep.
- Tests cover missing evidence, needs-revision, main verification, and release-ready gates.
- pnpm check, pnpm test, git diff --check pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 3 Prompt: `symphony goal-status` CLI

```text
/goal
Implement Task 3 for v17: add read-only `symphony goal-status` CLI.

Branch:
- Start from updated main after Task 2 merge.
- Create branch: v17-task3-goal-status-cli

Implement CLI:
- pnpm symphony goal-status
- pnpm symphony goal-status --json
- pnpm symphony goal-status --markdown
- pnpm symphony goal-status --goal <goal-id> --json

Behavior:
- Human output is concise and readable.
- --json returns goal-progress-ledger.v1.
- --markdown returns a task/status table, blockers, release gates, and next copy-only commands.
- Command is read-only.
- It must not write `.symphony` files, create runtime artifacts, create evidence, run tests, run audit, run mutation, invoke models, or execute shell beyond the CLI process itself.

Tests:
- Human output contains goal summary and task statuses.
- JSON output validates as goal-progress-ledger.v1.
- Markdown output contains table and blockers.
- Unknown goal returns safe error.
- Command does not create/modify state files.

Acceptance commands:
- pnpm symphony goal-status --json
- pnpm symphony goal-status --markdown
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Note how read-only behavior is verified
```

### Task 3 Reviewer Prompt

```text
/goal
Review Task 3 for v17: symphony goal-status CLI.

Verify:
- CLI commands exist and match expected flags.
- --json returns goal-progress-ledger.v1.
- --markdown is copy/paste friendly.
- Unknown goal uses safe error handling.
- No state/evidence/artifact writes occur.
- No model/test/audit/mutation invocation occurs from the command.
- Tests prove read-only behavior.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 4 Prompt: Goal Progress Read-only API Routes

```text
/goal
Implement Task 4 for v17: add read-only goal progress API routes.

Branch:
- Start from updated main after Task 3 merge.
- Create branch: v17-task4-goal-progress-api

Add routes:
- GET /api/goals
- GET /api/goals/latest/progress
- GET /api/goals/<goal-id>/progress

Behavior:
- GET only.
- Non-GET returns 405.
- Unknown goal returns 404.
- Successful progress response returns goal-progress-ledger.v1.
- /api/goals returns registered goal summaries only.
- No arbitrary path input.
- Reject or ignore query path safely; do not read it.
- Encoded traversal and absolute paths must not cause file reads.

Tests:
- Happy path for all routes.
- Unknown goal.
- Non-GET 405.
- path query rejected/ignored safely.
- encoded traversal blocked.
- no arbitrary local path read.

Do not implement:
- capabilities route.
- diagnostics route.
- error-envelope migration unless required by existing route helper; full envelope is Task 8.
- Workbench UI.

Acceptance commands:
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Route safety notes
```

### Task 4 Reviewer Prompt

```text
/goal
Review Task 4 for v17: goal progress API routes.

Verify:
- GET /api/goals, /api/goals/latest/progress, and /api/goals/<goal-id>/progress exist.
- Routes are GET-only.
- Unknown goal and non-GET are safely handled.
- Query path/traversal/absolute path attempts cannot read files.
- Successful progress response validates as goal-progress-ledger.v1.
- No Workbench UI or unrelated route scope creep.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 5 Prompt: Workbench Goal Progress Panel

```text
/goal
Implement Task 5 for v17: add read-only Workbench Goal Progress panel.

Branch:
- Start from updated main after Task 4 merge.
- Create branch: v17-task5-workbench-goal-progress-panel

Before coding:
- Inspect v15/v16 Workbench React/Vite patterns.
- Inspect v16 guided handoff and safe artifact preview UI patterns.

Implement UI:
- Fetch only backend goal progress API.
- Render goal id/title, baseline, task statuses, evidence refs, review verdicts, blockers, next copy-only commands, and release gates.
- Render missing/unavailable fields explicitly.
- Do not infer status from task title, id, command text, branch, filename, route, path, MIME, or extension.
- Do not add execution buttons.
- Do not add browser command execution.
- Do not add Workbench writes.
- Do not add artifact download/open local file.
- Do not render raw HTML/SVG/JS/binary inline.

Tests/build:
- Add component/unit tests if existing test pattern supports it.
- Ensure Workbench build passes.
- Ensure existing fallback/API route tests still pass.

Acceptance commands:
- pnpm workbench:build
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Explicit frontend no-inference/no-execution note
```

### Task 5 Reviewer Prompt

```text
/goal
Review Task 5 for v17: Workbench Goal Progress panel.

Verify:
- UI consumes backend ledger fields only.
- UI does not infer status/safety from path/kind/MIME/extension/title/task id/command text.
- UI has no execution buttons, mutation actions, browser terminal, model calls, or write paths.
- Missing data renders as missing/unavailable, not guessed.
- pnpm workbench:build, pnpm check, pnpm test, git diff --check pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 6 Prompt: `capabilities.v1` Contract, API, and UI

```text
/goal
Implement Task 6 for v17: add capabilities.v1 contract, read-only API route, tests, and Workbench display.

Branch:
- Start from updated main after Task 5 merge.
- Create branch: v17-task6-capabilities-contract-api-ui

Implement:
- capabilities.v1 contract/validator/fixtures.
- GET /api/capabilities.
- Workbench display section/card for capabilities.

Contract must declare:
- readOnly: true
- displayOnly: true
- copyOnly: true
- mutationAvailable: false
- browserExecutionAvailable: false
- modelInvocationAvailable: false
- artifactDownloadAvailable: false
- safePreview.available
- safePreview.inlineModes includes bounded-text only
- rawHtmlInlineAvailable: false
- svgInlineAvailable: false
- javascriptInlineAvailable: false
- binaryInlineAvailable: false
- routes.handoff/safePreview/goalProgress/diagnostics booleans as appropriate

Tests:
- Valid fixture.
- Invalid fixture.
- GET route happy path.
- Non-GET 405.
- No env secret/path leakage.
- Workbench renders unsupported capabilities explicitly.

Acceptance commands:
- pnpm workbench:build
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Capability boundary notes
```

### Task 6 Reviewer Prompt

```text
/goal
Review Task 6 for v17: capabilities.v1.

Verify:
- Contract clearly declares read-only/display-only/copy-only boundaries.
- Unsupported capabilities are explicitly false.
- GET /api/capabilities is GET-only and leaks no secrets/paths.
- Workbench displays capabilities without using them to enable mutation/execution.
- Tests cover valid/invalid contract and route behavior.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 7 Prompt: `diagnostics.v1` Contract, API, and UI

```text
/goal
Implement Task 7 for v17: add diagnostics.v1 contract, read-only API route, tests, and Workbench display.

Branch:
- Start from updated main after Task 6 merge.
- Create branch: v17-task7-diagnostics-contract-api-ui

Implement:
- diagnostics.v1 contract/validator/fixtures.
- GET /api/diagnostics.
- Workbench display section/card for diagnostics.

Diagnostics route may read safe local console state already used by existing snapshot/summary routes, but must not:
- run shell commands
- run tests
- run audit
- run mutation
- install packages
- invoke models
- scan arbitrary paths
- read path from query/body
- leak absolute paths/secrets/stack traces

Suggested checks:
- state-dir-readable
- latest-run-pointer-status
- handoff-ref-registered
- safe-preview-route-available
- goal-progress-resolver-available
- workbench-static-available
- read-only-api-boundary
- non-get-blocked
- arbitrary-path-preview-blocked

Tests:
- Valid/invalid contract fixtures.
- GET happy path.
- Non-GET 405.
- No path query behavior.
- Workbench renders ok/warning/error/unknown.

Acceptance commands:
- pnpm workbench:build
- pnpm check
- pnpm test
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Diagnostics no-execution notes
```

### Task 7 Reviewer Prompt

```text
/goal
Review Task 7 for v17: diagnostics.v1.

Verify:
- Diagnostics contract and route are read-only.
- No shell/test/audit/mutation/install/model execution is added.
- No arbitrary path input is accepted.
- No stack trace, absolute path, or secret leakage.
- Workbench displays diagnostic checks only.
- Tests cover route, contract, non-GET, and safe rendering.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 8 Prompt: `error-envelope.v1` Contract and API Error Hardening

```text
/goal
Implement Task 8 for v17: add error-envelope.v1 and apply it to relevant Console API error paths.

Branch:
- Start from updated main after Task 7 merge.
- Create branch: v17-task8-error-envelope

Implement:
- error-envelope.v1 contract/validator/fixtures.
- Shared helper for safe API errors if repo architecture supports it.
- Apply to relevant error paths for:
  - handoff routes
  - safe artifact preview routes
  - goal progress routes
  - capabilities route method errors
  - diagnostics route method errors
- Update Workbench error rendering to display safe envelope fields only where applicable.

Error envelope requirements:
- contractName: error-envelope.v1
- ok: false
- error.code
- error.message
- error.status
- error.route
- error.method
- optional error.safeDetails

Safety requirements:
- No stack traces.
- No absolute local paths.
- No secrets.
- No repo file contents.
- No raw exception messages when unsafe.

Tests:
- Valid/invalid envelope fixtures.
- Non-GET 405 envelope.
- Unknown handoff/goal envelope.
- Blocked preview envelope.
- Traversal/path attempt envelope.
- Workbench renders safe message only.

Acceptance commands:
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Error safety notes
```

### Task 8 Reviewer Prompt

```text
/goal
Review Task 8 for v17: error-envelope.v1.

Verify:
- Error envelope contract/validator/fixtures exist.
- Relevant API error paths use safe consistent envelope.
- No stack traces, absolute paths, secrets, or repo contents can leak through error bodies.
- Success contracts are not unnecessarily changed.
- Workbench renders safe error fields only.
- Tests cover method errors, unknown refs, blocked preview, and traversal attempts.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 9 Prompt: Route Smoke, Fallback, and Security Hardening

```text
/goal
Implement Task 9 for v17: route smoke, Workbench fallback, Stage Charter, and security boundary hardening.

Branch:
- Start from updated main after Task 8 merge.
- Create branch: v17-task9-route-smoke-security

Expand smoke/security coverage for:
- GET /api/handoff
- GET /api/handoff/guided-goal-handoff.v1
- GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview
- GET /api/goals
- GET /api/goals/latest/progress
- GET /api/goals/<goal-id>/progress
- GET /api/capabilities
- GET /api/diagnostics
- Workbench fallback boundaries
- Stage Charter boundary
- non-GET 405 across read-only routes
- query path rejection/ignore behavior
- encoded traversal
- arbitrary local path attempts
- repo source/package/lockfile/docs blocking where applicable
- raw HTML/SVG/JS/binary inline prevention where applicable

Also add grep/static assertions if repo has an existing pattern, for example to ensure Workbench has no execution/action labels introduced by v17.

Do not add new product features in this task.

Acceptance commands:
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

Return:
- Summary
- Files changed
- Tests run and exact results
- Boundary coverage map
```

### Task 9 Reviewer Prompt

```text
/goal
Review Task 9 for v17: route smoke/security hardening.

Verify:
- Smoke tests cover all v16 and v17 read-only routes.
- Non-GET 405 is covered.
- Traversal/arbitrary path/query path attempts are covered.
- Workbench fallback and Stage Charter boundaries are covered.
- Raw HTML/SVG/JS/binary inline prevention remains covered.
- No product feature scope creep.
- Required checks pass.

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Task 10 Prompt: Documentation, Release Evidence, and v17 Tag Prep

```text
/goal
Implement Task 10 for v17: update docs, operator guide, release evidence, and prepare tag evidence.

Branch:
- Start from updated main after Task 9 merge.
- Create branch: v17-task10-docs-release-evidence

Update docs:
- README current status / latest milestone section.
- Workbench Operator Guide.
- Contract docs or indexes used by the repo.
- v17 release evidence document.

Docs must describe:
- goal-progress-ledger.v1
- symphony goal-status
- goal progress API routes
- capabilities.v1
- diagnostics.v1
- error-envelope.v1
- Workbench Goal Progress / Capabilities / Diagnostics panels
- read-only/copy-only boundaries
- explicit non-goals
- v16 safety boundaries that remain intact

Run final verification:
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- git status -sb

Do not create a git tag unless the user explicitly asks after reviewing final evidence.

Return:
- Summary
- Files changed
- Full command evidence
- Release readiness assessment
- Remaining blockers if any
```

### Task 10 Reviewer Prompt

```text
/goal
Review Task 10 for v17 docs/release evidence.

Verify:
- README accurately marks v17 scope without overstating execution capabilities.
- Workbench Operator Guide documents v17 panels and boundaries.
- Release evidence includes all required command results.
- Non-goals are explicit.
- No tag was created unless explicitly requested.
- Final checks pass:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - pnpm test:mutation:gate
  - pnpm audit --audit-level high
  - git diff --check

Return exactly APPROVED or NEEDS_REVISION with evidence.
```

---

## Generic Revision Prompt

Use this when a reviewer returns `NEEDS_REVISION`.

```text
/goal
Revise the current v17 task branch based on reviewer feedback.

Reviewer verdict:
NEEDS_REVISION

Reviewer blockers:
<Paste exact reviewer blockers here>

Rules:
- Fix only the blockers for the current task.
- Do not expand scope.
- Preserve v17 read-only/copy-only boundaries.
- Add or adjust tests for the blocker.
- Re-run the task acceptance commands.

Return:
- What changed
- How each blocker was addressed
- Tests run and exact results
- Remaining risk
```

---

## Main Merge Verification Prompt

Use this after a task reviewer returns `APPROVED` and before/after merging to main.

```text
/goal
Verify the approved v17 task branch against main and prepare merge evidence.

Task:
<Paste task number/title>

Branch:
<Paste branch name>

Required:
- Confirm branch is based on latest main or can merge cleanly.
- Run relevant task checks.
- Run git diff --check.
- Summarize changed files and acceptance evidence.
- Do not create tag.
- Do not push unless the user explicitly asks.

Return:
- Merge readiness: READY or BLOCKED
- Commands run and results
- Files changed
- Any conflicts or blockers
```

---

## Final v17 Release Prompt

Use only after all task branches are merged to main and final docs/evidence are approved.

```text
/goal
Prepare final v17 release evidence for multi-coding-agents-symphony.

Scope:
- v17 Read-only Goal Progress Ledger + Console Contract Hardening.

Confirm implemented:
- goal-progress-ledger.v1
- symphony goal-status
- goal progress read-only API routes
- Workbench Goal Progress panel
- capabilities.v1
- diagnostics.v1
- error-envelope.v1
- route smoke/security hardening
- README and Workbench Operator Guide updates
- release evidence doc

Final checks:
- git status -sb
- git log --oneline -5
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check

Safety verification:
- No Autopilot.
- No browser command execution.
- No browser terminal.
- No Workbench writes/mutation actions.
- No artifact download/open local file.
- No arbitrary path reads.
- No frontend safety inference.
- No raw HTML/SVG/JS/binary inline rendering.

Do not create tag unless explicitly instructed.

Return:
- Final release readiness: READY or BLOCKED
- Evidence commands and exact results
- Files/docs updated
- Remaining blockers
- Suggested tag command only if READY, as copy-only text
```
