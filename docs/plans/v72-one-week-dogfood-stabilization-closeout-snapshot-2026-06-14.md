# v72 One-week Dogfood Stabilization closeout snapshot

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v72-one-week-dogfood-stabilization`
PR-5 branch: `codex/v72-closeout-v73-direction`
Pre-closeout main commit: `e52bea276391c41fa0c378c0d0dc625207499cde`

## Shipped State

v72 ships a same-day dogfood stabilization record for the local personal-use Workbench:

```text
v71 local .app package
-> v72 dogfood protocol
-> session template and metrics contract
-> five same-day operator sessions
-> dependency recovery note
-> closeout and v73 direction decision
```

v72 does not claim one-week stability. All counted session records happened on 2026-06-15.

## PR Scope Record

| Runbook slot | GitHub PR | Branch | Merge commit | Merged at | Evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook/protocol | #179 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/179` | `codex/v72-runbook-protocol` | `78c2fd54ecd78844d7554cf97809bb0534f4c762` | 2026-06-15T02:56:13Z | Added v72 runbook alignment, latest runbook file, and dogfood protocol. |
| PR-1 session template and metrics contract | #180 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/180` | `codex/v72-session-template-metrics` | `8123d9de5e4e5a6e30cfc4f8fe933d3197a81d42` | 2026-06-15T03:00:47Z | Added template, `dogfoodSession.v1`, summary contract, and focused tests. |
| PR-2 session evidence batch 1 | #181 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/181` | `codex/v72-session-evidence-batch-1` | `fba557ff1c44984fb48786933e8fe3a088eb86dd` | 2026-06-15T03:04:44Z | Recorded sessions `v72-s01` to `v72-s03`. |
| PR-3 targeted real-use fix | #182 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/182` | `codex/v72-real-use-dependency-recovery` | `a29f41166882bf96aefd899cc5a91c79d663134d` | 2026-06-15T03:07:24Z | Documented dependency recovery for missing `node_modules`. |
| PR-4 session evidence batch 2 and summary | #183 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/183` | `codex/v72-session-evidence-batch-2` | `e52bea276391c41fa0c378c0d0dc625207499cde` | 2026-06-15T03:11:14Z | Recorded sessions `v72-s04` to `v72-s05`, same-day summary, and five-session metrics. |
| PR-5 closeout and v73 direction | This PR | `codex/v72-closeout-v73-direction` | Pending until merge | Pending until merge | Adds acceptance, closeout snapshot, and v73 direction decision. |

## Session Evidence

| Session | Entry path | Result | Friction |
| --- | --- | --- | --- |
| `v72-s01` | controller terminal | Passed. | Existing v72 handoff runbook needed alignment to the six-PR dogfood protocol. |
| `v72-s02` | controller terminal | Passed after test adjustment. | Unsafe evidence test initially used the builder and threw before structured validation. |
| `v72-s03` | package build | Passed after dependency recovery. | Fresh worktree lacked `node_modules`; `pnpm install` recovered the validation path. |
| `v72-s04` | packaged app | Passed. | First local Tauri build compiled Rust dependencies in this worktree. |
| `v72-s05` | browser fallback | Passed. | HEAD returned 405 by boundary; GET returned Workbench HTML. |

## Metrics

| Metric | Value |
| --- | --- |
| Counted sessions | 5 |
| Evidence period | same day, 2026-06-15 |
| One-week stability | not proven |
| Success observed | 5 sessions |
| Blocked observed | 1 session |
| Recovery count observed | 2 |
| Manual terminal escape count observed | 5 |
| Repeated product blocker | not observed |
| Cost | unknown |

## Validation Evidence

