# v19 Task 1 Worker Revision Evidence

Date: 2026-05-29

## Goal And Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-1`
- Branch: `v19-task1-goal-runbook-contracts`
- Review evidence: `docs/plans/v19-task1-review-evidence-2026-05-29.md`
- Reviewer verdict addressed: `NEEDS_REVISION`

## Fixed Blocker

The reviewer found that `goal-runbook.v1` controlled ref validation rejected `../secret.md` and encoded traversal, but still accepted raw terminal parent-directory segments such as:

- `docs/plans/..`
- `docs/plans/subdir/..`
- `artifacts/run/..`

The fix updates `src/symphony/goal-runbook-contracts.js` so raw and decoded refs reject any path segment equal to `..`, including terminal segments.

## Files Changed

- `src/symphony/goal-runbook-contracts.js`
- `tests/v19-goal-runbook-contracts.test.js`
- `fixtures/contracts/goal-runbook.raw-parent-segment.invalid.v1.json`

## Verification

### Targeted contract test

Command:

```bash
node --test tests/v19-goal-runbook-contracts.test.js
```

Result: passed, exit code `0`.

Observed summary:

```text
tests 9
suites 1
pass 9
fail 0
duration_ms 43.265584
```

The new suite case is `rejects raw parent directory segments in controlled refs`.

### Reviewer blocker probe

Command:

```bash
node --input-type=module -e "<controlled ref traversal probe>"
```

Result: passed, exit code `0`.

Observed output:

```text
docs/plans/.. {
  ok: false,
  errors: [ 'baseline.evidenceRef must be a controlled evidence reference' ]
}
docs/plans/subdir/.. {
  ok: false,
  errors: [ 'baseline.evidenceRef must be a controlled evidence reference' ]
}
artifacts/run/.. {
  ok: false,
  errors: [ 'baseline.evidenceRef must be a controlled evidence reference' ]
}
```

### `pnpm check`

Result: passed, exit code `0`.

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code `0`.

Observed summary:

```text
tests 631
suites 105
pass 631
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3400.135042
```

The v19 Task 1 suite passed inside the full run:

```text
v19 goal runbook, next action, prompt pack, and closeout contracts
tests 9
pass 9
fail 0
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.

## Boundary

Only the reviewer blocker was changed. No CLI, API, Workbench panel, managed runbook state, dependency, lockfile, release status, or release-ready behavior was added.

## Re-review Handoff

Reviewer should re-check `isUnsafeControlledRef`, the new raw parent segment fixture, and the new test case for terminal and nested `..` segments in repo-doc and managed artifact refs.
