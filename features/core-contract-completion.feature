Feature: Complete core contract validation

  Scenario: Validate adapter mappings
    Given an AdapterMapping that connects a command to a CLI adapter
    When the contracts module validates the mapping
    Then the mapping is accepted
    And invalid mappings are rejected with typed validation errors

  Scenario: Validate model profiles
    Given a ModelProfile with limits, feature flags, retry policy, and version
    When the contracts module validates the profile
    Then the profile is accepted
    And invalid token limits are rejected with typed validation errors

  Scenario: Validate evidence packages
    Given an evidence package with command metadata and structured checks
    When the contracts module validates the evidence
    Then the evidence is accepted
    And evidence without checks is rejected with typed validation errors

