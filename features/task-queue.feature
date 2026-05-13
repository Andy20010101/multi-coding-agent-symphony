Feature: Task queue

  Scenario: Enqueue and lease tasks in priority order
    Given a Task Queue with concurrency one
    And a normal priority task is queued
    And a high priority task is queued
    When the orchestrator leases the next task
    Then the high priority task is leased first
    And no second task is leased while concurrency is full

  Scenario: Complete a leased task
    Given a leased task
    When the task is completed
    Then the task status is completed
    And another queued task can be leased

  Scenario: Cancel a queued task
    Given a queued task
    When the task is cancelled
    Then the task status is cancelled
    And the task is not leased later

