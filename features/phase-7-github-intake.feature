Feature: Phase 7 GitHub intake and CI feedback

  Scenario: Convert GitHub issue metadata into a TaskSpec
    Given a GitHub issue with repository, title, body, labels, and creation time
    When GitHub intake converts the issue
    Then the result is a valid TaskSpec
    And it preserves objective, acceptance criteria, priority, source, repository, and created timestamp
