# v61 Workbench Operator Dry-run Evidence goal runbook

Date: 2026-06-14
Goal id: `v61-workbench-operator-dry-run-evidence`
Branch draft: `codex/v61-workbench-operator-dry-run-evidence`
Start condition: v60 PR-5 is merged; the controller has created and verified the annotated `v60` tag and GitHub Release.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.

## Objective

v61 should exercise the released v60 stable Workbench baseline from an operator session and record what was verified. It is a verification/evidence version, not a new capability version.

## Target path

```text
v60 stable Workbench baseline
-> release-state reconcile
-> local Workbench route smoke
-> operator evidence capture checklist
-> recovery drill notes
-> v61 closeout and v62 handoff
```

## Boundary

Allowed work:

- record v60 release-state reconcile after tag and GitHub Release publication
- run and document local Workbench route smoke for `/workbench/desktop/` and `/workbench/`
- add an operator evidence capture checklist for the stable baseline lane
- add recovery drill notes for missing source contracts, blocked release boundary state, unavailable Workbench server, and stale static assets
- add focused tests only when they validate read-only route display, source refs, or boundary flags
- make small label or navigation cleanup only if the dry run proves an already-shipped v60 surface is hard to find
- rebuild Workbench static assets only if Workbench source changes

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

## Expected deliverables

- `docs/qa/v61-workbench-operator-dry-run-evidence-acceptance.md`
- `docs/plans/v61-workbench-operator-dry-run-evidence-closeout-snapshot-2026-06-14.md`
- `docs/plans/v62-installer-upgrade-baseline-runbook-2026-06-14.md`

## PR breakdown

### PR-0: Runbook carry-forward

Scope:
- Add this runbook under the v61-v72 runbook directory.
- Confirm it matches the v60 closeout handoff.

Validation:
```sh
git diff --check
git diff --cached --check
```

### PR-1: v60 release-state reconcile and operator checklist

Scope:
- Record v60 tag object, dereferenced commit, release URL, draft flag, prerelease flag, asset policy, target commit, and open PR state.
- Add operator checklist for opening the stable baseline lane and recording source refs.
- Keep tag, push, publish, and GitHub Release work as external controller evidence.

Validation:
```sh
node --test tests/v60-stable-personal-workbench-release.test.js
pnpm check
git diff --check
```

### PR-2: Local Workbench route smoke evidence

Scope:
- Run route smoke for `/workbench/desktop/` and `/workbench/`.
- Record visible stable baseline labels, release boundary fields, disabled capability fields, and source contract labels.
- Update focused route smoke assertions only if they miss a v61 operator requirement.

Validation:
```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

### PR-3: Recovery drill notes

Scope:
- Document recovery for missing stable baseline source contracts.
- Document recovery for blocked release boundary state.
- Document recovery for unavailable Workbench server, stale static assets, and mismatched route source.
- Keep recovery manual and controller-owned.

Validation:
```sh
node --test tests/v60-stable-personal-workbench-release.test.js
pnpm check
git diff --check
```

### PR-4: Closeout and v62 handoff

Scope:
- Add v61 acceptance evidence.
- Add v61 closeout snapshot.
- Add v62 installer / upgrade runbook.
- Record whether v60/v61 should become the installer baseline or whether `latest-stable` is required first.

Validation:
```sh
pnpm workbench:build
node --test tests/v60-stable-personal-workbench-release.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v60-stable-personal-workbench-release.test.js
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

If v61 overstates what v60 can do, revert the docs PR. If route-smoke changes expose executable controls, local-file reads, raw-output reads, provider launch, release creation/edit, tag/push controls, direct event append, task completion, worktree creation, or next-goal creation, revert the Workbench PR and rebuild static assets from the reverted source state.

## Next-version handoff

v62 should make installation, upgrade, rollback, and stable-ref selection explicit so the Workbench baseline can be installed rather than only run from a development checkout.

## Execution prompts

### Worker / Codex prompt

```text
You are implementing v61 for multi-coding-agent-symphony.
Follow docs/plans/workbench-v61-v72-real-use-runbooks/v61_workbench-operator-dry-run-evidence_goal_runbook_latest.md.
Do not add provider execution, generic shell, renderer command execution, local transcript/session reads, release automation, public distribution, notarization, or auto-update.
Use small PRs: release-state reconcile, route-smoke evidence, recovery drill, closeout.
Before final closeout run: pnpm workbench:build; node --test tests/v60-stable-personal-workbench-release.test.js; node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js; pnpm check; git diff --check.
```
