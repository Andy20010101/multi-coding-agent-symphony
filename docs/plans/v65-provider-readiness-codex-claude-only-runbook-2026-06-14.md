# v65 Provider Readiness: Codex and Claude Code Only goal runbook

Date: 2026-06-15
Goal id: `v65-provider-readiness-codex-claude-only`
Branch draft: `codex/v65-provider-readiness-codex-claude-only`
Start condition: v64 first-run project/settings flow is merged and current project binding is visible.

Scope note: these runbooks are repository-ready planning files for `multi-coding-agent-symphony`. They continue the current v60 boundary: browser and renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher. Primary model/tool line after v60: Codex and Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.

## Objective

v65 should eliminate provider ambiguity. The active Workbench provider line becomes Codex for worker execution and Claude Code for reviewer execution. Kiro becomes historical compatibility only. DeepSeek is only a Claude Code provider configuration detail.

## Target Path

```text
current project selected
-> provider readiness matrix
-> Codex worker candidate
-> Claude Code reviewer candidate
-> unsupported/historical provider blockers
-> v65 closeout and v66 handoff
```

## Boundary

Allowed work:

- add or update provider readiness contracts for Codex and Claude Code;
- surface sanitized environment/configuration presence without exposing secrets;
- record model profile status, help-smoke status, optional real-smoke status, and blocker reasons;
- mark Kiro historical and not an active Workbench provider;
- mark DeepSeek as Claude Code provider config only, not an independent Workbench provider;
- update Provider Hub and docs to match the two-provider line.

Forbidden work:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, or raw model output;
- unsupported provider claims;
- direct goal event append from provider output;
- direct task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- git merge, push, tag, publish, or GitHub Release automation inside product code;
- public distribution, notarization, or auto-update claims unless the version explicitly proves them;
- generic provider picker;
- raw provider CLI stdout/stderr as Workbench payload;
- provider execution from readiness cards;
- claiming Claude Code active execution before v67 proves reviewer lane.

## Expected Deliverables

- `src/symphony/provider-readiness-contracts.js`;
- `fixtures/contracts/provider-readiness/*.json`;
- `tests/v65-provider-readiness-codex-claude-only.test.js`;
- `docs/provider-boundary-guide.md`;
- `docs/qa/v65-provider-readiness-codex-claude-only-acceptance.md`;
- `docs/plans/v65-provider-readiness-codex-claude-only-closeout-snapshot-2026-06-14.md`;
- `docs/plans/v66-controlled-codex-worker-execution-runbook-2026-06-14.md`.

## PR Breakdown

### PR-0: Runbook

Scope:

- Add v65 runbook.
- Record provider policy: Codex worker, Claude Code reviewer, operator main verifier.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Provider readiness contracts and fixtures

Scope:

- Add provider readiness contract for Codex and Claude Code.
- Fixtures: both ready, Codex missing, Claude missing, Claude provider mismatch, missing DeepSeek config, Kiro historical, unsupported provider claim blocked.
- Reject secret values, local session paths, raw provider output, and unsupported provider active claims.

Validation:

```sh
node --test tests/v65-provider-readiness-codex-claude-only.test.js
pnpm check
git diff --check
```

### PR-2: Backend projection and provider boundary docs

Scope:

- Project readiness into Provider Hub source contracts.
- Update provider boundary guide and README wording.
- Keep readiness separate from execution.

Validation:

```sh
node --test tests/v65-provider-readiness-codex-claude-only.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
pnpm check
git diff --check
```

### PR-3: Workbench Provider Hub two-provider surface

Scope:

- Display Codex worker candidate and Claude Code reviewer candidate.
- Display operator as main verifier.
- Hide or demote Kiro to historical compatibility.
- Display unsupported providers as blocked.
- Add no launch buttons, raw CLI output, or provider session links.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v65-provider-readiness-codex-claude-only.test.js
pnpm check
git diff --check
```

### PR-4: Optional local real-smoke evidence and closeout

Scope:

- If operator opts in, record Codex and Claude help or real smoke proof refs.
- If not run, record `not run` and blocker/reason; do not fake readiness.
- Hand off to controlled Codex worker execution.

Validation:

```sh
node --test tests/v65-provider-readiness-codex-claude-only.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v65-provider-readiness-codex-claude-only.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance Criteria

The version is acceptable only when:

1. implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback Path

If provider contracts accept Kiro, Gemini, DeepSeek-as-provider, or arbitrary providers as active Workbench execution targets, revert the contract PR.

If Workbench adds provider launch controls or exposes raw provider output/session paths, revert the Workbench PR.

## Next-version Handoff

v66 should use Codex readiness to implement a backend-owned, planHash-bound worker execution path.
