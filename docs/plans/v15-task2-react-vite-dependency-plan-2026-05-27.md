# v15 Task 2 React/Vite Dependency Introduction Plan

Date: 2026-05-27
Task: Task 2 only, plan and policy for later React/Vite dependency introduction
Status: plan-only, pending independent reviewer approval

## Scope

This task does not install dependencies, does not edit `package.json`, does not edit `pnpm-lock.yaml`, and does not add React/Vite application code. It records the intended dependency gate for the later approved dependency change group before any Workbench React/Vite implementation starts.

Task 1 is the frozen baseline for browser-facing API contracts. Task 2 does not modify the Task 1 fixtures or production console behavior.

## Baseline Reviewed

- `docs/plans/v15-workbench-react-vite-migration-implementation-plan-2026-05-26.md`
- `docs/plans/v15-workbench-react-vite-migration-plan-2026-05-26.md`
- `docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md`
- `docs/stages/v15-workbench-react-vite-migration.stage.json`
- `package.json`
- `pnpm-lock.yaml`
- `src/symphony/console.js`
- `tests/symphony-cli.test.js`

## Intended Direct Dependency Set For Later Task 3

Read-only registry metadata lookup on 2026-05-27 returned these latest versions:

- `react` 19.2.6
- `react-dom` 19.2.6
- `vite` 8.0.14
- `@vitejs/plugin-react` 6.0.2

The later approved dependency change group should use this exact direct set unless the independent dependency reviewer requires a revision before Task 3 runs:

| Package | Task 3 specifier | Section | Why it is needed |
| --- | --- | --- | --- |
| `react` | `^19.2.6` | `dependencies` | Browser Workbench view layer and component model. This follows the v15 implementation plan's runtime dependency classification for React imports used by the frontend source. |
| `react-dom` | `^19.2.6` | `dependencies` | Mounts the React Workbench into the Vite entry HTML. It must match the React major/minor line. |
| `vite` | `^8.0.14` | `devDependencies` | Local frontend build tool for static Workbench assets. The console server must not import Vite at runtime. |
| `@vitejs/plugin-react` | `^6.0.2` | `devDependencies` | React transform support for Vite builds. It is build-time tooling only. |

No other direct dependency is approved by this plan. Excluded from Task 3 unless a separate review revises this plan:

- TypeScript, `typescript`, `@types/react`, `@types/react-dom`
- Vitest, jsdom, Playwright, browser E2E tooling
- ESLint, Prettier, CSS tooling, Tailwind, Sass, PostCSS plugins
- UI component frameworks
- state management libraries
- data fetching libraries
- icon libraries

The project currently uses JavaScript ESM and Node's built-in test runner. TypeScript and browser tooling would increase the dependency and policy surface and require a separate contract, build, and test strategy.

## Expected `package.json` Diff Shape For Later Task 3

Task 3 should be a dependency-only change group. It should not include React components, Vite app files, console static asset serving, or browser UI behavior. The expected `package.json` shape is limited to adding a new `dependencies` block and appending the two Vite entries to `devDependencies`.

```json
{
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@stryker-mutator/core": "^9.6.1",
    "@stryker-mutator/tap-runner": "^9.6.1",
    "@vitejs/plugin-react": "^6.0.2",
    "fast-check": "^4.8.0",
    "vite": "^8.0.14"
  }
}
```

Task 3 should not change existing package metadata, `bin`, `engines`, current scripts, Stryker dependency versions, or `fast-check`.

Build and test script additions are deferred until the first approved React/Vite shell task because scripts should not point at frontend files before those files exist. If a reviewer explicitly wants script stubs in the dependency change group, that is a revision to this plan and must be approved before Task 3.

## Expected `pnpm-lock.yaml` Change Class For Later Task 3

The Task 3 lockfile change should be scoped to dependency resolution for the four direct packages above.

Expected lockfile classes:

- importer `.` gains `dependencies.react`, `dependencies.react-dom`, `devDependencies.vite`, and `devDependencies.@vitejs/plugin-react`;
- package and snapshot entries are added for the four direct packages and their transitive build/runtime graph;
- Vite platform optional packages and Rollup/esbuild related entries may appear as resolver output;
- existing `@stryker-mutator/*` and `fast-check` importer entries remain semantically unchanged;
- `lockfileVersion`, `settings`, package manager metadata, and unrelated package versions should not churn;
- no generated build output, `node_modules`, or cache paths should be committed.

