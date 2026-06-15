# v71 Native Packaging for Personal Use closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v71-native-packaging-personal-use`
PR-4 branch: `codex/v71-acceptance-closeout-handoff`
Pre-closeout main commit: `8f942bea6b81db9094a17310e0deb660858652cf`

## Shipped State

v71 ships a local personal-use package path for the Tauri desktop shell:

```text
desktop shell source boundary
-> fixed local .app build command
-> valid app icon and local launch smoke
-> packaged app operator docs
-> acceptance, closeout, and v72 handoff
```

The shipped scope is:

- v71 start evidence from verified v70 tag and GitHub Release state;
- v71 packaging source tests for local personal-use constraints;
- desktop smoke validation for Tauri config, Rust commands, capability files, Cargo dependency boundary, bundle target, and icon payload;
- a fixed local build wrapper, `pnpm desktop:shell:build:local`;
- local macOS `.app` bundle target only;
- a valid 32x32 RGBA app icon after launch smoke found the previous icon invalid at runtime;
- README operator docs for build, open, sidecar state, install, uninstall, reinstall, rollback, and browser fallback;
- no committed local package artifact.

v71 does not ship public distribution, DMG publication, notarization, auto-update, signing secrets, GitHub Release assets, colleague rollout, customer rollout, generic shell or terminal UI, renderer arbitrary command execution, frontend local JSONL/session/provider folder reads, `.symphony` internals reads, raw transcripts, raw model output, raw provider output, unsupported provider claims, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git merge/push/tag/publish, or product-level GitHub Release automation.

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 start evidence | #174 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/174` | `codex/v71-runbook-start` | `39f63fb31cfbedf72e57bade6ed2eee533741cae` | 2026-06-15T02:12:57Z | Added v71 start evidence from verified v70 release state. |
| PR-1 packaging boundary tests | #175 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/175` | `codex/v71-packaging-boundary` | `c0121d8227e5b555a832df1b3e5d3fe9250cf1fc` | 2026-06-15T02:16:52Z | Added v71 native packaging tests and local package boundary smoke output. |
| PR-2 local package build path | #176 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/176` | `codex/v71-local-package-build` | `6b2dc7d0313b2ed757258f7473629c1d1414a343` | 2026-06-15T02:25:42Z | Added the local build wrapper, Tauri CLI devDependency, local `.app` bundle target, and artifact path docs. |
| PR-3 packaged app operator docs | #177 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/177` | `codex/v71-packaged-app-operator-docs` | `8f942bea6b81db9094a17310e0deb660858652cf` | 2026-06-15T02:28:34Z | Documented build, open, sidecar states, install, uninstall, reinstall, rollback, and browser fallback. |
| PR-4 acceptance, closeout, and v72 handoff | This PR | `codex/v71-acceptance-closeout-handoff` | Pending until merge | Pending until merge | Adds acceptance, closeout snapshot, v72 handoff, icon launch fix, and icon smoke coverage. |

## PR-4 Files

