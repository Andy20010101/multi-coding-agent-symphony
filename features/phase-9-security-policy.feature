Feature: Phase 9 security, redaction, and policy enforcement

  Scenario: Redact secret-looking artifact output before persistence
    Given an artifact contains token-looking strings and sensitive env file paths
    When the artifact store writes the artifact
    Then the stored artifact does not contain the raw token or env path
    And the caller's original artifact object is not mutated

  Scenario: Redact secret-looking session event payloads before persistence
    Given a session event payload contains authorization headers and sensitive env file paths
    When the session event log appends the event
    Then the persisted event does not contain the raw token or env path
    And the returned event payload is redacted

  Scenario: Deny sensitive file paths before adapter start
    Given an orchestrator with the default policy engine
    When a command requests access to a sensitive file path
    Then the policy decision denies the path
    And the adapter is not started
