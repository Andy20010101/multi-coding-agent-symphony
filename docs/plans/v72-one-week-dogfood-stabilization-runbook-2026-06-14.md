# v72 One Week Dogfood Stabilization runbook

Date: 2026-06-14
Goal id: `v72-one-week-dogfood-stabilization`
Branch draft: `codex/v72-one-week-dogfood-stabilization`
Start condition: v71 native packaging for personal use is merged, tagged, released, and the local `.app` package/open smoke evidence remains explicit.

## Objective

v72 should dogfood the v71 local packaged app for one week of personal development work and close real-use blockers. It should stabilize the local app path, not turn it into public distribution.

## Target Path

```text
v71 local .app package
-> daily open and sidecar attach notes
-> real-use blocker log
-> small stabilization fixes
-> closeout and post-dogfood recommendation
```

## Boundary

Allowed work:

- record daily local package launch evidence from the v71 `.app`;
- record sidecar attach, sidecar unavailable, stale backend, and browser fallback behavior from real use;
- fix small app-local blockers found during dogfood;
- keep rollback and reinstall steps current if a blocker changes them;
- update tests when a blocker has a reproducible contract or smoke path;
- record when package build or app launch cannot be run and why.

Forbidden work:

- public distribution;
- notarization;
- auto-update;
- public DMG;
- GitHub Release asset upload;
- colleague or customer rollout;
- codesigning or publish secrets in repo;
- broad filesystem or shell Tauri plugins;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw model output, or raw provider output;
- unsupported provider claims;
- direct event append or task completion from provider output;
- automatic self-review;
- automatic worktree creation;
- automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation.

## Expected Deliverables

- `docs/qa/v72-one-week-dogfood-stabilization-acceptance.md`
- `docs/plans/v72-one-week-dogfood-stabilization-closeout-snapshot-2026-06-14.md`
- daily dogfood evidence files under `docs/qa/evidence/` or a single dated evidence log under `docs/qa/`
- targeted fixes and tests only when a real dogfood blocker requires code changes

## PR Breakdown

### PR-0: Dogfood Start Evidence

Scope:

- record v71 tag, GitHub Release, and local package evidence;
- record the first package build/open smoke command results;
- define the dogfood log format.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Daily Launch and Sidecar Evidence

Scope:

- record daily open, sidecar attach, sidecar unavailable, stale backend, and browser fallback observations;
- do not change code unless a blocker is reproducible and scoped.

Validation:

```sh
pnpm desktop:shell:smoke
node --test tests/v71-native-packaging-personal-use.test.js
git diff --check
```

### PR-2: First Stabilization Fix

Scope:

- fix the highest-impact dogfood blocker found in PR-1 evidence;
- add focused tests or smoke coverage for that blocker;
- keep packaging personal-use only.

Validation:

```sh
pnpm workbench:build
pnpm desktop:shell:smoke
node --test tests/v71-native-packaging-personal-use.test.js
pnpm check
git diff --check
```

### PR-3: Dogfood Closeout

Scope:

- record accepted blockers, fixed blockers, deferred blockers, package/open evidence, rollback path, and next recommendation;
- do not start a public distribution track unless a later goal explicitly scopes it.

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

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted.

## Acceptance Criteria

The version is acceptable only when:

1. dogfood evidence records actual local app use, not only source-level tests;
2. package launch, sidecar attach/unavailable behavior, and browser fallback have dated evidence;
3. each fixed blocker has a source, reproduction note, validation command, and rollback path;
4. deferred blockers have owner, reason, and next action;
5. Workbench and Tauri surfaces still do not claim public distribution, notarization, auto-update, DMG release, GitHub Release assets, or colleague/customer rollout;
6. closeout records validation commands, skipped gates, residual risks, and post-dogfood recommendation.

## Rollback Path

If the packaged app fails during dogfood, return to the browser Workbench path:

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```

If a stabilization fix broadens the native bridge, adds broad filesystem or shell plugins, reads local session folders from the renderer, or claims distribution readiness, revert that fix before tagging.

## Next-Version Handoff

The next version should be chosen from dogfood evidence. If v72 shows local personal use is stable, the next goal can decide whether to improve daily workflow polish or start a separate distribution-readiness plan. Distribution-readiness must be a new explicit scope with signing, notarization, asset policy, and rollout evidence.