| File | Purpose |
| --- | --- |
| `docs/qa/v71-native-packaging-personal-use-acceptance.md` | Acceptance record for package build, local launch, operator docs, validation, residual risk, and rollback. |
| `docs/plans/v71-native-packaging-personal-use-closeout-snapshot-2026-06-14.md` | Closeout snapshot for shipped scope, PR chain, validation, rollback, release notes, and publication steps. |
| `docs/plans/v72-one-week-dogfood-stabilization-runbook-2026-06-14.md` | Handoff runbook for dogfooding the local packaged app. |
| `desktop/shell/src-tauri/icons/icon.png` | Valid 32x32 RGBA icon used by the local `.app`; fixes the Tauri launch panic found during PR-4 smoke. |
| `scripts/desktop-shell-smoke.js` | Adds binary icon validation to the desktop smoke contract. |
| `tests/v71-native-packaging-personal-use.test.js` | Asserts smoke output includes valid icon metadata. |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm desktop:shell:build:local` | Passed on PR-4 branch. Built `desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app`; Tauri skipped signing because the command uses `--no-sign`. |
| Direct app binary launch | Passed after icon replacement. The app stayed running for 3 seconds and was stopped with Ctrl-C. |
| `open -n "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app"` | Passed. `pgrep` found process `symphony-desktop-shell`; `osascript` quit the app; follow-up `pgrep` found no process. |
| `pnpm workbench:build` | Passed. Static output is `index-D0VJl4Kp.css` and `index-C7QMJj8P.js`. |
| `pnpm desktop:shell:smoke` | Passed. Smoke output records local `.app` packaging, no updater/publish/signing/notarization, and icon `32x32` RGBA payload. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed. |
| `node --test tests/v71-native-packaging-personal-use.test.js` | Passed: 5 tests, 5 passed. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed: 11 tests, 11 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |

`pnpm test` remains the final tag-before-publication gate. It must run on the final post-PR-4 `origin/main` commit before creating the annotated `v71` tag.

## Package Evidence

The local package artifact path is:

```text
desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app
```

The app bundle is intentionally ignored by git through `desktop/shell/src-tauri/target/`.

The package command is:

```text
pnpm desktop:shell:build:local
```

The underlying Tauri command is fixed by `scripts/desktop-shell-build-local.js`:

```text
pnpm --dir ../../.. exec tauri build --bundles app --ci --no-sign
```

## Rollback Path

Rollback is PR-scoped:

- revert PR #177 if operator docs drift into public distribution, notarization, auto-update, DMG, release asset, colleague rollout, or customer rollout claims;
- revert PR #176 if the local build command accepts arbitrary args, changes bundle target away from local `.app`, adds DMG, signing secrets, updater, publish URL, release asset upload, or commits local build artifacts;
- revert PR #175 if packaging tests stop blocking broad Tauri plugins, arbitrary command/path access, updater, publish, signing, notarization, or release automation drift;
- revert PR #174 if start evidence points at the wrong v70 commit, tag, GitHub Release, or asset policy;
- replace `desktop/shell/src-tauri/icons/icon.png` and rerun package/open smoke if app launch fails on icon parsing.

## Tag and Release State Before v71 Publication

| Check | Result |
| --- | --- |
| `v70` tag and release | Existing and verified before v71 implementation. |
| `v71` tag | Absent before PR-4 publication. |
| `v71` GitHub Release | Not created before PR-4 publication. |
| Open PR state | `[]` before PR-4 was opened; PR-4 is the only expected open PR while this snapshot is under review. |

After PR-4 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v71` tag and GitHub Release are still absent.
3. Run `pnpm test` on the final post-PR-4 `origin/main` commit.
4. Create an annotated `v71` tag on the final `origin/main` commit.
5. Push the `v71` tag.
6. Create the GitHub Release for `v71` with no assets.
7. Verify `v71^{}` dereferences to the final `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and has targetCommitish `main`.

Release note draft:

```text
v71: Native Packaging for Personal Use

- Adds a fixed local Tauri build path for the desktop shell through `pnpm desktop:shell:build:local`.
- Enables only the local macOS `.app` bundle target and records the local artifact path.
- Adds package boundary tests and smoke output for local personal use, icon validity, narrow native commands, limited capabilities, and no updater, publish URL, signing secret, notarization, DMG, release asset, or public distribution claim.
- Documents local open, sidecar state, install, uninstall, reinstall, rollback, and browser Workbench fallback.
- Keeps packaging publication outside product code and does not add merge, push, tag, publish, GitHub Release create/edit/upload, shell, terminal, local session reads, raw transcript, provider output, public distribution, notarization, or auto-update automation.
```

## Residual Risks

v71 proves local package build and launch on this macOS host only. It does not prove notarization, code signing, Gatekeeper behavior on another Mac, DMG installation, auto-update, Release asset publication, or colleague/customer rollout.

The app is opened with `--no-sign` build output. macOS prompts or quarantine behavior on other machines remain outside v71.

## v72 Handoff

v72 should be `v72-one-week-dogfood-stabilization`.

The handoff target is:

```text
local .app package
-> one-week personal dogfood
-> daily launch and sidecar notes
-> blocker triage
-> stabilization fixes only
```

v72 should dogfood the local packaged app on real development work. It should not create public distribution, notarization, auto-update, DMG release, release assets, colleague rollout, customer rollout, unsupported provider claims, broad filesystem access, broad shell access, product-level git writes, or GitHub Release automation.
