import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  synthesizeDecision
} from '../src/ensemble/synthesis.js';

describe('V2 synthesis', () => {
  it('builds one semantic follow-up command from the selected proposal', () => {
    const synthesis = synthesizeDecision({
      taskId: 'task-v2',
      decision: {
        version: '1',
        taskId: 'task-v2',
        decision: 'accepted',
        selectedProposalId: 'proposal-codex',
        rejectedProposalIds: ['proposal-claude'],
        reasons: ['proposal-codex has verifier-passed evidence'],
        requiredFollowups: [],
        rejections: [{
          proposalId: 'proposal-claude',
          reason: 'evidence-status-failed'
        }]
      },
      proposals: [
        proposal({
          id: 'proposal-codex',
          changes: [
            'Add BDD scenario for proposal-only mode.',
            'Implement proposal registry and arbitrator.'
          ],
          risks: ['Keep adapter-specific flags out of the synthesis output.']
        }),
        proposal({
          id: 'proposal-claude',
          changes: ['Skip tests and implement directly.'],
          risks: ['Weak evidence.']
        })
      ]
    });

    assert.equal(synthesis.version, '1');
    assert.equal(synthesis.taskId, 'task-v2');
    assert.equal(synthesis.sourceProposalId, 'proposal-codex');
    assert.deepEqual(synthesis.sourceProposalArtifactIds, ['proposal-codex', 'proposal-claude']);
    assert.deepEqual(synthesis.rejectedTradeoffs, [{
      proposalId: 'proposal-claude',
      reason: 'evidence-status-failed'
    }]);
    assert.deepEqual(synthesis.followUpCommand, {
      name: 'implement',
      version: '1',
      allowedTools: ['read', 'write', 'shell', 'test'],
      workspacePolicy: 'primary-writer',
      doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
      evidenceSchema: 'implementation-evidence.v1'
    });
    assert.match(synthesis.instruction, /Add BDD scenario/);
    assert.doesNotMatch(synthesis.instruction, /--model|--cd|codex exec/);
  });
});

function proposal({ id, changes, risks }) {
  return {
    id,
    agentId: id.replace('proposal-', ''),
    adapterId: 'codex',
    modelProfile: 'gpt-codex-default',
    role: 'planner',
    taskId: 'task-v2',
    command: 'plan',
    summary: `${id} summary`,
    changes,
    risks,
    evidenceArtifactId: `${id}-evidence`,
    evidenceStatus: id === 'proposal-codex' ? 'passed' : 'failed',
    version: '1'
  };
}
