# v68 Adoption and Main Verification Workbench Loop closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v68-adoption-main-verification-loop`
PR-5 branch: `codex/v68-closeout-handoff`
Pre-closeout main commit: `aa59494173ce3bd74bfd4fe4c69adc266a478235`

## Shipped State

v68 ships a controlled adoption and main verification loop:

```text
workerRunPreview.v1 / worker operation
-> reviewerRunHandoff.v1 / reviewer verdict
-> adoptionReadiness.v1
-> planHash-bound adoption confirm with journal and rollback refs
-> mainVerificationPreview.v1
-> fixed main verification confirm
-> mainVerificationGateDraft.v1 for main.verification-passed
```

The shipped scope is:

- v68 start evidence on top of verified v67 tag and GitHub Release;
- adoption readiness contracts, fixtures, validators, and tests;
- backend adoption readiness preview/confirm routes with journal-before-apply recovery state;
- fixed main verification preview/confirm routes;
- separate `main.verification-passed` gate draft after fixed verification passes;
- Workbench loop surface showing Worker, Reviewer, Adoption, Main Verification, and Gate Draft states;
- rebuilt Workbench static assets;
- v68 acceptance record, closeout snapshot, and v69 recovery/diagnostics handoff runbook.

v68 does not ship generic shell or terminal UI, arbitrary renderer command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw worker transcript exposure, raw model output exposure, raw provider output exposure, unsupported provider claims, direct goal event append from provider output, direct task completion from provider output, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #156 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/156` | `codex/v68-runbook-start` | `21d9e126d7f1cb8eddc52db671534a1221c9af0b` | 2026-06-14T22:50:58Z | Added v68 startup evidence and runbook. |
| PR-1 adoption contracts | #157 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/157` | `codex/v68-adoption-contracts` | `a3a4ae3dbb08610dcc781e34305d06ac2de5fd2f` | 2026-06-14T22:58:23Z | Added adoption readiness contracts, fixtures, validators, and tests. |
| PR-2 adoption backend | #158 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/158` | `codex/v68-adoption-backend` | `8c523a92bfaaed35b4f571a8f1fb92e84a788460` | 2026-06-14T23:44:46Z | Added adoption preview/confirm backend routes, journaled apply, rollback refs, and route tests. |
| PR-3 main verification backend | #159 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/159` | `codex/v68-main-verification-backend` | `4ca3bdbeaf472f065b1cc913d48d20ff8fa6a13b` | 2026-06-14T23:52:50Z | Added fixed main verification preview/confirm and separate gate draft. |
| PR-4 Workbench loop surface | #160 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/160` | `codex/v68-workbench-loop-surface` | `aa59494173ce3bd74bfd4fe4c69adc266a478235` | 2026-06-15T00:05:14Z | Added Workbench loop surface, read-only preview fetch/projection, tests, and static assets. |
| PR-5 acceptance, closeout, and v69 handoff | This PR | `codex/v68-closeout-handoff` | Pending until merge | Pending until merge | Adds v68 acceptance, closeout snapshot, and v69 runbook. |

## PR-5 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v68-adoption-main-verification-loop-acceptance.md` | Acceptance record for contracts, backend routes, Workbench surface, validation, residual risk, and rollback. |
| `docs/plans/v68-adoption-main-verification-loop-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v69 handoff. |
| `docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md` | Next-version handoff for recovery, resume, diagnostics, and observability. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output is `index-BX8171d6.css` and `index-D8aWQYff.js`. |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed on PR-4 branch: 13 tests, 13 passed. Also passed inside `pnpm test` on PR-5 branch. |
| `node --test tests/v67-claude-code-reviewer-lane.test.js` | Passed on PR-4 branch: 11 tests, 11 passed. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed on PR-4 branch: 10 tests, 10 passed. |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js` | Passed on PR-5 branch: 10 tests, 10 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 131 tests, 131 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed on PR-5 branch: 1427 tests, 1427 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed on PR-5 branch after adding acceptance, closeout, and v69 handoff docs. |
| `git diff --cached --check` | Passed after PR-5 staging. |

