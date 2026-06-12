# v48 Project Launcher and Recent Projects closeout snapshot

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal: `v48-project-launcher-recent-projects`
Baseline tag: `v47`
Pre-closeout main commit: `8462324fcce942f63ca0c2e8eee4a156e4f6131b`

## Final state

v48 makes `/workbench/desktop/` project-aware. The route now starts with Project Launcher, Recent Projects, current project binding, selected project health, route/source provenance, and boundary rows before the existing App Home panels.

The implementation adds these app/backend contracts and projections:

- `recent-projects.v1` from backend-known `project-registry.v1` state, served at `GET /api/projects/recent`.
- `current-project-binding.v1`, served at `GET /api/projects/current-binding`.
- Selection-only `POST /api/projects/current-binding/select`, limited to backend-known `projectId` plus optional `expectedRegistryVersion`.
- `project-health-snapshot.v1` in `DesktopAppHomeViewModel`, derived from selected project, backend health, active goal, supervisor, run/artifact, and route provenance projections.

v48 does not deliver signed distribution, notarization, `.dmg` packaging, auto-update, provider execution, goal mutation, child dispatch, job execution, generic shell execution, git push, git tag, publish, GitHub Release creation, or release automation.

## PR scope record

| Scope | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook and contract direction | #50 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/50` | `codex/v48-project-launcher-runbook` | `c7a7bc46183ec939d7c9fd6256c06d8744106f9a` | 2026-06-11T11:05:35Z | Added `docs/plans/v48-project-launcher-recent-projects-runbook-2026-06-11.md`; validation: `git diff --check`. |
| PR-1 Recent Projects read model | #51 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/51` | `codex/v48-recent-projects-read-model` | `fad47973a5580509d22101d304d3df3f104816ff` | 2026-06-11T13:10:29Z | Added `GET /api/projects/recent`, fixtures, Workbench projection, route allowlist, and boundary tests; validation: `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`, `pnpm check`, `pnpm workbench:build`, `git diff --check`, `git diff --cached --check`. |
| PR-2 Project Launcher UI | #52 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/52` | `codex/v48-project-launcher-ui` | `7b17e47331a3a8c5250f2d0b117a32cd4a2aaeea` | 2026-06-11T14:23:17Z | Added the read-only launcher UI before App Home, rendered available/empty/missing/stale/degraded/failed states, and browser-checked desktop plus 390px viewport; validation: `pnpm workbench:build`, `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js`, `pnpm check`, `git diff --check`. |
| PR-3 selected project binding | #53 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/53` | `codex/v48-selected-project-binding` | `8462324fcce942f63ca0c2e8eee4a156e4f6131b` | 2026-06-11T15:08:21Z | Added `current-project-binding.v1`, selection-only POST validation, selected project App Home binding, Project Health, and route provenance projection; validation: `pnpm workbench:build`, `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`, `pnpm check`, `git diff --check`. |
| PR-4 acceptance and closeout snapshot | #54 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/54` | `codex/v48-acceptance-closeout-snapshot` | `898a1eb9c7ca65db1b6dc9434495b4df9ecdc610` | 2026-06-12T00:58:39Z | Added `docs/qa/v48-project-launcher-recent-projects-acceptance.md` and this snapshot; validation is recorded below. |

## PR-5 metadata cleanup

PR-5 updates this closeout snapshot after PR #54 merged into `main`. It records the PR #54 URL, branch, merge commit, merged time, and post-merge tag-prep wording. It does not add v48 runtime scope or change acceptance evidence.

## Reconcile before PR-4 edits

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## main...origin/main`; no local file changes. |
| `git fetch origin main --tags` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -8 origin/main` | `8462324` was `origin/main` and merged PR #53. The next entries were PR #52, PR #51, and PR #50 merge commits and branch heads. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `gh pr view 50 --json number,title,url,mergedAt,mergeCommit,headRefName` | PR #50 merged at `c7a7bc46183ec939d7c9fd6256c06d8744106f9a`. |
| `gh pr view 51 --json number,title,url,mergedAt,mergeCommit,headRefName` | PR #51 merged at `fad47973a5580509d22101d304d3df3f104816ff`. |
| `gh pr view 52 --json number,title,url,mergedAt,mergeCommit,headRefName` | PR #52 merged at `7b17e47331a3a8c5250f2d0b117a32cd4a2aaeea`. |
| `gh pr view 53 --json number,title,url,mergedAt,mergeCommit,headRefName` | PR #53 merged at `8462324fcce942f63ca0c2e8eee4a156e4f6131b`. |

## Generated Workbench assets

PR #51 through PR #53 refreshed `src/symphony/workbench-static/` with `pnpm workbench:build`.

| Commit | Asset changes |
| --- | --- |
| `e5be1e5` PR #51 head | `src/symphony/workbench-static/assets/index-CjYLa2gv.js` renamed to `index-CF4fPWUj.js`; `src/symphony/workbench-static/index.html` updated. |
| `686e836` PR #52 head | `index-DJDZZ6y-.css` renamed to `index-B2J4Dg6l.css`; `index-CF4fPWUj.js` renamed to `index-CRHE0Pig.js`; `index.html` updated. |
| `51ad1e4` PR #53 head | `index-CRHE0Pig.js` renamed to `index-U1xgXD_g.js`; `index-B2J4Dg6l.css` renamed to `index-bXA_-d3y.css`; `index.html` updated. |

Current generated asset files after PR #53:

- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-U1xgXD_g.js`
- `src/symphony/workbench-static/assets/index-bXA_-d3y.css`

