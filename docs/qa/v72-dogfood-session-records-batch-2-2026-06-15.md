# v72 Dogfood session records batch 2 and same-day summary

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v72-one-week-dogfood-stabilization`
Evidence scope: same-day dogfood

## Summary

| Field | Value |
| --- | --- |
| Counted sessions in batch 1 | 3 |
| Counted sessions in this batch | 2 |
| Total counted v72 sessions | 5 |
| Closeout session count gate | ready |
| One-week stability claim | not allowed |
| Same-day evidence claim | observed |
| Success observed | 5 sessions |
| Blocked observed | 1 session |
| Recovery count observed | 2 |
| Manual terminal escape count observed | 5 |
| Repeated blocker | not observed |
| Unresolved product blocker | not observed |

These five sessions satisfy the v72 session count gate. They all happened on 2026-06-15, so they do not prove one-week stability.

## Session v72-s04

| Field | Value |
| --- | --- |
| Date | 2026-06-15 |
| Local time | 11:08 Asia/Shanghai |
| Project | `multi-coding-agent-symphony` |
| Goal/task | Build and launch the local personal-use `.app` package after PR-3. |
| Entry path | packaged app |
| Worker provider | operator |
| Reviewer provider | operator |
| Adoption status | not applicable |
| Verification status | passed |
| Blocker state | not observed |
| Recovery action | not observed |
| Manual terminal escapes | 1 |

### Task Steps

- Ran `pnpm desktop:shell:build:local`.
- The build ran `pnpm workbench:build`, compiled the Tauri release target, and bundled `Symphony Desktop Shell.app`.
- The build reported `desktop-shell-local-package-build.v1`, `status: ok`, `mode: build`, and artifact path `desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app`.
- Opened the app with `open -n`.
- Confirmed process `symphony-desktop-shell` was running after 3 seconds.
- Quit the app with `osascript`.
- Confirmed follow-up process check found no running app process.

### Friction Notes

- First local Tauri build in this worktree spent time compiling Rust dependencies. That is expected setup cost, not a product blocker.
- The app build stayed local personal-use only: no DMG, notarization, auto-update, signing secret, or GitHub Release asset.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| command-evidence | `pnpm desktop:shell:build:local` | passed, built local `.app` bundle |
| command-evidence | `open -n desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app` | passed, process stayed running for 3 seconds |
| command-evidence | `osascript -e 'tell application "Symphony Desktop Shell" to quit'` | passed, app quit cleanly |
| repo-doc | `desktop/shell/README.md` | local build/open and rollback docs |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed |
| blocked | not observed |
| reviewLoopCount | 0 |
| recoveryCount | 0 |
| manualTerminalEscapeCount | 1 |
| elapsedTimeMinutes | not observed |
| cost | unknown |

## Session v72-s05

| Field | Value |
| --- | --- |
| Date | 2026-06-15 |
| Local time | 11:09 Asia/Shanghai |
| Project | `multi-coding-agent-symphony` |
| Goal/task | Verify browser fallback Workbench route after package launch session. |
| Entry path | browser fallback |
| Worker provider | operator |
| Reviewer provider | operator |
| Adoption status | not applicable |
| Verification status | passed |
| Blocker state | not observed |
| Recovery action | stopped the read-only console after route verification |
| Manual terminal escapes | 1 |

### Task Steps

- Started `pnpm symphony console --host 127.0.0.1 --port 8765`.
- Console reported `Safety: read-only`, `Project writes: no`, `Runtime writes: no`, `External calls: no`, and `Status: listening`.
- Requested `GET http://127.0.0.1:8765/workbench/desktop/`.
- The route returned the Workbench HTML document starting with `<!doctype html>`.
- `HEAD http://127.0.0.1:8765/workbench/desktop/` returned `405 Method Not Allowed`, matching the restricted method boundary.
- Stopped the console with Ctrl-C.
- Confirmed a follow-up curl could not connect to port `8765`.

### Friction Notes

- Browser fallback worked through GET.
- HEAD returning 405 is a boundary signal, not a user-facing route failure.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| command-evidence | `pnpm symphony console --host 127.0.0.1 --port 8765` | started read-only console |
| command-evidence | `curl -fsS http://127.0.0.1:8765/workbench/desktop/` | passed, returned Workbench HTML |
| command-evidence | `curl -fsSI http://127.0.0.1:8765/workbench/desktop/` | returned 405 for HEAD |
| command-evidence | `curl -fsS http://127.0.0.1:8765/workbench/desktop/ >/dev/null` after Ctrl-C | failed to connect, confirming console stopped |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed |
| blocked | not observed |
| reviewLoopCount | 0 |
| recoveryCount | 0 |
| manualTerminalEscapeCount | 1 |
| elapsedTimeMinutes | not observed |
| cost | unknown |

## Five-session Metrics

| Metric | Value | Source |
| --- | --- | --- |
| success | observed in 5 sessions | Batch 1 sessions v72-s01 to v72-s03; batch 2 sessions v72-s04 to v72-s05 |
| blocked | observed in 1 session | v72-s03 fresh worktree dependency miss |
| recoveryCount | 2 | v72-s02 test expectation fix; v72-s03 `pnpm install` dependency recovery |
| manualTerminalEscapeCount | 5 | One controller terminal path recorded per counted session |
| reviewLoopCount | 1 | v72-s02 focused test adjustment |
| elapsedTimeMinutes | not observed | Session times were not measured end to end |
| cost | unknown | Cost was not observed |

## Stability Summary

The five session count gate is satisfied, but all records are from the same day. The evidence supports these statements only:

- the v72 runbook/protocol PR path completed through PR #179;
- the v72 session template and contract PR path completed through PR #180;
- fresh worktree dependency recovery was observed and documented through PR #182;
- the local package smoke, local `.app` build, app open/quit smoke, and browser fallback route worked on this host;
- no repeated product blocker was observed across the five sessions.

The evidence does not prove:

- one-week stability;
- another Mac;
- notarization, signing, Gatekeeper behavior, DMG install, auto-update, GitHub Release asset publication, colleague rollout, or customer rollout;
- provider expansion;
- product-owned git merge, push, tag, publish, or GitHub Release automation.

## Batch 2 Validation

| Command | Result |
| --- | --- |
| `pnpm desktop:shell:build:local` | Passed. Built the local `.app` bundle with `--no-sign`. |
| `open -n "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app"` | Passed. App process was found after 3 seconds and quit cleanly through `osascript`. |
| `pnpm symphony console --host 127.0.0.1 --port 8765` | Passed. Console listened in read-only mode. |
| `curl -fsS http://127.0.0.1:8765/workbench/desktop/` | Passed. Returned Workbench HTML. |
| `node --test tests/v72-one-week-dogfood-stabilization.test.js` | Passed: 6 tests, 6 passed. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |

## Next Gate

PR-5 may write closeout and the v73 direction decision from these five same-day sessions. It must not claim one-week stability.
