# Continuation Turns and Stall Detection

Date: 2026-05-14
Status: approved
Source: OpenAI Symphony SPEC.md (Section 7.1, 8.5)

## Problem

The current orchestrator executes each adapter command exactly once. If the writer fails (tests don't pass, incomplete implementation), the entire ensemble run rejects immediately. There is also no mechanism to detect and recover from a stalled adapter process.

## Solution

Add two mechanisms borrowed from OpenAI Symphony's worker model:

1. **Continuation turns**: a command can retry within the same session/workspace up to `maxTurns` times before reporting final status.
2. **Stall detection**: if an adapter produces no activity events for `stallTimeoutMs`, the run is killed and retried.

## Continuation Turns

### Behavior

When `orchestrator.runCommand` is called:

1. Execute the adapter once (turn 1) with the full rendered prompt.
2. If verification passes → return success.
3. If failure is terminal (policy-denied, workspace-violation, adapter-not-found) → return failure.
4. Otherwise, check whether the task is still active (optional `checkTaskActive` callback).
5. If still active and `attempt < maxTurns`, start a continuation turn with:
   - The same workspace (preserving file state from prior turn).
   - A continuation prompt: prior failure reason + "continue and fix".
   - `isContinuation: true` flag so the adapter knows not to start fresh.
6. Repeat until success, terminal failure, or `maxTurns` exhausted.

### Configuration

```json
{
  "execution": {
    "maxTurns": 5,
    "turnTimeoutMs": 3600000
  }
}
```

- `maxTurns` can be set per CommandSpec or per TaskSpec. Default: `5`.
- `turnTimeoutMs` is the hard timeout for a single turn. Default: `3600000` (1 hour).

### Continuation Prompt

Continuation turns do not resend the original task prompt. They send:

```
Previous attempt failed: <verification.reason>
Evidence: <summary of what was produced>
Continue from the current workspace state and resolve the failure.
```

### Integration with Ensemble

```
EnsembleOrchestrator.runWriterReviewer
  → orchestrator.runCommand(writer, maxTurns=5)
      turn 1: implement → tests fail
      turn 2: fix tests → passed ✅
  → orchestrator.runCommand(reviewer, maxTurns=3)
      turn 1: review → passed ✅
  → decision: accepted
```

The writer gets multiple chances to succeed before the ensemble rejects.

## Stall Detection

### Behavior

While an adapter is executing:

1. Track `lastActivityTimestamp`, updated whenever the adapter emits any event.
2. A periodic check runs every `stallTimeoutMs / 3` (capped at 60s).
3. If `now - lastActivityTimestamp > stallTimeoutMs`:
   - Kill the adapter process.
   - Mark the turn as `stalled`.
   - If continuation turns remain, retry as a continuation turn.
   - If no turns remain, report failure with reason `stall-timeout`.

### Configuration

```json
{
  "execution": {
    "stallTimeoutMs": 300000
  }
}
```

- Default: `300000` (5 minutes).
- Set to `0` to disable stall detection.

### Adapter Activity Events

Adapters report activity through an `onActivity` callback during execution. Any of these count as activity:

- Stdout/stderr output from the CLI process
- File system changes in the workspace
- Explicit progress events from the adapter protocol

## Implementation Files

| File | Change |
|------|--------|
| `src/orchestrator.js` | Add turn loop and stall detection to `runCommand` |
| `src/contracts.js` | Add `execution` field validation to TaskSpec/CommandSpec |
| `docs/core-contracts.md` | Document `execution` fields |
| `features/continuation-turns.feature` | BDD scenarios |
| `tests/continuation-turns.test.js` | Unit tests |

## BDD Scenarios

```gherkin
Feature: Continuation turns and stall detection

  Scenario: Writer succeeds on second turn after initial failure
    Given a TaskSpec with maxTurns=3
    And the adapter fails verification on turn 1
    And the adapter passes verification on turn 2
    When the orchestrator runs the command
    Then the result is passed with attempts=2

  Scenario: Terminal failure stops continuation immediately
    Given a TaskSpec with maxTurns=5
    And the adapter returns a policy-denied failure on turn 1
    When the orchestrator runs the command
    Then the result is failed with attempts=1
    And no continuation turn is attempted

  Scenario: maxTurns exhausted reports final failure
    Given a TaskSpec with maxTurns=2
    And the adapter fails verification on all turns
    When the orchestrator runs the command
    Then the result is failed with attempts=2

  Scenario: Stall detection kills inactive adapter
    Given a TaskSpec with stallTimeoutMs=1000
    And the adapter produces no activity for 1500ms
    When the stall check fires
    Then the adapter process is killed
    And the turn is marked as stalled

  Scenario: Activity resets stall timer
    Given a TaskSpec with stallTimeoutMs=5000
    And the adapter produces activity at 3000ms
    When 5000ms total have elapsed
    Then the adapter is still running

  Scenario: checkTaskActive stops continuation when task is cancelled
    Given a TaskSpec with maxTurns=5
    And the adapter fails on turn 1
    And checkTaskActive returns false
    When the orchestrator evaluates continuation
    Then no further turns are attempted
    And the result includes reason task-cancelled
```

## Acceptance Criteria

- Continuation turns reuse the same workspace without reset.
- Continuation prompts reference prior failure, not the original task prompt.
- Terminal failures never trigger continuation.
- Stall detection kills the process and counts as a retriable failure.
- `stallTimeoutMs=0` disables stall detection.
- Existing single-turn behavior is preserved when `maxTurns=1`.
- Ensemble modes benefit automatically (writer gets retries before ensemble rejects).
- All existing tests continue to pass.
