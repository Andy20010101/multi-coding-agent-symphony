# v64 First-run Project Setup and Local Settings closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v64-first-run-project-setup-local-settings`
PR-4 branch: `codex/v64-closeout-handoff`
Pre-closeout main commit: `16f615ea3fe2ea331ed39a01e3a5a7c1b7bce475`

## Shipped State

v64 ships a read-only first-run project setup and local settings path for Workbench.

The shipped scope is:

- v64 runbook copied from the v61-v72 runbook package;
- `personalWorkbenchSettings.v1` contract, validator, fixtures, and focused tests;
- backend projection from project registry, current project binding, recent projects, and default local preferences;
- read-only `GET /api/settings/personal-workbench`;
- `pnpm --silent symphony runtime settings --json` controller inspection path;
- Desktop App Home First-run Project Setup panel with current project, settings source, recent projects, safe action, recovery rows, and boundary flags;
- rebuilt Workbench static assets;
- v64 acceptance record, closeout snapshot, and v65 handoff runbook.

v64 does not ship generic shell or terminal UI, renderer arbitrary command execution, full disk scanning, renderer arbitrary path input/read, local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, secret storage, provider launch, direct event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update claims.

## Reconcile Before PR-4 Edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main` | `16f615ea3fe2ea331ed39a01e3a5a7c1b7bce475`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git tag --list 'v63' 'v64'` | `v63`; no `v64` tag. |
| `git show-ref --tags -d \| rg 'refs/tags/v63\|refs/tags/v64'` | `v63` tag object `c4c2a41e9b57cf277e50985c964e47c9ff2d6f2b`; `v63^{}` dereferences to `e001fb488c8930adc11269695c86e3fc505107a3`; no `v64` ref. |
| `gh release view v63 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v63 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v63`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T19:05:34Z`; targetCommitish `main`. |
| `gh release view v64 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v64 publication. |

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #136 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/136` | `codex/v64-runbook` | `b3baff0d0ee40733eb1daecbde5454f363c930d7` | 2026-06-14T19:13:24Z | Added v64 runbook from the v61-v72 package. |
| PR-1 settings and project contracts | #137 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/137` | `codex/v64-settings-contracts` | `8f4fa5687d240e2959ace3ff44c651dba6752501` | 2026-06-14T19:20:04Z | Added `personalWorkbenchSettings.v1`, fixtures, validator, and focused tests. |
| PR-2 backend projection and CLI | #138 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/138` | `codex/v64-settings-projection` | `61e10b0848a28379ca2042e420c2a21a26ad0767` | 2026-06-14T19:27:09Z | Added read-only settings projection, API route, CLI inspection, route tests, and approved path list update. |
| PR-3 Workbench first-run surface | #139 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/139` | `codex/v64-first-run-workbench-surface` | `16f615ea3fe2ea331ed39a01e3a5a7c1b7bce475` | 2026-06-14T19:35:43Z | Added First-run Project Setup panel, Workbench projection tests, SSR tests, and rebuilt static assets. |
| PR-4 acceptance, closeout, and v65 handoff | This PR | `codex/v64-closeout-handoff` | Pending until merge | Pending until merge | Adds v64 acceptance, closeout snapshot, and v65 runbook. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v64-first-run-project-setup-local-settings-acceptance.md` | Acceptance record for first-run settings state, Workbench surface, validation, boundaries, residual risk, and rollback. |
| `docs/plans/v64-first-run-project-setup-local-settings-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, tag/release notes, and v65 handoff. |
| `docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md` | Next-version handoff for Codex and Claude Code provider readiness. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output matched the PR-3 asset state: `index-C0f--kJC.css` and `index-DphMY-EF.js`. |
| `node --test tests/v64-first-run-project-setup-local-settings.test.js` | Passed on PR-4 branch: 5 tests, 5 passed. |
| `node --test tests/workbench-api-client.test.js` | Passed on PR-4 branch: 67 tests, 67 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `node --test tests/workbench-shell.test.js` | Passed on PR-4 branch: 44 tests, 44 passed. |
| `node --test tests/v64-first-run-project-setup-local-settings.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 17 tests, 17 passed. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed on PR-4 branch: 1377 tests, 1377 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed on PR-4 branch. |

## Rollback Path

Rollback is PR-scoped:

- revert PR #139 if Desktop App Home first-run setup regresses, overclaims execution, or adds renderer controls;
- revert PR #138 if `/api/settings/personal-workbench` accepts arbitrary path input, writes settings, or exposes unsupported local data;
- revert PR #137 if the settings contract accepts secrets, raw provider refs, raw transcript/model output refs, local session paths, or unsafe boundary drift;
- keep Project Launcher and browser Workbench as the fallback project surface.

## Tag and Release State Before v64 Publication

| Check | Result |
| --- | --- |
| `v63` tag and release | Existing and verified. |
| `v64` tag | Absent before PR-4 merge. |
| `v64` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v64` tag and GitHub Release are still absent.
3. Create an annotated `v64` tag on the post-PR-4 `origin/main` commit.
4. Push the `v64` tag.
5. Create the GitHub Release for `v64`.
6. Verify `v64^{}` dereferences to the post-PR-4 `origin/main` commit.
7. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and points at the release tag.

Release note draft:

```text
v64: First-run Project Setup and Local Settings

- Adds personalWorkbenchSettings.v1 for read-only first-run state, local settings source, current project binding, recent projects, recovery actions, and safety boundaries.
- Adds GET /api/settings/personal-workbench and pnpm symphony runtime settings --json for controller inspection.
- Adds a read-only First-run Project Setup panel to Desktop App Home.
- Covers ready, missing settings, stale binding, invalid project id, secret-like value, and unsafe path fixtures.
- Does not add a generic terminal, renderer command execution, arbitrary local file browsing, provider launch, automatic goal/worktree creation, git write, release automation, public distribution, notarization, or auto-update.
```

## Residual Risks

v64 displays local settings and project setup state but does not write settings from the renderer. The next settings mutation path must be backend-owned preview/confirm or an explicit manual controller flow.

v64 records preferred providers as preferences only. It does not prove Codex or Claude Code readiness, and it does not claim Claude Code execution. v65 owns the provider readiness matrix.

No interactive browser screenshot is recorded in this closeout. Acceptance uses contract tests, API route tests, SSR rendering tests, Workbench route smoke, built static assets, and full `pnpm test`.

## v65 Handoff

v65 should be `v65-provider-readiness-codex-claude-only`.

The handoff target is:

```text
current project selected
-> provider readiness matrix
-> Codex worker candidate
-> Claude Code reviewer candidate
-> unsupported/historical provider blockers
-> v65 closeout and v66 handoff
```

v65 must keep provider readiness separate from execution. It should not add generic provider picker, provider launch controls, raw CLI stdout/stderr payloads, local session/provider folder reads, or claims that Kiro, Gemini, or DeepSeek are active Workbench providers. DeepSeek remains only a Claude Code provider configuration detail.
