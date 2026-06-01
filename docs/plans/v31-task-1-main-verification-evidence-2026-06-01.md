# v31 task-1 main verification evidence

Date: 2026-06-01  
Goal id: `v31-main-verification-runner-evidence-writer`  
Release name: `v31 Main Verification Runner + Evidence Writer`  
Task id: `task-1`  
Task title: `Main verification readiness from explicit state`  
Verifier id: `codex-v31-task-1-main-verifier`

## Decision

Main verification decision: `passed`

The task-1 implementation satisfies the v31 readiness scope: Workbench exposes main verification readiness from explicit state only, and does not infer readiness from branch names, file names, commit messages, prompt text, task titles, copy-only command text, or frontend state.

I did not register a gate. During this verification pass, the required `goal-status` and `goal next` commands showed task-1 had already been recorded as `main-verified` by event `evt_6c071ef4d5aaca8c`, with this evidence ref. That current explicit state supersedes the delegated starting note that task-1 was still waiting for main verification.

## Evidence inputs

- Worker evidence: `docs/plans/v31-task-1-worker-evidence-2026-06-01.md`
- Review evidence: `docs/plans/v31-task-1-review-evidence-2026-06-01.md`
- Runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`
- Plan: `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- Implementation files inspected:
  - `frontend/workbench/src/api/contracts.js`
  - `frontend/workbench/src/App.jsx`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js`
  - `docs/symphony-product-contracts.md`
  - `docs/workbench-operator-guide.md`

## Commands and outcomes

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | JavaScript syntax check completed successfully. |
| `pnpm test` | 0 | Full suite passed: 745 tests, 0 failed, 115 suites passed. |
| `pnpm workbench:build` | 0 | Vite build completed; Workbench static output was generated under `src/symphony/workbench-static/`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-progress-ledger.v1`; `task-1` status was `main-verified`, status source `goal-event-log.v1:evt_6c071ef4d5aaca8c`, worker evidence ref and review evidence ref were present, review verdict was `APPROVED`, and main verification ref was `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md`. |
| `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-next-action.v1`; next action had advanced to `task-2`, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-2.` |

Additional read-only checks used to reconcile current state:

- `tail -n 12 .symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson` showed sequence 4 as `main.verification-passed`, actor `codex-v31-task-1-main-verifier`, evidence ref `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md`, source command `symphony goal gate`.
- `pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --json` exited 0 and showed no missing task-1 worker, review, or main-verification evidence; remaining missing items start at task-2 and release gates.

## Code and evidence basis

- `frontend/workbench/src/api/contracts.js` projects explicit state sources from `goal-status`, `goal-event-log`, `goal next`, `goal-operation-runs`, and `symphony.console-adoption-inspect`; it also exposes ignored inference sources for branch names, file names, commit messages, prompt text, task titles, frontend component state, and copy-only command text.
- `frontend/workbench/src/api/contracts.js` selects a main-verification task from explicit `goal-next-action.v1` role/phase first, then from event-backed ledger tasks with reviewer approval and missing main verification. It does not use branch or file names for readiness selection.
- `frontend/workbench/src/api/contracts.js` derives reviewer approval from `reviewer.approved` / `reviewer.needs-revision` events or event-backed ledger verdict, and derives adoption blockers from scoped `adoption-plan` / `adoption-confirm` operations plus matching adoption inspect state.
- `frontend/workbench/src/App.jsx` renders `Main Verification Readiness` with reviewer verdict, adoption state, blockers, required verification commands, evidence path, copy-only gate dry-run text, explicit state sources, ignored inference sources, and safety fields. The panel is display/copy oriented.
- `tests/workbench-api-client.test.js` covers ready state from explicit reviewer approval, missing readiness when approval-like text appears only in title/branch/copy-only command, blocked state when an adoption plan lacks passed adoption-confirm, and ready state when adoption-confirm passed with matching inspect state.
- `tests/workbench-shell.test.js` verifies the v31 panel is wired, exposes explicit/ignored source sections, includes the evidence placeholder, and does not include frontend event-confirm, local-open, clipboard, terminal, or generic execution controls.
- `docs/symphony-product-contracts.md` and `docs/workbench-operator-guide.md` document the v31 readiness boundary: active goal contracts and adoption operation/inspect state are valid sources; branch, filename, commit message, prompt text, task title, copy-only command, and frontend state are not valid readiness sources.

## Boundary notes

- I did not implement or modify product code.
- I wrote only `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md`.
- I did not run `symphony goal gate`, `symphony goal update`, or `symphony goal review`.
- I did not declare release readiness, register release gates, merge, push, tag, publish, clean, stash, reset, or revert.
- The checkout was already dirty on branch `v30-task-3-adoption-inspect-and-recovery-view`, so this pass used the requested repo-local/current-checkout fallback.
- Original blocked/superseded operation: the delegated starting state said `goal next` required `task-1` role `main-verifier`. Current exact fallback checks showed `task-1` already `main-verified` and `goal next` moved to `task-2`. The current explicit goal event state supersedes the earlier blocker.
- Browser was not required for this role and was not used.

## Recovery steps

If this verification needs to be replayed from a clean task-1 gate state:

1. Start from a checkout where `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` returns `task-1`, role `main-verifier`, phase `main-verification`.
2. Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`, and `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`.
3. If the six commands pass and `goal next` still points at task-1 main verification, register the gate through a dry-run first, inspect the plan hash and event summary, then confirm only with the matching plan hash.
4. If any required command fails, mark main verification failed and send the task back to worker revision with the failed command and evidence path.

Suggested dry-run gate registration command:

```bash
pnpm --silent symphony goal gate --goal v31-main-verification-runner-evidence-writer --task task-1 --gate main-verification --status passed --verifier codex-v31-task-1-main-verifier --evidence-ref docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md --dry-run --json
```
