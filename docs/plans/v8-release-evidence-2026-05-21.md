# v8 Prompt-Driven Symphony CLI Release Evidence

Date: 2026-05-21
Status: verified locally

## Scope

Implemented v8 as a product layer over the existing v7 kernel:

- `symphony scan`, `symphony do`, and `symphony verify` aliases.
- Deterministic prompt router for scan, work, review, verify, status, artifacts, continue, and new-project intents.
- `.symphony/context/latest.json`, `.symphony/runs/latest.json`, and `.symphony/runs/<run-id>.json` pointer state.
- `symphony status`, `symphony artifacts [run-id]`, and Symphony-level `symphony continue`.
- `symphony new <target>` with `empty`, `node-cli`, and `web-app` templates.
- `mcas` retained as kernel/debug/CI entrypoint.

## Guardrails

- No npm dependency added.
- Existing `symphony intake`, `symphony work`, `symphony review`, `symphony qa`, `symphony harness`, `symphony replay`, and `mcas` command paths are preserved.
- Prompt routing is deterministic and model-free.
- Product defaults are read-only or dry-run.
- Real execution still requires explicit `--real <adapter>` plus the matching `MCAS_RUN_REAL_*` gate.
- `grill-me-docs` remains optional and dependency-free.
- ArtifactStore remains canonical storage; `.symphony/` stores redacted pointers and summaries only.
- New project bootstrap is limited to three local templates and does not install dependencies.

## Verification

Targeted verification:

```sh
node --test tests/symphony-cli.test.js tests/mcas-cli.test.js
```

Result: passed, 42 tests.

Product command smoke checks:

```sh
pnpm symphony scan
pnpm symphony do --dry-run "inspect README"
pnpm symphony verify --dry-run "inspect README"
pnpm symphony "扫描这个仓库"
pnpm symphony "审查当前改动"
pnpm symphony "修复失败的测试"
pnpm symphony status
pnpm symphony artifacts
pnpm symphony new tmp/v8-demo --template empty --dry-run
pnpm symphony "创建一个新的 node cli 项目" --dry-run
pnpm symphony continue --json
```

Result: passed. One early parallel smoke of `do` and `verify` shared a deterministic Harness run id and failed the `do` process; rerunning sequentially passed after v8 `do` was pinned to `writer-reviewer` while `review` and `verify` stay on `qa-swarm`.

Final verification:

```sh
pnpm check
pnpm test
git diff --check
```

Results:

- `pnpm check`: passed.
- `pnpm test`: passed, 488 tests across 83 suites.
- `git diff --check`: passed.

## v8.1 P0 Release Gates

Recorded during v8.1 release hardening on 2026-05-21 before product behavior changes.

```sh
pnpm test:mutation:gate
```

Result: passed. Stryker completed in 26 minutes 52 seconds with final mutation score 74.31, above the configured break threshold 60.

```sh
pnpm audit --audit-level high
```

Result: passed. pnpm reported no known vulnerabilities.

## v8.1 Release Hardening Evidence

Implemented and verified on 2026-05-21.

Scope completed:

- `symphony scan` default `auto` mode now tries `grill-me-docs` first, falls back to builtin when unavailable, preserves `--builtin` as builtin-only, and preserves `--require-grill` as hard failure.
- Scan JSON now includes `providerMode`, `providerAttempts`, and `providerFallback`.
- Direct `symphony review` and `symphony qa` now route through the v8 product work path; `symphony work --mode qa-swarm` remains the advanced legacy path.
- `symphony qa` preserves the product command while recording `verify` as the semantic command in summaries and proof metadata.
- New-project prompts now produce a deterministic `scaffoldPlan`, `detectedStack`, `projectKind`, `networkInstall: false`, `unsupportedRequests`, and a separate `scaffold-plan` artifact before the scaffold manifest.
- Product-layer scan, new-project, and work run ids include a unique suffix; legacy `symphony work` deterministic run id behavior is unchanged.
- README and `install.sh` now target the existing `v8` tag by default and note `v7` as the historical install target.

Targeted verification:

```sh
node --test tests/symphony-cli.test.js
node --test tests/installer.test.js tests/symphony-cli.test.js
sh -n install.sh
```

Results:

- `node --test tests/symphony-cli.test.js`: passed, 27 tests across 4 suites.
- `node --test tests/installer.test.js tests/symphony-cli.test.js`: passed, 28 tests across 5 suites after the installer default was moved to `v8`.
- `sh -n install.sh`: passed.

Architecture review:

- Independent re-review approved the direct `symphony qa` product path and persisted proof metadata after the semantic command was corrected to `verify`.

Final verification:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
pnpm audit --audit-level high
git diff --check
```

Results:

- `pnpm check`: passed.
- `pnpm test`: passed, 494 tests across 83 suites.
- `pnpm test:mutation:gate`: passed. Stryker completed in 33 minutes 30 seconds with final mutation score 74.22, above the configured break threshold 60; 5 mutants timed out and there were 0 mutation errors.
- `pnpm audit --audit-level high`: passed. pnpm reported no known vulnerabilities.
- `git diff --check`: passed.
