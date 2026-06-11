# v46 Workbench supervisor dashboard closeout snapshot

Date: 2026-06-11
Timezone: Asia/Shanghai
Goal: `v46-workbench-supervisor-dashboard`
Baseline tag: `v45`
Baseline commit: `54be3aa9081b68d8641283af5d523cb5405da304`
Pre-closeout main commit: `fb4fa5dd4da27b778671b3081ae215fec194dc8c`

## Final State

v46 adds the Workbench Supervisor Dashboard as a read-only command center at `/workbench/supervisor/`.

The dashboard consumes the existing `goal-supervisor-app-read-model.v1` when live supervisor data is available. When no live model is available, it renders a local sample fallback through the same v46 view projection. The page keeps the v44.3/v45 backend boundaries intact: it does not start a daemon, dispatch children, inspect provider session files, run provider CLIs, register goal events, append goal state, push git state, publish, or create a GitHub Release.

The v46 surface includes:

- `SupervisorShell` and `projectSupervisorDashboardToWorkbenchView` in `frontend/workbench/src/v46SupervisorWorkbench.jsx`.
- Warm Engineering layout and responsive behavior in `frontend/workbench/src/styles/workbench.css`.
- `/workbench/supervisor/` routing through the existing Workbench shell without the legacy Workbench header wrapping the v46 page.
- `supervisor-dashboard-state.v46` contract notes in `docs/plans/v46-workbench-supervisor-dashboard-state-contract-2026-06-11.md`.
- Static QA coverage in `scripts/workbench-v46-static-qa.js`.
- Acceptance notes and visual evidence under `docs/qa/`.

The command boundary remains observational. There are no executable dashboard controls, no clickable evidence links, no form controls, no `role="button"` entries, and no frontend fetch path inside the v46 surface.

## Cleanup Record

Before closeout, untracked intermediate QA files from earlier browser iterations were removed:

- `docs/qa/evidence/v46-workbench-static-supervisor-visual-qa-2026-06-11/`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11/`
- `docs/qa/v46-workbench-supervisor-desktop-1440x900*.png`
- `docs/qa/v46-workbench-supervisor-mobile-390x844*.png`

The retained evidence is the latest passing set:

- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/desktop-1440x900.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/mobile-390x844.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/mobile-390x844-fullpage.png`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/summary.json`

After cleanup, `git status -sb` showed `## main...origin/main`.

## Merged PR Record

| Scope | GitHub PR | Branch | Merge commit | Merged at |
| --- | --- | --- | --- | --- |
| v46 Workbench supervisor dashboard | #41 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/41` | `codex/v46-workbench-supervisor-dashboard` | `fb4fa5dd4da27b778671b3081ae215fec194dc8c` | 2026-06-11T02:45:47Z |

PR #41 had two branch commits before merge:

- `10f2ea9040effc21979cdda307a2d0f207e8a674` `Add v46 Workbench supervisor dashboard`
- `f6a5999c9c15f020c5347bd9f22b3bb926fadb15` `Fix v46 Workbench static scan`

The second commit removed CSS strings that were correctly blocked by the existing static Workbench safety scan:

- vendor font names containing `anthropic`
- CSS custom property `--v46-body`, which matched the generic request-body scan

The fix kept the visual design and did not weaken the scanner.

## Files Changed Since v45

The v46 diff from `v45..HEAD` contains:

- `docs/plans/v46-workbench-supervisor-dashboard-state-contract-2026-06-11.md`
- `docs/qa/v46-workbench-supervisor-dashboard-acceptance.md`
- `docs/qa/evidence/v46-workbench-supervisor-dashboard-visual-qa-2026-06-11-latest/`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `frontend/workbench/src/v46SupervisorWorkbench.jsx`
- `package.json`
- `scripts/workbench-v46-static-qa.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BsCE7mzH.js`
- `src/symphony/workbench-static/assets/index-DK3WOan4.css`
- `tests/workbench-shell.test.js`

Static Workbench assets after `pnpm workbench:build`:

- `src/symphony/workbench-static/assets/index-BsCE7mzH.js`
- `src/symphony/workbench-static/assets/index-DK3WOan4.css`

## Checks Run

| Command | Result |
| --- | --- |
| `pnpm workbench:build` | Passed. Rebuilt `index-BsCE7mzH.js` and `index-DK3WOan4.css` with no tracked diff. |
| `pnpm test` | Passed. Result: 1170 tests passed, 0 failed. |
| `pnpm workbench:v46:qa` | Passed. JSON result `status: "ok"` for the v46 supervisor route surface and source/CSS scan. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |

GitHub Actions for PR #41:

- `changes`: passed
- `build`: passed
- `code-focused`: passed
- `verify`: passed
- `docs`: skipped
- `mutation-stage`: skipped
- `real-cli`: skipped

Commands intentionally not run in closeout:

- mutation gate commands
- audit commands
- provider CLI or real CLI commands
- daemon start or stop commands
- child dispatch commands
- GitHub Release creation

## Tag Plan

The `v46` tag did not exist before this closeout snapshot. After this snapshot is committed to `main`, create an annotated `v46` tag on the closeout commit with message:

```text
v46 Workbench supervisor dashboard
```

The tag marks the read-only dashboard baseline. It is not a GitHub Release and does not imply desktop packaging, signing, notarization, auto-update, provider CLI execution, or command execution from the Workbench UI.

## Known Risks

The dashboard is still read-only. Future app controls need a separate backend command boundary and should not be added by turning dashboard fields into buttons.

The route can render a local sample fallback when no live supervisor model is available. Operators should check the source/contract fields before treating a dashboard as live goal state.

The static Workbench bundle is generated and large. Review future changes through source files first, then verify `pnpm workbench:build` keeps `src/symphony/workbench-static/` synchronized.

The v46 frontend depends on the existing app-facing read model. If `goal-supervisor-app-read-model.v1` changes, update the projection deliberately instead of reading runner state, ledgers, event logs, provider session JSONL, or temporary daemon files directly from the frontend.

## Rollback Path

If the closeout snapshot text is wrong, revert this snapshot commit.

If the v46 dashboard regresses, revert PR #41 or the `v46` tag target commit. That removes the v46 route projection, styling, static QA script, static asset refresh, acceptance notes, and latest QA evidence.

If only generated assets are wrong, rerun `pnpm workbench:build` from the intended source state and commit the refreshed files under `src/symphony/workbench-static/`.

If the frontend route must be disabled temporarily, remove only the `/workbench/supervisor/` v46 routing and restore the previous v45 Workbench behavior. Do not compensate by adding browser-side command execution, provider CLI calls, daemon ownership, or direct reads from temporary local supervisor state.
