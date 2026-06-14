# v67 Claude Code Reviewer Lane closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v67-claude-code-reviewer-lane`
PR-4 branch: `codex/v67-closeout`
Pre-closeout main commit: `444fbce7109aa393093c4df3bea5639ec2868f96`

## Shipped State

v67 ships a backend-owned Claude Code reviewer lane:

```text
sanitized Codex worker evidence
-> reviewerRunHandoff.v1
-> planHash confirm
-> fixed claude-code-cli reviewer template
-> fake adapter by default
-> reviewerRunVerdict.v1
-> approved / needs-revision / blocked evidence
```

The shipped scope is:

- v67 runbook start evidence on top of the verified v66 tag and GitHub Release;
- `reviewerRunHandoff.v1` and `reviewerRunVerdict.v1` contracts, fixtures, validators, and focused tests;
- backend reviewer preview/confirm route with a fake adapter default path;
- confirm binding to `planHash`, active goal/task, fixed provider `claude-code-cli`, fixed role `reviewer`, fixed command template, sanitized handoff pack ref, and reviewer actor id;
- structured reviewer verdict fields for approved, needs-revision, blocked, findings, validation commands, risks, blockers, and artifact refs;
- Workbench Reviewer Run lane with worker evidence refs, review policy, verdict state, next safe action, and boundary flags;
- rebuilt Workbench static assets;
- v67 acceptance record, closeout snapshot, and v68 adoption/main-verification handoff runbook.

