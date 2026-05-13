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

  Scenario: Recover task queue state after restart
    Given a Task Queue backed by a state file
    And a task was completed before restart
    When a new Task Queue opens the same state file
    Then the completed task is still completed
    And queued tasks can still be leased

  Scenario: Recover expired running leases
    Given a Task Queue backed by a state file
    And a running task lease has expired
    When the queue recovers expired leases
    Then the task returns to queued status
    And the next lease increments its attempt count

  Scenario: Cancel a queued task
    Given a queued task
    When the task is cancelled
    Then the task status is cancelled
    And the task is not leased later
