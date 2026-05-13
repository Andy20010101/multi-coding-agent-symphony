Feature: Phase 2 policy and context modules

  Scenario: Deny sensitive files before adapter execution
    Given a policy that denies secrets and environment files
    When an adapter requests access to ".env"
    Then the Policy Engine returns a deny decision
    And the decision includes a machine-readable reason

  Scenario: Allow safe test commands
    Given a policy that allows project test commands
    When an adapter requests to run "pnpm test"
    Then the Policy Engine returns an allow decision
    And the decision records the matched rule

  Scenario: Store and query adapter capabilities
    Given Codex reports support for plan, implement, and review
    When the Capability Registry stores the report
    Then the report can be queried by adapter id
    And adapters that support implement can be listed

  Scenario: Build a minimal context pack
    Given a TaskSpec
    And selected session events
    And artifact references
    When the Context Builder builds a context pack
    Then the pack includes the task objective
    And the pack includes selected events
    And the pack includes artifact references without embedding full artifact contents

