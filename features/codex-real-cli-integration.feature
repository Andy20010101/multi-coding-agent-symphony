Feature: Codex real CLI integration

  Scenario: Start Codex through a real process runner
    Given a Codex adapter configured for real execution
    And a process runner that captures executable, arguments, stdin, and cwd
    When the adapter starts an implement command
    Then the runner receives "codex"
    And the runner receives "exec --json"
    And the prompt is sent through stdin
    And the returned handle is marked as real execution

  Scenario: Convert Codex JSONL output into adapter events
    Given a Codex real execution handle with JSONL stdout
    When lifecycle events are streamed
    Then Codex events from stdout are exposed as tool-observed adapter events
    And the command finished event includes the process exit code

  Scenario: Preserve real Codex output as unverified evidence
    Given a Codex real execution handle
    When evidence is collected
    Then stdout and stderr references are preserved
    And the evidence contains no passing checks by default
    And the known risks include real CLI output requiring verification

  Scenario: Verify structured Codex final output
    Given a Codex real execution handle with a final JSON EvidencePackage
    When evidence is collected
    Then the harness-owned task and workspace metadata are applied
    And the structured checks are preserved
    And the verifier accepts the evidence when all checks passed
