# v68 Adoption and Main Verification Workbench Loop acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v68-adoption-main-verification-loop`

## Accepted Scope

v68 connects the controlled worker/reviewer evidence path to backend-owned adoption and fixed main verification:

```text
Codex worker evidence
-> Claude reviewer approved
-> adoption readiness preview
-> adoption confirm
-> fixed main verification preview
-> fixed main verification confirm
-> explicit main.verification-passed gate draft
```

Accepted changes:

- v68 runbook and start evidence are recorded in `docs/plans/v68-adoption-main-verification-loop-runbook-2026-06-14.md`.
- `adoptionReadiness.v1` validates approved reviewer evidence, source fingerprints, clean worktree state, patch safety, rollback requirement, and blocked reasons.
- Fixtures cover ready adoption, missing reviewer approval, dirty worktree, patch mismatch, stale worker run, unsafe patch, unsupported deletion, and missing artifact.
- Backend adoption preview/confirm routes are exposed as `/adoption-readiness-preview` and `/adoption-readiness-confirm`.
- Adoption confirm is bound to `planHash`, active goal/task, adoption id, backend fingerprint, and journal-before-apply recovery state.
- Fixed main verification preview/confirm routes are exposed as `/main-verification-preview` and `/main-verification-confirm`.
- Main verification confirm runs the fixed suite, records operation evidence, and creates only a separate `main.verification-passed` gate draft.
- Workbench shows the Worker -> Reviewer -> Adoption -> Main Verification -> Gate Draft loop with blockers, next safe action, preview routes, operation status, and safety boundaries.
- Rebuilt Workbench static assets point to CSS asset `index-BX8171d6.css` and JS asset `index-D8aWQYff.js`.
- v69 handoff is recorded in `docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md`.

Out of scope:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, raw transcripts, raw worker transcripts, raw provider output, or raw model output;
- provider or reviewer output directly applying adoption, completing tasks, passing main verification, marking release ready, or registering gates;
- adoption without a frozen backend plan;
- main verification gate registration from test success;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- automatic self-review, automatic worktree creation, or automatic next-version goal creation;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed on PR-4 branch: 13 tests, 13 passed. Also passed inside `pnpm test` during PR-5 closeout. |
| `node --test tests/v67-claude-code-reviewer-lane.test.js` | Passed on PR-4 branch: 11 tests, 11 passed. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed on PR-4 branch: 10 tests, 10 passed. |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js` | Passed on PR-5 branch: 10 tests, 10 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch: 131 tests, 131 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm workbench:build` | Passed on PR-4 branch. Built `src/symphony/workbench-static/index.html`, CSS asset `index-BX8171d6.css`, and JS asset `index-D8aWQYff.js`. |
| `pnpm check` | Passed on PR-4 branch. |
| `pnpm test` | Passed on PR-5 branch: 1427 tests, 1427 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed on PR-5 branch after adding acceptance, closeout, and v69 handoff docs. |
| `git diff --cached --check` | Passed after PR-5 staging. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Adoption readiness is explicit and backend-owned. | `src/symphony/adoption-main-verification-loop-contracts.js`, `fixtures/contracts/adoption-main-verification/*.json`, and `tests/v68-adoption-main-verification-loop.test.js`. |
| Adoption confirm is preview/confirm bound and recoverable. | `src/symphony/adoption-main-verification-loop-backend.js` writes journal state before apply, records operation runs, and exposes rollback refs. |
| Main verification remains controlled and explicit. | Fixed suite preview/confirm records verification output and prepares a separate gate draft; tests assert `mutationPerformed: false` on the draft. |
| Negative cases block before mutation. | Tests cover missing reviewer approval, dirty worktree, stale worker evidence, patch mismatch, unsafe patch, unsupported deletion, missing artifact, stale plan hashes, and command-field injection. |
| Workbench does not become an executor. | `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, and Workbench source tests. |
| v69 handoff is scoped to recovery and diagnostics. | `docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md`. |

## Residual Risk

v68 proves the default fake end-to-end loop through contracts, fixtures, backend preview/confirm routes, operation records, Workbench projection, and tests. It does not run a real provider adoption or real provider reviewer smoke.

v68 prepares a `main.verification-passed` gate draft but does not register the gate, declare release readiness, merge, tag, or publish from product code. The release controller remains outside the product.

## Rollback

If adoption confirm skips fingerprint checks, accepts stale `planHash`, applies an unfrozen patch, runs providers, writes raw output, or cannot recover from a failed apply, revert PR #158 and dependent Workbench changes.

If main verification success auto-registers a gate, marks release ready, accepts arbitrary command fields, or mutates product release state, revert PR #159 and dependent Workbench changes.

If Workbench exposes shell, terminal, arbitrary command launch, raw transcripts, raw output, local provider sessions, direct task completion, direct main verification, release-ready controls, product git writes, or GitHub Release automation, revert PR #160 and rebuild static assets from the reverted source.
