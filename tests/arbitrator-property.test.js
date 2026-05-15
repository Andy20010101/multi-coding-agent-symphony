import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { arbitrateProposals } from '../src/ensemble/arbitrator.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

const evidenceStatus = fc.oneof(
  fc.constant('passed'),
  fc.constant('failed'),
  fc.constant('missing'),
  nonEmptyString  // unknown statuses should be treated as non-passing
);

function makeProposal(id, evidenceStatus) {
  return {
    id,
    agentId: `agent-${id}`,
    adapterId: 'codex',
    modelProfile: 'gpt-codex-default',
    role: 'planner',
    taskId: 'task-1',
    command: 'plan',
    summary: 'A plan.',
    changes: [],
    risks: [],
    evidenceArtifactId: `${id}-evidence`,
    evidenceStatus,
    version: '1'
  };
}

// Generate N proposals with unique ids
const proposalList = (minLength = 1) =>
  fc.array(
    fc.tuple(nonEmptyString, evidenceStatus),
    { minLength, maxLength: 8 }
  ).filter((pairs) => {
    const ids = pairs.map(([id]) => id);
    return new Set(ids).size === ids.length; // unique ids
  }).map((pairs) => pairs.map(([id, status]) => makeProposal(id, status)));

// ── Invariant Tests ───────────────────────────────────────────────────────────

describe('Arbitrator invariant property tests', () => {
  it('decision is always accepted or needs-followup', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.ok(
        result.decision === 'accepted' || result.decision === 'needs-followup',
        `unexpected decision: ${result.decision}`
      );
    }));
  });

  it('if any proposal has passing evidence, decision is accepted', () => {
    const withPassing = proposalList().filter((proposals) =>
      proposals.some((p) => p.evidenceStatus === 'passed')
    );
    fc.assert(fc.property(withPassing, (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.equal(result.decision, 'accepted');
    }));
  });

  it('if no proposal has passing evidence, decision is needs-followup', () => {
    const nonPassingStatus = fc.constantFrom('failed', 'missing', 'error', 'unknown');
    const allFailing = fc.array(
      fc.tuple(nonEmptyString, nonPassingStatus),
      { minLength: 1, maxLength: 6 }
    ).filter((pairs) => new Set(pairs.map(([id]) => id)).size === pairs.length)
      .map((pairs) => pairs.map(([id, status]) => makeProposal(id, status)));

    fc.assert(fc.property(allFailing, (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.equal(result.decision, 'needs-followup');
      assert.equal(result.selectedProposalId, null);
    }));
  });

  it('selectedProposalId is always one of the input proposal ids when accepted', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      if (result.decision === 'accepted') {
        const ids = proposals.map((p) => p.id);
        assert.ok(ids.includes(result.selectedProposalId), 'selectedProposalId not in input');
      }
    }));
  });

  it('selectedProposalId never appears in rejectedProposalIds', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      if (result.selectedProposalId !== null) {
        assert.ok(
          !result.rejectedProposalIds.includes(result.selectedProposalId),
          'selected proposal also appears in rejected list'
        );
      }
    }));
  });

  it('rejectedProposalIds + selectedProposalId covers all input ids', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      const inputIds = new Set(proposals.map((p) => p.id));
      const outputIds = new Set([
        ...result.rejectedProposalIds,
        ...(result.selectedProposalId ? [result.selectedProposalId] : [])
      ]);
      assert.deepEqual(outputIds, inputIds, 'output ids do not match input ids');
    }));
  });

  it('every rejection has a non-empty reason', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      for (const rejection of result.rejections) {
        assert.ok(
          typeof rejection.reason === 'string' && rejection.reason.trim().length > 0,
          `rejection for ${rejection.proposalId} has empty reason`
        );
      }
    }));
  });

  it('reasons array is always non-empty', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.ok(result.reasons.length > 0, 'reasons array is empty');
    }));
  });

  it('single passing proposal is always selected', () => {
    fc.assert(fc.property(nonEmptyString, (id) => {
      const proposals = [makeProposal(id, 'passed')];
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.equal(result.decision, 'accepted');
      assert.equal(result.selectedProposalId, id);
      assert.deepEqual(result.rejectedProposalIds, []);
    }));
  });

  it('selected proposal always has passing evidence status', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      if (result.decision === 'accepted') {
        const selected = proposals.find((p) => p.id === result.selectedProposalId);
        assert.equal(selected.evidenceStatus, 'passed');
      }
    }));
  });

  it('requiredFollowups is empty when decision is accepted', () => {
    fc.assert(fc.property(proposalList(), (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      if (result.decision === 'accepted') {
        assert.deepEqual(result.requiredFollowups, []);
      }
    }));
  });

  it('requiredFollowups covers all proposals when needs-followup', () => {
    const allFailing = fc.array(
      fc.tuple(nonEmptyString, fc.constant('failed')),
      { minLength: 1, maxLength: 5 }
    ).filter((pairs) => new Set(pairs.map(([id]) => id)).size === pairs.length)
      .map((pairs) => pairs.map(([id, status]) => makeProposal(id, status)));

    fc.assert(fc.property(allFailing, (proposals) => {
      const result = arbitrateProposals({ taskId: 'task-1', proposals });
      assert.equal(result.requiredFollowups.length, proposals.length);
    }));
  });

  it('throws on empty proposals array', () => {
    assert.throws(
      () => arbitrateProposals({ taskId: 'task-1', proposals: [] }),
      TypeError
    );
  });

  it('throws on blank taskId', () => {
    fc.assert(fc.property(
      fc.oneof(fc.constant(''), fc.constant('  ')),
      (blank) => {
        assert.throws(
          () => arbitrateProposals({ taskId: blank, proposals: [makeProposal('p1', 'passed')] }),
          TypeError
        );
      }
    ));
  });
});
