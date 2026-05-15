# Operational Execution Order

This document is the handoff plan for taking the current V1.5/V2-alpha state from local completion into controlled use.

## Current Usability Position

The project is ready for controlled internal use as a local orchestration kernel and Harness Bridge. It is not yet a fully autonomous production platform.

Ready surfaces:

- TaskPacket to Symphony to Harness evidence flow.
- `proposal-only` ensemble mode.
- `writer-reviewer` ensemble mode.
- Gated real CLI lanes for Codex, Claude Code, and Kiro CLI.
- Continuation turns and stall detection in `orchestrator.runCommand`.

Remaining production gaps:

- README test baseline needs refresh after the continuation-turn tests.
- Local commits need push and CI confirmation before tagging.
- Real CLI behavior still depends on local CLI installs, explicit env gates, and model output quality.
- V2 modes `competitive-patch` and `qa-swarm` are not implemented.

## Execution Order

### Phase 0: Orient

Run:

```sh
git status --short --branch
git log --oneline --decorate -8
```

Expected result:

- Worktree is clean.
- `main` contains the continuation/stall commits.
- No push is performed unless explicitly requested.

Stop if the worktree is dirty with changes that are not part of the current handoff.

### Phase 1: Refresh Release-Facing Docs

Update docs that describe current baseline numbers and release state.

Required edits:

- Refresh README current test baseline count.
- Add a short note that continuation turns and stall detection are implemented.
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

Stop on failure, fix only the failing release-gate issue, then rerun the failed gate and any dependent gates.

### Phase 3: Harness Dry-Run Proof

Run:

```sh
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
pnpm mcas harness run-taskpacket --run-id fixture-writer-reviewer --taskpacket fixtures/harness/writer-reviewer-taskpacket.json --runtime-dir tmp/harness-writer-reviewer --harness-dir tmp/harness-writer-reviewer-output
```

Expected result:

- Both commands return passed verifier status.
- Harness evidence files are written under the selected Harness output paths.
- Writer-reviewer evidence map still links writer and reviewer command artifacts.

Stop if evidence files are missing or Harness verification fails.

### Phase 4: Optional Real CLI Proof

Run only when the matching local CLI is installed and the operator intentionally enables the gate.

Codex first:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:harness:codex:real
```

Optional adapter-specific smokes:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real
```

Expected result:

- Verifier status is `passed`.
- Failure output, if any, includes a diagnostic layer: `schema`, `prompt`, `workspace`, or `expected-check`.
- No raw secrets appear in artifacts.

Stop after the first real-lane failure and record the failing layer before changing code.

### Phase 5: Publish or Tag

Only after Phases 1-3 pass, and Phase 4 is either passed or explicitly marked `not run`.

Recommended release label: `v2-alpha` or `v1.5-v2-alpha`, because V1.5 Harness Bridge and the first V2 ensemble modes are usable, while later V2 modes are incomplete.

Required evidence:

- Commit SHA.
- Local gate results.
- Harness dry-run results.
- Real CLI results or `not run`.
- Known limitations.

### Phase 6: Next Feature Lane

Start this only after the current usable state is pushed or intentionally archived.

Recommended next feature order:

1. `parallel-lanes`, because it extends Harness write-set ownership without competing with the DAG.
2. `qa-swarm`, because it can stay read-only and verifier-focused.
3. `competitive-patch`, because it needs isolated workspace selection and patch adoption rules.

Do not implement automatic routing changes from eval recommendations before release approval exists.

## Prompt For A New Conversation

Use this prompt when handing the repo to a new Codex conversation:

```text
Read docs/operational-execution-order.md and execute it from Phase 0.
Do not start new feature work until Phases 1-3 pass.
Do not run optional real CLI gates unless I explicitly provide the env gate.
Do not push or tag unless I explicitly request it.
Report phase status, changed files, commands run, and any blocked requirement.
```
