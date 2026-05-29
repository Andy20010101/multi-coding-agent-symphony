# v19 Task 4 Main Verification Evidence

Date: 2026-05-29
Branch verified on: `main`
Merged branch: `v19-task4-goal-prompt-pack`
Main commit after merge: `c3dea5436fde72175c5feffaf5d353c72da249ec`
Result: passed

## Git Steps

Pre-merge condition:

- `docs/plans/v19-task4-review-evidence-2026-05-29.md` contained the reviewer approval update in the task-branch working tree.
- The review evidence was committed on `v19-task4-goal-prompt-pack` before main verification so the fast-forward merge would include the approval evidence.
- Commit created: `c3dea54 Approve v19 task4 review evidence`

Commands:

```text
$ git checkout main
Exit code: 0
Result: switched to main
Output:
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
```

```text
$ git pull --ff-only
Exit code: 0
Result: already up to date
Output:
Already up to date.
```

```text
$ git merge --ff-only v19-task4-goal-prompt-pack
Exit code: 0
Result: fast-forward merge completed
Output:
Updating 8aaa2b0..c3dea54
Fast-forward
 docs/plans/v19-task4-review-evidence-2026-05-29.md | 213 +++++
 docs/plans/v19-task4-worker-evidence-2026-05-29.md | 164 ++++
 scripts/symphony.js                                | 184 ++++-
 src/symphony/goal-prompt-pack.js                   | 879 +++++++++++++++++++++
 tests/v19-goal-prompt-pack.test.js                 | 333 ++++++++
 5 files changed, 1770 insertions(+), 3 deletions(-)
 create mode 100644 docs/plans/v19-task4-review-evidence-2026-05-29.md
 create mode 100644 docs/plans/v19-task4-worker-evidence-2026-05-29.md
 create mode 100644 src/symphony/goal-prompt-pack.js
 create mode 100644 tests/v19-goal-prompt-pack.test.js
```

## Verification Commands

```text
$ pnpm check
Exit code: 0
Result: passed
Command executed by package script:
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
Diagnostics: none
```

```text
$ pnpm test
Exit code: 0
Result: passed
Summary:
tests 653
suites 108
pass 653
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3379.877084
```

```text
$ pnpm symphony goal prompt --goal v19-fixture --task task-1 --role worker --markdown
Exit code: 0
Result: passed
Observed stdout:
- pnpm package-script banner printed first.
- Generated prompt starts at `/goal`.
- Prompt scope is `v19-fixture task-1 worker implement`.
- Task title is `Add goal runbook contracts and validators`.
- Validation commands listed: `pnpm check`, `pnpm test`, `git diff --check`.
- Suggested evidence path listed: `docs/plans/v19-task1-worker-evidence-2026-05-29.md`.
- Worker event guidance lists dry-run and confirm `symphony goal update` commands.
- Prompt states the worker must not claim reviewer approval, main verification, or release readiness.
```

```text
$ git diff --check
Exit code: 0
Result: passed
Output: none
```

## Verification Result

Task 4 is merged into `main` by fast-forward at `c3dea5436fde72175c5feffaf5d353c72da249ec`.

The required main verification checks passed. Register the main verification event with:

```bash
symphony goal gate --gate main-verification --status passed
```
