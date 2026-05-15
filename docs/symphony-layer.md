# Symphony Layer

## Purpose

The V2 Symphony Layer coordinates multiple coding agents inside one bounded task. The implemented modes are `proposal-only` and `writer-reviewer`: agents either submit structured plan proposals for arbitration and synthesis, or one writer produces implementation evidence before independent reviewers inspect it.

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
- `src/ensemble/role-policy.js`

Release gates remain:

```sh
pnpm test
pnpm check
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
```
