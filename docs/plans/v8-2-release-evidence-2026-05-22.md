# v8.2 Release Evidence

Date: 2026-05-22
Status: local verification passed; commit, remote CI, and tag pending
Release target: `v8.2`

## Scope

v8.2 ships the stable product JSON contract and the local read-only Symphony Evidence Console.

- Product `--json` responses keep legacy top-level fields and add `contractVersion`, `contractName`, `contract`, `identity`, `safety`, `workflow`, `artifactRefs`, `action`, and `timestamps`.
- New product run state files are persisted with `contractName: "symphony.run-state"`.
- `symphony console --snapshot --json` reads `.symphony` state and does not start a server.
- `symphony console` binds to `127.0.0.1:8765` by default.
- Console HTTP routes are GET-only; non-GET requests return `405` with `console is read-only`.
- Artifact preview only reads paths already present in the selected run state's `artifactRefs`.
- File artifact preview is capped at 200 KiB and marks `truncated: true`.

## Local Verification

Final release verification commands:

```sh
pnpm check
node --test tests/symphony-cli.test.js
pnpm test
pnpm audit --audit-level high
git diff --check
```

Results:

- `pnpm check`: passed.
- `node --test tests/symphony-cli.test.js`: passed, 29 tests across 4 suites.
- `pnpm test`: passed, 496 tests across 83 suites.
- `pnpm audit --audit-level high`: passed, no known vulnerabilities found.
- `git diff --check`: passed.

## Manual Console Smoke

Commands run:

```sh
node scripts/symphony.js console --snapshot --json
node scripts/symphony.js console --host 127.0.0.1 --port 8765 --json
curl http://127.0.0.1:8765/
curl http://127.0.0.1:8765/api/summary
curl http://127.0.0.1:8765/api/runs/latest
curl http://127.0.0.1:8765/api/runs/latest/artifacts/scaffold-manifest
curl -X POST http://127.0.0.1:8765/api/summary
```

Observed results:

- Snapshot returned `contractName: "symphony.console-snapshot"` and `status: "ready"`.
- Server started on `http://127.0.0.1:8765/`.
- Root route returned HTTP `200` with `text/html; charset=utf-8`.
- `/api/summary` returned `contractName: "symphony.console-snapshot"`.
- `/api/runs/latest` returned `contractName: "symphony.console-run"`.
- `/api/runs/latest/artifacts/scaffold-manifest` returned `contractName: "symphony.console-artifact"`, `format: "json"`, and `truncated: false`.
- `POST /api/summary` returned `message: "console is read-only"`.

## CI Evidence

Remote CI evidence is pending until `main` is pushed and GitHub Actions completes. The `v8.2` tag must not be created until `main` CI is green.
