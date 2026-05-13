Feature: Phase 1 foundation modules

  Scenario: Validate task and command contracts
    Given a TaskSpec with an id, source, repository, objective, acceptance criteria, and version
    And a CommandSpec with a name, version, allowed tools, workspace policy, done criteria, and evidence schema
    When the contracts module validates both specs
    Then both specs are accepted
    And invalid specs are rejected with typed validation errors

  Scenario: Validate optional task metadata
    Given a TaskSpec with constraints, priority, and createdAt metadata
    When the contracts module validates the task
    Then the task is accepted
    And malformed optional metadata is rejected with typed validation errors

  Scenario: Store and retrieve command artifacts
    Given an implementation command produced an evidence package
    When the Artifact Store writes the package for a task
    Then the package can be retrieved by task id and artifact id
    And the stored package is independent of the runtime adapter that wrote it

  Scenario: Append session events in order
    Given a new session event log
    When the orchestrator appends command and verifier events
    Then the log returns events in append order
    And callers cannot mutate previously stored events through returned objects

  Scenario: Classify failures consistently
    Given a known build failure
    When the Failure Taxonomy classifies the failure
    Then the result includes a category
    And the result includes whether the failure is retryable
    And the result includes the recommended next command
