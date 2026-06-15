# v73 Multi-day Real-use Stabilization runbook

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v73-multi-day-real-use-stabilization`
Baseline: `v72^{}` at `cdde20c20931a4e002b184246ad7fd3585fa0979`

## Purpose

v73 is a practical stabilization version for personal use.

It should prove whether the local Workbench path is repeatable across multiple days, real CLI-backed development tasks, and opt-in provider checks. It should not add a new architecture, provider surface, release automation, terminal UI, generic shell, public distribution, notarization, auto-update, or product-owned git/GitHub release actions.

v73 may make small documentation or UI copy fixes only when a real session shows repeated friction. It should prefer evidence collection over feature expansion.

## Completion Gate

v73 can claim personal real-use MVP only when all rows below are true.

| Gate | Required evidence |
| --- | --- |
| Multi-day use | Counted sessions cover at least 3 consecutive calendar days in Asia/Shanghai. |
| Real CLI-backed tasks | At least 3 and at most 5 counted tasks are real development or release-operations tasks that invoke a gated real CLI worker/reviewer lane, or record the exact real CLI blocker found while attempting that lane. Synthetic checks and local-only automation do not count. |
| Codex worker opt-in smoke | At least one real Codex worker smoke is intentionally enabled and recorded as passed or blocked with the exact blocker. |
| Claude Code reviewer opt-in smoke | At least one real Claude Code reviewer smoke is intentionally enabled and recorded as passed or blocked with the exact blocker. |
| Local app path | The local packaged app path is built/opened on more than one counted day, or the runbook records the exact blocker and fallback used. |
| Browser fallback | `pnpm symphony console --host 127.0.0.1 --port 8765` plus `GET /workbench/desktop/` is verified at least once during v73. |
| Real failures and recovery | Every counted session records failures, recovery steps, and terminal escapes. Use `none observed after check` only when checked. |
| README/operator/install/release consistency | `README.md`, `docs/workbench-operator-guide.md`, `docs/install-guide.md`, and `docs/release-checklist.md` agree on current release, active version, installer ref policy, and v72/v73 state. |
| v72 completed/not completed | README and operator guide state what v72 proved and what it did not prove. |
| Installer decision | v73 explicitly keeps `v8` default, introduces `latest-stable`, or documents explicit `MCAS_INSTALL_REF=v72`; the decision includes release-state evidence and rollback. |
| Repeated product blocker | No repeated product blocker remains unresolved. If one repeats, v73 either fixes it in a scoped PR or records why it is not product work. |

If any gate is missing, v73 remains stabilization-in-progress and must not claim personal real-use MVP.

## PR Chain

| Slot | Scope | Files likely touched | Exit condition |
| --- | --- | --- | --- |
| PR-0 | Runbook and protocol | This file plus optional v73 session template | The v73 controller can run daily without reinterpreting scope. |
| PR-1 | Current-state docs sync | `README.md`, `docs/workbench-operator-guide.md`, `docs/install-guide.md`, `docs/release-checklist.md` | Docs state `v72` as latest release, `v73` as current stabilization, and the installer policy decision. |
| PR-2 | Multi-day evidence batch 1 | `docs/qa/v73-...-sessions-batch-1-YYYY-MM-DD.md` | First day or two are recorded with local app, fallback, and real CLI task evidence or exact real CLI blockers. |
| PR-3 | Provider opt-in smoke evidence | `docs/qa/v73-...-provider-smoke-YYYY-MM-DD.md` | Real Codex worker and Claude Code reviewer smokes are recorded as passed or blocked with sanitized evidence. |
| PR-4 | Multi-day evidence batch 2 | `docs/qa/v73-...-sessions-batch-2-YYYY-MM-DD.md` | Total counted sessions reach 3-5 real CLI-backed tasks across at least 3 consecutive days. |
| PR-5 | Acceptance, closeout, and next decision | `docs/qa/v73-...-acceptance.md`, `docs/plans/v73-...-closeout-snapshot-YYYY-MM-DD.md`, optional v74 direction | All completion gates are resolved; release notes state exactly what is and is not proven. |

Do not start v74 until v73 has merged, tagged, GitHub Release state has been verified, and the final v73 closeout says whether personal real-use MVP was reached.

## Expected Timeline

Minimum calendar time is 3 consecutive Asia/Shanghai days because the completion gate requires multi-day use. The normal target is 4-5 days. If the real provider smokes hit account, CLI, model, or network blockers, allow 5-7 days and record the blocker instead of forcing a pass.

| Day | Target | Task package | Expected PR |
| --- | --- | --- | --- |
| Day 1 | Start state and docs alignment | Publish PR-0 if needed. Repair README, operator guide, install guide, and release checklist so they agree on `v72` as the latest release and `v73` as current stabilization. Choose installer policy. Record session `v73-s01`. | PR-0, PR-1 |
| Day 2 | First real-use batch | Run one real CLI-backed development or release-operations task. Record the gated Codex worker lane result or its exact blocker, plus failure, recovery, terminal escape, and evidence. Record session `v73-s02`. | PR-2 |
| Day 3 | Provider and repeatability check | Run another real CLI-backed task. Re-check local app path and browser fallback. Record the gated Claude Code reviewer lane result or its exact blocker. Record session `v73-s03`. | PR-3 or PR-4 |
| Day 4 | Fill missing gate | Use this day only for gaps: extra real CLI-backed task, provider blocker recovery, repeated product blocker fix, or app open/fallback repeatability. Record `v73-s04` only if it includes real work or a concrete blocker recovery. | PR-4 |
| Day 5 | Closeout decision | Finish acceptance and closeout only if all gates are resolved. If gates are missing, keep v73 stabilization-in-progress and name the missing evidence. | PR-5 |

Fast path: 3 days if docs sync, app/fallback, Codex smoke, Claude smoke, and 3 real CLI-backed tasks all pass without repeated blockers.

Expected path: 4-5 days because provider smokes usually need operator approval and may need environment repair.

Blocked path: 5-7 days when Codex or Claude Code smoke cannot run. The closeout can still be useful, but it must say personal real-use MVP is not proven unless the operator accepts the blocker as resolved or out of scope.

## Automation Plan

Automation is allowed for repeatable checks and evidence scaffolding. It must not hide real failures or convert a blocked provider smoke into a pass.

Automate these steps:

- repository reconcile;
- tag and GitHub Release state checks;
- Workbench build and focused test commands;
- browser fallback `GET /workbench/desktop/` check;
- session Markdown template generation;
- safe evidence field checks;
- README/operator/install/release consistency scan;
- PR status and CI status polling.

Keep these manual or explicit opt-in:

- choosing the real daily task;
- deciding whether a session counts;
- opening the macOS `.app` and confirming it was usable;
- enabling `MCAS_RUN_REAL_CODEX=1`;
- enabling `MCAS_RUN_REAL_CLAUDE=1`;
- interpreting provider/account/model/network blockers;
- approving merge, tag, push, or GitHub Release publication.

Suggested daily automation command group:

```sh
git status --short --branch
git rev-list --left-right --count main...origin/main
gh pr list --state open --limit 20 --json number,title,headRefName,baseRefName,isDraft,mergeable,reviewDecision
git show-ref --tags -d | rg 'refs/tags/v72|refs/tags/v73'
gh release view v72 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
gh release view v73 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
pnpm workbench:build
node --test tests/v72-one-week-dogfood-stabilization.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

