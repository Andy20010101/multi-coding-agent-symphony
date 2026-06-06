# Local goal supervisor v42 MVP notes

Date: 2026-06-06

Current external runner:

- Script: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- State file: `/Users/andy/.codex/local-goal-supervisor/state/v41-controlled-cli-provider-runner-backend-completion.json`
- Active goal under observation: `v41-controlled-cli-provider-runner-backend-completion`
- Current child thread: none
- Current phase: complete. The v41 goal reached `release.ready`, `main` was pushed, annotated tag `v41` was pushed, and GitHub Release `v41 Controlled CLI Provider Runner + Backend Completion` was published.
- Release peeled commit: `00387489fffa843ed5e694ede7b2c55951061323`
- Last release-manager child threads: `019e9af9-ad4f-71b1-a9f1-6675ff4b7653`, `019e9b06-482a-7143-bf60-df087fc0680c`

## Problems Observed

### Short-lived thread adapter created unreadable App threads

The runner created thread `019e9a85-0f9b-7540-9344-f98dfe5e4048` through the short-lived CLI/App adapter path. The Codex App thread reader returned `thread not loaded`, so the runner had to cancel the lease as `cancelled-thread-not-loaded`.

The same failure class reproduced with host-created reviewer thread `019e9a99-7ab0-7f12-a49a-a08b3b6128ef`: the Codex App thread tool could read the completed result, but `codex app-server --stdio` returned `thread not found`. The runner had parsed a result block, marked it invalid, attempted to send a correction prompt through app-server, and then cancelled the thread when app-server could not reload it.

Task-4 reproduced a safer variant: `doctor --probe-app` received a thread response for `019e9aa9-ab3b-7541-8066-345cfc71d62d`, but the returned thread status was `notLoaded` while the Codex App thread reader could see the active in-progress turn.

Task-4 also exposed a recovery-order bug after the App-visible worker result was manually recorded through `record-result`. The result validated as `valid: true`, but `tick` still checked the active thread through app-server first, saw `notLoaded`, and returned `waiting-active-child-not-loaded` instead of registering the already recorded result.

Fix already applied in the external runner:

- `consumeActiveThreadTick` treats app-server `notLoaded` as a wait state. It no longer sends a missing-result correction prompt or cancels the lease based on that incomplete view.
- `doctor --probe-app` reports this case as `not-loaded` instead of `readable`.
- `tick` now registers a pending valid recorded result before consulting the active thread reader. Manual recovery results are not blocked by app-server `notLoaded`.

Required v42 behavior:

- Thread creation must go through one stable App-side adapter.
- A created thread is not considered active until the runner can read it back.
- `record-thread` must reject duplicate bindings and unreadable thread ids.
- App-visible parsed results must not be discarded just because the correction path cannot reload the thread through app-server.
- App-server `notLoaded` must be a non-mutating wait state, not a missing-result condition.

### Result blocks were not reliable enough for unattended flow

Several child threads completed useful work but returned invalid or hard-to-consume output: JSON, Markdown fences, missing fields, wrong thread id, or no final result block. Task-2 worker revision needed manual recovery result files, and task-2 main verification only became reliable after a host-created thread returned a plain result block.

Task-5 showed a lighter version of the same issue: the worker completed implementation, evidence, required gates, and final root/worktree status checks, but did not naturally emit the final result block. A narrow follow-up prompt was needed that prohibited more edits/commands and asked only for the existing result contract.

The same task also showed that a result-only follow-up sent while the child turn is still active may not be visible or actionable immediately. The App thread stays `active` on the original turn, so the correction can be queued behind the stuck turn rather than interrupting it.

Required v42 behavior:

