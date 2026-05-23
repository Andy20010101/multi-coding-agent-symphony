# v8.2 Release Evidence

Date: 2026-05-22
Updated: 2026-05-23
Status: released in git; local verification and GitHub Actions passed
Release tag: `v8.2`
Release commit: `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`

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

Git remote refs and GitHub Actions were checked from this checkout on 2026-05-23:

- `origin/main` points to `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`.
- `origin` has annotated tag `v8.2`; `v8.2^{}` dereferences to `f8dfbb5c7a78e27d0355c026bb94d64a22ddff4d`.
- GitHub Actions `main` push run `26281344375` completed with conclusion `success`: https://github.com/Andy20010101/multi-coding-agent-symphony/actions/runs/26281344375
- GitHub Actions `v8.2` tag push run `26282156189` completed with conclusion `success`: https://github.com/Andy20010101/multi-coding-agent-symphony/actions/runs/26282156189

GitHub CLI authentication was confirmed locally with `gh auth status`, and the Actions runs above were also confirmed with `gh run list --repo Andy20010101/multi-coding-agent-symphony --limit 5`.
