Feature: Harness Bridge execution

  Scenario: Convert a Harness TaskPacket into a Symphony TaskSpec
    Given a Harness TaskPacket with intent, acceptance, write set, and verification commands
    When the Harness Bridge prepares the task for Symphony
    Then the TaskSpec keeps the intent as the objective
    And the TaskSpec keeps every acceptance criterion
    And the write set is preserved as workspace constraints
    And the verification commands are preserved as expected checks

  Scenario: Reject incomplete TaskPackets before adapter execution
    Given a Harness TaskPacket without acceptance criteria
    When the Harness Bridge prepares the task for Symphony
    Then the TaskPacket is rejected
    And no runtime adapter is started

  Scenario: Fail a write-set violation deterministically
    Given a Harness TaskPacket with a claimed write set
    And Symphony evidence reports a changed file outside that write set
    When the Harness Bridge verifies the Symphony result
    Then the Harness verification status is failed
    And the violating file is recorded in Harness evidence

  Scenario: Write Harness verification records after a dry-run
    Given a valid Harness TaskPacket
    And the Symphony dry-run workflow passes
    When the Harness Bridge syncs evidence
    Then the Harness run has an evidence map
    And the Harness run has a verification markdown record
    And the Harness run has a summary file referencing Symphony artifact ids

  Scenario: Run a TaskPacket through a real CLI lane
    Given a valid Harness TaskPacket
    And the user selects the Codex adapter with real execution enabled
    When the Harness Bridge runs the TaskPacket
    Then Symphony starts the adapter with real execution mode
    And the CLI response records the Codex lane
    And Harness evidence records the Codex artifact ids

  Scenario: Run a TaskPacket with a selected command sequence
    Given a valid Harness TaskPacket
    And the implement-only command sequence is selected
    When the Harness Bridge runs the TaskPacket
    Then Symphony executes the implement command only
    And Harness evidence records the implementation artifact

  Scenario: Run a TaskPacket through writer-reviewer ensemble mode
    Given a valid Harness TaskPacket with workflow mode writer-reviewer
    When the Harness Bridge runs the TaskPacket
    Then Symphony executes one writer implementation stage
    And Symphony executes one independent review-only stage
    And Harness evidence maps each stage to its artifact and verification result

  Scenario: Run a TaskPacket through parallel-lanes ensemble mode
    Given a valid Harness TaskPacket with workflow mode parallel-lanes
    And each lane has a disjoint Harness write set
    When the Harness Bridge runs the TaskPacket
    Then Symphony executes each lane in its own writable workspace
    And Harness evidence maps each lane to its artifact and verification result
    And overlapping lane write sets are rejected before adapter execution

  Scenario: Diagnose real smoke failures by contract layer
    Given a real Harness Bridge smoke fails during model evidence verification
    When the Harness Bridge writes verification evidence
    Then the output identifies the failing layer as schema, prompt, workspace, or expected-check

  Scenario: Record policy denial in Symphony and Harness evidence
    Given a Harness TaskPacket whose policy denies a requested write
    When the Harness Bridge runs the TaskPacket
    Then Symphony records the policy decision before adapter start
    And Harness verification records the policy denial
