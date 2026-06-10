# v44.3 app contract and context supervisor closeout snapshot

Date: 2026-06-10
Timezone: Asia/Shanghai
Goal: `v44-3-app-contract-context-supervisor`
Snapshot branch: `codex/v44-3-pr5-closeout-snapshot`
Snapshot base: `26353f904937d8161302ca9fcf753f7d9dec7d11`
Release-gate evidence refresh base: `916364a0b59c67d250766a06635c572e6dcdb5c2`

## State

v44.3 has the backend app contract, read-only API and CLI surface, session context adapters, and conservative policy/command-boundary projection needed for a future Workbench or app shell to read supervisor state without reading runner internals or transcript files directly.

The original PR-5 snapshot did not declare release readiness. This refreshed snapshot records the PR-5 merge, the release-gate static bundle fix, and the local release-gate command results needed for controlled `symphony goal gate` registration. It does not create a tag, publish a release, create a GitHub Release, or run release closeout automation.

## PR and commit record

GitHub PR delivery has merged PR-0, PR-CI, and PR-1 through PR-5 into `main`. Release-gate verification then found that `pnpm workbench:build` refreshed the committed Workbench static bundle, so PR #27 synced the generated asset before release gate registration.

| Scope | GitHub PR | Branch / delivered head | Merge commit | Evidence |
| --- | --- | --- | --- | --- |
| PR-0 runbook | #20 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/20` | `codex/v44-3-app-contract-context-runbook` | `3197624` | `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md` |
| PR-CI path-aware stage gates | #21 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/21` | `codex/v44-3-pr-ci-path-aware-stage-gates` | `abd7e1f` | `.github/workflows/ci.yml` |
| PR-1 app-facing contracts and fixtures | #22 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/22` | `codex/v44-3-pr1-app-facing-contracts-fixtures` / `6a5919c` | `4799e687673fda4700334a9dfd98eccc81fba22c` | `docs/plans/v44-3-task-1-main-verification-evidence-2026-06-10.md` |
| PR-2 projection API and CLI | #23 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/23` | `codex/v44-3-pr2-projection-api-cli` / `1fc6914` | `e339343ddae7f116b479763ce63ff8254e3e195e` | `docs/plans/v44-3-task-2-main-verification-evidence-2026-06-10.md` |
| PR-3 session hook runtime | #24 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/24` | `codex/v44-3-pr3-session-hook-runtime` / `973bc70` | `13815f1f0743c2c853f85849427455b57bac14a2` | `docs/plans/v44-3-task-3-main-verification-evidence-2026-06-10.md` |
| PR-4 context policy and command boundaries | #25 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/25` | `codex/v44-3-pr4-context-policy-command-boundaries` / `fee0ece` | `9283b365514394fc1443c184460b2c2cef90f331` | `docs/plans/v44-3-task-4-main-verification-evidence-2026-06-10.md` |
| PR-5 closeout snapshot | #26 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/26` | `codex/v44-3-pr5-closeout-snapshot` / `26ea94f` | `d962cf653c169053812218a857d8858bee1ffdad` | this document |
| Release-gate static bundle sync | #27 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/27` | `codex/v44-3-workbench-static-sync` / `90cddf8` | `916364a0b59c67d250766a06635c572e6dcdb5c2` | `src/symphony/workbench-static/index.html`; `src/symphony/workbench-static/assets/index-Ke5XVraX.js` |

PR-2 includes delivery commit `1fc6914`, which updates `tests/workbench-shell.test.js` so the static Workbench API allowlist includes the new supervisor routes. PR-3 and PR-4 include merge commits from latest `main` so the stacked branches do not reverse that fix.

## Final contract objects

`goal-supervisor-app-read-model.v1` is the app-facing contract. It is built by `src/symphony/goal-supervisor/app-read-model.js` and composed from backend contracts by `src/symphony/goal-supervisor/app-read-model-pipeline.js`.

Top-level fields:

- `contractName`, `contractVersion`, `readOnly`, `willMutate`, `generatedAt`
- `goalSnapshot`
- `goalTimeline`
- `activeLease`
- `pendingResult`
- `currentGate`
- `recommendedNextAction`
- `ownership`
- `contextStatus`
- `commandBoundary`

`sessionContext.v1` is the normalized read-only session context produced by `src/symphony/goal-supervisor/session-context.js`. It reports provider summaries, transcript availability, exchange count, latest tool call, latest turn state, token usage, context utilization, stale or missing transcript state, bounded result-block evidence, and drift markers.

`commandBoundary` is projected by `src/symphony/goal-supervisor/policy.js`. The default state is `disabled`, `executionAvailable` is always `false`, and `copyOnly` is always `true`. The blocked command families include provider CLI, real CLI, generic shell, daemon launch, child dispatch, goal ledger writes, event log writes, mutation gate, audit, tag, push release, publish release, GitHub Release, and release closeout.

