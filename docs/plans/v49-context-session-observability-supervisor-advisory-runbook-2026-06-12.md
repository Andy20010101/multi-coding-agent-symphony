# v49 Context Session Observability and Supervisor Advisory Runbook

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal id draft: `v49-context-session-observability-supervisor-advisory`
Branch draft: `codex/v49-context-session-observability-runbook`
Baseline checked for planning: `main`, `origin/main`, and `v48` at `e07f7bd2c3d80e53cdfff3a65f5cccdf9fa16cad`
GitHub Release: `v48: Project Launcher and Recent Projects`

## Reconcile

| Check | Result |
| --- | --- |
| `main` and `origin/main` | Synchronized before PR-0 planning; ahead/behind `0 0`. |
| `origin/main`, `main`, and `v48` | `e07f7bd2c3d80e53cdfff3a65f5cccdf9fa16cad`. |
| Open PRs | None reported before this PR-0 work. |
| GitHub Release `v48` | Exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v48`; title `v48: Project Launcher and Recent Projects`; not draft; not prerelease; no assets. |

Files read before writing this runbook:

- `docs/plans/v48-project-launcher-recent-projects-runbook-2026-06-11.md`
- `docs/plans/v48-project-launcher-recent-projects-closeout-snapshot-2026-06-11.md`
- `docs/qa/v48-project-launcher-recent-projects-acceptance.md`
- `docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md`
- `docs/plans/v44-3-task-3-review-evidence-2026-06-10.md`
- `tests/v44-3-goal-supervisor-session-context.test.js`
- `src/symphony/goal-supervisor/session-context.js`
- `src/symphony/goal-supervisor/policy.js`

No repository `AGENTS.md` file was present in this worktree at planning time. The thread-provided report writing rules apply to this document.

## Objective

v48 made the Workbench desktop route project-aware. v49 should make the next supervisor surface context-aware without turning session observability into an execution path.

v49 should expose read-only session source inventory, normalized context advisory inputs, and a supervisor continuation recommendation that can be displayed by Workbench/App. It must not dispatch children, compact transcripts, create new threads, write goal state, write ledgers, write event logs, start providers, or let the frontend read local session files.

The first user-visible result should be an advisory display: what session evidence exists, whether context appears healthy, and what the supervisor should consider next. Any command boundary remains disabled or copy-only.

## Existing Baseline

v44.3 already added `sessionContext.v1` and policy code that v49 should reuse instead of replacing.

Current `sessionContext.v1` behavior in `src/symphony/goal-supervisor/session-context.js`:

- reads Codex JSONL from `~/.codex/sessions` by default;
- reads Claude JSONL from `~/.claude/projects` by default;
- supports explicit `codexFiles` and `claudeFiles` inputs for tests and controlled callers;
- returns `readOnly: true` and `willMutate: false`;
- normalizes transcript availability, exchange count, latest tool call, latest turn state, token usage, context utilization, stale state, missing state, result-block evidence, and drift markers;
- marks unknown token or utilization fields as `missing`;
- does not expose raw transcript text in the normalized context.

Current policy behavior in `src/symphony/goal-supervisor/policy.js`:

- defaults command boundary to `disabled`;
- returns advisory action ids such as `continue`, `checkpoint`, `compact`, `open-handoff-thread`, `wait`, `recover-drift`, and `block`;
- keeps `executionAvailable: false` and copy-only previews;
- blocks provider CLI, real CLI, generic shell, daemon launch, child dispatch, goal ledger write, event-log write, mutation gate, audit, tag, push release, publish release, GitHub Release, and release closeout command families.

v49 should tighten these objects for app display, add source inventory, and split continuation advice from any command execution.

## Boundary Decision

Session observability is a read model. Supervisor continuation is advice. Neither is a command channel.

Allowed for v49:

- Read bounded Codex and Claude session metadata through backend-owned adapters.
- List provider session source availability through a backend inventory contract.
- Normalize token usage, context utilization, exchange count, latest tool call, transcript availability, and result-block evidence into advisory inputs.
- Combine advisory inputs with active child, pending result, current phase, task state, and supervisor policy.
- Display advisory state in Workbench/App as inert text, status rows, tables, or copy-only previews.
- Preserve missing, stale, unreadable, degraded, and unavailable states as visible states.

Forbidden for v49:

- Frontend direct reads of `~/.codex`, `~/.claude`, `.symphony`, goal ledgers, event logs, runner internals, provider transcripts, or JSONL files.
- Raw transcript exposure.
- Provider CLI launch.
- Daemon start or stop.
- Child dispatch.
- Result escrow consumption.
- Goal event registration.
- Goal state, ledger, event-log, or `.symphony` writes.
- Transcript compaction.
- New thread creation.
- Git writes, tags, pushes, publish, or GitHub Release creation.
- Runtime shell runner, browser terminal, generic command executor, primary CTA, or executable command button.

If a later version needs an action, it needs a separate runbook that names the action, payload, confirmation fields, tests, rollback path, and audit evidence. This v49 plan does not authorize execution.

## Contract Shape

### `sessionContext.v1`

Purpose: provide normalized session context for one active thread or supervised work item.

v49 should reuse the existing contract name and extend only where the app needs bounded metadata. It should not introduce a competing `sessionContext.v2` unless a later implementation finds a breaking shape change that cannot be avoided.

Required fields:

- `contractName`: `sessionContext.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `willMutate`: `false`
- `threadId` when known
- `sessionSourceSummaries[]`
- `transcriptAvailability`: `readable`, `missing`, `stale`, `unreadable`, or `degraded`
- `exchangeCount`
- `latestTurnState`
- `latestToolCall`
- `tokenUsage`: status plus input, output, and total token values when present
- `contextUtilization`: status plus used tokens, max tokens, and ratio when present
- `staleTranscriptState`
- `missingTranscriptState`
- `resultBlockEvidence`
- `driftMarkers[]`
- `boundaries`

