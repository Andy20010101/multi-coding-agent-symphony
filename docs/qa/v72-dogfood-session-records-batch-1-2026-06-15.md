# v72 Dogfood session records batch 1

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v72-one-week-dogfood-stabilization`
Evidence scope: same-day dogfood

## Summary

| Field | Value |
| --- | --- |
| Counted sessions in this batch | 3 |
| Total counted v72 sessions after this batch | 3 |
| Closeout session gate | blocked |
| Blocking reason | `dogfood-session-count-below-five` |
| One-week stability claim | not allowed |
| Same-day evidence claim | observed |

These records are real v72 operator sessions from 2026-06-15. They are not evidence of one-week stability.

## Session v72-s01

| Field | Value |
| --- | --- |
| Date | 2026-06-15 |
| Local time | 10:56 Asia/Shanghai |
| Project | `multi-coding-agent-symphony` |
| Goal/task | Align v72 runbook and dogfood protocol after v71 release gate passed. |
| Entry path | controller terminal |
| Worker provider | operator |
| Reviewer provider | operator |
| Adoption status | not applicable |
| Verification status | passed |
| Blocker state | not observed |
| Recovery action | not observed |
| Manual terminal escapes | 1 |

### Task Steps

- Verified v71 start gate from `origin/main`, annotated `v71` tag, and GitHub Release.
- Updated v72 runbook to require counted dogfood session records and same-day evidence labeling.
- Added the v72 dogfood protocol defining counted sessions, safe evidence refs, metrics, and closeout gate.
- Opened and merged PR #179 after local diff checks and CI passed.

### Friction Notes

- The repo already had a v72 handoff runbook, but it did not match the six-PR dogfood protocol from the handoff package.
- No product blocker was found.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| github-pr | https://github.com/Andy20010101/multi-coding-agent-symphony/pull/179 | PR #179 runbook protocol |
| commit | `78c2fd54ecd78844d7554cf97809bb0534f4c762` | PR #179 merge commit |
| repo-doc | `docs/qa/v72-one-week-dogfood-stabilization-protocol.md` | v72 dogfood protocol |
| repo-doc | `docs/plans/v72-one-week-dogfood-stabilization-runbook-2026-06-14.md` | aligned v72 runbook |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed |
| blocked | not observed |
| reviewLoopCount | 0 |
| recoveryCount | 0 |
| manualTerminalEscapeCount | 1 |
| elapsedTimeMinutes | not observed |
| cost | unknown |

## Session v72-s02

| Field | Value |
| --- | --- |
| Date | 2026-06-15 |
| Local time | 11:00 Asia/Shanghai |
| Project | `multi-coding-agent-symphony` |
| Goal/task | Add dogfood session template and metrics contract. |
| Entry path | controller terminal |
| Worker provider | operator |
| Reviewer provider | operator |
| Adoption status | not applicable |
| Verification status | passed |
| Blocker state | initial focused test failure in test expectations |
| Recovery action | adjusted the test to validate unsafe records without using the builder, and kept the template warning text explicit |
| Manual terminal escapes | 1 |

### Task Steps

- Added `docs/dogfood/v72-session-log-template.md`.
- Added `src/symphony/dogfood-session-contracts.js`.
- Added `tests/v72-one-week-dogfood-stabilization.test.js`.
- Fixed focused test expectations after the first run caught an unsafe-builder setup problem and a template warning assertion problem.
- Opened and merged PR #180 after local validation and CI passed.

### Friction Notes

- The unsafe evidence test initially used `buildDogfoodSessionRecord`, which correctly threw before `validateDogfoodSessionContract` could return a structured failure.
- The template intentionally names disallowed evidence types; the test had to assert that the warning exists instead of treating those words as an accidental exposure.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| github-pr | https://github.com/Andy20010101/multi-coding-agent-symphony/pull/180 | PR #180 session contract |
| commit | `8123d9de5e4e5a6e30cfc4f8fe933d3197a81d42` | PR #180 merge commit |
| repo-doc | `docs/dogfood/v72-session-log-template.md` | v72 session log template |
| repo-doc | `tests/v72-one-week-dogfood-stabilization.test.js` | v72 contract tests |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed |
| blocked | not observed |
| reviewLoopCount | 1 |
| recoveryCount | 1 |
| manualTerminalEscapeCount | 1 |
| elapsedTimeMinutes | not observed |
| cost | unknown |

## Session v72-s03

| Field | Value |
| --- | --- |
| Date | 2026-06-15 |
| Local time | 11:02 Asia/Shanghai |
| Project | `multi-coding-agent-symphony` |
| Goal/task | Verify the post-PR-1 Workbench and packaged-app smoke path before recording batch 1 evidence. |
| Entry path | package build |
| Worker provider | operator |
| Reviewer provider | operator |
| Adoption status | not applicable |
| Verification status | passed after dependency recovery |
| Blocker state | fresh worktree was missing `node_modules`, so `vite` and `react` imports failed |
| Recovery action | ran `pnpm install`, then reran the failed Workbench build and route tests |
| Manual terminal escapes | 1 |

### Task Steps

- Ran `pnpm desktop:shell:smoke`.
- Ran `node --test tests/v72-one-week-dogfood-stabilization.test.js`.
- Ran `pnpm workbench:build`; it failed because `vite` was not installed in this worktree.
- Ran Workbench route tests; `tests/workbench-api-client.test.js` failed on missing `vite`, and `tests/workbench-shell.test.js` failed on missing `react`.
- Ran `pnpm install`; the lockfile was already up to date and 194 packages were added locally.
- Reran `pnpm workbench:build`; it passed.
- Reran `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`; it passed with 133 tests.

### Friction Notes

- Fresh worktrees can look like product failures when `node_modules` is absent. The recovery is `pnpm install`, not a code change.
- The route test emitted a non-failing Vite WebSocket warning because port `24678` was already in use.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| command-evidence | `pnpm desktop:shell:smoke` | passed, `desktop-shell-smoke.v1`, local `.app` bundle target, no updater/publish/signing/notarization |
| command-evidence | `node --test tests/v72-one-week-dogfood-stabilization.test.js` | passed, 6 tests |
| command-evidence | `pnpm workbench:build` | first failed on missing `vite`, then passed after `pnpm install` |
| command-evidence | `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | first failed on missing deps, then passed with 133 tests |
| command-evidence | `pnpm install` | passed, lockfile up to date, local dependencies installed |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed |
| blocked | observed |
| reviewLoopCount | 0 |
| recoveryCount | 1 |
| manualTerminalEscapeCount | 1 |
| elapsedTimeMinutes | not observed |
| cost | unknown |

## Batch 1 Validation

| Command | Result |
| --- | --- |
| `pnpm desktop:shell:smoke` | Passed. |
| `node --test tests/v72-one-week-dogfood-stabilization.test.js` | Passed: 6 tests, 6 passed. |
| `pnpm workbench:build` | Failed before dependency install, then passed after `pnpm install`. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Failed before dependency install, then passed: 133 tests, 133 passed. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |

## Next Gate

`BLOCKED_REAL_DOGFOOD_EVIDENCE` remains after batch 1. v72 needs at least two more valid session records before PR-4 or closeout can satisfy the session count gate.
