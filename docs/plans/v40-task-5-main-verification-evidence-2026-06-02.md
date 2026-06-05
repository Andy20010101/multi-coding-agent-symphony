# v40 task-5 main verification evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-5`
Branch: `v40-task-5-native-ux-handoff-generator`
Worktree: `/Users/andy/.codex/worktrees/v40-task-5-native-ux-handoff-generator`
Worker evidence reviewed: `docs/plans/v40-task-5-worker-evidence-2026-06-02.md`
Reviewer evidence reviewed: `docs/plans/v40-task-5-review-evidence-2026-06-02.md`
Reviewer verdict: `APPROVED`
Verifier thread id: `019e97e4-ca4b-7983-a23c-bb45a98af6d5`

## Verification result

Main verification passed for the assigned task-5 worktree.

The implementation adds a native UX handoff draft to the existing closeout next-version handoff projection. The draft generates v41 context for menu bar, notch, native distribution, UX polish, and starter work packages from closeout, runbook, release baseline, event, evidence, and run context. The Workbench panel renders the new scope, distribution channels, starter packages, and safety fields as display-only state.

## Evidence checked

- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`
- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v40-task-5-worker-evidence-2026-06-02.md`
- `docs/plans/v40-task-5-review-evidence-2026-06-02.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-ltXnGC0K.js`

## Commands run

`pwd && find ...`

Result: passed enough to reconcile the assigned worktree and locate the runbook/evidence files. `rg` was unavailable in this environment, so file discovery used `find`.

`git status --short --branch && git rev-parse HEAD && git branch --show-current`

Result: passed, exit code 0. Branch was `v40-task-5-native-ux-handoff-generator`; head commit was `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`. Task-5 implementation, rebuilt Workbench static assets, worker evidence, and reviewer evidence were present as worktree changes.

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1041
suites 163
pass 1041
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6328.489792
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-ltXnGC0K.js   1,305.54 kB
built in 69ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors were reported.

`pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json` from `/Users/andy/.codex/worktrees/v40-task-5-native-ux-handoff-generator`

Result: failed, exit code 64.

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

The assigned task worktree does not contain the ignored managed goal state.

`pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json` from `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: passed, exit code 0. The authoritative managed state reported task-5 as `approved`, with `reviewVerdict: APPROVED`, `workerEvidenceRef: docs/plans/v40-task-5-worker-evidence-2026-06-02.md`, `reviewEvidenceRef: docs/plans/v40-task-5-review-evidence-2026-06-02.md`, and `mainVerificationRef: null` before this evidence file was written. `releaseReady` remained `false`.

## Acceptance check

- The App/Workbench user path is visible in Closeout Gaps through the `next-version handoff draft` native UX section.
- The handoff is anchored to closeout, runbook, release baseline, event, evidence, and run context.
- Existing goal/event/run/evidence contracts remain the source for state and anchors.
- UI state is rendered from backend projection fields, not branch names, filenames, prompt text, task titles, commit messages, or frontend completion heuristics.
- The implementation does not add shell execution, browser terminal, arbitrary command palette, arbitrary model invocation, arbitrary local file reading, merge, push, tag, publish, native build, installer creation, signing, notarization, auto-update, provider invocation, release-ready declaration, main verification inference, or self-approval.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Boundaries

No goal gate, release gate, release closeout, tag, push, publish, provider CLI, audit, doctor, mutation command, or model-provider CLI command was run in this leased verifier phase.

The runbook's historical main-verifier prompt includes checkout and ff-only merge steps. This leased verifier was required to use the assigned task-5 worktree and verify the latest worker/reviewer result target, so verification targeted that worktree directly and checked the root ledger only for managed goal status.

## Result

Task-5 satisfies the main-verification acceptance checks.

Event to register: `main.verification-passed`
