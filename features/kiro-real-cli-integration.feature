Feature: Kiro CLI real integration

  Scenario: Start Kiro CLI through a real process runner
    Given a Kiro CLI adapter configured for real execution
    And a process runner that captures executable, arguments, stdin, and cwd
    When the adapter starts a qa command
    Then the runner receives "kiro-cli"
    And the runner receives "chat --no-interactive"
    And the prompt is sent through stdin
    And the returned handle is marked as real execution

  Scenario: Verify structured Kiro CLI output
    Given a Kiro CLI real execution handle with structured stdout
    When evidence is collected
    Then the harness-owned task and workspace metadata are applied
    And structured checks are preserved
    And the verifier accepts the evidence when all checks passed

  Scenario: Preserve raw Kiro CLI output as unverified evidence
    Given a Kiro CLI real execution handle without structured evidence
    When evidence is collected
    Then stdout and stderr are preserved
    And the evidence contains no passing checks by default
    And the known risks include real CLI output requiring verification

  Scenario: Guard real Kiro CLI smoke tests
    Given the real Kiro CLI smoke flag is not set
    When the smoke script runs
    Then no model is invoked
    And the script reports how to enable the real smoke

  Scenario: Run a read-only real Kiro CLI smoke test
    Given the real Kiro CLI smoke flag is set
    When the smoke script runs
    Then Kiro CLI runs in real execution mode
    And the command trusts read tools only
    And the verifier accepts the structured smoke evidence
