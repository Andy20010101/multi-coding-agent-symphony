# v61 Workbench Operator Dry-run Evidence closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v61-workbench-operator-dry-run-evidence`
PR-4 branch: `codex/v61-closeout-v62-handoff`
Pre-closeout main commit: `a86dfa1c10c21e4ab22f489940c6a2014238e5d5`

## Shipped state

v61 is a verification and evidence release on top of the published v60 Stable Personal Workbench Baseline.

The shipped scope is:

- v61-v72 runbook directory README and v61 latest runbook;
- v60 release-state reconcile after v60 tag and GitHub Release publication;
- operator checklist for recording Stable Baseline source refs and disabled capabilities;
- local Workbench route smoke evidence for `/workbench/desktop/` and `/workbench/`;
- recovery drill notes for missing source contracts, blocked release boundary state, unavailable Workbench server, stale static assets, and route source mismatch;
- v61 acceptance evidence, closeout snapshot, and v62 installer/upgrade runbook.

v61 does not ship provider execution, generic shell or terminal UI, renderer-side command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update.

## Reconcile before PR-4 edits

| Command | Result |
| --- | --- |
| `git rev-parse origin/main HEAD` | Both resolve to `a86dfa1c10c21e4ab22f489940c6a2014238e5d5`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git show-ref --tags -d \| rg 'refs/tags/v60\|refs/tags/v61'` | `v60` tag object `d410f55038071d41b58d25a71f36fb70dad66a2e`; `v60^{}` dereferences to `41a211ab30a5eb68c1c0cd04e688dabcf1ba8386`; no `v61` ref. |
| `gh release view v60 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | v60 release exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v60`; name `v60: Stable Personal Workbench Baseline`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T06:47:50Z`; targetCommitish `main`. |
| `gh release view v61 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before PR-4 merge and v61 publication. |

## PR scope record

| Runbook slot | GitHub PR | Branch | Head commit | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| PR-0 runbook carry-forward | #121 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/121` | `codex/v61-runbook` | `69bd49696a0c5fca95ebe535c7fec1537ad9779c` | `19743eb5b3031bab650a2e7f40ab2f9f0804085e` | 2026-06-14T17:12:33Z | Added v61-v72 directory README and v61 latest runbook. |
| PR-1 release-state checklist | #122 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/122` | `codex/v61-release-state-operator-checklist` | `48db61a12a47e27cfe49d97d1962adc909db196a` | `f06fef57c645aaa61ed1efa498686aba182f9808` | 2026-06-14T17:19:09Z | Recorded v60 tag/release facts, missing v61 release, open PR state, and operator checklist. |
| PR-2 route smoke evidence | #123 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/123` | `codex/v61-route-smoke-evidence` | `a33ae1ba5258a9c8aab29243c681f07374f8597e` | `1b2718ad092ae079156eb229192f8a3cd8fc2b1e` | 2026-06-14T17:22:18Z | Recorded Workbench build, route smoke, Stable Baseline labels, release boundary fields, and disabled capability checks. |
| PR-3 recovery drill notes | #124 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/124` | `codex/v61-recovery-drill-notes` | `f7e50bff697798c14da55cef9527add65eaf12c1` | `a86dfa1c10c21e4ab22f489940c6a2014238e5d5` | 2026-06-14T17:24:23Z | Added recovery drills for source contract, release boundary, Workbench server, static asset, and route source failures. |
| PR-4 closeout and v62 handoff | This PR | `codex/v61-closeout-v62-handoff` | Pending until commit | Pending until merge | Pending until merge | Adds v61 acceptance, closeout snapshot, and v62 installer/upgrade runbook. |

## PR-4 files