| Command | Result |
| --- | --- |
| `pnpm desktop:shell:build:local` | Passed in session `v72-s04`; built the local `.app` bundle with `--no-sign`. |
| `open -n "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app"` | Passed in session `v72-s04`; process stayed running for 3 seconds and quit cleanly through `osascript`. |
| `pnpm symphony console --host 127.0.0.1 --port 8765` | Passed in session `v72-s05`; console reported read-only safety and no writes. |
| `curl -fsS http://127.0.0.1:8765/workbench/desktop/` | Passed in session `v72-s05`; returned Workbench HTML. |
| `pnpm workbench:build` | Passed. |
| `node --test tests/v72-one-week-dogfood-stabilization.test.js` | Passed: 6 tests, 6 passed. |
| `node --test tests/v71-native-packaging-personal-use.test.js` | Passed: 5 tests, 5 passed. |
| `node --test tests/v70-release-manager-practical-loop.test.js` | Passed: 11 tests, 11 passed. |
| `node --test tests/v69-recovery-resume-diagnostics-observability.test.js` | Passed: 15 tests, 15 passed. |
| `node --test tests/v68-adoption-main-verification-loop.test.js` | Passed: 13 tests, 13 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 133 tests, 133 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed. |

`pnpm test` must run on the final post-PR-5 `origin/main` commit before creating the annotated `v72` tag.

## Release Boundary

The product still does not provide:

- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend local JSONL, provider session folder, `.symphony` internals, raw transcript, raw model output, or raw provider output reads;
- unsupported provider claims;
- direct event append or task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, auto-update, DMG release, GitHub Release assets, colleague rollout, or customer rollout.

## Residual Risks

The five sessions prove same-day operator use only. They do not prove a full working week.

The local package build/open evidence is from this macOS host. It does not prove another Mac, code signing, notarization, Gatekeeper prompts, DMG install, auto-update, Release asset publication, or rollout behavior.

The fresh-worktree dependency miss was recovered with `pnpm install`. New worktrees can still need the same setup step.

## Rollback Path

- Revert PR #183 if the session summary is read as one-week stability.
- Revert PR #182 if the dependency recovery note starts hiding validation failures instead of recording recovery.
- Revert PR #180 if session contracts stop rejecting unsafe evidence refs, raw output, local session refs, release automation claims, or distribution claims.
- Revert PR #179 if the v72 runbook permits closeout without real session evidence.
- Use browser fallback if the packaged app cannot open:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```

## Tag and Release State Before v72 Publication

Before PR-5 publication:

| Check | Result |
| --- | --- |
| `v71` tag and release | Existing and verified before v72 implementation. |
| `v72` tag | Absent at v72 start. |
| `v72` GitHub Release | Not created at v72 start. |
| Open PR state | Empty before v72; each v72 PR was merged after CI passed. |

After PR-5 is reviewed, merged, and synced to `main`, the controller should:

1. Reconcile `main` and `origin/main`.
2. Verify `v72` tag and GitHub Release are absent.
3. Run `pnpm test` on the final post-PR-5 `origin/main` commit.
4. Create an annotated `v72` tag on the final `origin/main` commit.
5. Push the `v72` tag.
6. Create the GitHub Release for `v72` with no assets.
7. Verify `v72^{}` dereferences to the final `origin/main` commit.
8. Verify the GitHub Release is non-draft, non-prerelease, has no assets, and has `targetCommitish` `main`.

Release note draft:

```text
v72: One-week Dogfood Stabilization

- Adds a v72 dogfood protocol, session log template, and `dogfoodSession.v1` contract for safe same-day and future one-week evidence.
- Records five same-day operator sessions covering runbook alignment, session contract work, Workbench validation, local package build/open smoke, and browser fallback.
- Documents the observed fresh-worktree dependency recovery path with `pnpm install`.
- Keeps one-week stability unclaimed because all counted sessions happened on 2026-06-15.
- Keeps public distribution, notarization, auto-update, DMG release, GitHub Release assets, rollout claims, generic shell, renderer command execution, local session reads, raw transcript/model output, provider expansion, automatic worktree/goal creation, and product-owned release automation out of scope.
```
