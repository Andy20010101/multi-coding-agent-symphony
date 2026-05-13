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

  Scenario: Allow only configured shell command patterns
    Given a policy engine with shell allow and deny rules
    When shell command policy decisions are evaluated
    Then exact denied commands override allowed commands
    And matching command patterns are allowed
    And unmatched shell commands are denied

  Scenario: Gate network access through policy decisions
    Given an orchestrator with configured network policy
    When a command requests denied network access
    Then the adapter is not started
    When a command requests allowed network access
    Then the session event log records the network policy decision

  Scenario: Map policy denials to adapter-local permissions
    Given denied path, shell, and network policy decisions
    When Codex, Claude Code, and Kiro CLI prepare a command
    Then each adapter renders the strongest supported local restriction
    And the original CommandSpec is unchanged
