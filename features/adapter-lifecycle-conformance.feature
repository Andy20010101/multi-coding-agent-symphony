Feature: Runtime adapter lifecycle conformance

  Scenario: Adapters expose the required lifecycle methods
    Given a runtime adapter
    When the orchestrator inspects the adapter
    Then the adapter exposes probe, prepare, start, streamEvents, cancel, resume, collectEvidence, normalizeFailure, and cleanup

  Scenario: Dry-run start returns a run handle
    Given a prepared dry-run command
    When the adapter starts the run
    Then the adapter returns a run handle
    And lifecycle events can be streamed for the run

  Scenario: Dry-run evidence is marked insufficient
    Given a dry-run handle
    When the adapter collects evidence
    Then the evidence package contains task and command metadata
    And the evidence package contains no passing checks
    And the known risks include dry-run execution

  Scenario: Dry-run runs can be cancelled and resumed
    Given a dry-run handle
    When the adapter cancels the run
    Then the cancel result records the run id
    When the adapter resumes the run id
    Then a handle for the same run is returned

  Scenario: Cancel active process runner handle
    Given a long-running process started by the Node Process Runner
    When the process handle is cancelled
    Then the result records cancelled status
    And partial stdout is preserved

  Scenario: Cancel active real Codex run
    Given Codex starts a real run in active lifecycle mode
    When the adapter cancels the run handle
    Then cancellation is forwarded to the process handle
    And the adapter run status becomes cancelled
