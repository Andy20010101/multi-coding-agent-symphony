import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { verifyEvidence } from '../src/verifier.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

const validCommandSpec = (name = 'implement', policy = 'primary-writer') => ({
  name,
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: policy,
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
});

const passingCheck = fc.record({
  name: nonEmptyString,
  status: fc.constant('passed'),
  command: nonEmptyString,
  exitCode: fc.integer({ min: 0, max: 0 }),
  artifactId: nonEmptyString,
  output: nonEmptyString
});

const failingCheck = fc.record({
  name: nonEmptyString,
  status: fc.constant('failed'),
  command: nonEmptyString,
  exitCode: fc.integer({ min: 1, max: 255 }),
  output: nonEmptyString
});

const validEvidence = (changedFiles = []) =>
  fc.record({
    command: fc.constant('implement'),
    taskId: nonEmptyString,
    workspaceId: nonEmptyString,
    diffSummary: fc.array(fc.string()),
    changedFiles: fc.constant(changedFiles),
    checks: fc.array(passingCheck, { minLength: 1 }),
    knownRisks: fc.array(fc.string()),
    agentSummary: nonEmptyString,
    version: fc.constant('1')
  });

// ── Invariant Tests ───────────────────────────────────────────────────────────

describe('Verifier invariant property tests', () => {
  it('result status is always passed or failed', () => {
    fc.assert(fc.property(
      validEvidence(),
      (evidence) => {
        const result = verifyEvidence({
          commandSpec: validCommandSpec(),
          evidence
        });
        assert.ok(
          result.status === 'passed' || result.status === 'failed',
          `unexpected status: ${result.status}`
        );
      }
    ));
  });

  it('all-passing checks with no risks yields passed', () => {
    fc.assert(fc.property(
      fc.array(passingCheck, { minLength: 1 }),
      nonEmptyString,
      (checks, file) => {
        const evidence = {
          command: 'implement',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles: [file],
          checks,
          knownRisks: [],
          agentSummary: 'done',
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec(),
          evidence
        });
        assert.equal(result.status, 'passed');
      }
    ));
  });

  it('any failing check causes failed result', () => {
    fc.assert(fc.property(
      fc.array(passingCheck, { minLength: 0 }),
      failingCheck,
      (passing, failing) => {
        const evidence = {
          command: 'implement',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles: ['src/foo.js'],
          checks: [...passing, failing],
          knownRisks: [],
          agentSummary: 'done',
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec(),
          evidence
        });
        assert.equal(result.status, 'failed');
      }
    ));
  });

  it('empty checks array always fails', () => {
    fc.assert(fc.property(validEvidence(), (evidence) => {
      const result = verifyEvidence({
        commandSpec: validCommandSpec(),
        evidence: { ...evidence, checks: [] }
      });
      assert.equal(result.status, 'failed');
      assert.equal(result.reason, 'checks-missing');
    }));
  });

  it('null or non-object evidence always fails', () => {
    const nonObject = fc.oneof(
      fc.constant(null),
      fc.integer(),
      fc.string(),
      fc.boolean(),
      fc.constant([])
    );
    fc.assert(fc.property(nonObject, (evidence) => {
      const result = verifyEvidence({
        commandSpec: validCommandSpec(),
        evidence
      });
      assert.equal(result.status, 'failed');
    }));
  });

  it('review-only policy with changedFiles always fails with scope-violation', () => {
    fc.assert(fc.property(
      fc.array(nonEmptyString, { minLength: 1 }),
      fc.array(passingCheck, { minLength: 1 }),
      (changedFiles, checks) => {
        const evidence = {
          command: 'review',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles,
          checks,
          knownRisks: [],
          agentSummary: 'reviewed',
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec('review', 'review-only'),
          evidence
        });
        assert.equal(result.status, 'failed');
        assert.equal(result.reason, 'scope-violation');
      }
    ));
  });

  it('changedFiles outside workspace boundary always fails', () => {
    fc.assert(fc.property(
      fc.array(passingCheck, { minLength: 1 }),
      (checks) => {
        const workspaceManifest = { path: '/workspace/task-1' };
        const evidence = {
          command: 'implement',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles: ['/etc/passwd'],  // outside workspace
          checks,
          knownRisks: [],
          agentSummary: 'done',
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec(),
          evidence,
          workspaceManifest
        });
        assert.equal(result.status, 'failed');
        assert.equal(result.reason, 'scope-violation');
      }
    ));
  });

  it('implement with no changedFiles and no noOpRationale fails', () => {
    fc.assert(fc.property(
      fc.array(passingCheck, { minLength: 1 }),
      (checks) => {
        const evidence = {
          command: 'implement',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles: [],
          checks,
          knownRisks: [],
          agentSummary: 'done',
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec('implement'),
          evidence
        });
        assert.equal(result.status, 'failed');
      }
    ));
  });

  it('implement with no changedFiles but valid noOpRationale passes', () => {
    fc.assert(fc.property(
      fc.array(passingCheck, { minLength: 1 }),
      nonEmptyString,
      (checks, rationale) => {
        const evidence = {
          command: 'implement',
          taskId: 'task-1',
          workspaceId: 'ws-1',
          diffSummary: [],
          changedFiles: [],
          checks,
          knownRisks: [],
          agentSummary: 'done',
          noOpRationale: rationale,
          version: '1'
        };
        const result = verifyEvidence({
          commandSpec: validCommandSpec('implement'),
          evidence
        });
        assert.equal(result.status, 'passed');
      }
    ));
  });

  it('failed result always has a non-empty reason', () => {
    fc.assert(fc.property(validEvidence(), (evidence) => {
      const result = verifyEvidence({
        commandSpec: validCommandSpec(),
        evidence: { ...evidence, checks: [] }
      });
      if (result.status === 'failed') {
        assert.ok(
          typeof result.reason === 'string' && result.reason.trim().length > 0,
          'failed result has empty reason'
        );
      }
    }));
  });
});
