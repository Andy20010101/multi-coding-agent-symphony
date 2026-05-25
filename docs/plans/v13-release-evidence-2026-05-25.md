# v13 Release Evidence: Workbench Information Architecture

Date: 2026-05-25

## Scope

v13 keeps the v12 execution and adoption safety model unchanged and improves the local Workbench cockpit.

- `symphony console` now serves a compact Overview first.
- The console snapshot adds derived `overview` and `adoptionSummary` fields.
- Workbench UI is split into Overview, Adoptions, Runs, Diagnostics, and Artifacts sections.
- `GET /api/adoptions/<adoption-id>/inspect` is read-only and reuses the CLI adoption inspection builder.
- Artifact preview remains bounded to registered refs only with the existing 200 KiB cap.

## Field Inventory

- Overview: overall status, latest run summary, top three risks, compact readiness, current next action, adoption banner.
- Adoptions: adoption plans, journals, source run, execution plan, changed file count, patch hash, latest confirmation run, worktree match booleans, copy-only commands.
- Runs: filters, run list, selected run route/safety/execution/verification/timeline/change details.
- Diagnostics: full risk list, readiness internals, dirty path details, grouped copy-only commands, raw snapshot/readiness JSON.
- Artifacts: selected run artifact refs and bounded previews.
- Raw/debug: raw run state, route/provider blocks, unsupported requests/changes, scaffold plans, and JSON details.

## Local Gates

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
```

Results from the implementation run:

- `node --test tests/symphony-cli.test.js`: passed, 40 tests.
- `pnpm check`: passed.
- `pnpm test`: passed, 507 tests.
- `git diff --check`: passed.
- `pnpm audit --audit-level high`: passed the high-severity gate. The audit reported one moderate vulnerability and no high-or-critical vulnerabilities.

## Browser Smoke

Started `symphony console` against a temporary fixture state directory with an adoption plan, journal, failed post-apply confirmation run, and registered patch/journal artifacts.

Observed:

- Default route opened the Overview section, not raw JSON or the dense run maintenance panel.
- Overview showed `blocked`, latest run summary, top three risks, current next action, compact readiness, and adoption summary banner.
- Adoptions view showed the plan, source run, execution plan, changed file count, patch hash, journal ref, latest confirmation run, after-hash match, before-file mismatch, and copy-only inspect/confirm/status/diagnose commands.
- Diagnostics view exposed full risk/readiness detail including post-apply adoption risk.
- Artifacts view showed only registered refs and preview controls.
- Browser actions did not execute commands or write state.
- Screenshot captured at `/tmp/symphony-v13-workbench-overview-fixed.png`.

## Residual Risks

- The Workbench is still a static no-build UI inside `src/symphony/console.js`, so future layout expansion should keep render helpers small.
- Snapshot `overview` from `symphony console --snapshot --json` is state-only; the browser enriches visible dirty-adoption blockers after loading readiness, while `symphony diagnose --json` enriches the snapshot with readiness-aware adoption summary.
- The mutation gate was run during v13.1 hardening and passed the configured break threshold with a 74.22 mutation score.
