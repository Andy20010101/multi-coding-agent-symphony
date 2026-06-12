# v50 Supervisor Controlled Event Registration acceptance evidence

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v50-supervisor-controlled-event-registration`
PR-5 branch: `codex/v50-supervisor-controlled-event-registration-closeout`
Implementation head before PR-5: `4df2c8ecd0f2709f5d0e50737033436d65144191`

## Baseline Reconcile

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## HEAD (no branch)` before creating the PR-5 branch. |
| `git fetch origin main --tags --prune` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -8 origin/main` | Top commit was `4df2c8e` on `HEAD`, `origin/main`, `origin/HEAD`, and `main`; it merged PR #66. The next commits were `f8d64f9`, `542501d`, `1c4ff03`, `07ed0fd`, `ff33529`, `db0fbe8`, and `c5a506d`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `git rev-parse v49^{commit}` | `9dafad52288c9268558da2a4f65df9b4314659d3` |
| `gh release view v49 --json tagName,name,isDraft,isPrerelease,url,targetCommitish,assets,publishedAt` | Release `v49: Context Session Observability and Supervisor Advisory`, URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v49`, not draft, not prerelease, published at `2026-06-12T04:38:28Z`, assets `[]`, targetCommitish `main`. |

## Merged PR Record

| PR | Title | Branch | Head commit | Merge commit | Merged at |
| --- | --- | --- | --- | --- | --- |
| #62 | Plan v50 Supervisor Controlled Event Registration | `codex/v50-supervisor-controlled-event-registration-runbook` | `26f8b7fb41eeaa78c3b17e2d50123bcb7b54ec4a` | `ea50f56f8fc51b08b938e3c601dbbafbf013f5d7` | 2026-06-12T05:08:45Z |
| #63 | Add v50 supervisor event eligibility projection | `codex/v50-supervisor-event-eligibility-projection` | `6dd4cff684e67c2e0602249fc52ea77d37d2fdf7` | `3b817e5035de064cd7af3e1d67433f176cab072f` | 2026-06-12T05:33:27Z |
| #64 | Add v50 Workbench supervisor event preview lane | `codex/v50-workbench-supervisor-dry-run-preview-lane` | `ff33529f4cc45f37639fea0e90a5620105463a12` | `07ed0fd23626674389a891c3a185c305e30f53bb` | 2026-06-12T06:29:40Z |
| #65 | Add v50 Workbench supervisor event confirm lane | `codex/v50-supervisor-event-confirm-append-lane` | `1c4ff03313d15f681cb01243a72fc5e22dc61d56` | `542501d9650213273017ff11ab20deadb494ab16` | 2026-06-12T07:29:33Z |
| #66 | Add v50 supervisor UX integration | `codex/v50-supervisor-ux-integration` | `f8d64f9fe1e68e7b6d7c913698fb52b7a97afdb2` | `4df2c8ecd0f2709f5d0e50737033436d65144191` | 2026-06-12T07:46:19Z |

## Acceptance Checks