Suggested browser fallback automation:

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
curl -fsS http://127.0.0.1:8765/workbench/desktop/
```

Provider smoke automation remains gated:

```sh
pnpm mcas doctor --real-cli --adapter codex --require-gates --proof-dir tmp/v73-real-cli-proofs
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:codex:real
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:harness:codex:real
pnpm mcas doctor --real-cli --adapter claude-code --require-gates --proof-dir tmp/v73-real-cli-proofs
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:claude:real
```

Do not run the provider smoke commands in an unattended loop. Run them only after the operator confirms the env gate and expected account/provider configuration.

## Daily Controller Loop

Run this loop once per counted day.

1. Reconcile repository state:

```sh
git status --short --branch
git rev-list --left-right --count main...origin/main
gh pr list --state open --limit 20 --json number,title,headRefName,baseRefName,isDraft,mergeable,reviewDecision
git show-ref --tags -d | rg 'refs/tags/v72|refs/tags/v73'
gh release view v72 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
gh release view v73 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
```

Expected v73 start state:

- `main...origin/main` is `0 0`;
- no open PRs unless the current v73 PR is intentionally active;
- `v72^{}` dereferences to `cdde20c20931a4e002b184246ad7fd3585fa0979`;
- v72 GitHub Release exists, non-draft, non-prerelease, no assets, targetCommitish `main`;
- v73 tag and GitHub Release are absent until v73 publication.

2. Choose one real CLI-backed task for the session.

Count real work only when the session attempts a gated real CLI lane or records the exact real CLI blocker found while preparing that lane. Docs state repair, install policy decisions, local app verification, release-state reconcile, failure recovery, and small UX/docs cleanup can be session context, but they do not count toward the real task gate unless they are exercised through a real CLI worker/reviewer lane.

Do not count a command-only run as a session unless it was the actual operator task and the record includes the operator goal, result, friction, recovery, and next action.

3. Verify local app path when the session touches the app:

```sh
pnpm desktop:shell:build:local
```

Open the generated local `.app` through the operator's macOS session. Record whether it opened, how long it stayed running, how it was closed, and any recovery step.

4. Verify browser fallback at least once in v73:

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
curl -fsS http://127.0.0.1:8765/workbench/desktop/
```

