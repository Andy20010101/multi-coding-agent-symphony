Feature: Orchestrator policy gate

  Scenario: Block denied policy requests before adapter start
    Given an Orchestrator with a Policy Engine
    And a task requests access to a denied file
    When the Orchestrator runs the command
    Then the run is rejected before adapter start
    And the Session Event Log records the policy decision

