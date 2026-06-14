# v60 Stable Personal Workbench Release runbook

Date: 2026-06-14
Timezone: Asia/Shanghai
Goal id: `v60-stable-personal-workbench-release`
Branch draft: `codex/v60-stable-personal-workbench-release`
Start condition: v59 `release-publication-evidence-and-next-start-audit` is reviewed, merged, tagged, and released by the controller.

## Objective

v60 should turn the v52-v59 Workbench chain into a stable personal Workbench baseline. It is a consolidation version, not a new execution surface.

The target path is:

```text
v52 system golden path
-> v53 child dispatch preview
-> v54 Codex provider execution preview
-> v55 Codex run recovery and reviewer handoff
-> v56 thread continuation pack
-> v57 review gate Workbench surface
-> v58 release closeout handoff pack
-> v59 release publication evidence
-> stable Workbench baseline evidence
```

The version is successful only if an operator can inspect the current daily Workbench path, release boundary checklist, recovery path, and manual release prep without Workbench adding generic command execution, release automation, raw transcript exposure, local session reads, or unsupported provider claims.

## Boundary

Allowed work:

- synchronize README and operator-facing docs with the current v52-v59 state;
- add a stable baseline acceptance contract, fixtures, and tests;
- record a feature matrix for shipped Workbench surfaces;
- record release boundary checks for manual tag and GitHub Release work;
- update recovery, troubleshooting, and provider-boundary docs;
- make small Workbench label or navigation cleanup if needed to find existing state;
- rebuild generated Workbench static assets only if Workbench source changes.

Forbidden work:

- new provider integrations;
- provider claims not backed by current tests or fixtures;
- generic shell or terminal UI;
- arbitrary renderer-side command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, or raw model output;
- direct goal event append from provider output;
- direct task completion from provider output;
- automatic self-review;
- git write, merge, push, tag, publish, GitHub Release creation, or release automation inside product code;
- signed distribution, notarization, auto-update, public `.dmg`, or public installer claims unless this version explicitly proves them;
- automatic worktree creation;
- automatic next-version goal creation.

## Stable baseline documents

Update or create only where the current repository state supports the claim:

```text
README.md
docs/workbench-operator-guide.md
docs/release-checklist.md
docs/security-checklist.md
docs/troubleshooting.md
docs/provider-boundary-guide.md
docs/daily-workflow-runbook.md
docs/recovery-guide.md
docs/qa/v60-stable-personal-workbench-release-acceptance.md
docs/plans/v60-stable-personal-workbench-release-closeout-snapshot-2026-06-14.md
```

README and guide text should include:

```text
current tagged release
current Workbench entry
daily workflow path
what is automated
what remains operator-controlled
known limitations
manual release boundary
```

## Stable Workbench feature matrix

| Area | v60 expectation |
| --- | --- |
| Project entry | Project Launcher, current project binding, and route health are documented. |
| Goal supervision | Active goal, next action, supervisor status, and route provenance are documented. |
| Context | Context advisory and handoff packs remain copy-only where applicable. |
| Result intake | Result intake keeps preview and confirm behind evidence escrow. |
| Event registration | Controlled event registration keeps preview and planHash confirm separate. |
| Child task planning | Child dispatch preview remains copy-only and backend-owned. |
| Provider execution | Existing provider execution and recovery surfaces stay controlled by explicit contracts. |
| Review and gates | Review gate and main/release gate state remain explicit-state or copy-only. |
| Thread handoff | Thread continuation packs remain bounded and copy-only. |
| Release closeout | v58 closeout handoff and v59 publication evidence remain read-only. |
| Release | Tag, push, publish, and GitHub Release work remain manual controller actions. |

## PR breakdown

### PR-0: Runbook

File:

- `docs/plans/v60-stable-personal-workbench-release-runbook-2026-06-14.md`

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Documentation synchronization

Scope:

- README current state;
- Workbench operator guide;
- daily workflow guide;
- provider boundary guide;
- recovery and troubleshooting docs;
- release checklist.

