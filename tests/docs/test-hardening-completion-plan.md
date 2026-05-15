# Test Hardening Completion Plan

Date: 2026-05-14
Status: completed 2026-05-15
Goal: meet all targets in `test-hardening-plan.md`, fix existing weak tests, prevent regression.

## Current State

### Mutation scores

| Module | Baseline | After Phase 2-3 | Final | Target | Status |
|--------|----------|-----------------|-------|--------|--------|
| arbitrator.js | 41.6% | 55.2% | 82.4% | 75% | ✅ met |
| contracts.js | 51.4% | 62.9% | 87.4% | 85% | ✅ met |
| policy-engine.js | 62.4% | 67.0% | 78.9% | 75% | ✅ met |
| orchestrator.js | 69.1% | 69.1% | 71.2% | 70% | ✅ met |
| verifier.js | 78.2% | 80.9% | 80.9% | 75% | ✅ met |
| ensemble-orchestrator.js | — | 70.1% | 81.0% | 75% | ✅ met |

### Surviving mutants (arbitrator example, 28 total)

- StringLiteral: 12 — message text mutations not checked
- ConditionalExpression: 11 — branch boundaries not tested
- LogicalOperator: 3 — `&&` vs `||` swaps undetected
- MethodExpression: 1
- BlockStatement: 1

### Closed Gaps From Earlier Hardening

1. `tests/codex-real-cli.test.js`, `claude-real-cli.test.js`, `kiro-real-cli.test.js` use fixture replay instead of `.calls` assertions.
2. `tests/phase1-5-property.test.js` adds property-based companions for Phase 1-5 behavior.
3. `pnpm test:mutation:gate` is configured and wired into CI.
4. `tests/docs/equivalent-mutants.md` documents accepted surviving mutants and achieved scores.

## Strategy

The targets are 70-85% mutation score. Reaching them requires:

1. **Targeted mutant killers** — write tests for specific surviving mutants (not generic property tests)
2. **Replace mock-coupling tests** — fixture replay instead of `.calls` assertions
3. **Add CI gate** — fail builds when mutation score drops
4. **Document equivalent mutants** — explicitly mark unkillable mutants as acceptable

## Phase 5: Targeted Mutant Killing

For each module below target, do this loop:

```
1. Run Stryker with --reporters json
2. Parse mutants where status='Survived'
3. Group by location (line/column)
4. For each surviving mutant:
   a. Read the mutation diff (- original, + mutated)
   b. Write a test that produces different output between original and mutated
   c. Verify test passes against original
   d. Verify test fails against mutated (kills the mutant)
5. Re-run Stryker until target met
```

### 5.1 arbitrator.js: 55.2% → 75% (~14 mutants to kill)

**Surviving mutant categories**:
- 12 StringLiteral — `reasons[0]` content not asserted exactly
- 11 ConditionalExpression — boundary like `evidenceStatus === 'passed'` flipped to `false`/`true`
- 3 LogicalOperator — internal `&&`/`||` swaps

**Tactics**:
- Add tests asserting exact `reasons[0]` strings for each decision path
- Test case where `evidenceStatus` is exactly `'passed'` vs `'PASSED'` vs `'pass'`
- Test multiple proposals where order matters: first-passing wins
- Test `proposal.evidenceStatus` from each fallback source: `verificationStatus`, `evidence.verification.status`

**Files to add**:
- `tests/arbitrator-targeted.test.js`

### 5.2 contracts.js: 62.9% → 85% (~50 mutants to kill)

**Surviving mutant categories** (largest module, most surviving):
- StringLiteral mutations on error messages
- ConditionalExpression on `value < 1`, `value === ''`, etc.
- Validation function internals

**Tactics**:
- Assert exact error message text (not just `throws`)
- Test boundary: `contextTokens: 1` (valid) vs `contextTokens: 0` (invalid)
- Test boundary: `value: ''` vs `value: ' '` vs `value: '\t'`
- Test array length edge: 0, 1, max
- Test optional field "present but invalid" vs "absent"

**Files to add**:
- `tests/contracts-targeted.test.js`

### 5.3 policy-engine.js: 67.0% → 75% (~10 mutants to kill)

**Tactics**:
- Test exact path pattern matching: `.env` matches but `.envrc` does not
- Test glob patterns: `**/secrets/**` boundaries
- Test command pattern wildcards: `pnpm test` matches `pnpm *` but `evil pnpm` does not
- Test network policy precedence: `deniedNetworkHosts` overrides `allowedNetworkHosts`

**Files to add**:
- `tests/policy-engine-targeted.test.js`

### 5.4 orchestrator.js: 69.1% → 70% (~1 mutant)

Already very close. Tactics:
- Re-run Stryker with current tests; the new fast-check tests added in Phase 2 may have closed the gap
- If still below, target the specific surviving mutant

### 5.5 ensemble-orchestrator.js: 70.1% → 75% (~6 mutants)

**Tactics**:
- Test writer-reviewer with multiple reviewers, all scenarios
- Test rejectionReasons content exactly
- Test event sequence ordering for ensemble.run.completed
- Test artifact id construction (writer vs reviewer)

**Files to add**:
- `tests/ensemble-orchestrator-targeted.test.js`

## Phase 6: Replace Mock-Coupling Tests

### 6.1 Fixture Recording

For real CLI tests, record actual CLI invocations as fixtures.

