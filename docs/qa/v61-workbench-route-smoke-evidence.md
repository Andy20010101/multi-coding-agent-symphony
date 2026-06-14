# v61 Workbench route smoke evidence

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v61-workbench-operator-dry-run-evidence`
PR slot: PR-2 local Workbench route smoke evidence
Branch: `codex/v61-route-smoke-evidence`
Branch start commit: `f06fef57c645aaa61ed1efa498686aba182f9808`

## Route smoke result

The route smoke used the current PR branch after PR #122 merged. The first `pnpm workbench:build` attempt showed the worktree did not have `node_modules` installed. `pnpm install --frozen-lockfile` installed the lockfile dependencies in the worktree, then the Workbench build passed. The build did not create a git diff.

Manual HTTP smoke used a temporary `startSymphonyConsoleServer` instance on `127.0.0.1`.

| Route | Status | Content type | Cache | Boundary header | Body check |
| --- | --- | --- | --- | --- | --- |
| `/workbench/desktop/` | `200` | `text/html; charset=utf-8` | `no-store` | `x-content-type-options: nosniff` | React root and `/workbench/assets/index-*.js` present. |
| `/workbench/` | `200` | `text/html; charset=utf-8` | `no-store` | `x-content-type-options: nosniff` | React root and `/workbench/assets/index-*.js` present. |

## Stable Baseline lane checks

`tests/workbench-shell.test.js` renders `/workbench/desktop/` with the stable baseline fixture and checks these visible labels and fields:

| Area | Checked evidence |
| --- | --- |
| Navigation | Sidebar link `Stable Baseline` points to `/workbench/desktop/#stable-workbench-release-panel`. |
| Panel labels | `Stable Workbench Release`, `Surface Matrix`, `Provider Boundary`, `Release Boundary`, `Safety`, `Evidence Refs`, and `Disabled Capabilities`. |
| Source contract | `stableWorkbenchRelease.v1` from `goal-supervisor-app-read-model.v1`. |
| Source refs | The rendered panel includes `docs/provider-boundary-guide.md` and the known fact `tag push and GitHub Release publication remain controller manual actions`. |
| Provider boundary | Active provider claim is `codex-cli`, claim `controlled-provider-execution-preview`, status `tested-preview`, unsupported claims `无`, raw provider CLI evidence allowed `false`. |
| Release boundary | Tag operation is `manual-controller-action`; GitHub Release command result is `not-run-by-product-code`; manual controller action required is `true`; automation observed is `false`. |

## Disabled capability checks

The route smoke and SSR tests keep these fields disabled or absent in the Stable Baseline lane:

| Capability | Checked state |
| --- | --- |
| Provider launch | `false` |
| Unsupported provider claims | `false` |
| Generic shell / terminal | `false` and no shell or terminal control appears in the panel. |
| Renderer command execution | `false` |
| Frontend JSONL/session/provider folder reads | `false` |
| Raw transcript exposure | `false` |
| Raw model output exposure | `false` |
| Direct goal event append | `false` |
| Direct task completion | `false` |
| Git write / tag write | `false` |
| GitHub Release create/edit | `false` |
| Public distribution claim | `false` |
| Automatic worktree creation | `false` |
| Automatic next-version goal | `false` |

The tests also assert the Stable Baseline lane does not contain `button`, `form`, `textarea`, `fetchGoalEventPlanPreview`, `confirmGoalEventPlan`, `window.open`, `navigator.clipboard`, tag execution labels, release publication controls, provider launch labels, local file read labels, transcript labels, direct event append labels, task completion labels, worktree creation labels, or next-goal creation labels.

## Validation

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed because this worktree initially had no `node_modules`. |
| `pnpm workbench:build` | Passed after dependency install. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 120 tests, 120 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| Temporary HTTP route smoke for `/workbench/desktop/` and `/workbench/` | Passed with `200`, `text/html; charset=utf-8`, `no-store`, `nosniff`, React root, and Workbench asset present. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed on PR-2 branch. |
