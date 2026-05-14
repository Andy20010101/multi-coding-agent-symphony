# V1 to V2 Evolution Plan

Date: 2026-05-14
Status: planning artifact
Scope: evolve Multi Coding Agent Symphony from the completed V1 orchestration kernel into a V2 coding-agent symphony layer, with a V1.5 Harness Bridge as the integration step.

## Terms

- Symphony = this repository, currently the coding CLI orchestration kernel.
- Harness = project-level control plane from `$project-orchestration-harness`: TaskPackets, DAG, write-set locks, worker claims, policy gates, and verification records.
- TaskPacket = Harness project task with intent, acceptance, write set, dependencies, and verification commands.
- TaskSpec = Symphony execution task with objective, acceptance, repository, constraints, priority, and source metadata.
- CommandSpec = Symphony semantic command such as `plan`, `implement`, `review`, `fix-ci`, or `qa`.
- EvidencePackage = verifier-readable result from a coding CLI adapter.
- Ensemble = multiple coding agents working on the same bounded problem through proposal, review, arbitration, and synthesis.

## Current V1 Position

V1 is complete as an orchestration kernel.

It provides:

- Validated contracts for tasks, commands, adapters, models, policy, routing, and evidence.
- Durable queue, artifact store, session event log, workspace manager, router, verifier, and failure taxonomy.
- Real adapter paths for Codex, Claude Code, and Kiro CLI, with guarded real smoke checks.
- GitHub issue and PR intake primitives.
- External eval replay plugin.
- Security policy, redaction, and adapter-local permission mapping.
- CLI entrypoints through `pnpm mcas`.

V1 does not yet provide the original full "coding-agent symphony" behavior. It can route commands across coding CLIs, but it does not yet coordinate multiple agents as an ensemble for proposal generation, cross-review, arbitration, and leader synthesis.

## Decision

Evolve in two steps:

1. V1.5: integrate with `$project-orchestration-harness` through a protocol bridge.
2. V2: add the Symphony Layer for multi-agent ensemble collaboration on top of the V1.5 task and evidence boundary.

This avoids building ensemble logic before the project-level task boundary, write-set ownership, and verification records are stable.

## Decision Drivers

1. Keep one owner for each control-plane concern.
2. Preserve V1 contract stability: `TaskSpec`, `CommandSpec`, `AdapterMapping`, `ModelProfile`, and `EvidencePackage`.
3. Avoid turning Symphony into a second project manager competing with Harness DAG and write-set state.
4. Keep model and CLI changes isolated behind profiles, adapter mappings, and eval replay.
5. Make every new collaboration feature verifier-readable and replayable.

## Target Layer Model

```text
GitHub / user request
  -> Harness run
  -> TaskPacket DAG + write-set locks
  -> Harness Bridge
  -> Symphony TaskSpec + CommandSpec
  -> Router/Scheduler
  -> Codex / Claude Code / Kiro CLI adapters
  -> EvidencePackage
  -> Verifier
  -> Harness verification.md + evidence-map.json
  -> V2 ensemble records and eval samples
```

Ownership:

- Harness owns project DAG, TaskPackets, write-set locks, worker claims, and final project task state.
- Symphony owns coding CLI routing, adapter execution, model profiles, evidence parsing, verifier decisions, artifacts, events, and eval replay.
- GitHub owns external issue, PR, comment, and CI surfaces.

## V1.5: Harness Bridge

Goal: make Symphony executable from Harness TaskPackets while keeping the two control planes separate.

### V1.5 Scope

Implement a bridge that supports:

- `TaskPacket -> TaskSpec` conversion.
- `TaskPacket.verification.commands -> EvidencePackage.checks` expectations.
- `TaskPacket.write_set -> workspace and policy constraints`.
- Symphony run results written back to Harness verification files.
- Dry-run end-to-end flow before real external CLI execution.

### V1.5 Non-Goals

- No new ensemble proposal or voting logic.
- No replacement of Harness DAG scheduling.
- No automatic hidden Claude Code execution when visible tmux execution is required by the Harness skill.
- No automatic mutation of model routing rules from eval reports.

