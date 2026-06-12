# v51 Result Intake Evidence Escrow Runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id: `v51-result-intake-evidence-escrow`
Branch draft: `codex/v51-result-intake-evidence-escrow-runbook`
Baseline checked for planning: `main`, `origin/main`, and `v50` at `21e739b29ea4c3d9b1f25d7377b834d94df28c34`
GitHub Release: `v50: Supervisor Controlled Event Registration`

## Reconcile

| Check | Result |
| --- | --- |
| `git status --short --branch` | Main checkout was clean at `main...origin/main`; the v51 PR-0 worktree was created from `origin/main` and then put on `codex/v51-result-intake-evidence-escrow-runbook`. |
| `git fetch origin main --tags --prune` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -8 origin/main` | `21e739b` was `HEAD`, `tag: v50`, `origin/main`, `origin/HEAD`, and `main`; it merged PR #67. The next commits were `3d37b09`, `4df2c8e`, `f8d64f9`, `542501d`, `1c4ff03`, `07ed0fd`, and `ff33529`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `git tag --list 'v50' 'v51'` | `v50`; no `v51` tag at planning time. |
| `gh release view v50 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Release `v50: Supervisor Controlled Event Registration`, URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v50`, not draft, not prerelease, published at `2026-06-12T08:08:30Z`, assets `[]`, targetCommitish `main`. |

Files checked before writing this runbook:

- `/Users/andy/.codex/skills/report-writing-no-slop/SKILL.md`
- `docs/plans/v50-supervisor-controlled-event-registration-runbook-2026-06-12.md`
- `docs/plans/v50-supervisor-controlled-event-registration-acceptance-evidence-2026-06-12.md`
- `docs/plans/v50-supervisor-controlled-event-registration-closeout-snapshot-2026-06-12.md`
- `docs/plans/v50-supervisor-controlled-event-registration-release-prep-2026-06-12.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-update.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/v46SupervisorWorkbench.jsx`
- `tests/v50-supervisor-event-registration-eligibility.test.js`
- `tests/v44-goal-supervisor-app-read-model.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/v23-goal-operation-console-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

No repository `AGENTS.md` file was present in the checked worktrees at planning time. The thread-provided AGENTS report-writing instructions apply to this document.

## Objective

v51 adds the safe entry layer for external worker results. A result from an external worker, Codex, Claude, Kiro, or a manual execution block must first enter result intake, receive a sanitized summary and controlled evidence refs, and then be stored as pending result escrow.

Goal event registration remains owned by the v50 path:

```text
external worker result or manual result block
-> result intake preview
-> sanitize and normalize
-> controlled evidence refs
-> result evidence escrow
-> pendingResult.v1
-> supervisorEventRegistrationEligibility.v1
-> v50 event preview
-> v50 planHash confirm
-> append goal event
```

v51 must not turn result intake into a provider runner or child dispatcher. It only answers one question: can a worker result safely enter the system as pending result evidence before the existing event preview and confirm flow decides whether to append a goal event?

## Existing Baseline

v50 has shipped the first controlled supervisor event registration path:

- `supervisorEventRegistrationEligibility.v1` projects whether a supervisor recommendation can become an event registration preview.
- `GET /api/goals/<goal-id>/event-plan-preview` returns the dry-run `goal-update-plan.v1`.
- `POST /api/goals/<goal-id>/event-plan-confirm` requires the preview `planHash` and appends through the existing append-only goal event command path.
- Workbench supervisor UI exposes the controlled event lane with `Preview Event Plan`, `Confirm Event Append`, and `Refresh Supervisor State`.

The remaining gap is result entry. A future worker or child dispatch path will produce a result, but v50 does not define how that result becomes safe system input. Without a result escrow layer, a future implementation could accidentally route raw child output straight into goal events, evidence summaries, or supervisor state.

v51 closes that gap before any provider execution or child dispatch work starts.

## Boundary Decision

v51 may accept a bounded result block for preview and escrow. It may not execute the work that produced that result.

Allowed state transition for v51:

- preview a submitted result block without writing goal state;
- sanitize and normalize the result into a bounded summary;
- reject unsafe raw transcript or uncontrolled evidence references;
- return a stable `planHash` for result escrow confirm;
- confirm only with the matching preview `planHash`;
- write only result evidence escrow and pending result state;
- project the pending result into the supervisor read model;
- let `supervisorEventRegistrationEligibility.v1` read the pending result and decide whether v50 event preview is available.

