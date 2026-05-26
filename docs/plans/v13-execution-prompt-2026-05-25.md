# v13 Execution Prompt

Use this prompt to start a fresh implementation conversation for v13.

````text
PLEASE IMPLEMENT THIS PLAN:

# v13 Plan: Workbench Information Architecture

Context:
- Repository: multi-coding-agent-symphony.
- Current release scope: v12 verified adoption is merged and tagged.
- v12 behavior:
  - `symphony do --write` creates a controlled execution plan.
  - `symphony do --confirm-plan <plan-id>` executes only that frozen plan in an isolated workspace.
  - `symphony adopt --run <confirmed-run-id>` creates a frozen text add/modify adoption plan and patch.
  - `symphony adopt --confirm <adoption-id>` writes an adoption journal and `applying` run state before `git apply`, then applies only the frozen patch.
  - `symphony adopt --inspect <adoption-id> --json` is read-only recovery visibility.
  - `symphony diagnose --json` exposes v12 adoption risks including applying journals, post-apply evidence failure, and dirty blocker details.
- Workbench and diagnostics must remain local, read-only, model-free, installer-free, and copy-only.
- Full plan document: `docs/plans/v13-workbench-information-architecture-plan-2026-05-25.md`.
- Before editing, read `docs/plans/v13-workbench-information-architecture-plan-2026-05-25.md`; when details conflict, treat that file as the source of truth.

Objective:
Implement v13 Workbench information architecture so the default UI is less dense while preserving all v12 diagnostic and adoption recovery depth behind clear drill-down views.

High-level direction:
- Do not continue expanding the execution kernel in v13.
- Improve the Workbench cockpit for humans.
- Default view should answer:
  1. Is the project safe to act on?
  2. What is the latest meaningful state?
  3. What copy-only command should I run next?
- Move dense run/artifact/diagnostic/adoption details behind Overview, Adoptions, Runs, Diagnostics, and Artifacts sections.

Required product behavior:
- The Workbench default screen must be a compact Overview.
- Overview must show:
  - overall status: `ready`, `attention`, `blocked`, or `no-runs`
  - latest run summary
  - top 1-3 risks by severity
  - current next action
  - compact readiness state
  - adoption summary banner when relevant
- Add a dedicated Adoptions view/section.
- Adoptions view must show:
  - adoption plan list
  - source run
  - execution plan
  - changed file count
  - patch hash
  - journal ref when present
  - latest confirmation run
  - current worktree matches `fileOperations.afterHash`
  - current worktree matches journal `beforeFiles`
  - copy-only inspect/confirm/status/diagnose commands
- Add or preserve dedicated Runs, Diagnostics, and Artifacts views/sections.
- Diagnostics must still expose all v10-v12 risk categories.
- Artifact preview must remain bounded to registered refs only and keep the 200 KiB cap.
- Non-GET Workbench routes must still return `405`.
- Browser must not execute commands, apply patches, retry runs, delete files, rollback, install packages, invoke adapters, invoke models, or call external services.

Required API/model changes:
- Add derived, additive `overview` and `adoptionSummary` fields to the console snapshot.
- These fields must be derived from existing run states, adoption plans, adoption journals, readiness, and diagnostics.
- They must not become canonical storage.
- Keep existing JSON contract fields backward compatible.

Suggested `overview` shape:

```json
{
  "overview": {
    "status": "attention",
    "headline": "Pending adoption is blocked by dirty files.",
    "latestRunId": "symphony-adoption-demo-planned",
    "topRisks": [],
    "nextAction": "git status --short"
  }
}
```

Suggested `adoptionSummary` shape:

```json
{
  "adoptionSummary": {
    "status": "pending",
    "pendingCount": 1,
    "applyingCount": 0,
    "postApplyFailedCount": 0,
    "dirtyBlocked": true
  }
}
```

