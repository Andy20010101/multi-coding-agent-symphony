# v49 Context Session Observability and Supervisor Advisory acceptance

Date: 2026-06-12
Timezone: Asia/Shanghai
Scope: backend-owned session inventory, context advisory, thread continuation advice, and Workbench/App read-only display.

## Acceptance checks

| Claim | Evidence | Acceptance condition |
| --- | --- | --- |
| Session source inventory is backend-owned, bounded, and read-only. | `src/symphony/goal-supervisor/session-context.js` defines `sessionSourceInventory.v1`, `scanScope: bounded-provider-session-roots`, `maxFilesPerProvider`, Codex pattern `~/.codex/sessions/YYYY/MM/DD/*.jsonl`, Claude pattern `~/.claude/projects/**/*.jsonl`, `readOnly: true`, and `willMutate: false`. `tests/v44-3-goal-supervisor-session-context.test.js` checks scan caps, display paths, stable session refs, and no temp path or transcript text leakage. | The frontend receives inventory state from backend contracts only. It does not scan provider folders, read JSONL files, launch providers, write goal state, write ledgers, write event logs, write `.symphony`, dispatch children, or compact transcripts. |
| Inventory states stay visible instead of turning into UI exceptions. | `tests/v44-3-goal-supervisor-session-context.test.js` covers available/readable sources, missing roots, newest-first Codex date-folder scans, stale readable files, unreadable files, invalid JSONL degradation, and failed root stat. | Available, missing, stale, unreadable, degraded, and failed provider states remain explicit contract states with bounded reason strings. |
| Context advisory reports normalized facts without inventing token totals or ratios. | `src/symphony/goal-supervisor/session-context.js` builds `contextAdvisory.v1` from `sessionContext.v1` and optional inventory refs. `tests/v44-3-goal-supervisor-session-context.test.js` checks available advisory output, missing token totals, missing context ratio, context band boundaries, degraded reason aggregation, and blocked fields. | Missing token usage or context utilization remains `missing`. `contextBand` is `unknown` unless a numeric ratio is present. |
| Raw transcript, command stdout, prompts, secrets, raw JSONL, and local private paths stay out of advisory output. | `tests/v44-3-goal-supervisor-session-context.test.js` serializes advisory output that was given `rawTranscript`, local source refs, stdout-looking evidence, prompt text, and secret markers, then checks those strings are absent. | Contract consumers can inspect state, source refs, and degraded reasons without receiving transcript payloads or local file contents. |
| Thread continuation advice covers the expected decision values without becoming an action surface. | `src/symphony/goal-supervisor/thread-continuation-decision.js` defines `threadContinuationDecision.v1` with decisions `continue`, `compact`, `new-thread`, `wait`, `blocked`, `checkpoint`, and `recover-drift`. `tests/v44-3-goal-supervisor-session-context.test.js` covers each decision family and checks `executionAvailable: false`, `copyOnly: true`, no executable preview, and no raw source payload. | The decision is a recommendation. It does not dispatch a child, compact a transcript, create a thread, register a result, write goal state, write ledgers, write event logs, launch a provider, or run release automation. |
| The goal supervisor app read model includes the v49 contracts and keeps command execution disabled. | `tests/v44-goal-supervisor-app-read-model.test.js` checks `sessionSourceInventory.v1`, `contextAdvisory.v1`, and `threadContinuationDecision.v1` appear in the app read model and in source contract lists. The same test checks `executionAvailable: false` and `copyOnly: true`. | App consumers get the v49 read model fields through existing supervisor read-model plumbing. The app model remains read-only and non-mutating. |
| Workbench displays the v49 advisory state without local file inference or controls. | `frontend/workbench/src/v46SupervisorWorkbench.jsx` maps session source inventory, context advisory, thread continuation decision, and command boundary into display panels. `tests/workbench-api-client.test.js` projects live model fields into `supervisorDashboard`. `tests/workbench-shell.test.js` checks the panels render, unsafe live payloads are quarantined, and the source does not contain `<button>`, `<form>`, `<textarea>`, clipboard calls, process execution, `.symphony`, JSONL, `sessions/`, or `claude/projects` access. | Workbench shows inventory, context advisory, continuation advice, missing/degraded states, and disabled/copy-only command boundary as inert display text. |
| Git, tag, publish, release, provider, terminal, and shell boundaries stay closed. | PR #59 and PR #60 bodies record no dispatch, compaction, new-thread creation, provider launch, event registration, result consumption, git/tag/publish/release action, terminal action, file picker, directory picker, or frontend session file read. Workbench shell tests also check absence of action labels such as Register, Apply, and Execute in the supervisor route. | v49 closeout is not authorization for release automation, frontend JSONL reads, provider startup, goal mutation, child dispatch, shell execution, tag creation, or GitHub Release creation. |

## Source checks

`src/symphony/goal-supervisor/session-context.js` owns `sessionContext.v1`, `sessionSourceInventory.v1`, and `contextAdvisory.v1`. It returns read-only contracts, keeps missing token and context fields missing, caps provider source scans, and exposes display paths or stable refs instead of raw transcript payloads.

`src/symphony/goal-supervisor/thread-continuation-decision.js` owns `threadContinuationDecision.v1`. It combines context advisory, active child or lease state, pending result state, current phase, task state, supervisor policy, source contracts, and command boundary into advisory output. Its command boundary is always projected as `executionAvailable: false` and `copyOnly: true`.

`tests/v44-3-goal-supervisor-session-context.test.js` is the focused backend contract suite for v49. It covers inventory states, advisory normalization, raw content filtering, decision routing, durable evidence requirements, and command boundary filtering.

`tests/v44-goal-supervisor-app-read-model.test.js` checks the v49 contracts in the app read model and verifies command execution remains disabled.

`frontend/workbench/src/v46SupervisorWorkbench.jsx`, `tests/workbench-api-client.test.js`, and `tests/workbench-shell.test.js` cover the Workbench/App display path. The Workbench route renders the v49 panels, projects unsafe live payloads back to safe read-only state, and does not add browser-side file scans or execution controls.

## Validation evidence

| Command | Result |
| --- | --- |
| `node --test tests/v44-3-goal-supervisor-session-context.test.js` | Passed: 30 tests, 0 failures. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 7 tests, 0 failures. |
| `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js` | Passed: 93 tests, 0 failures. |
| `pnpm check` | Passed. Node syntax check completed across source, scripts, plugin, and test files. |
| `git diff --check` | Passed after adding the new docs as intent-to-add. |

These focused tests were rerun during PR-5 closeout because PR #57 through PR #60 touched backend session contracts, supervisor read-model projection, Workbench API projection, Workbench shell rendering, and generated Workbench assets.

The first Workbench shell/API run in the independent worktree failed before dependency setup with `ERR_MODULE_NOT_FOUND` for `react`. `pnpm install --frozen-lockfile` installed the existing lockfile dependencies without lockfile changes, and the same focused command passed on rerun.
