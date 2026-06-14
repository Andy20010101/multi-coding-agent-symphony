# v65 Provider Readiness: Codex and Claude Code Only closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v65-provider-readiness-codex-claude-only`
PR-4 branch: `codex/v65-closeout`
Pre-closeout main commit: `cc83639811aec4b880c5e6d564f1387148df0be7`

## Shipped State

v65 ships a sanitized provider readiness line for the local Workbench path:

```text
providerReadiness.v1
-> Codex CLI worker candidate
-> Claude Code CLI reviewer candidate
-> Kiro historical compatibility
-> DeepSeek as Claude Code configuration detail only
-> Provider Hub readiness display
```

The shipped scope is:

- v65 runbook copied from the v61-v72 runbook package;
- `providerReadiness.v1` contract, validator, fixtures, and focused tests;
- backend projection from sanitized provider health and environment/configuration presence;
- read-only `GET /api/providers/readiness`;
- Provider Hub projection that combines readiness with provider health, capability profile, lane preview, and explicit evidence refs;
- README and provider boundary guide updates for the Codex and Claude Code provider line;
- Workbench Provider Hub and Desktop Provider Availability readiness display;
- rebuilt Workbench static assets;
- v65 acceptance record, closeout snapshot, and v66 handoff runbook.

v65 does not ship generic shell or terminal UI, renderer arbitrary command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, raw provider stdout/stderr exposure, unsupported active provider claims, generic provider picker, raw provider CLI launcher, provider execution from readiness cards, direct goal event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## Reconcile Before PR-4 Edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main` | `cc83639811aec4b880c5e6d564f1387148df0be7`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git tag --list 'v64' 'v65'` | `v64`; no `v65` tag. |
| `git show-ref --tags -d \| rg 'refs/tags/v64\|refs/tags/v65'` | `v64` tag object `e878889ff9bdc40709486b8d280f4bc1c8a1e612`; `v64^{}` dereferences to `0867d5ab721b5c9ea607c79e305fa222b887914c`; no `v65` ref. |
| `gh release view v64 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v64 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v64`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T19:41:25Z`; targetCommitish `main`. |
| `gh release view v65 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v65 publication. |

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #141 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/141` | `codex/v65-runbook` | `60808bdc066d8c6b7cd58667c1eadf8080815752` | 2026-06-14T20:00:10Z | Added v65 runbook from the v61-v72 package. |
| PR-1 readiness contracts and fixtures | #142 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/142` | `codex/v65-provider-readiness-contracts` | `83fe20bec98feb51ce4dafd5733231699bb08f67` | 2026-06-14T20:07:41Z | Added `providerReadiness.v1`, fixtures, validator, and focused tests. |
| PR-2 backend projection and boundary docs | #143 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/143` | `codex/v65-provider-readiness-projection` | `b4bcf4f2942b554d333ba0edef8f7ec73e07cd19` | 2026-06-14T20:17:38Z | Added read-only readiness projection, API route, Provider Hub contract projection, README, and provider boundary guide updates. |
| PR-3 Workbench readiness surface | #144 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/144` | `codex/v65-provider-readiness-ui` | `cc83639811aec4b880c5e6d564f1387148df0be7` | 2026-06-14T20:22:04Z | Added Provider Hub readiness UI, Desktop Provider Availability readiness rows, static tests, and rebuilt static assets. |
| PR-4 acceptance, closeout, and v66 handoff | This PR | `codex/v65-closeout` | Pending until merge | Pending until merge | Adds v65 acceptance, closeout snapshot, and v66 runbook. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v65-provider-readiness-codex-claude-only-acceptance.md` | Acceptance record for provider readiness contracts, backend route, Workbench display, validation, residual risk, and rollback. |
| `docs/plans/v65-provider-readiness-codex-claude-only-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v66 handoff. |
| `docs/plans/v66-controlled-codex-worker-execution-runbook-2026-06-14.md` | Next-version handoff for backend-owned Codex worker execution. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` | Passed on PR-4 branch: 39 tests, 39 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 123 tests, 123 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm workbench:build` | Passed on PR-4 branch; static output is `index-BX8171d6.css` and `index-CHkwDuMk.js`. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed on PR-4 branch: 1385 tests, 1385 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after PR-4 staging. |

