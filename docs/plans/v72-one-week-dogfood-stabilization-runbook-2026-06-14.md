# v72 One-week Dogfood Stabilization runbook

Date: 2026-06-15
Goal id: `v72-one-week-dogfood-stabilization`
Branch draft: `codex/v72-one-week-dogfood-stabilization`
Start condition: v71 native packaging for personal use is merged, tagged, released, and the local package/open smoke evidence remains explicit.

## Objective

v72 validates the v71 local personal-use app through repeated operator use. The version records real operator task sessions, preserves friction notes, fixes only blocker-level issues found during dogfood, and writes the v73 direction decision from evidence.

v72 must not claim one-week stability until session records actually cover that period. Same-day dogfood records can support same-day findings only.

## Target Path

```text
v71 local .app package
-> operator task sessions
-> friction log
-> metrics with observed, not observed, or unknown values
-> targeted fixes only when evidence justifies them
-> closeout and v73 direction decision
```

## Boundary

Allowed work:

- record at least five operator task sessions, ideally across one working week;
- record date, time, project, goal/task, worker provider, reviewer provider, adoption status, verification status, failure/recovery, terminal escapes, friction notes, and evidence refs for each session;
- add the dogfood session log template and metrics contract;
- add only targeted docs, contract, test, or UX fixes tied to recorded friction;
- measure success, blocked state, review loop count, recovery count, manual terminal escape count, elapsed time, and cost when observed;
- write a v73 decision memo from session evidence.

Forbidden work:

- large new feature work not tied to dogfood evidence;
- hiding friction by editing acceptance docs only;
- claiming stability without session records;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw model output, or raw provider output;
- unsupported provider claims;
- direct goal event append from provider output;
- direct task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, auto-update, DMG release, GitHub Release assets, colleague rollout, customer rollout, signing secrets, or publish secrets.

## Expected Deliverables

- `docs/qa/v72-one-week-dogfood-stabilization-protocol.md`
- `docs/dogfood/v72-session-log-template.md`
- `docs/qa/v72-one-week-dogfood-stabilization-acceptance.md`
- `docs/plans/v72-one-week-dogfood-stabilization-closeout-snapshot-2026-06-14.md`
- `docs/plans/v73-direction-decision-2026-06-14.md`
- `tests/v72-one-week-dogfood-stabilization.test.js`

## PR Breakdown

### PR-0: Runbook and dogfood protocol

Scope:

- align the v72 runbook to the one-week dogfood boundary;
- add the dogfood protocol;
- define what counts as a valid session record;
- record that v72 closeout remains blocked until at least five real session records exist.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Dogfood session template and metrics contract

Scope:

- add the session log template;
- add `dogfoodSession.v1` validation coverage if useful;
- require date, project, goal/task, worker provider, reviewer provider, adoption status, verification status, failure/recovery, terminal escapes, friction notes, and evidence refs;
- require metrics to be sourced from session records or marked `unknown` / `not observed`.

Validation:

```sh
node --test tests/v72-one-week-dogfood-stabilization.test.js
pnpm check
git diff --check
```

### PR-2: Session evidence batch 1

Scope:

- record the first two or three real operator sessions;
- preserve friction notes;
- create targeted fixes only when a blocker is repeated or severe.

Validation:

```sh
pnpm workbench:build
node --test tests/v72-one-week-dogfood-stabilization.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

### PR-3: Targeted real-use fixes

Scope:

- fix only issues backed by dogfood evidence, such as unclear next action, vague blocked reason, unreadable evidence refs, provider handoff confusion, missing recovery action, adoption/main verification friction, or app launch/sidecar friction;
- keep fixes scoped and reversible;
- do not add a generic execution surface.

Validation:

```sh
pnpm workbench:build
node --test tests/v72-one-week-dogfood-stabilization.test.js
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v68-adoption-main-verification-loop.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

### PR-4: Session evidence batch 2 and stability summary

Scope:

- record remaining dogfood sessions until at least five session records exist;
- summarize success rate, manual terminal escapes, recovery count, repeated blockers, and unresolved risks;
- mark claims as `observed`, `not observed`, or `unknown`;
- state clearly when the evidence is same-day dogfood rather than one-week stability.

Validation:

```sh
node --test tests/v72-one-week-dogfood-stabilization.test.js
pnpm check
git diff --check
```

### PR-5: Closeout and v73 direction decision

Scope:

- add the v72 closeout snapshot;
- add the v73 direction decision;
- record what must be cut or simplified from historical compatibility;
- do not close out v72 until the real session evidence gate is satisfied.

Validation:

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

Run `pnpm test` on the final `origin/main` commit before tagging unless the closeout snapshot records why a narrower suite was selected and accepted.

## Acceptance Criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. at least five real operator task session records exist before closeout;
3. any same-day evidence is described as same-day dogfood, not one-week stability;
4. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, auto-update, DMG release, GitHub Release assets, or rollout readiness;
5. every state transition that mutates managed state uses a backend-owned preview/confirm path or an explicitly manual controller path;
6. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
7. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback Path

If dogfood docs claim stability without session records, revert the acceptance or closeout docs.

If fixes add broad execution surfaces, renderer-side command execution, frontend local session reads, provider raw output exposure, release automation, public distribution, notarization, auto-update, DMG release, release assets, or rollout claims, revert those fixes and design a controlled action in a later version.

If the packaged app fails during dogfood, return to the browser Workbench path:

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```

## Next-Version Handoff

v73 should be chosen from dogfood evidence. The allowed direction choices are continued stabilization, internal distribution readiness in a new explicit scope, deeper automation of one proven bottleneck, or provider expansion only when session evidence justifies it.