- Every child prompt must include a short result contract after the final assigned thread id is known.
- Missing or invalid result blocks should trigger one narrow correction prompt.
- Repeated invalid blocks should escalate to a recovery role, not loop forever.
- Result parsing must stay append-only and idempotent.
- If correction cannot be sent because the adapter cannot reload the thread, preserve the parsed result and surface a manual correction or recovery action.
- The runner should detect a child that has emitted final status/evidence language without a result block and send a bounded `result-only` prompt automatically.
- If the child turn is still active and cannot accept the result-only prompt, the runner should either wait within a bounded grace period or create a `manual-result-recovery` action that records the observed evidence and requires review before state registration.

### Codex App thread reads need adapter-level contracts

The host-side `codex_app.read_thread` call returned `read_thread received invalid arguments` when called with paging and output options during task-5 review monitoring. Calling the same tool with only `threadId` succeeded and returned the full latest completed turn, including the reviewer result block.

This is smaller than the app-server `notLoaded` problem, but it matters for unattended monitoring. A runner that relies on optional reader parameters can fail before it even learns whether a thread is idle, active, or completed.

Required v42 behavior:

- The App adapter should keep a tested minimal read path: `readThread(threadId)` with no optional arguments.
- Optional paging/output parameters should be feature-detected or wrapped behind adapter tests before live use.
- Monitoring should treat reader argument failures as adapter failures, not child-thread failures.
- The runner should record the reader call shape used for each consumed result so failures can be reproduced.

### Reviewer prompts were biased toward approval

The result validator accepted both `reviewer.approved` and `reviewer.needs-revision`, but the generated bound prompt showed only `reviewer.approved` for the reviewer role. That creates a false positive path: the reviewer may treat approval as the expected event instead of independently choosing a verdict.

Fix already applied in the external runner:

- Reviewer result contracts now render `<reviewer.approved or reviewer.needs-revision>`.
- Main verifier contracts now render `<main.verification-passed or main.verification-failed>`.
- Release manager contracts now render the accepted release events.
- Selftest now checks that reviewer bound contracts include `reviewer.needs-revision`.
- Bound prompts for reviewer and main verifier now include the target worker worktree and worker evidence ref, and state that the final result block must cite both.

Required v42 behavior:

- Prompt examples must not collapse multi-outcome roles into a single happy-path event.
- Result contract rendering must be covered by replay tests for every role.
- Role-specific prompts must encode validation-sensitive citations directly, not rely on the child inferring them from generic review instructions.

### Prompt truncation removed important instructions

`request --goal v41-controlled-cli-provider-runner-backend-completion` produced prompts above the 8000 character budget. The truncated prompt cut through `latestResults` and could lose the result contract. For task-3, the runner request was used only to create the lease and worktree; the actual App thread received a shorter hand-written prompt.

Task-4 showed the next limit: the shorter bound prompt kept the result contract intact, but the worker turn still hit Codex context compaction after implementation, focused tests, full gates, dependency recovery, and evidence preparation. The child continued after compaction, but this is too much work for one unattended worker phase.

Task-5 reviewer request reproduced the prompt budget issue after worker completion. The generated request prompt was 11,341 characters and was truncated to 8,000 characters, cutting through the latest task-5 worker result. The runner could still create the lease, but the App thread needed a manually written short reviewer prompt to preserve the review target, worker evidence path, and final result contract.

Task-5 main-verifier request reproduced the same issue after reviewer approval. The generated request prompt was 11,407 characters and was truncated inside the latest task-5 reviewer result. The safer path was again to create a `READY_FOR_BINDING` thread, bind it with `record-thread`, render `bound-prompt`, and send the short post-binding prompt.

Required v42 behavior:

- The runner should emit a compact task card, not the full state.
- A separate `bound-prompt` command should render the post-binding prompt with the actual thread id and result contract.
- State snapshots should be referenced by file/checkpoint id when large, not embedded.
- Long worker phases should split into `implement` and `verify/evidence` leases when the task touches frontend, backend, tests, and full gates.
- The runner should checkpoint after focused tests and before full gates so a context-compacted worker does not have to remember earlier implementation details.

### Routing after failed main verification was wrong

