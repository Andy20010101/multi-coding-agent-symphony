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
