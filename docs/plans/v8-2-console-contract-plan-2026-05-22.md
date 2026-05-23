# v8.2 Plan: Stable JSON Contract and Read-Only Console

Date: 2026-05-22
Updated: 2026-05-23
Status: released in git as `v8.2`; GitHub Actions passed for `main` and `v8.2`
Baseline: `v8.1` release
Repository: `Andy20010101/multi-coding-agent-symphony`
Primary CLI: `symphony`

## Objective

Ship v8.2 as the product-API and local evidence-console release:

- Make product `--json` output stable enough for scripts and UI consumers.
- Add a local read-only `symphony console` for inspecting recent runs and artifacts.
- Preserve all v8.1 behavior, command names, safety defaults, and kernel/debug `mcas` paths.

v8.2 must not introduce browser-triggered writes, real-agent execution buttons, or arbitrary filesystem reads.

## Current Release State

v8.1 has already been released:

- Release commit: `12dfa14 Prepare v8.1 for release`
- Release tag: `v8.1`
- Remote state: `main` and `v8.1` tag pushed
- CI state: GitHub Actions passed for both `main` and the `v8.1` tag

v8.2 is now represented by git commit `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d` and tag `v8.2`. Local `main`, `origin/main`, and the dereferenced remote `v8.2` tag all point at that commit.

## Implemented In v8.2

Stable product JSON contract:

- New file: `src/symphony/contract.js`
- Added `PRODUCT_JSON_CONTRACT` with contract name `symphony.product-json`, version `1`, stability `stable`, and minimum CLI `v8.2`.
- Added `withProductJsonContract(summary, options)` to keep existing top-level summary fields while adding stable envelope fields.
- Product `--json` output now includes:
  - `contractVersion`
  - `contractName`
  - `contract`
  - `identity`
  - `safety`
  - `workflow`
  - `artifactRefs`
  - `action`
  - `timestamps`
- Persisted product run state now stores the same contracted shape with `contractName: "symphony.run-state"`.

Run state listing:

- Modified file: `src/symphony/state.js`
- Added `listRunStates({ stateDir })`.
- Reads `.symphony/runs/*.json`, excludes `latest.json`, and sorts newest first by `updatedAt` or `createdAt`.
- Existing latest-context and latest-run behavior remains compatible.

Read-only local console:

- New file: `src/symphony/console.js`
- Added `buildConsoleSnapshot({ stateDir })`.
- Added `createSymphonyConsoleServer({ stateDir })`.
- Added read-only HTTP routes:
  - `GET /`
  - `GET /api/health`
  - `GET /api/summary`
  - `GET /api/runs`
  - `GET /api/runs/latest`
  - `GET /api/runs/<run-id>`
  - `GET /api/runs/<run-id>/artifacts/<kind>`
- All non-GET requests return HTTP 405 with the message `console is read-only`.
- The browser view renders run status, verifier status, artifact references, and artifact preview controls.

Artifact preview:

- Implemented inside `src/symphony/console.js`.
- Preview endpoint only reads paths that already exist in the selected run state's `artifactRefs`.
- No arbitrary path query parameter is accepted.
- File preview is capped at 200 KiB.
- JSON artifacts are parsed into `artifact.json`.
- Text artifacts are returned as `artifact.content`.
- Directory artifacts list up to 100 entries.
- Response contract name is `symphony.console-artifact`.
- Frontend preview shows the selected artifact response in a side panel.

CLI routing:

- Modified file: `scripts/symphony.js`
- Added `console` to known commands.
- Added `symphony console` server command with default bind `127.0.0.1:8765`.
- Added `symphony console --snapshot --json` to emit a console snapshot without starting a server.
- Added console options:
  - `--json`
  - `--snapshot`
  - `--state-dir <path>`
  - `--host <host>`
  - `--port <port>`

Prompt router:

- Modified file: `src/symphony/prompt-router.js`
- Added `console` intent.
- Added deterministic routing for `console`, `dashboard`, and `控制台`.
- Console intent is read-only and maps to the `console` pipeline.

Tests:

- Modified file: `tests/symphony-cli.test.js`
- Added product JSON contract assertions for `contractVersion`, `contractName`, `identity`, `safety`, `artifactRefs`, and `action`.
- Added persisted run-state contract checks.
- Added console snapshot/server tests for:
  - `symphony.console-snapshot`
  - `GET /`
  - `GET /api/summary`
  - `GET /api/runs/latest`
  - `GET /api/runs/latest/artifacts/context`
  - `POST /api/summary` returning HTTP 405

Documentation:

- Modified file: `README.md`
- Documented the stable product JSON contract fields.
- Documented `symphony console`.
- Documented console API endpoints.
- Documented the read-only guarantee and the 200 KiB artifact preview limit.

## Current Working Tree Commit Checklist

These files must be included in the v8.2 commit:

```text
M  README.md
M  scripts/symphony.js
M  src/symphony/prompt-router.js
M  src/symphony/state.js
M  tests/symphony-cli.test.js
A  src/symphony/console.js
A  src/symphony/contract.js
A  docs/plans/v8-2-console-contract-plan-2026-05-22.md
```

Before committing, run `git status --short` and verify that the two new source files are staged:

```text
src/symphony/console.js
src/symphony/contract.js
```

Missing either new file will break the CLI import path and the v8.2 release.