After `main.verification-failed`, a worker revision and reviewer approval were recorded, but the runner initially routed back to worker revision instead of main verification. This opened a wrong worker lease `019e9a82-5932-7ba2-a55b-ec4585bbb2f0`.

After task-4 reviewer approval, `doctor` correctly routed to `task-4 / main-verifier / main-verification`, while `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` reported `completedTasks: 4` and a copy-only next action for task-5 even though task-4 was only `approved` and had no `mainVerificationRef`. The external runner should keep using its stricter event-sequence route, but v42 needs an explicit status reconciliation check for this mismatch.

The same mismatch repeated after task-5 reviewer approval. Project `goal-status` reported `completedTasks: 5` and no next actions while task-5 still had `status: approved` and `mainVerificationRef: null`. External `doctor` correctly routed to `task-5 / main-verifier / main-verification`.

Fix already applied in the external runner:

- If a worker revision follows `main.verification-failed`, route to reviewer.
- If reviewer approval follows that worker revision, route back to main-verifier.

Required v42 behavior:

- Route decisions must use event sequence plus local valid results, not only the latest ledger event type.
- Every route transition should have a replay test.
- Doctor/status mismatches should be surfaced as operator notifications or recovery warnings before dispatching the next task.
- The project `goal-status` completed-task count should not count `approved` as main-verified. If that behavior is intentional for copy-only progress, it needs a separate field name so release and runner logic do not confuse review approval with main verification.

### Dirty verified worktrees were not inherited into the next task

Task-2 was verified as working-tree changes on `v41-task-2-backend-runner-execution-adapter`; `HEAD` stayed at `5495261bc260fb16fc2a83e8b3dd1c921615a42c`. Without inheritance, task-3 would start from the base commit and lose the verified task-2 adapter.

Task-4 main verifier pointed out another dirty-worktree detail: plain `git diff` omits untracked implementation and evidence files. Verification must combine tracked diff, untracked file inventory, direct file reads, and `git diff --cached` when relevant.

Fix already applied in the external runner:

- New worker worktrees inherit tracked diff and untracked files from the latest `main.verification-passed` worker target.
- Task-3 inherited seven task-2 files into `/Users/andy/.codex/worktrees/v41-task-3-runner-operation-registry-sanitized-evidence`.

Required v42 behavior:

- Workspace preparation must record `sourceTaskId`, source worktree, copied files, deleted files, and target worktree.
- Main verification should decide whether a dirty baseline can advance or must be committed/merged first.
- Review and verification prompts should provide a generated file inventory that includes tracked modifications, deletions, and untracked files instead of relying on children to infer it from `git diff`.

### App thread cwd and assigned worktree can diverge

Created App threads show the root project as `cwd`, even when the runner assigns a separate worktree. Task-2 main verification almost wrote evidence to the root checkout before correcting to the absolute assigned worktree path.

Task-3 reviewer repeated this failure mode: it initially wrote `docs/plans/v41-task-3-review-evidence-2026-06-06.md` into the root checkout because the App thread default cwd was the project root, then noticed the issue, deleted the root copy, and wrote the evidence under `/Users/andy/.codex/worktrees/v41-task-3-runner-operation-registry-sanitized-evidence`.

Task-4 repeated the same failure after context compaction. The worker wrote `docs/plans/v41-task-4-worker-evidence-2026-06-06.md` into `/Users/andy/Documents/project/multi-coding-agent-symphony` instead of `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`. A correction prompt was sent to move the evidence into the assigned worktree, remove the root copy, and cite the worktree evidence in the result block.

Task-4 reviewer reproduced the failure again even without context compaction. It wrote `docs/plans/v41-task-4-review-evidence-2026-06-06.md` into the root checkout through the App patch path, noticed the file did not appear in the assigned worktree status, deleted the root copy, and added the evidence under `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`.

Task-4 main verifier reproduced the same failure a third time. It wrote `docs/plans/v41-task-4-main-verification-evidence-2026-06-06.md` into the root checkout while its prompt explicitly named the assigned worktree and required only assigned-worktree evidence. A correction prompt was needed before result consumption.

