# v67 Claude Code Reviewer Lane goal runbook

Date: 2026-06-15
Goal id: `v67-claude-code-reviewer-lane`
Branch draft: `codex/v67-claude-code-reviewer-lane`
Start condition: v66 controlled Codex worker run is merged, tagged, released, and produces sanitized worker evidence with `needs-review` state.

Scope note: this runbook continues the v65 and v66 provider boundary. Codex CLI is the worker candidate. Claude Code CLI is the reviewer candidate. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a Workbench provider.

## Start Evidence Required

v67 starts only after the v66 release boundary is verified:

- v66 PR chain merged through acceptance and closeout;
- annotated tag `v66` exists and `v66^{}` dereferences to the v66 post-closeout `origin/main` commit;
- GitHub Release `v66` exists, is non-draft, non-prerelease, and has no assets unless the v66 closeout records otherwise;
- open PR list is empty or only contains explicitly unrelated work;
- v66 worker result state remains `needs-review`, not `approved`, `main-verified`, or `release-ready`.

## Start Evidence Snapshot

Checked on 2026-06-15 before opening PR-0:

- `origin/main` was `44d00803921b61820a45ae42026f7e7684dc740a`, the v66 closeout merge commit.
- `git rev-list --left-right --count main...origin/main` returned `0 55`; local `main` was stale, but the v67 branch starts from `origin/main`.
- Open GitHub PR list for `Andy20010101/multi-coding-agent-symphony` returned `[]`.
- Annotated tag `v66` existed: tag object `afe1420983ff1c2b19337b61cab164a220ae72a9`; `v66^{}` resolved to `44d00803921b61820a45ae42026f7e7684dc740a`.
- GitHub Release `v66` existed at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v66`, with name `v66: Controlled Codex Worker Execution`, `isDraft=false`, `isPrerelease=false`, assets `[]`, `publishedAt=2026-06-14T22:00:26Z`, and `targetCommitish=main`.
- `v67` tag was absent and `gh release view v67` returned `release not found`.
- v66 worker output remains review-bound. `fixtures/contracts/worker-run/result.sanitized-success.v1.json`, `tests/v66-controlled-codex-worker-execution.test.js`, and `docs/qa/v66-controlled-codex-worker-execution-acceptance.md` record `status: needs-review`, `reviewRequired: true`, `taskCompleted: false`, `reviewApproved: false`, `mainVerified: false`, and `releaseReady: false`.

## Objective

v67 should make Claude Code the controlled reviewer lane. It consumes bounded Codex worker evidence, produces reviewer evidence, and records explicit reviewer verdicts without self-approval or main verification.

## Target Path

```text
Codex worker evidence
-> reviewer handoff pack
-> Claude Code review preview
-> planHash confirm
-> sanitized reviewer evidence
-> approved / needs-revision / blocked
-> v67 closeout and v68 handoff
```

## Boundary

Allowed work:

- add bounded reviewer handoff pack from worker evidence refs;
- add Claude Code reviewer preview and result contracts;
- bind confirm to preview `planHash`, provider id `claude-code-cli`, role `reviewer`, fixed command template, and sanitized input pack;
- write reviewer evidence artifact refs and explicit verdict fields;
- block self-review and provider-role confusion;
- keep main verification and adoption separate;
- use fake Claude reviewer adapter in tests and optional real Claude smoke only when explicitly enabled.

Forbidden work:

- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw worker transcripts, or raw model output;
- unsupported provider claims;
- direct goal event append from provider output;
- direct task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- git merge, push, tag, publish, or GitHub Release automation inside product code;
- public distribution, notarization, or auto-update claims unless the version explicitly proves them;
- reviewer reading raw worker transcript or raw model output;
- reviewer verdict auto-passing main verification;
- using the same run as both worker and reviewer without explicit independent evidence;
- allowing Claude Code to mutate the main worktree in reviewer lane.

## Expected Deliverables

- `src/symphony/reviewer-run-contracts.js`;
- `fixtures/contracts/reviewer-run/*.json`;
- `tests/v67-claude-code-reviewer-lane.test.js`;
- `docs/qa/v67-claude-code-reviewer-lane-acceptance.md`;
- `docs/plans/v67-claude-code-reviewer-lane-closeout-snapshot-2026-06-14.md`;
- `docs/plans/v68-adoption-main-verification-loop-runbook-2026-06-14.md`.

## PR Breakdown

### PR-0: Runbook

Scope:

- Add v67 runbook.
- Confirm v66 worker evidence shape and release boundary.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Reviewer handoff and verdict contracts

Scope:

- Add reviewer handoff pack and reviewer verdict contracts.
- Fixtures: ready handoff, missing worker evidence, unsafe raw output ref, Claude readiness blocked, approved, needs-revision, blocked, self-review blocked.
- Verdict contract cannot imply main verification or release readiness.

Validation:

```sh
node --test tests/v67-claude-code-reviewer-lane.test.js
node --test tests/v66-controlled-codex-worker-execution.test.js
pnpm check
git diff --check
```

### PR-2: Backend Claude reviewer preview/confirm with fake adapter

Scope:

- Add backend preview/confirm for reviewer lane.
- Confirm accepts only `planHash`, active goal/task refs, fixed reviewer provider, fixed command template, and sanitized handoff pack ref.
- Fake adapter writes deterministic reviewer evidence.
- Optional real Claude smoke is env-gated and records sanitized proof refs only.

Validation:

```sh
node --test tests/v67-claude-code-reviewer-lane.test.js
node --test tests/v65-provider-readiness-codex-claude-only.test.js
pnpm check
git diff --check
```

### PR-3: Workbench review lane

Scope:

- Show worker evidence refs, reviewer preview, reviewer run status, verdict, blocked reason, and next safe action.
- For `needs-revision`, generate a copy-only next worker handoff or controlled worker preview source.
- Do not show raw model output, raw transcript, local session path, or main verification controls as automatically passed.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v67-claude-code-reviewer-lane.test.js
pnpm check
git diff --check
```

### PR-4: Acceptance evidence and v68 handoff

Scope:

- Record approved, needs-revision, blocked, and unsafe-source scenarios.
- Record Codex worker and Claude reviewer separation.
- Hand off to adoption and main verification loop.

Validation:

```sh
pnpm workbench:build
node --test tests/v67-claude-code-reviewer-lane.test.js
node --test tests/v66-controlled-codex-worker-execution.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v67-claude-code-reviewer-lane.test.js
node --test tests/v66-controlled-codex-worker-execution.test.js
node --test tests/v65-provider-readiness-codex-claude-only.test.js
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

If reviewer contracts accept raw provider output, raw worker transcripts, session paths, self-review, or convert review verdict into main verification or release readiness, revert the contract PR.

If backend lets Claude mutate the main worktree, accepts freeform commands, uses an unsupported provider id, or confirms with stale `planHash`, revert the backend PR.

If Workbench exposes terminal, shell, prompt launcher, raw output, local provider links, or main-verification/release controls as reviewer outputs, revert the Workbench PR and rebuild static assets from the reverted source.

## Next-version Handoff

v68 should connect approved reviewer evidence to adoption preview/confirm and main verification without automating release.
