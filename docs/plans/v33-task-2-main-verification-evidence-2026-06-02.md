# v33 task-2 main verification evidence

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Release name: `v33 App Runtime Foundation`
Task id: `task-2`
Task title: `Project registry and current project resolver`

## Result

PASSED

## Current checkout

- Branch: `v33-task-1-local-sidecar-health-api`
- HEAD: `5e3993582a9c2645f6facb9d73a47d9fc31e123c`
- Short HEAD: `5e39935`
- Worker evidence: `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v33-task-2-review-evidence-2026-06-02.md`
- Review event id: `goal-event-log.v1:evt_66e4a18c96d19031`

## Verification basis

The ideal path in the runbook is clean `main`, `git pull --ff-only`, and `git merge --ff-only v33-task-2-project-registry-resolver`. I did not run checkout, pull, or merge because the current checkout is not clean and contains staged, modified, and untracked task-1/task-2 files. Changing branches or merging would cross the dirty-worktree boundary and could disturb prior agent work.

I used the instructed repo-local fallback from the current checkout. The fallback basis was:

- `git status -sb --untracked-files=all`
- `git diff --name-status main`
- Direct inspection of task-2 implementation, fixture, tests, CLI/API wiring, docs, worker evidence, review evidence, and the managed event journal.
- Authoritative `goal-status` and `goal next` output.
- Full validation command results.
- Focused CLI and API probes for project registry and current project resolver behavior.

This is sufficient for task-2 main verification because the approved task-2 implementation is present in the current checkout, the authoritative event journal records independent reviewer approval for task-2, the focused and full validation commands pass from the same checkout, and runtime/API probes exercise the required user-visible paths without git writes or registry writes.

## Authoritative review state

`.symphony/goals/events/v33-app-runtime-foundation.ndjson` contains:

- Sequence 6: `evt_8fe5ba94f49de291`, task `task-2`, `eventType: "worker.evidence-recorded"`, actor id `019e8610-3426-7180-9fc5-c5c149eb36dd`, evidence ref `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`.
- Sequence 7: `evt_66e4a18c96d19031`, task `task-2`, `eventType: "reviewer.approved"`, actor id `019e861c-54c4-7443-a829-3acd10fe9991`, review verdict `APPROVED`, evidence ref `docs/plans/v33-task-2-review-evidence-2026-06-02.md`.

`goal-status` returned task-2 status `approved`, status source `goal-event-log.v1:evt_66e4a18c96d19031`, review verdict `APPROVED`, worker evidence ref present, review evidence ref present, and `mainVerificationRef: null`.

