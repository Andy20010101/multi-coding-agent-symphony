Feature: Continuation turns and stall detection

  Scenario: Writer succeeds on second turn after initial verifier failure
    Given a TaskSpec with maxTurns=3
    And the adapter fails verification on turn 1
    And the adapter passes verification on turn 2
    When the orchestrator runs the command
    Then the result is passed with attempts=2
    And the second turn reuses the writer workspace
    And the second turn receives a continuation prompt referencing the prior failure

  Scenario: Terminal adapter failure stops continuation immediately
    Given a TaskSpec with maxTurns=5
    And the adapter returns a policy-denied failure on turn 1
    When the orchestrator runs the command
    Then the result is failed with attempts=1
    And no continuation turn is attempted

  Scenario: maxTurns exhausted reports final failure
    Given a TaskSpec with maxTurns=2
    And the adapter fails verification on all turns
    When the orchestrator runs the command
    Then the result is failed with attempts=2

  Scenario: maxTurns=1 preserves single-turn behavior
    Given a TaskSpec with maxTurns=1
    And the adapter fails verification on turn 1
    And the adapter would pass on turn 2
    When the orchestrator runs the command
    Then the result is failed with attempts=1
    And no continuation prompt is sent

  Scenario: Stall detection kills inactive adapter and retries
    Given a TaskSpec with maxTurns=2 and stallTimeoutMs=30
    And the adapter produces no activity on turn 1
    And the adapter passes verification on turn 2
    When the orchestrator runs the command
    Then the first turn is cancelled with reason stall-timeout
    And the result is passed with attempts=2

  Scenario: Activity resets stall timer
    Given a TaskSpec with stallTimeoutMs=60
    And the adapter produces activity before the stall timeout
    When the orchestrator runs the command
    Then the adapter is not cancelled
    And the result is passed

  Scenario: stallTimeoutMs=0 disables stall detection
    Given a TaskSpec with stallTimeoutMs=0
    And the adapter remains quiet longer than the normal stall timeout
    When the orchestrator runs the command
    Then the adapter is not cancelled
    And the result is passed

  Scenario: checkTaskActive stops continuation when task is cancelled
    Given a TaskSpec with maxTurns=5
    And the adapter fails verification on turn 1
    And checkTaskActive returns false
    When the orchestrator evaluates continuation
    Then no further turns are attempted
    And the result includes reason task-cancelled