## Fake End-to-End Evidence

The v68 fake loop is covered by `tests/v68-adoption-main-verification-loop.test.js`:

- ready adoption requires approved reviewer evidence, matching worker run id, clean worktree state, safe patch refs, rollback requirement, and valid `planHash`;
- blocked adoption covers missing reviewer approval, dirty worktree, stale worker evidence, patch mismatch, unsafe patch, unsupported deletion, and missing artifact;
- adoption confirm rejects stale hashes and command material, journals before apply, records operation state, and exposes rollback refs;
- fixed main verification confirm rejects stale hashes and command material, records verification evidence, and only prepares a separate gate draft;
- failed verification blocks gate draft readiness.

## Rollback Path

Rollback is PR-scoped:

- revert PR #160 if Workbench exposes execution controls, raw output, local provider/session paths, direct main verification, release-ready controls, product git writes, or GitHub Release automation;
- revert PR #159 if fixed main verification accepts arbitrary command fields, skips `planHash`, auto-registers `main.verification-passed`, marks release ready, or mutates product release state;
- revert PR #158 if adoption confirm accepts stale `planHash`, applies unfrozen patches, skips fingerprint checks, runs providers, writes raw output, or loses rollback state;
- revert PR #157 if `adoptionReadiness.v1` accepts raw/local/session fields, unsafe patch refs, unsupported deletion, stale worker evidence, dirty worktrees, or missing rollback requirement;
- keep v67 Claude Code Reviewer Lane and v66 Controlled Codex Worker Execution as the fallback state.

## Tag and Release State Before v68 Publication

| Check | Result |
| --- | --- |
| `v67` tag and release | Existing and verified before v68 implementation. |
| `v68` tag | Absent before PR-5 merge. |
| `v68` GitHub Release | Not created before PR-5 merge. |
| Open PR state | Empty before PR-5 branch creation; PR-5 is the only expected open PR while this snapshot is under review. |

After PR-5 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v68` tag and GitHub Release are still absent.
3. Confirm closeout validation is green.
4. Create an annotated `v68` tag on the post-PR-5 `origin/main` commit.
5. Push the `v68` tag.
6. Create the GitHub Release for `v68`.
7. Verify `v68^{}` dereferences to the post-PR-5 `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v68: Adoption and Main Verification Workbench Loop

- Adds adoptionReadiness.v1 for approved reviewer evidence, clean worktree state, safe patch refs, source fingerprints, rollback requirement, and blocked reasons.
- Adds backend-owned adoption readiness preview/confirm routes with planHash binding, journal-before-apply, operation records, and rollback refs.
- Adds fixed main verification preview/confirm routes that record verification evidence and prepare a separate main.verification-passed gate draft.
- Adds the Workbench loop surface for Worker -> Reviewer -> Adoption -> Main Verification -> Gate Draft, including blockers and next safe action.
- Keeps provider/reviewer output separate from task completion, adoption mutation, main verification gate registration, and release readiness.
- Does not add a generic shell, terminal, arbitrary command launcher, raw provider output, raw worker transcript, local session reads, product-level git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v68 proves the controlled loop through fake evidence, fixtures, backend preview/confirm routes, operation records, Workbench projection, source tests, and full local test suite. It does not prove real provider execution for adoption or verification.

v68 prepares a `main.verification-passed` gate draft but does not register it. Gate registration remains a separate explicit preview/confirm path.

## v69 Handoff

v69 should be `v69-recovery-resume-diagnostics-observability`.

The handoff target is:

```text
controlled execution loop
-> run timeline
-> failure classification
-> recovery preview
-> resume / retry / handoff / mark-blocked
-> diagnostics bundle
-> v69 closeout and v70 handoff
```

v69 should make failed, interrupted, timeout, and blocked worker/reviewer/adoption/main-verification runs recoverable with structured diagnostics and cost/time observability. It must not introduce hidden retries, raw logs, raw provider output, secrets, local session paths, arbitrary provider commands, product-level git automation, or release publication inside product code.
