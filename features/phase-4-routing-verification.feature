Feature: Phase 4 routing, workspace, and verification modules

  Scenario: Enforce one primary writer per task
    Given a task already has a primary writer workspace
    When another primary writer workspace is requested for the same task
    Then the Workspace Manager rejects the request
    And the rejection is classified as a workspace conflict

  Scenario: Allow multiple isolated review workspaces
    Given a task has a primary writer workspace
    When two review workspaces are requested for the same task
    Then both review workspaces are allocated
    And neither review workspace is writable by default

  Scenario: Materialize workspace directories
    Given a Workspace Manager with materialization enabled
    When a workspace is allocated
    Then the workspace directory exists
    And a workspace manifest records task id, role, adapter id, writable flag, and path

  Scenario: Cleanup retains workspace artifacts
    Given a materialized workspace with temporary content
    When the workspace is cleaned up
    Then temporary content is removed
    And the workspace manifest and cleanup record remain available

  Scenario: Materialized primary writer lock survives manager restart
    Given a materialized primary writer workspace exists
    When a new Workspace Manager starts for the same root directory
    Then another primary writer for the same task is rejected
    And the workspace lock records the writer ownership

  Scenario: Record workspace lifecycle metadata
    Given a Workspace Manager with materialization enabled
    When a workspace is allocated and cleaned up
    Then the manifest, lock, and cleanup result include lifecycle event ids and timestamps

  Scenario: Clone primary writer workspace for review
    Given a materialized primary writer workspace with implementation content
    When a review workspace is cloned from it
    Then the review workspace contains the implementation content
    And the cloned workspace remains non-writable

  Scenario: Route a command to a capable adapter
    Given capability reports for Codex and Kiro CLI
    When the Router Scheduler routes an implement command
    Then it selects an adapter that supports implement
    And it skips adapters excluded by retry history

  Scenario: Retry retryable adapter failures
    Given an adapter failure classified as retryable
    When the Router Scheduler plans the next attempt
    Then it returns the taxonomy recommended command
    And it keeps the task eligible for retry

  Scenario: Reject unverified model self-report
    Given an evidence package with only an agent summary
    When the Verifier evaluates the evidence
    Then verification fails
    And the failure reason is checks-missing

  Scenario: Reject production checks without provenance
    Given a production evidence package with a passing check but no command or artifact provenance
    When the Verifier evaluates the evidence
    Then verification fails
    And the failure reason is artifact-missing

  Scenario: Reject changed files outside workspace policy
    Given a read-only command evidence package with changed files
    When the Verifier evaluates the evidence
    Then verification fails
    And the failure reason is scope-violation

  Scenario: Reject changed files outside workspace manifest path
    Given a writable command evidence package with changed files outside the workspace root
    When the Verifier evaluates the evidence with the workspace manifest
    Then verification fails
    And the failure reason is scope-violation

  Scenario: Report exact failed checks
    Given an evidence package with one passed check and one failed check
    When the Verifier evaluates the evidence
    Then verification fails
    And the failed check list contains only the failed check

  Scenario: Require implementation diff or no-op rationale
    Given implementation evidence with no changed files and no no-op rationale
    When the Verifier evaluates the evidence
    Then verification fails
    And the required evidence names changed files or no-op rationale

  Scenario: Require review findings or no-finding rationale
    Given review evidence with no findings and no no-finding rationale
    When the Verifier evaluates the evidence
    Then verification fails
    And the required evidence names findings or no-finding rationale

  Scenario: Require QA check artifacts
    Given production QA evidence with command output but no check artifact
    When the Verifier evaluates the evidence
    Then verification fails
    And the failure reason is artifact-missing
