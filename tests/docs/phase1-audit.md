# Test Classification Audit

Date: 2026-05-14
Phase: 1.2

## Summary

163 tests / 28 suites. Classification by test type:

| Category | Count | Files |
|----------|-------|-------|
| Behavior (real fs + meaningful assertions) | ~90 | orchestrator, harness-bridge, phase1-5, task-queue |
| Example-based (fixed inputs, no boundary coverage) | ~55 | arbitrator, contracts, synthesis, adapter-lifecycle |
| Mock-coupling (asserts mock was called) | ~18 | codex-real-cli, claude/kiro real-cli, github-intake |

## Per-File Risk Assessment

| File | Tests | Risk | Notes |
|------|-------|------|-------|
| `arbitrator.test.js` | 2 | 🔴 HIGH | Only 2 happy-path cases. 41.6% mutation score confirms. No boundary: empty proposals, single proposal, all-passed, duplicate ids |
| `contracts-complete.test.js` | 3 | 🔴 HIGH | 3 tests for entire contracts.js. 51.4% mutation score. Missing: optional field validation, boundary strings, numeric edge cases |
| `synthesis.test.js` | 1 | 🔴 HIGH | 1 test only. No property coverage |
| `adapter-lifecycle.test.js` | 4 | 🟡 MEDIUM | No real fs, tests adapter protocol shape |
| `process-runner.test.js` | 2 | 🟡 MEDIUM | 2 tests, no error path coverage |
| `orchestrator.test.js` | 14 | 🟡 MEDIUM | 69.1% mutation score. Real fs used. Missing: concurrent dispatch, stall, retry overflow |
| `security-policy.test.js` | 7 | 🟡 MEDIUM | 62.4% mutation score on policy-engine. Missing: encoding tricks, boundary patterns |
| `harness-bridge.test.js` | 16 | 🟢 LOW | Real fs, 73 assertions, good coverage |
| `phase4.test.js` | 20 | 🟢 LOW | 78.2% verifier mutation score, real fs |
| `task-queue.test.js` | 6 | 🟢 LOW | Real fs, state persistence tested |

## Key Findings

### 1. Arbitrator has only 2 tests for a decision-critical module
The arbitrator decides which agent's proposal wins. With 41.6% mutation score and only 2 test cases, the following are untested:
- Single proposal (should auto-accept if evidence passes)
- All proposals passing (should pick first or highest-scored)
- Empty proposals array (should throw or return needs-followup)
- Proposals with identical ids
- `reasons` array content beyond regex match

### 2. Contracts validation has no boundary testing
`contracts.js` validates every object in the system. With 51.4% mutation score:
- Empty string vs whitespace-only string not distinguished
- Array length boundaries (acceptance: [] vs acceptance: [''])
- Numeric field boundaries (priority: 'low' vs 'LOW' vs 'Low')
- Unknown extra fields behavior

### 3. Mock-coupling tests in real-cli suites
`codex-real-cli.test.js`, `claude-real-cli.test.js`, `kiro-real-cli.test.js` check `.calls` arrays on fake process runners. These verify the adapter *called the CLI with correct args* but don't verify the adapter *parsed the response correctly*.

## Priority for Phase 2

1. `contracts.js` — highest impact, used by everything, 51.4% score
2. `arbitrator.js` — decision-critical, 41.6% score, only 2 tests
3. `orchestrator.js` — state machine boundaries, 69.1% score
4. `verifier.js` — already 78.2%, lowest priority
