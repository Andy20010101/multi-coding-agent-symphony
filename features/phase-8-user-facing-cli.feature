Feature: Phase 8 user-facing CLI

  Scenario: Run the CLI doctor command
    Given the project CLI is available
    When the user runs the doctor command
    Then it prints a JSON health summary
    And it exits with code 0

  Scenario: Read a GitHub issue through the CLI without invoking a model
    Given an injected command runner returns JSON from gh issue view
    When the user runs the GitHub issue intake command
    Then it calls gh with repository, issue number, and JSON fields
    And it prints a validated TaskSpec wrapped as read-only intake output
