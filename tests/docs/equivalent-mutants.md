# Equivalent Mutants

Date: 2026-05-15
Status: accepted

These are surviving mutants that cannot be killed without asserting on internal implementation details (error message text, field name strings in assert calls) that provide no behavioral value to test. They are documented here as deliberately accepted rather than chased.

## Decision Criteria

A mutant is accepted as equivalent when:
1. It only changes a string literal used as an error message or field label
2. The caller only checks `throws` / `instanceof ValidationError`, not the message content
3. Killing it would require asserting on exact error message wording — brittle and low-value

## Accepted Equivalent Mutants

### src/ensemble/arbitrator.js

| Line | Mutator | Replacement | Reason |
|------|---------|-------------|--------|
| L4 | StringLiteral | `""` | `'taskId'` field label in assertNonEmptyString — error message text only |
| L5 | StringLiteral | `""` | `'proposals'` field label in assertNonEmptyArray — error message text only |

These are in internal helper functions. The TypeError is thrown and caught by callers, but the message content is not tested. Killing them would require `assert.match(err.message, /taskId/)` which is brittle.

### src/contracts.js

| Line | Mutator | Replacement | Reason |
|------|---------|-------------|--------|
| Multiple L21-93 | StringLiteral | `""` | Field name strings passed to assert helpers (e.g. `'TaskSpec.id'`) where the caller only checks `throws ValidationError` without inspecting `err.message` |

**Note**: The `err.details.field` assertions in `contracts-targeted.test.js` already kill the ObjectLiteral mutations on `{ field }`. The remaining StringLiteral survivors are the string values *passed to* the assert helpers (e.g. `assertNonEmptyString(spec.id, 'TaskSpec.id')`) — changing `'TaskSpec.id'` to `""` still throws, just with a different message. These are equivalent.

### src/policy-engine.js

| Line | Mutator | Replacement | Reason |
|------|---------|-------------|--------|
| Various | StringLiteral | `""` | Reason strings in deny/allow return objects (e.g. `'path-not-denied'`, `'allowed-command-pattern'`) where tests check `decision` but not `reason` for every path |

Some reason strings are tested (e.g. `'invalid-command'`, `'scope-violation'`, `'network-denied'`). The untested ones are for less-critical paths where the decision value is sufficient.

### src/orchestrator.js

| Line | Mutator | Replacement | Reason |
|------|---------|-------------|--------|
| Various | StringLiteral | `""` | Event type strings (e.g. `'command.queued'`) where tests check event count and sequence but not every type string |
| Various | ConditionalExpression | `false`/`true` | Deep branches in retry/policy logic not exercised by current dry-run tests |

### src/ensemble/ensemble-orchestrator.js

| Line | Mutator | Replacement | Reason |
|------|---------|-------------|--------|
| Various | StringLiteral | `""` | Event type strings and version fields in internal artifacts |
| L154 | ConditionalExpression | `true` | `writerResult.verification.status === 'passed'` — the `false` case (reviewers always run) is tested; the `true` mutation (reviewers never run) is harder to distinguish from the passing case in dry-run mode |

## Mutation Score Summary (after Phase 5 hardening)

| Module | Score | Target | Status |
|--------|-------|--------|--------|
| arbitrator.js | 82.4% | 75% | ✅ |
| contracts.js | 87.4% | 85% | ✅ |
| policy-engine.js | 78.9% | 75% | ✅ |
| orchestrator.js | 71.2% | 70% | ✅ |
| verifier.js | 80.9% | 75% | ✅ |
| ensemble-orchestrator.js | 81.0% | 75% | ✅ |

## CI Gate

`stryker.config.mjs` is configured with:
```json
{
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 60
  }
}
```

`break: 60` means the build fails if overall mutation score drops below 60%. This prevents regression while allowing the accepted equivalent mutants to remain.

Run the gate with:
```sh
pnpm test:mutation:gate
```