### V1.5 Proposed Files

- `docs/harness-symphony-integration.md`
- `docs/adr/0002-integrate-harness-through-protocol-bridge.md`
- `features/harness-bridge.feature`
- `src/integrations/harness-bridge.js`
- `src/integrations/harness-evidence-sink.js`
- `src/integrations/workspace-bridge.js`
- `tests/harness-bridge.test.js`
- `tests/harness-evidence-sink.test.js`
- `scripts/mcas.js`

### V1.5 Contract Mapping

| Harness TaskPacket | Symphony Field |
| --- | --- |
| `id` | `TaskSpec.id` |
| `intent` | `TaskSpec.objective` |
| `acceptance[]` | `TaskSpec.acceptance[]` |
| `write_set[]` | `TaskSpec.constraints[]` plus workspace boundary |
| `dependencies[]` | retained by Harness DAG |
| `verification.commands[]` | expected `EvidencePackage.checks[]` |
| `role` or `lane` | adapter preference or `AdapterMapping` hint |
| `policy` | `PolicyRequest` and `PolicyDecision` |
| `run_id` | runtime session id and Harness evidence sink path |

### V1.5 CLI Shape

Add:

```sh
pnpm mcas harness run-taskpacket \
  --run-id run-001 \
  --taskpacket .omx/harness/runs/run-001/tasks/scaffold.yaml \
  --runtime-dir .mcas
```

Optional later command:

```sh
pnpm mcas harness sync-evidence \
  --run-id run-001 \
  --runtime-dir .mcas
```

### V1.5 Implementation Steps

1. Document the bridge contract.
   - Add the integration doc and ADR.
   - State that Harness owns DAG/write-set/final task state.
   - State that Symphony owns adapter/model/evidence/verifier state.

2. Add BDD scenarios.
   - A TaskPacket with intent and acceptance becomes a valid TaskSpec.
   - A TaskPacket without acceptance is rejected before adapter execution.
   - A write-set violation fails verification.
   - A dry-run Symphony execution writes Harness verification records.
   - A policy denial blocks adapter start and is written into Harness evidence.

3. Implement `harness-bridge`.
   - Parse TaskPacket JSON first.
   - Add YAML support only if the repo already has a parser or a clear no-dependency parser path.
   - Validate required fields before creating a TaskSpec.
   - Preserve original TaskPacket metadata in artifact references, not in ad hoc TaskSpec fields.

4. Implement `HarnessEvidenceSink`.
   - Write `.omx/harness/runs/<run>/evidence-map.json`.
   - Append `.omx/harness/runs/<run>/verification.md`.
   - Write `.omx/harness/runs/<run>/summary.json`.
   - Link Symphony artifact ids and event directories.

5. Add `pnpm mcas harness run-taskpacket`.
   - Run one TaskPacket through the existing orchestrator.
   - Default to dry-run adapter behavior.
   - Return JSON with Harness run id, task id, Symphony status, verifier status, and evidence paths.

6. Add workspace and policy bridge behavior.
   - Convert write sets into workspace constraints.
   - Reject changed files outside the claimed write set.
   - Apply Harness policy first, then Symphony policy.

7. Run dry-run end-to-end validation.
   - Use a sample "create Node CLI project" TaskPacket.
   - Confirm evidence records are written in both `.mcas` and `.omx/harness`.

8. Add gated real CLI validation.
   - Start with Codex through `pnpm mcas harness run-taskpacket --real --adapter codex`.
   - Preserve current opt-in env gates.
   - Keep hidden `claude -p` execution explicitly opt-in when Harness requires visible tmux execution.

### V1.5 Acceptance Criteria

- A valid TaskPacket can be executed through Symphony without losing acceptance, write-set, or verification requirements.
- Invalid TaskPackets fail before model or adapter execution.
- Harness verification files reference Symphony artifact ids and verifier status.
- Write-set violations fail deterministically.
- Policy denials are recorded in both Symphony events and Harness verification output.
- Existing V1 commands and tests keep passing.