Source rules:

- Codex JSONL source is `~/.codex/sessions/YYYY/MM/DD/*.jsonl`.
- Claude JSONL source is `~/.claude/projects/**/*.jsonl`.
- Reads are read-only and bounded.
- Raw transcript text stays outside the contract.
- Result-block evidence may state whether bounded evidence is present, but not include the raw result block.
- Unknown provider fields stay `missing`; the adapter must not infer numbers or status from nearby text.

Write and execution boundaries:

- no `.symphony` writes;
- no goal state writes;
- no ledger writes;
- no event-log writes;
- no result escrow consumption;
- no provider launch;
- no daemon control;
- no child dispatch.

### `sessionSourceInventory.v1`

Purpose: list available session sources before the app asks for detailed context.

The implementation may use an equivalent name if it is already established in code review, but the contract must serve this inventory role and must remain backend-owned.

Required fields:

- `contractName`: `sessionSourceInventory.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `willMutate`: `false`
- `scanScope`: explicit value such as `bounded-provider-session-roots`
- `maxFilesPerProvider`
- `providers[]`
- `summary`
- `boundaries`

Provider fields:

- `provider`: `codex` or `claude`
- `rootDisplayPath`: display path only, not a frontend-readable path token
- `pattern`: `~/.codex/sessions/YYYY/MM/DD/*.jsonl` or `~/.claude/projects/**/*.jsonl`
- `state`: `available`, `missing`, `stale`, `readable`, `unreadable`, `degraded`, or `failed`
- `readableFileCount`
- `candidateFileCount`
- `latestModifiedAt`
- `latestSessionRef`
- `degradedReasons[]`
- `sourceSummary`

Inventory boundaries:

- The frontend must not scan folders or read files directly.
- File paths shown to the app are display values or stable source refs only.
- The backend must cap scan roots and file counts.
- Missing home directories, permission errors, parse failures, and stale files become inventory states, not thrown UI failures.
- Inventory does not select a provider, launch a provider, repair files, compact transcripts, or write state.

### `contextAdvisory.v1`

Purpose: turn normalized session context into inputs a supervisor policy can reason over and a reviewer can inspect.

Required fields:

- `contractName`: `contextAdvisory.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `sessionContextRef`
- `inventoryRef`
- `transcriptAvailability`
- `exchangeCount`
- `latestToolCall`
- `latestTurnState`
- `tokenUsage`
- `contextUtilization`
- `contextBand`: `unknown`, `low`, `moderate`, `high`, `near-limit`, or `over-limit`
- `resultBlockEvidence`
- `staleTranscriptState`
- `missingTranscriptState`
- `degradedReasons[]`
- `blockedFields[]`
- `policyInputs`