Optional API route:
- Add `GET /api/adoptions/<adoption-id>/inspect` only if it can reuse the same pure read-only inspect builder as CLI inspect.
- If added, it must not write state, run `git apply`, invoke adapters, invoke models, run installers, or execute recommended commands.
- It should return `contractName: "symphony.console-adoption-inspect"`.
- It should include journal ref, latest confirmation run, match booleans, and copy-only recommended commands.

Suggested implementation order:
1. Inventory current Workbench fields and decide which fields belong to Overview, Adoptions, Runs, Diagnostics, Artifacts, and Raw/Debug.
2. Add pure derived helpers for `overview` and `adoptionSummary` in `src/symphony/console.js`.
3. Add tests for overview/adoption summary states before or alongside implementation.
4. Rework the static Workbench UI into local sections/tabs:
   - Overview
   - Adoptions
   - Runs
   - Diagnostics
   - Artifacts
5. Add adoption recovery rendering using existing adoption plans, journals, and latest confirmation runs.
6. Keep existing routes and artifact preview behavior compatible.
7. Update product contract docs, README only if user-facing commands change, and add v13 release evidence when gates pass.

Likely files:
- `src/symphony/console.js`
- `src/symphony/contract.js` if snapshot contracts need helper additions
- `src/symphony/state.js` only if read-only helper extraction is needed
- `scripts/symphony.js` only if CLI inspect builder should be shared with Workbench API
- `tests/symphony-cli.test.js`
- `docs/symphony-product-contracts.md`
- `README.md` only for user-facing command changes
- `docs/plans/v13-workbench-information-architecture-plan-2026-05-25.md`
- `docs/plans/v13-release-evidence-2026-05-25.md` if release evidence is produced

UX rules:
- Default view should avoid raw JSON.
- Show at most three risks on Overview.
- Use progressive disclosure: summary first, details second, raw JSON last.
- Keep commands visually and semantically copy-only.
- Use concrete status labels:
  - "Patch applied, evidence failed"
  - "Worktree matches adopted files"
  - "Worktree no longer matches pre-apply journal"
  - "Dirty worktree blocks adoption"
- Do not mix full artifact previews into Overview.

Required tests:
- Console snapshot includes compact `overview`.
- Console snapshot includes `adoptionSummary`.
- Overview top risks are capped.
- Pending adoption changes adoption summary status.
- Applying confirmation run or applying journal changes adoption summary status.
- Post-apply evidence failure changes adoption summary status.
- Dirty worktree blocked adoption is visible in summary without flooding Overview.
- Workbench HTML contains top-level navigation or sections for Overview, Adoptions, Runs, Diagnostics, and Artifacts.
- Non-GET requests remain rejected.
- Artifact preview remains bounded to registered refs.

If `GET /api/adoptions/<id>/inspect` is implemented:
- Route is read-only.
- Route rejects unsafe ids.
- Route returns the same match booleans as CLI inspect.
- Route does not write state files.
- Route exposes only copy-only recommended commands.

Keep these existing behaviors passing:
- v10 diagnostics JSON/text/static HTML.
- v11 controlled execution plans.
- v12 verified adoption planning, confirmation, journal, inspect, and diagnostics.
- Workbench artifact preview security.
- No adapter/model/package-installer/external-service invocation from Workbench or adoption inspect.

Acceptance commands:
- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`

Optional release gate:
- `pnpm test:mutation:gate`

Manual/browser smoke:
- Start `symphony console` against a fixture state dir.
- Verify first screen is compact Overview, not the full raw maintenance panel.
- Verify Overview shows status, latest run, top risks, next action, and compact readiness.
- Verify Adoptions view shows pending/applying/post-apply-failed states.
- Verify commands are copy-only.
- Verify artifact previews still only read registered refs.
- Verify non-GET routes return `405`.

Deliverables:
- Implementation, tests, docs, and product contract updates.
- A concise release evidence document if this is being released as v13.
- Final summary in Chinese including:
  - changed files
  - UI/contract behavior added
  - verification commands and results
  - browser/manual smoke result
  - residual risks
````
