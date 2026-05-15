Feature: V2 ensemble proposal arbitration synthesis and writer review

  Scenario: Proposal-only mode writes structured ensemble artifacts
    Given a bounded TaskSpec and two agent plan proposals
    When the ensemble runs in proposal-only mode
    Then each proposal is stored as an AgentProposal artifact
    And the arbitrator writes one explainable decision
    And the synthesizer writes one follow-up implementation command
    And the EnsembleRun links the proposal, arbitration, and synthesis artifacts

  Scenario: Arbitration prefers verifier-valid evidence over narrative confidence
    Given one proposal with passing verifier evidence
    And another proposal with stronger confidence text but failed evidence
    When the arbitrator evaluates the proposals
    Then the evidence-backed proposal is selected
    And the rejected proposal has an explicit rejection reason

  Scenario: Arbitration requests follow-up when evidence is insufficient
    Given proposals without passing verifier evidence
    When the arbitrator evaluates the proposals
    Then the decision is needs-followup
    And the required follow-ups describe the missing evidence

  Scenario: Synthesis preserves selected and rejected proposal links
    Given an accepted arbitration decision
    When the synthesizer builds the implementation instruction
    Then the synthesis artifact references the selected proposal
    And it records the rejected tradeoffs
    And it emits a semantic CommandSpec rather than adapter-specific flags

  Scenario: Writer-reviewer mode runs one implementation and one independent review
    Given a bounded TaskSpec, one writer agent, and one reviewer agent
    When the ensemble runs in writer-reviewer mode
    Then the writer runs an implement command in a primary-writer workspace
    And the reviewer runs a review command in a non-writable workspace cloned from the writer
    And the EnsembleRun links writer and reviewer run artifacts
    And the final decision is accepted only after reviewer verification passes

  Scenario: Writer cannot approve its own implementation
    Given a writer agent is also listed as a reviewer
    When the ensemble prepares writer-reviewer mode
    Then the role assignment is rejected before adapter execution

  Scenario: Weak reviewer self-report cannot approve writer output
    Given writer evidence passes
    And reviewer evidence lacks verifier-readable provenance
    When the ensemble runs in writer-reviewer mode
    Then the EnsembleRun decision is rejected
    And the reviewer verification failure is recorded

  Scenario: Parallel lanes execute only with disjoint write sets
    Given a bounded TaskSpec and two write-capable lanes with disjoint write sets
    When the ensemble runs in parallel-lanes mode
    Then each lane runs an implement command in its own writable workspace
    And the EnsembleRun links every lane artifact, route decision, and verifier result
    And overlapping lane write sets are rejected before adapter execution
