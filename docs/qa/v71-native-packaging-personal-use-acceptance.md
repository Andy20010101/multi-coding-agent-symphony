# v71 Native Packaging for Personal Use acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v71-native-packaging-personal-use`

## Accepted Scope

v71 ships a local personal-use Mac app package path for the existing Tauri shell:

```text
local Tauri shell
-> local .app package build
-> local launch smoke
-> install, uninstall, reinstall, rollback docs
-> closeout and v72 dogfood handoff
```

Accepted changes:

- `docs/qa/v71-native-packaging-personal-use-start-evidence.md` records the verified v70 start gate and v71 boundary.
- `tests/v71-native-packaging-personal-use.test.js` validates personal-use packaging boundaries, fixed Tauri build command shape, operator docs, native command surface, and package smoke output.
- `scripts/desktop-shell-smoke.js` now accepts only the local macOS `.app` bundle target and validates `desktop/shell/src-tauri/icons/icon.png` as 32x32 RGBA PNG data.
- `scripts/desktop-shell-build-local.js` runs a fixed local Tauri build command and reports `desktop-shell-local-package-build.v1`.
- `package.json` adds `desktop:shell:build:local` and pins `@tauri-apps/cli` at `2.11.2`.
- `desktop/shell/src-tauri/tauri.conf.json` enables only `bundle.targets: ["app"]`.
- `desktop/shell/README.md` documents build, open, sidecar state, install, uninstall, reinstall, rollback, and browser fallback.
- `desktop/shell/src-tauri/icons/icon.png` is replaced with a valid 32x32 RGBA PNG after local launch found the previous icon caused a Tauri runtime panic.
- `.gitignore` excludes `desktop/shell/src-tauri/target/` so local package artifacts stay out of commits.

Out of scope:

- public distribution;
- DMG packaging;
- notarization;
- auto-update;
- signing secrets;
- GitHub Release asset upload;
- colleague or customer rollout;
- product-side merge, push, tag, publish, or GitHub Release automation;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, raw transcripts, raw model output, or raw provider output.

## Evidence

| Check | Result |
| --- | --- |
| `pnpm desktop:shell:build:local` | Passed on PR-4 branch. Built `desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app`. Tauri reported `--no-sign`; no DMG, notarization, auto-update, or release asset was produced. |
| Direct app binary launch | Initial launch failed on the old icon with Tauri `invalid icon`. After replacing `desktop/shell/src-tauri/icons/icon.png`, the app binary stayed running for 3 seconds and was stopped with Ctrl-C. |
| `open -n "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app"` | Passed after icon replacement. `pgrep -fl "Symphony Desktop Shell|symphony-desktop-shell"` found the app process. `osascript -e 'tell application "Symphony Desktop Shell" to quit'` exited it, and a follow-up `pgrep` found no app process. |
| `pnpm workbench:build` | Passed. Built `src/symphony/workbench-static/index.html`, `assets/index-D0VJl4Kp.css`, and `assets/index-C7QMJj8P.js`. |
| `pnpm desktop:shell:smoke` | Passed. Reported `bundleActive: true`, `bundleTargets: ["app"]`, `localPersonalUseOnly: true`, and icon metadata `32x32`, `rgba`, `inflatedBytes: 4128`. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed. |
| `node --test tests/v71-native-packaging-personal-use.test.js` | Passed: 5 tests, 5 passed. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed: 11 tests, 11 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |
| `v71` tag pre-publication check | `git tag --list 'v71'` returned no tag before PR-4 publication. |
| `v71` GitHub Release pre-publication check | `gh release view v71 --repo Andy20010101/multi-coding-agent-symphony` returned `release not found` before PR-4 publication. |
| Open PR pre-PR-4 check | `gh pr list --state open` returned `[]` before PR-4 was opened. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Local personal-use package path exists. | `pnpm desktop:shell:build:local` builds the local `.app` and reports the artifact path. |
| Local launch is smoke-tested. | Direct binary launch stayed running after icon replacement, and `open -n` started the app process. |
| Install, uninstall, reinstall, and rollback are documented. | `desktop/shell/README.md` contains operator commands for each path and the browser Workbench fallback. |
| Native bridge remains narrow. | v71 tests and desktop smoke assert only `attach_sidecar` and `launch_sidecar`, fixed loopback host and port boundaries, no broad Tauri plugins, and no arbitrary command or path access. |
| Packaging does not become public distribution. | Config, tests, smoke output, README, and build evidence keep DMG, notarization, auto-update, signing secrets, public release assets, and rollout claims out of scope. |
| Release publication remains controller-owned. | Product code does not add merge, push, tag, publish, GitHub Release create/edit/upload, or release asset automation. |

## Residual Risk

The local `.app` is unsigned and not notarized. macOS may show local security prompts depending on the operator machine. That is expected for v71 and must not be described as public distribution readiness.

The package smoke proves build and local launch on this macOS host. It does not prove a teammate machine, customer machine, automatic update, DMG install, notarization, or GitHub Release asset workflow.

## Rollback

If the local app cannot open, use the browser Workbench fallback:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```

If packaging config adds DMG, updater, publish URL, signing secrets, notarization, broad filesystem access, broad shell access, or release automation, revert the v71 packaging config and smoke changes.

If the icon regresses to a launch panic, replace `desktop/shell/src-tauri/icons/icon.png` with a valid 32x32 RGBA PNG and rerun package/open smoke before tagging.