Task-5 main verifier reproduced the failure again even through the shorter `bound-prompt` path. It wrote `docs/plans/v41-task-5-main-verification-evidence-2026-06-06.md` into the root checkout while verifying `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`. A correction prompt was sent before result registration.

Required v42 behavior:

- The adapter should either create threads directly in the assigned worktree or inject an enforceable cwd/tool wrapper.
- The runner should check root status before and after each child phase.
- A child that edits outside `runtimeWorkspaceRoots` should be blocked.
- Prompts should require absolute paths for evidence writes until cwd enforcement exists.
- The runner should reject worker results when `evidenceRef` exists only in the root checkout or outside the assigned worktree.
- The runner should reject reviewer and main-verifier results when their evidence path exists in root but not in the assigned worktree. This must run before event registration.

### Fresh worktrees may not be gate-ready

Task-3 worker hit a first-run `pnpm test` failure because the assigned worktree did not have dependencies available (`fast-check`, `react`). The worker ran `pnpm install --offline --frozen-lockfile` from the local pnpm store and reran the gate successfully.

The same preflight gap reproduced at task-4 dispatch. Doctor reported `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding` with `nodeModules: false`, `pnpmVirtualStore: false`, and `status: missing-node-modules` after the active worker lease was already created.

Required v42 behavior:

- Workspace preparation should check whether dependency links are present before dispatch.
- If dependency setup is needed, the runner should run or request a deterministic setup step before the child starts heavy gates.
- Evidence should distinguish environment setup failures from implementation test failures.

Fix already applied in the external runner:

- `resolveRequestWorkspace` now records `dependencySetup` for assigned worktrees.
- If `node_modules` is missing and `package.json` exists, the runner runs `pnpm install --offline --frozen-lockfile` before creating the request.
- If dependency setup fails, `request` records a `workspace-dependency-setup-failed` blocker instead of dispatching a child thread into a known-bad worktree.

### Daemon and heartbeat behavior is not stable enough

Foreground `launch-daemon.zsh` works, but detached/nohup launches have exited without useful logs. The existing automation can wake the runner, but it is not a full state machine and does not reliably surface operator-required actions.

Additional issue observed:

- A previous daemon wrote `daemon-start` without a matching `daemon-stop`. A naive health check treated that as running, even though no tick had been recorded for several minutes.
- During task-5, the active worker thread kept running in the Codex App while `doctor --probe-app` reported the runner daemon as `stale`. This did not block the worker, but it means result consumption, next-role dispatch, and operator notifications still depend on an external human/supervisor poll when the daemon exits.
- After task-5 main verification registration, `doctor` reported daemon `status: active` because a recent manual `tick` existed, while the pid file still pointed to a non-running process and the health file was null. A manual supervisor tick should not make the daemon look healthy.

Fix already applied in the external runner:

- `doctor --goal <id>` reports daemon status as `active`, `stale`, or `stopped` based on the latest start/stop/tick log and the daemon interval.
- Doctor summarizes daemon/tick events instead of embedding full tick payloads.
- Daemon runs now write `/Users/andy/.codex/local-goal-supervisor/state/<goal>.daemon.pid` and `/Users/andy/.codex/local-goal-supervisor/state/<goal>.daemon.health.json`.
- `doctor` now combines log recency, health timestamps, and pid liveness before reporting `active`, `stale`, or `stopped`.
- `heartbeat-prompt` now tells the monitor to check both pid and health file before restarting the daemon.

Required v42 behavior:

- A persistent runner process needs a health file, pid validation, last tick timestamp, and visible operator notifications. The external runner now has the first three pieces; operator notification coverage still needs replay testing.
- Heartbeat should only wake a stopped runner when there is no active lease.
- Approval-required and blocked states must be reported to the user with the exact thread or command to inspect.
- A stale daemon with an active child must not start duplicate work, but it should leave a clear `needs-supervisor-poll` or `needs-daemon-restart` notification so the App user can see why the system is waiting.
- Daemon health should be separated from runner activity. `doctor` should distinguish `daemon-active`, `manual-tick-recent`, and `daemon-stopped-with-recent-progress`.

