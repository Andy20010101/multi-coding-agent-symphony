# v18 release evidence

日期：2026-05-28
目标：`v18-goal-event-journal-evidence-recorder`
分支：`codex/v18-task10-docs-release-evidence`
基线：`v17`
当前 released repository tag：`v17`

## scope checked

v18 adds controlled goal event registration and read-only event display:

- `goal-event-log.v1` records append-only worker, reviewer, main verification, release gate, blocker, and release ready events.
- `goal-update-plan.v1` is the dry-run plan contract for `symphony goal update`, `symphony goal review`, and `symphony goal gate`.
- `symphony goal update`, `symphony goal review`, and `symphony goal gate` use dry-run / confirm. Confirm requires `--plan-hash` and appends only to the managed journal.
- The resolver reads `goal-event-log.v1` and generates the existing `goal-progress-ledger.v1`; without events it keeps the v17 planned/unknown template.
- Console exposes `GET /api/goals/latest/events` and `GET /api/goals/<goal-id>/events`.
- Workbench displays Goal Events Timeline and Evidence Matrix from backend fields only.

v18 does not include Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, or automatic tag. This task did not create a tag and did not push.

## task evidence

Task evidence is indexed in `docs/plans/v18-task-evidence-index-2026-05-28.md`.

Current finding:

- task-1 through task-9 worker, independent reviewer approval, and main verification events are registered in `goal-event-log.v1` and listed in the task evidence index.
- task-1 through task-9 independent review evidence is recorded in `docs/plans/v18-independent-review-evidence-2026-05-28.md`; Task 10 review evidence is not used as a substitute for those approvals.
- Task 10 worker evidence is registered as `goal-event-log.v1:evt_fcee5fd4584a009f`.
- Task 10 latest review evidence is registered as `goal-event-log.v1:evt_84c1a3303f63ef75` with verdict `NEEDS_REVISION`.
- Release gate events are registered below for this branch.

Because the current review verdict is `NEEDS_REVISION`, final release readiness is `BLOCKED` until an independent reviewer approves this revision and a maintainer runs the land/post-merge verification step. Passing commands alone must not create `release-ready`.

## release gate command evidence

Commands were run from the repository root on `codex/v18-task10-docs-release-evidence`.

| Command | Result | Notes |
|---|---|---|
| `node --test tests/v18-docs-release-evidence.test.js` | Passed. | 2 tests, 2 pass, 0 fail. The test parses the task evidence table and rejects Task 10 review evidence as a substitute for task-1 through task-9 reviewer approval. |
| `pnpm check` | Passed. | `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Passed. | 103 suites, 619 tests, 619 pass, 0 fail. |
| `pnpm workbench:build` | Passed. | Vite built `index-Cb9spymv.css` and `index-DvztPgeZ.js`; Node printed the existing WASI experimental warning. |
| `pnpm test:mutation:gate` | Passed. | Mutation score `74.22`, covered `78.37`, killed `1762`, timed out `6`, survived `488`, no coverage `126`; break threshold `60`; duration `33m07s`. |
| `pnpm audit --audit-level high` | Passed. | Exit code 0. Output reports `1 vulnerabilities found`, severity `1 moderate`; no high-severity gate failure. |
| `git diff --check` | Passed. | No output. |
| `pnpm mcas doctor` | Passed. | JSON status `ok`; Node `24.14.0`; commands include doctor, intake, harness, queue, smoke, and eval replay. |

## event and release-ready status

- The release gate command results in this file are command evidence, not event log state.
- `symphony goal update` confirm registered task-1 through task-10 `worker.evidence-recorded` events: `evt_fb4c451c69547865`, `evt_7745e9314e3848a3`, `evt_e5bcab2839038346`, `evt_3b2719ce9fd70673`, `evt_270550e27467d375`, `evt_856d0ce0a289f3f5`, `evt_cd777431c916718b`, `evt_66ccb05487aba6f9`, `evt_83d71d69de038a74`, `evt_fcee5fd4584a009f`.
- `symphony goal review` confirm registered task-1 through task-9 `reviewer.approved` events: `evt_400277d12c375ee3`, `evt_0b604409cda21936`, `evt_a72334f86307f304`, `evt_ba40bad97c6301d5`, `evt_c5baf82a10f65e6f`, `evt_71d88845e3652290`, `evt_12937d5ee9895c51`, `evt_a7936e709bb5cb5b`, `evt_3aeda4c355222b6c`.
- `symphony goal gate` confirm registered task-1 through task-9 post-review `main.verification-passed` events: `evt_6ceb9e65746a44cd`, `evt_1a91fc8943e42e77`, `evt_2eaa204c782bc737`, `evt_b42c3967cbe6b719`, `evt_3217b8ce9293cbdf`, `evt_ed1895e193395917`, `evt_43e97cf177a77620`, `evt_695ed2ca280a3b20`, `evt_b12818633ee56bf4`.
- `symphony goal review` confirm registered Task 10 latest `reviewer.needs-revision` event `evt_84c1a3303f63ef75`.
- `symphony goal gate` confirm registered release gate events: `release.pnpm-check` `evt_90a73547013ebca9`, `release.pnpm-test` `evt_00c14be9bcb632e1`, `release.workbench-build` `evt_e35e5bbfdac2a294`, `release.mutation-gate` `evt_7d882b06c45dc9ef`, `release.audit-high` `evt_ea3d7ef735cbe2ae`, `release.diff-check` `evt_9aded3ab20f11716`, `release.mcas-doctor` `evt_a3942a951c9753f6`, and `release.docs-updated` `evt_110890a798ea21ab`.
- `pnpm --silent symphony goal-status --goal v18-goal-event-journal-evidence-recorder --json` now returns `summary.completedTasks: 9`, `summary.needsRevisionTasks: 1`, release gates passed for pnpmCheck, pnpmTest, workbenchBuild, mutationGate, auditHigh, diffCheck, and docsUpdated, `releaseGates.tagEvidence: unknown`, and `summary.releaseReady: false`.
- `release-ready` must come from an explicit `release.ready-declared` event. It is not inferred from all command gates passing.

## release readiness

Status: `BLOCKED`

Blockers:

- Task 10 current review verdict is `NEEDS_REVISION`.
- Task 10 post-merge verification still has to run after reviewer approval.
- `release.ready-declared` has to be recorded explicitly after release approval; this task does not infer it from passing command gates.
