# v62 Installer and Upgrade Baseline acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v62-installer-upgrade-baseline`
Acceptance branch: `codex/v62-closeout`
Main before PR-4: `322056dc450787ae534d73b007d08e04986450c4`

## Accepted scope

v62 makes install, upgrade dry-run, rollback, and installer ref selection explicit.

The accepted state is:

- default installer ref remains `v8`;
- intentional current-release installs use an explicit `MCAS_INSTALL_REF`, with v61 recorded as the verified predecessor release at v62 start;
- `installStatus.v1` reports installer checkout state, current ref, target ref, shim state, doctor command text, blocked reasons, and disabled mutation boundaries;
- `installUpgradePlan.v1` is dry-run only and reports dirty checkout, Node, pnpm, target ref, rollback ref, blocked reasons, and `plannedMutations: []`;
- `GET /api/install/status` exposes install status through a no-query GET route;
- Workbench renders install status as display-only fields and copy-only command text;
- upgrade and rollback remain manual terminal operations outside product code.

v62 does not add a generic shell, terminal UI, renderer command execution, renderer network fetch, arbitrary local path read, local JSONL/session/provider folder read, raw transcript exposure, raw model output exposure, direct event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, GitHub Release automation, public distribution, notarization, or auto-update.

## Accepted evidence

| Evidence | File or command |
| --- | --- |
| Version-start reconcile and PR plan | `docs/plans/v62-installer-upgrade-baseline-runbook-2026-06-14.md` |
| Installer ref policy | `README.md`, `docs/install-guide.md`, `docs/release-checklist.md` |
| Install status and upgrade dry-run contracts | `src/symphony/installer-upgrade-baseline.js`, `src/symphony/cli/commands/install.js`, `tests/v62-installer-upgrade-baseline.test.js` |
| Workbench copy-only surface | `GET /api/install/status`, `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/App.jsx` |
| Upgrade and rollback docs | `docs/upgrade-guide.md` |
| Closeout and v63 handoff | `docs/plans/v62-installer-upgrade-baseline-closeout-snapshot-2026-06-14.md`, `docs/plans/v63-mac-app-local-launch-mvp-runbook-2026-06-14.md` |

## Installer ref acceptance

| Check | Accepted result |
| --- | --- |
| Installer default | `install.sh` still uses `MCAS_INSTALL_REF:-v8`. |
| Current verified predecessor release | v61 annotated tag exists and dereferences to `d2cfff816b0111140b3e5e11fb819f60cc0c4911`. |
| v61 GitHub Release | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v61`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T17:31:02Z`; targetCommitish `main`. |
| v62 before closeout | No `v62` tag and `gh release view v62` returned `release not found`. |

The installer default should not move without a later release-state record that names the annotated tag object, dereferenced commit, GitHub Release URL, draft flag, prerelease flag, assets, publish time, target commitish, open PR state, and rollback ref.

## Contract acceptance

The local status example on the PR-4 branch returned:

| Field | Value |
| --- | --- |
| command | `pnpm --silent symphony install status --install-dir . --bin-dir scripts --target-ref v61 --json` |
| contract | `installStatus.v1` |
| state | `ready` |
| current ref | `codex/v62-closeout` |
| current commit | `322056dc450787ae534d73b007d08e04986450c4` |
| target ref | `v61` |
| target available locally | `true` |
| doctor status | `missing-shim` |
| blocked reasons | `[]` |
| readOnly / willMutate | `true / false` |
| disabled boundaries | network fetch, checkout, dependency install, overwrite, renderer network fetch, Workbench execution, GitHub Release automation |

The local dry-run example returned:

| Field | Value |
| --- | --- |
| command | `pnpm --silent symphony install upgrade --install-dir . --bin-dir scripts --target-ref v61 --rollback-ref codex/v62-closeout --dry-run --json` |
| contract | `installUpgradePlan.v1` |
| state | `ready` |
| dryRun | `true` |
| dirty install dir | `false` |
| Node / pnpm | Node `24.14.0`; pnpm `10.30.3` |
| target ref | `v61`, safe and available locally |
| rollback ref | `codex/v62-closeout`, safe and available locally |
| plannedMutations | `[]` |
| manualActionRequired | `true` |
| readOnly / willMutate | `true / false` |

## Workbench acceptance

Workbench reads `GET /api/install/status` through `READONLY_API_ROUTES`. The route accepts no query parameters. The renderer does not choose an install directory, fetch from GitHub, checkout a ref, install dependencies, run doctor, overwrite files, rollback, tag, push, publish, or create a GitHub Release.

The Install Status panel renders contract fields, install checkout fields, target ref, shim state, doctor status, disabled boundary flags, blocked reasons, and copy-only command text. It adds no button, form, local file picker, clipboard call, browser open call, or install/rollback/apply handler.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v62-installer-upgrade-baseline.test.js` | Passed on PR-4 branch: 5 tests, 5 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-3 branch for the Workbench change: 121 tests, 121 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. PR-4 is docs-only. |
| `pnpm workbench:build` | Passed on PR-3 branch for the Workbench static asset update. PR-4 is docs-only. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed after staging PR-4 files. |

`pnpm test` is not required for PR-4 closeout unless the controller chooses a broader gate. The version gate requires the focused v62 test, Workbench tests because PR-3 touched Workbench, `pnpm workbench:build`, `pnpm check`, and whitespace checks.

## Residual risk

The installer default remains conservative at `v8`. Users who want the latest verified release must pass an explicit `MCAS_INSTALL_REF`. This is intentional until a later version records enough release evidence to move the default or introduce a manually advanced stable ref.

`GET /api/install/status` inspects the configured install directory through backend-owned code. It does not accept renderer-selected paths, but the status reflects the environment used to start the console.

Rollback is documented as manual terminal work. Product code does not enforce rollback execution.
