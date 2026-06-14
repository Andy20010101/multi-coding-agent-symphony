# v63 Mac App Local Launch MVP closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v63-mac-app-local-launch-mvp`
PR-4 branch: `codex/v63-closeout`
Pre-closeout main commit: `91ea39976bc015d2def8e8e0cd5b4fa8e792c405`

## Shipped State

v63 ships a local Mac App launch MVP for the existing Tauri shell and Workbench App Home route.

The shipped scope is:

- v63 runbook and v62 handoff reconcile;
- `desktop-shell-smoke.v1` local launch contract in `pnpm desktop:shell:smoke`;
- source-level Tauri compile check through `cargo check`;
- App Home sidecar state projection for attached, launchable, launching, failed, wrong-port, port-conflict, stale, and unavailable states;
- Workbench tests and rebuilt static assets for `/workbench/desktop/`;
- local app launch and recovery guide;
- v63 acceptance record, closeout snapshot, and v64 handoff runbook.

v63 does not ship public distribution, `.dmg`, app signing, notarization, auto-update, app store release, generic terminal UI, renderer arbitrary command execution, local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, or GitHub Release automation.

## Reconcile Before PR-4 Edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main` | `91ea39976bc015d2def8e8e0cd5b4fa8e792c405`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git tag --list 'v62' 'v63'` | `v62`; no `v63` tag. |
| `git show-ref --tags -d \| rg 'refs/tags/v62\|refs/tags/v63'` | `v62` tag object `c26e737546abf75fd2b1f652507cc76d50d1d9cf`; `v62^{}` dereferences to `40d61c78a2905e39d35b71acb223c37a996efdc1`; no `v63` ref. |
| `gh release view v62 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v62 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v62`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T18:39:28Z`; targetCommitish `main`. |
| `gh release view v63 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v63 publication. |

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #131 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/131` | `codex/v63-runbook` | `1a290a81b53874254b267eab6bd2ae357c301bd7` | 2026-06-14T18:51:35Z | Added v63 runbook, latest runbook copy, local launch target, and v62 release-state reconcile. |
| PR-1 native host smoke | #132 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/132` | `codex/v63-host-smoke` | `75313249362449685b01df077ccfa86d986c9b88` | 2026-06-14T18:54:48Z | Hardened desktop shell smoke output and Tauri boundary checks; documented cargo check. |
| PR-2 App Home sidecar states | #133 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/133` | `codex/v63-app-home-sidecar` | `16eaa917af2f3112670b6b3d544004cd633ab0f7` | 2026-06-14T18:59:07Z | Added sidecar launch/failure projection, Workbench display, tests, and rebuilt static assets. |
| PR-3 local app docs | #134 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/134` | `codex/v63-local-app-docs` | `91ea39976bc015d2def8e8e0cd5b4fa8e792c405` | 2026-06-14T19:00:57Z | Added local launch guide and linked it from the shell README. |
| PR-4 acceptance, closeout, and v64 handoff | This PR | `codex/v63-closeout` | Pending until merge | Pending until merge | Adds v63 acceptance, closeout snapshot, and v64 runbook. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v63-mac-app-local-launch-mvp-acceptance.md` | Acceptance record for local launch contract, sidecar states, validation, boundaries, and residual risks. |
| `docs/plans/v63-mac-app-local-launch-mvp-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, release note, and publication steps. |
| `docs/plans/v64-first-run-project-setup-local-settings-runbook-2026-06-14.md` | Next-version handoff for first-run project setup and local settings. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch; static output already matched PR-2 asset state. |
| `pnpm desktop:shell:smoke` | Passed on PR-4 branch; output `desktop-shell-smoke.v1`, `status: ok`, route `/workbench/desktop/`, fixed bridge commands, `bundleActive: false`, and disabled packaging/update claims. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed on PR-4 branch; finished `symphony-desktop-shell` dev profile. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 121 tests, 121 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed on PR-4 branch: 1370 tests, 1370 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed on PR-4 branch before closeout docs. |

## Rollback Path

Rollback is PR-scoped:

- revert PR #133 if App Home sidecar state projection regresses or overclaims launch behavior;
- revert PR #132 if the native host smoke boundary expands beyond fixed sidecar attach/launch;
- revert PR #134 if local launch docs overclaim distribution, signing, notarization, auto-update, release automation, or renderer command execution;
- keep browser Workbench at `/workbench/desktop/` as the fallback path.

## Tag and Release State Before v63 Publication

| Check | Result |
| --- | --- |
| `v62` tag and release | Existing and verified. |
| `v63` tag | Absent before PR-4 merge. |
| `v63` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v63` tag and GitHub Release are still absent.
3. Create an annotated `v63` tag on the post-PR-4 `origin/main` commit.
4. Push the `v63` tag.
5. Create the GitHub Release for `v63`.
6. Verify `v63^{}` dereferences to the post-PR-4 `origin/main` commit.
7. Verify the GitHub Release is non-draft, non-prerelease, has the expected asset policy, and points at the release tag.

Release note draft:

```text
v63: Mac App Local Launch MVP

- Adds a v63 local launch runbook and records the v62 release handoff.
- Hardens desktop-shell-smoke.v1 for the Tauri host boundary and local launch contract.
- Shows sidecar attached, launchable, launching, failed, wrong-port, port-conflict, stale, and unavailable states on App Home.
- Adds local launch and recovery docs with browser fallback.
- Does not add public distribution, signing, notarization, auto-update, generic terminal UI, renderer command execution, provider launch, git write, or GitHub Release automation inside product code.
```

## Residual Risks

No interactive native window screenshot or manual Mac launch video is recorded in v63. The accepted evidence is source-level Tauri compile, static host smoke, Workbench route tests, and local launch documentation.

The local guide includes `cargo run` for machines with Tauri development prerequisites. v63 does not claim a signed app, packaged app, notarized app, or colleague install path.

The sidecar launch bridge remains native-host-owned. Browser Workbench displays the same state and copy-only recovery text; it does not invoke the native bridge.

## v64 Handoff

v64 should be `v64-first-run-project-setup-local-settings`.

The handoff target is:

```text
v63 local App Home launch
-> first-run state
-> current project binding
-> recent projects
-> local settings summary
-> missing/stale project recovery
-> v64 closeout and v65 handoff
```

v64 must not add generic shell or terminal UI, renderer arbitrary command execution, full disk scanning, arbitrary local file picker reads, secret storage, raw provider/session paths, automatic goal creation after project selection, automatic worktree creation, release automation, public distribution, notarization, or auto-update claims.
