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
    And the failure reason is verification-insufficient