v67 does not ship generic shell or terminal UI, renderer arbitrary command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw worker transcript exposure, raw model output exposure, raw provider stdout/stderr exposure, unsupported provider claims, generic provider picker, raw provider CLI launcher, direct goal event append, direct task completion, reviewer-output adoption approval, main verification pass, release readiness, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## Reconcile Before PR-4 Edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main` | `444fbce7109aa393093c4df3bea5639ec2868f96`. |
| `gh pr list --repo Andy20010101/multi-coding-agent-symphony --state open --json number,title,headRefName,baseRefName,url,isDraft` | PR-4 had not been opened yet during branch creation. |
| `git tag --list 'v66' 'v67'` | `v66`; no `v67` tag before closeout. |
| `v66^{}` | `44d00803921b61820a45ae42026f7e7684dc740a`, verified before v67 implementation. |
| `gh release view v66 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v66 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v66`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T22:00:26Z`; targetCommitish `main`. |
| `gh release view v67 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | `release not found`; expected before PR-4 merge and v67 publication. |

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #151 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/151` | `codex/v67-runbook` | `af296738539223d533c9c01cdcef5919ecfa40ba` | 2026-06-14T22:15:23Z | Added v67 startup evidence to the repository runbook. |
| PR-1 reviewer handoff and verdict contracts | #152 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/152` | `codex/v67-reviewer-contracts` | `81b86f1cc3ff796ad6c609c084d6c128b924f50a` | 2026-06-14T22:23:08Z | Added reviewer contracts, fixtures, and focused tests. |
| PR-2 backend preview/confirm fake adapter | #153 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/153` | `codex/v67-reviewer-backend` | `7336a5c24fc35cea8ac67c7d6faf98db0879c520` | 2026-06-14T22:28:47Z | Added backend reviewer preview/confirm routes, fake adapter, operation record, and route tests. |
| PR-3 Workbench reviewer lane | #154 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/154` | `codex/v67-reviewer-workbench` | `444fbce7109aa393093c4df3bea5639ec2868f96` | 2026-06-14T22:40:51Z | Added Workbench Reviewer Run panel, client/projection binding, source tests, browser smoke, and rebuilt static assets. |
| PR-4 acceptance, closeout, and v68 handoff | This PR | `codex/v67-closeout` | Pending until merge | Pending until merge | Adds v67 acceptance, closeout snapshot, and v68 runbook. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v67-claude-code-reviewer-lane-acceptance.md` | Acceptance record for reviewer contracts, backend route, Workbench lane, validation, residual risk, and rollback. |
| `docs/plans/v67-claude-code-reviewer-lane-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v68 handoff. |
| `docs/plans/v68-adoption-main-verification-loop-runbook-2026-06-14.md` | Next-version handoff for adoption and main verification loop. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output is `index-BX8171d6.css` and `index-CK3z9Jhh.js`. |
| `node --test tests/v67-claude-code-reviewer-lane.test.js` | Passed on PR-4 branch as part of the focused v65/v66/v67 suite: 29 tests, 29 passed. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed on PR-4 branch as part of the focused v65/v66/v67 suite: 29 tests, 29 passed. |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js` | Passed on PR-4 branch as part of the focused v65/v66/v67 suite: 29 tests, 29 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 129 tests, 129 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed on PR-4 branch: 1412 tests, 1412 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed after PR-4 staging. |

## Fake Adapter and Real Claude Code Smoke

The default v67 execution evidence is fake-adapter based:

- `buildReviewerRunHandoff` returns a bounded `reviewerRunHandoff.v1` object from sanitized Codex worker evidence;
- backend confirm returns `reviewerRunConfirmation.v1` and stores a deterministic `reviewerRunVerdict.v1` operation result;
- approved verdicts can set `reviewApproved: true`, but keep `taskCompleted`, `adoptionReady`, `mainVerified`, and `releaseReady` false;
- `realClaudeSmokeOptIn` remains false in default fixtures and fake adapter results.

No real Claude Code reviewer smoke was run for v67. This is intentional for the release boundary. v67 proves the backend-owned preview/confirm shape and structured verdict contract without exposing raw provider output or local session paths.

## Rollback Path

Rollback is PR-scoped:

- revert PR #154 if Workbench adds a shell, terminal, prompt launcher, raw output, local provider link, direct task-complete control, adoption approval, main-verification pass, release-ready control, product-level git write, or GitHub Release automation;
- revert PR #153 if backend confirm accepts stale `planHash`, arbitrary provider id, freeform command text, raw output, main-worktree write, direct event append, direct task completion, adoption approval, main verification pass, or release readiness;
- revert PR #152 if `reviewerRunHandoff.v1` or `reviewerRunVerdict.v1` accepts raw worker transcripts, raw provider output, session paths, self-review, unsupported provider ids, stale hashes, secret-bearing fields, adoption approval, main verification pass, or release readiness;
- keep v66 Controlled Codex Worker Execution as the fallback state.

## Tag and Release State Before v67 Publication

| Check | Result |
| --- | --- |
| `v66` tag and release | Existing and verified before v67 implementation. |
| `v67` tag | Absent before PR-4 merge. |
| `v67` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before v67 start; PR-4 is the only expected open PR while this snapshot is under review. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v67` tag and GitHub Release are still absent.
3. Run or confirm the closeout validation suite from this snapshot.
4. Create an annotated `v67` tag on the post-PR-4 `origin/main` commit.
5. Push the `v67` tag.
6. Create the GitHub Release for `v67`.
7. Verify `v67^{}` dereferences to the post-PR-4 `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v67: Claude Code Reviewer Lane

- Adds reviewerRunHandoff.v1 and reviewerRunVerdict.v1 for backend-owned Claude Code reviewer execution.
- Adds controlled reviewer preview/confirm routes with fixed claude-code-cli provider, reviewer role, fixed command template, planHash binding, sanitized handoff pack ref, and reviewer actor id.
- Uses fake adapter evidence by default; real Claude Code smoke remains explicit opt-in.
- Adds Workbench Reviewer Run lane with worker evidence refs, review policy, verdict status, findings, next safe action, and safety boundaries.
- Keeps reviewer verdicts separate from task completion, adoption approval, main verification, and release readiness.
- Does not add a generic shell, terminal, arbitrary command launcher, raw provider output, raw worker transcript, local session reads, main worktree writes, product-level git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v67 does not prove real Claude Code CLI execution. It records the default no-real-smoke state and keeps real provider output outside the release payload.

v67 does not perform adoption or main verification. Reviewer output is intentionally structured evidence only. v68 owns adoption preview/confirm and main verification connection.

The v67 Workbench lane was verified through source tests, API/client tests, route smoke, SSR rendering tests, built static assets, local Browser DOM verification, and GitHub CI for PR #151 through PR #154.

## v68 Handoff

v68 should be `v68-adoption-main-verification-loop`.

The handoff target is:

```text
Codex worker evidence
-> Claude reviewer approved
-> adoption preview
-> adoption confirm
-> main verification preview
-> verification confirm
-> explicit main.verification-passed gate draft
-> v68 closeout and v69 handoff
```

v68 may connect approved reviewer evidence to adoption preview/confirm, frozen patch application, adoption journal, fixed main verification suite, and explicit gate draft. It must not adopt unreviewed worker output, auto-apply patches without a frozen adoption plan, invoke providers during adoption, auto-register main verification from test success, auto-merge, mark release-ready, tag, push, publish, create a GitHub Release, expose raw transcripts, expose raw output, read local provider sessions from the frontend, or create the next goal automatically.
