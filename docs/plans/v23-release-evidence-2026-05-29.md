# v23 Release Evidence

Goal id: `v23-goal-operation-run-console`
Release name: `v23 Goal Operation Run Console`
Release closeout run date: 2026-05-31
Verifier: `codex-v23-release-manager`
Main commit: `33d52949aeaba51b7b53ec07a39498fa141441df`

## Scope

The release check covers the v23 Goal Operation Run Console path:

`Start a goal operation from Workbench -> see command, stdout/stderr, status, plan hash, event ids -> jump back to active goal.`

Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard. This closeout does not add a generic safety layer, generic shell runner, worker self-approval, auto-merge, or auto-tag.

## Command Results

### `git checkout main`

Result: passed, exit code 0.

```text
Switched to branch 'main'
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
M	frontend/workbench/src/App.jsx
M	frontend/workbench/src/api/client.js
M	frontend/workbench/src/api/contracts.js
M	frontend/workbench/src/styles/workbench.css
M	src/symphony/console.js
D	src/symphony/workbench-static/assets/index-BRTPIdb3.js
D	src/symphony/workbench-static/assets/index-D6WeclLN.css
M	src/symphony/workbench-static/index.html
M	tests/v21-goal-plan-preview-api.test.js
M	tests/workbench-api-client.test.js
M	tests/workbench-shell.test.js
Your branch is ahead of 'origin/main' by 26 commits.
  (use "git push" to publish your local commits)
```

### `git pull --ff-only`

Result: passed, exit code 0.

```text
Already up to date.
```

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8
...
tests 709
suites 113
pass 709
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3751.618833
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DhfUBgwe.css   15.18 kB │ gzip:   2.98 kB
src/symphony/workbench-static/assets/index-BCmw_mw4.js   755.37 kB │ gzip: 140.84 kB

✓ built in 148ms
```

### `pnpm test:mutation:gate`

Result: passed, exit code 0.

```text
Found 6 of 7011 file(s) to be mutated.
Instrumented 6 source file(s) with 2382 mutant(s)
Initial test run succeeded. Ran 69 tests in 10 seconds (net 8378.878167 ms, overhead 2233.1218329999992 ms).
...
All files | 74.22 total mutation score | 78.37 covered | 1762 killed | 6 timeout | 488 survived | 126 no cov | 0 errors
Final mutation score of 74.22 is greater than or equal to break threshold 60
Done in 21 minutes and 54 seconds.
```

### `pnpm audit --audit-level high`

Result: passed, exit code 0.

```text
1 vulnerabilities found
Severity: 1 moderate
```

### `pnpm mcas doctor`

Result: passed, exit code 0.

```json
{
  "version": "1",
  "status": "ok",
  "nodeVersion": "24.14.0",
  "packageManager": "pnpm",
  "commands": [
    "doctor",
    "intake",
    "github issue",
    "harness run-taskpacket",
    "queue manual",
    "run-next",
    "run-task",
    "smoke",
    "eval replay"
  ]
}
```

### `git diff --check`

Result: passed, exit code 0. Output was empty.

### `pnpm --silent symphony goal closeout --goal v23-goal-operation-run-console --markdown`

Result: passed, exit code 0.

```text
# Goal Closeout

- Goal: `v23-goal-operation-run-console`
- Tasks: 5
- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Release ready: no
- Release ready source: missing

## Missing Evidence
- none

## Release Gate Gaps
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown

## Release Gates
- pnpmCheck: unknown
- pnpmTest: unknown
- workbenchBuild: unknown
- mutationGate: unknown
- auditHigh: unknown
- diffCheck: unknown
- mcasDoctor: unknown
- docsUpdated: unknown
- tagEvidence: unknown

Next: `symphony goal next --goal v23-goal-operation-run-console`
```

## Closeout Gaps

Missing evidence: none.
Release gate gaps before registration: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `mutationGate`, `auditHigh`, `diffCheck`, `mcasDoctor`, `docsUpdated`.

## Release Gate Registration

The eight runbook release gates were registered with dry-run plus confirm using this evidence reference:

`docs/plans/v23-release-evidence-2026-05-29.md`

| Gate | Status | Event id |
| --- | --- | --- |
| `release.pnpm-check` | passed | `evt_1dbbb4735ba03abd` |
| `release.pnpm-test` | passed | `evt_23931e424ccdf0ce` |
| `release.workbench-build` | passed | `evt_6c06f76358b1cef8` |
| `release.mutation-gate` | passed | `evt_33fae7b78e7116a5` |
| `release.audit-high` | passed | `evt_121ccae77f43b185` |
| `release.mcas-doctor` | passed | `evt_1d2f8533eae9b845` |
| `release.diff-check` | passed | `evt_8b91087e0079a5ca` |
| `release.docs-updated` | passed | `evt_059fbbd48a57ff45` |

## Final Closeout

After release gate registration, closeout had no release gate gaps and only the expected missing `release.ready-declared` event. The exact dry-run command required by the runbook returned plan hash `sha256:8f1149ddc1f34c97d473818cf85859adf024c7eff59539e55cc6f778498b25ba`.

`release.ready` was confirmed with that plan hash.

| Gate | Status | Event id | Source |
| --- | --- | --- | --- |
| `release.ready` | declared | `evt_2b84d792ffe98c64` | `goal-event-log.v1:evt_2b84d792ffe98c64` |

Final closeout result:

```text
# Goal Closeout

- Goal: `v23-goal-operation-run-console`
- Tasks: 5
- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Release ready: yes
- Release ready source: goal-event-log.v1:evt_2b84d792ffe98c64

## Missing Evidence
- none

## Release Gate Gaps
- none

## Release Gates
- pnpmCheck: passed
- pnpmTest: passed
- workbenchBuild: passed
- mutationGate: passed
- auditHigh: passed
- diffCheck: passed
- mcasDoctor: passed
- docsUpdated: passed
- tagEvidence: unknown

Next: `symphony goal next --goal v23-goal-operation-run-console`
```

## Tag And Release Recommendation

`release.ready` is declared. Do not auto-merge or auto-tag. Tagging can proceed only if the controller chooses the tag operation.

## Blockers

None from the required release commands or final closeout. The local `main` branch is ahead of `origin/main` and the working tree contains v23 changes carried into this closeout; this evidence records the exact command results from that local main worktree.