`goal next` returned task-2 as the next action with role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-2 but main verification is missing.`

The worker and reviewer actors are different. The review event was registered by `019e861c-54c4-7443-a829-3acd10fe9991`, not by worker `019e8610-3426-7180-9fc5-c5c149eb36dd`.

## Commands

| Command | Exit | Outcome |
| --- | ---: | --- |
| `git status -sb --untracked-files=all` | 0 | Dirty checkout on `v33-task-1-local-sidecar-health-api`. Tracked task-1/shared files are staged/modified. Task-2 review/worker evidence, `fixtures/contracts/project-registry.v1.json`, `src/symphony/project-registry.js`, and `tests/v33-project-registry.test.js` are untracked. |
| `git diff --name-status main` | 0 | Shows tracked v33 changes relative to main. Untracked task-2 module, fixture, test, and evidence are not included, so they were inspected directly. |
| `pnpm check` | 0 | `node --check` completed for `src`, adapters, integrations, `src/symphony`, scripts, plugins, and tests. |
| `pnpm test` | 0 | Node test runner passed: `tests 768`, `suites 118`, `pass 768`, `fail 0`, duration `7452.958834ms`. |
| `pnpm workbench:build` | 0 | Vite build passed. Output included `src/symphony/workbench-static/index.html`, CSS `index-BY5UaxlX.css`, and JS `index-BDjDodcJ.js`. |
| `git diff --check` | 0 | No whitespace errors. |
| `node --test tests/v33-project-registry.test.js` | 0 | Focused test passed: `tests 5`, `suites 1`, `pass 5`, `fail 0`. |
| `pnpm --silent symphony runtime projects --json` | 0 | Returned `project-registry.v1`, `readOnly: true`, one project for `/Users/andy/Documents/project/multi-coding-agent-symphony`, all required project fields present, and write/execution/model boundaries false. |
| `pnpm --silent symphony runtime current --json` | 0 | Returned `current-project-resolver.v1`, `readOnly: true`, `resolution.status: "resolved"`, and current project repo path set to the workspace. |
| `pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task2 --json` | 0 | Returned `currentProject: null`, `resolution.status: "unresolved"`, strategy `explicit-repo-path`, blocker `project-path-missing`. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | 0 | Returned `goal-progress-ledger.v1`; task-2 approved from `goal-event-log.v1:evt_66e4a18c96d19031`; `mainVerificationRef: null`. |
| `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` | 0 | Returned `goal-next-action.v1`; task-2 is in `main-verification` for role `main-verifier`. |
| Direct event journal read: `sed -n '1,120p' .symphony/goals/events/v33-app-runtime-foundation.ndjson` | 0 | Confirmed task-2 worker event and independent reviewer approval event with the expected actor ids, evidence refs, and event id. |
| API probe with `createSymphonyConsoleServer` | 0 | Confirmed `/api/projects`, `/api/projects?path=package.json`, `/api/projects/current`, `/api/projects/current?repoPath=/tmp/does-not-exist-v33-task2`, and POST rejection behavior. |

## Runtime and API probe summary

`pnpm --silent symphony runtime projects --json` returned:

- `contractName: "project-registry.v1"`
- `readOnly: true`
- `projects.length: 1`
- `project_id: "multi-coding-agent-symphony-multi-coding-agent-symphony"`
- `project_name: "multi-coding-agent-symphony"`
- `repo_path: "/Users/andy/Documents/project/multi-coding-agent-symphony"`
- `default_branch: "main"`
- `remote_url: "https://github.com/Andy20010101/multi-coding-agent-symphony.git"`
- `last_goal_id: "v33-app-runtime-foundation"`
- `last_run_id: "symphony-scan-multi-coding-agent-symphony-17ca94e66bb5-mphrq23c-5ai-1"`
- `health_status: "ok"`
- `last_opened_at: "2026-05-23T03:07:38.937Z"`
- `pinned: false`
- `boundaries.registryDatabaseWritesAvailable: false`
- `boundaries.gitWriteAvailable: false`
- `boundaries.modelInvocationAvailable: false`

`pnpm --silent symphony runtime current --json` returned `current-project-resolver.v1`, `readOnly: true`, `resolution.status: "resolved"`, strategy `cwd`, and the same required project fields.

`pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task2 --json` returned `currentProject: null`, `resolution.status: "unresolved"`, and blocker `project-path-missing`.

API probe results:

| Method and path | Status | Contract/result |
| --- | ---: | --- |
| `GET /api/projects` | 200 | `project-registry.v1`, `projectCount: 1`, `resolutionStatus: "resolved"` |
| `GET /api/projects?path=package.json` | 400 | `error-envelope.v1`, `invalid-project-registry-request` |
| `GET /api/projects/current` | 200 | `current-project-resolver.v1`, `resolutionStatus: "resolved"`, current project repo path is the workspace |
| `GET /api/projects/current?repoPath=/tmp/does-not-exist-v33-task2` | 200 | `current-project-resolver.v1`, `resolutionStatus: "unresolved"`, `currentProject: null` |
| `POST /api/projects` | 405 | `error-envelope.v1`, `method-not-allowed` |
| `POST /api/projects/current` | 405 | `error-envelope.v1`, `method-not-allowed` |

## Implementation checks

`src/symphony/project-registry.js` implements:

- `project-registry.v1`
- `current-project-resolver.v1`
- Required project fields: `project_id`, `project_name`, `repo_path`, `default_branch`, `remote_url`, `last_goal_id`, `last_run_id`, `health_status`, `last_opened_at`, `pinned`.
- Read-only boundaries: `readOnly: true`, `diskScanScope: "cwd-or-explicit-repo-path-only"`, `registryDatabaseWritesAvailable: false`, `actionExecutionAvailable: false`, `jobQueueAvailable: false`, `modelInvocationAvailable: false`, `gitWriteAvailable: false`, `releaseWriteAvailable: false`, `arbitraryCommandExecutionAvailable: false`.

Registry sources are repo-local:

- `package.json` for project name.
- `.git/refs/remotes/origin/HEAD`, `.git/config`, and `.git/HEAD` for default branch and remote URL.
- `.symphony/goals/latest-active-goal.json` through `readManagedActiveGoalPointer` for `last_goal_id`.
- `.symphony/runs/latest.json` through `readLatestRun` for `last_run_id` and `last_opened_at`.

The resolver starts from `cwd` or explicit `repoPath`, checks whether the input exists, treats file inputs as their parent directory, and walks only up that input path's ancestor chain until it finds `.git` or reaches the filesystem root. Missing paths return blocker `project-path-missing`. Existing non-git paths return blocker `project-repo-unresolved`.

`scripts/symphony.js` wires:

- `symphony runtime projects [--repo-path <path>] [--json]`
- `symphony runtime current [--repo-path <path>] [--json]`

`src/symphony/console.js` wires:

- `GET /api/projects`
- `GET /api/projects/current`
- Optional `repoPath` only for `/api/projects/current`
- Query rejection for `/api/projects`
- Query rejection for unsupported `/api/projects/current` parameters
- Method rejection for POST requests

`fixtures/contracts/project-registry.v1.json` and `tests/v33-project-registry.test.js` cover the contract, boundary drift, cwd resolution, explicit path resolution, missing path, non-git path, CLI output, API output, POST rejection, query rejection, and no repo writes during focused fixture tests.

## Acceptance checklist

| Requirement | Result | Evidence |
| --- | --- | --- |
| Registry lists projects with required fields | PASS | CLI registry output and validator include all required fields. |
| Current project resolves from cwd | PASS | `runtime current --json` returned the workspace project with `resolution.status: "resolved"`. |
| Current project resolves from explicit repo path | PASS | Focused tests resolve nested explicit repo paths to fixture repo roots. |
| Missing paths handled | PASS | CLI/API missing path probes returned `currentProject: null` and blocker `project-path-missing`. |
| Non-git paths handled | PASS | Focused tests and review evidence cover `project-repo-unresolved`; resolver returns unresolved without scanning elsewhere. |
| No whole-disk scan | PASS | Resolver walks only the selected path's ancestors and boundary field reports `cwd-or-explicit-repo-path-only`. |
| Read-only registry | PASS | Production module imports `lstat` and `readFile`; no registry database writer or migration is present. |
| No repo/git writes | PASS | Runtime module reads repo-local files and managed state only; boundaries set `gitWriteAvailable: false`; tests snapshot fixture files before and after CLI/API calls. |
| CLI contract exists | PASS | `runtime projects` and `runtime current` returned stable JSON contracts. |
| API contract exists | PASS | `/api/projects` and `/api/projects/current` returned stable JSON contracts. |
| API mutation/query boundaries | PASS | `/api/projects?path=package.json` returned 400; unsupported POST requests returned 405. |
| Review findings addressed | PASS | Reviewer-approved behavior was re-run through focused tests, CLI probes, API probes, and code inspection. |
| Status is not inferred from branch, filenames, commits, task titles, prompt text, or frontend state | PASS | Review approval came from the managed goal event journal and goal-status output; project fields came from repo-local metadata and managed Symphony pointers. |
| Worker did not approve itself | PASS | Worker actor `019e8610-3426-7180-9fc5-c5c149eb36dd`; reviewer actor `019e861c-54c4-7443-a829-3acd10fe9991`. |

## Boundary notes

No task-2 implementation path adds a project registry database migration, project registry database write, whole-disk scan, repo write, git write, workflow action execution, Action Registry execution, Job Queue, Provider Hub, secret storage, model invocation, budget tracking, backup/restore, Desktop Shell, generic shell runner, browser terminal, permission system, new goal framework, artifact framework, command DSL, local file opening, download, merge/push/tag/publish path, or self-approval path.

This verifier did not run `git checkout`, `git pull`, `git merge`, `git push`, `git tag`, `git commit`, `git add`, `git reset`, `git stash`, `symphony goal gate`, `symphony goal update`, `symphony goal review`, or `symphony goal closeout`.

The only file write by this verifier was `docs/plans/v33-task-2-main-verification-evidence-2026-06-02.md`.

## Blockers

No task-2 main verification blocker remains under the fallback basis.

The coordinator still needs to register the main verification gate through the controlled dry-run/confirm flow. This verifier did not register the gate event.
