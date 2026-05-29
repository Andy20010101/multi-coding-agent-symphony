# v19 Task 4 Independent Review Evidence

Date: 2026-05-29
Branch reviewed: `v19-task4-goal-prompt-pack`
Base: `main`
Verdict: NEEDS_REVISION

## Review Scope

Reviewed current branch diff against `main`:

- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `scripts/symphony.js`
- `src/symphony/goal-prompt-pack.js`
- `tests/v19-goal-prompt-pack.test.js`

Required context read before verdict:

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `src/symphony/goal-runbook-contracts.js`
- `src/symphony/goal-runbook-registry.js`
- `src/symphony/goal-next-action-resolver.js`
- `fixtures/contracts/goal-runbook.valid.v1.json`
- `tests/v19-goal-runbook-contracts.test.js`
- `tests/v19-goal-next-action-resolver.test.js`
- `package.json`

Diff size:

```text
 docs/plans/v19-task4-worker-evidence-2026-05-29.md | 136 +++++
 scripts/symphony.js                                | 170 +++++-
 src/symphony/goal-prompt-pack.js                   | 672 +++++++++++++++++++++
 tests/v19-goal-prompt-pack.test.js                 | 275 +++++++++
 4 files changed, 1250 insertions(+), 3 deletions(-)
```

## Findings

### Blocker 1: `text` output from the Task 4 plan is missing

The v19 plan lists Task 4 output as `Markdown/text/JSON 输出` in `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`. The implementation only accepts `json` and `markdown`:

- `scripts/symphony.js` parses `--json`, `--markdown`, and `--format`, but `setGoalPromptFormat` rejects any value other than `json` or `markdown`.
- `goalPromptHelpText()` documents only `[--json|--markdown]`.
- `src/symphony/goal-prompt-pack.js` always returns prompt objects with `format: "markdown"`.

Direct check:

```text
$ node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --format text
Exit code: 64
Output:
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal prompt format must be json or markdown"
}
```

Required change:

- Add `text` output support for `symphony goal prompt`, or narrow the v19 Task 4 plan and contract surface before approval. As written, the implementation does not satisfy the plan.

### Blocker 2: event registration guidance is incomplete for non-success outcomes

The prompts list multiple allowed events, but the generated copy-only registration commands hard-code only the success/default path:

- Reviewer prompt allows `reviewer.approved` and `reviewer.needs-revision`, but `registrationFor()` hard-codes `--verdict approved`.
- Main-verifier prompt allows `main.verification-passed` and `main.verification-failed`, but the command hard-codes `--status passed`.
- Release-manager prompt allows `release.gate-passed`, `release.gate-failed`, and `release.ready-declared`, but the command hard-codes `--gate release.pnpm-check --status passed`.

This does not meet the plan requirement that prompts clearly explain how to register events with `symphony goal update/review/gate`. A reviewer who returns `NEEDS_REVISION` or a verifier who fails a gate does not get a correct command to copy.

Required change:

- For reviewer prompts, include a clear `approved|needs-revision` choice or separate dry-run/confirm command examples for both verdicts.
- For main-verifier prompts, include `passed|failed` guidance or separate examples.
- For release-manager prompts, show how to replace the release gate and status, or provide per-gate/per-status command guidance.
- Tests should assert at least the reviewer `needs-revision` and main-verifier `failed` paths appear in generated guidance.

## Checks That Passed

- All four roles are implemented and generate prompts: `worker`, `reviewer`, `main-verifier`, `release-manager`.
- `--next` uses `buildGoalNextAction()` from `src/symphony/goal-next-action-resolver.js` and rejects `--task`/`--role` when `--next` is used.
- Generated JSON validates as `goal-prompt-pack.v1` for all four roles.
- Markdown generated directly by `node scripts/symphony.js ... --markdown` starts with `/goal`.
- `goal prompt` rejects write-flow flags such as `--confirm`.
- Existing `goal init` and `goal update` help output still works.
- Full `pnpm check`, `pnpm test`, and `git diff --check` passed.

One operator caveat: the required `pnpm symphony ... --markdown` command exits 0, but `pnpm` prints its package-script banner before the `/goal` block. The CLI output itself is copy-only; the full terminal output from the exact acceptance command is not a pure prompt block unless the operator copies from `/goal` onward or uses a silent invocation.

## Commands Run

```text
$ pnpm check
Exit code: 0
Result: passed
Output:
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

```text
$ pnpm test
Exit code: 0
Result: passed
Summary:
tests 652
suites 108
pass 652
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3464.002125

Task 4 suite:
v19 goal prompt pack generator and CLI: 4 tests passed.
```

```text
$ pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
Exit code: 0
Result: passed
Observed stdout starts with the pnpm package-script banner, then the generated prompt starts at /goal.
Prompt content checked:
- Task scope is present.
- 禁止 self-review is present.
- pnpm check, pnpm test, and git diff --check are present.
- Evidence path is docs/plans/v19-task1-worker-evidence-2026-05-29.md.
- symphony goal update dry-run and confirm guidance is present.
```

```text
$ git diff --check
Exit code: 0
Result: passed
Output: none
```

```text
$ node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --json
Exit code: 0
Result: passed
Observed contractName: goal-prompt-pack.v1
Observed contractVersion: 1
Observed prompts[0].role: worker
Observed prompts[0].copyOnly: true
Observed prompts[0].format: markdown
Observed safety.copyOnly: true
Observed safety.modelInvocationAvailable: false
```

```text
$ node --input-type=module -e '...validate generated packs for all roles...'
Exit code: 0
Result:
worker: valid
reviewer: valid
main-verifier: valid
release-manager: valid
```

```text
$ node scripts/symphony.js goal prompt --state-dir <tmp> --goal latest --next --markdown
Exit code: 0
Result: passed
Observed prompt selected task-1 worker with resolver reason:
No explicit worker evidence is recorded for task-1.
```

```text
$ node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --confirm
Exit code: 64
Result: expected rejection
Output message: goal prompt is read-only and does not accept write-flow flags
```

```text
$ node scripts/symphony.js goal update --help
Exit code: 0
Result: existing goal update CLI help still prints.
```

```text
$ node scripts/symphony.js goal init --help
Exit code: 0
Result: existing goal init CLI help still prints.
```

```text
$ node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --format text
Exit code: 64
Result: failed
Output message: goal prompt format must be json or markdown
```

## Verdict

NEEDS_REVISION

The implementation is close, and the main JSON/markdown paths pass tests. It should not be approved until Task 4 either supports the planned `text` output or the plan is deliberately narrowed, and until generated registration guidance covers the non-success events that the prompts advertise.
