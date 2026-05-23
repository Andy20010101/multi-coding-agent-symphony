# v9 Release Evidence

Date: 2026-05-23
Status: local verification passed; commit, push, CI, and `v9` tag pending
Release target: `v9`

## Scope

v9 ships the local read-only Symphony Workbench:

- `GET /api/readiness` for local tool, git, GitHub, CI, and real CLI gate status.
- `GET /api/runs/<run-id>/timeline` for derived run timelines.
- Additive console fields: `artifactHealth`, `timeline`, and `recommendedCommands[]`.
- A redesigned `Symphony Workbench` UI with readiness, latest run health, copy-only command guidance, timeline, run details, and artifact preview.

The release does not add browser-triggered execution, project writes, arbitrary artifact path reads, or `symphony do --write`.

## Local Verification

Commands run from `/Users/andy/Documents/project/multi-coding-agent-symphony`:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm mcas doctor
pnpm test:mutation:gate
```

Observed results:

- `node --test tests/symphony-cli.test.js`: passed, 30 tests.
- `pnpm check`: passed.
- `pnpm test`: passed, 497 tests.
- `git diff --check`: passed.
- `pnpm audit --audit-level high`: exit 0; one moderate advisory remains.
- `pnpm mcas doctor`: returned `status: "ok"`.
- `pnpm test:mutation:gate`: passed; mutation score 74.27, break threshold 60, 2382 mutants instrumented, 1763 killed, 6 timed out, 492 survived, 121 no coverage.

## Manual Console Smoke

Started the console locally with:

```sh
pnpm symphony console --port 0 --json
```

Observed results:

- Browser rendered `Symphony Workbench`.
- Dashboard showed latest run state, readiness, git state, and registered artifacts.
- Readiness showed Node.js, pnpm, git, and GitHub as available without token values.
- Timeline and copy-only command sections rendered.
- `GET /api/readiness` returned `contractName: "symphony.console-readiness"`, `readOnly: true`, and `modelInvocation: false`.
- `GET /api/runs/latest/timeline` returned `contractName: "symphony.console-run-timeline"`.
- `POST /api/summary` returned HTTP `405` with `message: "console is read-only"`.

## CI Evidence

GitHub Actions evidence is pending until `main` and the `v9` tag are pushed.
