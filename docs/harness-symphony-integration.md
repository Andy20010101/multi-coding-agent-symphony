# Harness Symphony Integration

## Purpose

The Harness Bridge lets a Harness `TaskPacket` run through the Symphony workflow without merging the two control planes. It defaults to dry-run execution and exposes gated real CLI lanes for explicit validation.

Harness owns:

- DAG scheduling.
- TaskPacket state.
- Write-set ownership.
- Final worker/task lifecycle.

Symphony owns:

- `TaskSpec` validation.
- Adapter and model routing.
- Runtime artifacts and session events.
- Evidence parsing and verifier status.

## TaskPacket Mapping

| Harness TaskPacket | Symphony behavior |
| --- | --- |
| `id` | `TaskSpec.id` and artifact task id |
| `intent` | `TaskSpec.objective` |
| `acceptance[]` | `TaskSpec.acceptance[]` |
| `write_set[]` | `TaskSpec.constraints[]` entries prefixed with `write_set:` and Harness write-set verification |
| `verification.commands[]` | Expected `EvidencePackage.checks[]` command or name values |
| `repository` | `TaskSpec.repository`, defaulting to `harness-taskpacket` only when omitted |
| `priority` | `TaskSpec.priority`, defaulting to `normal` |
| `policy` | Harness policy config and explicit policy requests before adapter start |
| `run_id` or CLI `--run-id` | Harness evidence path under `.omx/harness/runs/<run-id>` |

The original TaskPacket is stored as the `harness-taskpacket` Symphony artifact. TaskPacket metadata is not added as custom `TaskSpec` fields.

## CLI

```sh
pnpm mcas harness run-taskpacket \
  --run-id fixture-run \
  --taskpacket fixtures/harness/scaffold-taskpacket.json \
  --runtime-dir tmp/harness-bridge
```

The command defaults to dry-run adapter behavior. It returns JSON containing the Harness run id, TaskPacket task id, Symphony workflow status, Harness verifier status, runtime paths, command artifact ids, and Harness evidence paths.

Real CLI execution requires both `--real` and the adapter-specific environment gate:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm mcas harness run-taskpacket \
  --run-id fixture-run \
  --taskpacket fixtures/harness/scaffold-taskpacket.json \
  --runtime-dir tmp/harness-bridge-real \
  --real \
  --adapter codex
```

Supported real adapter values are `codex`, `claude` or `claude-code`, and `kiro` or `kiro-cli`. The corresponding gates are `MCAS_RUN_REAL_CODEX=1`, `MCAS_RUN_REAL_CLAUDE=1`, and `MCAS_RUN_REAL_KIRO=1`. `--timeout-ms <milliseconds>` overrides the adapter timeout for the workflow.
Real lane workspaces are materialized before adapter start so native CLIs receive an existing `--cd` or working directory.

## Evidence Written

For each run, the bridge writes:

- `.omx/harness/runs/<run-id>/evidence-map.json`
- `.omx/harness/runs/<run-id>/verification.md`
- `.omx/harness/runs/<run-id>/summary.json`

The evidence map links Symphony evidence artifact ids, run artifact ids, route decision artifact ids, expected check commands, and runtime directories.
Real lane runs also record `executionMode: "real"` in `evidence-map.json` and `summary.json`.

## Gates

The bridge rejects incomplete TaskPackets before adapter execution when required fields are missing:

- `id`
- `intent`
- non-empty `acceptance[]`
- non-empty `write_set[]`
- non-empty `verification.commands[]`

Harness policy requests are evaluated before adapter start. A denied policy decision is recorded in the Symphony event log and in Harness verification output.

After Symphony finishes, the bridge verifies:

- Symphony workflow status is `passed`.
- Every changed file reported in Symphony evidence matches the TaskPacket write set.
- Every `verification.commands[]` entry appears in each command evidence package checks by `command` or `name`.

Any write-set violation, missing expected check, policy denial, or Symphony verifier failure returns a failed Harness verifier status.
