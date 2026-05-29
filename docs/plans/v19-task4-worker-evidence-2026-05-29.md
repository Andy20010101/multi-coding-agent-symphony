# v19 Task 4 Worker Evidence

## Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-4`
- Branch: `v19-task4-goal-prompt-pack`
- Date: 2026-05-29

## Implementation Summary

Task 4 adds `goal-prompt-pack.v1` generation and the `symphony goal prompt` CLI path.

The implementation adds `src/symphony/goal-prompt-pack.js` with prompt builders for:

- `worker`: implementation prompt with task scope, validation commands, worker evidence file naming, and `symphony goal update` registration guidance.
- `reviewer`: independent review prompt with self-review guard, validation commands, review evidence file naming, and `symphony goal review` registration guidance for `approved` and `needs-revision` verdicts.
- `main-verifier`: main verification prompt that requires reviewer approval evidence before verification and registers through `symphony goal gate --gate main-verification` with `passed` and `failed` status examples.
- `release-manager`: release prompt covering release gates, closeout evidence naming, and `symphony goal gate` guidance for passed gates, failed gates, and explicit `release.ready` declaration.

The CLI wiring in `scripts/symphony.js` adds:

- `symphony goal prompt --goal <id> --task <id> --role <role> --markdown`
- `symphony goal prompt --goal <id> --task <id> --role <role> --text`
- `symphony goal prompt --goal <id> --task <id> --role <role> --json`
- `symphony goal prompt --goal latest --next --markdown`
- `symphony goal prompt --goal latest --next --text`
- `symphony goal prompt --goal latest --next --json`

JSON output returns a validated `goal-prompt-pack.v1` object. Markdown and text output print only the generated `/goal` prompt text. The `--next` path uses the existing next-action resolver to select task and role.

Task 4 also adds `tests/v19-goal-prompt-pack.test.js`. The tests cover controlled `v19-fixture` prompt generation, all four supported roles, JSON contract validation, text output, `latest --next` markdown generation, outcome-specific registration guidance, and read-only CLI boundary checks.

## Review Revision

The independent review recorded `NEEDS_REVISION` in `docs/plans/v19-task4-review-evidence-2026-05-29.md`.

Fixes made after that review:

- Added `text` output support through `--text` and `--format text`.
- Added `text` prompt-pack generation so `prompts[0].format` can be `text`.
- Expanded reviewer registration guidance with separate `approved` and `needs-revision` dry-run/confirm examples.
- Expanded main-verifier registration guidance with separate `passed` and `failed` dry-run/confirm examples.
- Expanded release-manager registration guidance with passed gate, failed gate, and `release.ready --status declared` examples.
- Added tests for text output and non-success registration guidance.

## Output Capability

### Markdown

`pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown` returned exit code 0 and printed a `/goal` prompt. The prompt includes task scope, self-review prohibition, validation commands, evidence file naming, and event registration guidance.

The `pnpm` script wrapper also prints the package-script banner before the CLI output. The generated prompt itself starts at `/goal`.

### JSON

`node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --json` returned exit code 0. Key fields from the JSON output:

```json
{
  "contractName": "goal-prompt-pack.v1",
  "contractVersion": 1,
  "goalId": "v19-fixture",
  "role": "worker",
  "format": "markdown",
  "copyOnly": true,
  "evidenceFile": "docs/plans/v19-task1-worker-evidence-2026-05-29.md",
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

### Text

`node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --format text` returned exit code 0. The output starts with `/goal`, includes `Task scope:`, and is not JSON.

## Short Prompt Example

This excerpt is from the worker markdown output:

```text
/goal
执行 v19-fixture task-1 worker implement：Add goal runbook contracts and validators。

Task scope:
- Goal: v19-fixture
- Task: task-1
```

The excerpt is copy-only text. It is not an execution result, not reviewer approval, not main verification, and not release readiness.

## Verification Results

### `pnpm check`

Result: passed.

- Exit code: 0
- Command run by script: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`
- Diagnostics: none

### `pnpm test`

Result: passed.

- Exit code: 0
- Tests: 653
- Suites: 108
- Pass: 653
- Fail: 0
- Cancelled: 0
- Skipped: 0
- Todo: 0
- Duration: 3372.234333 ms

Task 4 prompt pack suite result inside the full run:

- `v19 goal prompt pack generator and CLI`: 5 tests, 5 pass, 0 fail.

### `pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown`

Result: passed.

- Exit code: 0
- Output starts with `/goal` after the `pnpm` package-script banner.
- Output includes `Task scope:`.
- Output includes `禁止 self-review`.
- Output includes validation commands `pnpm check`, `pnpm test`, and `git diff --check`.
- Output includes evidence file path `docs/plans/v19-task1-worker-evidence-2026-05-29.md`.
- Output includes `symphony goal update` dry-run and confirm guidance.

### `node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --format text`

Result: passed.

- Exit code: 0
- Output starts with `/goal`.
- Output includes `Task scope:`.
- Output is plain prompt text, not JSON.

### `git diff --check`

Result: passed.

- Exit code: 0
- Output: none

## Boundary Notes

- The prompt generator outputs text only.
- The prompt generator does not execute prompts.
- The prompt generator does not execute generated commands.
- The prompt generator does not call a model.
- The prompt generator does not write docs or other files.
- The prompt generator does not register events.
- The prompt generator does not replace reviewer approval.
- The prompt generator does not infer completion from prompt text, branch names, filenames, commit messages, or command text.
- Markdown output does not create execution buttons or browser actions.
- This evidence records worker implementation only. It does not claim reviewer approval, main verification, release gate completion, or release readiness.