Forbidden state transition for v51:

- append a goal event directly from result intake;
- mark a worker task complete from frontend state;
- record reviewer approval, main verification, or release readiness;
- infer event eligibility from file names, branch names, local session files, or raw model transcript text.

## Allowed Scope

Implementation PRs may:

- Add `resultIntakeRequest.v1`, `resultIntakePreview.v1`, `resultEvidenceEscrow.v1`, and `pendingResult.v1` contracts.
- Add fixtures for safe worker evidence, blocker evidence, missing evidence refs, unsafe transcript content, hash mismatch, stale preview, and unsupported event families.
- Add CLI or backend preview support for result intake.
- Add CLI or backend confirm support for result escrow.
- Store confirmed result escrow as pending result state without writing the goal event journal.
- Project pending result state into `goal-supervisor-app-read-model.v1`.
- Extend `supervisorEventRegistrationEligibility.v1` so worker and blocker events can become eligible from pending result state.
- Add a Workbench result intake lane with only `Preview Result Intake`, `Confirm Result Escrow`, and `Refresh Supervisor State`.
- Add focused tests for preview no-write behavior, confirm `planHash`, pending result projection, v50 linkage, and boundary blocks.
- Refresh generated Workbench assets only in the PR that changes Workbench source.

## Forbidden Scope

v51 must not add:

- provider execution;
- child dispatch;
- transcript compaction;
- new thread creation;
- generic shell or terminal UI;
- browser terminal controls;
- model invocation;
- daemon start or stop;
- frontend reads of local JSONL files, session files, provider transcript folders, `.symphony` internals, goal ledger files, or event log files;
- raw transcript exposure in Workbench;
- raw model output exposure in Workbench;
- direct goal event append from result intake;
- reviewer verdict mutation from result intake;
- main verification gate mutation from result intake;
- release gate mutation from result intake;
- git write, merge, tag, push, publish, GitHub Release creation, or release automation;
- controls labeled `Run Agent`, `Execute`, `Launch Provider`, `Dispatch Child`, `Compact Now`, `New Thread`, `Push`, `Tag`, `Publish`, or `Release`.

Allowed Workbench control labels for the new result intake lane:

- `Preview Result Intake`
- `Confirm Result Escrow`
- `Refresh Supervisor State`

If a paste input is added, the visible label should be:

- `Paste worker result block`

The lane must make these boundaries visible near the paste area or preview result:

- This does not run a provider.
- This does not dispatch a child.
- This does not append a goal event.
- This only creates pending result escrow after confirm.

## Contract Direction

### `resultIntakeRequest.v1`

Purpose: carry a bounded result block into the preview path.

Required fields:

- `contractName`: `resultIntakeRequest.v1`
- `contractVersion`
- `goalId`
- `taskId`
- `workerRole`
- `source`
- `submittedAt`
- `resultBlock`
- `evidenceRefs[]`
- `requestedEvent`
- `boundaries`

`source` should distinguish `manual-paste`, `external-worker`, and provider-named results such as `codex`, `claude`, or `kiro`. Provider names describe where a pasted result came from; they do not authorize provider execution.

`resultBlock` must be treated as untrusted input. It may be parsed for bounded status, changed files, evidence refs, blocker reason, and summary text, but raw transcript text must not be projected to Workbench.

### `resultIntakePreview.v1`

Purpose: show exactly what result escrow confirm would store, without writing state.

Required fields:

