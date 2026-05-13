Feature: Phase 3 runtime adapter dry-run foundations

  Scenario: Runtime adapters report stable capabilities
    Given Codex, Claude Code, and Kiro CLI adapters
    When the orchestrator probes each adapter
    Then each capability report includes supported commands
    And each report includes non-interactive support
    And each report includes a log strategy

  Scenario: Codex adapter renders a non-interactive command
    Given an implement CommandSpec
    And a context pack
    When the Codex adapter prepares the run
    Then the prepared run uses "codex exec"
    And the prepared run emits JSONL events
    And the prepared run targets the assigned workspace

  Scenario: Claude Code adapter renders a print-mode command
    Given a review CommandSpec
    And a context pack
    When the Claude Code adapter prepares the run
    Then the prepared run uses "claude -p"
    And the prepared run requests stream JSON output
    And policy-denied tools are passed as disallowed tools

  Scenario: Kiro CLI adapter renders a headless command
    Given a qa CommandSpec
    And a context pack
    When the Kiro CLI adapter prepares the run
    Then the prepared run uses "kiro-cli chat --no-interactive"
    And allowed tools are mapped to Kiro trust tool categories
    And MCP startup can be required for pipeline runs

  Scenario: Adapter failures normalize into the shared taxonomy
    Given a CLI exits because it timed out
    When an adapter normalizes the failure
    Then the failure category is "cli-timeout"
    And the result includes retry metadata