After the approved Task 3 lockfile update, the dependency owner must run `pnpm audit --audit-level high` and record the result. Any high severity vulnerability blocks the dependency change unless the release owner explicitly accepts and documents the residual risk.

## Expected Frontend Directory Layout For Later Tasks

This layout is a target for the later React/Vite shell and parity tasks. Task 2 creates none of these files.

```text
frontend/workbench/
  index.html
  vite.config.js
  src/
    main.jsx
    App.jsx
    api/
      client.js
      contracts.js
      routes.js
    components/
      CopyCommand.jsx
      EmptyState.jsx
      StatusBadge.jsx
    views/
      OverviewView.jsx
      AdoptionsView.jsx
      RunsView.jsx
      DiagnosticsView.jsx
      ArtifactsView.jsx
    styles/
      workbench.css
```

Expected static build output path for the later shell task:

```text
src/symphony/workbench-static/
  index.html
  assets/
    *.js
    *.css
```

The Vite `build.outDir` should point only at that dedicated Workbench asset directory after reviewer approval of the shell integration. Any alternate output path, including uncommitted `frontend/workbench/dist/`, requires a revision to this plan or the shell plan before server integration lands.

The frontend source must not live under `src/symphony/` because frontend code must not import backend modules directly.

## Build Script Strategy

Build scripts are not added in Task 2 and should not be added in the dependency-only Task 3 unless the reviewer revises this plan.

When the React/Vite shell files exist, add scripts with narrow names rather than changing the existing `test` or `check` semantics:

```json
{
  "scripts": {
    "workbench:build": "vite build --config frontend/workbench/vite.config.js",
    "workbench:dev": "vite --host 127.0.0.1 --config frontend/workbench/vite.config.js"
  }
}
```

The build must emit static display assets only. It must not generate or mutate `.symphony`, ArtifactStore contents, Stage Charter HTML, run state, adoption state, package metadata, lockfiles, or project files.

## Test Script Strategy

Task 2 keeps the current scripts unchanged:

- `pnpm check`
- `pnpm test`
- focused Node test runs such as `node --test tests/symphony-cli.test.js`

No `vitest`, jsdom, Playwright, or browser test dependency is approved for Task 3. UI safety tests should initially use the existing Node test runner, fixture-backed server fetches, and static asset/DOM text inspection where possible. Browser or E2E tooling requires a separate dependency review.