Policy inputs should include only normalized facts:

- active thread id when known;
- provider source summaries;
- token totals and ratio when present;
- latest tool call name, status, and timestamp when present;
- latest turn status when present;
- transcript availability;
- result-block evidence status;
- stale and missing reasons.

The contract must not expose transcript messages, command stdout, prompt text, provider raw JSON, secrets, or local file contents. It should not claim a context ratio when max tokens are missing.

### `threadContinuationDecision.v1`

Purpose: combine context advisory with supervisor state and return a next-step recommendation.

Inputs:

- active child or active lease state;
- pending result state;
- current phase;
- task state;
- supervisor projection;
- command boundary;
- `contextAdvisory.v1`;
- existing supervisor policy rules.

Required fields:

- `contractName`: `threadContinuationDecision.v1`
- `contractVersion`
- `generatedAt`
- `readOnly`: `true`
- `willMutate`: `false`
- `decision`: `continue`, `compact`, `new-thread`, `wait`, `blocked`, `checkpoint`, or `recover-drift`
- `reason`
- `confidence`: `known`, `partial`, or `unknown`
- `targetRole`
- `taskId`
- `threadId`
- `checkpointRef`
- `waitPolicy`
- `blockedFields[]`
- `mismatchList[]`
- `requiredEvidence[]`
- `sourceContracts[]`
- `commandBoundary`

Decision rules:

- `continue`: active child exists, transcript is recent enough, no pending result blocks progress, context is not near limit, and policy state agrees.
- `compact`: context is near limit and a durable checkpoint or result-block evidence ref exists.
- `new-thread`: role or phase needs a handoff, the current transcript is stale, or the next phase should not continue in the same thread. This is advice only.
- `wait`: active child or latest tool call is still running and the latest session signal is recent.
- `blocked`: transcript is missing without another source of truth, command boundary needs confirmation, required checkpoint is missing, pending result cannot be validated, or state is unsafe.
- `checkpoint`: result evidence is pending registration or phase completion needs a durable record.
- `recover-drift`: daemon, supervisor projection, PR state, or session context disagree.

Execution boundaries:

- no dispatch;
- no compaction;
- no new thread creation;
- no wait timer registration;
- no goal state write;
- no ledger write;
- no event-log write;
- no provider launch;
- no shell execution.

The field name `new-thread` is advisory text. It must not be wired to a create-thread call in v49.

### Workbench/App Display Contract

Purpose: show v49 advisory state without adding an action surface.

Allowed display:

- session source inventory summary;
- context advisory rows;
- thread continuation decision;
- stale, missing, degraded, unreadable, and blocked reasons;
- source contract names and generated timestamps;
- disabled command boundary;
- copy-only text for a handoff note or reviewer prompt if a later PR scopes that display.

Forbidden display:

- primary CTA;
- Run, Continue, Compact, New thread, Dispatch, Launch, Execute, Approve, Register, Consume, Push, Tag, Publish, Release, Open terminal, Open folder, Scan disk, or Start provider buttons;
- forms, file pickers, directory pickers, editable command textareas, or browser terminal surfaces;
- direct links or controls that make frontend read local session files.

If Workbench/App renders a command boundary, it must show `executionAvailable: false` and either `disabled` or `copyOnly` state.

## PR Breakdown

### PR-0 Runbook and contract direction

Scope:

- Add this v49 runbook.
- Record baseline, boundaries, contract shape, PR split, acceptance, validation, rollback, and review checklist.

