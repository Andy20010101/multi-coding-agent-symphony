# v10/v11 Release Evidence

Date: 2026-05-24
Release target: `v11`
Status: main merged and CI passed; this document closes the v11 release evidence set.

Tag policy: v10 is an internal milestone included in the v11 release closeout; no separate v10 tag is planned. The `v11` tag should point at the final release closeout commit containing this evidence.

## Scope

v10 and v11 close the controlled product surface after the v9.1 read-only Workbench:

- v10 adds `symphony diagnose` as a controlled terminal diagnostics command.
- v10 supports text, stable JSON, and static script-free HTML diagnostics output.
- v10 preserves the Workbench safety boundary: no command execution, model calls, project writes, or artifact content previews through diagnostics.
- v11 changes `symphony do --write` into a two-step controlled kernel flow.
- v11 writes a frozen `symphony.execution-plan` artifact before execution.
- v11 executes only through `symphony do --confirm-plan <plan-id>`.
- v11 confirmed execution writes to a managed isolated workspace and keeps `mainWorktreeWrites: false`.
- v11 real-agent plans remain gated by the existing `MCAS_RUN_REAL_*` environment variables before adapter start.

## Release Commits

- PR: https://github.com/Andy20010101/multi-coding-agent-symphony/pull/3
- Merge commit on `main`: `bc453d725d8d0b15fd790a5c2d970819ccafb7d2`
- v10 implementation commit: `ecace1c Add v10 controlled diagnostics CLI`
- v11 implementation commit: `80bde16 Add v11 controlled kernel execution plans`
- v11 review-fix commit: `aacf5c7 Fix v11 plan confirmation guards`

## Local Verification

Commands run from `/Users/andy/Documents/project/multi-coding-agent-symphony`:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
```

Observed results:

- `node --test tests/symphony-cli.test.js`: passed, 36 tests.
- `pnpm check`: passed.
- `pnpm test`: passed, 503 tests.
- `git diff --check`: passed.
- `pnpm audit --audit-level high`: exit 0; one moderate advisory remains below the high threshold.
- `pnpm mcas doctor`: passed, status `ok`.

`pnpm test:mutation:gate` was not rerun locally for the doc-only closeout commit; it is covered by the successful PR #3 CI and main push CI listed below.

## Harness and Eval Proofs

Harness dry-run proofs were run locally:

- `fixture-run`: passed, linear workflow, evidence map `.omx/harness/runs/fixture-run/evidence-map.json`.
- `fixture-writer-reviewer`: passed, writer-reviewer workflow, evidence map `tmp/harness-writer-reviewer-output/runs/fixture-writer-reviewer/evidence-map.json`.
- `fixture-parallel-lanes`: passed, parallel-lanes workflow, evidence map `tmp/harness-parallel-lanes-output/runs/fixture-parallel-lanes/evidence-map.json`.
- `fixture-qa-swarm`: passed, qa-swarm workflow, evidence map `tmp/harness-qa-swarm-output/runs/fixture-qa-swarm/evidence-map.json`.
- `fixture-competitive-patch`: passed, competitive-patch workflow, selected candidate `candidate-a`, evidence map `tmp/harness-competitive-patch-output/runs/fixture-competitive-patch/evidence-map.json`.

Eval replay comparison was run locally:

- Command: `pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z`
- Status: passed.
- Report artifact: `tmp/eval-replay-comparison-artifacts/eval-reports/eval-workflow-comparison-workflow-mode-comparison-workflow-comparison.json`.

## v11 Smoke

A manual smoke created a temporary fixture project and exercised:

```sh
symphony do --project-dir <fixture> --state-dir "<fixture>/state dir" --work-dir <fixture>/work --write --json "inspect README"
symphony do --state-dir "<fixture>/state dir" --confirm-plan <plan-id> --json
symphony status --state-dir "<fixture>/state dir" --json
symphony console --snapshot --state-dir "<fixture>/state dir" --json
symphony diagnose --state-dir "<fixture>/state dir" --json
```

Observed results:

- Planning returned `status: "planned"` and did not invoke the kernel workflow.
- Smoke plan id: `symphony-plan-writer-reviewer-5869f7b78ae0-mpj8s8d0-wo4-2`.
- The generated confirm command included the non-default `--state-dir`.
- Confirmation returned `status: "passed"` with `plannedRunId` and `executionPlanId` linked.
- Status, console snapshot, and diagnose JSON exposed the execution-plan artifact.
- The fixture `README.md` in the main worktree was unchanged.

## CI Evidence

GitHub Actions passed on PR #3 after the final review-fix commit:

- `verify`: success, run `26351238642`, job `77569796589`, completed 2026-05-24T04:13:47Z.
- `verify`: success, run `26351238097`, job `77569795368`, completed 2026-05-24T04:14:31Z.

GitHub Actions also passed on the `main` merge commit `bc453d725d8d0b15fd790a5c2d970819ccafb7d2`:

- `verify`: success, run `26351659890`, job `77570877050`, completed 2026-05-24T04:35:57Z.

The CI workflow included:

- `pnpm check`
- `pnpm test`
- `pnpm test:mutation:gate`
- `git diff --check`
- `pnpm mcas doctor`

## Safety Boundary

The release keeps these boundaries explicit:

- Workbench remains read-only.
- Diagnostics output is read-only and copy-only.
- `symphony do --write` creates a plan but does not start an adapter.
- `symphony do --confirm-plan` rejects missing plans, prompt drift, stale project fingerprints, unsupported write boundaries, invalid audit invariants, and missing real-agent gates before adapter start.
- Confirmed v11 runs never write directly to the main worktree.

## Known Follow-Up

The next product step is v12 verified adoption: a separate two-step flow for reviewing and applying verifier-passing isolated workspace changes back into the main worktree.
