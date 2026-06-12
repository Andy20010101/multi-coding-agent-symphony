# v51 Result Intake Evidence Escrow closeout snapshot

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v51-result-intake-evidence-escrow`
PR-5 branch: `codex/v51-acceptance-closeout-v52-handoff`
Pre-closeout main commit: `d78edf3e5db97edaf6679f64a9b90378dd94d78c`

## Final state

v51 adds the safe entry layer for external worker results.

The shipped scope is:

- `resultIntakeRequest.v1`, `resultIntakePreview.v1`, `resultEvidenceEscrow.v1`, and `pendingResult.v1` contract helpers and fixtures;
- result intake preview and result escrow confirm API routes;
- confirm behavior that writes result evidence escrow and pending result only;
- supervisor read-model projection of `pendingResult.v1`;
- `supervisorEventRegistrationEligibility.v1` linkage from pending result into the v50 event preview path;
- Workbench result intake lane with `Paste worker result block`, `Preview Result Intake`, `Confirm Result Escrow`, and `Refresh Supervisor State`;
- generated Workbench static assets refreshed by PR #72 after Workbench source changes.

v51 does not ship provider execution, child dispatch, transcript compaction, new thread creation, generic shell or terminal UI, frontend local JSONL or session reads, raw transcript exposure, raw model output exposure, direct goal event append from result intake, reviewer verdict mutation, main verification gate mutation, release gate mutation, git/tag/release automation, or GitHub Release creation.

## Reconcile before PR-5 edits

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## codex/v51-acceptance-closeout-v52-handoff...origin/main`; no local file changes before PR-5 edits. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -12` | Top commit was `d78edf3`, `HEAD`, `origin/main`, `origin/HEAD`, and `main`; it merged PR #72. Earlier v51 merge commits were PR #71 at `e9750fe`, PR #70 at `3bdac82`, PR #69 at `1cb409a`, and PR #68 at `d0c0d83`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `git tag --list 'v51' 'v50'` | `v50`; no `v51` tag. |
| `gh release view v51 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; no v51 GitHub Release exists. |

Release work has not started in this PR. PR-5 does not tag, publish, create a GitHub Release, or automate release work.

## PR scope record

| Scope | GitHub PR | Branch | Head commit | Merge commit | Merged at | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #68 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/68` | `codex/v51-result-intake-evidence-escrow-runbook` | `db2c4efc8ab1e02a43494b4c124a45c43d854564` | `d0c0d831973e2a8151784ac478e6d426e9ab2c00` | 2026-06-12T08:36:53Z | Added `docs/plans/v51-result-intake-evidence-escrow-runbook-2026-06-12.md` and set v51 boundaries. |
| PR-1 contracts, fixtures, schema tests | #69 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/69` | `codex/v51-result-intake-contracts-fixtures-schema-tests` | `ded4ec6e666e954744983ac22797e38c445a6c0e` | `1cb409ac0aef50e661ec6e0d8c3c053ef9806a79` | 2026-06-12T09:11:03Z | Added result intake fixtures, contract helpers, and `tests/v51-result-intake-evidence-escrow.test.js`. |
| PR-2 preview and confirm API | #70 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/70` | `codex/v51-result-intake-preview-confirm-api` | `cda381afff40a710e8787676b963e38c72e2683e` | `3bdac82550a58f7a2acd7c1d06397f1fac4e9467` | 2026-06-12T10:57:15Z | Added result intake preview/confirm routes, result intake state storage, and `tests/v51-result-intake-preview-confirm-api.test.js`. |
| PR-3 pending result projection and eligibility | #71 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/71` | `codex/v51-pending-result-projection-eligibility` | `be69ab825c01e31569ba1a4e4cba723835039106` | `e9750fe5a0364666868dbf33b63ddb71ef05c2ce` | 2026-06-12T12:06:47Z | Added pending result projection, eligibility integration, source-contract redaction, and `tests/v51-pending-result-projection-eligibility.test.js`. |
| PR-4 Workbench result intake lane | #72 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/72` | `codex/v51-workbench-result-intake-lane` | `8480adb679b74691d5aeaf787c8a2d26db71eb00` | `d78edf3e5db97edaf6679f64a9b90378dd94d78c` | 2026-06-12T12:37:29Z | Added Workbench result intake controls, refreshed generated assets, and updated Workbench tests. |

## Generated Workbench assets

PR #72 refreshed generated Workbench output after Workbench source changes.

| Asset change | Evidence |
| --- | --- |
| `src/symphony/workbench-static/assets/index-C476a_Zp.css` was replaced by `src/symphony/workbench-static/assets/index-9cXHz3CJ.css`. | `git show --name-status 8480adb679b74691d5aeaf787c8a2d26db71eb00 --` records the generated CSS rename. |
| `src/symphony/workbench-static/assets/index-CTJ3Hdpv.js` was replaced by `src/symphony/workbench-static/assets/index-wYUoDpH-.js`. | The same command records the generated JS rename. |
| `src/symphony/workbench-static/index.html` changed to reference the refreshed generated assets. | The same command records the static index update. |

