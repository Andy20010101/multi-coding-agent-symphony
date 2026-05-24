# v12 Release Evidence: Verified Adoption

Date: 2026-05-24

## Scope

v12 implements controlled verified adoption for changes produced by a passed v11 isolated workspace run.

- `symphony adopt --run <run-id>` creates `.symphony/adoptions/<adoption-id>.json` plus a registered frozen patch artifact.
- `symphony adopt --confirm <adoption-id>` writes a journal and `applying` run state after project, git, dirty-worktree, source workspace, patch hash, and `git apply --check` validation, then applies only the frozen patch.
- `symphony adopt --inspect <adoption-id> --json` is read-only recovery visibility for plan refs, journal refs, latest confirmation state, and current worktree hash matches.
- Workbench and diagnostics remain read-only and copy-only.

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
- `pnpm audit --audit-level high`: passed. The audit reported one moderate vulnerability and no high-or-critical vulnerabilities.
- `pnpm test:mutation:gate`: passed. Final mutation score was 74.22, above the configured break threshold of 60. The first sandboxed attempt was blocked by Stryker's local logging server bind; the approved rerun passed.

## Smoke

The smoke used a temporary git fixture project and invoked the product CLI functions end to end with a fake local harness runner for the v11 isolated workspace. No adapter, model, package installer, or external service was invoked by adoption.

Flow:

```sh
symphony scan --project-dir <fixture> --state-dir <fixture>/.symphony --json
symphony do --project-dir <fixture> --state-dir <fixture>/.symphony --work-dir <fixture>/.symphony/work --write --json "edit README"
symphony do --state-dir <fixture>/.symphony --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --state-dir <fixture>/.symphony --json
symphony adopt --inspect <adoption-id> --state-dir <fixture>/.symphony --json
symphony adopt --confirm <adoption-id> --state-dir <fixture>/.symphony --json
symphony adopt --inspect <adoption-id> --state-dir <fixture>/.symphony --json
git diff --name-only
```

Observed smoke output:

```json
{
  "changedFiles": ["README.md"],
  "mainUnchangedBeforeAdoptConfirm": true,
  "journalWrittenBeforeApply": true,
  "applyingRunStateWrittenBeforeApply": true,
  "finalHashMatchesFrozenPatch": true,
  "inspectRuntimeWrites": false,
  "inspectAfterHashMatch": true,
  "inspectBeforeFilesMatch": false
}
```

The final `git diff --name-only` list exactly matched the frozen adoption plan `changedFiles`, and the final README hash matched the plan `fileOperations[0].afterHash`. Additional risk-convergence smoke covered a tampered `afterHash` after patch application: Symphony did not roll back the main worktree, best-effort wrote a failed confirmation run with `failurePhase: "post-apply-evidence"` and the journal ref, and `symphony diagnose --json` surfaced `adoption_post_apply_failed` plus `adoption_apply_in_progress`.

## Residual Risks

- v12 intentionally supports only text add/modify operations.
- Patch application and post-apply evidence persistence are not transactional; post-apply failures keep the main worktree changes and require inspection with `symphony adopt --inspect <adoption-id> --json` or `symphony status`.
- Adoption validates patch integrity and source evidence, not semantic product correctness.
