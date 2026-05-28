# v18 independent review evidence

日期：2026-05-28
目标：`v18-goal-event-journal-evidence-recorder`
范围：task-1 through task-9 read-only retrospective review

## review basis

This file records read-only retrospective review evidence for task-1 through task-9 only. It does not approve Task 10, does not declare release readiness, does not create a tag, and does not authorize merge.

Reviewer inputs:

- v18 plan and execution prompts.
- The merged task commits listed below.
- Relevant v18 contract, CLI, resolver, API, Workbench, route smoke, and safety regression tests.
- Release gate commands recorded in `docs/plans/v18-release-evidence-2026-05-28.md`.

## verdicts

| Task | Reviewed implementation evidence | Focused checks | Verdict |
|---|---|---|---|
| task-1 | `08808c3` plus hardening commits `e3497dc`, `b00574c`. | Contract fixtures and validators require explicit evidence refs and reject unsafe refs. | `APPROVED` |
| task-2 | `08808c3` plus hardening commits `e3497dc`, `b00574c`. | Append-only journal writer keeps dry-run write-free, confirm append-only, idempotent retries, hash-chain protection, and unsafe path rejection. | `APPROVED` |
| task-3 | `cfb2576`. | `symphony goal update` uses `goal-update-plan.v1`, requires confirm plan hash, and records only worker/task-level events. | `APPROVED` |
| task-4 | `3501fb8`. | `symphony goal review` requires explicit verdict and evidence, and blocks reviewer id reuse of the latest worker id. | `APPROVED` |
| task-5 | `c8f468b`. | `symphony goal gate` requires explicit evidence and does not infer release readiness from passed release gates. | `APPROVED` |
| task-6 | `acbeaa3`. | Resolver maps explicit events to `goal-progress-ledger.v1`, keeps the v17 planned/unknown template with no events, and does not infer release-ready without `release.ready-declared`. | `APPROVED` |
| task-7 | `dec9f13`. | Events API routes are read-only and reject non-GET, unknown goal, query path, traversal, and arbitrary path probes. | `APPROVED` |
| task-8 | `07b9e16`. | Workbench projects Goal Events Timeline and Evidence Matrix from backend fields and does not read evidence refs or create write/execution controls. | `APPROVED` |
| task-9 | `789b8c3`. | Route smoke covers v16/v17/v18 read-only routes, traversal/path probes, Workbench fallback, Stage Charter boundary, and static safety scans. | `APPROVED` |

## command evidence

The full command output is recorded in `docs/plans/v18-release-evidence-2026-05-28.md`.

Relevant checks passed:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `pnpm test:mutation:gate`
- `pnpm audit --audit-level high`
- `git diff --check`
- `pnpm mcas doctor`

## boundary confirmation

The reviewed task-1 through task-9 scope does not add Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, or automatic tag.

Task 10 still requires its own independent reviewer approval after the current `NEEDS_REVISION` blockers are fixed.
