# v44.3 app contract and context supervisor closeout snapshot

Date: 2026-06-10
Timezone: Asia/Shanghai
Goal: `v44-3-app-contract-context-supervisor`
Snapshot branch: `codex/v44-3-pr5-closeout-snapshot`
Snapshot base: `26353f904937d8161302ca9fcf753f7d9dec7d11`

## State

v44.3 has the backend app contract, read-only API and CLI surface, session context adapters, and conservative policy/command-boundary projection needed for a future Workbench or app shell to read supervisor state without reading runner internals or transcript files directly.

This snapshot does not declare release readiness. It does not create a tag, publish a release, push a branch, run release closeout automation, or register any goal event.

## PR and commit record

The local history contains actual GitHub merge commits for the runbook and path-aware CI prep, then the PR-1 through PR-4 implementation sequence as linear commits in the integration worktree. No separate GitHub merge commits for PR-1 through PR-4 are present in this checkout.

| Scope | Commit record in this checkout | Evidence |
| --- | --- | --- |
| PR-0 runbook | `3197624` - Merge pull request #20 from `codex/v44-3-app-contract-context-runbook` | `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md` |
| PR-CI path-aware stage gates | `abd7e1f` - Merge pull request #21 from `codex/v44-3-pr-ci-path-aware-stage-gates` | `.github/workflows/ci.yml` |
| PR-1 app-facing contracts and fixtures | `cf7391c` implementation, `22c8355` review evidence, `6a5919c` main verification evidence | `docs/plans/v44-3-task-1-main-verification-evidence-2026-06-10.md` |
| PR-2 projection API and CLI | `91e3355` implementation, `14f6e08` review evidence, `3fb1781` main verification evidence | `docs/plans/v44-3-task-2-main-verification-evidence-2026-06-10.md` |
| PR-3 session hook runtime | `130a4fc` implementation, `bfa7967` review evidence, `8a15b9a` main verification evidence | `docs/plans/v44-3-task-3-main-verification-evidence-2026-06-10.md` |
| PR-4 context policy and command boundaries | `102b53a` implementation, `85d4835` review evidence, `26353f9` main verification evidence | `docs/plans/v44-3-task-4-main-verification-evidence-2026-06-10.md` |

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

This PR-5 snapshot is docs-only. Mutation, audit, doctor, provider CLI, real CLI, tag, push, publish, GitHub Release, and release closeout commands are intentionally outside this phase.

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

Commands intentionally not run for this PR-5 snapshot:

- `pnpm test:mutation:gate`
- `pnpm mcas doctor`
- audit commands
- provider CLI or real CLI commands
- daemon start or stop commands
- child dispatch commands
- goal event registration commands
- tag, push, publish, GitHub Release, or release closeout commands

## Remaining risks

Provider JSONL schema drift may keep some `sessionContext.v1` fields as `missing` until adapters are extended. That is the intended fallback, not a success signal.

The policy ordering is deliberately conservative. Gate blocks and incomplete confirm-required previews are evaluated before pending result checkpointing, and pending result or compact decisions are evaluated before drift recovery.

The Workbench has only a backend route allowlist update for this contract. A future UI PR still needs to decide how to present the read model without reintroducing direct ledger, event log, runner, or transcript reads.

The PR-1 through PR-4 entries in this local history are linear task commits, not separate GitHub merge commits in this checkout. If release notes need GitHub PR numbers for those scopes, collect them from GitHub before release packaging.

## Rollback path

To roll back v44.3 app-contract behavior while preserving earlier releases, revert the PR-4 policy commit range first, then PR-3 session-context runtime, then PR-2 API/CLI exposure, then PR-1 contract and fixtures. The route allowlist entry in `frontend/workbench/src/api/contracts.js` should be reverted with PR-2.

If only the snapshot is wrong, revert this document. It does not affect runtime behavior.

If CI path detection causes an unexpected skip or run, revert the PR-CI workflow change independently. That rollback does not require changing the supervisor contract code.
