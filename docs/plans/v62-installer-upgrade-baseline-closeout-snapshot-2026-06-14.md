# v62 Installer and Upgrade Baseline closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v62-installer-upgrade-baseline`
PR-4 branch: `codex/v62-closeout`
Pre-closeout main commit: `322056dc450787ae534d73b007d08e04986450c4`

## Shipped state

v62 ships the installer and upgrade baseline on top of the verified v61 release.

The shipped scope is:

- v62 runbook and version-start reconcile;
- installer ref policy keeping the default at `v8`;
- install guide and release checklist evidence rule for future installer ref changes;
- `installStatus.v1` and `installUpgradePlan.v1` helpers;
- CLI surfaces `symphony install status --json` and `symphony install upgrade --target-ref <ref> --dry-run --json`;
- `GET /api/install/status` as a no-query read-only route;
- Workbench Install Status panel with copy-only commands;
- upgrade guide covering dry-run, manual upgrade, and manual rollback;
- acceptance record, closeout snapshot, and v63 handoff runbook.

v62 does not ship silent checkout modification, renderer network fetch, Workbench install or rollback execution, dependency installation from Workbench, generic shell or terminal UI, local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update.

## Reconcile before PR-4 edits

| Command | Result |
| --- | --- |
| `git rev-parse HEAD origin/main` | Both resolved to `322056dc450787ae534d73b007d08e04986450c4`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git tag --list 'v61' 'v62'` | `v61`; no `v62` tag. |
| `git show-ref --tags -d \| rg 'refs/tags/v61\|refs/tags/v62'` | `v61` tag object `6544c8026ed0b351eb6cb756e5e755e3bac6e36a`; `v61^{}` dereferences to `d2cfff816b0111140b3e5e11fb819f60cc0c4911`; no `v62` ref. |
| `gh release view v61 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v61 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v61`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T17:31:02Z`; targetCommitish `main`. |
| `gh release view v62 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v62 publication. |

## PR scope record

| Runbook slot | GitHub PR | Branch | Head commit | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #126 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/126` | `codex/v62-runbook` | `037c394e64ddf89ddd80743b861fc631482f10cf` | `e23d489cb935971aa46e23e5ac72b853c797b150` | 2026-06-14T18:15:51Z | Added v62 runbook and copied the latest v62 runbook into the v61-v72 workbench directory. |
| PR-1 installer ref policy | #127 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/127` | `codex/v62-stable-installer-ref` | `f20ce20fbd947f4f3dc90e0ada8c5cd9ce0f946a` | `6d2283e8e68b6d5c36504b4159f0c77b30675c65` | 2026-06-14T18:18:58Z | Kept installer default at `v8`, documented explicit `MCAS_INSTALL_REF=v61`, and added release checklist evidence before future default changes. |
| PR-2 install and upgrade contracts | #128 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/128` | `codex/v62-install-upgrade-contract` | `f7a3a4789bd23ca4e95cf2f6ab9598244e6858c0` | `d2f397f153b6270bd40616204a55d0c72cd4d888` | 2026-06-14T18:24:24Z | Added `installStatus.v1`, `installUpgradePlan.v1`, CLI commands, and focused tests. |
| PR-3 docs and Workbench surface | #129 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/129` | `codex/v62-install-docs-workbench` | `558f8f457a73e8917b037724b0ee8884d6d7a325` | `322056dc450787ae534d73b007d08e04986450c4` | 2026-06-14T18:34:13Z | Added upgrade guide, install status route, Workbench display-only panel, rebuilt static assets, and updated Workbench tests. |
| PR-4 acceptance, closeout, and v63 handoff | This PR | `codex/v62-closeout` | Pending until commit | Pending until merge | Pending until merge | Adds v62 acceptance, closeout snapshot, and v63 runbook. |

## PR-4 files

