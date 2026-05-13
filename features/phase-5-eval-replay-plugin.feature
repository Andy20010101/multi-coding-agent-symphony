Feature: Phase 5 external eval replay plugin

  Scenario: Load replay samples from stored artifacts
    Given the Artifact Store contains baseline and candidate run results
    When the Eval Replay plugin loads the sample
    Then it returns task results grouped by task id
    And the plugin does not require runtime adapter state

  Scenario: Build replay samples from prior command artifacts
    Given the Session Event Log references baseline and candidate evidence artifacts
    When the Eval Replay plugin builds a sample from the event log
    Then it reads evidence artifacts from the Artifact Store
    And it normalizes verified status, failure category, command, and task class

  Scenario: Compare model profiles on the same task sample
    Given baseline and candidate results for the same tasks
    When the Eval Replay plugin scores the sample
    Then it reports verified success rate for both variants
    And it reports cost and latency for both variants

  Scenario: Compare replay fixtures by task class
    Given model-upgrade and adapter-regression replay fixtures
    When the Eval Replay plugin scores each fixture
    Then the report includes task-class success rates
    And the report includes task-class failure deltas

  Scenario: Report success and cost tradeoffs
    Given the candidate has higher verified success and higher cost
    When the Eval Replay plugin creates recommendations
    Then the recommendation includes the higher-cost tradeoff
    And the recommendation names affected files and contracts

  Scenario: Qualify resource mismatches
    Given baseline and candidate runs used different resource profiles
    When the Eval Replay plugin scores the sample
    Then the comparison is marked qualified
    And the mismatched resource fields are reported

  Scenario: Preserve resource profile in the eval report
    Given a resource profile with CPU, memory, timeout, concurrency, and network
    When the Eval Replay plugin creates a report
    Then the report includes the resource profile unchanged

  Scenario: Write eval reports as artifacts
    Given the Eval Replay plugin has generated a report
    When the plugin writes the report artifact
    Then the Artifact Store contains the report
    And the written reference includes task id and artifact id

  Scenario: Run eval replay release gate from stored artifacts
    Given the Artifact Store and Session Event Log contain baseline and candidate evidence
    When the eval replay gate command runs for the task sample
    Then it writes an eval report artifact
    And it returns the report artifact reference without changing router config

  Scenario: Recommend changes without mutating core configuration
    Given the candidate has a higher verified success rate
    When the Eval Replay plugin creates recommendations
    Then the report recommends reviewing routing for the candidate
    And the core router configuration is not mutated