## Verified Locally So Far

Full checks already run after the v8.2 implementation:

```sh
pnpm check
node --test tests/symphony-cli.test.js
pnpm test
pnpm audit --audit-level high
git diff --check
```

Results:

- `pnpm check`: passed.
- `node --test tests/symphony-cli.test.js`: passed, 28 tests across 4 suites.
- `pnpm test`: passed, 495 tests across 83 suites.
- `pnpm audit --audit-level high`: passed with no known vulnerabilities.
- `git diff --check`: passed.

Manual console smoke already run:

```sh
node scripts/symphony.js console --snapshot --json
node scripts/symphony.js console --host 127.0.0.1 --port 8765
curl http://127.0.0.1:8765/
curl http://127.0.0.1:8765/api/summary
curl http://127.0.0.1:8765/api/runs/latest/artifacts/scaffold-manifest
```

Results:

- Snapshot returned `contractName: "symphony.console-snapshot"`.
- Browser root returned HTML.
- Summary endpoint returned console snapshot JSON.
- Artifact preview returned `contractName: "symphony.console-artifact"` and `truncated: false` for the tested scaffold manifest.

## v8.2 Completion Status

Implementation update on 2026-05-22: the remaining UX, run-detail, contract documentation, and artifact-preview edge cases below were completed before the `v8.2` tag. Local release evidence records passing final verification, and GitHub Actions passed for both the `main` push and the `v8.2` tag push.

Console UX completed:

- Show clear empty states for no runs, no latest run, no artifact refs, missing artifact file, malformed JSON, and truncated previews.
- Make selected run and selected artifact state obvious in the UI.
- Display directory artifact previews as a compact file list.
- Keep the preview panel read-only and avoid adding write, execute, delete, or retry buttons in v8.2.

Run details completed:

- Surface route decision, command, semantic command, safety mode, provider mode, provider fallback, unsupported requests, scaffold plan, changed files, verifier status, and next action where present.
- Preserve compatibility with older run-state files that do not contain the v8.2 contract fields.

Contract documentation completed:

- Add or expand dedicated docs for:
  - `symphony.product-json`
  - `symphony.run-state`
  - `symphony.console-snapshot`
  - `symphony.console-run`
  - `symphony.console-artifact`
- Include small JSON examples and clarify that v1 changes are additive unless a future `contractVersion` is introduced.

Release evidence completed:

- Added `docs/plans/v8-2-release-evidence-2026-05-22.md` after final verification.
- Recorded final command output summaries, test counts, audit status, and manual console smoke results.
- Documented that the console is local and read-only by default.

## v8.2 Acceptance Criteria

- Existing v8.1 commands still pass their tests.
- Product `--json` keeps existing top-level fields and adds the v8.2 contract envelope.
- `.symphony/runs/latest.json` and `.symphony/runs/<run-id>.json` use `contractName: "symphony.run-state"` for new product runs.
- `symphony console --snapshot --json` works without opening a server.
- `symphony console` binds to `127.0.0.1:8765` by default.
- Console API is GET-only.
- Artifact preview reads only registered `artifactRefs`.
- Artifact preview caps file content at 200 KiB and marks truncation.
- README and release evidence describe the contract and read-only console accurately.

## Release Guardrails

- Do not add npm dependencies for v8.2.
- Do not expose write or execution controls in the console.
- Do not accept arbitrary artifact file paths over HTTP.
- Do not change the default host away from `127.0.0.1`.
- Do not remove or rename existing v8.1 command fields from product `--json`.
- Do not change `mcas` kernel/debug command behavior for this release.
- `v8.2` is now tagged at `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`; GitHub Actions passed for both `main` and `v8.2`.

## Final Verification Recorded

Recorded before the v8.2 commit:

```sh
pnpm check
node --test tests/symphony-cli.test.js
pnpm test
pnpm audit --audit-level high
git diff --check
```

Recorded as the preferred full release gate when available:

```sh
pnpm test:mutation:gate
```

Manual console smoke:

```sh
node scripts/symphony.js console --snapshot --json
node scripts/symphony.js console --host 127.0.0.1 --port 8765
curl http://127.0.0.1:8765/
curl http://127.0.0.1:8765/api/summary
curl http://127.0.0.1:8765/api/runs/latest
curl http://127.0.0.1:8765/api/runs/latest/artifacts/context
```

Expected:

- Root route returns HTML.
- API routes return JSON with contract names.
- Artifact preview returns JSON, text, directory listing, or a safe missing-artifact error.
- POST requests return HTTP 405.

## Completed Git State

- Local `main` is clean and aligned with `origin/main`.
- `HEAD` is `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`.
- `HEAD` has annotated tag `v8.2`.
- `origin/main` points to `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`.
- Remote `v8.2^{}` dereferences to `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`.
- GitHub Actions `main` push run `26281344375` completed with conclusion `success`: https://github.com/Andy20010101/multi-coding-agent-symphony/actions/runs/26281344375
- GitHub Actions `v8.2` tag push run `26282156189` completed with conclusion `success`: https://github.com/Andy20010101/multi-coding-agent-symphony/actions/runs/26282156189
- GitHub CLI authentication was confirmed locally with `gh auth status`, and the Actions runs above were also confirmed with `gh run list --repo Andy20010101/multi-coding-agent-symphony --limit 5`.