- `contractName`: `resultIntakePreview.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `willMutate`: `false`
- `goalId`
- `taskId`
- `workerRole`
- `source`
- `sanitizedSummary`
- `evidenceRefs[]`
- `blockedFields[]`
- `eventCandidate`
- `previewWriteTarget`
- `planHash`
- `expiresAt`
- `confirmRequestShape`
- `boundaries`

`sanitizedSummary` should use bounded fields such as status, changed files, validation commands, evidence refs, blocker reason, and a short statement. It must not include raw transcript, provider session logs, local JSONL paths, or unbounded model output.

`eventCandidate` may describe a worker or blocker event candidate. Reviewer verdicts, main verification, and release gate events must return blocked or not applicable with the expected command family.

### `resultEvidenceEscrow.v1`

Purpose: persist a confirmed sanitized result before goal event registration.

Required fields:

- `contractName`: `resultEvidenceEscrow.v1`
- `contractVersion`
- `createdAt`
- `goalId`
- `taskId`
- `workerRole`
- `source`
- `sanitizedSummary`
- `evidenceRefs[]`
- `eventCandidate`
- `previewPlanHash`
- `escrowId`
- `escrowRef`
- `writeStatus`
- `boundaries`

Confirm must reject missing, mismatched, expired, or stale `planHash` values before writing escrow. A successful confirm writes escrow only. It must not append `goal-event-log.v1`.

### `pendingResult.v1`

Purpose: expose confirmed result escrow to supervisor projections.

Required fields:

- `contractName`: `pendingResult.v1`
- `contractVersion`
- `goalId`
- `taskId`
- `workerRole`
- `source`
- `escrowRef`
- `sanitizedSummary`
- `evidenceRefs[]`
- `eventCandidate`
- `state`: `available`, `blocked`, `consumed`, or `superseded`
- `blockedReasons[]`
- `createdAt`
- `sourceContracts[]`
- `boundaries`

`pendingResult.v1` is not a task verdict. It is input for supervisor eligibility and the v50 event preview path.

## Preview And Confirm Paths

PR-2 should add one of these API shapes:

- `POST /api/goals/<goal-id>/result-intake-preview`
- `POST /api/goals/<goal-id>/result-intake-confirm`

CLI support may be introduced first if it keeps the same contract semantics:

```sh
symphony result preview --goal <goal-id> --task <task-id> --role worker --stdin
symphony result confirm --goal <goal-id> --plan-hash <hash>
```

Required behavior:

- preview validates and sanitizes input;
- preview returns `resultIntakePreview.v1`;
- preview does not write result escrow, pending result, operation registry, goal event journal, reviewer state, gate state, git state, or release state;
- confirm accepts only the same input shape plus the preview `planHash`;
- confirm writes `resultEvidenceEscrow.v1` and projects `pendingResult.v1`;
- confirm does not append goal events;
- confirm returns enough refs for the supervisor read model to refresh.

The v50 event route remains the only controlled route that may append worker or blocker goal events from Workbench.

## Supervisor Integration

PR-3 should connect confirmed pending results to the existing supervisor read model:

- `goal-supervisor-app-read-model.v1` includes pending result summary, escrow ref, evidence refs, and state.
- `supervisorEventRegistrationEligibility.v1` reads `pendingResult.v1` and produces an eligible worker or blocker event only when evidence refs and event family are allowed.
- Eligibility must preserve v50 routing boundaries: worker and blocker events may use `symphony goal update`; reviewer verdicts use `symphony goal review`; main verification and release gates use `symphony goal gate`.
- Raw result blocks must not appear in the supervisor route response.

After PR-3, the expected path is:

```text
confirmed pendingResult.v1
-> supervisorEventRegistrationEligibility.v1 eligible
-> Preview Event Plan
-> Confirm Event Append
-> Refresh Supervisor State
```

## Workbench Lane

PR-4 should add a controlled result intake lane to `/workbench/supervisor/` or the current supervisor entry inside `/workbench/desktop/`.

The lane should show:

- current goal and task;
- source kind;
- bounded paste input;
- sanitized preview result;
- blocked fields and blocked reasons;
- controlled evidence refs;
- pending result escrow ref after confirm;
- refresh status after confirm.

The lane must not show:

- provider launch controls;
- child dispatch controls;
- terminal controls;
- local file selectors;
- local JSONL/session paths;
- raw transcript text;
- buttons or commands for git, tag, publish, or release.

## PR Breakdown

### PR-0: Runbook

File:

- `docs/plans/v51-result-intake-evidence-escrow-runbook-2026-06-12.md`

Scope:

- document v51 goal, boundaries, contract direction, PR sequence, validation commands, and v52 handoff;
- no runtime, frontend, tests, generated assets, tag, release, merge, or provider work.

Validation:

- `git diff --check`
- `git diff --cached --check`

### PR-1: Contracts, Fixtures, Schema Tests

Scope:

- add `resultIntakeRequest.v1`, `resultIntakePreview.v1`, `resultEvidenceEscrow.v1`, and `pendingResult.v1` contract helpers or schemas;
- add fixtures for safe worker result, blocker result, missing evidence refs, unsafe transcript, unsupported event family, stale preview, and hash mismatch;
- add schema tests and serialization tests that prove raw transcript fields are rejected or removed.

Expected test:

- `node --test tests/v51-result-intake-evidence-escrow.test.js`

### PR-2: Backend Or CLI Preview And Confirm

Scope:

- add result intake preview path;
- add result escrow confirm path;
- calculate `planHash` from stable preview inputs;
- reject missing or mismatched `planHash`;
- write only result evidence escrow and pending result on confirm;
- prove preview does not write goal event state.

Required checks:

- preview no-write;
- confirm `planHash` required;
- confirm writes escrow only;
- unsupported event families blocked;
- reviewer, main verification, and release gate mutation blocked.

### PR-3: Pending Result Projection And Eligibility

Scope:

- project `pendingResult.v1` into the supervisor app read model;
- extend `supervisorEventRegistrationEligibility.v1` to consume pending result state;
- keep v50 event preview and confirm as the only Workbench path that appends worker or blocker events.

Required checks:

- pending result appears in supervisor read model;
- eligibility sees safe worker and blocker pending results;
- unsafe, missing, or unsupported pending results remain blocked;
- reviewer verdicts, main verification gates, and release gates stay on their existing command families.

### PR-4: Workbench Controlled Result Intake Lane

Scope:

- add Workbench result intake lane;
- wire `Preview Result Intake`, `Confirm Result Escrow`, and `Refresh Supervisor State`;
- show sanitized preview and escrow refs;
- refresh supervisor state after confirm;
- refresh generated Workbench assets after source changes.

Required checks:

- Workbench never reads local JSONL/session files;
- Workbench does not expose raw transcript;
- Workbench does not append goal events from result intake;
- disallowed labels and execution controls are absent.

### PR-5: Acceptance, Closeout, And v52 Handoff

Files:

- `docs/qa/v51-result-intake-evidence-escrow-acceptance.md`
- `docs/plans/v51-result-intake-evidence-escrow-closeout-snapshot-2026-06-12.md`
- `docs/plans/v52-system-golden-path-closeout-runbook-2026-06-12.md`

Scope:

- record acceptance evidence across the full v51 path;
- capture residual risks around result shape changes and evidence ref validation;
- hand v52 to system golden path and daily acceptance;
- do not hand v52 directly to provider execution.

## Acceptance Path

Acceptance must verify this exact flow:

1. Prepare a fake worker result block.
2. Run result intake preview.
3. Confirm preview does not write `goal-event-log.v1`.
4. Confirm result escrow with the preview `planHash`.
5. Verify `pendingResult.v1` appears in the supervisor read model.
6. Verify `supervisorEventRegistrationEligibility.v1` can read the pending result.
7. Verify v50 event preview can generate `goal-update-plan.v1` from the pending result.
8. Verify v50 event confirm still requires `planHash`.
9. Verify reviewer verdicts, main verification gates, and release gates are not opened by v51.
10. Verify there is no provider execution, child dispatch, terminal UI, frontend local session read, transcript compaction, new thread creation, git write, tag, publish, or GitHub Release automation.

## Validation Commands

Run these for v51 implementation PRs:

```sh
pnpm workbench:build
node --test tests/v51-result-intake-evidence-escrow.test.js
node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js
node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

If an implementation PR changes shared contract helpers, console routes, `ArtifactStore`, or the goal event command path, also run:

```sh
pnpm test
```

PR-0 is docs-only. Its required validation is:

```sh
git diff --check
git diff --cached --check
```

## v52 Handoff

v52 should be `v52-system-golden-path-closeout`.

It should validate the daily path from project selection through result intake and event registration:

```text
Project Launcher
-> App Home
-> Supervisor
-> Context Advisory
-> Result Intake
-> Event Preview / Confirm
-> Review / Gate
-> Closeout
```

v52 should not add provider execution. Provider execution should wait until result intake, pending result projection, supervisor eligibility, and the Workbench daily path have acceptance evidence.

Recommended later order:

- v52: system golden path and daily acceptance;
- v53: controlled child dispatch preview;
- v54: provider execution pilot.
