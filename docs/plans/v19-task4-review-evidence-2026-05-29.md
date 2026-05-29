# v19 Task 4 Independent Review Evidence

Date: 2026-05-29
Branch reviewed: `v19-task4-goal-prompt-pack`
Base: `main`
Verdict: APPROVED

## Scope Reviewed

This review covered the current branch diff against `main`, not only the worker summary.

Reviewed branch files:

- `scripts/symphony.js`
- `src/symphony/goal-prompt-pack.js`
- `tests/v19-goal-prompt-pack.test.js`
- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task4-review-evidence-2026-05-29.md`

Required context read before verdict:

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `src/symphony/goal-runbook-contracts.js`
- `src/symphony/goal-runbook-registry.js`
- `src/symphony/goal-next-action-resolver.js`
- `fixtures/contracts/goal-runbook.valid.v1.json`
- `tests/v19-goal-runbook-contracts.test.js`
- `tests/v19-goal-runbook-registry-cli.test.js`
- `tests/v19-goal-next-action-resolver.test.js`

Diff reviewed:

```text
docs/plans/v19-task4-review-evidence-2026-05-29.md
docs/plans/v19-task4-worker-evidence-2026-05-29.md
scripts/symphony.js
src/symphony/goal-prompt-pack.js
tests/v19-goal-prompt-pack.test.js
```

## Findings

No blockers found.

The previous review blockers are resolved:

- `text` output is now accepted through `--text` and `--format text`, and programmatic prompt packs can carry `prompts[0].format: "text"`.
- Reviewer prompts now include both `--verdict approved` and `--verdict needs-revision` registration examples.
- Main-verifier prompts now include both `--status passed` and `--status failed` registration examples for `--gate main-verification`.
- Release-manager prompts now include gate passed, gate failed, and `--gate release.ready --status declared` command choices.

## Plan Compliance Checks

Prompt roles:

- `worker`, `reviewer`, `main-verifier`, and `release-manager` are implemented in `src/symphony/goal-prompt-pack.js`.
- The test suite generates valid `goal-prompt-pack.v1` JSON for all four roles.

Prompt content:

- Task prompts include task scope, goal title, task id, task title, branch-as-copy-only text, acceptance, and expected evidence.
- Release-manager prompts include release scope, baseline, required task evidence state, and release gates.
- Worker, main-verifier, and release-manager prompts use explicit `禁止 self-review` language. Reviewer prompts explicitly say to stop if the reviewer participated in the worker implementation and that they `不能 self-review`.
- Prompts include validation commands, evidence file naming, allowed events, dry-run guidance, confirm guidance, and placeholder plan hash handling.

`--next` behavior:

- `buildNextPromptContext()` calls `buildGoalNextAction()` from `src/symphony/goal-next-action-resolver.js`.
- `parseGoalPromptArgs()` rejects `--next` combined with manual `--task` or `--role`.
- A direct probe with a temporary managed runbook selected `task-1 worker` and included the resolver reason `No explicit worker evidence is recorded for task-1.`

JSON output:

- `node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --json` returned `contractName: goal-prompt-pack.v1`, `contractVersion: 1`, `copyOnly: true`, and safety fields with write/model/browser execution disabled.
- Programmatic role checks validated generated prompt packs with `validateGoalPromptPackContract()`.

Markdown and text output:

- `renderGoalPromptPackMarkdown()` and `renderGoalPromptPackText()` only join generated prompt text.
- The `goal prompt` CLI path does not execute generated commands, does not call models, does not register events, and rejects write-flow flags such as `--confirm`.
- The exact `pnpm symphony ... --markdown` acceptance command prints the pnpm package-script banner before the generated prompt. The generated prompt itself starts at `/goal`; operators should copy from `/goal` onward or use a silent invocation if they need a pure prompt-only terminal stream.

Existing CLI:

- `goal init` and `goal update` help paths still return exit code 0.
- Full `pnpm test` passed, including existing v18 goal update/review/gate suites and the v19 Task 1/2/3 suites.

## Commands Run

```text
$ pnpm check
Exit code: 0
Result: passed
Script command:
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
Diagnostics: none
```

```text
$ pnpm test
Exit code: 0
Result: passed
tests 653
suites 108
pass 653
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3539.229958

Task 4 suite:
v19 goal prompt pack generator and CLI: 5 tests passed.
```

```text
$ pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
Exit code: 0
Result: passed
Observed stdout: pnpm package-script banner, then generated prompt beginning with /goal.
Prompt content checked:
- Task scope present.
- self-review prohibition present.
- pnpm check, pnpm test, and git diff --check present.
- Evidence path present: docs/plans/v19-task1-worker-evidence-2026-05-29.md.
- symphony goal update dry-run and confirm guidance present.
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
Observed:
- contractName: goal-prompt-pack.v1
- contractVersion: 1
- goalId: v19-fixture
- prompts[0].role: worker
- prompts[0].copyOnly: true
- prompts[0].format: markdown
- safety.copyOnly: true
- safety.workbenchWriteAvailable: false
- safety.browserExecutionAvailable: false
- safety.modelInvocationAvailable: false
```

```text
$ node scripts/symphony.js goal prompt --goal v19-fixture --task task-1 --role worker --format text
Exit code: 0
Result: passed
Observed stdout starts with /goal and is not JSON.
```

```text
$ node --input-type=module <<'NODE'
...generate all four roles from a temporary managed runbook and validate each goal-prompt-pack.v1...
NODE
Exit code: 0
Result:
worker: contract=valid format=markdown required-markers=present
reviewer: contract=valid format=markdown required-markers=present
reviewer outcomes: approved=true needs-revision=true
main-verifier: contract=valid format=markdown required-markers=present
main outcomes: passed=true failed=true
release-manager: contract=valid format=markdown required-markers=present
release outcomes: gate-passed=true gate-failed=true ready=true
```

```text
$ node --input-type=module <<'NODE'
...register temporary managed runbook and run goal prompt --goal latest --next --markdown...
NODE
Exit code: 0
Result:
exit=0
stderr=""
startsWithGoal=true
selectedTask1=true
selectedWorker=true
resolverReason=true
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
Result: existing goal update help printed.
```

```text
$ node scripts/symphony.js goal init --help
Exit code: 0
Result: existing goal init help printed.
```

## Verdict

APPROVED

Task 4 satisfies the v19 plan for a copy-only goal prompt generator and `symphony goal prompt` CLI path. The implementation supports all required roles, covers markdown/text/JSON output, validates generated JSON through `goal-prompt-pack.v1`, uses the next-action resolver for `--next`, and keeps prompt rendering separate from command execution, model invocation, and event registration.
