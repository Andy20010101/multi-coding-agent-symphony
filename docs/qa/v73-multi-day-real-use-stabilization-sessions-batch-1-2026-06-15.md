# v73 Multi-day Real-use Stabilization sessions batch 1

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v73-multi-day-real-use-stabilization`
Batch status: partial

This batch starts the multi-day evidence record. It does not complete the v73 gate.

## Batch Summary

| Field | Value |
| --- | --- |
| Counted sessions in this batch | 1 |
| Covered local dates | 2026-06-15 |
| Consecutive-day gate | not ready |
| Real task count | 1 |
| Codex worker opt-in smoke | not run |
| Claude Code reviewer opt-in smoke | not run |
| Browser fallback | passed after sandbox recovery |
| Local packaged app open | not run in this session |
| Repeated product blocker | not observed |
| Personal real-use MVP | not proven |

## Session v73-s01

| Field | Value |
| --- | --- |
| Session id | `v73-s01` |
| Local date | 2026-06-15 |
| Task title | Merge PR-1 current-state docs and start PR-2 stability automation |
| Task type | release-operations / documentation state repair / stability baseline |
| Entry path | controller terminal |
| Result | Passed with recovery. PR #186 was merged, `main` was synchronized, Day 1 automation ran, and browser fallback returned Workbench HTML. |
| Failure or blocker | Combined Workbench API/shell/route smoke failed once: 132/133 tests passed and `tests/workbench-route-smoke.test.js` reported `/workbench/api/summary` returned 500 instead of 200. Starting `pnpm symphony console --host 127.0.0.1 --port 8765` inside the normal sandbox failed with `listen EPERM`. |
| Recovery step | Reran `node --test tests/workbench-route-smoke.test.js`; it passed 12/12. Restarted console with approved elevated local server permission, then verified `GET /workbench/desktop/` and `GET /api/summary`. |
| Terminal escape count | 1. The controller terminal stopped the local console with `Ctrl-C` after fallback verification. |
| Safe evidence refs | PR #186, merge commit `e45cdc32f58064ae2b4a6415a318b80d9c5763ab`, this file, and command summaries below. |
| Next action | Continue Day 2 with another real task. Prefer local app build/open or repeated browser fallback; do not run real provider smoke without explicit opt-in. |

## Commands and Results

| Command | Result |
| --- | --- |
| `gh pr view 186 --json number,title,state,isDraft,mergeable,reviewDecision,statusCheckRollup,url` | Passed. PR #186 was open, non-draft, mergeable, and CI checks were green before merge. |
| `gh pr merge 186 --merge` | Passed. PR #186 merged at 2026-06-15T07:01:49Z with merge commit `e45cdc32f58064ae2b4a6415a318b80d9c5763ab`. |
| `git fetch origin main --prune` | Passed. `origin/main` advanced from `dc1b645` to `e45cdc3`. |
| `git switch main` | Passed. |
| `git merge --ff-only origin/main` | Passed. Local `main` fast-forwarded to `e45cdc3`. |
| `git status --short --branch` | Passed. `## main...origin/main`. |
| `git rev-list --left-right --count main...origin/main` | Passed. `0 0`. |
| `gh pr list --state open --limit 20 --json number,title,headRefName,baseRefName,isDraft,mergeable,reviewDecision` | Passed. Returned `[]`. |
| `git show-ref --tags -d \| rg 'refs/tags/v72\|refs/tags/v73'` | Passed. `v72` tag exists and dereferences to `cdde20c20931a4e002b184246ad7fd3585fa0979`; no `v73` tag. |
| `gh release view v72 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Passed. v72 release exists, non-draft, non-prerelease, assets `[]`, targetCommitish `main`. |
| `gh release view v73 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed as expected with `release not found`; v73 release has not been created. |
| `pnpm workbench:build` | Passed. |
| `node --test tests/v72-one-week-dogfood-stabilization.test.js` | Passed: 6 tests, 6 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Failed once: 132 tests passed, 1 failed. The failing test was `tests/workbench-route-smoke.test.js`, `/workbench/api/summary` returned 500 instead of 200 during the traversal probe case. |
| `node --test tests/workbench-route-smoke.test.js` | Passed on focused rerun: 12 tests, 12 passed. |
| `pnpm check` | Passed. |
| `pnpm symphony console --host 127.0.0.1 --port 8765` | Failed inside the normal sandbox with `listen EPERM: operation not permitted 127.0.0.1:8765`. |
| `pnpm symphony console --host 127.0.0.1 --port 8765` with approved elevated local server permission | Passed. Console reported read-only safety and `Status: listening`. |
| `curl -fsS http://127.0.0.1:8765/workbench/desktop/` | Passed. Returned Workbench HTML. |
| `curl -fsS http://127.0.0.1:8765/api/summary` | Passed. Returned `symphony.console-snapshot` JSON. |

## Stability Notes

The combined Workbench test failure is recorded as real friction. The focused rerun passed, so the current evidence supports "recoverable transient failure" rather than a confirmed repeated product blocker. Day 2 should rerun the same focused route smoke or the same combined command to see whether the 500 repeats.

The local console bind failure came from the managed sandbox, not product code. It still matters to the operator workflow because browser fallback needs a local listener. The recovery path is explicit approval for a local server process.

This session did not run `pnpm desktop:shell:build:local`; Day 2 should prefer local package build/open evidence unless another real task has higher priority.

## Next Scheduled Step

Day 2 should do one real task and one repeatability check:

```text
real task
-> rerun Workbench route smoke or combined Workbench suite
-> run local app build/open if the operator is available
-> record v73-s02
```

Do not run Codex or Claude Code real provider smoke until the operator explicitly enables the matching env gate.
