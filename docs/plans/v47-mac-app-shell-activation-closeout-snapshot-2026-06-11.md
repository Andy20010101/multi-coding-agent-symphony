# v47 Mac App shell activation closeout snapshot

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal: `v47-mac-app-shell-activation`
Baseline tag: `v46`
Pre-closeout main commit: `a0194cc86bfab30820b83115870c31fde40b6361`

## Final state

v47 activates the existing Tauri-first desktop shell path around `/workbench/desktop/` and the Workbench App Home surface. The first screen now presents current project, sidecar state, backend health, active goal, next action, supervisor summary, route/source provenance, missing-state flags, and read-only boundary flags from existing app-facing contracts.

The desktop route stays observational. It does not run shell commands, launch provider CLIs, dispatch children, mutate goals, open arbitrary local files, write git state, tag, publish, create a GitHub Release, declare release readiness, sign, notarize, produce a `.dmg`, or enable auto-update.

The native host boundary remains small:

- Tauri window route: `/workbench/desktop/`
- Rust command surface: `attach_sidecar` and `launch_sidecar`
- Fixed native launch shape: `pnpm symphony console --host <loopback> --port <allowed-port>`
- Allowed hosts: `127.0.0.1` and `localhost`
- Allowed port range: `1024` through `65535`
- `bundle.active`: `false`
- `Cargo.toml` publish boundary: `publish = false`

## PR scope record

| Scope | GitHub PR | Branch | Merge commit | Merged at | Files touched |
| --- | --- | --- | --- | --- | --- |
| PR-0 route documentation | #42 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/42` | `codex/v47-mac-app-shell-activation-docs` | `d4361663c2dd024dd3158c3a6bc27efcfab4345a` | 2026-06-11T03:44:20Z | `README.md`, `desktop/shell/README.md`, v47 runbook |
| PR-1 App Home surface | #43 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/43` | `codex/v47-app-home-surface` | `d6bc8d77a533c78806909d2ac63d8b4cd4ab5e0e` | 2026-06-11T04:14:54Z | Workbench App Home source, projection contracts, CSS, generated Workbench assets, focused tests |
| PR-2 startup and unavailable-state projection | #44 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/44` | `codex/v47-startup-unavailable-state-projection` | `e516038e1ef95a3cda9a292c301acf519b5586e6` | 2026-06-11T06:34:32Z | Workbench projection/rendering, generated Workbench asset refresh, focused tests |
| PR-3 desktop host boundary and smoke hardening | #45 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/45` | `codex/v47-desktop-host-boundary-hardening` | `a0194cc86bfab30820b83115870c31fde40b6361` | 2026-06-11T07:51:30Z | `scripts/desktop-shell-smoke.js`, `desktop/shell/README.md` |
| PR-4 acceptance and closeout snapshot | #46 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/46` | `codex/v47-acceptance-closeout-snapshot` | `1ffdaff93e30d05321995bcc4b55a7b826ce60b2` | 2026-06-11T08:14:49Z | `docs/qa/v47-mac-app-shell-activation-acceptance.md`, this snapshot |

Reconcile before PR-4 edits:

| Command | Result |
| --- | --- |
| `git status -sb` | `## HEAD (no branch)` before branch creation. HEAD, `main`, and `origin/main` all pointed to `a0194cc86bfab30820b83115870c31fde40b6361`. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `gh pr list --state open` | No open PRs returned. |
| `gh pr view 42 --json number,title,state,mergedAt,mergeCommit,headRefName,baseRefName,url` | PR #42 was `MERGED` into `main` at `d4361663c2dd024dd3158c3a6bc27efcfab4345a`. |
| `gh pr view 43 --json number,title,state,mergedAt,mergeCommit,headRefName,baseRefName,url` | PR #43 was `MERGED` into `main` at `d6bc8d77a533c78806909d2ac63d8b4cd4ab5e0e`. |
| `gh pr view 44 --json number,title,state,mergedAt,mergeCommit,headRefName,baseRefName,url` | PR #44 was `MERGED` into `main` at `e516038e1ef95a3cda9a292c301acf519b5586e6`. |
| `gh pr view 45 --json number,title,state,mergedAt,mergeCommit,headRefName,baseRefName,url` | PR #45 was `MERGED` into `main` at `a0194cc86bfab30820b83115870c31fde40b6361`. |

## Reopened PR-5: App Home visual alignment (2026-06-11)

v47 was reopened after PR-4 for one visual-debt item: `/workbench/desktop/` still used its own gradient/shadow/pill style while the v46 supervisor route and the prototype share the Warm Engineering command-center language.

PR-5 is draft PR #48 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/48` on `codex/v47-app-home-visual-alignment` (branched from `a7ce856`). It aligns the App Home first screen with the v46 baseline:

- `frontend/workbench/src/styles/workbench.css`: the desktop route section now uses the v46 palette (warm off-white canvas, white/warm-gray panels, 1px hard borders, 0-4px radius, no shadows), serif panel headings, and monospace for IDs, paths, commands, and state values.
- `frontend/workbench/src/App.jsx`: one markup change removes the supervisor summary card span so the first row tiles 3x2 without grid holes. No data, route, contract, or boundary behavior changed.
- `src/symphony/workbench-static/`: regenerated by `pnpm workbench:build`.
- `docs/qa/evidence/v47-app-home-visual-alignment-2026-06-11/`: desktop 1440x900, desktop full page, and mobile 390x844 screenshots.