### Child shell behavior can produce false negatives

Task-3 main verification hit a local zsh issue when a helper command assigned to the readonly variable `status`. The child recovered and reran the check with a neutral variable name, but this shows that free-form shell snippets can produce noisy failures unrelated to the implementation.

Task-4 reviewer also ran an extra `goal next` read in the assigned worktree while reconciling state. It was non-mutating, but the output showed no active runbook in that isolated state and could confuse the review if treated as a required gate. The required `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` gate still resolved the checked-in runbook as expected.

Required v42 behavior:

- Gate commands should be generated from fixed command templates where possible.
- Child prompts should distinguish required gates from optional diagnostic reads and should not invite extra state commands unless the role explicitly needs them.
- Evidence should distinguish command typo or shell portability failures from product failures.
- Recovery prompts should ask for a rerun only when the failing command is non-destructive and the prior output shows no repository mutation.

### Single writer rule needed process locking

The external runner is intended to be the only state writer, but manual recovery, daemon restarts, and App thread actions can overlap unless the operator is careful.

Fix already applied in the external runner:

- Added a per-goal directory lock under `/Users/andy/.codex/local-goal-supervisor/locks`.
- Mutating commands `init`, `context`, `heartbeat-prompt`, `tick`, `request`, `record-thread`, `record-result`, `complete-thread`, and `checkpoint` now run under the lock.
- Daemon start/stop log writes and each daemon tick acquire the lock only for the active operation, so the daemon does not hold the lock for its full lifetime.
- Selftest now checks lock acquire/release behavior.

Required v42 behavior:

- State writes need a process lock.
- `tick`, `request`, `record-thread`, `record-result`, `complete-thread`, and event registration must be atomic.
- Manual recovery should be an explicit command with an audit record.

### Release closeout must require explicit operator intent

After task-5 main verification passed, all five v41 tasks were main-verified. `doctor --goal v41-controlled-cli-provider-runner-backend-completion --probe-app` then routed to `release / release-manager / release-gate` and blocked with `Release closeout requires --allow-closeout`.

This is the right default for the temporary system. A supervisor can run workers, reviewers, and main verifiers, but tag/release closeout changes repository state and should not happen because a daemon or monitor is awake.

Required v42 behavior:

- Release closeout needs an explicit operator command or a runbook flag that the operator has already approved.
- The runner should show the exact blocked reason and the next allowed command in `doctor` and operator notifications.
- A stale or restarted daemon must not auto-enter closeout.
- Release-manager prompts should be generated only after the closeout approval is recorded in runner state.

### Long-running controlled provider checks need progress records

Task-5 used the intended controlled runner path for active providers: the child exercised provider checks through backend runner functions and operation records rather than raw provider CLIs. The real-provider check can legitimately wait for backend timeouts or provider availability checks, so an unattended system needs a way to show that this is expected work instead of a stuck thread.

In the live task-5 worker run, the controlled backend runner attempted both active providers and produced sanitized failure evidence: `claude-code-cli` stalled and `codex-cli` timed out. The child reported this as controlled operation output, not as direct raw CLI use. This is acceptable task evidence for v41, but it also shows that v42 needs first-class provider operation progress and timeout visibility.

Required v42 behavior:

- Provider-run phases should write runner-owned progress events before and after each controlled provider attempt.
- The runner should expose the current provider id, operation id, started-at time, timeout policy, and latest sanitized status in `doctor`.
- A long provider attempt should have a deterministic timeout and recovery note, not an open-ended child-thread wait.
- Worker evidence should cite operation ids and sanitized artifact refs generated by the backend runner, not prose-only claims.

## Current Stabilization Already Done

