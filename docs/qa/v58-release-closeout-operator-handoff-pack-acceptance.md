# v58 Release Closeout Operator Handoff Pack acceptance

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal: `v58-release-closeout-operator-handoff-pack`
Acceptance branch: `codex/v58-acceptance-closeout-v59-handoff`
Main before PR-5: `8fad03b7dd6824a2181d6e939747865547d6de6e`

## Accepted surfaces

v58 adds a read-only release closeout handoff pack:

```text
reviewGatePreview.v1
-> reviewGateControlledConfirmationState.v1
-> goal-closeout-report.v1
-> releaseCloseoutHandoffPack.v1
-> Workbench Release Closeout Handoff lane
```

The product path now exposes release evidence refs, target commit metadata, blocked reasons, rollback refs, release notes refs, and next-version context. It does not tag, push, publish, create a GitHub Release, declare release-ready, launch providers, run shell commands, append events directly, complete tasks, or create the next version goal.

## Acceptance scenarios

| Scenario | Evidence |
| --- | --- |
| Ready release closeout handoff pack | `fixtures/contracts/release-closeout-handoff-pack/release-closeout-handoff-pack.ready.v1.json`; validated by `tests/v58-release-closeout-operator-handoff-pack.test.js`. |
| Missing reviewer verdict blocks handoff | `release-closeout-handoff-pack.blocked-missing-reviewer-verdict.v1.json`; `blockedReasons` includes `missing-reviewer-verdict`. |
| Missing main gate evidence blocks handoff | `release-closeout-handoff-pack.blocked-missing-main-gate-evidence.v1.json`; `blockedReasons` includes `missing-main-gate-evidence`. |
| Missing release evidence blocks handoff | `release-closeout-handoff-pack.blocked-missing-release-evidence.v1.json`; `blockedReasons` includes `missing-release-evidence`. |
| Dirty or diverged release baseline blocks handoff | `release-closeout-handoff-pack.blocked-dirty-release-baseline.v1.json`; `blockedReasons` includes `dirty-or-diverged-release-baseline`, `release-baseline-not-main`, and `release-baseline-dirty`. |
| Stale target commit blocks handoff | `release-closeout-handoff-pack.blocked-stale-target-commit.v1.json`; `targetCommit.stale` is `true`. |
| Missing next-version runbook blocks handoff | `release-closeout-handoff-pack.blocked-missing-next-version-runbook.v1.json`; `blockedReasons` includes `missing-next-version-runbook`. |
| Raw transcript refs are rejected | `release-closeout-handoff-pack.raw-transcript.invalid.v1.json`; validation fails on `rawTranscript`. |
| Local session refs are rejected | `release-closeout-handoff-pack.local-session.invalid.v1.json`; validation fails on local session path exposure. |
| Git/tag/publish mutation drift is rejected | `release-closeout-handoff-pack.unsafe-mutation.invalid.v1.json`; validation fails on `gitTagAvailable` drift and unsafe mutation text. |

## Backend projection evidence

`tests/v58-release-closeout-backend-projection.test.js` verifies that `goal-supervisor-app-read-model.v1` projects `releaseCloseoutHandoffPack.v1` from backend-owned source state. The ready case binds:

- target commit `8384f51e1911f69857cb43316c966fd36a7da76f`;
- main gate evidence ref `docs/plans/v58-main-gate-evidence-2026-06-14.md`;
- release gate evidence ref `docs/plans/v58-release-gate-evidence-2026-06-14.md`;
- validation evidence ref `docs/plans/v58-validation-evidence-2026-06-14.md`;
- rollback ref `docs/plans/v58-rollback-path-2026-06-14.md`;
- next-version runbook ref `docs/plans/v59-runbook-2026-06-14.md`.

The same suite checks blocked dirty baseline, stale target commit, missing release evidence, and unsafe release note refs. Unsafe refs are converted into blocked reasons instead of being rendered into the Workbench model.

## Workbench evidence

`tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` verify the Desktop App Home lane:

- `#release-closeout-handoff-panel` renders after `#review-gate-workbench-panel`;
- sidebar link `Release Handoff` targets the panel;
- visible section labels are `Release Closeout Handoff`, `Release Evidence Refs`, `Target Commit`, `Tag and Release Checklist`, `Known Blockers`, `Rollback Path`, and `Next Version Context`;
- the panel shows `releaseCloseoutHandoffPack.v1`, `tagReleaseOperatorChecklist.v1`, validation refs, rollback refs, and `v59` runbook refs;
- boundary fields show tag capability, remote tag capability, release page creation, provider launch, shell, goal event write, task completion write, and automatic next version goal as `false`;
- the panel contains no button, form, textarea, clipboard call, browser open call, controlled event confirm call, tag execution label, publish label, shell label, transcript label, direct event append label, task completion label, or next-goal creation label.

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v57-review-gate-workbench-surface.test.js` | Passed on PR-5 branch: 14 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed on PR-5 branch: 120 tests, 0 failures. The Workbench run printed a non-failing Vite WebSocket warning for port `24678`. |
| `pnpm workbench:build` | Passed on PR-5 branch. |
| `pnpm check` | Passed on PR-5 branch. |
| `git diff --check` | Passed on PR-5 branch after docs were added. |

## Boundary check

v58 does not add product code for `git tag`, `git push`, `gh release create`, `gh release edit`, release publication, release-ready declaration, provider launch, shell execution, terminal UI, frontend local JSONL reads, provider session folder reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, automatic worktree creation, or automatic next-version goal creation.
