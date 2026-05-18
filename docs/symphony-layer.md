# Symphony Layer

## Purpose

The V2 Symphony Layer coordinates multiple coding agents inside one bounded task. Implemented modes: `proposal-only`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch`.

This layer does not replace Harness task ownership or Symphony adapter execution. Harness remains authoritative for TaskPackets, DAG state, and write-set locks. Symphony remains authoritative for adapter routing, artifacts, evidence, and verification.

## Proposal-Only Mode

`proposal-only` is read-only by design.

Flow:

1. Store each agent plan as an `AgentProposal` artifact.
2. Arbitrate proposals using evidence status before narrative confidence.
3. Synthesize one follow-up implementation instruction and one semantic `CommandSpec`.
4. Store an `EnsembleRun` artifact linking proposals, arbitration, and synthesis.

The follow-up command is semantic. Adapter-specific flags, CLI names, workspace paths, model switches, and prompt templates stay in adapter mappings and routing policy.

## Writer-Reviewer Mode

`writer-reviewer` uses the existing Symphony execution substrate.

Flow:

1. Run one `implement` command in a `primary-writer` workspace.
2. Run each reviewer as a `review` command in a non-writable workspace cloned from the writer workspace.
3. Pass the writer evidence artifact into reviewer context.
4. Store an `EnsembleRun` artifact linking writer and reviewer evidence, command run records, route decisions, workspaces, and verifier results.

Role rules:

- The writer agent id cannot also appear as a reviewer agent id.
- Reviewer agent ids must be unique.
- The final decision is `accepted` only when writer evidence and every reviewer evidence package pass verifier checks.
- Weak reviewer self-report evidence cannot approve writer output; production review checks still require command-plus-exit-code or artifact provenance.

`EnsembleRun` for `writer-reviewer`:

```json
{
  "version": "1",
  "id": "ensemble-wr",
  "taskId": "task-v2",
  "mode": "writer-reviewer",
  "command": "implement-review",
  "roles": ["writer", "reviewer", "verifier"],
  "writer": {
    "agentId": "codex-writer",
    "adapterId": "codex",
    "evidenceArtifactId": "implement-evidence",
    "runArtifactId": "implement-run",
    "verificationStatus": "passed"
  },
  "reviewers": [
    {
      "agentId": "codex-reviewer",
      "adapterId": "codex",
      "evidenceArtifactId": "review-codex-reviewer-evidence",
      "runArtifactId": "review-codex-reviewer-run",
      "verificationStatus": "passed"
    }
  ],
  "decision": "accepted",
  "finalVerificationStatus": "passed",
  "rejectionReasons": []
}
```

## Parallel-Lanes Mode

`parallel-lanes` runs multiple write-capable implementation lanes only after their Harness-declared write sets are proven disjoint.

Plan and acceptance criteria:

- Validate every lane id, agent id, and lane write set before adapter execution.
- Reject overlapping lane write sets before any adapter starts.
- Run each lane as an `implement` command in a distinct writable `parallel-writer` workspace.
- Preserve lane-level evidence artifact ids, run artifact ids, route decision artifact ids, workspace manifests, write sets, and verifier results in the `EnsembleRun`.
- Accept the run only when every lane verifier result passes.

Non-goals:

- No overlapping write sets.
- No automatic merge of conflicting outputs.
- No replacement of Harness DAG scheduling or final task ownership.

`EnsembleRun` for `parallel-lanes`:

```json
{
  "version": "1",
  "id": "ensemble-parallel",
  "taskId": "task-v2",
  "mode": "parallel-lanes",
  "command": "parallel-implement",
  "roles": ["parallel-writer", "verifier"],
  "lanes": [
    {
      "laneId": "docs-lane",
      "agentId": "codex-docs",
      "adapterId": "codex",
      "writeSet": ["docs/parallel-lanes.md"],
      "evidenceArtifactId": "implement-docs-lane-evidence",
      "runArtifactId": "implement-docs-lane-run",
      "routeDecisionArtifactId": "implement-docs-lane-route-decision",
      "verificationStatus": "passed"
    }
  ],
  "decision": "accepted",
  "finalVerificationStatus": "passed",
  "rejectionReasons": []
}
```

## QA-Swarm Mode

`qa-swarm` runs multiple read-only QA lanes and aggregates their verifier-readable findings.

Plan and acceptance criteria:

- Run each QA lane as a `qa` command in a non-writable review workspace.
- Forbid write-capable QA lane write sets before adapter execution.
- Preserve lane id, agent id, adapter id, evidence artifact id, run artifact id, route decision artifact id, workspace manifest, findings, missing evidence, and verifier result.
- Write aggregate `qa-swarm-findings` and `qa-swarm-missing-evidence` artifacts.
- Require explicit `noFindingRationale` when a QA lane reports no findings.
- Accept the run only when every QA lane verifier result passes.

Non-goals:

- No write-capable QA lanes.
- No swarm vote or majority approval.
- No replacement of Harness DAG scheduling or final task ownership.

`EnsembleRun` records `completionGate: "verifier"`, aggregate findings and missing-evidence artifact ids, `qaLanes[]`, `decision`, `finalVerificationStatus`, and `rejectionReasons`. Each QA lane records lane id, agent id, adapter id, evidence/run/route artifact ids, findings, missing evidence, optional no-finding rationale, and verification status.

## Competitive-Patch Mode

`competitive-patch` runs multiple write-capable candidates against the same bounded fix, then selects exactly one verifier-passing candidate.

Plan and acceptance criteria:

- Validate every candidate id and agent id before adapter execution.
- Run each candidate as an `implement` command in a distinct writable isolated workspace.
- Preserve candidate id, agent id, adapter id, patch artifact id, evidence artifact id, command artifact id, route decision artifact id, workspace manifest, verifier result, selected flag, and rejected reason.
- Select the first verifier-passing candidate in deterministic candidate order when multiple candidates pass.
- Reject the workflow when no candidate has verifier-passing evidence.
- Keep every failed or non-selected candidate artifact for eval replay.
- Keep final completion verifier-gated through `completionGate: "verifier"`.

Non-goals:

- No candidate generation writes the main workspace.
- No writer self-approval or candidate vote can complete the task.
- No patch adoption without verifier-passing evidence.
- No automatic selection from narrative confidence.

`EnsembleRun` records `completionGate: "verifier"`, `selectedCandidateId`, `candidates[]`, `decision`, `finalVerificationStatus`, and `rejectionReasons`. Each candidate records candidate id, agent id, adapter id, patch/evidence/command/route artifact ids, verifier status, selected flag, and rejected reason.

## Artifacts

`AgentProposal`:

```json
{
  "version": "1",
  "kind": "agent-proposal",
  "id": "proposal-codex-planner",
  "agentId": "codex-planner",
  "adapterId": "codex",
  "modelProfile": "gpt-codex-default",
  "role": "planner",
  "taskId": "task-v2",
  "command": "plan",
  "summary": "Plan summary",
  "changes": ["Add BDD scenario"],
  "risks": [],
  "evidenceArtifactId": "codex-planner-plan-evidence",
  "evidenceStatus": "passed"
}
```

`ArbitrationDecision`:

```json
{
  "version": "1",
  "kind": "arbitration-decision",
  "taskId": "task-v2",
  "decision": "accepted",
  "selectedProposalId": "proposal-codex-planner",
  "rejectedProposalIds": ["proposal-kiro-planner"],
  "reasons": ["proposal-codex-planner selected because it includes verifier-passed evidence"],
  "requiredFollowups": [],
  "rejections": [
    {
      "proposalId": "proposal-kiro-planner",
      "reason": "evidence-status-failed"
    }
  ]
}
```

`EnsembleSynthesis`:

```json
{
  "version": "1",
  "kind": "ensemble-synthesis",
  "taskId": "task-v2",
  "sourceProposalId": "proposal-codex-planner",
  "sourceProposalArtifactIds": ["proposal-codex-planner", "proposal-kiro-planner"],
  "rejectedTradeoffs": [
    {
      "proposalId": "proposal-kiro-planner",
      "reason": "evidence-status-failed"
    }
  ],
  "followUpCommand": {
    "name": "implement",
    "version": "1",
    "allowedTools": ["read", "write", "shell", "test"],
    "workspacePolicy": "primary-writer",
    "doneCriteria": ["diff-created", "tests-run", "evidence-written"],
    "evidenceSchema": "implementation-evidence.v1"
  }
}
```

## Approval Rules

- Passing verifier evidence outranks confident narrative text.
- A proposal without passing evidence cannot be selected.
- A competitive patch candidate without passing verifier evidence cannot be selected.
- A competitive patch run selects exactly one candidate and records every rejected or failed candidate.
- A `needs-followup` decision is emitted when no proposal has passing evidence.
- Every selected and rejected proposal receives an explicit reason.
- Synthesis preserves proposal artifact links and rejected tradeoffs.
- Writers still cannot approve final completion; final done remains verifier-gated.

## Verification

The implemented V2 slices are covered by:

- `features/ensemble-workflow.feature`
- `tests/arbitrator.test.js`
- `tests/synthesis.test.js`
- `tests/ensemble-orchestrator.test.js`
- `tests/harness-bridge.test.js`
- `tests/harness-evidence-sink.test.js`
- `src/ensemble/role-policy.js`

Release gates remain:

```sh
pnpm test
pnpm check
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
```
