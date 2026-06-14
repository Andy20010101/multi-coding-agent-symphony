# v63 Mac App Local Launch MVP goal runbook

Date: 2026-06-14
Goal id: `v63-mac-app-local-launch-mvp`
Branch draft: `codex/v63-mac-app-local-launch-mvp`
Start condition: v62 closeout is merged and install/upgrade baseline is documented.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.

## Objective

v63 should make the existing Tauri shell a practical local launch path: open the app, attach to or launch the loopback sidecar, and show App Home without requiring the operator to manually remember the browser URL.

## Target path

```text
installable / checkout baseline
-> local Tauri host build smoke
-> App Home launch path
-> sidecar attach / launch states
-> local failure states
-> v63 closeout and v64 handoff
```

## Boundary

Allowed work:

- add or document a local Mac app build/smoke command for the Tauri shell
- make App Home the native window entry path
- show sidecar attached, launchable, launching, failed, wrong-port, stale, and unavailable states
- preserve the existing `attach_sidecar` and `launch_sidecar` command boundary
- record local build blockers when Tauri or Rust tooling is missing
- keep distribution packaging, signing, notarization, and auto-update out of scope

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
- Electron migration
- Tauri plugins that enable arbitrary filesystem, shell, updater, or external opener access
- public `.dmg` or notarized release claims

## Expected deliverables

- `desktop/shell/README.md`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/src/lib.rs`
- `scripts/desktop-shell-smoke.js`
- `docs/qa/v63-mac-app-local-launch-mvp-acceptance.md`
- `docs/plans/v63-mac-app-local-launch-mvp-closeout-snapshot-2026-06-14.md`
- `docs/plans/v64-first-run-project-setup-local-settings-runbook-2026-06-14.md`

## PR breakdown

### PR-0: Runbook

Scope:

- Add v63 runbook and local launch target.
- Confirm v62 install/upgrade handoff.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Native host build smoke and boundary hardening

Scope:

- Extend `pnpm desktop:shell:smoke` to validate Tauri config, command allowlist, capability set, `bundle.active`, updater absence, publish false, and no extra windows.
- Add or document `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`.
- Do not require a full native bundle if local environment lacks packaging prerequisites; record blocker.

Validation:

```sh
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
pnpm check
git diff --check
```

### PR-2: App Home launch and sidecar state UX

Scope:

- Make `/workbench/desktop/` the configured native entry.
- Display sidecar attach/launch status on first screen.
- Add clear states for backend unavailable, sidecar missing, wrong port, port conflict, stale snapshot, stale static assets, and project missing.
- Renderer must not call arbitrary commands; it can only use the fixed native bridge if that path is already proven by the host boundary.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm desktop:shell:smoke
pnpm check
git diff --check
```

### PR-3: Local app operator docs

Scope:

- Document how to run from checkout, how to start the Tauri shell locally, how to troubleshoot sidecar attach, and how to fall back to browser Workbench.
- Explicitly state no public distribution, notarization, auto-update, or release automation.

Validation:

```sh
pnpm check
git diff --check
```

### PR-4: Acceptance, closeout, and v64 handoff

Scope:

- Record local host smoke, cargo check, Workbench route evidence, and sidecar failure states.
- Hand off to first-run project setup and local settings.

Validation:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
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

If Tauri changes expand native capabilities beyond attach/launch sidecar, revert the native host PR. If App Home cannot launch or safely display backend failure states, revert the renderer PR and keep browser Workbench as the primary path.

## Next-version handoff

v64 should add first-run project setup, current project binding, recent projects, and safe local settings so the app does not depend on remembered terminal context.
