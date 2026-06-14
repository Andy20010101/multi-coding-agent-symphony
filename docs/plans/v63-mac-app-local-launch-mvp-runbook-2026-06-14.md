# v63 Mac App Local Launch MVP runbook

Date: 2026-06-15
Goal id: `v63-mac-app-local-launch-mvp`
Branch draft: `codex/v63-mac-app-local-launch-mvp`
Start condition: v62 closeout is merged and records verified v62 annotated tag plus GitHub Release evidence.

## Objective

v63 should make the local Mac app launch path usable without implying public distribution. The target is a local developer launch surface that can start or attach to the existing Workbench sidecar safely and show enough state for recovery.

## Target path

```text
v62 installer baseline
-> local app launch entry
-> sidecar attach/start status
-> Workbench route readiness
-> local recovery notes
-> v63 closeout and v64 handoff
```

## Boundary

Allowed work:

- document the local Mac launch path for the existing Workbench/Tauri shell;
- make sidecar attach/start status explicit and testable;
- add read-only launch readiness checks or copy-only commands;
- improve local app startup docs and recovery notes;
- add focused tests for route readiness, sidecar status projection, and disabled distribution claims.

Forbidden work:

- public distribution, notarization, auto-update, app store, installer package, or signed build claims without separate release evidence;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, raw transcripts, or raw model output;
- unsupported provider claims;
- direct event append or task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- automatic checkout, install, overwrite, upgrade, or rollback of the user's installed checkout.

## Expected deliverables

- `docs/desktop-local-launch-guide.md` or an update to the existing Workbench operator docs;
- focused tests for local launch readiness and Workbench route availability;
- any narrow read-only status contract needed by the app shell;
- `docs/qa/v63-mac-app-local-launch-mvp-acceptance.md`;
- `docs/plans/v63-mac-app-local-launch-mvp-closeout-snapshot-2026-06-14.md`;
- `docs/plans/v64-<next-scope>-runbook-2026-06-14.md`.

## PR breakdown

### PR-0: Runbook and v62 release reconcile

Scope:
- Add or refresh this v63 runbook.
- Record v62 tag and GitHub Release facts before implementation starts.

Validation:
```sh
git diff --check
git diff --cached --check
```

### PR-1: Local launch docs and readiness contract

Scope:
- Document the local Mac app launch path.
- Add a read-only readiness contract if the existing state is not explicit enough.
- Keep commands as copy-only text unless they are already backend-owned preview/confirm flows.

Validation:
```sh
pnpm check
git diff --check
```

### PR-2: App shell startup surface

Scope:
- Expose local launch readiness in the Workbench or Tauri shell.
- Show sidecar route, attach/start state, and recovery hints without arbitrary command execution.

Validation:
```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

### PR-3: Acceptance and closeout

Scope:
- Record local launch evidence and recovery notes.
- Record disabled distribution, notarization, auto-update, installer, and release automation boundaries.
- Hand off to v64.

Validation:
```sh
pnpm check
git diff --check
git diff --cached --check
```

## Acceptance criteria

The version is acceptable only when:

1. local Mac launch state is backed by a route, contract, test, or documented command;
2. sidecar attach/start status is visible without a generic terminal or arbitrary command runner;
3. Workbench route readiness is testable from a clean local checkout with dependencies installed;
4. docs do not claim signed distribution, notarization, app store release, public installer package, or auto-update;
5. release, tag, merge, push, install, upgrade, and rollback actions remain outside product code.

## Rollback path

If v63 adds unsupported distribution or update claims, revert the docs or surface PR that introduced the claim.

If a shell startup surface executes arbitrary commands from the renderer, revert that PR and restore copy-only command text.

If launch readiness reads arbitrary local paths or raw session data, remove the field and keep only backend-owned status contracts.
