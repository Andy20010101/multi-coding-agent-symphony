Feature: Claude Code real CLI integration

  Scenario: Start Claude Code through a real process runner
    Given a Claude Code adapter configured for real execution
    And a process runner that captures executable, arguments, stdin, and cwd
    When the adapter starts an implement command
    Then the runner receives "claude"
    And the runner receives "-p --output-format stream-json"
    And the prompt is sent through stdin
    And the returned handle is marked as real execution

  Scenario: Verify structured Claude Code stream output
    Given a Claude Code real execution handle with stream-json stdout
    When evidence is collected
    Then the harness-owned task and workspace metadata are applied
    And structured checks are preserved
    And the verifier accepts the evidence when all checks passed

  Scenario: Preserve raw Claude Code output as unverified evidence
    Given a Claude Code real execution handle without structured evidence
    When evidence is collected
    Then stdout and stderr are preserved
    And the evidence contains no passing checks by default
    And the known risks include real CLI output requiring verification
