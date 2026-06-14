# v61-v72 Real-use Workbench Plan and Runbooks

Date: 2026-06-14
Target repo: `Andy20010101/multi-coding-agent-symphony`
Planning range: `v61` through `v72`
Current baseline assumed by this package: `v60 Stable Personal Workbench Release` has merged its PR chain, but final tag / GitHub Release publication and post-release operator dry-run evidence still need reconciliation.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.

## 0. Why this plan exists

v60 consolidates the v52-v59 Workbench chain into a stable local baseline. That means the product can explain the daily path, release boundary, provider boundary, safety flags, and evidence refs.

It does not yet mean the product is a finished personal development app.

The remaining gap is the difference between:

```text
read-only / preview-confirm local Workbench baseline
```

and:

```text
daily personal app that can open locally, select a project, run Codex worker work, hand off to Claude Code review, adopt verified patches, run main verification, recover from failure, and prepare releases without unsafe automation
```

## 1. Product target by v72

By the end of v72, the project should be usable as a personal coding-agent workbench with this practical loop:

```text
Open Mac App or local Workbench
-> select current project
-> inspect active goal/task/next safe action
-> run Codex as controlled worker
-> run Claude Code as controlled reviewer
-> loop revision when needed
-> preview and confirm adoption
-> run main verification
-> record explicit gates
-> prepare release handoff
-> reconcile publication evidence
-> recover from interrupted/failed provider runs
```

The product should still not become a generic shell, generic provider launcher, arbitrary local-file reader, transcript browser, auto-merger, auto-tagger, GitHub Release publisher, or public distribution system unless a later version explicitly proves those capabilities with independent contracts, tests, and review.

## 2. Phase map

| Phase | Versions | Outcome |
| --- | --- | --- |
| Stabilize v60 as a usable local baseline | v61-v64 | Released baseline is verified, install/upgrade path is clear, Mac local launch works, first-run project/settings flow exists. |
| Make Codex + Claude Code real | v65-v68 | Codex worker, Claude reviewer, adoption, and main verification become a controlled Workbench loop. |
| Make it durable | v69-v72 | Failure recovery, release manager, native packaging, and dogfood stabilization make the app usable in daily work. |

## 3. Version map

| Version | Goal id | Main outcome |
| --- | --- | --- |
| v61 | `v61-workbench-operator-dry-run-evidence` | Verify the released v60 baseline through one operator session and record route/recovery evidence. |
| v62 | `v62-installer-upgrade-baseline` | Make install / upgrade / rollback behavior explicit and testable. |
| v63 | `v63-mac-app-local-launch-mvp` | Make the local Tauri shell open the Workbench app path without manual browser-first workflow. |
| v64 | `v64-first-run-project-setup-local-settings` | Add safe first-run, project binding, recent project, and local settings flow. |
| v65 | `v65-provider-readiness-codex-claude-only` | Collapse active provider readiness to Codex + Claude Code only. |
| v66 | `v66-controlled-codex-worker-execution` | Run Codex worker tasks through backend-owned preview/confirm contracts. |
| v67 | `v67-claude-code-reviewer-lane` | Run Claude Code reviewer tasks through bounded review handoff contracts. |
| v68 | `v68-adoption-main-verification-loop` | Connect worker/reviewer evidence to adoption and main verification. |
| v69 | `v69-recovery-resume-diagnostics-observability` | Make interrupted, failed, timeout, and blocked provider runs recoverable. |
| v70 | `v70-release-manager-practical-loop` | Prepare release evidence, manual publication pack, and post-release reconcile. |
| v71 | `v71-native-packaging-personal-use` | Build a local personal-use Mac app package without public distribution claims. |
| v72 | `v72-one-week-dogfood-stabilization` | Dogfood the full loop, log friction, fix only real-use blockers, and decide v73 direction. |

## 4. Repository placement

Suggested target directory in the repo:

```text
docs/plans/workbench-v61-v72-real-use-runbooks/
```

