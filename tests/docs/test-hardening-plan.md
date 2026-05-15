# Test Hardening Plan

Date: 2026-05-14
Status: completed 2026-05-15
Context: 163 tests / 28 suites written by Codex. Need independent verification that tests actually detect bugs, not just exercise code paths.

## Problem

When the same AI writes both implementation and tests, both share the same assumptions. If the code has a logic bug, the test validates that bug as correct behavior. This is the "closed-loop problem."

Observed risks in current test suite:

1. **Synthetic adapters return hardcoded evidence** — `PassingCodexAdapter` and `FailingCodexAdapter` produce fixed structures. Real adapter format drift won't be caught.
2. **No property-based testing** — All inputs are hand-written fixtures. Edge cases and boundary conditions are untested.
3. **No mutation testing** — Unknown whether assertions actually detect behavioral changes.
4. **State machine boundaries unclear** — Concurrent dispatch, retry overflow, stall detection may be under-covered.

## Phase 1: Diagnosis (no code changes)

Goal: measure how effective the current 163 tests actually are.

### 1.1 Mutation Testing with Stryker

Install and run Stryker against core modules:

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/tap-runner
npx stryker run
```

Target files (priority order):
- `src/orchestrator.js` — state machine, dispatch, retry logic
- `src/ensemble/arbitrator.js` — proposal selection logic
- `src/ensemble/ensemble-orchestrator.js` — writer-reviewer flow
- `src/verifier.js` — evidence validation
- `src/policy-engine.js` — deny/allow decisions
- `src/contracts.js` — field validation

Output: mutation score per file. Surviving mutants = logic changes that tests don't catch.

### 1.2 Test Classification Audit

Manually classify each test file:

| Category | Meaning | Risk |
|----------|---------|------|
| Behavior test | Asserts observable output/state given input | Low |
| Mock verification | Asserts a mock was called with args | High — tests coupling, not behavior |
| Fixture replay | Asserts output matches a recorded fixture | Medium — may be testing the fixture |
| Integration | Uses real filesystem/subprocess | Low |

Output: table showing test distribution across categories.

## Phase 2: Property-Based Testing

Goal: find bugs that fixed-input tests structurally cannot find.

### 2.1 Contract Fuzzing

```javascript
import fc from 'fast-check';

// Generate thousands of random TaskSpec-like objects
// Verify that validateTaskSpec accepts all valid ones and rejects all invalid ones
fc.assert(fc.property(
  arbitraryTaskSpec(),  // custom generator
  (spec) => {
    const shouldBeValid = hasAllRequiredFields(spec);
    if (shouldBeValid) {
      assert.doesNotThrow(() => validateTaskSpec(spec));
    } else {
      assert.throws(() => validateTaskSpec(spec));
    }
  }
));
```

Target contracts:
- `TaskSpec` — id, source, repository, objective, acceptance, version
- `CommandSpec` — name, version, allowedTools, workspacePolicy, doneCriteria
- `EvidencePackage` — checks array, changedFiles, version
- `PolicyRequest` — action, target

### 2.2 Orchestrator State Machine Model

Define a simplified reference model of orchestrator state transitions. Drive both the real orchestrator and the model with random operation sequences. Assert they stay in sync.

Operations to generate:
- `dispatch(issueId)` — start a task
- `complete(issueId, passed|failed)` — adapter finishes
- `terminate(issueId)` — external cancellation
- `retry_fire(issueId)` — retry timer triggers
- `tick()` — reconciliation cycle

Invariants to check:
- A task cannot be in both `running` and `retry` simultaneously
- `claimed` is always a superset of `running ∪ retry`
- Concurrency limit is never exceeded
- Terminal tasks are never re-dispatched

### 2.3 Arbitrator Invariants

Properties that must always hold:
- If exactly one proposal has `evidenceStatus: 'passed'`, it must be selected
- If no proposal has passing evidence, decision must be `needs-followup`
- `rejectedProposalIds` must contain all non-selected proposals
- Every rejection must have a non-empty reason
- Selected proposal must not appear in rejected list

### 2.4 Verifier Invariants

- Evidence with zero checks and non-empty `knownRisks` must fail
- Evidence with all checks passed and no risks must pass
- Evidence with `changedFiles` outside workspace boundary must fail
- Empty `agentSummary` must fail (weak self-report detection)

## Phase 3: Blind Spot Coverage

Goal: test scenarios that Codex likely didn't think to test because they require adversarial thinking.

### 3.1 Workspace Path Traversal

```javascript
// Attempt to create workspace with path traversal in issue identifier
const maliciousId = '../../../etc/passwd';
// Must throw, not create file outside workspace root
```

### 3.2 Policy Engine Bypass Attempts

```javascript
// Attempt shell command that matches deny pattern via encoding tricks
const sneakyCommand = 'rm -rf /'; // should be denied
const encodedCommand = 'r' + 'm' + ' -rf /'; // string concat bypass?
```

### 3.3 Evidence Forgery

```javascript
// Adapter returns evidence claiming checks passed, but check commands were never run
// Verifier should detect missing command execution proof
```

### 3.4 Concurrent Dispatch Race

```javascript
// Two dispatch calls for the same task arrive simultaneously
// Only one should succeed; the other should see task as claimed
```

### 3.5 Retry Bomb

```javascript
// Task fails 100 times in a row
// Backoff must cap at max_retry_backoff_ms, not grow unbounded
// System must not OOM from retry state accumulation
```

## Phase 4: Fixture Recording for Real CLI

Goal: test real adapter parsing logic without calling real CLIs in CI.

### 4.1 Record Real Responses

When running gated real smokes, capture:
- Raw CLI stdout/stderr
- Exit code
- Timing
- File system changes

Save as `fixtures/recordings/<adapter>-<command>-<date>.json`.

### 4.2 Replay in CI

```javascript
// Load recorded response, feed to adapter's evidence parser
// Assert parsed evidence matches expected structure
// No mock — tests real parsing logic against real CLI output
```

## Success Criteria

| Metric | Final | Target | Status |
|--------|-------|--------|--------|
| Mutation score (orchestrator) | 71.2% | ≥ 70% | ✅ met |
| Mutation score (contracts) | 87.4% | ≥ 85% | ✅ met |
| Mutation score (arbitrator) | 82.4% | ≥ 75% | ✅ met |
| Mutation score (policy-engine) | 78.9% | ≥ 75% | ✅ met |
| Mutation score (verifier) | 80.9% | ≥ 75% | ✅ met |
| Mutation score (ensemble-orchestrator) | 81.0% | ≥ 75% | ✅ met |
| Property tests added | ≥ 20 | ≥ 20 | ✅ met |
| Blind spot tests added | ≥ 10 | ≥ 10 | ✅ met |
| Flaky tests | 0 observed in verified run | 0 | ✅ met |

## Execution Order

1. Install `fast-check` (property testing) and `@stryker-mutator/core` (mutation testing)
2. Run Stryker on core modules → get baseline mutation scores
3. Add property tests for contracts (highest ROI, smallest scope)
4. Add state machine model test for orchestrator
5. Add arbitrator/verifier invariant tests
6. Add blind spot tests (path traversal, concurrent dispatch, retry bomb)
7. Re-run Stryker → compare mutation scores
8. Document surviving mutants that cannot be killed (acceptable risks vs real gaps)

## Dependencies

- `fast-check` — property-based testing for Node.js
- `@stryker-mutator/core` + `@stryker-mutator/tap-runner` — mutation testing (uses Node TAP runner since project uses `node --test`)

No other dependencies needed. All tests use Node.js built-in test runner.