**Steps**:
1. Run `MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real` and capture stdout/stderr/exit-code
2. Save as `fixtures/recordings/codex-plan-passing.json`
3. Repeat for failing/edge cases (each adapter × each command)
4. Build a `FixtureReplayProcessRunner` that returns recorded responses

**Files to add**:
- `fixtures/recordings/<adapter>-<command>-<scenario>.json` (multiple)
- `tests/helpers/fixture-replay-runner.js`

### 6.2 Rewrite Mock-Coupling Tests

Target files:
- `tests/codex-real-cli.test.js`
- `tests/claude-real-cli.test.js`
- `tests/kiro-real-cli.test.js`

For each test that asserts on `.calls`/`.starts` arrays:
- Replace with assertion on the parsed evidence structure
- Use `FixtureReplayProcessRunner` to feed real CLI output through the adapter
- Verify the adapter's evidence parser produces the correct EvidencePackage

**Acceptance**: zero `.calls` assertions remain in real-cli test files. All evidence parsing is verified end-to-end.

## Phase 7: Convert Example-Based Tests to Property-Based

Target files:
- `tests/phase1.test.js` — 5 tests
- `tests/phase2.test.js` — 4 tests
- `tests/phase3.test.js` — 7 tests
- `tests/phase4.test.js` — 20 tests
- `tests/phase5.test.js` — 9 tests

Strategy: keep the original tests (don't break), but for each test that uses a fixed input, add a property-based companion that randomizes the input around the same property.

Example:
```javascript
// Original (kept):
it('queues a task', () => { /* fixed input */ });

// New companion:
it('queues any valid TaskSpec deterministically', () => {
  fc.assert(fc.property(arbitraryTaskSpec(), (task) => {
    queue.enqueue(task);
    assert.equal(queue.list({ status: 'queued' }).length, 1);
  }));
});
```

## Phase 8: CI Gate and Documentation

### 8.1 Mutation Score CI Gate

Add to `package.json`:
```json
"scripts": {
  "test:mutation": "stryker run",
  "test:mutation:gate": "stryker run --thresholds.high 80 --thresholds.low 70 --thresholds.break 60"
}
```

Add to release checklist: `pnpm test:mutation:gate` must pass.

Configure `stryker.config.mjs`:
```javascript
thresholds: {
  high: 80,
  low: 70,
  break: 60  // build fails below this
}
```

### 8.2 Equivalent Mutant Documentation

Some mutants are unkillable because they don't change observable behavior. Document them in `tests/docs/equivalent-mutants.md`:
```markdown
## src/contracts.js:99
Mutant: StringLiteral '"Stryker was here!"'
Reason: Error message text only — behavior identical from caller's perspective
Decision: Acceptable, will not chase
```

This prevents future engineers from wasting time trying to kill them.

### 8.3 Update test-hardening-plan.md

Update the `Success Criteria` table with actual achieved scores and any deliberately accepted gaps.

## Estimated Work

| Phase | Effort | Output |
|-------|--------|--------|
| 5.1 arbitrator targeted | 1 hour | ~15 tests, +20% mutation score |
| 5.2 contracts targeted | 2 hours | ~30 tests, +22% mutation score |
| 5.3 policy-engine targeted | 1 hour | ~12 tests, +8% mutation score |
| 5.4 orchestrator targeted | 30 min | ~3 tests, +1% mutation score |
| 5.5 ensemble-orchestrator targeted | 1 hour | ~10 tests, +5% mutation score |
| 6.1 fixture recording | 1 hour | 6-9 recordings, replay helper |
| 6.2 rewrite mock-coupling | 2 hours | 21 tests rewritten |
| 7 example→property | 1.5 hours | 45 companion tests |
| 8 CI gate + docs | 30 min | config + docs |

**Total: ~10.5 hours of focused work**

## Acceptance Criteria

After all phases:

| Module | Target | Required |
|--------|--------|----------|
| arbitrator.js | ≥75% | ✅ |
| contracts.js | ≥85% | ✅ |
| policy-engine.js | ≥75% | ✅ |
| orchestrator.js | ≥70% | ✅ |
| verifier.js | ≥75% | ✅ already met |
| ensemble-orchestrator.js | ≥75% | ✅ |

Plus:
- All 396+ existing tests still pass
- Zero mock-coupling assertions in real-cli test files
- Stryker CI gate prevents regression
- Equivalent mutants documented

## Risks

1. **Some mutants may be genuinely equivalent** — chasing them wastes time. Document and skip after one analysis pass.
2. **Fixture recording requires real CLI access** — only works after Codex quota window (post-18:53 CST today, or future runs)
3. **Targeted tests can become brittle** — over-asserting exact strings means refactoring breaks tests. Trade-off: prefer behavioral assertions when possible, fall back to string matching only for surviving mutants
4. **Property tests are slow** — adding many can extend `pnpm test` runtime significantly. Mitigate by setting `numRuns: 100` for slower tests

## Execution Order

1. Phase 5.1 (arbitrator targeted) — biggest gap, smallest module
2. Phase 5.2 (contracts targeted) — biggest gap by absolute number
3. Phase 5.3-5.5 — remaining mutation score gaps
4. Phase 7 (example→property) — broader coverage, doesn't affect existing tests
5. Phase 6 (fixture recording) — requires real CLI, do when quota resets
6. Phase 8 (CI gate) — locks in gains