Forbidden scope:

- Runtime code.
- API routes.
- UI code.
- Test logic.
- Generated Workbench assets.
- Provider/session scanning changes.
- Git tag, merge, release, or GitHub Release work.

Required validation:

```text
git diff --check
```

### PR-1 Session source inventory

Scope:

- Add `sessionSourceInventory.v1` or an equivalent backend-owned inventory contract.
- Inventory Codex and Claude source availability using bounded roots and max file counts.
- Add fixtures for available, missing, stale, readable, unreadable, degraded, and failed provider states.
- Add focused tests for scan caps, unreadable files, missing roots, stale files, source summaries, and no frontend file access.

Forbidden scope:

- Raw transcript exposure.
- Frontend filesystem scanning.
- Provider launch.
- Goal state, ledger, event-log, or `.symphony` writes.
- Thread continuation decisions.
- Workbench action controls.

Required validation:

```text
node --test tests/v44-3-goal-supervisor-session-context.test.js
pnpm check
git diff --check
```

Add or adjust focused inventory tests in the PR and name the exact command in the PR body.

### PR-2 Context utilization projection

Scope:

- Extend `sessionContext.v1` only where needed for bounded context display.
- Add `contextAdvisory.v1`.
- Normalize token usage, context utilization, exchange count, latest tool call, transcript availability, stale/missing state, and result-block evidence into policy inputs.
- Keep unknown token and utilization fields as `missing`.

Forbidden scope:

- Changing provider JSONL reads into a write path.
- Inferring token totals or context ratio when source fields are missing.
- Exposing raw transcript text, command stdout, raw JSONL, prompts, or secrets.
- Supervisor continuation decision UI.
- Execution controls.

Required validation:

```text
node --test tests/v44-3-goal-supervisor-session-context.test.js
pnpm check
git diff --check
```

Run additional focused tests if the PR adds a new advisory test file.

### PR-3 Supervisor advisory

Scope:

- Add `threadContinuationDecision.v1` or an equivalent advisory projection.
- Combine active child, pending result, current phase, task state, supervisor policy, command boundary, and `contextAdvisory.v1`.
- Cover continue, compact, new-thread, wait, blocked, checkpoint, and recover-drift decisions in fixtures and tests.
- Preserve the existing disabled/copy-only command boundary.

Forbidden scope:

- Dispatch.
- Transcript compaction.
- New thread creation.
- Goal event registration.
- Result consumption.
- Provider launch.
- Daemon start or stop.
- Git, tag, publish, release, or GitHub Release work.

Required validation:

```text
node --test tests/v44-3-goal-supervisor-session-context.test.js
node --test tests/v44-goal-supervisor-app-read-model.test.js
pnpm check
git diff --check
```

Run any new focused policy/advisory tests added in the PR.

### PR-4 Workbench/App read-only display

Scope:

- Display session source inventory, context advisory, and thread continuation decision in Workbench/App.
- Keep all controls inert, disabled, or copy-only.
- Show missing, stale, unreadable, degraded, blocked, and unknown states.
- Keep frontend reads behind backend contracts.

Forbidden scope:

- Primary CTA.
- Execution buttons.
- File or directory picker.
- Frontend JSONL reads.
- Provider launch.
- Dispatch, compact, new-thread, register, consume, push, tag, publish, release, or terminal actions.
- Generated Workbench assets unless source changes require a build.

Required validation:

```text
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm check
git diff --check
```

Run `pnpm workbench:build` if Workbench source changes require generated asset refresh. Capture desktop and narrow viewport screenshots if layout changes are substantial.

### PR-5 Closeout and tag prep

Scope:

- Add v49 acceptance evidence.
- Add closeout snapshot.
- Record merged PR list, merge commits, validation commands, generated asset changes if any, residual risks, rollback path, and tag prep notes.

Forbidden scope:

- Runtime feature expansion.
- New action controls.
- Git tag creation.
- GitHub Release creation.
- Publish or release automation.

Required validation:

```text
pnpm check
git diff --check
```

