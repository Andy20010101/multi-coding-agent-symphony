# v71 Native Packaging for Personal Use runbook

Date: 2026-06-14
Goal id: `v71-native-packaging-personal-use`
Branch draft: `codex/v71-native-packaging-personal-use`
Start condition: v70 release manager practical loop is merged, tagged, released, and its manual publication boundary remains explicit.

## Objective

v71 should produce a local personal-use Mac app package that the operator can build, open, uninstall, reinstall, and roll back. It is not a public distribution, notarization, or auto-update version.

## Target Path

```text
local Tauri shell
-> local package build
-> app identity/icon/version
-> sidecar lifecycle in packaged app
-> install/reinstall/rollback docs
-> v71 closeout and v72 handoff
```

## Boundary

Allowed work:

- add a local packaging command or documented local Tauri build path;
- add app identity, icon placeholder, version display, and local config directory docs;
- validate packaged app still uses limited native commands and no updater, publish URL, signing secret, or notarization field;
- record install, uninstall, reinstall, and rollback procedure for personal use;
- record packaging blockers when the local toolchain is unavailable;
- keep public distribution and auto-update out of scope.

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
- public `.dmg` release claims;
- notarization claims;
- auto-update channels;
- codesigning or publish secrets in repo;
- Tauri plugins that add broad filesystem or shell access.

## Expected Deliverables

- `desktop/shell/README.md`
- `desktop/shell/src-tauri/tauri.conf.json`
- `scripts/desktop-shell-smoke.js`
- `tests/v71-native-packaging-personal-use.test.js`
- `docs/qa/v71-native-packaging-personal-use-acceptance.md`
- `docs/plans/v71-native-packaging-personal-use-closeout-snapshot-2026-06-14.md`
- `docs/plans/v72-one-week-dogfood-stabilization-runbook-2026-06-14.md`

## PR Breakdown

### PR-0: Runbook

Scope:

- add v71 runbook and personal-use packaging target;
- carry v70 release-manager publication boundary.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Packaging Source Boundary and Smoke Tests

Scope:

- add tests that validate Tauri config remains personal-use only: no updater, no publish URL, no notarization, no signing secrets, limited capabilities, and limited commands;
- allow `bundle.active` only if the package is explicitly local personal-use and tests assert no public distribution config.

Validation:

```sh
node --test tests/v71-native-packaging-personal-use.test.js
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
pnpm check
git diff --check
```

### PR-2: Local Package Build Path

Scope:

- add or document `pnpm desktop:shell:build:local` or equivalent local Tauri build command;
- record required local toolchain;
- if build is unavailable, closeout records the blocker and source-level smoke evidence;
- do not upload public release assets.

Validation:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
node --test tests/v71-native-packaging-personal-use.test.js
pnpm check
git diff --check
```

### PR-3: Packaged App Operator Docs

Scope:

- document build, open, sidecar attach, sidecar failure, uninstall, reinstall, and rollback;
- document personal-use limitation;
- document fallback to browser Workbench.

Validation:

```sh
pnpm check
git diff --check
```

### PR-4: Acceptance, Closeout, and v72 Handoff

Scope:

- record package or source smoke, optional local build evidence, packaging blockers, and app boundary;
- hand off to dogfood stabilization.

Validation:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
node --test tests/v71-native-packaging-personal-use.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by each PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
node --test tests/v71-native-packaging-personal-use.test.js
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

If packaging config adds updater, publish URL, notarization, signing secrets, broad filesystem access, or shell access, revert packaging config. If docs claim public distribution without proof, revert docs before tagging.

## Next-Version Handoff

v72 should dogfood the packaged or local app on real development work and close only real-use blockers.
