# Post v2-beta Next Steps

Date: 2026-05-16
Status: active handoff plan after `v2-beta` plus local workflow closeout and eval replay comparison work

Note: this document keeps its historical filename so existing handoff prompts still resolve, but the content reflects the post-`v2-beta` state.

## Current Released State

`v2-beta` is tagged at commit `53fbb49` on `main`.

Implemented workflow modes:

- `linear`
- `proposal-only`
- `writer-reviewer`
- `parallel-lanes`
- `qa-swarm`
- `competitive-patch`

Implemented supporting surfaces:

- V1.5 Harness Bridge dry-run execution from JSON TaskPackets.
- Harness writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch TaskPacket modes.
- Gated real CLI lanes for Codex, Claude Code, and Kiro CLI.
- Continuation turns and stall detection in `orchestrator.runCommand`.
- External eval replay dispatch for stored artifacts and workflow-mode comparison reports.

Current local state at handoff start:

- Branch: `main`.
- HEAD: `53fbb49` (`v2-beta`, `origin/main`).
- Local working tree contains the intentional workflow closeout and eval replay comparison changes.

## Remaining Work Order

### 1. Package Release Candidate Evidence

Goal: package the post-`v2-beta` closeout with local gates, Harness dry-run proof, eval replay comparison artifacts, and CI confirmation before any tag.

Scope:

- Run required local gates and record command output.
- Run five Harness dry-run proofs and the workflow comparison fixture proof.
- Keep optional real CLI smoke disabled unless the operator provides `MCAS_RUN_REAL_*`.
- Keep recommendations advisory until a release approval explicitly adopts them.

Acceptance:

- Release evidence names commit SHA, changed docs/tests/artifacts, and skipped gates.
- CI passes the repository-local workflow.
- Real CLI proof is either passed with explicit gates or recorded as `not run`.

## Required Local Gates

Run after doc or feature changes:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
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
You are continuing work in /home/administrator/code/multi-coding-agent-symphony.

Read:
- docs/post-v2-alpha-next-steps.md
- docs/operational-execution-order.md
- docs/symphony-layer.md
- docs/harness-symphony-integration.md

Current state:
- `v2-beta` is tagged at commit 53fbb49 on main.
- `proposal-only`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, `competitive-patch`, and eval replay workflow comparisons are implemented.
- Next intended task is release candidate packaging plus CI proof.

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