Record `GET /workbench/desktop/` evidence. Do not use `HEAD` as the only browser fallback proof.

5. Record the session.

Each counted record must include:

- session id;
- local date and timezone;
- task title;
- task type;
- entry path;
- commands run;
- result;
- failure or blocker;
- recovery step;
- terminal escape count;
- safe evidence refs;
- next action.

Evidence refs must not point to local provider session files, raw transcript paths, `.jsonl` files, `.codex`, `.claude`, `.symphony`, secret values, raw provider output, raw model output, or uncommitted local-only files.

## Provider Smoke Rules

Provider smokes are opt-in. Do not run them unless the operator intentionally enables the matching environment variable and accepts that a real CLI may call a model provider.

For v73, real CLI-backed tasks are the only tasks that count toward the real task gate. A local-only smoke, browser fallback, or package open check can prove stability, but it cannot replace a gated real CLI attempt.

Codex worker smoke candidates:

```sh
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:codex:real
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:harness:codex:real
```

Claude Code reviewer smoke candidate:

```sh
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/v73-real-cli-proofs pnpm smoke:claude:real
```

Before claiming provider smoke success, record:

- the exact command;
- whether the enabling environment variable was set;
- whether the CLI was available;
- sanitized proof artifact ref if one exists;
- requested model/profile fields if the smoke emits them;
- provider blocker if it fails.

Do not copy raw provider output, raw model output, raw transcripts, local provider session paths, credentials, API keys, or `.jsonl` paths into repository docs.

## Documentation Sync Requirements

PR-1 must repair current-state drift.

`README.md` should state:

- latest completed mainline release is `v72`;
- current version is `v73 Multi-day Real-use Stabilization`;
- v72 proved same-day dogfood with five sessions, local package build/open smoke, browser fallback, and dependency recovery;
- v72 did not prove multi-day stability, provider real-use success, public distribution, notarization, auto-update, DMG release, GitHub Release assets, generic shell, renderer command execution, local session reads, raw transcript/model output handling, provider expansion, automatic worktree/goal creation, or product-owned release automation;
- v73 is collecting multi-day personal-use MVP evidence.

`docs/workbench-operator-guide.md` should state the same current release/version facts and point the operator to the v73 daily loop.

`docs/install-guide.md` must keep one clear installer policy:

- keep `v8` default and document explicit `MCAS_INSTALL_REF=v72`; or
- introduce a documented `latest-stable` policy; or
- advance another explicit target only with release-state evidence and rollback.

`docs/release-checklist.md` must add v73 closeout gates without weakening existing full-release gates.

## Focused Validation

Default validation for v73 docs/protocol PRs:

```sh
pnpm workbench:build
node --test tests/v72-one-week-dogfood-stabilization.test.js
node --test tests/v71-native-packaging-personal-use.test.js
node --test tests/v70-release-manager-practical-loop.test.js
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Before v73 tag publication, run `pnpm test` on the final post-closeout `origin/main` commit unless the closeout records a scoped validation exception accepted by the operator.

## Boundaries

v73 does not include:

- public distribution;
- notarization;
- auto-update;
- DMG release;
- GitHub Release assets;
- colleague or customer rollout;
- provider expansion;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend local session, provider folder, raw transcript, raw model output, or raw provider output reads;
- product-owned git merge, push, tag, publish, or GitHub Release automation;
- automatic self-review, worktree creation, or next-version goal creation;
- a claim that v72 proved one-week stability.

## Continuous Thread Startup Prompt

Use this prompt to start the v73 controller thread. The controller should run with `gpt-5.5` and reasoning `xhigh`.

```text
You are the v73 controller for /Users/andy/Documents/project/multi-coding-agent-symphony.

Goal: v73 Multi-day Real-use Stabilization.

Use model gpt-5.5 with reasoning xhigh. Reply in Chinese, short and state-first. Keep one version as one goal. Do not start v74. Do not merge, tag, push, or create a GitHub Release unless the operator explicitly authorizes that release tail.

First reconcile:
- pwd
- git status --short --branch
- git rev-list --left-right --count main...origin/main
- gh pr list --state open --limit 20 --json number,title,headRefName,baseRefName,isDraft,mergeable,reviewDecision
- git show-ref --tags -d | rg 'refs/tags/v72|refs/tags/v73'
- gh release view v72 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
- gh release view v73 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish

Read:
- docs/plans/v73-multi-day-real-use-stabilization-runbook-2026-06-15.md
- docs/plans/v73-direction-decision-2026-06-14.md
- docs/plans/v72-one-week-dogfood-stabilization-closeout-snapshot-2026-06-14.md
- README.md
- docs/workbench-operator-guide.md
- docs/install-guide.md
- docs/release-checklist.md

Scope:
1. Keep v73 practical. Do not make architecture changes.
2. Collect real dogfood over at least 3 consecutive Asia/Shanghai calendar days.
3. Count 3-5 real development or release-operations tasks.
4. Include at least one opt-in real Codex worker smoke and one opt-in real Claude Code reviewer smoke. Record passed or blocked with sanitized evidence. Do not run real provider smokes unless the operator intentionally enables the env gate.
5. Record real failures, recovery steps, and terminal escapes.
6. Fix README current version state.
7. Decide installer policy: keep v8 default with explicit MCAS_INSTALL_REF=v72, or document latest-stable / another explicit policy with release-state evidence and rollback.
8. Put what v72 completed and did not complete into README and docs/workbench-operator-guide.md.

Completion claim:
Only say personal real-use MVP is reached if all gates in the v73 runbook pass:
- multi-day use;
- real CLI-backed task evidence for Codex worker and Claude Code reviewer, or explicit blockers accepted by the operator;
- repeatable local app open path;
- browser fallback works;
- README/install/release state agree;
- no unresolved repeated product blocker.

PR chain:
- PR-0 runbook/protocol only.
- PR-1 docs current-state sync.
- PR-2 multi-day evidence batch 1.
- PR-3 provider opt-in smoke evidence.
- PR-4 multi-day evidence batch 2.
- PR-5 acceptance, closeout, and next decision.

Boundaries:
No public distribution, notarization, auto-update, DMG release, GitHub Release assets, colleague/customer rollout, provider expansion, generic shell/terminal UI, renderer arbitrary command execution, frontend local session/provider/raw transcript/raw model output reads, product-owned git merge/push/tag/publish/GitHub Release automation, automatic self-review, automatic worktree creation, or automatic next-version goal creation.

Start by publishing PR-0 if it is not already merged. If PR-0 exists, continue with PR-1. Keep evidence concrete: commands, files, dates, refs, exact blockers, and rollback. Do not invent session counts, provider success, cost, or stability claims.
```
