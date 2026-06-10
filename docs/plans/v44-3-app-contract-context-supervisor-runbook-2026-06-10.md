# v44.3 App Contract and Context Supervisor Runbook

Date: 2026-06-10

Goal id draft: `v44-3-app-contract-context-supervisor`

Branch: `codex/v44-3-app-contract-context-runbook`

Baseline checked: `origin/main` at `720348f64ed4ad4bfd4518e7d16e252ac88f77a4`

## Scope

v44.3 builds an app-facing backend contract and a context-aware supervisor read model. It does not start frontend implementation. It does not move runtime ownership into repository code.

The next implementation work should produce one stable backend surface that the Workbench and future app shells can read. The frontend must not assemble supervisor state by reading runner internals, goal ledger files, event logs, app thread JSON, or provider session JSONL.

This runbook records implementation order, ownership boundaries, PR boundaries, and CI policy. It changes no runtime behavior.

## Baseline

This plan follows the v44.2 closeout state:

- `docs/plans/v44-2-supervisor-architecture-consolidation-plan-2026-06-09.md`
- `docs/plans/v44-2-supervisor-architecture-consolidation-closeout-snapshot-2026-06-10.md`
- `docs/plans/controller/context-management.md`
- `src/symphony/goal-supervisor/core-projection.js`
- `src/symphony/goal-supervisor/core-projection-handoff-metadata.js`
- `src/symphony/supervisor-runner.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `.github/workflows/ci.yml`

Current v44.2 repository-owned supervisor code is read-only or dry-run projection code. The temporary external runner path remains:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

`core-projection.js` already exposes `readOnly: true`, `willMutate: false`, route/progress state, release-policy boundaries, and handoff metadata. `core-projection-handoff-metadata.js` keeps daemon launcher, PTY ownership, real CLI execution, provider CLI execution, generic shell execution, browser terminal automation, live managed-goal append confirmation, GitHub Release automation, and release closeout automation outside repository-owned behavior.

`supervisor-runner.js` is still a dry-run plan and observability surface. It can describe active children, daemon freshness, provider progress, and approval-required conditions, but it does not create controller threads or register events.

`console.js` and `frontend/workbench/src/api/contracts.js` already use read-only API routes and frontend projection models. Workbench currently reads several backend contracts such as `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and run timelines. v44.3 should add a backend contract that composes those sources before the frontend consumes them.

## Ownership

The temporary coding system daemon is the orchestration owner for v44.3 implementation work. It owns child dispatch, active lease tracking, polling, checkpoint prompts, and drift recovery while the work is in progress.

PRs remain the delivery boundary:

- code review happens per PR;
- merge and rollback happen per PR;
- each PR names the exact contract, fixtures, tests, and gates it changes;
- no PR claims release closeout unless an explicit release runbook authorizes it.

The main controller should not manually take over child orchestration while the daemon has a live lease. Manual intervention is limited to these cases:

- the read model and daemon state disagree;
- a transcript is stale or missing and the daemon cannot prove the active child state;
- a gate requires explicit confirmation;
- branch, PR, or CI state blocks forward progress;
- release closeout, tag, publish, or GitHub Release work is requested.

## Architecture

v44.3 should add a pipeline that builds one stable read model from existing repository contracts and read-only session hooks:

```text
goal runbook / ledger / event log / goal-next
        + v44.2 supervisor core projection
        + supervisor runner observability
        + read-only Codex and Claude session hooks
        -> goal-supervisor-app-read-model.v1
        -> read-only API and CLI
        -> Workbench or app shell
```

The pipeline owns normalization and policy decisions. API and CLI routes expose the read model. Frontend code reads only the API contract. It must not read:

- `src/symphony/supervisor-runner.js` internals;
- `.symphony/goals/**` ledger or event files;
- goal event journal JSONL directly;
- app thread transport files;
- `~/.codex/sessions/**` JSONL;
- `~/.claude/projects/**` JSONL.

The read model may include source refs and redacted excerpts needed for diagnosis. It must not expose raw transcript text, raw provider output, secrets, or command stdout that has not passed an explicit sanitizer.

## Contract Objects

The app-facing contract name should be `goal-supervisor-app-read-model.v1`. The initial route can be `/api/goals/latest/supervisor`; a scoped route can be `/api/goals/<goal-id>/supervisor`. A CLI mirror can be `pnpm --silent symphony supervisor status --goal <goal-id> --json`.