## Optional Provider Smoke

No real Codex or Claude Code smoke was run for v65. The readiness contract records this as data, not as a hidden pass:

- `binaryPresence.state`: `unknown` when the backend knows the provider line but does not execute the CLI;
- `helpSmoke.state`: `not-run`;
- `optionalRealSmoke.state`: `not-run`;
- `evidencePolicy.rawProviderOutputAllowed`: `false`;
- `evidencePolicy.localSessionPathAllowed`: `false`;
- `evidencePolicy.secretValueAllowed`: `false`.

This keeps v65 to readiness contracts and display. v66 owns controlled Codex worker execution. v67 owns Claude Code reviewer execution.

## Rollback Path

Rollback is PR-scoped:

- revert PR #144 if Workbench Provider Hub or Desktop Provider Availability adds launch controls, generic provider picking, local session links, raw provider output, or readiness-card execution;
- revert PR #143 if `/api/providers/readiness` accepts query/body mutation, reads local provider sessions, exposes secrets or raw stdout/stderr, or makes DeepSeek an active provider;
- revert PR #142 if `providerReadiness.v1` accepts unsupported active providers, local session paths, raw provider output, or secret-bearing fields;
- keep v64 First-run Project Setup and previous Provider Hub surfaces as the fallback state.

## Tag and Release State Before v65 Publication

| Check | Result |
| --- | --- |
| `v64` tag and release | Existing and verified. |
| `v65` tag | Absent before PR-4 merge. |
| `v65` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v65` tag and GitHub Release are still absent.
3. Run the closeout validation suite from this snapshot or record any external blocker.
4. Create an annotated `v65` tag on the post-PR-4 `origin/main` commit.
5. Push the `v65` tag.
6. Create the GitHub Release for `v65`.
7. Verify `v65^{}` dereferences to the post-PR-4 `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v65: Provider Readiness: Codex and Claude Code Only

- Adds providerReadiness.v1 for sanitized Codex CLI worker and Claude Code CLI reviewer readiness.
- Adds GET /api/providers/readiness and Provider Hub projection for readiness state.
- Marks Kiro as historical compatibility only.
- Marks DeepSeek as a Claude Code provider configuration detail, not an active Workbench provider.
- Adds Workbench Provider Hub readiness display and rebuilt static assets.
- Does not add provider execution from readiness cards, a generic provider picker, raw provider output, local session reads, automatic self-review, automatic worktree creation, next-version goal creation, product-level git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v65 does not prove local Codex or Claude Code binaries by executing them. It displays sanitized readiness and explicit `not-run` smoke states. The first controlled Codex execution path belongs to v66.

v65 keeps Claude Code as reviewer candidate readiness. It does not claim reviewer execution or approval. v67 owns that lane.

No interactive browser screenshot is recorded in this closeout. Acceptance uses contract tests, API route tests, SSR rendering tests, Workbench route smoke, built static assets, and GitHub CI for PR #141 through PR #144.

## v66 Handoff

v66 should be `v66-controlled-codex-worker-execution`.

The handoff target is:

```text
active goal/task
-> worker run preview
-> planHash confirm
-> isolated workspace / controlled provider run
-> sanitized worker evidence
-> needs-review state
-> v66 closeout and v67 handoff
```

v66 may add a controlled Codex worker preview/confirm path with fake adapter tests and optional real Codex smoke only when explicitly enabled. It must not add a generic terminal, arbitrary prompt launcher, raw transcript/model output display, provider session reader, direct task completion, direct reviewer approval, main-worktree write, automatic self-review, automatic worktree creation, next-version goal creation, product-level git write, or release automation.