The policy layer can return `continue`, `checkpoint`, `compact`, `open-handoff-thread`, `wait`, `recover-drift`, or `block`. It prefers checkpointing pending results and blocking unsafe or missing context over duplicate dispatch.

## API and CLI routes

Read-only API routes:

- `GET /api/goals/latest/supervisor`
- `GET /api/goals/<goal-id>/supervisor`

The API rejects invalid goal refs and does not accept write methods for these routes.

Read-only CLI mirror:

- `pnpm --silent symphony supervisor status --goal <goal-id|latest> --json`

The CLI prints JSON only. It rejects write-flow, release, output-file, and alternate-format flags such as `--confirm`, `--dry-run`, `--allow-closeout`, `--output`, and `--format`.

Workbench change:

- `frontend/workbench/src/api/contracts.js` now includes the supervisor read-model route in the backend contract allowlist. There is no new Workbench panel implementation in v44.3.

## Session hook boundaries

The session runtime reads Codex JSONL files from `~/.codex/sessions/YYYY/MM/DD/*.jsonl` and Claude JSONL files from `~/.claude/projects/**/*.jsonl`.

Allowed output is normalized status only: exchange counts, timestamps, role boundaries, tool-call status, token usage, context utilization, stale/missing transcript markers, and whether a bounded result block is present.

The session runtime does not write `.symphony`, write the goal ledger, write the goal event log, consume result escrow, register events, launch provider CLIs, start or stop the daemon, dispatch child threads, or expose raw transcript text.

Unknown provider fields stay `missing`.

## CI and mutation gate state

`.github/workflows/ci.yml` now has path-aware detection for docs-only, planning-only, code, frontend renderer, app contract, supervisor contract, workflow/package, contract-impacting, build, doctor, mutation, and real CLI paths.

Current policy:

- Docs-only and planning-only changes run the docs lane with `git diff --check`.
- Code-focused changes run install, `pnpm check`, selected focused tests, and `git diff --check`.
- Workbench build runs only when frontend renderer paths changed.
- Mutation stage runs only by manual `workflow_dispatch` input or by a mutation label on a contract-impacting pull request.
- Real CLI remains opt-in through workflow input or repository variable.

The PR-5 snapshot was docs-only. PR #27 was limited to the Vite-generated Workbench static JS bundle and HTML entrypoint reference. Mutation, audit, doctor, provider CLI, real CLI, tag, release push, publish, GitHub Release, and release closeout commands remain outside this phase.

PR delivery CI status:

| Scope | CI result |
| --- | --- |
| PR-1 #22 | `changes`, `code-focused`, and `verify` passed; `build`, `docs`, `mutation-stage`, and `real-cli` were skipped by path policy. |
| PR-2 #23 | `changes`, `code-focused`, `build`, and `verify` passed after the allowlist test fix; `docs`, `mutation-stage`, and `real-cli` were skipped by path policy. |
| PR-3 #24 | `changes`, `code-focused`, and `verify` passed; `build`, `docs`, `mutation-stage`, and `real-cli` were skipped by path policy. |
| PR-4 #25 | `changes`, `code-focused`, and `verify` passed; `build`, `docs`, `mutation-stage`, and `real-cli` were skipped by path policy. |
| PR-5 #26 | `changes`, `docs`, and `verify` passed; `build`, `code-focused`, `mutation-stage`, and `real-cli` were skipped by path policy. |
| Release-gate fix #27 | `changes`, `code-focused`, and `verify` passed; `build`, `docs`, `mutation-stage`, and `real-cli` were skipped by path policy. |

## Verification record

The prior main-verification evidence records these checks:

| Scope | Focused checks recorded |
| --- | --- |
| PR-1 | `node --test tests/v44-goal-supervisor-app-read-model.test.js`; `node --test tests/v44-goal-supervisor-*.test.js`; `pnpm check`; `git diff --check`; fixture replay probe |
| PR-2 | `node --test tests/v44-goal-supervisor-app-read-model.test.js`; `node --test tests/workbench-api-client.test.js`; `node --test tests/v44-goal-supervisor-*.test.js`; `pnpm check`; `git diff --check`; API and CLI probes |
| PR-3 | `node --test tests/v44-3-goal-supervisor-session-context.test.js`; `node --test tests/v44-goal-supervisor-app-read-model.test.js`; `node --test tests/workbench-api-client.test.js`; `pnpm check`; `git diff --check`; unrelated-transcript leak probe |
| PR-4 | `node --test tests/v44-goal-supervisor-app-read-model.test.js`; `node --test tests/v44-3-goal-supervisor-session-context.test.js`; `node --test tests/workbench-api-client.test.js`; `pnpm check`; `git diff --check`; boundary scan |

