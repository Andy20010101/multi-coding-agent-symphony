# v73 Multi-day Real-use Stabilization sessions batch 1

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v73-multi-day-real-use-stabilization`
Batch status: partial

This batch starts the multi-day evidence record. It does not complete the v73 gate.

## Batch Summary

| Field | Value |
| --- | --- |
| Recorded sessions in this batch | 2 |
| Covered local dates | 2026-06-15 |
| Consecutive-day gate | not ready |
| Real CLI-backed development task count | 0 |
| Real CLI smoke count | 1 |
| Baseline/release-ops sessions | 1 |
| Codex worker opt-in smoke | passed after sandbox recovery |
| Claude Code reviewer opt-in smoke | preflight blocked; real smoke not run |
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
| Result | Passed with recovery. PR #186 was merged, `main` was synchronized, Day 1 automation ran, and browser fallback returned Workbench HTML. This session does not count as a real CLI-backed task. |
| Failure or blocker | Combined Workbench API/shell/route smoke failed once: 132/133 tests passed and `tests/workbench-route-smoke.test.js` reported `/workbench/api/summary` returned 500 instead of 200. Starting `pnpm symphony console --host 127.0.0.1 --port 8765` inside the normal sandbox failed with `listen EPERM`. |
| Recovery step | Reran `node --test tests/workbench-route-smoke.test.js`; it passed 12/12. Restarted console with approved elevated local server permission, then verified `GET /workbench/desktop/` and `GET /api/summary`. |
| Terminal escape count | 1. The controller terminal stopped the local console with `Ctrl-C` after fallback verification. |
| Safe evidence refs | PR #186, merge commit `e45cdc32f58064ae2b4a6415a318b80d9c5763ab`, this file, and command summaries below. |
| Next action | Continue the next local date with the first real CLI-backed development or release-operations task. |

## Session v73-s02

| Field | Value |
| --- | --- |
| Session id | `v73-s02` |
| Local date | 2026-06-15 |
| Task title | Run Codex real CLI worker smoke and recover from sandbox failure |
| Task type | provider opt-in smoke / real CLI recovery |
| Entry path | controller terminal using `pnpm smoke:codex:real` |
| Result | Passed after recovery. Codex real CLI smoke invoked the real Codex CLI, completed with exit code 0, and verifier status `passed`. No files were modified. This is provider smoke evidence, not a counted real development task. |
| Failure or blocker | First run inside the managed sandbox failed with exit code 1. Codex CLI could not write `~/.codex/sqlite/state_5.sqlite` and failed to initialize the in-process app-server client with `Operation not permitted`. |
| Recovery step | Reran the same command with explicit non-sandbox approval. The rerun passed and produced sanitized real CLI proof output under the ignored `tmp/v73-real-cli-proofs/` directory. |
| Terminal escape count | 0. |
| Safe evidence refs | This file, PR #187 command summary, and the committed command/result summaries below. Local proof JSON files remain ignored and are not durable repository evidence refs. |
| Next action | Run a real CLI-backed development or release-operations task on the next local date, and resolve or explicitly accept the Claude Code reviewer smoke blocker. |

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
| `pnpm mcas doctor --real-cli --adapter codex --proof-dir tmp/v73-real-cli-proofs --timeout-ms 15000` | Passed. No model invocation. Codex CLI was available, version check and help check passed, release config existed, and `MCAS_RUN_REAL_CODEX` was reported as not enabled for actual smoke execution. |
| `MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:codex:real` inside the managed sandbox | Failed. The real Codex CLI started but could not write the Codex state database under `~/.codex/sqlite` and could not initialize the in-process app-server client because of sandbox permissions. |
| `MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:codex:real` with explicit non-sandbox approval | Passed. The real Codex CLI completed a read-only smoke, verifier status was `passed`, the check name was `codex-real-smoke`, and no files were modified. |
| `pnpm mcas doctor --real-cli --adapter claude-code --proof-dir tmp/v73-real-cli-proofs --timeout-ms 15000` | Failed without invoking a model. Claude Code CLI was available, version check and help check passed, release config selected model `deepseek-v4-pro` and provider `deepseek`, but Claude auth status reported provider `firstParty`; `MCAS_RUN_REAL_CLAUDE` was also not enabled. Real Claude smoke was not run. |

## Stability Notes

The combined Workbench test failure is recorded as real friction. The focused rerun passed, so the current evidence supports "recoverable transient failure" rather than a confirmed repeated product blocker. The next local date should rerun the same focused route smoke or the same combined command to see whether the 500 repeats.

The local console bind failure came from the managed sandbox, not product code. It still matters to the operator workflow because browser fallback needs a local listener. The recovery path is explicit approval for a local server process.

These sessions did not run `pnpm desktop:shell:build:local`; the next local date should prefer local package build/open evidence unless another real task has higher priority.

## Real CLI Task Rule

The operator clarified that v73 real tasks must exercise real CLIs. This batch keeps `v73-s01` as useful Day 1 stability evidence, but it does not count toward the real task gate because no gated real CLI worker or reviewer lane was invoked. `v73-s02` proves the Codex worker smoke path after sandbox recovery, but it is still a synthetic smoke, so it does not count as one of the 3-5 real development or release-operations tasks.

Starting with the next counted real work session, a counted real task must include one of these outcomes:

- a gated Codex real CLI lane passes or fails with a recorded blocker;
- a gated Claude Code real CLI lane passes or fails with a recorded blocker;
- the real CLI doctor blocks the planned lane with a concrete executable, auth, model, provider, gate, or network reason.

Local checks such as `pnpm workbench:build`, route smoke, browser fallback, and local package open remain required stability evidence, but they do not by themselves count as real tasks for v73.

Safe next-session command candidates:

```sh
pnpm mcas doctor --real-cli --adapter codex --require-gates --proof-dir tmp/v73-real-cli-proofs
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:harness:codex:real
pnpm mcas doctor --real-cli --adapter claude-code --require-gates --proof-dir tmp/v73-real-cli-proofs
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:claude:real
```

Do not copy raw provider output, raw model output, raw transcripts, local provider session paths, credentials, API keys, or `.jsonl` paths into repository docs.

## Next Scheduled Step

The next local date should do one real CLI-backed task and one repeatability check:

```text
real CLI-backed task
-> rerun Workbench route smoke or combined Workbench suite
-> run local app build/open if the operator is available
-> record v73-s03
```

Because `v73-s02` is already used for the Codex worker smoke, the next record should use the next session id. Do not run Claude Code real provider smoke until the provider/auth mismatch is resolved or explicitly accepted, the operator enables the matching env gate, and the operator accepts that the command may call a model provider.