Run focused tests from PR-1 through PR-4 before tag prep, or record why a focused command is not needed for docs-only closeout text.

## Acceptance

v49 is accepted when these checks hold:

- `sessionContext.v1` remains read-only and does not expose raw transcript text.
- Codex session sources are read from bounded `~/.codex/sessions/YYYY/MM/DD/*.jsonl` paths by backend code.
- Claude session sources are read from bounded `~/.claude/projects/**/*.jsonl` paths by backend code.
- Source inventory reports available, missing, stale, readable, unreadable, degraded, and failed states without frontend file access.
- Context advisory shows token usage, context utilization, exchange count, latest tool call, transcript availability, and result-block evidence when available.
- Missing token usage or context utilization remains `missing`; the app does not invent totals or ratios.
- Thread continuation decision can return continue, compact, new-thread, wait, blocked, checkpoint, and recover-drift as advice.
- Advice considers active child, pending result, current phase, task state, supervisor policy, and context advisory inputs.
- Workbench/App displays advisory state only.
- Command boundary remains disabled or copy-only.
- No UI path dispatches children, compacts transcripts, creates threads, writes goal state, writes ledgers, writes event logs, starts providers, opens terminals, scans folders, writes git state, tags, publishes, or creates releases.

## Validation Plan

PR-0 validation:

```text
git diff --check
```

Do not run mutation, audit, provider CLI, real CLI, daemon, child dispatch, release, tag, or publish commands for PR-0.

Implementation PR validation should be focused on changed files:

- session adapter and inventory changes: session-context and inventory tests, `pnpm check`, `git diff --check`;
- policy/advisory changes: focused policy/read-model tests, `pnpm check`, `git diff --check`;
- Workbench display changes: Workbench shell/API tests, `pnpm check`, `git diff --check`, and `pnpm workbench:build` when generated assets are required.

Broader `pnpm test` should be selected before closeout if PR-1 through PR-4 change shared contract helpers, route allowlists, app read-model projection, generated Workbench assets, or supervisor policy behavior used outside the new v49 surface.

## Rollback

If PR-0 is wrong, revert this runbook and replace it before implementation starts.

If PR-1 inventory reports misleading source state, revert the inventory contract and fixtures. The app should continue without v49 inventory rather than scanning from the frontend.

If PR-2 context advisory exposes raw transcript content, invents token numbers, or treats missing source fields as success, revert the advisory projection and keep the existing `sessionContext.v1` baseline.

If PR-3 advisory crosses into execution, revert the decision projection and policy changes. Keep context advisory read-only.

If PR-4 makes advice look actionable or adds execution controls, revert the UI change and keep backend contracts available only through tests or read-only API output.

If generated Workbench assets drift, rerun `pnpm workbench:build` from the intended source state and commit only the generated asset refresh tied to that source diff.

If closeout text overstates shipped behavior, revert PR-5 documentation and replace it before tag prep.

## Review Checklist

- The runbook keeps session observability separate from provider execution.
- The runbook keeps supervisor advice separate from dispatch, compaction, new-thread creation, and state writes.
- `sessionContext.v1` reuse is explicit and compatible with the existing v44.3 tests.
- Codex and Claude JSONL source patterns are named exactly.
- Source inventory is backend-owned, bounded, and read-only.
- Frontend direct file access is forbidden.
- Raw transcript exposure is forbidden.
- Context advisory fields are normalized facts, not inferred narrative.
- Thread continuation decisions are advisory values only.
- Workbench/App display has no primary CTA or execution button.
- PR split leaves runtime, API, UI, tests, and generated assets out of PR-0.
- PR-0 validation is limited to `git diff --check`.
- No tag, merge, release, or GitHub Release action is requested by this PR.

## Cost and Model Policy

Do not use Claude Code or Fable for v49 by default.

Codex and DeepSeek are acceptable for follow-up implementation PRs. Each implementation PR should record provider, model, usage if returned, and cost if returned. If the tool surface does not return usage or cost, record that directly.

This PR-0 planning worker used Codex. Model usage and cost were not returned by the local tool surface.