PR-5 ran `pnpm workbench:build` for validation. It does not include generated asset changes.

## PR-5 files

| File | Purpose |
| --- | --- |
| `docs/qa/v51-result-intake-evidence-escrow-acceptance.md` | Records the 10-step v51 acceptance path with PR, commit, and test evidence. |
| `docs/plans/v51-result-intake-evidence-escrow-closeout-snapshot-2026-06-12.md` | Records final state, boundaries, merged PRs, validation, residual risks, and release state. |
| `docs/plans/v52-system-golden-path-closeout-runbook-2026-06-12.md` | Starts v52 as system golden path and daily acceptance, not provider execution. |
| `docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` | Adds the user-provided v52-v60 planning archive to `docs/plans/`. |

## Validation evidence

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed. `node_modules` was missing in this worktree; the lockfile was already up to date and no lockfile change was made. |
| `pnpm workbench:build` | Passed. Vite built the current Workbench static output. |
| `node --test tests/v51-result-intake-evidence-escrow.test.js` | Passed: 10 tests, 0 failures. |
| `node --test tests/v51-result-intake-preview-confirm-api.test.js tests/v51-pending-result-projection-eligibility.test.js` | Passed: 15 tests, 0 failures. |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 17 tests, 0 failures. |
| `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js` | Passed: 22 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 112 tests, 0 failures. The run printed a non-failing Vite WebSocket port warning for port `24678`. |
| `pnpm check` | Passed. |
| `unzip -t docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` | Passed. `unzip` reported no compressed data errors. |
| `shasum -a 256 docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` | `a325f88498d55b9f46adcf68b5c51ca3ae28d5a74f6c5ed2c3a1d276b0c09d7a` |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after staging the four PR-5 files. |

## Zip evidence

The archive was copied from `/Users/andy/Downloads/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` into `docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip`.

`unzip -t` validated these entries:

- `README_HOW_TO_USE_THESE_RUNBOOKS.md`
- `mcas-v52-v60-master-plan-2026-06-12.md`
- `runbooks/v52-system-golden-path-closeout-runbook-2026-06-12.md`
- `runbooks/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md`
- `runbooks/v54-codex-provider-execution-pilot-runbook-2026-06-12.md`
- `runbooks/v55-claude-code-provider-parity-result-return-runbook-2026-06-12.md`
- `runbooks/v56-thread-continuation-handoff-pack-runbook-2026-06-12.md`
- `runbooks/v57-review-gate-workbench-surface-runbook-2026-06-12.md`
- `runbooks/v58-local-mac-app-bundle-packaging-evidence-runbook-2026-06-12.md`
- `runbooks/v59-dual-provider-multi-agent-e2e-runbook-2026-06-12.md`
- `runbooks/v60-stable-personal-workbench-release-runbook-2026-06-12.md`

## Residual risks

Result shape changes can break projection or eligibility if new fields are added without updating sanitization, contract validation, and Workbench projection together.

Evidence ref validation is intentionally strict. New controlled evidence ref kinds can be rejected until the allowlist and tests are updated.

`pendingResult.v1` is not a task verdict. Operators still need the v50 event preview and `planHash` confirm path before a worker or blocker event is appended.

Reviewer verdicts, main verification gates, and release gates remain outside result intake. They still require their existing review and gate flows.

Future Workbench changes under `frontend/workbench/src/` need `pnpm workbench:build` and a generated asset review tied to the source change.

v51 release work is still pending. No v51 tag or GitHub Release exists at PR-5 closeout time.

## Rollback path

If PR #69 contract validation accepts unsafe raw transcript or uncontrolled evidence refs, revert `1cb409ac0aef50e661ec6e0d8c3c053ef9806a79` and rebuild the contract fixtures before continuing.

If PR #70 preview or confirm writes the wrong state, revert `3bdac82550a58f7a2acd7c1d06397f1fac4e9467`. Keep v51 result intake unavailable until confirm writes only escrow and pending result.

If PR #71 projection leaks unsafe source contracts or makes pending result append directly, revert `e9750fe5a0364666868dbf33b63ddb71ef05c2ce`.

If PR #72 Workbench UI makes result intake look like provider execution, child dispatch, event append, or release work, revert `d78edf3e5db97edaf6679f64a9b90378dd94d78c` and rerun `pnpm workbench:build` only from the intended source state.

If PR-5 text or the planning archive is wrong, revert the PR-5 documentation commit and replace these artifacts before starting release work.

## v52 handoff

v52 should be `v52-system-golden-path-closeout`.

The handoff target is the daily system path:

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

v52 should prove that the operator can see readiness, blocked reasons, source contracts, and the next safe action across this path.

v52 should not add provider execution. Provider execution should wait until the system golden path can show v51 result intake and v50 event registration together with acceptance evidence.

## Execution record

PR-5 execution record supplied by the operator: Codex `gpt-5.5` with reasoning effort `xhigh`.

Local `git`, `gh`, `node`, `pnpm`, `unzip`, and `shasum` outputs did not include token usage or cost.
