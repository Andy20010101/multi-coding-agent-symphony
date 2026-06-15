# v72 One-week Dogfood Stabilization goal runbook

Date: 2026-06-14
Goal id: `v72-one-week-dogfood-stabilization`
Branch draft: `codex/v72-one-week-dogfood-stabilization`
Start condition: v71 local personal-use app package path is merged and at least one local launch/package smoke has been recorded.

## Objective

v72 should stop adding architecture and validate the product through repeated real operator use. The version closes real friction only: unclear next action, missing evidence, unrecoverable failure, provider handoff confusion, adoption/main verification friction, or packaging/launch blockers.

## Target path

```text
personal-use app
-> daily real task sessions
-> friction log
-> stability metrics
-> targeted cleanup
-> v72 closeout
-> v73 direction decision
```

## Boundary

Allowed work:

- record at least five operator task sessions, ideally across one working week;
- each session should include current project, active goal/task, next action, worker/reviewer/adoption/verification status, blockers, recovery actions, and terminal escapes;
- add a dogfood session log template;
- add only targeted UX/contract/doc/test fixes tied to recorded friction;
- measure run success rate, review loop count, recovery count, manual terminal escapes, and task closeout time when available;
- write a v73 decision memo: continue stabilization, enter public/internal distribution, or build next automation surface.

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
- public distribution, notarization, or auto-update claims unless a later version explicitly proves them;
- large new feature work not tied to dogfood evidence;
- hiding friction by editing acceptance docs only;
- claiming one-week stability without session records;
- turning terminal escapes into generic shell UI.

## Expected deliverables

- `docs/dogfood/v72-session-log-template.md`
- `docs/qa/v72-one-week-dogfood-stabilization-acceptance.md`
- `docs/plans/v72-one-week-dogfood-stabilization-closeout-snapshot-2026-06-14.md`
- `docs/plans/v73-direction-decision-2026-06-14.md`
- `tests/v72-one-week-dogfood-stabilization.test.js`

## PR breakdown

### PR-0: Runbook

Scope:

- Add v72 runbook and dogfood protocol.
- Define what counts as a session record.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Dogfood session log template and metrics contract

Scope:

- Add session log template.
- Add optional `dogfoodSession.v1` validation helper if useful.
- Required fields: date, project, goal/task, worker provider, reviewer provider, adoption status, verification status, failure/recovery, terminal escapes, friction notes, evidence refs.
- Metrics: success, blocked, recovery count, manual terminal escape count, elapsed time if observed, cost if observed/unknown.

Validation:

```sh
node --test tests/v72-one-week-dogfood-stabilization.test.js
pnpm check
git diff --check
```

### PR-2: Session evidence batch 1

Scope:

- Record first two or three real operator sessions.
- Do not over-polish; preserve friction notes.
- Create targeted fixes only when a blocker is repeated or severe.

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

- Fix only issues backed by dogfood evidence:
  - next action unclear;
  - blocked reason too vague;
  - evidence refs unreadable;
  - provider handoff confusing;
  - recovery action missing;
  - adoption/main verification friction;
  - App launch/sidecar friction.
- No new generic execution surface.

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

- Record remaining dogfood sessions until at least five session records exist.
- Summarize success rate, manual terminal escapes, recovery count, repeated blockers, and unresolved risks.
- Mark claims as `observed`, `not observed`, or `unknown`.

Validation:

```sh
node --test tests/v72-one-week-dogfood-stabilization.test.js
pnpm check
git diff --check
```

### PR-5: Closeout and v73 direction decision

Scope:

- Add v72 closeout snapshot.
- Add v73 direction decision:
  1. continue stabilization;
  2. internal/public distribution;
  3. deeper automation;
  4. provider expansion only if explicitly justified.
- Record what must be cut or simplified from historical compatibility.

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

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

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

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback path

If dogfood docs claim stability without session records, revert acceptance docs. If fixes add broad execution surfaces to solve friction, revert those fixes and design a controlled action in a later version.

## Next-version handoff

v73 should be decided from dogfood evidence, not from architectural ambition. The likely choices are: polish/stabilize, internal distribution, or deeper automation of one proven bottleneck.
