Feature: Phase 7 GitHub intake and CI feedback

  Scenario: Convert GitHub issue metadata into a TaskSpec
    Given a GitHub issue with repository, title, body, labels, and creation time
    When GitHub intake converts the issue
    Then the result is a valid TaskSpec
    And it preserves objective, acceptance criteria, priority, source, repository, and created timestamp

  Scenario: Convert GitHub pull request metadata into a review TaskSpec
    Given a GitHub pull request with base and head refs
    When GitHub intake converts the pull request
    Then the result is a valid read-only review TaskSpec
    And it preserves PR number, base ref, head ref, and acceptance criteria
