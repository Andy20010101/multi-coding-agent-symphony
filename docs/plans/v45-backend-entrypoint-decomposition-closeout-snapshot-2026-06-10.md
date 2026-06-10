# v45 Backend entrypoint decomposition closeout snapshot

Date: 2026-06-10
Timezone: Asia/Shanghai
Goal: `v45-backend-entrypoint-decomposition`
Snapshot branch: `codex/v45-pr5-closeout-snapshot`
Snapshot base: `7566152f6ce392a94d707bb35675b993114dd61a`

## Final state

v45 split backend HTTP helper, route, service, and CLI dispatch code out of the two compatibility entrypoints:

- `src/symphony/console.js`
- `scripts/symphony.js`

Those entrypoints remain in place for existing imports and package scripts. PR-5 does not move more code, add routes, change CLI behavior, or refresh static Workbench assets.

v45 did not change `goal-supervisor-app-read-model.v1`, did not add Workbench command execution, did not change supervisor kernel semantics, and did not run or prepare tag, publish, GitHub Release, or release closeout work.

## Sync record

Commands run before implementation:

- `git status -sb`: `## HEAD (no branch)`
- `git rev-parse --abbrev-ref HEAD`: `HEAD`
- `git rev-parse HEAD`: `7566152f6ce392a94d707bb35675b993114dd61a`
- `git fetch origin`: completed with no output
- `git rev-parse origin/main`: `7566152f6ce392a94d707bb35675b993114dd61a`
- `gh pr list --state open --search "v45 PR-5 OR backend entrypoint decomposition closeout OR v45 closeout snapshot OR v45-pr5" --json number,title,headRefName,url,isDraft,mergeStateStatus,updatedAt`: `[]`
- `git branch --list 'codex/v45*'`:

```text
+ codex/v45-pr1-console-http-foundation
+ codex/v45-pr2-console-route-registry
+ codex/v45-pr3-console-services
+ codex/v45-pr4-cli-dispatcher
```

The worktree and `origin/main` both started at the PR-4 merge commit. The only matching local branches were the completed PR-1 through PR-4 branches, so this PR created `codex/v45-pr5-closeout-snapshot` from `origin/main`.

## Merged PR record

| Scope | GitHub PR | Branch | Merge commit | Merged at |
| --- | --- | --- | --- | --- |
| PR-0 runbook | #35 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/35` | `codex/v45-backend-entrypoint-decomposition-runbook` | `85017a6e9ce268aa866c9b213110727ef52d961d` | 2026-06-10T09:49:24Z |
| PR-1 console HTTP foundation | #36 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/36` | `codex/v45-pr1-console-http-foundation` | `057be81ea603bc6e3a94621276d8b7e5da969f45` | 2026-06-10T10:24:32Z |
| PR-2 console route registry and app-facing routes | #37 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/37` | `codex/v45-pr2-console-route-registry` | `465e584bd76137a7d7fdaa4c208999935168c190` | 2026-06-10T11:52:51Z |
| PR-3 console services | #38 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/38` | `codex/v45-pr3-console-services` | `6cf3d5b32db28007e888a1d08265ff9211047538` | 2026-06-10T12:23:10Z |
| PR-4 CLI dispatcher | #39 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/39` | `codex/v45-pr4-cli-dispatcher` | `7566152f6ce392a94d707bb35675b993114dd61a` | 2026-06-10T13:12:56Z |

## Files created by v45

The list below comes from `git diff --name-status 62a2721b509d3f246a7296f87141feaa974a9adc..HEAD`.

Top-level console modules:

- `src/symphony/console/errors.js`
- `src/symphony/console/index.js`
- `src/symphony/console/request.js`
- `src/symphony/console/response.js`
- `src/symphony/console/route-registry.js`
- `src/symphony/console/server.js`
- `src/symphony/console/static-workbench.js`

Console route modules:

- `src/symphony/console/routes/goals.js`
- `src/symphony/console/routes/readiness.js`
- `src/symphony/console/routes/summary.js`

Console service modules:

- `src/symphony/console/services/console-readiness.js`
- `src/symphony/console/services/console-snapshot.js`
- `src/symphony/console/services/goal-supervisor-service.js`
- `src/symphony/console/services/safe-artifact-preview-service.js`

CLI modules:

- `src/symphony/cli/dispatcher.js`
- `src/symphony/cli/errors.js`
- `src/symphony/cli/index.js`
- `src/symphony/cli/output.js`

CLI command modules:

- `src/symphony/cli/commands/artifacts.js`
- `src/symphony/cli/commands/goal.js`
- `src/symphony/cli/commands/status.js`
- `src/symphony/cli/commands/supervisor.js`

