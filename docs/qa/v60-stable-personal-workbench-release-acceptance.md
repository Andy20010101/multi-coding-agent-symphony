# v60 Stable Personal Workbench Release acceptance

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal: `v60-stable-personal-workbench-release`
Acceptance branch: `codex/v60-acceptance-evidence`
Main before PR-4: `e2420ec500050c3a7ea2145a99b5b7950dcaa36d`

## Accepted baseline

v60 consolidates the v52-v59 Workbench chain into one stable local baseline:

```text
systemGoldenPath.v1
-> childDispatchPreview.v1
-> codexProviderExecutionPilot.v1
-> codexProviderRunRecoveryReviewerHandoff.v1
-> threadContinuationReviewerHandoffPack.v1
-> reviewGateWorkbenchSurface.v1
-> releaseCloseoutHandoffPack.v1
-> releasePublicationEvidence.v1
-> stableWorkbenchRelease.v1
-> Workbench Stable Baseline lane
```

The accepted v60 state is a read-only Workbench baseline for local supervised development work. It keeps project entry, goal supervision, context, result intake, controlled event registration, child task planning, provider execution preview, review gates, thread handoff, release closeout, release publication evidence, and release boundary checks visible from the Workbench.

v60 does not add a generic shell, terminal UI, renderer-side command execution, unsupported provider execution, frontend reads of local JSONL/session/provider folders, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, git write/merge/tag/push automation, GitHub Release creation or edit automation, public distribution, notarization, auto-update, automatic worktree creation, or automatic next-version goal creation.

## Version evidence

| Version | Accepted evidence |
| --- | --- |
| v52 System Golden Path | `docs/qa/v52-system-golden-path-closeout-acceptance.md` and `tests/v52-system-golden-path.test.js` cover the Workbench path across Project Launcher, App Home, Supervisor, Context Advisory, Result Intake, Event Preview / Confirm, Review / Gate, and Closeout state. |
| v53 child dispatch preview | `docs/qa/v53-controlled-child-dispatch-preview-acceptance.md` and `tests/v53-child-dispatch-preview.test.js` cover backend-owned child task preview evidence. The Workbench path remains preview and copy-only; it does not dispatch children or create worktrees. |
| v54 Codex provider execution preview | `docs/qa/v54-codex-provider-execution-pilot-acceptance.md` and `tests/v54-codex-provider-execution-pilot.test.js` cover the tested Codex provider preview contract. The active provider claim is limited to `codex-cli` with `controlled-provider-execution-preview` and `tested-preview`. |
| v55 run recovery and reviewer handoff | `docs/qa/v55-codex-provider-run-recovery-reviewer-handoff-acceptance.md` and `tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` cover recovery state and reviewer handoff evidence without exposing raw provider output or local session paths. |
| v56 thread continuation pack | `docs/qa/v56-thread-continuation-reviewer-handoff-pack-acceptance.md` and `tests/v56-thread-continuation-reviewer-handoff-pack.test.js` cover bounded continuation context. The pack is copy-only and rejects raw transcript, raw model output, provider output, local session refs, and mutation routes. |
| v57 review gate Workbench surface | `docs/qa/v57-review-gate-workbench-surface-acceptance.md` and `tests/v57-review-gate-workbench-surface.test.js` cover reviewer verdict, main gate, release gate, blocked, stale-plan, and unsafe-source states. The Workbench does not approve review, pass main verification, or infer release readiness. |
| v58 release closeout handoff | `docs/qa/v58-release-closeout-operator-handoff-pack-acceptance.md`, `tests/v58-release-closeout-operator-handoff-pack.test.js`, and `tests/v58-release-closeout-backend-projection.test.js` cover closeout refs, release boundary checks, rollback refs, release note refs, and next-version context. Product code does not tag, push, publish, create a GitHub Release, or create the next goal. |
| v59 release publication evidence | `docs/qa/v59-release-publication-evidence-and-next-start-audit-acceptance.md`, `tests/v59-release-publication-evidence.test.js`, and `tests/v59-release-publication-backend-projection.test.js` cover tag evidence, GitHub Release evidence, target commit checks, empty assets, draft/prerelease blockers, rollback refs, and next-version start audit state. Product code records external evidence only. |

## v60 acceptance scenarios

