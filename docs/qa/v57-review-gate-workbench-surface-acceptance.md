# v57 Review Gate Workbench Surface acceptance

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal: `v57-review-gate-workbench-surface`
PR-5 branch: `codex/v57-acceptance-closeout-v58-handoff`
Acceptance baseline: `94b5ba5ea46f97c97a8c371df95ce15569669623`

## Accepted scope

v57 ships a backend-owned review and gate preview surface on top of the v56 thread handoff pack:

```text
threadHandoffPack.v1
-> reviewGatePreview.v1
-> reviewGateConfirmationPreview.v1
-> reviewGateControlledConfirmationState.v1
-> Workbench Review Gate panel
```

The accepted behavior is:

- ready reviewer verdict registration preview from a ready v56 thread handoff pack and explicit reviewer evidence refs;
- ready main gate registration preview when reviewer evidence and main gate evidence refs are present;
- ready release gate registration preview from the builder when reviewer, main gate, and release gate evidence refs are all explicitly supplied;
- blocked preview when the thread handoff pack is missing;
- blocked preview when reviewer evidence is missing;
- blocked confirmation state for stale plan hash, missing explicit operator id, provider-originated operator id, and plan-hash mismatch;
- rejection of raw transcript, raw provider output, local session refs, `.jsonl` refs, and direct mutation route drift;
- Workbench Desktop App Home display for readiness, source refs, blocked reasons, confirmation metadata, and boundary flags.

v57 does not ship automatic reviewer verdicts, provider self-approval, automatic main gate mutation, automatic release gate mutation, provider launch, shell or terminal UI, arbitrary Workbench command execution, frontend local JSONL or provider session reads, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, git mutation, tag automation, publish automation, or GitHub Release automation.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Ready reviewer verdict preview | `fixtures/contracts/review-gate-workbench-surface/review-gate-preview.ready-reviewer-verdict.v1.json`; `tests/v57-review-gate-workbench-surface.test.js` validates `reviewReadiness.state: ready`, event type `reviewer.approved`, and `nextSafeAction.actionId: preview-reviewer-verdict-registration`. |
| Ready main gate preview | `fixtures/contracts/review-gate-workbench-surface/review-gate-preview.ready-main-gate.v1.json`; contract and backend tests validate event type `main.verification-passed`, main gate readiness, required reviewer and main evidence refs, and controlled event registration metadata. |
| Ready release gate preview | PR-5 extends `tests/v57-review-gate-workbench-surface.test.js` to build `target: release-gate` from explicit reviewer, main gate, and release gate evidence refs. The test validates `releaseGateReadiness.state: ready`, event type `release.gate-passed`, and `nextSafeAction.actionId: preview-release-gate-registration`. |
| Missing thread handoff pack | `review-gate-preview.blocked-missing-thread-handoff-pack.v1.json`; tests validate `sourceThreadHandoffPack.state: missing`, blocked reason `missing-thread-handoff-pack`, and no confirmation previews. |
| Missing reviewer evidence | `review-gate-preview.blocked-missing-reviewer-evidence.v1.json`; tests validate `reviewReadiness.state: blocked`, blocked reason `missing-reviewer-evidence`, and no confirmation previews. |
| Stale plan hash | `review-gate-preview.blocked-stale-plan-hash.v1.json`; tests validate blocked readiness, `planHashState: stale`, and blocked confirmation preview state. |
| Explicit operator required | `buildReviewGateControlledConfirmationState` tests require an explicit non-provider operator id before preview and confirm request shapes are exposed. |
| Unsafe raw transcript rejection | `review-gate-preview.raw-transcript.invalid.v1.json`; contract validation rejects raw transcript and raw provider output fields. |
| Unsafe local session rejection | `review-gate-preview.local-session.invalid.v1.json`; contract validation rejects local session refs and unsafe source evidence refs. |
| Unsafe mutation rejection | `review-gate-preview.unsafe-mutation.invalid.v1.json`; contract validation rejects direct goal event append and confirmation mutation drift. |
| Backend projection | `tests/v57-review-gate-backend-projection.test.js` projects ready reviewer verdict and controlled main gate previews from backend-owned run, intake, recovery, handoff, and thread pack state. |
| Workbench display | `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` project and render the Review Gate panel on Desktop App Home after the v56 Thread Pack lane. |

## Workbench acceptance

The Workbench panel added in PR #102 renders:

- `Review Gate Preview`;
- `Reviewer Verdict`;
- `Main Gate`;
- `Release Gate`;
- `Controlled Confirmation State`;
- `Source Contracts`;
- `Safety Boundaries`;
- `reviewGatePreview.v1`;
- `reviewGateControlledConfirmationState.v1`;
- `controlled-event-registration`;
- `event-plan-preview` and `event-plan-confirm` route metadata as inert text.

The SSR test asserts the Review Gate panel shows false boundary values for automatic reviewer verdict, provider self approval, provider launch, goal event write, task completion write, generic shell, main gate mutation, release gate mutation, git mutation, tag automation, and publish automation. It also asserts controlled event registration remains available only through the existing controlled event registration path.

A console-served Browser smoke opened `http://127.0.0.1:8770/workbench/desktop/` after `pnpm workbench:build`. DOM verification found `#review-gate-workbench-panel`, `Review Gate Preview`, `Reviewer Verdict`, `Main Gate`, `Release Gate`, `Controlled Confirmation State`, `Source Contracts`, and `Safety Boundaries`. The panel contained zero `button`, `form`, `textarea`, `input`, `select`, `[role="button"]`, or `[onclick]` elements.

The live repository state can show the Review Gate contract as `missing` until a current goal supplies matching v57 evidence. Fixture, backend, and builder tests cover ready reviewer, ready main, ready release, blocked, stale, and unsafe-source states.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v57-review-gate-workbench-surface.test.js tests/v57-review-gate-backend-projection.test.js tests/v56-thread-continuation-reviewer-handoff-pack.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v54-codex-provider-execution-pilot.test.js tests/v51-result-intake-evidence-escrow.test.js` | Passed on the PR-5 branch after the release gate acceptance assertion was added: 68 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on the PR-5 branch: 120 tests, 0 failures. The run printed a non-failing Vite WebSocket port warning for port `24678`. |
| `pnpm workbench:build` | Passed on the PR-5 branch. |
| `pnpm check` | Passed on the PR-5 branch. |
| `git diff --check` | Passed on the PR-5 branch before staging. |
| `git diff --cached --check` | Passed on the PR-5 branch after staging. |
| GitHub CI for PR #99, #100, #101, and #102 | Passed before each implementation PR was merged. |

## Boundary result

The accepted path prepares review and gate registration previews from backend-owned evidence and explicit operator confirmation state. It does not decide the reviewer verdict, mark main verification passed, mark release validation passed, tag the repository, publish a release, or create a GitHub Release.
