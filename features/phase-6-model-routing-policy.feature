Feature: Phase 6 model profiles and routing policy

  Scenario: Persist and query model profiles
    Given model profiles with different cost classes
    When the Model Profile Registry reloads from disk
    Then it can retrieve profiles by id
    And it can query profiles by cost class and structured-output capability

  Scenario: Persist and query adapter mappings by capability
    Given adapter mappings and capability reports for multiple coding CLIs
    When the Adapter Mapping Registry reloads from disk
    Then it can find mappings for a command
    And it excludes mappings whose adapter is unavailable or explicitly excluded

  Scenario: Route with failure history and model policy
    Given multiple capable adapters and model profiles for the same command
    When the router receives retryable adapter failure history
    Then it skips the failed adapter
    And it chooses the lower-cost review model when capability is equal
    And an explicit model override beats the default profile

  Scenario: Persist route decision artifacts
    Given the orchestrator selects an adapter and model profile
    When it runs the command
    Then it writes a route decision artifact
    And the command run record references the route decision artifact
