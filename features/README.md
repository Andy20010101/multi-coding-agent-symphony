# Features

Behavior scenarios live here when they are stable enough to commit.

Use Gherkin-style scenarios for user-visible or orchestrator-visible behavior:

```gherkin
Feature: Artifact Store

  Scenario: Store and retrieve command evidence
    Given an implementation command finished
    When the adapter writes an evidence package
    Then the Artifact Store can retrieve it by task id
    And the Verifier can read the package without adapter-specific knowledge
```

Early exploratory scenarios may live in task artifacts first, then move here after the behavior stabilizes.

