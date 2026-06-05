# v38 release evidence

Date: 2026-06-05

Goal id: `v38-provider-hub-capability-profiles`
Release name: `v38 Agent CLI Provider Hub MVP`
Baseline: `v37`
Evidence path: `docs/plans/v38-release-evidence-2026-06-05.md`
Release-manager scope: repository tag/full release validation, release evidence, tag handoff, and GitHub Release preparation.

## Release Scope

v38 adds the Agent CLI Provider Hub MVP:

- `agent-cli-provider.v1` with only `claude-code-cli` and `codex-cli` as active providers.
- `agent-cli-provider-health.v1` with sanitized env presence and no secret values.
- `agent-cli-capability-profile.v1` mapping provider capabilities to worker/reviewer/main-verifier actions.
- `agent-cli-lane-assignment-preview.v1` for read-only lane previews without execution.
- Workbench Provider Hub panel and Desktop Shell provider availability card.
- Temporary controller/supervisor operating docs and dry-run supervisor runner.

The release does not add a real CLI runner, execute provider CLIs, invoke models, install providers, open OAuth, expose credential values, dispatch prompts, or enable generic shell execution. Gemini CLI, Kiro CLI, and DeepSeek active provider support remain out of v38. DeepSeek appears only as a sanitized backend profile behind an existing CLI provider. Controlled CLI Provider Runner and Backend Completion remain v41 scope.

## Baseline

| Command or check | Result |
| --- | --- |
| `git rev-parse HEAD` before release evidence | `64ab57e40e24ab7e07e14d2126a265731eb73463` |
| `git rev-parse origin/main` before release evidence | `64ab57e40e24ab7e07e14d2126a265731eb73463` |
| `git status --short --branch` before release evidence | `## main...origin/main` |
| Local `v38` tag lookup | No local `v38` tag existed before release. |
| Remote `v38` tag lookup | No remote `refs/tags/v38` tag existed before release. |
| GitHub Release lookup | `v38` release did not exist before release. |

## Task Event Coverage

The managed v38 goal ledger is release-ready:

| Task | Title | Main verification evidence |
| --- | --- | --- |
| `task-1` | Provider profile contract | `docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md` |
| `task-2` | Provider health check API | `docs/plans/v38-task-2-main-verification-evidence-2026-06-02.md` |
| `task-3` | Capability profile mapping | `docs/plans/v38-task-3-main-verification-evidence-2026-06-02.md` |
| `task-4` | Worker/reviewer lane assignment preview | `docs/plans/v38-task-4-main-verification-evidence-2026-06-02.md` |
| `task-5` | Provider hub panel + evidence | `docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md` |

Release closeout evidence:

- `docs/plans/v38-release-gates-evidence-2026-06-05.md`
- `release.pnpm-check`: `evt_d60e9f5c7fa33186`
- `release.pnpm-test`: `evt_b71ef02de191b436`
- `release.workbench-build`: `evt_e050f9bfbfa56a5a`
- `release.diff-check`: `evt_8785fb3b1c9e5d2b`
- `release.docs-updated`: `evt_9c64796cd99cf686`
- `release.ready-declared`: `evt_32261d4927aea700`

## Local Release Validation

Repository tag/full release validation ran from `/Users/andy/Documents/project/multi-coding-agent-symphony` on `main`.

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. |
| `pnpm test` | Exit 0. `1018` tests, `158` suites, `1018` pass, `0` fail. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/` and generated `index-BNNs3KXL.js`. |
| `pnpm test:mutation:gate` | Exit 0. Mutation score `74.22`, break threshold `60`; `1762` killed, `6` timeout, `488` survived, `126` no coverage. |
| `pnpm audit --audit-level high` | Exit 0. One moderate vulnerability reported; no high vulnerability gate failure. |
| `git diff --check` | Exit 0. |
| `pnpm mcas doctor` | Exit 0. `status: ok`, Node `24.14.0`. |

Optional real CLI gates were not run locally. The release does not require real provider CLI execution.

## Mainline CI

GitHub Actions `CI` passed on merge commit `64ab57e40e24ab7e07e14d2126a265731eb73463`.

| Field | Value |
| --- | --- |
| Run | `26991228821` |
| URL | `https://github.com/Andy20010101/multi-coding-agent-symphony/actions/runs/26991228821` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-06-05T02:13:54Z` |
| Updated at | `2026-06-05T02:57:07Z` |

CI steps passed:

- `pnpm check`
- `pnpm test`
- `pnpm test:mutation:gate`
- `git diff --check`
- `pnpm mcas doctor`

Optional real CLI preflight and optional real Codex Harness smoke were skipped by CI.

## Docs Updated Evidence

Docs and evidence are present for the release:

- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md` through `docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md`
- `docs/plans/v38-release-gates-evidence-2026-06-05.md`
- `docs/plans/controller/README.md`
- `docs/plans/controller/context-management.md`
- `docs/plans/controller/supervisor-runner.md`
- `docs/plans/controller/v38-controller-state.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`

## Release Gate Basis

The release tag is based on:

- worker, independent review, and main-verification evidence for all five v38 tasks,
- explicit managed goal release gates and `release.ready-declared`,
- v38 scoped closeout evidence,
- merge to `main`,
- local repository tag/full release gates,
- successful mainline CI on merge commit `64ab57e40e24ab7e07e14d2126a265731eb73463`,
- this release evidence and tag evidence committed on top of `main`.

## Boundaries

This evidence does not create the tag, publish the GitHub Release, start model jobs, run provider CLIs, enable a real CLI runner, alter v41 scope, or bypass the Workbench read-only boundaries.
