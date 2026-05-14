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

  Scenario: Run implement then review as a workflow
    Given implement and review CommandSpecs
    And a capable runtime adapter
    When the Orchestrator runs the task workflow
    Then both commands are executed in order
    And the review command receives the implementation evidence artifact reference
    And the review command runs in a non-writable workspace

  Scenario: Stop workflow on verifier failure
    Given implement and review CommandSpecs
    And an implementation command returns insufficient evidence
    When the Orchestrator runs the task workflow
    Then the workflow stops after implementation
    And the failure is recorded as command.failed

  Scenario: Plan retry from workflow failure
    Given implement and review CommandSpecs
    And an implementation command returns insufficient evidence
    When the Orchestrator classifies the workflow failure
    Then it returns the retry plan recommended by the failure taxonomy
    And it records a failure.classified event

  Scenario: Store command run records
    Given implement and review CommandSpecs
    When the Orchestrator runs the task workflow
    Then each command writes a command run record artifact
    And each run record links its evidence artifact and context artifact refs

  Scenario: Hydrate referenced artifacts for later command context
    Given implementation evidence was written by an earlier workflow command
    When the review command context is built
    Then the context includes the referenced implementation evidence content

  Scenario: Run the next persisted queued task
    Given a Task Queue backed by a state file
    And a queued task exists before orchestrator startup
    When the Orchestrator runs the next task workflow
    Then the queued task is leased, executed, and completed

  Scenario: Run a named default command sequence
    Given a TaskSpec
    And the standard command sequence is requested
    When the Orchestrator runs the task workflow
    Then it executes implement, review, and qa in order

  Scenario: Run an implementation-only command sequence
    Given a TaskSpec
    And the implement-only command sequence is requested
    When the Orchestrator runs the task workflow
    Then it executes only implement

  Scenario: Persist retry state for failed queued workflow
    Given a Task Queue backed by a state file
    And a queued task fails verification during workflow execution
    When the Orchestrator records the failed workflow result
    Then the queue record stores failure and retry metadata
    And retryable failures return to queued status
