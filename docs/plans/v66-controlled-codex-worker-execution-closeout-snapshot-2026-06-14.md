# v66 Controlled Codex Worker Execution closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v66-controlled-codex-worker-execution`
PR-4 branch: `codex/v66-closeout-v67-handoff`
Pre-closeout main commit: `01f4f8ed52109e9a9aba41a2063f2919a0054f27`

## Shipped State

v66 ships a backend-owned Codex worker execution lane:

```text
active goal/task
-> worker run preview
-> planHash confirm
-> fixed codex-cli worker template
-> fake adapter by default
-> sanitized worker result
-> needs-review state
```

The shipped scope is:

- v66 runbook copied from the v61-v72 runbook package;
- `workerRunPreview.v1` and `workerRunResult.v1` contracts, fixtures, validator, and focused tests;
- backend worker preview/confirm route with a fake adapter default path;
- confirm binding to `planHash`, active goal/task, fixed provider `codex-cli`, fixed command template, timeout, and workspace policy;
- sanitized result fields for changed files, artifact refs, verifier summary, and failure layer;
- Workbench Worker Run lane with fixed preview/confirm binding and no generic command input;
- rebuilt Workbench static assets;
- v66 acceptance record, closeout snapshot, and v67 handoff runbook.

v66 does not ship generic shell or terminal UI, renderer arbitrary command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, raw provider stdout/stderr exposure, unsupported provider claims, generic provider picker, raw provider CLI launcher, direct goal event append, direct task completion, provider-output review approval, main verification pass, release readiness, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## Reconcile Before PR-4 Edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main` | `01f4f8ed52109e9a9aba41a2063f2919a0054f27`. |
| `gh pr list --repo Andy20010101/multi-coding-agent-symphony --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git tag --list 'v65' 'v66'` | `v65`; no `v66` tag. |
| `gh release view v65 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v65 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v65`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T20:27:30Z`; targetCommitish `main`. |
| `gh release view v66 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v66 publication. |

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #146 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/146` | `codex/v66-runbook` | `619661ff3824ad648d259ff674f77d6b0792cd68` | 2026-06-14T20:49:12Z | Added v66 runbook and v65 start evidence. |
| PR-1 worker preview/result contracts | #147 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/147` | `codex/v66-worker-run-contracts` | `76cceb8751db5fa75781475f819567203e1ead50` | 2026-06-14T20:56:19Z | Added worker run contracts, fixtures, and focused tests. |
| PR-2 backend preview/confirm fake adapter | #148 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/148` | `codex/v66-worker-run-backend` | `1eb19ae98a2817f136bf1f9fbdae5dad7bfd2eff` | 2026-06-14T21:04:48Z | Added backend preview/confirm routes, fake adapter, route tests, and `planHash` binding that excludes generation time. |
| PR-3 Workbench worker execution lane | #149 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/149` | `codex/v66-worker-run-workbench` | `01f4f8ed52109e9a9aba41a2063f2919a0054f27` | 2026-06-14T21:46:57Z | Added Workbench Worker Run panel, client/projection binding, source tests, and rebuilt static assets. |
| PR-4 acceptance, closeout, and v67 handoff | This PR | `codex/v66-closeout-v67-handoff` | Pending until merge | Pending until merge | Adds v66 acceptance, closeout snapshot, and v67 runbook. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v66-controlled-codex-worker-execution-acceptance.md` | Acceptance record for contracts, backend route, Workbench lane, validation, residual risk, and rollback. |
| `docs/plans/v66-controlled-codex-worker-execution-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v67 handoff. |
| `docs/plans/v67-claude-code-reviewer-lane-runbook-2026-06-14.md` | Next-version handoff for controlled Claude Code reviewer execution. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output is `index-BX8171d6.css` and `index-Bv6BpPX4.js`. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed on PR-4 branch: 10 tests, 10 passed. |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js` | Passed on PR-4 branch: 8 tests, 8 passed. |
| `node --test tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` | Passed on PR-4 branch: 31 tests, 31 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 126 tests, 126 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed on PR-4 branch: 1398 tests, 1398 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after PR-4 staging. |

## Fake Adapter and Real Codex Smoke

The default v66 execution evidence is fake-adapter based:

- `confirmWorkerRunPreview` returns a `workerRunConfirmation.v1` object from a bounded preview;
- `result.sanitized-success.v1.json` records `status: needs-review`;
- `nextState.taskCompleted`, `nextState.reviewApproved`, `nextState.mainVerified`, and `nextState.releaseReady` remain `false`;
- `realCodexOptIn` remains `false` in default fixtures.

No real Codex worker smoke was run for v66. This is intentional for the release boundary. v66 proves the backend-owned preview/confirm shape and sanitized result contract without exposing raw provider output or local session paths.

## Rollback Path

Rollback is PR-scoped:

- revert PR #149 if Workbench adds a shell, terminal, prompt launcher, raw output, local provider link, direct task-complete control, reviewer approval, main-verification pass, or release-ready control;
- revert PR #148 if backend confirm accepts stale `planHash`, arbitrary provider id, freeform command text, raw output, main-worktree write, direct event append, direct task completion, or review approval;
- revert PR #147 if `workerRunPreview.v1` or `workerRunResult.v1` accepts unsupported providers, stale hashes, local session paths, raw provider output, secret-bearing fields, or main-write paths;
- keep v65 Provider Readiness as the fallback state.

## Tag and Release State Before v66 Publication

| Check | Result |
| --- | --- |
| `v65` tag and release | Existing and verified. |
| `v66` tag | Absent before PR-4 merge. |
| `v66` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v66` tag and GitHub Release are still absent.
3. Run the closeout validation suite from this snapshot or record any external blocker.
4. Create an annotated `v66` tag on the post-PR-4 `origin/main` commit.
5. Push the `v66` tag.
6. Create the GitHub Release for `v66`.
7. Verify `v66^{}` dereferences to the post-PR-4 `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v66: Controlled Codex Worker Execution

- Adds workerRunPreview.v1 and workerRunResult.v1 for backend-owned Codex worker execution.
- Adds controlled worker preview/confirm routes with fixed codex-cli provider, fixed command template, planHash binding, timeout, and workspace policy.
- Uses fake adapter evidence by default; real Codex smoke remains explicit opt-in.
- Adds Workbench Worker Run lane with sanitized worker evidence, failure layer, and needs-review state.
- Keeps worker success separate from task completion, reviewer approval, main verification, adoption, and release readiness.
- Does not add a generic shell, terminal, arbitrary command launcher, raw provider output, local session reads, main worktree writes, product-level git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v66 does not prove real Codex CLI execution. It records the default no-real-smoke state and keeps real provider output outside the release payload.

v66 does not perform review. The worker output is intentionally `needs-review`. v67 owns the Claude Code reviewer lane and must keep reviewer evidence independent from Codex worker evidence.

The v66 Workbench lane was verified through source tests, API/client tests, route smoke, SSR rendering tests, built static assets, full test suite, and GitHub CI for PR #146 through PR #149. No interactive browser screenshot is recorded in this closeout.

## v67 Handoff

v67 should be `v67-claude-code-reviewer-lane`.

The handoff target is:

```text
Codex worker evidence
-> reviewer handoff pack
-> Claude Code review preview
-> planHash confirm
-> sanitized reviewer evidence
-> approved / needs-revision / blocked
-> v67 closeout and v68 handoff
```

v67 may add controlled Claude Code reviewer preview/confirm contracts, fake adapter tests, sanitized reviewer evidence refs, and Workbench reviewer status. It must not add a generic terminal, arbitrary prompt launcher, raw worker transcript reader, raw model output display, provider session reader, main-worktree mutation, automatic self-review, main verification pass, release readiness, product-level git write, or release automation.