- Added routing fixes for worker revision after failed main verification.
- Added strict result block instructions to bound child prompts and correction prompts.
- Switched task-2 main verification to host-created App thread plus runner binding.
- Proved `tick` can consume the App thread result and append `main.verification-passed`.
- Added dirty verified baseline inheritance before creating task-3.
- Confirmed root checkout stayed clean while task-3 runs in the assigned worktree.
- Added runner selftests covering routing and result prompt basics.
- Added `bound-prompt --request <id> --thread <id>` to render a post-binding prompt with the actual thread id and result block. The current task-3 prompt is 5198 characters and includes `RESULT_BLOCK_START`.
- Recorded the task-3 worktree dependency setup issue: initial full test run failed because dependencies were absent, then passed after `pnpm install --offline --frozen-lockfile`.
- Fixed bound result contracts so reviewer, main verifier, and release manager prompts include all valid terminal events, not only the success path.
- Added per-goal process locking around mutating runner commands and daemon ticks.
- Added `doctor --goal <id> [--probe-app]` to report active lease, root/worktree status, dependency readiness, lock state, daemon freshness, recent results, conflicts, and operator notifications.
- Adjusted daemon health so old `daemon-start` records without recent ticks are reported as stale.
- Recorded task-3 reviewer adapter failure and recovered by saving a corrected result block, then registering `reviewer.approved` through the external runner.
- Added role-specific bound prompt lines so future reviewer/main-verifier result blocks cite worker worktree and worker evidence refs.
- Task-3 main verifier completed through the bound prompt without manual correction, wrote evidence to `/Users/andy/.codex/worktrees/v41-task-3-runner-operation-registry-sanitized-evidence/docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`, and `tick` registered `main.verification-passed` as `evt_f980b50ff33a83d5`.
- Doctor now reports no active lease and routes the next action to `task-4 / worker / implement`.
- Task-4 request created `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`, inherited task-3 verified dirty baseline, bound fresh App thread `019e9aa9-ab3b-7541-8066-345cfc71d62d`, and used the shorter post-binding prompt path.
- Added external runner dependency preflight and fail-fast blocker handling after the task-4 worktree reproduced the missing `node_modules` condition.
- Added daemon pid and health file writing to the external runner; `node --check` and `selftest` passed after the change.
- Added `notLoaded` protection for active child consumption after task-4 showed a split-brain App reader/app-server state; `node --check`, `selftest`, and one live `tick` passed after the change. The live tick returned `waiting-active-child-not-loaded` and did not send correction, cancel the lease, register an event, or create a new thread.
- Task-4 worker triggered Codex context compaction during the final evidence phase after passing focused tests, dependency recovery, full test/build gates, `git diff --check`, and `goal-status`. The worker continued, but v42 should split long worker phases or checkpoint before full gates.
- Task-4 worker wrote the evidence file into the root checkout after compaction. A correction prompt was sent to move the evidence to the assigned worktree and restore root cleanliness.
- Task-4 worker result was recovered through `record-result`; the runner then needed a tick-order fix because app-server `notLoaded` was taking precedence over the pending valid recorded result.
- Task-4 reviewer used the stable host-created App thread path and bounded prompt, but still ran one extra non-required diagnostic state command. v42 should generate fixed command templates per role to reduce this drift.
- Task-4 reviewer also wrote evidence into the root checkout first and self-corrected to the assigned worktree. This shows the cwd issue is in the App/tool adapter layer, not only in child prompt wording.
- After task-4 reviewer approval, runner `doctor` and project `goal-status` disagreed on whether task-4 still needed main verification. The runner continued with main verification as the stricter route.
- Task-4 main verifier identified that `git diff` alone misses untracked files in these dirty worktree phases. v42 should hand each child a runner-generated tracked/untracked file inventory.
- Task-4 main verifier also wrote evidence into the root checkout and needed a correction prompt. This should be treated as a hard blocker for unattended stability until cwd enforcement or runner-owned evidence writes exist.
- Task-5 request proved the dependency preflight path works for new inherited worktrees: the runner created `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`, inherited the task-4 verified dirty baseline, ran `pnpm install --offline --frozen-lockfile`, and confirmed `node_modules` plus the pnpm virtual store before dispatching the worker.
- Task-5 reviewer completed with a valid result block in the first final answer, wrote evidence directly to `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence/docs/plans/v41-task-5-review-evidence-2026-06-06.md`, and the runner registered `reviewer.approved` as `evt_269869799712da66`.
- Task-5 reviewer monitoring showed that `codex_app.read_thread` succeeds on the minimal `threadId` call but failed with paging/output options. The v42 adapter should own that call shape instead of letting supervisors discover it live.
- Task-5 main-verifier dispatch used the stable `READY_FOR_BINDING` plus `record-thread` plus `bound-prompt` path because the raw request prompt was truncated again.
- Task-5 main-verifier still wrote evidence into the root checkout despite the bound prompt and assigned worktree path. A correction prompt was required before the result can be registered.
- Task-5 main-verifier passed after correction. The runner registered `main.verification-passed` as `evt_4dbaef9251ac8f51`, and `goal-status` now reports task-1 through task-5 as `main-verified`.
- After all tasks were main-verified, `doctor` correctly blocked release closeout until `--allow-closeout` is supplied.
- Final doctor output after task-5 showed no active lease, release closeout blocked, and root clean except this notes file. It also showed the daemon as `active` from recent manual tick activity while the pid was not running; v42 should separate daemon health from recent runner progress.