### V1.5 Verification

Run:

```sh
pnpm test
pnpm check
git diff --check
pnpm mcas doctor
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
```

Gated real checks:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real
MCAS_RUN_REAL_CODEX=1 pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge-real --real --adapter codex
```

## V2: Coding-Agent Symphony Layer

Goal: add true multi-agent collaboration semantics on top of the V1.5 Harness/Symphony execution boundary.

V2 should make multiple coding agents act as a structured ensemble inside a bounded TaskPacket or command, while keeping final approval tied to verifier evidence.

### V2 Scope

Implement ensemble workflows:

- Multi-agent proposal generation.
- Cross-review between agents.
- Arbitration over conflicting proposals.
- Leader synthesis into one implementation plan or patch request.
- Role-aware model routing.
- Eval-driven recommendation for future routing.

### V2 Non-Goals

- No unrestricted free-form agent chat as a completion signal.
- No writer self-approval.
- No bypass of Harness write-set locks.
- No automatic adoption of eval recommendations without release approval.
- No parallel writes to overlapping write sets.

### V2 Proposed Files

- `docs/symphony-layer.md`
- `features/ensemble-workflow.feature`
- `src/ensemble/ensemble-orchestrator.js`
- `src/ensemble/proposal-registry.js`
- `src/ensemble/arbitrator.js`
- `src/ensemble/synthesis.js`
- `src/ensemble/role-policy.js`
- `tests/ensemble-orchestrator.test.js`
- `tests/arbitrator.test.js`
- `tests/synthesis.test.js`

### V2 Core Concepts

`EnsembleRun`:

```json
{
  "id": "ensemble-001",
  "taskId": "task-123",
  "command": "plan",
  "roles": ["planner", "implementer", "reviewer", "verifier"],
  "proposalArtifactIds": [],
  "reviewArtifactIds": [],
  "synthesisArtifactId": "synthesis-001",
  "decision": "accepted|rejected|needs-followup",
  "version": "1"
}
```

`AgentProposal`:

```json
{
  "agentId": "codex-gpt",
  "adapterId": "codex",
  "modelProfile": "gpt-codex-default",
  "taskId": "task-123",
  "command": "plan",
  "summary": "",
  "changes": [],
  "risks": [],
  "evidenceArtifactId": "artifact-123",
  "version": "1"
}
```

`ArbitrationDecision`:

```json
{
  "taskId": "task-123",
  "selectedProposalId": "proposal-1",
  "rejectedProposalIds": ["proposal-2"],
  "reasons": [],
  "requiredFollowups": [],
  "version": "1"
}
```

### V2 Ensemble Modes

1. `proposal-only`
   - Multiple agents produce plans or approaches.
   - No file writes.
   - Output is arbitration plus synthesis.

2. `writer-reviewer`
   - One writer implements.
   - One or more independent reviewers inspect evidence and diff.
   - Final verifier decides.

3. `parallel-lanes`
   - Multiple agents implement disjoint TaskPackets with non-overlapping write sets.
   - Harness DAG and write-set locks remain authoritative.

4. `competitive-patch`
   - Multiple agents attempt the same bounded fix in isolated workspaces.
   - Arbitrator selects one patch candidate.
   - Verifier runs checks before merge.

5. `qa-swarm`
   - Multiple agents inspect behavior, tests, docs, or edge cases.
   - Output is findings and missing evidence, not direct approval.

### V2 Implementation Steps

1. Add ensemble documentation.
   - Define modes, roles, and final approval rules.
   - Make role separation explicit: writer cannot approve final done.

2. Add BDD scenarios.
   - Two agents produce plan proposals and one synthesis artifact is written.
   - A reviewer rejects weak self-report evidence.
   - Competitive patches run in isolated workspaces.
   - Overlapping write sets are rejected before parallel execution.
   - Eval recommendations influence routing only after approval.

3. Implement proposal storage.
   - Store proposals as artifacts.
   - Link proposals to session events.
   - Preserve adapter id, model profile, role, command, and resource profile.

4. Implement arbitration.
   - Prefer verifier-valid evidence over narrative confidence.
   - Require explicit reasons for selected and rejected proposals.
   - Return `needs-followup` when proposals lack enough evidence.

5. Implement synthesis.
   - Convert selected proposals into one follow-up CommandSpec or implementation instruction.
   - Record rejected tradeoffs.
   - Preserve links to source proposal artifacts.

6. Integrate with Router/Scheduler.
   - Add role-aware routing hints.
   - Support different default models for planner, writer, reviewer, and verifier roles.
   - Keep `ModelProfileRegistry` as the model source of truth.

7. Integrate with Harness Bridge.
   - Run ensemble modes inside one TaskPacket boundary.
   - Use Harness write-set locks for any write-capable lane.
   - Write ensemble summary into Harness evidence records.

8. Add eval capture.
   - Store failed arbitration, low-quality proposal, and verifier rejection cases as replay samples.
   - Compare ensemble modes by verified success rate, cost, latency, retry rate, and failure taxonomy.

### V2 Acceptance Criteria

- Multi-agent proposal generation produces structured artifacts, not only chat transcripts.
- Arbitration decisions are explainable and verifier-readable.
- Synthesis links back to proposal and review artifacts.
- Writer/reviewer/verifier role separation is enforced.
- Parallel execution cannot cross write-set boundaries.
- Eval replay can compare single-agent and ensemble modes.
- Existing V1.5 Harness Bridge remains compatible.

### V2 Verification

Run:

```sh
pnpm test
pnpm check
git diff --check
pnpm mcas doctor
pnpm mcas eval replay -- --artifacts tmp/ensemble/artifacts --events tmp/ensemble/events --reason ensemble-routing
```

Add targeted tests:

- `tests/ensemble-orchestrator.test.js`
- `tests/arbitrator.test.js`
- `tests/synthesis.test.js`
- `tests/harness-bridge.test.js`

## Migration Strategy

Use explicit versions before building a migration subsystem.

Add schema migration only when two live versions must coexist for one of:

- `TaskPacketBridge`
- `EnsembleRun`
- `AgentProposal`
- `ArbitrationDecision`
- `EvidencePackage`

Until then, reject incompatible versions with a clear failure category and artifact reference.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Harness and Symphony both try to schedule tasks | duplicated execution or conflicting state | Harness owns DAG; Symphony owns adapter execution |
| Hidden Claude execution violates Harness visible-lane rule | unobservable real model work | add visible tmux lane or require explicit hidden-execution opt-in |
| Ensemble voting rewards confident weak answers | wrong patch selected | arbitrator must privilege verifier-valid evidence |
| Write-set overlap in parallel lanes | file conflicts or lost work | Harness write-set lock remains authoritative |
| Eval recommendations mutate routing too early | unstable model routing | eval remains advisory until release approval |
| V2 adds abstractions before V1.5 proves task boundary | wasted complexity | implement V1.5 bridge before ensemble modes |

## Recommended Sequence

1. Ship V1.5 Harness Bridge.
2. Prove a dry-run from a "new project" TaskPacket into Harness verification records.
3. Prove one gated real CLI execution through the bridge.
4. Add V2 `proposal-only` mode.
5. Add V2 `writer-reviewer` mode.
6. Add V2 `competitive-patch` mode only after isolated workspace evidence is stable.
7. Add eval replay comparisons for single-agent versus ensemble workflows.

## Done Definition

The evolution is complete when:

- Harness can create project TaskPackets and Symphony can execute them through stable contracts.
- Every completed task has verifier-readable evidence in both Symphony artifacts and Harness verification records.
- V2 ensemble runs produce proposals, reviews, arbitration, synthesis, and final verification artifacts.
- Role separation prevents a writer from approving its own work.
- Model and CLI upgrades are evaluated through external replay before routing changes are approved.
- The normal release gate remains green: `pnpm test`, `pnpm check`, `git diff --check`, `pnpm mcas doctor`.
