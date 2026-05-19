# Operational Execution Order

This document is the handoff plan for taking the current `v3` release plus local real CLI risk-closure changes from local completion into controlled use.

## Current Usability Position

The project is ready for controlled internal use as a local orchestration kernel and Harness Bridge. It is not yet a fully autonomous production platform.

Ready surfaces:

- TaskPacket to Symphony to Harness evidence flow.
- Ensemble modes: `proposal-only`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch`.
- Gated real CLI lanes for Codex, Claude Code, and Kiro CLI.
- Continuation turns and stall detection in `orchestrator.runCommand`.

Remaining production gaps:

- Local commits need CI confirmation before the next release tag.
- Real CLI behavior still depends on local CLI installs, explicit env gates, provider/auth alignment, and model output quality.
- Claude real smoke proof must record requested and observed model profiles so local provider/model mapping remains auditable.

## Execution Order

### Phase 0: Orient

Run:

```sh
git status --short --branch
git log --oneline --decorate -8
```

Expected result:

- Worktree is clean, or contains only the intentional risk-closure changes being verified.
- `main` is based on `89d07f2` (`v3`) before local risk-closure changes.
- No push is performed unless explicitly requested.

Stop if the worktree is dirty with changes that are not part of the current handoff.

### Phase 1: Refresh Release-Facing Docs

Update docs that describe current baseline numbers and release state.

Required edits:

- Refresh README current test baseline count.
- Ensure release-facing docs list `proposal-only`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch` as implemented workflow modes.
- Ensure proof docs include scaffold, writer-reviewer, parallel-lanes, qa-swarm, competitive-patch, and eval replay comparison fixture commands.
- If creating a release artifact, add release evidence with commit SHA and gates run.

Do not add new feature work in this phase.

### Phase 2: Local Release Gates

Run:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
```

Expected result: every command exits with code `0`.

If an operator explicitly approves an incremental mutation gate for a scoped closeout, record the exact Stryker mutation ranges, test files, score, and break threshold. A full `pnpm test:mutation:gate` remains the release default before tagging.

Stop on failure, fix only the failing release-gate issue, then rerun the failed gate and any dependent gates.

### Phase 3: Harness Dry-Run Proof

Run:

```sh
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
pnpm mcas harness run-taskpacket --run-id fixture-writer-reviewer --taskpacket fixtures/harness/writer-reviewer-taskpacket.json --runtime-dir tmp/harness-writer-reviewer --harness-dir tmp/harness-writer-reviewer-output
pnpm mcas harness run-taskpacket --run-id fixture-parallel-lanes --taskpacket fixtures/harness/parallel-lanes-taskpacket.json --runtime-dir tmp/harness-parallel-lanes --harness-dir tmp/harness-parallel-lanes-output
pnpm mcas harness run-taskpacket --run-id fixture-qa-swarm --taskpacket fixtures/harness/qa-swarm-taskpacket.json --runtime-dir tmp/harness-qa-swarm --harness-dir tmp/harness-qa-swarm-output
pnpm mcas harness run-taskpacket --run-id fixture-competitive-patch --taskpacket fixtures/harness/competitive-patch-taskpacket.json --runtime-dir tmp/harness-competitive-patch --harness-dir tmp/harness-competitive-patch-output
```

Expected result:

- All five commands return passed verifier status.
- Harness evidence files are written under the selected Harness output paths.
- Mode-specific evidence is preserved for writer/reviewer roles, lane write sets, QA findings and missing evidence, and competitive selected/rejected candidates.

Stop if evidence files are missing or Harness verification fails.

### Phase 3.5: Eval Replay Comparison Proof

Run:

```sh
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

Expected result: the command exits `0`, writes a report artifact path, lists linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch modes, and marks missing cost/resource profiles as unknown rather than fabricated.

### Phase 4: Optional Real CLI Proof

Run only when the matching local CLI is installed and the operator intentionally enables the gate.

Codex first:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm mcas doctor --real-cli --adapter codex --require-gates --proof-dir tmp/real-cli-proofs
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:harness:codex:real
```

Optional adapter-specific smokes:

```sh
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:kiro:real
```

Expected result:

- `doctor --real-cli` records CLI version, gate status, model source, provider, and proof path without invoking a model.
- Verifier status is `passed`.
- Real smoke proof artifacts contain run id, model profile, provider, evidence path, verifier status, and resource profile when recorded.
- Claude real smoke proof artifacts additionally contain requested/observed model profile diagnostics so local Claude settings that remap the requested model are explicit.
- Failure output, if any, includes a diagnostic layer: `schema`, `prompt`, `workspace`, or `expected-check`.
- No raw secrets appear in artifacts.

Stop after the first real-lane failure and record the failing layer before changing code.

### Phase 5: Publish or Tag

Only after Phases 1-3.5 pass, and Phase 4 is either passed or explicitly marked `not run`.

Recommended release label should be chosen after local gates and CI confirmation. Do not reuse `v3`; `v3` already tags commit `89d07f2`, and the next tag should describe the real CLI proof/risk-closure scope or the next approved release scope.

Required evidence:

- Commit SHA.
- Local gate results.
- Harness dry-run results.
- Real CLI doctor and smoke proof paths, or `not run`.
- Known limitations.

### Phase 6: Next Feature Lane

Start this only after the current usable state is pushed or intentionally archived.

Recommended next feature order:

1. Commit and push the real CLI risk-closure changes when release approval exists.
2. Confirm CI proof for that pushed risk-closure commit.

Do not implement automatic routing changes from eval recommendations before release approval exists.

## Prompt For A New Conversation

Use this prompt when handing the repo to a new Codex conversation:

```text
Read docs/operational-execution-order.md and execute it from Phase 0.
Confirm the docs reflect `v3` plus real CLI proof diagnostics, then verify Phases 1-3.5 before any new release packaging.
Do not run optional real CLI gates unless I explicitly provide the env gate.
Do not push or tag unless I explicitly request it.
Report phase status, changed files, commands run, and any blocked requirement.
```