## Validation evidence

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed. Vite built `src/symphony/workbench-static/index.html`, `assets/index-bXA_-d3y.css`, and `assets/index-U1xgXD_g.js`. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Passed: 93 tests, 0 failures. |
| `pnpm check` | Passed. Node syntax check completed across source, scripts, plugin, and test files. |
| `git diff --check` | Passed. |
| `pnpm test` | Passed: 1175 tests, 0 failures. This broader run was selected because PR #51 through PR #53 touched shared contract helpers, route allowlists, backend projection, and generated Workbench assets. |

## Known residual risks

`current-project-binding.v1` persists selection under repo-local app state. If a selected project is removed from the backend registry or the registry version is stale, the recovery path is to refresh the registry/recent projects and retry selection with a backend-known project id.

`recent-projects.v1` only reflects backend-known project registry state. It does not discover arbitrary folders or browse disk, so an expected project may be absent until the backend registry can expose it.

`project-health-snapshot.v1` is a projection from existing contracts. If active goal, supervisor, run, artifact, or route contracts are missing or stale, Project Health reports missing, stale, degraded, or failed state. It does not repair backend state from the frontend.

Generated Workbench assets remain source-derived. Future changes under `frontend/workbench/` should run `pnpm workbench:build` and review only the generated asset diff tied to the source change.

## Rollback path

If PR #50 is wrong, revert `c7a7bc46183ec939d7c9fd6256c06d8744106f9a` and replace the runbook before starting new v48 work.

If PR #51 introduces misleading Recent Projects data, revert `fad47973a5580509d22101d304d3df3f104816ff`. Keep `/workbench/desktop/` on the v47 App Home surface or on a launcher that reports the recent-projects route as missing.

If PR #52 makes Project Launcher look actionable or breaks layout, revert `7b17e47331a3a8c5250f2d0b117a32cd4a2aaeea` and keep the Recent Projects backend read model as display-only.

If PR #53 selection crosses the contract boundary, accepts out-of-bound payloads, writes the wrong state, or affects goal/provider/git/release behavior, revert `8462324fcce942f63ca0c2e8eee4a156e4f6131b`. The fallback state is PR #52: read-only Project Launcher plus Recent Projects without selected-project mutation.

If PR-4 text is wrong, revert the PR-4 documentation commit only.

If generated Workbench assets drift, rerun `pnpm workbench:build` from the intended source state and commit only the generated asset refresh tied to that source state.

## Follow-up boundary

v49 or later may consider context/session observability or controlled command-boundary expansion. Those follow-ups need a separate runbook, contract, tests, and acceptance evidence.

v48 should not be used as authorization for arbitrary path preview, scan-disk, generic shell execution, provider CLI launch, child dispatch, job execution, goal mutation, git push, git tag, publish, GitHub Release creation, signing, notarization, `.dmg` packaging, or auto-update.

## Tag prep

Suggested tag name: `v48`

Release note draft:

```text
v48: Project Launcher and Recent Projects

- `/workbench/desktop/` now starts with a project-aware Project Launcher before App Home.
- Recent Projects comes from `recent-projects.v1`, backed by backend-known `project-registry.v1` state.
- Selected project state is exposed through `current-project-binding.v1`; selection accepts only backend-known project ids.
- App Home state now projects selected project health, route/source provenance, active goal, supervisor, run, and artifact state.
- Boundaries remain closed for provider execution, goal mutation, child dispatch, job execution, shell runner, git write, tag, publish, GitHub Release creation, signed distribution, notarization, `.dmg`, and auto-update.
```

Pre-tag checklist:

- PR #50 through PR #53 are merged into `main`.
- PR #54 is merged into `main` at `898a1eb9c7ca65db1b6dc9434495b4df9ecdc610` with `mergedAt` `2026-06-12T00:58:39Z`.
- `main` is fetched after the PR #54 merge.
- Post-merge validation for `main` should include `pnpm workbench:build`, `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`, `pnpm check`, and `git diff --check`.
- Because PR #51 through PR #53 touched shared contract helpers, route allowlists, backend projection, and generated Workbench assets, run `pnpm test` before tagging or record why it was not selected.
- No tag is created by this PR.
- No GitHub Release is created by this PR.
