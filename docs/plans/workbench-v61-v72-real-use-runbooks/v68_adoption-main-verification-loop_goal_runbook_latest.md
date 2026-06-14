# v68 Adoption and Main Verification Workbench Loop goal runbook

Date: 2026-06-14
Goal id: `v68-adoption-main-verification-loop`
Branch draft: `codex/v68-adoption-main-verification-loop`
Start condition: v67 Claude Code reviewer lane is merged and can produce explicit approved / needs-revision / blocked reviewer evidence.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.


## Objective

v68 should connect the practical development loop: approved worker/reviewer evidence can be previewed for adoption, confirmed safely into the main worktree, then verified through explicit main verification evidence and gate confirmation.

## Target path

```text
Codex worker evidence
-> Claude reviewer approved
-> adoption preview
-> adoption confirm
-> main verification preview
-> verification confirm
-> explicit main.verification-passed gate draft
-> v68 closeout and v69 handoff
```

## Boundary

Allowed work:

- reuse or extend existing adoption preview/confirm safety model
- require approved reviewer evidence before adoption preview becomes ready
- verify source fingerprints, dirty worktree, patch fingerprint, and `git apply --check` before adoption
- write adoption journal and recovery state
- run fixed main verification suite through backend-owned confirm path
- generate explicit gate draft but require separate planHash confirm for `main.verification-passed`

Forbidden work:

- generic shell or terminal UI
- arbitrary renderer-side command execution
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, or raw model output
- unsupported provider claims
- direct goal event append from provider output
- direct task completion from provider output
- automatic self-review
- automatic worktree creation
- automatic next-version goal creation
- git merge, push, tag, publish, or GitHub Release automation inside product code
- public distribution, notarization, or auto-update claims unless the version explicitly proves them
- auto-applying patches without frozen adoption plan
- auto-registering main verification based on test success
- auto-merge or release-ready declaration
- adopting unreviewed worker output

## Expected deliverables

- `src/symphony/adoption-main-verification-loop-contracts.js`
- `fixtures/contracts/adoption-main-verification/*.json`
- `tests/v68-adoption-main-verification-loop.test.js`
- `docs/qa/v68-adoption-main-verification-loop-acceptance.md`
- `docs/plans/v68-adoption-main-verification-loop-closeout-snapshot-2026-06-14.md`
- `docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md`

## PR breakdown

### PR-0: Runbook

Scope:
- Add v68 runbook.
- Confirm v66 worker and v67 reviewer evidence inputs.

Validation:
```sh
git diff --check
git diff --cached --check
```


### PR-1: Adoption readiness contract

Scope:
- Add adoption readiness projection from worker evidence, reviewer verdict, dirty worktree, source fingerprints, and patch refs.
- Fixtures: ready adoption, missing reviewer approval, dirty worktree, patch mismatch, stale worker run, unsafe patch, unsupported deletion, missing artifact.

Validation:
```sh
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/v67-claude-code-reviewer-lane.test.js
node --test tests/v66-controlled-codex-worker-execution.test.js
pnpm check
git diff --check
```


### PR-2: Adoption preview/confirm integration

Scope:
- Add Workbench-ready adoption preview and confirm state.
- Confirm uses frozen adoption id / planHash and revalidates fingerprints.
- Write adoption journal before apply.
- Record applying/applied/failed states.
- Do not invoke providers during adoption confirm.

Validation:
```sh
node --test tests/v68-adoption-main-verification-loop.test.js
pnpm check
git diff --check
```


### PR-3: Main verification preview/confirm and gate draft

Scope:
- Add fixed verification suite preview.
- Confirm runs the suite and writes operation evidence.
- Generate `main.verification-passed` gate draft only after verification evidence is ready.
- Gate registration remains separate preview/confirm.

Validation:
```sh
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/v50-supervisor-event-registration-eligibility.test.js
pnpm check
git diff --check
```


### PR-4: Workbench loop surface

Scope:
- Show Worker -> Reviewer -> Adoption -> Main Verification -> Gate Draft sequence.
- Display blockers and next safe action.
- Ensure no auto-merge, release-ready, tag, push, publish, GitHub Release, raw transcript, or raw output controls.

Validation:
```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
pnpm check
git diff --check
```


### PR-5: Acceptance evidence and v69 handoff

Scope:
- Record a fake end-to-end loop: worker success, reviewer approve, adoption preview/confirm, verification confirm, gate draft.
- Record negative scenarios.
- Hand off to failure recovery, resume, diagnostics, and observability.

Validation:
```sh
pnpm workbench:build
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/v67-claude-code-reviewer-lane.test.js tests/v66-controlled-codex-worker-execution.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```


## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/v67-claude-code-reviewer-lane.test.js tests/v66-controlled-codex-worker-execution.test.js
node --test tests/v50-supervisor-event-registration-eligibility.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback path

If adoption confirm applies an unfrozen patch, skips fingerprint checks, or runs provider/model calls, revert adoption integration. If verification success auto-registers a gate or release-ready state, revert verification integration.

## Next-version handoff

v69 should make failed, interrupted, timeout, and blocked runs recoverable with structured diagnostics and cost/time observability.
