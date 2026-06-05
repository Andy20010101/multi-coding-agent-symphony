# v40 task-1 review evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-1`
Branch: `v40-task-1-inbox-capture-contract`
Reviewer: `codex-v40-task-1-reviewer`
Verdict: `APPROVED`

## Review target

- Worktree: `/Users/andy/.codex/worktrees/v40-task-1-inbox-capture-contract`
- Base commit: `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`
- Head commit: `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`
- Worker evidence: `docs/plans/v40-task-1-worker-evidence-2026-06-02.md`

## Scope reviewed

The branch adds the read-only `inbox-capture.v1` entry contract for raw user requests, project clues, ideas, and faults before routing into Workbench or later workflow-router steps.

Reviewed surfaces:

- CLI: `symphony inbox capture --json`
- API: `GET /api/inbox/capture`
- Workbench: `InboxCapturePanel`
- Docs: README, product contracts, operator guide
- Tests: `tests/v40-inbox-capture-contract.test.js`, Workbench API and shell tests

## Findings

No blocking findings.

The implementation stays within task-1 scope. It defines and displays the capture entry contract without persisting capture items, creating goals, routing categories, drafting runbooks, invoking models, executing shell commands, opening local paths, writing git state, self-approving, passing main verification, or declaring release readiness.

The Workbench path is visible and testable through the read-only route model and panel. The backend contract keeps handoff fields for task-2 router and task-3 goal/runbook draft work without implementing those flows in this branch.

## Boundary checks

- Latest goal/runbook/next-action spine is preserved as source context in the contract.
- API route accepts only `goal` and `task` query parameters.
- CLI rejects write, output-file, prompt, path, command, and unsafe ref input.
- Shared console server GET-only guard blocks non-GET access to `/api/inbox/capture`.
- Workbench consumes backend contract fields only; no browser shell runner, arbitrary command execution, model invocation, path opener, merge, push, tag, publish, review approval, main verification, or release gate path was added.
- Status is not inferred from branch names, filenames, commit messages, prompt text, task titles, or frontend state.

## Commands run

- `git status --short --branch`
  - Result: passed. Branch is `v40-task-1-inbox-capture-contract`; worktree contains the expected worker changes and untracked evidence/source/static/test files.
- `git rev-parse HEAD`
  - Result: passed. HEAD is `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`.
- `sed -n '1,240p' docs/plans/v40-task-1-worker-evidence-2026-06-02.md`
  - Result: passed. Worker evidence exists at the assigned worker evidence ref.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - Result: passed. 1046 tests passed, 0 failed.
- `pnpm workbench:build`
  - Result: passed. Vite built `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-BAd603I3.js`.
- `git diff --check`
  - Result: passed.
- `pnpm --silent symphony inbox capture --goal v40-personal-workflow-router-app-core-release --task task-1 --json`
  - Result: passed. Returned `inbox-capture.v1` with `requiresActiveWorkbenchGoal: false`, `writesInPreview: false`, and disabled shell/model/git/release boundaries.

## Risks

- The implementation is uncommitted in the assigned worktree. The new generated static asset `src/symphony/workbench-static/assets/index-BAd603I3.js` is untracked and must be included with the deletion of `index-Cc3wrmZV.js` when the branch is committed.
- `git diff --check` does not inspect untracked files until they are staged or tracked. `pnpm check`, `pnpm test`, and `pnpm workbench:build` covered the new source/test/build paths.

## Next action

Register reviewer verdict:

```bash
pnpm --silent symphony goal review \
  --goal v40-personal-workflow-router-app-core-release \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v40-task-1-reviewer \
  --evidence-ref docs/plans/v40-task-1-review-evidence-2026-06-02.md \
  --dry-run --json
```
