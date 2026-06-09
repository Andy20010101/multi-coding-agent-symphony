# v44.2 Supervisor Architecture Consolidation Runbook

Date: 2026-06-09

Goal id draft: `v44-2-supervisor-architecture-consolidation`

Source threads:

- `019eaa36-c7e1-75f0-9fed-b456101576c0`: `Run v44.2 supervisor architecture consolidation review`
- `019eaa3c-7dfa-7780-b746-5378cfbf7e85`: `Draft v44.2 supervisor consolidation plan xhigh`

Repository check:

- `AGENTS.md` was not present in this worktree during planning.
- Current supervisor source shape is `src/symphony/goal-supervisor/` with `app-thread-adapter.js`, `core-projection.js`, `event-registrar.js`, `index.js`, `result-protocol.js`, `route-progress.js`, and `state-writer.js`.
- The v44 plan proposed separate `route-engine.js` and `progress-observer.js`; the current code has `route-progress.js`. v44.2 should evaluate that as an intentional deeper Module, not as a filename mismatch to undo.
- The temporary external runner remains the live owner: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`.

## Scope

v44.2 consolidates the repository-owned supervisor core after v44.1. The work is limited to internal vocabulary, projection, preview, policy, and metadata boundaries already present in `src/symphony/goal-supervisor/`.

v44.2 may change repository code in later implementation PRs when the change keeps behavior replay-compatible and stays inside the supervisor core boundary. The current runbook PR only adds this planning document.

In scope:

- one shared supervisor state vocabulary for active lease and live thread status;
- a recorded result intake projection that hides parser and escrow/thread ordering details from route callers;
- a stable route/progress projection surface that keeps progress behind the route Module instead of splitting `route-progress.js` into shallow files;
- a deeper registration preview writer boundary for `state-writer.js` and `event-registrar.js`;
- an internal release policy model for release-manager event, gate, and closeout guard rules;
- a read-only handoff metadata descriptor for temporary runner ownership and external surfaces.

Out of scope:

- runtime migration from the temporary external runner;
- daemon launcher, PTY ownership, real CLI execution, provider CLI execution, browser terminal automation, or generic shell execution;
- tag, push, publish, GitHub Release, or release closeout automation;
- making `docs/plans/controller/local-goal-supervisor-v44-parallel-hardening-plan-2026-06-08.md` the product mainline;
- a live managed-goal append executor;
- mechanical file splitting to match the older v44 plan.

## Guardrails

- `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` remains the only live operational runner during v44.2.
- Repository-owned supervisor code stays read-only or dry-run preview unless an existing managed-goal contract requires explicit plan-hash confirmation. v44.2 does not introduce that live executor.
- `readOnly: true`, `willMutate: false`, `dryRunOnly: true`, `writesInPreview: false`, `confirmExecutorAvailable: false`, and `liveManagedGoalAppendIntroduced: false` remain meaningful safety fields. Do not remove or weaken them while consolidating.
- `allowCloseout` defaults to false. Release-manager routes and registrar previews must keep blocking unauthorized closeout.
- Result parsing treats command output as evidence text, not automatic approval, verification, release readiness, or authorization.
- The route/progress surface must not call the temporary runner, app follow-up transport, provider CLI, git tag, git push, package publish, or GitHub Release command.
- Tests should move toward caller-facing projection behavior, but each PR must preserve v44.1 replay outcomes before changing assertion shape.
- External runner metadata may be referenced as rollback or handoff information only. It must not become an executable Adapter in this repository.

## Work Packages

### WP-1: Supervisor state vocabulary

Objective:

Move active lease, active thread, live thread status, and complete-blocking vocabulary into one internal state model.

Inputs:

- `src/symphony/goal-supervisor/app-thread-adapter.js`
- `src/symphony/goal-supervisor/route-progress.js`
- `fixtures/contracts/goal-supervisor/app-thread-adapter.v44.replay.v1.json`
- `fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json`

Allowed changes:

- Add or deepen an internal state vocabulary Module.
- Replace duplicated active status lists in adapter and route/progress code.
- Keep route decisions and duplicate-dispatch behavior unchanged.

Verification:

- `node --test tests/v44-goal-supervisor-app-thread-adapter.test.js tests/v44-goal-supervisor-route-progress.test.js`
- `pnpm check`
- Add focused conformance coverage for live, not-live, and complete-with-live-lease statuses.

Exit criteria:

- Active/live status values have one source inside `src/symphony/goal-supervisor/`.
- `app-thread-adapter.js` and `route-progress.js` consume the same vocabulary.
- Duplicate dispatch blocking and complete-with-live-lease behavior match current replay fixtures.

Risks:

- A state vocabulary Module can be mistaken for lease ownership. Keep it read-only and do not add lease writes.

### WP-2: Recorded result intake projection

Objective:

Consolidate pending result availability so parser details, escrow-first ordering, thread fallback, invalid results, and consumed/registered state have one projection surface.

Inputs:

- `src/symphony/goal-supervisor/result-protocol.js`
- `src/symphony/goal-supervisor/app-thread-adapter.js`
- `src/symphony/goal-supervisor/route-progress.js`
- `fixtures/contracts/goal-supervisor/result-protocol.v44.replay.v1.json`
- `fixtures/contracts/goal-supervisor/app-thread-adapter.v44.replay.v1.json`

Allowed changes:

- Keep bounded result parsing in or behind `result-protocol.js`.
- Add a recorded result intake projection consumed by adapter and route/progress code.
- Preserve escrow-first precedence over lossy `notLoaded` thread reads.

Verification:

- `node --test tests/v44-goal-supervisor-result-protocol.test.js tests/v44-goal-supervisor-app-thread-adapter.test.js tests/v44-goal-supervisor-route-progress.test.js`
- Replay valid escrow, valid thread result, unreadable thread without result, malformed result, and consumed result cases.

Exit criteria:

- Route code no longer needs to know parser block details or result source ordering.
- Adapter code no longer returns partly duplicated result availability shapes.
- Pending, missing, invalid, unavailable, and consumed states are named in one projection contract.

Risks:

- Escrow path handling sits near the external runner boundary. v44.2 may read and project escrow data, but must not write escrow files or consume live results.

### WP-3: Route/progress projection surface

Objective:

Make route/progress a deeper projection Module with one caller-facing output. Do not split `route-progress.js` into shallow `route-engine.js` and `progress-observer.js` files just to match the old plan.

Inputs:

- `src/symphony/goal-supervisor/route-progress.js`
- `src/symphony/goal-supervisor/core-projection.js`
- `tests/v44-goal-supervisor-route-progress.test.js`
- `fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json`

Allowed changes:

- Keep progress calculation behind the route/progress projection Interface.
- Reduce public helper exports when they are only test seams.
- Keep `progress` visible as part of the route output.

Verification:

- `node --test tests/v44-goal-supervisor-route-progress.test.js tests/v44-goal-supervisor-core-projection.test.js`
- Replay reviewer approval, main verification, worker revision, stalled child, pending result, blocked goal-next, and release-manager closeout-blocked cases.

Exit criteria:

- Tests mainly exercise the caller-facing route/progress projection.
- Internal helpers such as local revision override and latest pending result lookup do not define the production Interface unless production callers need them.
- Release-manager closeout remains blocked without operator authorization.

Risks:

- Route decisions sit on the release closeout guard. Keep `allowCloseout` false by default and do not add closeout execution.

### WP-4: Registration preview writer

Objective:

Make `state-writer.js` and `event-registrar.js` one coherent dry-run preview boundary instead of a shallow writer wrapper over registrar internals.

Inputs:

- `src/symphony/goal-supervisor/state-writer.js`
- `src/symphony/goal-supervisor/event-registrar.js`
- `tests/v44-goal-supervisor-state-writer-event-registrar.test.js`
- `fixtures/contracts/goal-supervisor/state-writer-event-registrar.v44.replay.v1.json`

Allowed changes:

- Either merge the preview writer and registrar or make writer own the preview operation vocabulary.
- Keep existing managed goal plan builders as dry-run plan sources.
- Preserve registration audit checks for already recorded events.

Verification:

- `node --test tests/v44-goal-supervisor-state-writer-event-registrar.test.js`
- Cover dry-run preview, unsafe write refusal, missing registration audit refusal, trusted existing registration, release gate identification, and unauthorized closeout refusal.

Exit criteria:

- The preview Interface explains what would be registered, what audit is required, what is refused, and why.
- `state-writer.js` is no longer a pass-through Module with only `singleWriter` metadata.
- No implementation path appends managed-goal events.

Risks:

- This package is closest to live managed-goal append behavior. Keep `confirmExecutorAvailable: false` and `liveManagedGoalAppendIntroduced: false`.

### WP-5: Release policy model

Objective:

Create one internal policy model for release-manager event matrix, phase-specific release events, release gate identification, closeout authorization, and external release automation denial.

Inputs:

- `src/symphony/goal-supervisor/result-protocol.js`
- `src/symphony/goal-supervisor/event-registrar.js`
- `src/symphony/goal-supervisor/route-progress.js`
- `src/symphony/goal-supervisor/core-projection.js`
- scoped release gates from `docs/plans/v44-project-internal-goal-supervisor-core-plan-2026-06-08.md`

Allowed changes:

- Add an internal release policy Module.
- Move duplicated release gate defaults and release-manager closeout rules behind that Module.
- Keep policy consumers in parser, registrar, route/progress, and projection behavior-compatible.

Verification:

- `node --test tests/v44-goal-supervisor-result-protocol.test.js tests/v44-goal-supervisor-route-progress.test.js tests/v44-goal-supervisor-state-writer-event-registrar.test.js tests/v44-goal-supervisor-core-projection.test.js`
- Replay release-gate result with one gate mention, release-prep result with no gate mention, unauthorized `release.ready-declared`, blocked release-manager route, and projection boundaries denying tag/push/publish automation.

Exit criteria:

- Release-manager event and closeout guard rules have one source.
- Default scoped release gates are not redefined independently in multiple Modules.
- The policy model only describes allow/deny/project behavior; it does not execute closeout.

Risks:

- A release policy Module can be misread as release automation. Keep it as a policy object used by existing read-only/projection/dry-run paths.

### WP-6: Core projection handoff metadata

Objective:

Move temporary runner path, repository-owned surface names, external surface names, rollback action, and next handoff condition into read-only handoff metadata.

Inputs:

- `src/symphony/goal-supervisor/core-projection.js`
- `docs/plans/v44-task-5-supervisor-core-projection-handoff-2026-06-08.md`
- `fixtures/contracts/goal-supervisor/core-projection.v44.replay.v1.json`

Allowed changes:

- Add a descriptor or fixture-backed metadata Module.
- Make core projection reference the descriptor instead of owning external runner and handoff vocabulary directly.
- Keep metadata visible in projection output for comparison and rollback.

Verification:

- `node --test tests/v44-goal-supervisor-core-projection.test.js`
- Check that the temporary runner path remains visible as fallback metadata.
- Check that no code path invokes the external runner.

Exit criteria:

- `core-projection.js` composes route, progress, result intake, and handoff descriptor without owning the external boundary list.
- Handoff output still tells operators to continue using the temporary runner if projection disagrees with live behavior.
- No executable Adapter is introduced for the temporary runner.

Risks:

- The descriptor must stay metadata. Do not add launch, doctor, audit, tag, push, publish, or provider CLI behavior.

## Execution Order

1. Start with PR-1. Shared state vocabulary is the base for every later PR.
2. After PR-1 merges, PR-2 and PR-4 may start in separate threads. PR-2 changes result intake; PR-4 changes registration preview. They should not edit the same files except `index.js` exports if needed.
3. PR-3 starts after PR-2 merge. Route/progress should consume the recorded result projection rather than preserving old pending-result lookup paths.
4. PR-4 may merge after PR-1 if it stays inside writer/registrar preview. If it changes shared release or result policy, hold it until PR-3 is reviewed.
5. PR-5 starts after PR-3 and the final PR-4 diff are stable. Release policy touches parser, registrar, route, and projection, so it needs those Interfaces to stop moving.
6. PR-6 may prepare descriptor-only changes after PR-1, but it merges last. Handoff metadata should reflect the final v44.2 boundaries, not an intermediate shape.

Parallel work allowed:

- PR-2 and PR-4 can run in parallel after PR-1.
- PR-6 research and fixture planning can run in parallel after PR-1, but code merge waits for PR-5.

Must wait for prior validation:

- PR-3 waits for PR-2 result intake replay.
- PR-5 waits for PR-3 route/progress replay and PR-4 preview replay.
- PR-6 waits for PR-5 policy replay.

## PR Breakdown

Each PR gets one implementation thread. Do not combine these PRs into a broad refactor branch.

### PR-1 supervisor state vocabulary

Thread mission:

Unify active lease and live thread status vocabulary.

Allowed files:

- `src/symphony/goal-supervisor/`
- `tests/v44-goal-supervisor-app-thread-adapter.test.js`
- `tests/v44-goal-supervisor-route-progress.test.js`
- relevant `fixtures/contracts/goal-supervisor/*.json`

Must not touch:

- event registration writer behavior;
- release policy beyond active/live status naming;
- handoff metadata.

Merge check:

- Focused v44 adapter and route/progress tests pass.
- No behavior change in duplicate dispatch, live lease blocking, or complete-with-live-lease replay.

### PR-2 recorded result intake projection

Thread mission:

Build the result intake projection consumed by adapter and route/progress code.

Allowed files:

- `src/symphony/goal-supervisor/result-protocol.js`
- `src/symphony/goal-supervisor/app-thread-adapter.js`
- `src/symphony/goal-supervisor/route-progress.js`
- matching tests and fixtures

Dependency:

- PR-1 merged.

Merge check:

- Parser tests still cover malformed text.
- Adapter and route/progress tests use the shared result projection for pending/missing/invalid/consumed outcomes.
- Valid escrow still wins before lossy thread reads.

### PR-3 route/progress projection surface

Thread mission:

Stabilize the caller-facing route/progress projection and reduce test-only public helper surface.

Allowed files:

- `src/symphony/goal-supervisor/route-progress.js`
- `src/symphony/goal-supervisor/core-projection.js`
- route/progress and core projection tests and fixtures

Dependency:

- PR-2 merged.

Merge check:

- Route output remains read-only and non-mutating.
- Progress remains part of the route/progress projection output.
- `route-progress.js` is not split into shallow files.

### PR-4 registration preview writer

Thread mission:

Make writer and registrar one coherent preview boundary.

Allowed files:

- `src/symphony/goal-supervisor/state-writer.js`
- `src/symphony/goal-supervisor/event-registrar.js`
- writer/registrar tests and fixtures

Dependency:

- May start after PR-1.
- Merge after PR-1 if the diff stays inside preview writer/registrar.
- Hold for PR-3 if it changes shared route/result/release vocabulary.

Merge check:

- Preview boundaries still say dry-run only.
- No live managed-goal append executor appears.
- Missing audit and unauthorized closeout refusals remain covered.

### PR-5 release policy model

Thread mission:

Move release-manager event, gate, and closeout guard rules into one internal policy model.

Allowed files:

- `src/symphony/goal-supervisor/result-protocol.js`
- `src/symphony/goal-supervisor/event-registrar.js`
- `src/symphony/goal-supervisor/route-progress.js`
- `src/symphony/goal-supervisor/core-projection.js`
- matching tests and fixtures

Dependency:

- PR-3 merged.
- PR-4 merged or reviewed as stable if it touches release behavior.

Merge check:

- Release-gate and release-prep parser behavior is unchanged.
- Unauthorized `release.ready-declared` remains refused.
- Tag, push, publish, GitHub Release, provider CLI, daemon, doctor, audit, and closeout execution remain outside repo-owned behavior.

### PR-6 core projection handoff metadata

Thread mission:

Extract read-only handoff metadata from core projection implementation.

Allowed files:

- `src/symphony/goal-supervisor/core-projection.js`
- optional new handoff descriptor under `src/symphony/goal-supervisor/`
- core projection tests and fixtures
- documentation updates if needed

Dependency:

- PR-5 merged.

Merge check:

- Projection still exposes the temporary external runner path as fallback metadata.
- No executable Adapter or command invocation is introduced.
- Handoff metadata names repository-owned surfaces and external surfaces after the final v44.2 PRs.

## Merge Policy

- One PR equals one implementation thread. The thread result must name the exact files changed, tests run, replay fixtures touched, and boundary fields checked.
- Keep PRs small enough that review can compare before/after behavior against v44 replay fixtures.
- Merge PR-1 first. Do not merge PR-2, PR-3, PR-5, or PR-6 before their dependency checks pass.
- Parallel PRs must not edit the same source file unless the later thread rebases after the earlier merge and re-runs focused tests.
- A PR that touches `core-projection.js`, `route-progress.js`, or `event-registrar.js` must explicitly state whether it affected release closeout guard behavior.
- Every code PR must run its focused `node --test` command and `pnpm check`. Run full `pnpm test` before merging PR-5 or PR-6 because those PRs touch shared policy or final projection shape.
- Documentation-only follow-up is allowed when it records final Interface decisions. It must not become a substitute for replay coverage.
- Do not push, tag, publish, or open a release from any v44.2 implementation thread unless a later runbook explicitly authorizes that work.

## First PR Recommendation

Start with PR-1: supervisor state vocabulary.

Smallest useful diff:

- Add one internal state vocabulary/model for active lease and live thread status.
- Replace the active status constants in `app-thread-adapter.js` and `route-progress.js`.
- Add conformance tests that cover the active/live statuses used by duplicate dispatch, wait-active-thread, stalled child, pending result, and complete-with-live-lease cases.
- Keep result intake, writer/registrar preview, release policy, and handoff metadata untouched.

Acceptance for PR-1:

- `node --test tests/v44-goal-supervisor-app-thread-adapter.test.js tests/v44-goal-supervisor-route-progress.test.js` passes.
- `pnpm check` passes.
- Replay behavior for duplicate dispatch, active lease wait, and complete-with-live-lease is unchanged.
- No live write, runner invocation, provider CLI, daemon, tag, push, publish, or release closeout path is added.

Why this is first:

The duplicated active status list is small, concrete, and already used by two Modules. Fixing it first reduces churn for result intake and route/progress work without touching release policy or writer behavior.

## Stop Conditions

Stop the current PR and return to planning if any of these conditions appears:

- The diff calls, wraps, or shells out to `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`.
- The diff introduces daemon launch, PTY ownership, provider CLI execution, real CLI execution, browser terminal automation, generic shell execution, tag, push, publish, GitHub Release, doctor, audit, or closeout automation.
- A preview path changes from dry-run/read-only to live mutation.
- `allowCloseout` starts defaulting to true or unauthorized `release.ready-declared` becomes registrable.
- `route-progress.js` is split into two shallow pass-through Modules without reducing caller Interface complexity.
- `local-goal-supervisor-v44-parallel-hardening-plan-2026-06-08.md` becomes a mainline dependency for v44.2.
- Tests require the temporary external runner, live app thread state, a daemon, or local operator memory to pass.
- A PR changes route decisions but does not update replay fixtures and explain the behavior difference.
- A PR expands scope outside `src/symphony/goal-supervisor/`, matching tests, matching fixtures, or explicit docs without a new plan.
- Review cannot tell whether a changed Interface is public caller surface or internal implementation detail.
