# Post v6 Next Steps

Date: 2026-05-20
Status: v6 curl installer implementation in progress

Note: this document keeps its historical filename so existing handoff prompts still resolve, but the content now tracks the v6 installer work after the published `v5` release.

## Current Released State

`v5` is tagged at commit `69907f0` on `main`.

Implemented workflow modes:

- `linear`
- `proposal-only`
- `writer-reviewer`
- `parallel-lanes`
- `qa-swarm`
- `competitive-patch`

Implemented supporting surfaces:

- User-facing `symphony` CLI identity with package bins for `symphony` and `mcas`.
- Authenticated curl-installable `install.sh` path for global `symphony` and `mcas` shims.
- `symphony doctor`, `symphony harness ...`, and `symphony replay ...` passthroughs to the existing kernel paths.
- `symphony work` dry-run TaskPacket generation into `tmp/symphony-work/<run-id>/` through the existing Harness Bridge.
- `symphony review` and `symphony qa` shortcuts into the qa-swarm Harness Bridge workflow.
- `symphony agent claude /review --dry-run` proof capture without invoking the native Claude CLI, plus gated real passthrough under `MCAS_RUN_REAL_CLAUDE=1`.
- V1.5 Harness Bridge dry-run execution from JSON TaskPackets.
- Harness writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch TaskPacket modes.
- Gated real CLI lanes for Codex, Claude Code, and Kiro CLI.
- Continuation turns and stall detection in `orchestrator.runCommand`.
- External eval replay dispatch for stored artifacts and workflow-mode comparison reports.

Current local state after v6 installer work:

- Branch: `main`.
- HEAD starts from `69907f0` (`v5`, `origin/main`).
- Local working tree contains the v6 curl installer implementation until it is committed.

## Remaining Work Order

### 1. Complete v6 Curl Installer Verification

Goal: verify a user can install global `symphony` and `mcas` shims with a single shell command while keeping `mcas` as the kernel/debug path.

Scope:

- Keep [v6 Curl Installer Plan](plans/v6-curl-installer-plan.md) aligned with implementation.
- Verify `install.sh` and `pnpm symphony` development fallback.
- Verify `symphony work` creates a TaskPacket automatically and calls the Harness Bridge.
- Verify `symphony agent claude /review --dry-run` captures structured proof without invoking Claude.
- Keep direct `pnpm mcas ...` commands documented as advanced/debug paths.

Acceptance:

- `symphony doctor` works after curl install.
- `symphony work --dry-run "inspect README"` runs without a hand-written TaskPacket.
- `symphony agent claude /review --dry-run` captures a proof artifact.
- CI passes the repository-local workflow.

## Required Local Gates

Run after doc or feature changes:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
node scripts/symphony.js doctor
pnpm symphony doctor
```

For a scoped closeout, an operator-approved incremental Stryker gate may replace the full mutation gate temporarily. Record the exact mutation ranges, test files, mutation score, and break threshold. Full mutation remains the preferred release gate before tagging.

Harness dry-run proofs:

```sh
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
pnpm mcas harness run-taskpacket --run-id fixture-writer-reviewer --taskpacket fixtures/harness/writer-reviewer-taskpacket.json --runtime-dir tmp/harness-writer-reviewer --harness-dir tmp/harness-writer-reviewer-output
pnpm mcas harness run-taskpacket --run-id fixture-parallel-lanes --taskpacket fixtures/harness/parallel-lanes-taskpacket.json --runtime-dir tmp/harness-parallel-lanes --harness-dir tmp/harness-parallel-lanes-output
pnpm mcas harness run-taskpacket --run-id fixture-qa-swarm --taskpacket fixtures/harness/qa-swarm-taskpacket.json --runtime-dir tmp/harness-qa-swarm --harness-dir tmp/harness-qa-swarm-output
pnpm mcas harness run-taskpacket --run-id fixture-competitive-patch --taskpacket fixtures/harness/competitive-patch-taskpacket.json --runtime-dir tmp/harness-competitive-patch --harness-dir tmp/harness-competitive-patch-output
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

v5 usability proofs:

```sh
node scripts/symphony.js doctor
pnpm symphony doctor
node scripts/symphony.js work --dry-run "inspect README"
node scripts/symphony.js review --dry-run "inspect README"
node scripts/symphony.js qa --dry-run "inspect README"
node scripts/symphony.js agent claude /review --dry-run
```

## Standing Constraints

- Keep Harness authoritative for DAG state, TaskPackets, write-set locks, worker claims, and final project task state.
- Keep Symphony authoritative for adapter execution, model profiles, evidence parsing, verifier decisions, artifacts, events, and eval replay.
- Do not run optional real CLI gates without explicit `MCAS_RUN_REAL_*` environment gates.
- Do not push or tag unless explicitly requested.
- Do not add dependencies without explicit approval.
- Lock behavior with BDD scenarios and TDD tests before production changes.
- Prefer small reversible changes.

## Prompt For A New Conversation

```text
You are continuing work in the multi-coding-agent-symphony checkout.

Read:
- docs/post-v2-alpha-next-steps.md
- docs/operational-execution-order.md
- docs/symphony-layer.md
- docs/harness-symphony-integration.md

Current state:
- `v5` is tagged at commit 69907f0 on main.
- `proposal-only`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, `competitive-patch`, and eval replay workflow comparisons are implemented.
- v6 curl installer implementation is released: `install.sh` creates global `symphony` and `mcas` shims, pins the default install ref to `v6`, supports the public raw install path, and lets package-script passthroughs run from the installed package root.

Constraints:
- Keep Harness authoritative for DAG and write-set locks.
- Keep Symphony authoritative for adapter execution, artifacts, evidence, and verification.
- Do not run optional real CLI gates unless I explicitly provide MCAS_RUN_REAL_* env gates.
- Do not push or tag unless I explicitly request it.
- Do not add dependencies without explicit approval.
- Lock behavior with tests before implementation changes.

Start with:
git status --short --branch
git log --oneline --decorate -8

Deliver:
- Tests added or updated.
- Implementation changes.
- Commands run and results.
- Any skipped gates and remaining risks.
```
