# v22 release evidence

Goal id: `v22-goal-prompt-handoff-workspace`

Release name: `v22 Prompt Handoff Workspace`

Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md`

Release manager: `codex-v22-release-manager`

Main commit checked by release commands: `3a63b3c8f3cbdc2258a3095e7a08c4c0483846b5`

## Main integration

| Command | Result |
| --- | --- |
| `git checkout main` | Exit 0. Switched to `main`; local `main` was ahead of `origin/main` by 13 commits before v22 integration. |
| `git pull --ff-only` | Exit 0. Output: `Already up to date.` |
| `git merge --ff-only v22-task-5-prompt-workspace-tests-and-docs` | Exit 0. Fast-forwarded `main` from `f891e53da1dcac1e5799efd24d75c2ec72bfc5a0` to `3a63b3c8f3cbdc2258a3095e7a08c4c0483846b5`. This brought the completed v22 task commits, evidence files, fixture, Workbench source, static assets, tests, and operator guide changes onto `main`. |

## Release commands

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. Node test runner reported 700 tests, 700 pass, 0 fail, duration 3714.880917 ms. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-D6WeclLN.css`, and `assets/index-BRTPIdb3.js`; output sizes were 0.42 kB, 13.24 kB, and 732.18 kB. |
| `pnpm test:mutation:gate` | Exit 0. Stryker reported mutation score 74.22, break threshold 60, 1762 killed, 6 timeout, 488 survived, 126 no coverage, 0 errors; run time 22 minutes 26 seconds. |
| `pnpm audit --audit-level high` | Exit 0. Output: `1 vulnerabilities found`; severity was 1 moderate. No high severity advisory failed the command. |
| `pnpm mcas doctor` | Exit 0. JSON status `ok`; Node version `24.14.0`; package manager `pnpm`; listed commands include `doctor`, `intake`, `github issue`, `harness run-taskpacket`, `queue manual`, `run-next`, `run-task`, `smoke`, and `eval replay`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal closeout --goal v22-goal-prompt-handoff-workspace --markdown` | Exit 0. Closeout reported worker evidence complete, review evidence complete, main verification complete, missing evidence none, release ready no, release ready source missing. Release gate gaps before controller registration: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `mutationGate`, `auditHigh`, `diffCheck`, and `docsUpdated` were `unknown`. |

## Goal closeout state

`pnpm --silent symphony goal closeout --goal v22-goal-prompt-handoff-workspace --json` returned `goal-closeout-report.v1`.

Missing evidence: none.

Closeout gaps before gate registration:

| Gate | Status |
| --- | --- |
| `release.pnpm-check` | `unknown` |
| `release.pnpm-test` | `unknown` |
| `release.workbench-build` | `unknown` |
| `release.mutation-gate` | `unknown` |
| `release.audit-high` | `unknown` |
| `release.diff-check` | `unknown` |
| `release.docs-updated` | `unknown` |

The v22 runbook release gate list contains those seven gates. `pnpm mcas doctor` was required by the release closeout command list and passed, but it is not listed as a required v22 closeout gap in `fixtures/contracts/goal-runbook.v22-goal-prompt-handoff-workspace.v1.json`.

## Boundary check

Workbench mainline is the latest goal/runbook flow. The v22 release covers Prompt Workspace task selection, role-specific prompt rendering, subagent handoff status, worker event shortcuts through the v21 dry-run/confirm path, and tests/docs for those paths.

This release does not make the v8 `scan/do/review/verify/status/continue/artifacts` action list the top-level Workbench flow. It does not add a generic shell runner, a generic safety layer, approval inference from file names, branch names, commit messages, or frontend state, worker self-approval, or auto-tag/auto-release behavior.

## Gate recommendations

Register these gates with `--evidence-ref docs/plans/v22-release-evidence-2026-05-29.md` and verifier `codex-v22-release-manager`:

| Gate | Recommended status | Evidence |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited 0. |
| `release.pnpm-test` | `passed` | `pnpm test` exited 0 with 700 pass and 0 fail. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited 0 and produced the Workbench static assets. |
| `release.mutation-gate` | `passed` | `pnpm test:mutation:gate` exited 0; mutation score 74.22 met break threshold 60. |
| `release.audit-high` | `passed` | `pnpm audit --audit-level high` exited 0; only one moderate vulnerability was reported. |
| `release.diff-check` | `passed` | `git diff --check` exited 0. |
| `release.docs-updated` | `passed` | `docs/workbench-operator-guide.md` and v22 evidence files are present on `main`; task-5 review approved docs coverage, and task-5 main verification passed. |

After those seven gate events are registered through dry-run plus confirm, register:

| Gate | Recommended status | Evidence |
| --- | --- | --- |
| `release.ready` | `declared` | Release checks passed, closeout has no missing task evidence, and remaining closeout gaps are the release gate events listed above. |

## Tag and release recommendation

Do not auto-tag or auto-release from this subagent. After the controller registers the seven release gates and the `release.ready` declaration, create a `v22` tag and release note only with an explicit human instruction or the project release process.

## Release readiness judgment

`RELEASE_READY`

The code and evidence on `main` passed the required release commands. The only closeout gaps are controlled release gate events that the parent controller must register with dry-run plus confirm.
