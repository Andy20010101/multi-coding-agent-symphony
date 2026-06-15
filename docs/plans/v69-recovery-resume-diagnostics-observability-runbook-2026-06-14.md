# v69 Recovery, Resume, Diagnostics, and Observability goal runbook

Date: 2026-06-15
Goal id: `v69-recovery-resume-diagnostics-observability`
Branch draft: `codex/v69-recovery-resume-diagnostics-observability`
Start condition: v68 worker/reviewer/adoption/main-verification loop is merged, tagged, released, and has fake end-to-end acceptance evidence.

Scope note: v69 continues the v66-v68 boundary. Browser and renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher. Codex remains the worker candidate and Claude Code remains the reviewer candidate. Kiro is historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a separate Workbench provider.

## Objective

v69 should make the new loop durable. The operator should understand and recover from interrupted provider runs, timeouts, missing artifacts, stale plans, dirty worktrees, provider unavailable states, adoption failures, and verification failures.

## Target Path

```text
controlled execution loop
-> run timeline
-> failure classification
-> recovery preview
-> resume / retry / handoff / mark-blocked
-> diagnostics bundle
-> v69 closeout and v70 handoff
```

## Boundary

Allowed work:

- add structured operation timeline across worker, reviewer, adoption, verification, and gate steps;
- add failure layer taxonomy: schema, provider, workspace, verifier, artifact, review, adoption, git, test, release-boundary, unknown;
- add recovery preview contract with next safe actions;
- support controlled retry/resume only where source fingerprints and `planHash` remain valid;
- record usage, cost, and time fields as observed, unavailable, or unknown;
- add diagnostics summary that redacts secrets, raw logs, raw provider output, transcripts, and local session paths.

Forbidden work:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw provider output, or raw model output;
- unsupported provider claims;
- direct goal event append from provider output;
- direct task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- git merge, push, tag, publish, or GitHub Release automation inside product code;
- public distribution, notarization, or auto-update claims unless the version explicitly proves them;
- hidden automatic retry loops;
- cost estimation presented as observed fact;
- copying raw logs or secrets into diagnostics payloads;
- retrying with a different provider without explicit preview/confirm.

## Expected Deliverables

- `src/symphony/run-recovery-contracts.js`;
- `fixtures/contracts/run-recovery/*.json`;
- `tests/v69-recovery-resume-diagnostics-observability.test.js`;
- `docs/qa/v69-recovery-resume-diagnostics-observability-acceptance.md`;
- `docs/plans/v69-recovery-resume-diagnostics-observability-closeout-snapshot-2026-06-14.md`;
- `docs/plans/v70-release-manager-practical-loop-runbook-2026-06-14.md`.

## PR Breakdown

### PR-0: Runbook

Scope:

- Add v69 runbook.
- Define failure taxonomy and recovery boundaries.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Timeline and failure taxonomy contracts

Scope:

- Add `operationTimeline.v1` and `operationFailureClassification.v1`.
- Fixtures for worker timeout, reviewer blocked, missing artifact, stale `planHash`, dirty worktree, verification failure, adoption failure, provider unavailable, and unknown failure.
- Include timestamps, operation id, provider id where applicable, artifact refs, failure layer, and next safe action.

Validation:

```sh
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
pnpm check
git diff --check
```

### PR-2: Recovery preview and controlled resume

Scope:

- Add recovery preview for retry with the same provider, handoff to an allowed provider, mark blocked, rerun verification, inspect adoption journal, or request operator decision.
- Resume/confirm must be `planHash`-bound and must revalidate fingerprints.
- No hidden retries.

Validation:

```sh
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
pnpm check
git diff --check
```

### PR-3: Diagnostics and usage/time observability

Scope:

- Add diagnostics bundle extension for the v66-v68 loop.
- Add usage fields: token input/output if observed, cost if observed, elapsed time, provider call count, status `observed` / `unavailable` / `unknown`.
- Redact secrets, raw logs, raw output, transcripts, and session paths.

Validation:

```sh
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/security-policy.test.js
pnpm check
git diff --check
```

### PR-4: Workbench recovery surface

Scope:

- Add Recovery / Timeline card to the execution loop.
- Show failure layer, affected step, available recovery previews, evidence refs, and copy-only diagnostics summary.
- Do not expose raw logs, terminal, shell, arbitrary provider command, or hidden retry.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance evidence and v70 handoff

Scope:

- Record recovery evidence for at least timeout, provider unavailable, stale `planHash`, dirty worktree, missing artifact, adoption failure, and verification failure.
- Hand off to release manager practical loop.

Validation:

```sh
pnpm workbench:build
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by each PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/security-policy.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance Criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback Path

If recovery creates hidden retries, skips source validation, or retries with another provider without explicit operator preview/confirm, revert recovery confirm.

If diagnostics expose raw logs, secrets, transcripts, or local session paths, revert diagnostics PR.

If Workbench exposes terminal, shell, arbitrary provider command, raw logs, hidden retry, release-ready controls, product git writes, or GitHub Release automation, revert the Workbench recovery surface and rebuild static assets from the reverted source.

## Next-version Handoff

v70 should use verified development-loop evidence to prepare release readiness, manual publication pack, and post-release reconcile.