When the shell task adds build scripts, the local gate should become:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`

The release gate remains broader and must include `pnpm audit --audit-level high` after the dependency lockfile changes.

## Console Server Integration Strategy

The console server integration belongs to a later shell task, not Task 2 or dependency-only Task 3.

Required integration rules:

- keep `createSymphonyConsoleServer` GET-only; non-GET requests continue to return HTTP 405 with the read-only error shape;
- keep `/api/*` server-owned and route-compatible with Task 1 fixtures;
- keep `symphony console --snapshot --json` independent of any frontend bundle;
- serve React/Vite static assets only from the approved build output directory;
- use a fixed static prefix and reject path traversal instead of accepting arbitrary file paths;
- if `index.html` or assets are missing, malformed, or unreadable, serve the existing `renderConsoleHtml()` legacy fallback or an equally safe read-only fallback;
- do not allow browser routes to shadow `/api/summary`, `/api/readiness`, `/api/runs`, timeline, artifacts, adoption inspect, or future diagnostics routes.

The root Workbench may choose React only when the bundle is present and valid. API responses must not depend on the bundle.

## Read-Only Display-Only Build Output

React/Vite build output is a static display surface. It is not canonical state.

The built browser code may:

- fetch documented GET-only Workbench API routes;
- render compact state, risks, blockers, artifacts, adoption summaries, and diagnostics;
- copy command text to the clipboard.

The built browser code must not:

- call any write, execute, retry, adopt, apply, rollback, delete, install, audit, mutation, model, or agent endpoint;
- create an endpoint that did not exist in the server contract;
- write local storage, IndexedDB, `.symphony`, ArtifactStore, Stage files, package files, lockfiles, or project files;
- use service workers or background sync;
- become the source of truth for run, Stage, adoption, or artifact state.

Any command shown in the browser must keep `mode: "copy-only"` semantics. A copy button may use `navigator.clipboard.writeText`; no browser click may execute the command.

## Consuming Frozen Task 1 API Contracts

Browser-side code must consume Task 1 contracts through a single frontend API client:

- `GET /api/health`
- `GET /api/summary`
- `GET /api/readiness`
- `GET /api/runs?filter=<filter>`
- `GET /api/runs/latest`
- `GET /api/runs/<run-id>`
- `GET /api/runs/<run-id>/timeline`
- `GET /api/runs/<run-id>/artifacts/<kind>`
- `GET /api/adoptions/<adoption-id>/inspect`

The API client must verify `contractName` and `contractVersion` where those fields exist. It should fail closed into a visible contract-gap state when a route is missing required fields, instead of inferring missing values from paths, raw JSON, Stage Charter HTML, or `.symphony` internals.

React components should receive normalized data from the API client only. Components must not hand-build fetch paths except through route helpers, must not import `src/symphony/*`, and must not parse Stage Charter HTML.

## Preventing Browser Write And Execute Controls

The later UI must not include controls, labels, handlers, routes, or form submissions for:

- write
- execute
- retry
- adopt, adopt-confirm, confirm-adoption
- apply
- rollback
- delete
- package install or dependency install
- model invocation
- real agent invocation
- arbitrary file read
- arbitrary path read or arbitrary path input
- mutation trigger
- audit trigger

Implementation requirements for later tasks:

- no `fetch` call may use `POST`, `PUT`, `PATCH`, or `DELETE`;
- no component prop should be named as an executable action for the prohibited controls;
- all command affordances must be copy-only;
- UI safety tests should scan rendered DOM text and client source for prohibited control labels and non-GET fetch usage;
- server tests must keep non-GET API routes at HTTP 405.

## Preventing Direct Local Filesystem Reads From Browser Code

Browser code cannot and must not read the local filesystem directly. The migration must preserve that boundary explicitly:

- no file input for arbitrary path selection;
- no arbitrary path text input;
- no `file://` links as artifact sources;
- no use of Node `fs`, `path`, `child_process`, or backend imports in frontend source;
- no Vite alias that exposes backend internals to the browser bundle;
- artifact previews are fetched only through registered `/api/runs/<run-id>/artifacts/<kind>` routes.

If an artifact is not registered in the run state or exposed by the server route, the browser must show a missing/unavailable state rather than asking for a path.

## Avoiding Inference Of Missing Artifact Fields

Task 1 intentionally records artifact contract gaps. Later React code must not infer missing fields from `artifact.path`, file extensions, directory names, run ids, or raw state.

Required behavior:

- do not infer `mime`;
- do not infer `title` or `displayTitle`;
- do not infer `safeToRenderInline`;
- do not infer `sourceRunId`;
- do not infer `artifactKind`;
- do not infer `previewAvailable`;
- do not normalize `size` into `sizeBytes` unless the API explicitly provides both or the API client owns a documented compatibility mapping.

Until the artifact preview contract exposes stable `uri` or `ref`, `size` or `sizeBytes`, `mime`, `title` or `displayTitle`, `safeToRenderInline`, `sourceRunId`, `artifactKind`, and `previewAvailable`, React artifact UI must stay conservative. It may render existing bounded text/JSON previews only as server-provided debug/detail data, and it must clearly treat missing safety fields as a contract gap, not as safe inline render permission.

## Handling Task 1 Deferred Contract Gaps

Task 1 deferred gaps must be handled as blockers or conservative UI states, not by frontend inference.

| Deferred gap | Later handling |
| --- | --- |
| Shared `capabilities` object missing from summary/readiness | Use current `readOnly: true`, `modelInvocation: false`, command `mode: "copy-only"`, and server 405 tests. Do not invent browser-executable capabilities. Add shared capabilities in a later API contract task before UI depends on them. |
| Artifact preview safety fields missing | Defer rich artifact previews or render only bounded server-provided text/JSON with safe unavailable states. Do not infer safety from path or extension. |
| Stage compact `owner`, `createdAt`, `updatedAt`, `charterHash` not exposed everywhere needed | Do not read Stage Charter HTML. Show only fields present in `/api/summary` until the server contract exposes compact metadata. |
| Diagnostics route absent | Preserve current behavior by deriving diagnostics from `/api/summary` and `/api/readiness`, or add a fixture-backed GET-only `/api/diagnostics` in a separate API task. |
| Error envelopes route-local | API client normalizes known route-local errors for display only. Shared error envelope work is a separate contract task. |
| Route manifest absent | Centralize route helpers in the frontend API client using the Task 1 route list. Do not scatter hand-built route strings across components. |
| Task/run/evidence/adoption relationship fields incomplete | Do not link by path inference. Display relationships only where the API exposes explicit ids or refs. |

## Rollback Plan

Task 2 rollback is deletion of this plan document only.

If later Task 3 dependency introduction fails review, audit, tests, or lockfile scope:

- revert the dependency change group as a single package/lockfile revert;
- remove any local `node_modules` changes from the developer machine without committing them;
- keep the existing server-rendered Workbench fallback;
- do not proceed to React/Vite shell work;
- record the failed audit or review reason in evidence before attempting a revised plan.

If a later React shell integration fails:

- disable React asset selection and keep `renderConsoleHtml()` as root fallback;
- keep `/api/*` and `symphony console --snapshot --json` unchanged;
- remove generated build assets from the shell change group if they were committed;
- do not modify v12 adoption apply safety, v14 Stage kernel, Stage gate, blocked snapshot recovery, verifier, policy engine, workspace manager, or ArtifactStore boundaries.

## Reviewer Checklist

The independent dependency reviewer should confirm:

- Task 2 changed documentation only.
- No dependency install occurred.
- `package.json` is unchanged.
- `pnpm-lock.yaml` is unchanged.
- No React components, Vite app files, frontend source tree, or static build output were added.
- The intended direct dependency set is exactly `react`, `react-dom`, `vite`, and `@vitejs/plugin-react`.
- React and React DOM classification as `dependencies` is explicitly accepted, or this plan is revised before Task 3.
- Vite and the React plugin classification as `devDependencies` is accepted.
- No TypeScript, test/browser tooling, UI framework, CSS framework, icon library, or state library is included.
- Task 3 package and lockfile changes will be isolated from UI implementation.
- Lockfile changes will be reviewed for unrelated churn.
- `pnpm audit --audit-level high` is required after Task 3 lockfile update.
- Browser code is constrained to GET-only APIs and copy-only command text.
- Browser code cannot add write, execute, retry, adopt, apply, rollback, delete, install, audit, mutation, model, or agent controls.
- Browser code cannot read arbitrary local filesystem paths.
- React code must consume Task 1 fixtures through an API client and must not infer missing artifact fields.
- Legacy fallback remains required until shell smoke and fixture parity gates pass.

## Verification Commands

Task 2 verification:

```sh
pnpm check
pnpm test
git diff --check
git diff -- package.json pnpm-lock.yaml
```

Expected Task 2 result for `git diff -- package.json pnpm-lock.yaml`: no output.

Later Task 3 dependency verification, after approved package and lockfile changes:

```sh
pnpm check
pnpm test
pnpm audit --audit-level high
git diff --check
git diff -- package.json pnpm-lock.yaml
```

When the later shell task adds build scripts:

```sh
pnpm workbench:build
```

## Task 2 Evidence

Files changed:

- `docs/plans/v15-task2-react-vite-dependency-plan-2026-05-27.md`

Tests run:

- `pnpm check` - passed.
- `pnpm test` - passed, 518 tests.
- `git diff --check` - passed.
- `git diff -- package.json pnpm-lock.yaml` - passed with no output.

Boundary confirmations:

- No dependency install occurred.
- `pnpm add` was not run.
- `pnpm install` was not run.
- `package.json` was unchanged.
- `pnpm-lock.yaml` was unchanged.
- No React/Vite implementation was added.
- No React components were created.
- No Vite app files were created.
- No browser controls were created for write, execute, retry, adopt, apply, rollback, delete, install, model, mutation, or audit actions.
- v12 adoption apply safety kernel was not changed.
- v14 Stage kernel, Stage gate, blocked snapshot recovery, verifier, policy engine, workspace manager, and ArtifactStore boundaries were not changed.

Deferred items for Task 3:

- Independent reviewer approval of this dependency plan.
- Approved isolated `package.json` and `pnpm-lock.yaml` dependency change.
- Lockfile audit with `pnpm audit --audit-level high`.
- No UI shell, frontend files, or console server integration until dependency review is complete.
