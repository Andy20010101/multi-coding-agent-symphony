# v7 Release Evidence

Date: 2026-05-20
Base tag: `v6`
Scope: project intake workflow, optional intake preflight for `symphony work`, optional `grill-me-docs` provider adapter, and v7 installer default ref.

## Local Gates

Passed:

```sh
node --test tests/project-intake.test.js tests/mcas-cli.test.js tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm mcas intake --project-dir . --runtime-dir tmp/v7-intake-runtime
pnpm symphony intake --project-dir . --output-dir tmp/v7-symphony-intake
pnpm symphony work --preflight-intake --dry-run --work-dir tmp/v7-work "inspect README"
```

Observed results:

- Required targeted Node suite (`tests/project-intake.test.js`, `tests/mcas-cli.test.js`, `tests/symphony-cli.test.js`): 44 tests passed.
- Adapter parity regression suite (`tests/claude-real-cli.test.js`, `tests/kiro-real-cli.test.js`, `tests/codex-real-cli.test.js`, plus v7 CLI tests): 72 tests passed.
- `pnpm check`: passed with `src/intake/*.js` included.
- `pnpm test`: 42 test files passed after the bounded-read cleanup.
- `pnpm audit --audit-level high`: passed after sandbox escalation; no known vulnerabilities found.
- `pnpm mcas intake`: wrote `tmp/v7-intake-runtime/artifacts/project-intake/project-context.json` and `intake-summary.json`; status `passed`; `modelInvocation: false`; recommended workflow `writer-reviewer`.
- `pnpm symphony intake`: wrote `tmp/v7-symphony-intake/symphony-intake-multi-coding-agent-symphony-48f4cda31c6b/runtime/artifacts/project-intake/project-context.json`; status `passed`; `modelInvocation: false`.
- `pnpm symphony work --preflight-intake`: status `passed`; verifier status `passed`; output included intake context and summary artifact paths.

Mutation gate:

```sh
pnpm test:mutation:gate
```

Result: passed. Final mutation score `74.22`; break threshold `60`; killed `1763`; timed out `5`; survived `488`; no errors; no coverage `126`. Stryker completed in 24 minutes and 47 seconds.

## Fixes Found During Release Closure

- Real intake smoke exposed a `NodeProcessRunner` stdin `EPIPE` crash when `git` exited before reading stdin. The runner now ignores expected stdin pipe closure errors, and `tests/process-runner.test.js` covers the regression.
- The first cleanup pass found that `readTextFileLimited` sliced after reading the full file. It now reads at most the configured byte cap for oversized text files, and `tests/project-intake.test.js` covers the boundary.
- Independent architect review found that Claude and Kiro dropped TaskSpec constraints from their shared prompt path. `src/adapters/base-adapter.js` now renders constraints and required verification commands, with Claude/Kiro prompt regressions in `tests/claude-real-cli.test.js` and `tests/kiro-real-cli.test.js`.
- `install.sh` now defaults `MCAS_INSTALL_REF` to `v7`.
- `package.json` `pnpm check` now includes `src/intake/*.js`.

## CI And Release

Pending until after commit, `main` push, tag push, GitHub Actions completion, and Release v7 creation.

## Known Release Notes

- The root checkout does not currently include a physical `AGENTS.md`, so this repository's self-intake reports one medium workflow/documentation risk and one open question.
- `grill-me-docs` remains optional. Selecting it without the binary records `providerStatus: "unavailable"` and exits `0`; adding `--require-provider` returns usage exit `64`.
- Mutation testing remains scoped to the configured core files in `stryker.config.mjs`; new intake modules are covered by targeted Node tests and CLI smoke gates.
