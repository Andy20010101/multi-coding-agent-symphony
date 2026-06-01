# v31 Task 0 Register Goal Template Evidence

Date: 2026-06-01
Goal id: `v31-main-verification-runner-evidence-writer`
Release name: `v31 Main Verification Runner + Evidence Writer`

## Inputs Inspected

- `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`
- `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v30-verified-adoption-workspace-v2.v1.json`
- `src/symphony/goal-runbook-contracts.js`
- `src/symphony/goal-runbook-registry.js`
- `scripts/symphony.js`
- `tests/v19-goal-runbook-contracts.test.js`
- `tests/v19-goal-runbook-registry-cli.test.js`

## Files Prepared

- Updated `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md` from a short summary into a concrete v31 plan with product purpose, product spine, non-goals, task branches, task scopes, evidence paths, acceptance criteria, common registration command shapes, and release closeout expectations from the v31 runbook.
- Updated `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md` with common event registration commands and release closeout prompt/commands matching the v31 runbook.
- Created `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json` using the v20-v30 fixture shape.

## Fixture Validation

Fixture path:

```text
fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json
```

Validation method:

```bash
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, taskCount: runbook.tasks.length, releaseGateCount: runbook.releaseGates.length }));"
```

Result: exit code 0.

Output:

```json
{"ok":true,"path":"fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json","taskCount":5,"releaseGateCount":5}
```

## Goal Init Dry Run

Requested command:

```bash
pnpm --silent symphony goal init --from docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md --goal v31-main-verification-runner-evidence-writer --dry-run --json
```

Result: exit code 64.

Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal init does not parse markdown paths; use --from-json with a controlled goal-runbook fixture"
}
```

Repo-local fallback command:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json --goal v31-main-verification-runner-evidence-writer --dry-run --json
```

Result: exit code 0.

Plan hash:

```text
sha256:773ffe6151845c9f1e8d3a222ab2329dc0b994b3e575f70fb6db5aab1375d2d9
```

Confirm details from dry-run output:

```text
symphony goal init --goal v31-main-verification-runner-evidence-writer --from-json fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json --confirm --plan-hash sha256:773ffe6151845c9f1e8d3a222ab2329dc0b994b3e575f70fb6db5aab1375d2d9 --json
```

Dry-run safety fields reported `dryRunWrites: false`, `confirmWritesManagedStateOnly: true`, `automaticEventRegistrationAvailable: false`, and write targets limited to `.symphony/goals/runbooks/v31-main-verification-runner-evidence-writer.json` plus `.symphony/goals/latest-active-goal.json`.

## Acceptance Commands

```bash
pnpm check
```

Result: exit code 0. JavaScript syntax check passed.

```bash
pnpm test
```

Result: exit code 0. Test runner reported 745 passing tests, 0 failures.

```bash
git diff --check
```

Initial result: exit code 2. The new v31 plan had trailing whitespace. I removed the trailing whitespace from that plan doc.

Final result: exit code 0.

```bash
pnpm workbench:build
```

Result: exit code 0. Vite built the Workbench static output successfully.

## Boundary Notes

- The checkout was dirty before this task started, including v29/v30 docs, v29/v30 fixtures, frontend/workbench files, and generated static assets. I did not clean, stash, reset, revert, merge, push, tag, or publish.
- The current CLI rejects `goal init --from <markdown>` and requires `--from-json` with a controlled fixture. The requested command was run and recorded; the plan hash came from the repo-local controlled-fixture fallback.
- I used only explicit files and command output. I did not infer managed goal state from branch name, file names, commit messages, prompt text, task titles, or frontend state.
- `pnpm workbench:build` was run as context after required acceptance. Generated workbench static asset changes already existed in the dirty checkout and were not treated as product implementation for this task.

## Residual Risks

- The plan doc now references exact prompt sections rather than duplicating every prompt body inline; the execution prompt doc holds the worker, reviewer, and main verification prompt text.
- The dry-run command in the handoff uses a markdown `--from` form that this checkout does not support. Registration should use the dry-run fallback confirm command only if the coordinator accepts the controlled fixture source.

## Explicit Task-0 Statement

No product code was implemented. No task completion event was registered. No reviewer approval, main-verification gate, release gate, or release readiness was declared. The goal was not registered with `--confirm`.
