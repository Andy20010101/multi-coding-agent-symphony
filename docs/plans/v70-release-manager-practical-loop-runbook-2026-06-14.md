# v70 Release Manager Practical Loop runbook

Date: 2026-06-14
Goal id: `v70-release-manager-practical-loop`
Branch draft: `codex/v70-release-manager-practical-loop`
Start condition: v69 recovery and diagnostics surface is merged and execution-loop failures have structured recovery evidence.

## Objective

v70 should make release preparation practical for the personal Workbench: verify local gates, prepare release evidence, generate manual publication commands, and reconcile tag and GitHub Release evidence after the controller publishes.

## Target Path

```text
main verified goal
-> release readiness resolver
-> release evidence draft
-> manual publication pack
-> controller tag/release
-> post-release reconcile
-> v70 closeout and v71 handoff
```

## Boundary

Allowed work:

- add a release readiness resolver for clean main, origin/main sync, open PRs, required gates, release notes, target commit, and asset policy;
- generate release evidence draft from explicit gate events and validation command results;
- generate manual publication pack with copy-only tag, push, and GitHub Release commands;
- record post-release reconcile after the controller creates the tag and GitHub Release;
- keep publication as manual controller action or terminal-only copy command;
- block release readiness when required gates are missing or source refs mismatch.

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
- public distribution, notarization, or auto-update claims unless the version explicitly proves them;
- Workbench running `git tag`, `git push`, `gh release create`, `gh release edit`, or release upload;
- release-ready inference from passing tests alone;
- release publication before open PR and target commit reconciliation.

## Expected Deliverables

- `src/symphony/release-manager-practical-contracts.js`
- `fixtures/contracts/release-manager-practical/*.json`
- `tests/v70-release-manager-practical-loop.test.js`
- `docs/qa/v70-release-manager-practical-loop-acceptance.md`
- `docs/plans/v70-release-manager-practical-loop-closeout-snapshot-2026-06-14.md`
- `docs/plans/v71-native-packaging-personal-use-runbook-2026-06-14.md`

## PR Breakdown

### PR-0: Runbook

Scope:

- add v70 runbook and release-manager boundary;
- carry v68/v69 main verification and recovery evidence assumptions.

Validation:

```sh
git diff --check
git diff --cached --check
```

### PR-1: Release Readiness Resolver Contract

Scope:

- add contract for clean main, origin/main sync, open PRs, required gates, release evidence refs, release notes draft, target commit, tag existence, GitHub Release existence, and asset policy;
- fixtures: ready, dirty worktree, branch mismatch, main/origin drift, open PRs, missing gates, tag exists wrong commit, release draft/prerelease, unexpected assets.

Validation:

```sh
node --test tests/v70-release-manager-practical-loop.test.js
node --test tests/v60-stable-personal-workbench-release.test.js
pnpm check
git diff --check
```

### PR-2: Release Evidence Draft and Manual Publication Pack

Scope:

- generate release evidence draft from explicit gate events and command evidence refs;
- generate copy-only manual commands for tag, push tag, `gh release create`, and `gh release view`;
- store publication as external controller action requirement.

Validation:

```sh
node --test tests/v70-release-manager-practical-loop.test.js
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v59-release-publication-evidence.test.js
pnpm check
git diff --check
```

### PR-3: Workbench Release Manager Practical Surface

Scope:

- show readiness, blockers, gate evidence, target commit, manual commands, release notes draft, and post-release reconcile status;
- keep copy-only commands display-only;
- do not add tag, push, publish, GitHub Release create, GitHub Release edit, or upload buttons.

Validation:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v70-release-manager-practical-loop.test.js
pnpm check
git diff --check
```

### PR-4: Post-Release Reconcile Evidence

Scope:

- record how to capture tag object, dereferenced commit, release URL, draft/prerelease flags, asset policy, target commitish, and rollback ref;
- if actual publication is not performed during v70, closeout must state manual publication pending and block release claim.

Validation:

```sh
node --test tests/v70-release-manager-practical-loop.test.js
pnpm check
git diff --check
```

### PR-5: Acceptance, Closeout, and v71 Handoff

Scope:

- record release-manager practical loop evidence;
- hand off to native packaging for personal use.

Validation:

```sh
pnpm workbench:build
node --test tests/v70-release-manager-practical-loop.test.js
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
pnpm workbench:build
node --test tests/v70-release-manager-practical-loop.test.js
node --test tests/v69-recovery-resume-diagnostics-observability.test.js
node --test tests/v58-release-closeout-operator-handoff-pack.test.js tests/v59-release-publication-evidence.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance Criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback Path

If release readiness is inferred from UI text, passing tests, branch names, or filenames rather than explicit gates, revert the resolver PR. If Workbench executes tag, push, or `gh release` commands, revert the surface PR.

## Next-Version Handoff

v71 should make a local personal-use Mac app package without claiming public distribution, notarization, or auto-update.
