# v64 First-run Project Setup and Local Settings goal runbook

Date: 2026-06-14
Goal id: `v64-first-run-project-setup-local-settings`
Branch draft: `codex/v64-first-run-project-setup-local-settings`
Start condition: v63 local App Home launch path is merged and sidecar failure states are visible.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.


## Objective

v64 should make the first-run experience understandable: the operator can see the current project, bind a known project, revisit recent projects, and inspect local settings without the app scanning disk or storing secrets.

## Target path

```text
Mac/local App Home
-> first-run state
-> current project binding
-> recent projects
-> local settings summary
-> recovery for missing project
-> v64 closeout and v65 handoff
```

## Boundary

Allowed work:

- add a backend-owned settings contract such as `personalWorkbenchSettings.v1`
- add safe project binding and recent project projections
- allow only explicit current checkout or backend-known project ids; no full-disk scanning
- display local settings such as preferred providers, default port, runtime dir ref, UI language, and display density
- store no API keys, secrets, raw provider paths, or local transcripts
- add recovery for missing project, stale binding, invalid project id, and unavailable settings

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
- full disk scanning
- renderer arbitrary path picker that reads local files
- secret storage in project settings
- automatic goal creation after project selection

## Expected deliverables

- `src/symphony/personal-workbench-settings-contracts.js`
- `fixtures/contracts/personal-workbench-settings/*.json`
- `tests/v64-first-run-project-setup-local-settings.test.js`
- `docs/qa/v64-first-run-project-setup-local-settings-acceptance.md`
- `docs/plans/v64-first-run-project-setup-local-settings-closeout-snapshot-2026-06-14.md`
- `docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md`

## PR breakdown

### PR-0: Runbook

Scope:
- Add v64 runbook and first-run target.
- Carry v63 local launch assumptions.

Validation:
```sh
git diff --check
git diff --cached --check
```


### PR-1: Settings and project binding contracts

Scope:
- Add `personalWorkbenchSettings.v1`.
- Add fixtures for ready settings, missing settings, stale project binding, invalid project id, secret-like value rejected, and unsupported path input.
- Settings should contain refs and preferences only; never secrets or raw session paths.

Validation:
```sh
node --test tests/v64-first-run-project-setup-local-settings.test.js
pnpm check
git diff --check
```


### PR-2: Backend projection and CLI inspection

Scope:
- Add backend route or CLI projection for settings/current project state.
- If a write path is needed, use preview/confirm with planHash, or keep write actions terminal-only and copy-only in Workbench.
- Reject arbitrary path reads from renderer state.

Validation:
```sh
node --test tests/v64-first-run-project-setup-local-settings.test.js
node --test tests/workbench-api-client.test.js
pnpm check
git diff --check
```


### PR-3: First-run Workbench surface

Scope:
- Add First-run / Project Setup lane to Desktop App Home.
- Show current project, recent projects, settings source, missing/stale states, and next safe action.
- Do not create goals, run providers, scan disk, or open local files.

Validation:
```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v64-first-run-project-setup-local-settings.test.js
pnpm check
git diff --check
```


### PR-4: Acceptance, closeout, and v65 handoff

Scope:
- Record first-run route evidence.
- Record missing/stale project recovery.
- Hand off to Codex + Claude Code provider readiness.

Validation:
```sh
pnpm workbench:build
node --test tests/v64-first-run-project-setup-local-settings.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```


## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v64-first-run-project-setup-local-settings.test.js
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

If settings store secrets, raw provider/session paths, or raw transcripts, revert the settings contract PR. If project setup scans disk or reads arbitrary paths from renderer input, revert the backend and Workbench PRs.

## Next-version handoff

v65 should make provider readiness explicit and reduce active Workbench providers to Codex + Claude Code only.
