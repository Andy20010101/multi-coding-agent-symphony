/**
 * Targeted tests to kill surviving mutants in arbitrator.js.
 * Each test is annotated with the mutant it targets.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { arbitrateProposals } from '../src/ensemble/arbitrator.js';

function p(id, evidenceStatus) {
  return {
    id,
    agentId: `agent-${id}`,
    adapterId: 'codex',
    modelProfile: 'gpt-codex-default',
    role: 'planner',
    taskId: 'task-1',
    command: 'plan',
    summary: 'Plan.',
    changes: [],
    risks: [],
    evidenceArtifactId: `${id}-ev`,
    evidenceStatus,
    version: '1'
  };
}

describe('arbitrator.js targeted mutant killers', () => {

  // ── L12-13, L33-34: version and kind fields ───────────────────────────────
  // Kills: StringLiteral mutations on version:'1' and kind:'arbitration-decision'

  it('result has version "1" and kind "arbitration-decision" on needs-followup', () => {
    const result = arbitrateProposals({ taskId: 'task-1', proposals: [p('p1', 'failed')] });
    assert.equal(result.version, '1');
    assert.equal(result.kind, 'arbitration-decision');
  });

  it('result has version "1" and kind "arbitration-decision" on accepted', () => {
    const result = arbitrateProposals({ taskId: 'task-1', proposals: [p('p1', 'passed')] });
    assert.equal(result.version, '1');
    assert.equal(result.kind, 'arbitration-decision');
  });

  // ── L18: reasons text on needs-followup ───────────────────────────────────
  // Kills: StringLiteral mutation on 'no proposal has verifier-passed evidence'

  it('needs-followup reasons[0] is exact text', () => {
    const result = arbitrateProposals({ taskId: 'task-1', proposals: [p('p1', 'failed')] });
    assert.equal(result.reasons[0], 'no proposal has verifier-passed evidence');
  });

  // ── L51: normalizeProposalForArbitration null/object/array guard ──────────
  // Kills: ConditionalExpression(false), LogicalOperator(&&), etc.

  it('throws TypeError when proposal is null', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [null] }),
      TypeError
    );
  });

  it('throws TypeError when proposal is an array', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [['not', 'an', 'object']] }),
      TypeError
    );
  });

  it('throws TypeError when proposal is a string', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: ['string-proposal'] }),
      TypeError
    );
  });

  it('throws TypeError when proposal is a number', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [42] }),
      TypeError
    );
  });

  // ── L55-56: proposals[].id and proposals[].taskId field names ─────────────
  // Kills: StringLiteral mutations on 'proposals[].id' and 'proposals[].taskId'

  it('error message mentions id field when proposal has no id', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [{ taskId: 'task-1' }] }),
      (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /id/);
        return true;
      }
    );
  });

  it('error message mentions taskId field when proposal has no taskId', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [{ id: 'p1' }] }),
      (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /taskId/);
        return true;
      }
    );
  });

  // ── L65: normalizeEvidenceStatus — evidenceStatus fallback chain ──────────
  // Kills: ConditionalExpression(true), LogicalOperator, MethodExpression(.trim)

  it('uses evidenceStatus when present', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [{ id: 'p1', taskId: 'task-1', evidenceStatus: 'passed' }]
    });
    assert.equal(result.decision, 'accepted');
  });

  it('falls back to verificationStatus when evidenceStatus is absent', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [{ id: 'p1', taskId: 'task-1', verificationStatus: 'passed' }]
    });
    assert.equal(result.decision, 'accepted');
  });

  it('falls back to evidence.verification.status when both absent', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [{
        id: 'p1',
        taskId: 'task-1',
        evidence: { verification: { status: 'passed' } }
      }]
    });
    assert.equal(result.decision, 'accepted');
  });

  it('returns missing when evidenceStatus is blank string', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [{ id: 'p1', taskId: 'task-1', evidenceStatus: '   ' }]
    });
    // blank evidenceStatus → falls through to missing → needs-followup
    assert.equal(result.decision, 'needs-followup');
  });

  it('does not use evidenceStatus when it is empty string', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [{ id: 'p1', taskId: 'task-1', evidenceStatus: '', verificationStatus: 'passed' }]
    });
    // empty evidenceStatus → falls back to verificationStatus
    assert.equal(result.decision, 'accepted');
  });

  // ── L81: rejectionReason — evidenceStatus !== PASSING check ──────────────
  // Kills: ConditionalExpression(true) — always returns evidence-status-X

  it('rejection reason is evidence-status-failed for failed evidence', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [p('p1', 'passed'), p('p2', 'failed')]
    });
    const rejection = result.rejections.find((r) => r.proposalId === 'p2');
    assert.equal(rejection.reason, 'evidence-status-failed');
  });

  // ── L85: rejectionReason — selected branch ────────────────────────────────
  // Kills: ConditionalExpression(true/false), BlockStatement({})

  it('rejection reason is not-selected-over-<id> for passing proposal not chosen', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [p('p1', 'passed'), p('p2', 'passed')]
    });
    // p1 is selected (first), p2 is rejected with not-selected-over-p1
    const rejection = result.rejections.find((r) => r.proposalId === 'p2');
    assert.equal(rejection.reason, 'not-selected-over-p1');
  });

  // ── L94, L100: reasons text on accepted ───────────────────────────────────
  // Kills: StringLiteral mutations on template literal content

  it('accepted reasons[0] contains selected id and "verifier-passed evidence"', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [p('my-proposal', 'passed')]
    });
    assert.equal(
      result.reasons[0],
      'my-proposal selected because it includes verifier-passed evidence'
    );
  });

  it('requiredFollowups entry contains proposal id and "verifier-passed evidence"', () => {
    const result = arbitrateProposals({
      taskId: 'task-1',
      proposals: [p('my-proposal', 'failed')]
    });
    assert.equal(
      result.requiredFollowups[0],
      'my-proposal must provide verifier-passed evidence'
    );
  });
});
