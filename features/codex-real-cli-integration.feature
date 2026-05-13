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

  Scenario: Guard real model smoke tests
    Given the real Codex smoke flag is not set
    When the smoke script runs
    Then no model is invoked
    And the script reports how to enable the real smoke

  Scenario: Run a read-only real model smoke test
    Given the real Codex smoke flag is set
    When the smoke script runs
    Then Codex runs in real execution mode
    And the workspace policy is read-only
    And the verifier accepts the structured smoke evidence

  Scenario: Resolve Codex model profiles before CLI execution
    Given a Codex adapter configured with project model profile mappings
    When the adapter prepares a real CLI command
    Then profile ids can map to concrete Codex CLI model names
    And profile ids can defer model selection to the Codex CLI config

  Scenario: Render command-specific Codex prompts
    Given Codex prepares implement, review, and qa commands
    When the prompts are rendered
    Then each prompt contains command-specific role guidance
    And each prompt still requests verifier-readable evidence

  Scenario: Capture Codex raw execution artifacts
    Given Codex real execution emits JSONL stdout, stderr, parsed events, and a final message
    When the orchestrator stores command results
    Then raw JSONL, stderr, parsed events, and final message are written as artifacts
    And the command run record links those artifacts

  Scenario: Map structured Codex error events
    Given Codex real execution emits a structured error event
    When the adapter normalizes the failed run
    Then permission errors map to permission-denied
    And off-task errors map to model-off-task
    And unknown structured errors map to adapter-crashed
