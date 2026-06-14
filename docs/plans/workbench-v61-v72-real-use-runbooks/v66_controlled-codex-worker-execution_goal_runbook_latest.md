# v66 Controlled Codex Worker Execution goal runbook

Date: 2026-06-15
Goal id: `v66-controlled-codex-worker-execution`
Branch draft: `codex/v66-controlled-codex-worker-execution`
Start condition: v65 confirms Codex is the worker candidate and Claude Code is the reviewer candidate, with unsupported providers blocked.

Scope note: this runbook continues the v65 provider boundary. Codex CLI is the worker candidate. Claude Code CLI is the reviewer candidate. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a Workbench provider.

## Start Evidence

v66 starts from the v65 release boundary:

- `origin/main`: `089501278a59d168f09262e96ae6a79854b09b4b`;
- merged v65 PRs: #141 runbook, #142 contracts and tests, #143 backend projection and docs, #144 Workbench Provider Hub UI, #145 acceptance and closeout;
- annotated tag `v65`: `9e9f68aec8a1e89e92597a01c45c7de2df5aeb29`;
- peeled tag `v65^{}`: `089501278a59d168f09262e96ae6a79854b09b4b`;
- GitHub Release `v65`: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v65`;
- release state: non-draft, non-prerelease, assets `[]`, `publishedAt` `2026-06-14T20:27:30Z`, `targetCommitish` `main`;
- open PRs at v66 start: `[]`.

## Objective

v66 should make Codex worker execution real through a backend-owned preview/confirm contract. It must not become a generic terminal or arbitrary prompt launcher.

## Target Path

```text
active goal/task
-> worker run preview
-> planHash confirm
-> isolated workspace / controlled provider run
-> sanitized worker evidence
-> needs-review state
-> v66 closeout and v67 handoff
```

## Boundary

Allowed work:

- add `workerRunPreview.v1` and `workerRunResult.v1`, or extend the existing controlled provider execution contract;
- bind worker run confirm to preview `planHash`, active goal id, task id, provider id, command template id, timeout, and workspace policy;
- use fake Codex adapter in tests and optional real Codex smoke only when explicitly enabled;
- write sanitized artifact refs, changed-file summary, verifier summary, and failure layer;
- display worker run status in Workbench without raw transcript, raw model output, local session path, or arbitrary command text;
- leave reviewer approval, adoption, and main verification for later versions.

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
- frontend-supplied freeform provider command;
- using provider success as task completion;
- using provider output as review approval;
- writing directly to the main worktree from a provider run.

## Expected Deliverables

- `src/symphony/worker-run-contracts.js`;
- `fixtures/contracts/worker-run/*.json`;
- `tests/v66-controlled-codex-worker-execution.test.js`;
- `docs/qa/v66-controlled-codex-worker-execution-acceptance.md`;
- `docs/plans/v66-controlled-codex-worker-execution-closeout-snapshot-2026-06-14.md`;
- `docs/plans/v67-claude-code-reviewer-lane-runbook-2026-06-14.md`.

## PR Breakdown

### PR-0: Runbook

Scope:

- Add v66 runbook.
- Confirm v65 provider readiness source refs.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Worker run preview/result contracts

Scope:

- Add worker run preview and result contracts.
- Fixtures: ready preview, missing provider, provider blocked, stale planHash, timeout, failed verifier, sanitized success, unsafe raw output rejected, direct main-write rejected.
- Contract derives blocked state from explicit inputs.

Validation:

```sh
node --test tests/v66-controlled-codex-worker-execution.test.js
node --test tests/v65-provider-readiness-codex-claude-only.test.js
pnpm check
git diff --check
```

### PR-2: Backend preview/confirm path with fake adapter

Scope:

- Add backend-owned preview and confirm path.
- Confirm accepts only preview `planHash`, active goal/task identity, fixed provider id `codex-cli`, fixed command template, and controlled timeout.
- In tests, run fake adapter and write deterministic artifact refs.
- Do not call real Codex unless opt-in env is set.

Validation:

```sh
node --test tests/v66-controlled-codex-worker-execution.test.js
node --test tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
pnpm check
git diff --check
```

### PR-3: Workbench worker execution lane

Scope:

- Add Worker Run lane with preview, confirm readiness, run status, evidence refs, failure layer, and next safe action.
- Use controls only for the specific backend preview/confirm contract, not generic commands.
- Assert no raw output, transcript, local session path, shell, terminal, arbitrary prompt, or direct task-complete controls appear.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v66-controlled-codex-worker-execution.test.js
pnpm check
git diff --check
```

### PR-4: Acceptance evidence and v67 handoff

Scope:

- Record fake adapter evidence and optional real Codex evidence if run.
- Record that worker success produces `needs-review`, not `approved`, `main-verified`, or `release-ready`.
- Hand off to Claude Code reviewer lane.

Validation:

```sh
pnpm workbench:build
node --test tests/v66-controlled-codex-worker-execution.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by each PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v66-controlled-codex-worker-execution.test.js
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

If backend confirm accepts freeform command text, arbitrary provider id, stale `planHash`, or writes to the main worktree, revert the backend PR.

If Workbench exposes generic shell, terminal, prompt launch, raw provider output, or local session links, revert the Workbench PR.

## Next-version Handoff

v67 should consume sanitized Codex worker evidence and run Claude Code as a controlled reviewer.