Required top-level fields:

| Object | Required content | Boundary |
| --- | --- | --- |
| `goalSnapshot` | `goalId`, title, total task count, completed count, active task, active role, release readiness, blocker count, source contracts, generated timestamp | Derived from backend contracts. No frontend recomputation from ledger files. |
| `goalTimeline` | ordered task and gate events, event ids, task ids, roles, statuses, evidence refs, hash-chain state if exposed by backend | Read-only projection. Evidence refs are identifiers, not file reads. |
| `activeLease` | lease id, thread id, task id, role, phase, status, started/updated timestamps, age, duplicate-dispatch guard | From daemon/supervisor state and session hook reads. No writes or lease repair in the read model. |
| `pendingResult` | source, status `pending` / `missing` / `invalid` / `unavailable` / `consumed`, event to register, evidence ref, parser reason, stale/missing markers | Uses the v44.2 recorded result intake vocabulary. Does not register events. |
| `currentGate` | gate id, required command family, status, evidence requirement, blocking reason, closeout authorization state | Describes gate state only. Release closeout remains blocked without explicit authorization. |
| `recommendedNextAction` | action id, label, reason, target role, task id, safe command preview when allowed, required confirmation fields | Recommendation only. It does not execute dispatch, event registration, tests, release, or provider commands. |
| `ownership` | `orchestrationOwner`, `deliveryBoundary`, active PR, branch, rollback boundary, daemon state, controller intervention reason | Must say daemon owns orchestration and PR owns review/merge/rollback. |
| `contextStatus` | session source summaries, transcript availability, exchange count, latest tool call, token usage, context utilization, stale/missing transcript state, drift markers | Uses read-only session hooks. No transcript writes and no `.symphony` writes. |
| `commandBoundary` | state `disabled` / `dry-run` / `confirm-required`, allowed command families, blocked command families, confirmation fields, execution availability | Default is `disabled`. `dry-run` may render copy-only commands. `confirm-required` still cannot bypass release or provider boundaries. |

`commandBoundary` defaults:

```json
{
  "state": "disabled",
  "executionAvailable": false,
  "copyOnly": true,
  "allowedCommandFamilies": [],
  "blockedCommandFamilies": [
    "provider-cli",
    "real-cli",
    "generic-shell",
    "daemon-launch",
    "child-dispatch",
    "goal-ledger-write",
    "event-log-write",
    "mutation-gate",
    "audit",
    "tag",
    "push-release",
    "publish-release",
    "github-release",
    "release-closeout"
  ]
}
```

Later PRs may set `state: "dry-run"` for copy-only previews or `state: "confirm-required"` for existing controlled commands. A confirm-required command must carry a plan hash, goal id, task id or gate id, actor, evidence ref, and explicit reason. The default remains no execution.

## Session Hook Runtime

v44.3 should add a read-only session hook runtime after the base app contract is stable.

Codex session source:

```text
~/.codex/sessions/YYYY/MM/DD/*.jsonl
```

Claude session source:

```text
~/.claude/projects/**/*.jsonl
```

The hook runtime may read:

- exchange ids and timestamps;
- role/message boundaries when needed for progress state;
- tool calls and tool result status;
- token usage when present;
- context utilization when present;
- latest completed, in-progress, or failed turn state;
- stale transcript state;
- missing transcript state;
- sanitized evidence that a transcript contains a bounded result block.

The hook runtime must not:

- write `.symphony`;
- write the goal ledger;
- write the goal event log;
- consume result escrow;
- register goal events;
- become a single state writer;
- launch provider CLIs;
- start or stop the daemon;
- dispatch child threads.

Adapters for Codex and Claude should normalize into one `sessionContext.v1` shape. Unknown provider fields stay `missing`, not inferred. Raw transcript text should stay outside the app contract unless a later security review approves a bounded, redacted excerpt field.

## Context-Aware Policy

The supervisor policy should combine session context with supervisor task state. It should return one recommended next action and one reason.