All v47 boundaries hold: no execution controls, no provider launch, no goal mutation, no child dispatch, no git/tag/release surface, no Tauri host change, no context/session observability, and no direct frontend reads of runner state, ledgers, or event logs. Missing/unavailable/stale/route-failed states remain visible.

PR-5 validation: `pnpm workbench:build`, `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js` (89 tests, 0 failures), `pnpm check`, and `git diff --check` all passed; browser screenshots at 1440 and 390 widths were reviewed for overlap and actionable-looking controls. Merge information is recorded by the controller at merge time.

## Acceptance evidence

`docs/qa/v47-mac-app-shell-activation-acceptance.md` records the user-visible acceptance checks for:

- Tauri route landing on `/workbench/desktop/`
- first-screen App Home content
- backend, sidecar, project, active goal, supervisor model, stale snapshot, and route failure app states
- absence of visible command, provider, goal mutation, child dispatch, git, tag, publish, release, signing, notarization, `.dmg`, and auto-update claims
- startup failures explained through app state and route provenance instead of a bare browser URL error
- packaging held to smoke and compile-boundary validation only

## Validation evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed after `pnpm install --frozen-lockfile` restored missing `node_modules` in this worktree. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CTsPdN5P.css`, and `assets/index-ChtRsTTb.js` with no tracked asset diff. |
| `pnpm desktop:shell:smoke` | Passed. JSON output reported `desktop-shell-smoke.v1`, `status: "ok"`, renderer route `/workbench/desktop/`, bridge commands `attach_sidecar` and `launch_sidecar`, launcher id `symphony.console.sidecar.launch`, allowed hosts `127.0.0.1` and `localhost`, port range `1024` through `65535`, and packaging flags for bundle, publish, signing, notarization, and auto-update all unavailable. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed. Cargo finished the Tauri host `dev` profile check for `symphony-desktop-shell`. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Passed: 89 tests, 0 failures. The run included v47 Desktop App Home projection, v47 startup unavailable-state projection, and v47 Desktop App Home route render coverage. |
| `pnpm check` | Passed. Node syntax check completed across source, scripts, plugin, and test files. |
| `git diff --check` | Passed. |

`pnpm test` was not selected for PR-4 because this branch changes only the two closeout/acceptance documents. It does not change runtime code, tests, shared projection helpers, shared route state, or generated Workbench assets.

## Known residual risk

The Tauri shell is not a signed distribution. v47 validates the host config, Rust command boundary, Workbench route, generated static asset build, and Rust compileability. It does not validate codesigning, notarization, `.dmg` delivery, installer UX, colleague install steps, or auto-update behavior.

The renderer still depends on local console sidecar contracts. If the sidecar is unavailable or stale, the desktop route should show app states and route provenance. It does not repair the backend state by itself.

The native `launch_sidecar` command can request the fixed local console sidecar from the native host. The renderer does not call it in v47. Any future visible attach/launch control needs a separate contract, tests, and review of operator confirmation behavior.

The App Home surface shows supervisor summary data only when `goal-supervisor-app-read-model.v1` is available. It must not read runner state, ledgers, provider transcripts, temporary daemon files, or git state directly from the frontend to fill gaps.

Generated Workbench assets can drift after source changes. Future code changes under `frontend/workbench/` should run `pnpm workbench:build` and review the generated `src/symphony/workbench-static/` diff deliberately.

## Rollback path

If the PR-4 closeout text is wrong, revert the PR-4 documentation commit only.

If route documentation is wrong, revert PR #42 and replace the v47 runbook text before any new implementation work.

If the App Home surface regresses other Workbench routes, revert PR #43 and keep `/workbench/desktop/` on the v46 behavior while preserving the runbook.

If unavailable-state projection introduces misleading status, revert PR #44 and require backend contract changes before reattempting it.

If desktop smoke hardening blocks a legitimate Tauri compile check, revert only the overly strict smoke assertion from PR #45. Keep the generic shell, provider CLI, git, release, signing, notarization, updater, arbitrary command, and arbitrary path boundaries in place.

If generated Workbench assets are the only problem, rerun `pnpm workbench:build` from the intended source state and commit only the refreshed files.

## Follow-up boundary

v48 should start Project Launcher / Recent Projects only after v47 is merged and the App Home route remains stable.

The next version can cover recent projects, current project binding, project health, and app state after project selection. It should not add arbitrary path preview, generic local file opening, provider CLI launch controls, child dispatch, goal mutation, git push/tag/publish, GitHub Release creation, signing, notarization, `.dmg` delivery, or auto-update without a separate controlled contract and validation plan.

Context/session observability should stay read-only. It should expose summarized context utilization, transcript availability, latest tool call, and near-limit advisory through backend contracts rather than direct frontend reads of Codex or Claude session files.