## v42 Base MVP

The v42 MVP should be a small productized version of the external runner, not a prompt-only supervisor.

Minimum components:

- State store: goal id, active lease, requests, threads, results, checkpoints, workspace inheritance, operator notifications.
- Single writer: file lock around all state changes and goal-event registration.
- App thread adapter: host-created thread, `record-thread`, readback validation, post-binding prompt rendering, result consumption.
- Workspace manager: branch/worktree creation, verified dirty baseline inheritance, root-clean guard, write-scope checks.
- Result protocol: plain result block schema, parser, correction prompt, repeated-invalid escalation.
- Route engine: deterministic transition table with replay tests for worker, reviewer, main-verifier, revision, and release-manager paths.
- Heartbeat: health file, stale active lease detection, no duplicate active thread creation, operator notification for approval or blocked states.
- Progress monitor: active child age, latest child message timestamp, latest runner tick, current provider operation id, and timeout/retry policy.
- Model routing: medium controller/reconcile path, high worker/reviewer/main-verifier path, xhigh recovery/release path.

Acceptance for the MVP:

- Run one full task lifecycle from worker to reviewer to main-verifier without manual prompt rewriting.
- Recover from one missing or malformed result block by sending a correction prompt.
- Reject a thread that cannot be read back by the App.
- Preserve a verified dirty baseline into the next task worktree.
- Keep the root checkout clean while child work happens in assigned worktrees.
- Append exactly one goal event per consumed valid result.
- Produce an operator-visible message when approval is required or a thread is blocked.

## Immediate Next Changes

1. Add replay tests for the v41 incidents listed above.
2. Replace daemon launch experiments with one documented launch path and one health file.
3. Add replay tests for daemon pid/health validation; the runtime check is now implemented.
4. Use `bound-prompt` for the next reviewer/main-verifier dispatch instead of hand-written prompts.
5. Add an explicit recovery command for manual state corrections.
6. Add command-template metadata for gate reruns so shell typos do not look like task failures.
7. Fix or split `goal-status` summary fields so review-approved tasks are not counted as fully completed before main verification.
8. Add adapter tests for minimal `read_thread` and reject unsupported optional read parameters before live monitoring.
9. Add a pre-registration evidence-location gate for every role, with automatic rejection when the evidence exists only in the root checkout.
10. Add closeout authorization state and visible operator notification for release-manager dispatch.
11. Split daemon health reporting from manual tick freshness so `doctor` cannot report a dead daemon as active.