Suggested file list:

```text
README_HOW_TO_START.md
v61_workbench-operator-dry-run-evidence_goal_runbook_latest.md
v62_installer-upgrade-baseline_goal_runbook_latest.md
v63_mac-app-local-launch-mvp_goal_runbook_latest.md
v64_first-run-project-setup-local-settings_goal_runbook_latest.md
v65_provider-readiness-codex-claude-only_goal_runbook_latest.md
v66_controlled-codex-worker-execution_goal_runbook_latest.md
v67_claude-code-reviewer-lane_goal_runbook_latest.md
v68_adoption-main-verification-loop_goal_runbook_latest.md
v69_recovery-resume-diagnostics-observability_goal_runbook_latest.md
v70_release-manager-practical-loop_goal_runbook_latest.md
v71_native-packaging-personal-use_goal_runbook_latest.md
v72_one-week-dogfood-stabilization_goal_runbook_latest.md
```

## 5. Execution rules for every version

### 5.1 Version-start checklist

Before opening a version branch:

```sh
git status --short --branch
git rev-list --left-right --count main...origin/main
gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft
pnpm check
```

If the version touches Workbench renderer or static assets:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
```

If the version touches provider contracts:

```sh
node --test tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js
```

If the version touches release boundary:

```sh
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v58-release-closeout-backend-projection.test.js
node --test tests/v59-release-publication-evidence.test.js tests/v59-release-publication-backend-projection.test.js
node --test tests/v60-stable-personal-workbench-release.test.js
```

### 5.2 Branch naming

Use one branch per PR, not one giant version branch:

```text
codex/v61-runbook
codex/v61-release-state-operator-checklist
codex/v61-route-smoke-evidence
codex/v61-recovery-drill-notes
codex/v61-closeout-v62-handoff
```

Continue the same pattern for later versions.

### 5.3 PR size rule

Each PR should contain one of:

```text
docs-only plan/closeout
contract + fixtures + tests
backend projection
Workbench display
acceptance evidence
```

Do not mix provider execution, Workbench UI, release docs, and packaging in one PR unless the runbook explicitly says it is the final closeout PR.

### 5.4 Non-negotiable boundaries

Do not add:

```text
generic shell / terminal UI
renderer-side arbitrary command execution
frontend local JSONL/session/provider folder reads
raw transcript exposure
raw model output exposure
unsupported provider claims
direct event append from provider output
direct task completion from provider output
automatic self-review
automatic worktree creation
automatic next-version goal creation
automatic merge / tag / push / publish / GitHub Release creation
public distribution / notarization / auto-update claims without a dedicated version proving them
```

### 5.5 Model/provider policy

Allowed active product line after v60:

```text
codex-cli        -> worker execution lane
claude-code-cli  -> reviewer execution lane
operator         -> main verifier / release controller
```

Historical / compatibility:

```text
kiro-cli         -> legacy smoke/script path only
```

Configuration-only:

```text
DeepSeek         -> Claude Code provider config only; not an independent Workbench provider
```

Unsupported until a future dedicated version proves otherwise:

```text
Gemini
DeepSeek-as-provider
raw provider CLI launcher
generic model picker
```

## 6. Recommended execution order

The highest-leverage path is:

```text
v61 -> v62 -> v65 -> v66 -> v67 -> v68
```

Reason:

```text
v61 proves v60 can be operated.
v62 proves the baseline can be installed/upgraded.
v65 removes provider ambiguity.
v66 creates real worker execution.
v67 creates real reviewer execution.
v68 completes the worker/reviewer/adoption/verification loop.
```

Then do:

```text
v63 -> v64 -> v69 -> v70 -> v71 -> v72
```

Reason:

```text
v63/v64 improve app usability.
v69/v70 make it resilient and release-practical.
v71 makes it a local Mac app.
v72 validates daily use.
```

If you want the fastest path to "really usable", do not start with packaging polish. Start with provider readiness and controlled execution after v61/v62.
