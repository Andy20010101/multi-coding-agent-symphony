import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  arbitrateProposals
} from '../src/ensemble/arbitrator.js';

describe('V2 proposal arbitration', () => {
  it('prefers verifier-valid evidence over narrative confidence', () => {
    const decision = arbitrateProposals({
      taskId: 'task-v2',
      proposals: [
        proposal({
          id: 'proposal-codex',
          summary: 'Conservative plan with executable checks.',
          evidenceStatus: 'passed',
          confidence: 'medium'
        }),
        proposal({
          id: 'proposal-claude',
          summary: 'Confident narrative plan.',
          evidenceStatus: 'failed',
          confidence: 'high'
        })
      ]
    });

    assert.equal(decision.decision, 'accepted');
    assert.equal(decision.selectedProposalId, 'proposal-codex');
    assert.deepEqual(decision.rejectedProposalIds, ['proposal-claude']);
    assert.match(decision.reasons[0], /verifier-passed evidence/);
    assert.deepEqual(decision.rejections, [{
      proposalId: 'proposal-claude',
      reason: 'evidence-status-failed'
    }]);
  });

  it('returns needs-followup when no proposal has passing evidence', () => {
    const decision = arbitrateProposals({
      taskId: 'task-v2',
      proposals: [
        proposal({
          id: 'proposal-codex',
          evidenceStatus: 'failed'
        }),
        proposal({
          id: 'proposal-kiro',
          evidenceStatus: 'missing'
        })
      ]
    });

    assert.equal(decision.decision, 'needs-followup');
    assert.equal(decision.selectedProposalId, null);
    assert.deepEqual(decision.rejectedProposalIds, ['proposal-codex', 'proposal-kiro']);
    assert.deepEqual(decision.requiredFollowups, [
      'proposal-codex must provide verifier-passed evidence',
      'proposal-kiro must provide verifier-passed evidence'
    ]);
  });
});

function proposal({
  id,
  evidenceStatus,
  summary = 'Plan summary.',
  confidence = 'medium'
}) {
  return {
    id,
    agentId: id.replace('proposal-', ''),
    adapterId: 'codex',
    modelProfile: 'gpt-codex-default',
    role: 'planner',
    taskId: 'task-v2',
    command: 'plan',
    summary,
    changes: ['Add tests first.'],
    risks: [],
    confidence,
    evidenceArtifactId: `${id}-evidence`,
    evidenceStatus,
    version: '1'
  };
}