Documentation:

- `docs/plans/v45-backend-entrypoint-decomposition-runbook-2026-06-10.md`
- `docs/plans/v45-backend-entrypoint-decomposition-closeout-snapshot-2026-06-10.md`

## Entrypoint line counts

Command:

```text
wc -l src/symphony/console.js scripts/symphony.js
```

Result:

```text
    9787 src/symphony/console.js
    6817 scripts/symphony.js
   16604 total
```

## Stable API paths and CLI commands

API paths kept stable through v45:

- `GET /api/goals/latest/supervisor`
- `GET /api/goals/<goal-id>/supervisor`
- `GET /api/summary`
- `GET /api/readiness`
- `GET /api/health`

CLI commands kept stable through v45:

- `pnpm --silent symphony status --json`
- `pnpm --silent symphony artifacts --json`
- `pnpm --silent symphony goal-status --goal v19-fixture --json`
- `pnpm --silent symphony supervisor status --goal v19-fixture --json`

The Workbench API test suite still covers the approved read-only route list and the supervisor projection. The exact `goal-status --goal v19-fixture` smoke could not produce a ledger in this isolated worktree because `.symphony` managed goal state is absent; it returned the existing JSON usage error shape with exit code 64 and message `goal not found`. No fixture state was created for this PR.

## Checks run

| Command | Result |
| --- | --- |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/symphony-cli.test.js` | First run failed before `tests/workbench-shell.test.js` loaded because `react` was not installed in this worktree. API and CLI tests passed before that loader failure. |
| `pnpm install --frozen-lockfile` | Passed. Installed dependencies from the existing lockfile and did not update the lockfile. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/symphony-cli.test.js` | Passed after dependency install. Result: 139 tests passed. |
| `pnpm check` | Passed. |
| `pnpm workbench:build` | Passed. Produced the same tracked static Workbench files; `git status -sb` stayed clean after the build. |
| `pnpm --silent symphony status --json` | Passed. Returned `contractName: "symphony.product-summary"`, `status: "no-runs"`, and read-only safety fields. |
| `pnpm --silent symphony artifacts --json` | Passed. Returned `contractName: "symphony.product-summary"`, `status: "missing"`, and read-only safety fields. |
| `pnpm --silent symphony goal-status --goal v19-fixture --json` | Returned exit code 64 with JSON message `goal not found` because `.symphony` managed goal state is absent in this worktree. |
| `pnpm --silent symphony supervisor status --goal v19-fixture --json` | Passed. Returned `contractName: "goal-supervisor-app-read-model.v1"`, `contractVersion: 1`, `readOnly: true`, and `willMutate: false`. |
| `git diff --check` | Passed. |

Commands intentionally not run:

- mutation gate commands
- audit commands
- provider CLI or real CLI commands
- daemon start or stop commands
- child dispatch commands
- tag, publish, GitHub Release, or release closeout commands

## Static Workbench assets

`pnpm workbench:build` completed and did not leave tracked changes under `src/symphony/workbench-static/`. PR-5 therefore does not include generated static Workbench assets.

## Known risks

The decomposition leaves the compatibility entrypoints in place, but the code is now split across more modules. Future changes need to follow the new route, service, and CLI command ownership instead of reintroducing large blocks into `src/symphony/console.js` or `scripts/symphony.js`.

The exact `goal-status --goal v19-fixture` smoke depends on managed `.symphony` state that is not present in this isolated worktree. The supervisor status fixture route still works and returns `goal-supervisor-app-read-model.v1`, but a future handoff that needs the ledger view should run the command from a checkout with the managed state directory available or pass an explicit `--state-dir`.

Workbench route stability is covered by tests and by the unchanged route list. PR-5 did not start a live Workbench server because the closeout scope was documentation plus command verification.

## Rollback path

PR-5: revert this closeout snapshot. No runtime code or static assets are changed in this PR.

PR-4: revert PR #39 to restore direct command dispatch in `scripts/symphony.js`. Keep later fixes only if they are independent of the dispatcher split.

PR-3: revert PR #38 to put service assembly back into the previous route or entrypoint locations.

PR-2: revert PR #37 to restore app-facing route handling inside `src/symphony/console.js`.

PR-1: revert PR #36 to move HTTP helpers back into `src/symphony/console.js`.

PR-0: revert PR #35 to remove the v45 runbook.

If the supervisor dashboard or app-facing API regresses, roll back the newest v45 backend PR that touched the failing boundary first. Do not compensate by adding Workbench command execution, changing the supervisor kernel, or changing `goal-supervisor-app-read-model.v1` inside a rollback.
