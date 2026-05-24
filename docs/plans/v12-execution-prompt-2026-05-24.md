# v12 Execution Prompt

Use this prompt to start a fresh implementation conversation for v12.

```text
PLEASE IMPLEMENT THIS PLAN:

# v12 Plan: Verified Adoption

Context:
- Repository: multi-coding-agent-symphony.
- Current release scope: v11 controlled kernel execution is merged.
- v11 behavior: `symphony do --write` creates a frozen execution plan; `symphony do --confirm-plan <plan-id>` executes it in a managed isolated workspace and keeps `mainWorktreeWrites: false`.
- Workbench and diagnostics remain read-only/copy-only.
- Full plan document: `docs/plans/v12-verified-adoption-plan-2026-05-24.md`.
- Before editing, read `docs/plans/v12-verified-adoption-plan-2026-05-24.md`; when details conflict, treat that file as the source of truth.

Objective:
Implement v12 verified adoption so verifier-passing isolated workspace changes can be safely adopted into the main worktree through a separate two-step controlled flow.

Required CLI:
- `symphony adopt --run <run-id>` creates `status: "adoption-planned"` and writes `.symphony/adoptions/<adoption-id>.json`.
- `symphony adopt --run <run-id> --json` emits stable product JSON with adoption refs.
- `symphony adopt --confirm <adoption-id>` applies only the frozen adoption patch.
- `symphony adopt --confirm <adoption-id> --json` emits stable product JSON.
- Confirm mode accepts only `--confirm`, `--state-dir`, and `--json`; reject any extra prompt args or execution flags.

Suggested implementation order:
1. Add state/path helpers and contract docs for `symphony.adoption-plan`.
2. Add source run validation and fingerprint helpers.
3. Add patch generation and adoption planning.
4. Add adoption confirmation and patch application.
5. Add read-only Workbench/diagnose visibility.
6. Run smoke and full acceptance.

Likely files:
- `scripts/symphony.js`
- `src/symphony/state.js`
- `src/symphony/contract.js`
- `src/symphony/console.js`
- `tests/symphony-cli.test.js`
- `docs/symphony-product-contracts.md`
- `README.md`

Required artifacts and state:
- Add `symphony.adoption-plan` with `contractVersion: "1"`.
- Store plans under `.symphony/adoptions/<adoption-id>.json`.
- Store a registered patch artifact and include `patchArtifactPath`, `patchHash`, `changedFiles`, and `fileOperations`.
- Source runs must expose `sourceWorkspacePath` and `sourceWorkspaceManifestPath`, or a registered `artifactRefs[]` entry with `kind: "workspace-manifest"`; confirmed v11 runs without workspace refs are not adoptable.
- Product JSON must include at least `adoptionPlanId`, `status`, `sourceRunId`, `executionPlanId`, `patchArtifactPath`, `patchHash`, `changedFiles`, `fileOperations`, and `confirmationCommand`/`nextAction` where applicable.
- Planning run state must keep `mainWorktreeWrites: false`.
- Confirmed adoption run state must set `mainWorktreeWrites: true` only after successful patch application.
- Link source run, execution plan, planned adoption run, adoption plan, patch, evidence, and changed files.

Required guards:
- Plan only from confirmed v11 runs with `status: "passed"` and `verifierStatus: "passed"`.
- Require `writeBoundary: "isolated-workspace"` and `mainWorktreeWrites: false` on the source run.
- Reject missing source run, missing source workspace, missing evidence, stale source metadata, and unsupported source diffs.
- v12 supports only text add/modify file operations.
- Reject deletions, renames, binary files, symlinks, chmod-only diffs, ignored-root changes, and path traversal.
- Reject non-Symphony dirty main worktree changes before planning or confirmation.
- Confirm must revalidate project fingerprint, git HEAD, dirty-worktree fingerprint, source run, source workspace fingerprint, patch hash, and `git apply --check` before writing.
- Planning records the dirty-worktree fingerprint; confirmation must match it while ignoring only Symphony-owned state/runtime paths that are explicitly captured by the plan.
- Confirmation must use only the frozen registered patch artifact and plan hashes/refs; it must not regenerate a diff, reinterpret user intent, or reread the current isolated workspace to decide what to apply.
- Patch candidates must be normalized POSIX relative paths with `fileOperations[]` entries shaped as `{ path, operation: "add" | "modify", beforeHash, afterHash, size, textEncoding }`; evidence `changedFiles` must match the actual supported diff set.
- Adoption must not invoke adapters, generated execution plans, models, package installers, or external services.

Workbench and diagnostics:
- Keep Workbench read-only.
- Show adoption-plan refs, source run, changed files, patch path, and copy-only confirm command.
- Patch preview must use only registered artifact refs and keep the existing 200 KiB cap.
- Extend `symphony diagnose --json` so pending/stale adoption plans and blocking dirty-worktree risks are visible.

Testing:
- Add tests before or alongside implementation in `tests/symphony-cli.test.js`.
- Cover planning success, confirmation success, no main-worktree writes during planning, exact confirm command, state/diagnose/console visibility, and all pre-adapter/pre-write rejection cases.
- Keep existing v10 diagnostics and v11 controlled execution behavior compatible.

Acceptance commands:
- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`

Smoke:
- Create a fixture project.
- Run v11 plan/confirm to produce a passed isolated workspace run.
- Run v12 adopt plan and confirm.
- Prove the main worktree is unchanged until adopt confirm.
- Prove final changed files match the frozen adoption patch.

Deliverables:
- Implementation, tests, docs, and product contract updates.
- Update docs by following existing v10/v11 patterns found with `rg`, especially `docs/symphony-product-contracts.md`, README command examples, and any release/plan evidence docs needed.
- Final summary must include the exact smoke fixture flow or commands used.
- A concise Chinese summary of changed files, verification results, smoke result, and any residual risk.
```