| Condition | Evidence |
| --- | --- |
| `supervisorEventRegistrationEligibility.v1` is backend-owned, read-only, and does not expose raw transcript text. | `src/symphony/goal-supervisor/event-registration-eligibility.js` exports the contract and returns `readOnly: true`, `willMutate: false`; `tests/v50-supervisor-event-registration-eligibility.test.js` checks unsafe local paths, `.jsonl`, raw transcript text, stdout, prompts, and secrets are not serialized. |
| Eligibility uses supervisor contracts and explicit goal event state, not frontend heuristics. | `src/symphony/goal-supervisor/app-read-model.js` builds eligibility from `pendingResult`, `threadContinuationDecision`, task state, command boundary, and source contracts; it projects the result as `supervisorEventRegistrationEligibility`. |
| Preview returns `goal-update-plan.v1` and does not append during dry-run. | `src/symphony/goal-supervisor/event-registration-eligibility.js` builds a `GET /api/goals/<goal-id>/event-plan-preview` request; `tests/v23-goal-operation-console-api.test.js` asserts `eventSummary.writesInDryRun` is `false`, records source `workbench.event-plan-preview`, and leaves event files unchanged. |
| Confirm requires `planHash` and returns `goal-event-confirmation.v1`. | `src/symphony/console.js` requires `planHash` in `confirmGoalEventPlan`; `tests/v23-goal-operation-console-api.test.js` rejects confirm requests that omit `planHash` before appending. |
| Confirm appends only the controlled submitted plan. | `tests/v21-goal-plan-preview-api.test.js` checks a matching update plan appends one event and that mismatched hashes, unsupported commands, unknown fields, and unsafe goal refs do not append. |
| Worker/blocker events use `symphony goal update`. | `tests/v50-supervisor-event-registration-eligibility.test.js` marks `worker.evidence-recorded` and `blocker.opened` eligible with `commandName: symphony goal update`. |
| Reviewer verdicts stay behind `symphony goal review`. | `tests/v50-supervisor-event-registration-eligibility.test.js` blocks `reviewer.approved`, returns `command: review`, and does not produce a preview request. |
| Main verification and release gates stay behind `symphony goal gate`. | `tests/v50-supervisor-event-registration-eligibility.test.js` blocks `main.verification-passed` and `release.gate-passed`, returns `command: gate`, and keeps them out of allowed update events. |
| Workbench supervisor route does not read local session files, JSONL files, `.symphony`, provider folders, or raw transcripts. | `tests/workbench-shell.test.js` and `tests/workbench-route-smoke.test.js` reject `.symphony`, `jsonl`, `sessions/`, provider folders, raw transcripts, and local file links in the v46 supervisor route. |
| Workbench supervisor route does not dispatch children, launch providers, compact transcripts, create threads, open terminals, write git state, tag, publish, or create releases. | `src/symphony/goal-supervisor/event-registration-eligibility.js` sets the related boundary flags to `false`; `tests/workbench-shell.test.js` rejects `Run`, `Execute`, `Continue`, `Compact`, `New Thread`, `Dispatch`, and `Launch` as visible supervisor lane commands. |
| Supervisor UI uses only the allowed lane labels. | `frontend/workbench/src/v46SupervisorWorkbench.jsx` renders `Preview Event Plan`, `Confirm Event Append`, and `Refresh Supervisor State`; route smoke tests assert those strings and reject form, textarea, clipboard, browser open, child process, `exec`, and `spawn` controls. |

## Static Asset Evidence

PR #66 refreshed Workbench generated static output after Workbench source changes.

| Generated path | Change |
| --- | --- |
| `src/symphony/workbench-static/assets/index-BtxjPUBj.js` | Replaced by `src/symphony/workbench-static/assets/index-CTJ3Hdpv.js`. |
| `src/symphony/workbench-static/assets/index-dJIqcKoN.css` | Replaced by `src/symphony/workbench-static/assets/index-C476a_Zp.css`. |
| `src/symphony/workbench-static/index.html` | Updated to point at the refreshed generated asset filenames. |

PR-5 does not regenerate Workbench assets. It records acceptance evidence and release-prep notes only.

## Validation Results

| Command | Result |
| --- | --- |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 17 tests, 0 failures. |
| `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js` | Passed: 22 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | First run failed in the independent worktree because `vite` and `react` were not installed. After `pnpm install --frozen-lockfile`, rerun passed: 109 tests, 0 failures. |
| `pnpm install --frozen-lockfile` | Passed; lockfile was already up to date and workspace dependencies were installed locally. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed after final PR-5 docs update. |
| `git diff --cached --check` | Passed after staging the PR-5 docs. |

## Provider And Cost Record

Execution record requested for PR-5: Codex `gpt-5.5` with reasoning effort `xhigh`.

The local `git`, `gh`, `node`, and `pnpm` tool outputs did not return token usage or cost. No token or cost number is recorded.
