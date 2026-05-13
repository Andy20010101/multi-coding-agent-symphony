Feature: Phase 5 external eval replay plugin

  Scenario: Load replay samples from stored artifacts
    Given the Artifact Store contains baseline and candidate run results
    When the Eval Replay plugin loads the sample
    Then it returns task results grouped by task id
    And the plugin does not require runtime adapter state

  Scenario: Compare model profiles on the same task sample
    Given baseline and candidate results for the same tasks
    When the Eval Replay plugin scores the sample
    Then it reports verified success rate for both variants
    And it reports cost and latency for both variants

  Scenario: Preserve resource profile in the eval report
    Given a resource profile with CPU, memory, timeout, concurrency, and network
    When the Eval Replay plugin creates a report
    Then the report includes the resource profile unchanged

  Scenario: Recommend changes without mutating core configuration
    Given the candidate has a higher verified success rate
    When the Eval Replay plugin creates recommendations
    Then the report recommends reviewing routing for the candidate
    And the core router configuration is not mutated