| Scenario | Evidence |
| --- | --- |
| Ready stable Workbench baseline | `fixtures/contracts/stable-workbench-release/stable-workbench-release.ready.v1.json`; validated by `tests/v60-stable-personal-workbench-release.test.js`. |
| Missing required Workbench surface blocks acceptance | `stable-workbench-release.blocked-missing-surface.v1.json`; `blockedReasons` includes `missing-stable-workbench-surface`. |
| Release boundary drift blocks acceptance | `stable-workbench-release.blocked-release-boundary-drift.v1.json`; `releaseBoundary.automationObserved` is `true` and validation records `release-boundary-drift`. |
| Unsupported provider claim blocks acceptance | `stable-workbench-release.blocked-unsupported-provider-claim.v1.json`; validation blocks claims outside the tested `codex-cli` preview path. |
| Local session, raw transcript, or raw model output exposure blocks acceptance | `stable-workbench-release.blocked-local-session-or-transcript-exposure.v1.json`; safety fields record the exposure and the contract blocks it. |
| Generic shell, terminal, or renderer command execution blocks acceptance | `stable-workbench-release.blocked-command-execution.v1.json`; safety fields record command boundary drift. |
| Direct event append or task completion blocks acceptance | `stable-workbench-release.blocked-direct-mutation.v1.json`; safety fields record direct mutation drift. |
| Automatic worktree or next-goal creation blocks acceptance | `stable-workbench-release.blocked-automatic-worktree-or-next-goal.v1.json`; safety fields record automatic workflow drift. |
| Backend projection exposes the stable baseline | `tests/v60-stable-personal-workbench-release.test.js` builds `goal-supervisor-app-read-model.v1` with explicit stable baseline facts and validates `stableWorkbenchRelease.v1`. |
| Backend projection blocks missing source surfaces | The same test derives a blocked stable baseline when backend source surfaces are not ready. The result keeps manual release boundary fields and disabled safety flags. |
| Workbench renders the stable baseline lane | `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` project and render `stableWorkbenchRelease.v1` into Desktop App Home. |

## Workbench acceptance

The Workbench stable baseline lane renders:

- `Stable Workbench Baseline`;
- `Surface Matrix`;
- `Provider Boundary`;
- `Release Boundary`;
- `Safety Checks`;
- `Evidence Refs`;
- `stableWorkbenchRelease.v1`;
- current tagged release `v59`;
- active version `v60`;
- active provider claim `codex-cli`;
- manual release boundary fields for tag, push tag, GitHub Release, and release-ready declaration.

The Workbench tests assert that the lane contains no `button`, `form`, `textarea`, clipboard call, browser open call, `fetch` call, generic release control, tag execution label, push execution label, publish label, GitHub Release create/edit label, shell label, terminal label, local file read label, transcript label, direct event append label, task completion label, worktree creation label, or next-goal creation label.

The main Workbench navigation points `Stable Baseline` to `/workbench/desktop/#stable-workbench-release-panel`, matching the panel location in Desktop App Home.

## Release boundary

The stable baseline records v59 as the current completed release. Before PR-4, `main` and `origin/main` point to `e2420ec500050c3a7ea2145a99b5b7950dcaa36d`, after PR #117 merged. The v60 tag and v60 GitHub Release do not exist yet.

The v60 product path only displays or validates release boundary state. The controller remains responsible for annotated tag creation, tag push, GitHub Release creation, publication checks, and final release verification after PR-5 merges.

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v60-stable-personal-workbench-release.test.js` | Passed on PR-4 branch. |
| `node --test tests/v59-release-publication-evidence.test.js tests/v59-release-publication-backend-projection.test.js` | Passed on PR-4 branch. |
| `node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v58-release-closeout-backend-projection.test.js` | Passed on PR-4 branch. |
| `node --test tests/v57-review-gate-workbench-surface.test.js tests/v56-thread-continuation-reviewer-handoff-pack.test.js` | Passed on PR-4 branch. |
| `node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v54-codex-provider-execution-pilot.test.js` | Passed on PR-4 branch. |
| `node --test tests/v53-child-dispatch-preview.test.js tests/v52-system-golden-path.test.js` | Passed on PR-4 branch. |
| `node --test tests/v51-result-intake-evidence-escrow.test.js tests/v50-supervisor-event-registration-eligibility.test.js` | Passed on PR-4 branch. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-4 branch. The Workbench run can print a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed on PR-4 branch. |
| `pnpm check` | Passed on PR-4 branch. |
| `git diff --check` | Passed on PR-4 branch. |
| `git diff --cached --check` | Passed on PR-4 branch after staging. |

## Boundary check

v60 acceptance is limited to documented, tested local Workbench baseline evidence. It does not claim public distribution, notarization, auto-update, generic execution, unsupported provider support, provider launch, raw transcript access, raw model output access, frontend local file access, direct event mutation, direct task completion, release automation, or automatic next-version setup.