Validation:

```sh
git diff --check
pnpm check
```

### PR-2: Stable baseline acceptance contract

Add contract and fixtures for the stable Workbench baseline:

```text
stableWorkbenchRelease.v1
stable-workbench-release.ready.v1.json
stable-workbench-release.blocked-missing-surface.v1.json
stable-workbench-release.blocked-release-boundary-drift.v1.json
stable-workbench-release.blocked-unsupported-provider-claim.v1.json
stable-workbench-release.blocked-local-session-or-transcript-exposure.v1.json
```

Tests:

```sh
node --test tests/v60-stable-personal-workbench-release.test.js
node --test tests/v59-release-publication-evidence.test.js
node --test tests/v58-release-closeout-operator-handoff-pack.test.js
pnpm check
git diff --check
```

### PR-3: Workbench stable baseline surface

Scope:

- keep existing Workbench routes and panels read-only where their contracts require it;
- make the shipped v52-v59 surfaces findable from Desktop App Home;
- add only display state needed for stable baseline evidence;
- assert no generic command execution, tag, push, publish, GitHub Release creation/edit, release-ready, provider launch outside existing controlled contracts, local file read, transcript read, event append, task completion, worktree creation, or next-goal controls appear.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v60-stable-personal-workbench-release.test.js
pnpm check
git diff --check
```

### PR-4: Acceptance evidence

Acceptance should record:

- v52 System Golden Path evidence;
- v53 child dispatch preview evidence;
- v54 Codex provider execution evidence;
- v55 Codex run recovery and reviewer handoff evidence;
- v56 thread continuation pack evidence;
- v57 review gate Workbench evidence;
- v58 release closeout handoff evidence;
- v59 release publication evidence;
- raw transcript and raw model output exclusion;
- unsupported provider claim blocking;
- release automation blocking.

Validation:

```sh
node --test tests/v60-stable-personal-workbench-release.test.js
node --test tests/v59-release-publication-evidence.test.js tests/v59-release-publication-backend-projection.test.js
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v58-release-closeout-backend-projection.test.js
node --test tests/v57-review-gate-workbench-surface.test.js tests/v56-thread-continuation-reviewer-handoff-pack.test.js
node --test tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js tests/v54-codex-provider-execution-pilot.test.js
node --test tests/v53-child-dispatch-preview.test.js tests/v52-system-golden-path.test.js
node --test tests/v51-result-intake-evidence-escrow.test.js tests/v50-supervisor-event-registration-eligibility.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm workbench:build
pnpm check
git diff --check
```

### PR-5: Closeout and manual release prep

Files:

```text
docs/qa/v60-stable-personal-workbench-release-acceptance.md
docs/plans/v60-stable-personal-workbench-release-closeout-snapshot-2026-06-14.md
docs/plans/v61-runbook-2026-06-14.md
```

Release note draft should avoid public distribution claims unless v60 proves them:

```text
v60: Stable Personal Workbench Baseline

- Documents the current local Workbench path for supervised development workflows.
- Keeps result intake, event registration, review gates, closeout handoff, and publication evidence behind explicit contracts.
- Keeps tag, push, publish, and GitHub Release work manual.
- Does not claim public distribution, notarization, auto-update, generic shell execution, or unsupported provider support.
```

Validation:

```sh
pnpm workbench:build
node --test tests/v60-stable-personal-workbench-release.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless closeout records why a narrower suite was selected.

## Rollback path

If docs overstate current behavior, revert the docs PR.

If stable baseline contracts accept unsupported provider claims, release automation, raw transcript exposure, raw model output exposure, local session reads, generic shell execution, direct event append, direct task completion, worktree creation, or next-goal automation, revert the contract PR.

If Workbench changes expose executable controls or local-file/raw-output reads, revert the Workbench PR and rebuild static assets from the reverted source state.

If closeout claims public distribution, notarization, auto-update, or release automation without direct evidence, revert the closeout PR before tagging v60.