Commands run for this PR-5 snapshot:

- `pwd && rg --files -g 'AGENTS.md' -g '*runbook*' -g '*controller*' -g 'package.json' -g 'README*'`
- `git status --short --branch`
- `sed -n '1,240p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`
- `sed -n '220,430p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`
- `sed -n '1,220p' package.json`
- `git log --oneline --decorate -5`
- `git log --oneline --decorate --reverse 720348f64ed4ad4bfd4518e7d16e252ac88f77a4..HEAD`
- `git diff --name-status 720348f64ed4ad4bfd4518e7d16e252ac88f77a4..HEAD`
- `rg -n "goal-supervisor-app-read-model|latest/supervisor|supervisor status|sessionContext|commandBoundary|buildGoalSupervisorAppReadModel|buildGoalSupervisorPolicy" src/symphony/goal-supervisor src/symphony/console.js scripts/symphony.js frontend/workbench/src/api/contracts.js tests/v44-goal-supervisor-app-read-model.test.js tests/v44-3-goal-supervisor-session-context.test.js tests/workbench-api-client.test.js`
- `sed -n '1,260p' .github/workflows/ci.yml`
- `sed -n '1,260p' src/symphony/goal-supervisor/app-read-model.js`
- `sed -n '1,260p' src/symphony/goal-supervisor/policy.js`
- `sed -n '1,240p' src/symphony/goal-supervisor/session-context.js`
- `sed -n '1,140p' frontend/workbench/src/api/contracts.js`
- `sed -n '2500,2660p' src/symphony/console.js`
- `sed -n '450,520p' scripts/symphony.js`

Delivery coordinator commands run after PR-1 through PR-4 were merged:

- `git status --short --branch`
- `git rev-parse HEAD origin/main`
- `pnpm --silent symphony goal-status --goal v44-3-app-contract-context-supervisor --json`
- `pnpm --silent symphony goal next --goal v44-3-app-contract-context-supervisor --json`
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs status --goal v44-3-app-contract-context-supervisor`
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs plan --goal v44-3-app-contract-context-supervisor`
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon-status --goal v44-3-app-contract-context-supervisor`
- `gh pr checks 22 --watch --interval 10`
- `gh pr checks 23 --watch --interval 10`
- `gh pr checks 24 --watch --interval 10`
- `gh pr checks 25 --watch --interval 10`
- `gh pr merge 22 --merge`
- `gh pr merge 23 --merge`
- `gh pr merge 24 --merge`
- `gh pr merge 25 --merge`
- `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js tests/v44-goal-supervisor-app-read-model.test.js`
- `node --test tests/v44-3-goal-supervisor-session-context.test.js tests/v44-goal-supervisor-app-read-model.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`
- `node --test tests/v44-goal-supervisor-app-read-model.test.js tests/v44-3-goal-supervisor-session-context.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check origin/main...HEAD`

Release-gate refresh commands run after PR #26 and PR #27 were merged:

- `gh pr view 26 --json state,mergedAt,mergeCommit,headRefName,title,url`
- `gh pr view 27 --json state,mergedAt,mergeCommit,headRefName,title,url`
- `gh pr checks 26`
- `gh pr checks 27`
- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`
- `git status --short --branch`
- `gh pr view 27 --json state,mergedAt,mergeCommit,title,url`

Commands intentionally not run for PR-5 or the release-gate refresh:

- `pnpm test:mutation:gate`
- `pnpm mcas doctor`
- audit commands
- provider CLI or real CLI commands
- daemon start or stop commands
- child dispatch commands
- tag, publish, GitHub Release, or release closeout commands

## Remaining risks

Provider JSONL schema drift may keep some `sessionContext.v1` fields as `missing` until adapters are extended. That is the intended fallback, not a success signal.

The policy ordering is deliberately conservative. Gate blocks and incomplete confirm-required previews are evaluated before pending result checkpointing, and pending result or compact decisions are evaluated before drift recovery.

The Workbench has only a backend route allowlist update and regenerated static bundle for this contract. A future UI PR still needs to decide how to present the read model without reintroducing direct ledger, event log, runner, or transcript reads.

## Rollback path

To roll back v44.3 app-contract behavior while preserving earlier releases, revert merge commit `9283b365514394fc1443c184460b2c2cef90f331` first, then `13815f1f0743c2c853f85849427455b57bac14a2`, then `e339343ddae7f116b479763ce63ff8254e3e195e`, then `4799e687673fda4700334a9dfd98eccc81fba22c`. The route allowlist entry in `frontend/workbench/src/api/contracts.js` should be reverted with PR-2.

If only the snapshot is wrong, revert this document. It does not affect runtime behavior.

If CI path detection causes an unexpected skip or run, revert the PR-CI workflow change independently. That rollback does not require changing the supervisor contract code.
