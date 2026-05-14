# ADR 0002: Integrate Harness Through a Protocol Bridge

## Status

Accepted.

## Context

Harness TaskPackets and Symphony TaskSpecs solve adjacent problems. Harness owns project orchestration, worker lifecycle, DAG scheduling, and write-set claims. Symphony owns adapter routing, CLI execution, artifacts, event logs, and evidence verification.

Merging these control planes would make task state harder to reason about and would couple Harness scheduling to Symphony runtime details.

## Decision

Integrate Harness through a protocol bridge:

- Convert validated Harness TaskPackets into Symphony TaskSpecs.
- Store the original TaskPacket as a Symphony artifact.
- Treat TaskPacket verification commands as expected evidence checks.
- Treat TaskPacket write sets as Symphony constraints and as post-run Harness verification gates.
- Write Harness evidence files from Symphony artifact ids and verifier status.
- Keep real external CLI execution gated separately from dry-run bridge validation through `--real`, explicit adapter selection, and adapter-specific `MCAS_RUN_REAL_*` environment gates.

The bridge supports JSON TaskPackets first. YAML support is deferred until the repository has an existing parser or a clear no-dependency parser path.

## Consequences

Positive:

- Harness and Symphony keep separate ownership boundaries.
- Dry-run E2E validation can run without hidden external model execution.
- Harness verification records can cite Symphony artifact ids and event directories.
- Write-set and policy failures are deterministic.

Costs:

- The bridge must keep contract mapping tests in sync with both sides.
- Harness evidence is a projection of Symphony artifacts, so missing evidence mapping is a release blocker.

## Verification

The first accepted slice is the V1.5 dry-run path:

```sh
pnpm test
pnpm check
git diff --check
pnpm mcas doctor
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
```

The gated real lane is validated with injected adapters in unit tests and can be run against a local Codex installation with:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge-real --real --adapter codex
```