| File | Purpose |
| --- | --- |
| `docs/qa/v62-installer-upgrade-baseline-acceptance.md` | Acceptance record for installer ref policy, contracts, Workbench surface, validation, and residual risks. |
| `docs/plans/v62-installer-upgrade-baseline-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, examples, validation, rollback, release note, and publication steps. |
| `docs/plans/v63-mac-app-local-launch-mvp-runbook-2026-06-14.md` | Next-version handoff for Mac App local launch MVP. |

## Install status example

Command:

```sh
pnpm --silent symphony install status --install-dir . --bin-dir scripts --target-ref v61 --json
```

Accepted fields:

| Field | Value |
| --- | --- |
| contractName | `installStatus.v1` |
| state | `ready` |
| installDir.dirty | `false` |
| current.ref | `codex/v62-closeout` |
| current.commit | `322056dc450787ae534d73b007d08e04986450c4` |
| target.ref | `v61` |
| target.availableLocally | `true` |
| doctor.status | `missing-shim` because `--bin-dir scripts` is a fixture path for this check |
| blockedReasons | `[]` |
| readOnly / willMutate | `true / false` |

Disabled boundaries were `networkFetchAvailable`, `checkoutAvailable`, `dependencyInstallAvailable`, `overwriteAvailable`, `rendererNetworkFetchAvailable`, `workbenchExecutionAvailable`, and `gitReleaseAutomationAvailable`.

## Upgrade dry-run example

Command:

```sh
pnpm --silent symphony install upgrade --install-dir . --bin-dir scripts --target-ref v61 --rollback-ref codex/v62-closeout --dry-run --json
```

Accepted fields:

| Field | Value |
| --- | --- |
| contractName | `installUpgradePlan.v1` |
| state | `ready` |
| dryRun | `true` |
| target.ref | `v61`, safe and available locally |
| rollback.ref | `codex/v62-closeout`, safe and available locally |
| dirty install dir | `false` |
| Node / pnpm | Node `24.14.0`; pnpm `10.30.3` |
| plannedMutations | `[]` |
| manualActionRequired | `true` |
| readOnly / willMutate | `true / false` |

## Rollback path

Rollback is manual and terminal-owned:

```sh
git -C "$MCAS_INSTALL_DIR" checkout <rollback-ref>
pnpm --dir "$MCAS_INSTALL_DIR" install --frozen-lockfile
"$MCAS_BIN_DIR/symphony" doctor
```

`installUpgradePlan.v1` verifies that the rollback ref is safe and available locally. It does not execute the rollback.

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v62-installer-upgrade-baseline.test.js` | Passed on PR-4 branch: 5 tests, 5 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-3 branch for the Workbench change: 121 tests, 121 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. PR-4 is docs-only. |
| `pnpm workbench:build` | Passed on PR-3 branch for the Workbench static asset update. PR-4 is docs-only. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed after staging PR-4 files. |

`pnpm test` is not part of the v62 closeout gate because the runbook requires the focused v62 test, `pnpm check`, whitespace checks, and Workbench build/tests when Workbench is touched. PR-3 ran the Workbench build and Workbench tests for the Workbench change.

## Tag and release state before v62 publication

| Check | Result |
| --- | --- |
| `v61` tag and release | Existing and verified. |
| `v62` tag | Absent before PR-4 merge. |
| `v62` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v62` tag and GitHub Release are still absent.
3. Create an annotated `v62` tag on the post-PR-4 `origin/main` commit.
4. Push the `v62` tag.
5. Create the GitHub Release for `v62`.
6. Verify `v62^{}` dereferences to the post-PR-4 `origin/main` commit.
7. Verify the GitHub Release is non-draft, non-prerelease, has the expected asset policy, and points at the release tag.

Release note draft:

```text
v62: Installer and Upgrade Baseline

- Keeps the installer default at v8 until a later release records enough evidence to move it.
- Adds installStatus.v1 and installUpgradePlan.v1 for read-only status and dry-run upgrade planning.
- Adds CLI status and dry-run commands plus docs for manual upgrade and rollback.
- Adds a Workbench display-only Install Status panel backed by GET /api/install/status.
- Does not add Workbench checkout, fetch, dependency install, rollback, release automation, public distribution, notarization, auto-update, or generic shell execution.
```

## Residual risks

The installer default remains `v8`. This avoids silently changing existing installs, but users need an explicit `MCAS_INSTALL_REF` for current verified release installs.

The Workbench status route reads the backend process environment and configured install directory. It rejects renderer query parameters, but it still reflects the console server's environment.

The manual upgrade path includes `git fetch --tags origin` in docs. That command is not part of `installUpgradePlan.v1` and is not run by Workbench or the renderer.

## v63 handoff

v63 should be `v63-mac-app-local-launch-mvp`.

The handoff target is:

```text
v62 installer baseline
-> local Mac app launch entry
-> sidecar attach/start check
-> no packaging or public distribution claim
-> v63 closeout and v64 handoff
```

v63 may improve the local Mac launch path and app shell startup checks. It must not add public distribution, notarization, auto-update, release automation, generic shell execution, provider-session reads, raw transcript exposure, automatic worktree creation, or automatic next-version goal creation.
