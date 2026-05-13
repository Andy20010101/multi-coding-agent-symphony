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
