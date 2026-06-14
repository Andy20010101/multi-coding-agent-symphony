# v61 Workbench Operator Dry-run Evidence acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v61-workbench-operator-dry-run-evidence`
PR-4 branch: `codex/v61-closeout-v62-handoff`
Main before PR-4: `a86dfa1c10c21e4ab22f489940c6a2014238e5d5`

## Accepted scope

v61 verifies the released v60 Stable Personal Workbench baseline from an operator session. It records release-state reconcile, route smoke evidence, operator checklist, recovery drill notes, closeout, and the v62 handoff.

v61 does not add provider execution, generic shell or terminal UI, renderer-side command execution, frontend local JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update.

## Accepted evidence

| Evidence | File |
| --- | --- |
| v61 runbook carry-forward | `docs/plans/workbench-v61-v72-real-use-runbooks/README_HOW_TO_START.md` and `docs/plans/workbench-v61-v72-real-use-runbooks/v61_workbench-operator-dry-run-evidence_goal_runbook_latest.md` |
| v60 release-state reconcile and operator checklist | `docs/qa/v61-release-state-reconcile-and-operator-checklist.md` |
| Local Workbench route smoke | `docs/qa/v61-workbench-route-smoke-evidence.md` |
| Recovery drill notes | `docs/plans/v61-recovery-drill-notes-2026-06-14.md` |
| v61 closeout and v62 handoff | `docs/plans/v61-workbench-operator-dry-run-evidence-closeout-snapshot-2026-06-14.md` and `docs/plans/v62-installer-upgrade-baseline-runbook-2026-06-14.md` |

## Release-state acceptance

| Check | Accepted result |
| --- | --- |
| v60 annotated tag | Tag object `d410f55038071d41b58d25a71f36fb70dad66a2e`; dereferenced commit `41a211ab30a5eb68c1c0cd04e688dabcf1ba8386`. |
| v60 GitHub Release | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v60`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T06:47:50Z`; targetCommitish `main`. |
| v61 tag/release before closeout | No v61 tag ref and `gh release view v61` returns `release not found`. |
| PR state before PR-4 | Open PR list `[]`; `HEAD` and `origin/main` both `a86dfa1c10c21e4ab22f489940c6a2014238e5d5`. |

`origin/main` is ahead of the `v60` tag. v61 starts from current `origin/main`, not from `v60^{}`.

## Route smoke acceptance

The local Workbench route smoke accepted these facts:

- `pnpm workbench:build` passes after dependencies are installed in the worktree.
- `/workbench/desktop/` and `/workbench/` return `200`, `text/html; charset=utf-8`, `cache-control: no-store`, and `x-content-type-options: nosniff`.
- `/workbench/desktop/` renders the `Stable Baseline` navigation target and the `Stable Workbench Release` panel.
- The panel shows `stableWorkbenchRelease.v1`, `Surface Matrix`, `Provider Boundary`, `Release Boundary`, `Safety`, `Evidence Refs`, and `Disabled Capabilities`.
- Release boundary fields remain manual controller evidence: tag operation `manual-controller-action`, GitHub Release command result `not-run-by-product-code`, manual controller action required `true`, automation observed `false`.
- Provider launch, unsupported provider claims, generic shell, terminal, renderer command execution, frontend JSONL/session/provider reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, git write, release creation, public distribution, automatic worktree creation, and automatic next-version goal stay disabled.

## Recovery acceptance

The recovery drill accepts manual recovery for:

- missing `stableWorkbenchRelease.v1` or blocked source contracts;
- blocked release boundary state, including tag mismatch, draft/prerelease release, unexpected assets, target mismatch, early v61 tag/release, or open PRs;
- unavailable Workbench server, missing dependencies, or occupied local port;
- stale static assets and route source mismatch.

Recovery remains controller-owned. Workbench does not add a terminal, local shell control, arbitrary path input, local file picker, provider launch, tag/push/publish control, or GitHub Release control to recover from these states.

## Validation

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed on PR-4 branch. |
| `node --test tests/v60-stable-personal-workbench-release.test.js` | Passed: 7 tests, 7 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 120 tests, 120 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed: 1364 tests, 1364 passed. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed after staging PR-4 files. |

## Installer baseline note

v61 does not change the installer default. The current published Workbench baseline is v60, and v61 will add operator evidence after publication. v62 owns the decision to keep a fixed installer ref, move to v60 or v61, or introduce a manually advanced `latest-stable` ref.
