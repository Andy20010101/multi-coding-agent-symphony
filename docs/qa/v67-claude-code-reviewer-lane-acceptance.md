# v67 Claude Code Reviewer Lane acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v67-claude-code-reviewer-lane`

## Accepted Scope

v67 adds a controlled Claude Code reviewer lane. The lane consumes sanitized Codex worker evidence, prepares a bounded reviewer handoff, runs a backend-owned reviewer preview/confirm path, and records structured reviewer verdict evidence.

Accepted changes:

- v67 runbook is recorded in `docs/plans/v67-claude-code-reviewer-lane-runbook-2026-06-14.md`.
- `reviewerRunHandoff.v1` and `reviewerRunVerdict.v1` define the reviewer handoff and verdict boundaries.
- Reviewer fixtures cover ready handoff, missing worker evidence, Claude readiness blocked, self-review blocked, unsafe raw output ref, approved, needs-revision, and blocked verdicts.
- Backend routes expose controlled reviewer preview and confirm paths with fake adapter coverage by default.
- Confirm is bound to `planHash`, active goal/task, provider id `claude-code-cli`, role `reviewer`, fixed command template `claude-code-reviewer-controlled-v1`, sanitized handoff pack ref, and reviewer actor id.
- Workbench shows the Reviewer Run lane with worker evidence refs, review policy, confirm endpoint state, reviewer verdict status, findings, artifact refs, next safe action, and safety boundaries.
- Rebuilt Workbench static assets point to CSS asset `index-BX8171d6.css` and JS asset `index-CK3z9Jhh.js`.
- v68 handoff is recorded in `docs/plans/v68-adoption-main-verification-loop-runbook-2026-06-14.md`.

Out of scope:

- generic shell or terminal UI;
- frontend-supplied freeform provider command;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw worker transcripts, raw model output, or local session paths;
- unsupported provider claims;
- reviewer output as task completion;
- reviewer output as adoption approval;
- reviewer verdict as main verification pass;
- reviewer verdict as release readiness;
- direct goal event append from reviewer output;
- automatic self-review, automatic worktree creation, or automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `node --test tests/v67-claude-code-reviewer-lane.test.js` | Passed during PR-4 closeout rerun: included in focused 29-test v65/v66/v67 suite; 29 passed. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed during PR-4 closeout rerun: included in focused 29-test v65/v66/v67 suite; 29 passed. |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js` | Passed during PR-4 closeout rerun: included in focused 29-test v65/v66/v67 suite; 29 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed during PR-4 closeout rerun: 129 tests, 129 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm workbench:build` | Passed during PR-4 closeout rerun. Built `src/symphony/workbench-static/index.html`, CSS asset `index-BX8171d6.css`, and JS asset `index-CK3z9Jhh.js`. |
| Browser smoke | Passed during PR-3 validation at `http://127.0.0.1:5173/workbench/`: reviewer panel, confirm button, review policy, and next safe action rendered; console error log was empty. |
| `pnpm check` | Passed during PR-4 closeout rerun. |
| `pnpm test` | Passed during PR-4 closeout rerun: 1412 tests, 1412 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed during PR-4 closeout rerun. |
| `git diff --cached --check` | Passed after PR-4 staging. |

The PR-4 closeout validation is also recorded in `docs/plans/v67-claude-code-reviewer-lane-closeout-snapshot-2026-06-14.md`.

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Reviewer handoff is backed by explicit contracts, fixtures, and tests. | `src/symphony/reviewer-run-contracts.js`, `fixtures/contracts/reviewer-run/*.json`, and `tests/v67-claude-code-reviewer-lane.test.js`. |
| Reviewer input is sanitized worker evidence, not raw worker transcript or provider output. | Contract tests reject unsafe raw output refs and raw-source fields; ready handoff fixture uses worker evidence refs with `taskState: needs-review`. |
| Confirm uses only handoff-bound fields. | Backend tests and Workbench client tests cover `planHash`, `goalId`, `taskId`, `providerId`, `role`, `commandTemplateId`, `handoffPackRef`, and `reviewerActorId`. |
| Fake adapter is the default reviewer evidence path. | Backend confirm test writes deterministic `reviewerRunVerdict.v1`; real Claude Code smoke remains explicit opt-in and was not run for v67. |
| Reviewer verdict does not complete task, approve adoption, pass main verification, or mark release ready. | Verdict fixtures and projection tests assert `taskCompleted: false`, `adoptionReady: false`, `mainVerified: false`, and `releaseReady: false`. |
| Workbench exposes reviewer state without arbitrary execution controls. | `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, and Workbench source tests. |
| Closeout records validation, rollback, release prep, and v68 handoff. | `docs/plans/v67-claude-code-reviewer-lane-closeout-snapshot-2026-06-14.md` and `docs/plans/v68-adoption-main-verification-loop-runbook-2026-06-14.md`. |

## Residual Risk

v67 does not run a real Claude Code reviewer smoke. The version proves the controlled reviewer handoff, backend preview/confirm route, fake adapter behavior, structured verdict evidence, and Workbench lane. Real Claude Code smoke remains opt-in because raw provider output and local provider sessions must stay out of the default payload.

v67 does not adopt patches, mutate the main worktree, register main verification, or prepare release readiness. v68 owns adoption and main verification connection.

## Rollback

If reviewer contracts accept raw provider output, raw worker transcripts, session paths, self-review, stale `planHash`, unsupported provider ids, adoption approval, main verification pass, or release readiness, revert PR #152 and dependent PRs.

If backend confirm executes before a ready preview, accepts freeform command material, lets Claude mutate the main worktree, writes raw output, appends goal events directly, completes tasks, approves adoption, passes main verification, or marks release ready, revert PR #153.

If Workbench exposes a shell, terminal, prompt launcher, raw output, local provider link, direct task-complete control, adoption approval, main-verification pass, release-ready control, product git write, or GitHub Release automation, revert PR #154 and rebuild static assets from the reverted source.
