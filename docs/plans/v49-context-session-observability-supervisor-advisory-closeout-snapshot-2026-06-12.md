# v49 Context Session Observability and Supervisor Advisory closeout snapshot

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v49-context-session-observability-supervisor-advisory`
Baseline tag: `v48`
Pre-closeout main commit: `9bd2f72f944591394b54a5d4cef4b958916c4d12`

## Final state

v49 adds a read-only context and session advisory surface for the goal supervisor.

The shipped scope is:

- backend-owned `sessionSourceInventory.v1` for bounded Codex and Claude session source availability;
- backend-owned `contextAdvisory.v1` for normalized transcript availability, token usage, context utilization, latest tool call, latest turn state, result-block evidence, blocked fields, and degraded reasons;
- backend-owned `threadContinuationDecision.v1` for advisory `continue`, `compact`, `new-thread`, `wait`, `blocked`, `checkpoint`, and `recover-drift` decisions;
- app read-model projection of the v49 contracts;
- Workbench supervisor display for session source inventory, context advisory, thread continuation decision, and disabled/copy-only command boundary.

v49 does not dispatch children, compact transcripts, create threads, register results, consume result escrow, write goal state, write ledgers, write event logs, write `.symphony`, start providers, add execution buttons, add a terminal action, add file or directory pickers, read JSONL files from the frontend, scan local provider folders from the frontend, write git state, create tags, publish, create GitHub Releases, or automate release work.

## Reconcile before PR-5 edits

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## codex/v49-closeout-tag-prep...origin/main`; no local file changes before docs edits in the independent worktree. |
| `git fetch origin main --tags --prune` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -10 origin/main` | `9bd2f72` was `origin/main`, `origin/HEAD`, local `main`, and the PR-5 branch start; it merged PR #60. The next merge commits were PR #59 at `0c2cfc6`, PR #58 at `836b778`, and PR #57 at `4da45f1`. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft,mergeable` | `[]` |
| `git tag --list 'v48'` | `v48` |
| `git rev-parse v48^{}` | `e07f7bd2c3d80e53cdfff3a65f5cccdf9fa16cad` |
| `gh release view v48 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Release `v48: Project Launcher and Recent Projects`, URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v48`, not draft, not prerelease, published at `2026-06-12T01:13:30Z`, assets `[]`, targetCommitish `main`. |

Top of `origin/main` at reconcile:

```text
9bd2f72 Merge pull request #60 from Andy20010101/codex/v49-workbench-context-advisory-display
aab659c Add v49 Workbench advisory display
0c2cfc6 Merge pull request #59 from Andy20010101/codex/v49-supervisor-advisory
ab0ac0a Block local source refs for continuation compaction
668c504 Fix thread continuation durable evidence guards
77a78f2 Add thread continuation advisory
836b778 Merge pull request #58 from Andy20010101/codex/v49-context-utilization-projection
bac0403 Stop inferring context advisory totals
c6ca755 Add context advisory projection
4da45f1 Merge pull request #57 from Andy20010101/codex/v49-session-source-inventory
```

## PR scope record

| Scope | GitHub PR | Branch | Merge commit | Merged at | Validation evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook and contract direction | #56 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/56` | `codex/v49-context-session-observability-runbook` | `2c58280c07e22f4ae4e0e0fbf6024b1b766d8c96` | 2026-06-12T01:41:30Z | PR body records `git status --short --branch`, `git diff --check`, `git diff --cached --check`, and `git diff --name-status main...HEAD` showing only `docs/plans/v49-context-session-observability-supervisor-advisory-runbook-2026-06-12.md`. |
| PR-1 session source inventory | #57 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/57` | `codex/v49-session-source-inventory` | `4da45f142895a0b22568ca48bf782beee2d97cc3` | 2026-06-12T02:17:25Z | PR body records `node --test tests/v44-3-goal-supervisor-session-context.test.js`, `pnpm check`, and `git diff --check`. The body states coverage for available/readable mapping, missing roots, stale files, unreadable files, degraded invalid JSONL, failed root stat, scan caps, and raw transcript non-exposure. |
| PR-2 context utilization projection | #58 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/58` | `codex/v49-context-utilization-projection` | `836b778817a076a060c1954541cd5947112292a3` | 2026-06-12T02:38:17Z | PR body records `node --test tests/v44-3-goal-supervisor-session-context.test.js`, `pnpm check`, and `git diff --check`. The body states coverage for advisory output, missing token/context preservation, raw content safety, context band boundaries, degraded reason aggregation, and read-only boundaries. |
| PR-3 supervisor advisory | #59 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/59` | `codex/v49-supervisor-advisory` | `0c2cfc6bafb47c86d356efa329ee94a0909936a3` | 2026-06-12T03:08:20Z | PR body records `node --test tests/v44-3-goal-supervisor-session-context.test.js`, `node --test tests/v44-goal-supervisor-app-read-model.test.js`, `pnpm check`, `git diff --check`, and `git diff --cached --check`. The body states tests covered continue, compact, new-thread, wait, blocked, checkpoint, recover-drift, and raw-content filtering. |
| PR-4 Workbench/App read-only display | #60 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/60` | `codex/v49-workbench-context-advisory-display` | `9bd2f72f944591394b54a5d4cef4b958916c4d12` | 2026-06-12T03:45:08Z | PR body records `node --test tests/v44-3-goal-supervisor-session-context.test.js`, `node --test tests/v44-goal-supervisor-app-read-model.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`, `pnpm workbench:build`, `pnpm check`, `git diff --check`, and browser verification at `http://127.0.0.1:5175/workbench/supervisor/`. The body records that v49 panels rendered, command boundary showed disabled/copy-only state, and the page had 0 buttons and 0 inputs. |