| Policy result | Use when | Required output |
| --- | --- | --- |
| `continue` | daemon has a healthy active lease, transcript is recent, context utilization is acceptable, and no result is pending | active lease summary and wait/continue reason |
| `checkpoint` | a phase ended, context utilization is high, a result is pending registration, or a handoff is needed before review/main verification | checkpoint reason, required durable refs, next owner |
| `compact` | transcript context is near limit and a durable checkpoint exists | compact reason, checkpoint ref, blocked fields if checkpoint is missing |
| `open-handoff-thread` | role changes, review/main verification begins, transcript is stale, or the current thread cannot safely carry the next phase | target role, prompt source, source refs, no auto-dispatch flag |
| `wait` | active child is still running and the latest transcript/tool signal is recent | wait duration policy and stale threshold |
| `recover-drift` | daemon state, supervisor projection, PR state, or session transcript disagree | mismatch list, safest recovery command preview, manual intervention reason |
| `block` | transcript is missing without another source of truth, command boundary requires confirmation, release closeout is requested, or state is unsafe | blocker id, required evidence, owner to unblock |

Policy must prefer waiting or checkpointing over duplicate dispatch. It must not infer approval, verification, release readiness, or task completion from branch names, filenames, PR titles, prompt text, command strings, or frontend state.

## PR Order

Keep v44.3 to six PRs unless CI needs one small infra PR between PR-0 and PR-1.

### PR-0 runbook and CI policy plan

This PR. It adds this runbook only.

Files:

- `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`

Validation:

- `git diff --check`

No runtime code, no frontend code, no CI workflow edit, no mutation gate.

### PR-CI path-aware CI gate, if workflow changes are approved

This is a small infra PR only if the current workflow continues to slow docs-only or feature-branch pushes. It should land after PR-0 and before PR-1.

Allowed file:

- `.github/workflows/ci.yml`

Required behavior:

- docs-only and planning-only PRs do not run mutation gate;
- feature branch pushes do not run full mutation by default;
- PR events choose docs, code, contract-impacting, and stage-gate paths from changed files;
- manual `workflow_dispatch` remains available for full mutation and full release checks;
- real CLI and provider CLI checks stay opt-in.

If PR-CI is not created, PR-1 must still state which CI jobs were intentionally skipped for docs/planning or focused contract work.

### PR-1 app-facing contracts and fixtures

Define `goal-supervisor-app-read-model.v1` and fixture scenarios. Do not expose the API route yet.

Allowed areas:

- `src/symphony/goal-supervisor/`
- `fixtures/contracts/goal-supervisor/`
- focused contract tests

Required scenarios:

- dispatchable next action;
- active lease with recent transcript;
- active lease with stale transcript;
- pending escrow result;
- missing transcript;
- release closeout blocked;
- command boundary disabled;
- dry-run command preview;
- confirm-required command preview.

Merge check:

- focused contract tests;
- `pnpm check`;
- `git diff --check`.

### PR-2 projection pipeline and read-only API/CLI

Compose existing goal contracts, v44.2 core projection, supervisor runner observability, and PR-1 fixtures into one read model. Expose it through read-only API and CLI.

Allowed areas:

- `src/symphony/goal-supervisor/`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js` route allowlist only, not UI implementation
- `tests/workbench-api-client.test.js`
- focused CLI/API tests

Required boundaries:

- API accepts `GET` only;
- CLI prints JSON only;
- no frontend panel implementation;
- no direct frontend read of ledger, event log, runner internals, or JSONL;
- no dispatch, event registration, provider CLI, mutation, audit, tag, publish, or release closeout.

Merge check:

- focused API/CLI tests;
- `pnpm check`;
- `git diff --check`.

### PR-3 session hook runtime

Add read-only Codex and Claude session adapters and feed normalized context into the read model.

Allowed areas:

- session hook adapter modules;
- fixtures with sanitized Codex and Claude JSONL samples;
- focused tests for stale, missing, tool-call, token-usage, and context-utilization cases.

Required boundaries:

- no `.symphony` writes;
- no goal ledger or event-log writes;
- no result consumption;
- no provider CLI;
- no daemon start/stop;
- no child dispatch.

Merge check:

- focused adapter and read-model tests;
- `pnpm check`;
- `git diff --check`.

### PR-4 context-aware policy and command boundaries

Add policy decisions for `continue`, `checkpoint`, `compact`, `open-handoff-thread`, `wait`, `recover-drift`, and `block`. Add command boundary projection for disabled, dry-run, and confirm-required states.

Allowed areas:

- supervisor policy modules;
- read-model fixtures and tests;
- read-only command preview code.

Required boundaries:

- default command boundary is disabled;
- dry-run commands are copy-only;
- confirm-required commands require plan hash and evidence ref;
- external command families remain blocked unless a later runbook explicitly authorizes them;
- no live execution path is added.

Merge check:

- focused policy tests;
- `pnpm check`;
- `git diff --check`;
- mutation stage gate only if this PR changes contract-impacting code and PR-CI has enabled that path.

### PR-5 closeout snapshot

Record the v44.3 state after PR-1 through PR-4 merge.

Allowed area:

- `docs/plans/`

Required content:

- merged PR list and merge commits;
- final contract object list;
- API/CLI route names;
- session hook boundaries;
- CI/mutation gate state;
- commands run and commands intentionally not run;
- remaining risks and rollback path.

No release tag, no GitHub Release, no publish, no release closeout automation.

## CI and Mutation Policy

The current CI already has a mutation scope detector, but the 2026-06-10 PR #19 closeout flow showed the remaining pain: branch push verification can still spend time on `pnpm test:mutation:gate`, and docs/planning work still pays for gates that do not add signal.

v44.3 should use path-aware PR decisions and stage gates:

| Scope | Default checks | Mutation gate |
| --- | --- | --- |
| docs-only or planning-only PR | `git diff --check`; optional docs lint only if a docs linter exists | never |
| feature branch push | no full mutation; use a light path-aware check or rely on PR checks | never by default |
| code PR | focused `node --test ...`, `pnpm check`, `git diff --check` | not by default |
| frontend contract route change | focused workbench API contract tests, `pnpm check`, `git diff --check`; `pnpm workbench:build` if renderer code changes | only as stage gate |
| contract-impacting supervisor code | focused contract tests, `pnpm check`, `git diff --check` | stage gate before merge or manual dispatch |
| pre-closeout | full selected gate set named by closeout runbook | stage gate if code contracts changed since last mutation pass |
| manual workflow dispatch | operator-selected checks | allowed when `run_mutation_gate=true` |
| release closeout | explicit release runbook gates only | run before release closeout if release runbook requires it |

Contract-impacting paths for the stage gate:

- `src/symphony/goal-supervisor/**`
- `src/symphony/supervisor-runner.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `fixtures/contracts/**`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/ci.yml`

CI implementation should separate jobs instead of running one unconditional verify sequence:

1. `changes`: compute docs-only, planning-only, code, frontend, contract-impacting, and workflow-change flags.
2. `docs`: run `git diff --check` for docs/planning-only.
3. `code-focused`: install dependencies, run `pnpm check`, focused tests selected by changed paths, and `git diff --check`.
4. `build`: run `pnpm workbench:build` only when frontend renderer/build paths changed or a closeout runbook asks for it.
5. `mutation-stage`: run `pnpm test:mutation:gate` only for contract-impacting PRs, pre-closeout, manual workflow dispatch, or release-closeout preparation.
6. `real-cli`: remain opt-in through existing manual inputs or repository variables.

`pnpm mcas doctor`, audit, provider CLI, real CLI, mutation, and full release gates should not be part of docs/planning-only PR defaults. Code PRs should name their focused tests in the PR body so reviewers can decide whether a manual full run is needed.

## Stop Conditions

Stop the active PR and return to planning if a diff does any of these:

- starts the temporary daemon;
- dispatches a child thread;
- writes `.symphony` from a session hook;
- writes the goal ledger or goal event log from the app read model;
- consumes result escrow;
- executes provider CLI, real CLI, generic shell, or browser terminal commands;
- runs mutation, audit, doctor, provider CLI, real CLI, or release gates from code paths;
- adds tag, release push, publish, GitHub Release, or release closeout automation;
- makes frontend code read runner internals, ledger/event files, or JSONL directly;
- changes command boundary default away from `disabled`;
- treats stale or missing transcript state as success;
- infers approval, verification, or release readiness from branch, file, PR, prompt, or command text.

## Local Verification for PR-0

PR-0 is docs-only. Required local verification:

```sh
git diff --check
```

`pnpm check` is optional for this PR because no JavaScript, fixture, package, or workflow file changes. Do not run mutation, audit, provider CLI, real CLI, daemon, child dispatch, or release closeout commands for PR-0.