| File | Purpose |
| --- | --- |
| `docs/qa/v61-workbench-operator-dry-run-evidence-acceptance.md` | Acceptance record for release-state, route smoke, recovery, validation, boundary, and installer baseline notes. |
| `docs/plans/v61-workbench-operator-dry-run-evidence-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, residual risks, rollback, release notes, and v62 handoff. |
| `docs/plans/v62-installer-upgrade-baseline-runbook-2026-06-14.md` | Next-version runbook for installer ref strategy, install status, upgrade dry-run, rollback, acceptance, and v63 handoff. |

## Validation evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch. |
| `node --test tests/v60-stable-personal-workbench-release.test.js` | Passed: 7 tests, 7 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 120 tests, 120 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed: 1364 tests, 1364 passed. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed after staging PR-4 files. |

## Workbench verification record

The v61 route smoke accepted `/workbench/desktop/` and `/workbench/` as local Workbench routes with `200` status, `text/html; charset=utf-8`, `no-store`, `nosniff`, React root, and Workbench static asset references.

The Desktop App Home route renders the Stable Baseline lane with `Stable Workbench Release`, `stableWorkbenchRelease.v1`, `Surface Matrix`, `Provider Boundary`, `Release Boundary`, `Safety`, `Evidence Refs`, and `Disabled Capabilities`.

The route smoke keeps tag, push tag, GitHub Release, and release-ready actions as manual controller evidence. The Workbench route does not expose provider launch, shell, terminal, renderer command execution, frontend JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, git write, GitHub Release creation/edit, public distribution, automatic worktree creation, or automatic next-version goal controls.

## Installer baseline decision

v61 does not move the installer default. The current published Workbench baseline is v60. v61 will be an evidence release after PR-4 merge, tag, and GitHub Release publication. v62 owns the installer stable-ref decision:

- keep the current conservative default;
- move the explicit install ref to v60 or v61;
- introduce a manually advanced `latest-stable` ref.

Until v62 decides, use an explicit `MCAS_INSTALL_REF` for intentional installs from v60 or v61. Do not present v61 as a public distribution, notarized build, auto-update channel, or installer default.

## Tag and release state before v61 publication

| Check | Result |
| --- | --- |
| `v60` tag and release | Existing and verified. |
| `v61` tag | Absent before PR-4 merge. |
| `v61` GitHub Release | `release not found` before PR-4 merge. |
| Open PR state | Empty before PR-4 branch creation. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v61` tag and GitHub Release are still absent.
3. Create an annotated `v61` tag on the post-PR-4 `origin/main` commit.
4. Push the `v61` tag.
5. Create the GitHub Release for `v61`.
6. Verify `v61^{}` dereferences to the post-PR-4 `origin/main` commit.
7. Verify the GitHub Release is non-draft, non-prerelease, has the expected asset policy, and points at the release tag.

Release note draft:

```text
v61: Workbench Operator Dry-run Evidence

- Records post-v60 release-state reconcile, including v60 tag and GitHub Release facts.
- Records local Workbench route smoke for /workbench/desktop/ and /workbench/.
- Adds operator checklist and recovery drill notes for the stable baseline path.
- Hands off installer and upgrade baseline decisions to v62.
- Does not add provider execution, release automation, public distribution, notarization, auto-update, generic shell, or unsupported provider support.
```

## Residual risks

The Stable Baseline Workbench lane remains the v60 acceptance baseline display. It does not automatically reconcile live post-release GitHub tag or release state. v61 records that release-state evidence in docs and keeps product release publication outside Workbench.

The installer default still needs a dedicated decision. v62 must decide whether v60, v61, or a `latest-stable` ref should become the install target.

## Rollback path

If v61 docs overstate product capability, revert the docs-only PR that introduced the claim.

If route evidence is later found to be stale, rerun `pnpm workbench:build` and `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`; update evidence in a dedicated follow-up PR.

If v61 publication creates an unexpected tag or release state, stop v62 start, record the tag object and release URL, and correct the publication state manually before any installer-ref decision.

## v62 handoff

v62 should be `v62-installer-upgrade-baseline`.

The handoff target is:

```text
v61 verified baseline
-> install ref strategy
-> install status contract
-> upgrade dry-run contract
-> rollback notes
-> v62 closeout and v63 handoff
```

v62 may add docs, contracts, fixtures, tests, and narrow CLI surfaces for install status and upgrade dry-run. It must not silently change a user's installed checkout, fetch from the renderer, expose a generic shell, automate release publication, claim public distribution/notarization/auto-update, or change the installer default without explicit release-state evidence.
