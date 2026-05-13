Feature: Orchestrator dry-run execution flow

  Scenario: Run a command through the orchestrator
    Given a TaskSpec
    And an implement CommandSpec
    And a capable runtime adapter
    When the Orchestrator runs the command
    Then it selects an adapter
    And it allocates a workspace
    And it starts the adapter
    And it writes evidence to the Artifact Store
    And it records verifier output in the Session Event Log

  Scenario: Preserve single-writer ownership through orchestration
    Given a task already ran an implement command
    When the Orchestrator tries to run another implement command for the same task
    Then the run is rejected by the Workspace Manager
    And no second primary writer is created

