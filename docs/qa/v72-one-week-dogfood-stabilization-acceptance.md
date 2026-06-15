# v72 One-week Dogfood Stabilization acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v72-one-week-dogfood-stabilization`

## Accepted Scope

v72 records same-day dogfood evidence for the v71 local personal-use Workbench path:

```text
v71 local .app package
-> dogfood protocol
-> session template and metrics contract
-> five same-day operator sessions
-> one targeted recovery note
-> closeout and v73 direction decision
```

Accepted changes:

- `docs/plans/v72-one-week-dogfood-stabilization-runbook-2026-06-14.md` aligns the runbook to the five-session gate and same-day evidence boundary.
- `docs/plans/workbench-v61-v72-real-use-runbooks/v72_one-week-dogfood-stabilization_goal_runbook_latest.md` restores the v72 latest runbook in the v61-v72 package directory.
- `docs/qa/v72-one-week-dogfood-stabilization-protocol.md` defines counted sessions, safe evidence refs, metrics, and closeout gates.
- `docs/dogfood/v72-session-log-template.md` provides the session template and includes the dependency recovery note from real dogfood friction.
- `src/symphony/dogfood-session-contracts.js` adds `dogfoodSession.v1` and `dogfoodSessionSummary.v1`.
- `tests/v72-one-week-dogfood-stabilization.test.js` validates safe session records, unsafe refs, session count gates, same-day evidence, one-week claim rules, and template wording.
- `docs/qa/v72-dogfood-session-records-batch-1-2026-06-15.md` records sessions `v72-s01` to `v72-s03`.
- `docs/qa/v72-dogfood-session-records-batch-2-2026-06-15.md` records sessions `v72-s04` to `v72-s05` and the same-day summary.
- `docs/plans/v72-one-week-dogfood-stabilization-closeout-snapshot-2026-06-14.md` records shipped scope, validation, PR chain, risks, and release notes.
- `docs/plans/v73-direction-decision-2026-06-14.md` chooses continued stabilization for v73.

Out of scope:

- one-week stability claim;
- public distribution;
- DMG release;
- notarization;
- auto-update;
- signing secrets;
- GitHub Release assets;
- colleague or customer rollout;
- unsupported provider claims;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, raw transcripts, raw model output, or raw provider output;
- product-side merge, push, tag, publish, or GitHub Release automation;
- automatic self-review, worktree creation, or next-version goal creation.

## Session Evidence

| Session | Task | Result | Evidence |
| --- | --- | --- | --- |
| `v72-s01` | Align runbook and dogfood protocol. | Passed. | PR #179, `docs/qa/v72-one-week-dogfood-stabilization-protocol.md`. |
| `v72-s02` | Add session template and metrics contract. | Passed after test expectation fix. | PR #180, `docs/dogfood/v72-session-log-template.md`, `tests/v72-one-week-dogfood-stabilization.test.js`. |
| `v72-s03` | Verify Workbench and package smoke after PR-1. | Passed after `pnpm install` recovered missing dependencies. | `docs/qa/v72-dogfood-session-records-batch-1-2026-06-15.md`. |
| `v72-s04` | Build and launch the local `.app`. | Passed. | `docs/qa/v72-dogfood-session-records-batch-2-2026-06-15.md`. |
| `v72-s05` | Verify browser fallback Workbench route. | Passed. | `docs/qa/v72-dogfood-session-records-batch-2-2026-06-15.md`. |

## Metrics

| Metric | Value | Source |
| --- | --- | --- |
| Counted sessions | 5 | Batch 1 and batch 2 session docs. |
| Evidence period | same day, 2026-06-15 | Session dates. |
| One-week stability | not proven | All sessions are same-day. |
| Success | observed in 5 sessions | Session metrics. |
| Blocked | observed in 1 session | `v72-s03` missing local dependencies. |
| Recovery count | 2 | `v72-s02` test expectation fix; `v72-s03` dependency recovery. |
| Manual terminal escape count | 5 | Session metrics. |
| Repeated product blocker | not observed | Batch 2 summary. |
| Cost | unknown | Cost was not observed in session records. |

## Validation

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed. |
| `node --test tests/v72-one-week-dogfood-stabilization.test.js` | Passed: 6 tests, 6 passed. |
| `node --test tests/v71-native-packaging-personal-use.test.js` | Passed: 5 tests, 5 passed. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed: 11 tests, 11 passed. |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed: 15 tests, 15 passed. |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed: 13 tests, 13 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed. |

`pnpm test` remains the final tag-before-publication gate on the final post-PR-5 `origin/main` commit.

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Implemented surfaces are backed by contracts, tests, or written operator evidence. | `dogfoodSession.v1` tests and five session records. |
| At least five real operator task session records exist before closeout. | `v72-s01` through `v72-s05`. |
| Same-day evidence is not described as one-week stability. | Batch 2 summary and this acceptance record. |
| Workbench text does not overclaim release automation or distribution. | Runbook, protocol, template, tests, and batch 2 out-of-scope notes. |
| Raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads. | Contract unsafe-ref tests and evidence ref rules. |
| Closeout records validation, risks, rollback, and next-version direction. | Closeout snapshot and v73 decision memo. |

## Residual Risk

v72 evidence is same-day dogfood on this host. It does not prove a full working week, another Mac, notarization, signing, Gatekeeper behavior, DMG install, auto-update, release asset publication, teammate rollout, customer rollout, or provider expansion.

The missing `node_modules` friction was recovered with `pnpm install` and documented. It can recur in fresh worktrees and should be treated as environment setup unless install or rerun fails.

## Rollback

If the dogfood docs are later read as one-week stability, revert or edit the acceptance and closeout docs to say same-day dogfood only.

If session contract changes allow local session refs, raw transcripts, raw model output, raw provider output, secret values, generic shell, arbitrary command execution, release automation, public distribution, notarization, auto-update, DMG release, release assets, or rollout claims, revert the session contract PR.

If the local app cannot open, use the browser fallback:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```
