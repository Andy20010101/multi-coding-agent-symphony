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

  Scenario: Normalize GitHub check runs into a CI status artifact
    Given GitHub check runs for a pull request head SHA
    When GitHub intake normalizes the check runs
    Then the artifact records status, conclusion, URLs, and failing check names

  Scenario: Fetch a GitHub issue through gh
    Given an injected command runner returns JSON from gh issue view
    When GitHub intake fetches the issue
    Then it calls gh with repository, issue number, and JSON fields
    And it returns a validated TaskSpec

  Scenario: Fetch a GitHub pull request and CI status through gh
    Given an injected command runner returns JSON from gh pr view and gh api check-runs
    When GitHub intake fetches the pull request and CI status
    Then it calls gh with repository, PR number, and check-run API path
    And it returns a validated review TaskSpec and CI status artifact
