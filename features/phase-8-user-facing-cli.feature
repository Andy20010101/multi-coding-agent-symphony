Feature: Phase 8 user-facing CLI

  Scenario: Run the CLI doctor command
    Given the project CLI is available
    When the user runs the doctor command
    Then it prints a JSON health summary
    And it exits with code 0

  Scenario: Read a GitHub issue through the CLI without invoking a model
    Given an injected command runner returns JSON from gh issue view
    When the user runs the GitHub issue intake command
    Then it calls gh with repository, issue number, and JSON fields
    And it prints a validated TaskSpec wrapped as read-only intake output

  Scenario: Queue a manual task through the CLI
    Given a configured task queue state file
    When the user runs the manual task queue command
    Then it persists a validated TaskSpec
    And it prints the queued task id and lifecycle event id

  Scenario: Run the next queued task through the CLI
    Given a persisted queued task and runtime directories
    When the user runs the run-next command
    Then the CLI runs the existing dry-run workflow
    And it prints command artifact ids and verifier status

  Scenario: Return nonzero when run-next fails verification
    Given a persisted queued task and failing verifier evidence
    When the user runs the run-next command
    Then the CLI returns a verifier failure exit code
    And it leaves the task queued with retry metadata

  Scenario: Run a TaskSpec file through the CLI
    Given a TaskSpec JSON file and runtime directories
    When the user runs the run-task command
    Then the CLI runs the existing dry-run workflow without queue state
    And it prints command artifact ids and verifier status

  Scenario: Dispatch smoke checks through the CLI
    Given an injected command runner for package scripts
    When the user runs smoke checks for Codex, Claude Code, and Kiro CLI
    Then the CLI calls the existing package smoke scripts
    And it propagates smoke command exit codes

  Scenario: Dispatch eval replay through the CLI
    Given an injected command runner for package scripts
    When the user runs eval replay with pass-through arguments
    Then the CLI calls the existing eval replay package script
    And it propagates eval replay exit codes

  Scenario: Load runtime defaults from CLI config
    Given a JSON config file with queue, artifact, event, and workspace paths
    When the user runs a workflow command without path flags
    Then the CLI uses config defaults
    And explicit path flags override the config file
