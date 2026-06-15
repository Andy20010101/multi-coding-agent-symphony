# v71 Native Packaging for Personal Use start evidence

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v71-native-packaging-personal-use`
Branch: `codex/v71-runbook-start`

## Start Gate

v71 starts from verified v70 release state.

| Check | Result |
| --- | --- |
| `origin/main` | `d6588c24ede4091e8d6e9d2898e6b8194aac192b` |
| Latest merged v70 PR | #173 `codex/v70-acceptance-closeout-handoff` |
| Open PRs | `[]` |
| `v70` tag object | `bff76ec6d98d9def7049ba2a8226bd2a8639d89f` |
| `v70^{}` | `d6588c24ede4091e8d6e9d2898e6b8194aac192b` |
| GitHub Release `v70` | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v70` |
| GitHub Release flags | non-draft, non-prerelease |
| GitHub Release assets | `[]` |
| GitHub Release targetCommitish | `main` |

## v71 Boundary

v71 is limited to local personal-use Mac packaging for the existing Tauri shell:

```text
local Tauri shell
-> local package build
-> local open smoke
-> install, uninstall, reinstall, rollback docs
-> acceptance and v72 handoff
```

The version does not claim public distribution, notarization, auto-update, a public DMG, colleague rollout, customer rollout, release asset upload, product-side git writes, or GitHub Release automation.

## Source Files

The implementation follows:

- `docs/plans/v71-native-packaging-personal-use-runbook-2026-06-14.md`
- `docs/plans/workbench-v61-v72-real-use-runbooks/v71_native-packaging-personal-use_goal_runbook_latest.md`
- `/Users/andy/.codex/skills/report-writing-no-slop/SKILL.md`

## PR Plan

| Slot | Scope |
| --- | --- |
| PR-0 | Start evidence and v70 release boundary. |
| PR-1 | Packaging source boundary tests and smoke checks. |
| PR-2 | Local package build path and package artifact path. |
| PR-3 | Packaged app operator docs for build, open, uninstall, reinstall, and rollback. |
| PR-4 | Acceptance, closeout, validation evidence, and v72 handoff. |

## Rollback

Revert this file if the v70 tag, peeled commit, Release URL, Release flags, asset policy, or `origin/main` start commit is later found to be wrong.