## Generated Workbench assets

PR #60 refreshed the generated Workbench static output after Workbench source changes.

| Asset change | Evidence |
| --- | --- |
| `src/symphony/workbench-static/assets/index-U1xgXD_g.js` was replaced by `src/symphony/workbench-static/assets/index-BsPyBVyS.js`. | `git show --stat --oneline --decorate --no-renames origin/main --` on `9bd2f72`. |
| `src/symphony/workbench-static/assets/index-bXA_-d3y.css` was replaced by `src/symphony/workbench-static/assets/index-DgptZOwY.css`. | Same stat output. |
| `src/symphony/workbench-static/index.html` changed to point at the refreshed generated assets. | Same stat output. |

PR-5 does not regenerate Workbench assets. It only records closeout, acceptance, and release-prep documentation.

## PR-5 validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v44-3-goal-supervisor-session-context.test.js` | Passed: 30 tests, 0 failures. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 7 tests, 0 failures. |
| `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js` | Passed: 93 tests, 0 failures. |
| `pnpm install --frozen-lockfile` | Passed after the first Workbench shell/API attempt failed in the independent worktree with `ERR_MODULE_NOT_FOUND` for `react`; lockfile was already up to date. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed after adding the new docs as intent-to-add. |
| `git diff --cached --check` | Passed after staging the docs-only changes. |

## Known residual risks

Session inventory reports backend-visible provider session source state. It does not repair missing roots, unreadable files, invalid JSONL, stale session files, or provider-specific transcript gaps.

Context advisory preserves missing token totals and missing context ratios. A missing ratio remains `unknown`; reviewers should not treat it as healthy capacity.

`threadContinuationDecision.v1` can return `compact` and `new-thread`, but those values are advice only. A later version that performs compaction or thread creation needs a separate runbook, confirmation fields, tests, rollback path, and audit evidence.

Workbench displays v49 state from backend contracts. It does not browse local provider folders, open terminals, run commands, start providers, register goal events, create tags, publish releases, or create GitHub Releases.

Generated Workbench assets are source-derived. Future changes under `frontend/workbench/` should run `pnpm workbench:build` and review only the generated asset diff tied to the source change.

## Rollback path

If PR #56 is wrong, revert `2c58280c07e22f4ae4e0e0fbf6024b1b766d8c96` and replace the runbook before using it as release documentation.

If PR #57 inventory reports misleading source state or exposes provider content, revert `4da45f142895a0b22568ca48bf782beee2d97cc3`. The app should continue without v49 inventory rather than scanning from the frontend.

If PR #58 context advisory exposes raw transcript content, invents token numbers, or treats missing fields as successful capacity checks, revert `836b778817a076a060c1954541cd5947112292a3`.

If PR #59 advisory crosses into execution, revert `0c2cfc6bafb47c86d356efa329ee94a0909936a3`. Keep context advisory read-only.

If PR #60 makes advice look actionable or adds execution controls, revert `9bd2f72f944591394b54a5d4cef4b958916c4d12`. If the revert touches generated Workbench assets, rerun `pnpm workbench:build` from the intended source state and commit only the tied asset refresh.

If PR-5 text overstates shipped behavior, revert the PR-5 documentation commit and replace it before tagging.

## Follow-up boundary

Any later action path for dispatch, compaction, thread creation, result registration, provider startup, frontend file selection, terminal execution, git write, tag, publish, or GitHub Release creation needs its own scoped plan. v49 only ships read-only session observability and advisory display.
