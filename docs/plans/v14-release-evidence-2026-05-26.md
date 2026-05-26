# v14 Release Evidence: Stage Kernel Refactor

Date: 2026-05-26

## Scope

- Added Stage Charter JSON as the machine source of truth and generated HTML as display-only output.
- Added local Stage runtime state under `.symphony/stages`.
- Added `symphony stage`, `symphony stage --json`, `symphony stage create`, `symphony stage activate <stage-id>`, `symphony stage render <stage-id>`, `symphony stage render <stage-id> --write`, `symphony stage summary`, and `symphony next`.
- Bound `do`, `review`, and `verify` summaries/run state to the active Stage unless `--no-stage` is supplied.
- Added explicit `--stage <stage-id>`, `--no-stage`, and no-active-stage binding records for product work flows.
- Added a Stage Charter consistency gate before product executions, controlled plan confirmation, adoption planning, and adoption confirmation.
- Added blocker, repair artifact, gate event, and blocked snapshot state for failed gates, with repair/snapshot artifacts written through `ArtifactStore`.
- Added resolved gate events and frozen blocked snapshot checks before a repaired blocker clears.
- Added Stage overview data to Workbench snapshots and the read-only Workbench UI.
- Added Stage-aware adoption summary metadata without changing v12 adoption apply behavior.

## Safety Notes

- v12 adoption confirmation still uses the existing frozen plan, frozen patch, fingerprint checks, `git apply --check`, adoption journal, and post-apply evidence path.
- Workbench remains GET-only/read-only and only exposes copy-only commands.
- `.symphony/stages` stores local runtime summaries and refs; full Stage repair and blocked snapshot artifacts are written under the local ArtifactStore root.

## NEEDS_REVISION Repair Evidence

This section records the follow-up fixes for `docs/plans/v14-independent-review-report-2026-05-26.md`. It does not mark v14 accepted; independent re-review is still required.

- Stage blocker recovery now freezes and revalidates the blocked Stage JSON hash, current JSON/HTML consistency, blocked action digest, git head, project fingerprint, dirty worktree hash, and frozen refs before a repaired blocker can clear.
- The allowed HTML repair path remains JSON to HTML only: HTML hash may change during repair, but the current HTML must match the current Stage JSON before any blocker-clear attempt.
- Blocked action identity is a normalized digest containing command/subcommand, prompt, flags, write/dry-run/real mode, risk mode, Stage id, target id, plan id, adoption id, and override id where applicable.
- `.symphony/stages/*.json` now keeps gate/blocker summaries and artifact refs. Full repair plans and high-risk blocked snapshots are stored through `ArtifactStore`.
- `repairPlanRef` and `blockedSnapshotRef` use artifact ref objects. `executionPlanHash` is a real content hash when an execution plan artifact exists, not the plan id.
- Stage gate coverage now includes `new --write` in addition to product work, controlled plan confirmation, and adoption confirmation paths. Read-only/status/diagnose/console paths remain advisory/read-only.
- `symphony stage` default human output now shows active Stage id, title, goal, status, blocker, and next action without dumping raw JSON.
- Hyphenated compatibility paths were added:
  - `docs/plans/v14-stage-kernel-refactor-plan-2026-05-26.md`
  - `docs/plans/v14-acceptance-checklist-2026-05-26.md`
  - `docs/plans/v14-reviewer-needs-revision-2026-05-26.md`

## Development Checks

- `node --test tests/symphony-cli.test.js`: passed, 47 tests.
- `pnpm check`: passed.
- `pnpm test`: passed, 514 tests.
- `git diff --check`: passed.

## Stage Smoke

- `node scripts/symphony.js stage --json`: passed; emits `symphony.stage-status`.
- `node scripts/symphony.js stage create --help`: passed.
- `node scripts/symphony.js stage render v14-stage-kernel-refactor --json`: passed; preview only when HTML exists.
- `node scripts/symphony.js stage activate v14-stage-kernel-refactor --state-dir /private/tmp/symphony-v14-stage-smoke-codex --json`: passed.
- `node scripts/symphony.js stage summary --state-dir /private/tmp/symphony-v14-stage-smoke-codex --json`: passed.
- `node scripts/symphony.js next --state-dir /private/tmp/symphony-v14-stage-smoke-codex --json`: passed.

## Release Conclusion

### Scope

- Stage Contract.
- Stage CLI.
- Stage-aware `do` / `review` / `verify` / `adopt` / `diagnose` / `console`.
- Workbench Stage overview.
- Stage Charter HTML/JSON consistency gate.
- `blockedSnapshot` / frozen refs recovery.
- Repair artifact / Stage blocker / resolved gate event.

### Non-goals confirmed

- No React/Vite migration.
- No full Autopilot.
- No Agent Capability Registry.
- No GitHub/PR integration.
- No browser write/adopt/retry/rollback buttons.
- No v12 adoption apply rewrite.

### Reviewer result

- Verdict: APPROVE.
- Time: 19:31.
- Summary: writer fixed `NEEDS_REVISION` findings.
- Approval report: `docs/plans/v14-reviewer-approval-2026-05-26.md`.

### Gates

- `node --test tests/symphony-cli.test.js`: PASS, 47 tests.
- `pnpm check`: PASS.
- `pnpm test`: PASS, 514 tests.
- `git diff --check`: PASS.
- `pnpm audit --audit-level high`: PASS, no high, 1 moderate.
- `pnpm test:mutation:gate`: PASS, mutation score 74.31, threshold 60.

### Targeted smoke

- Stage gate covers `new --write`.
- `blockedSnapshot` stored correctly.
- `.symphony` stores summary/ref only.
- Frozen snapshot recovery checks Stage JSON hash, action digest, project state, git, dirty worktree state, and frozen refs.
- Mismatched Charter blocks writes without creating a normal run.
- Resolved gate event recorded.
- Workbench remains GET-only/copy-only.
- POST returns 405.

### Residual risks

- Audit reports 1 moderate vulnerability, no high/critical.
- React/Vite Workbench remains v15 candidate.
