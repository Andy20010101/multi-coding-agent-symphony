const PASSING_EVIDENCE_STATUS = 'passed';

export function arbitrateProposals({ taskId, proposals }) {
  assertNonEmptyString(taskId, 'taskId');
  assertNonEmptyArray(proposals, 'proposals');

  const normalized = proposals.map(normalizeProposalForArbitration);
  const passing = normalized.filter((proposal) => proposal.evidenceStatus === PASSING_EVIDENCE_STATUS);

  if (passing.length === 0) {
    return {
      version: '1',
      kind: 'arbitration-decision',
      taskId,
      decision: 'needs-followup',
      selectedProposalId: null,
      rejectedProposalIds: normalized.map((proposal) => proposal.id),
      reasons: ['no proposal has verifier-passed evidence'],
      requiredFollowups: normalized.map((proposal) => (
        `${proposal.id} must provide verifier-passed evidence`
      )),
      rejections: normalized.map((proposal) => ({
        proposalId: proposal.id,
        reason: rejectionReason(proposal)
      }))
    };
  }

  const selected = passing[0];
  const rejected = normalized.filter((proposal) => proposal.id !== selected.id);

  return {
    version: '1',
    kind: 'arbitration-decision',
    taskId,
    decision: 'accepted',
    selectedProposalId: selected.id,
    rejectedProposalIds: rejected.map((proposal) => proposal.id),
    reasons: [
      `${selected.id} selected because it includes verifier-passed evidence`
    ],
    requiredFollowups: [],
    rejections: rejected.map((proposal) => ({
      proposalId: proposal.id,
      reason: rejectionReason(proposal, selected)
    }))
  };
}

function normalizeProposalForArbitration(proposal) {
  if (proposal === null || typeof proposal !== 'object' || Array.isArray(proposal)) {
    throw new TypeError('proposals[] must be an object');
  }

  assertNonEmptyString(proposal.id, 'proposals[].id');
  assertNonEmptyString(proposal.taskId, 'proposals[].taskId');

  return {
    ...structuredClone(proposal),
    evidenceStatus: normalizeEvidenceStatus(proposal)
  };
}

function normalizeEvidenceStatus(proposal) {
  if (typeof proposal.evidenceStatus === 'string' && proposal.evidenceStatus.trim() !== '') {
    return proposal.evidenceStatus;
  }

  if (typeof proposal.verificationStatus === 'string' && proposal.verificationStatus.trim() !== '') {
    return proposal.verificationStatus;
  }

  if (typeof proposal.evidence?.verification?.status === 'string' && proposal.evidence.verification.status.trim() !== '') {
    return proposal.evidence.verification.status;
  }

  return 'missing';
}

function rejectionReason(proposal, selected) {
  if (proposal.evidenceStatus !== PASSING_EVIDENCE_STATUS) {
    return `evidence-status-${proposal.evidenceStatus}`;
  }

  if (selected) {
    return `not-selected-over-${selected.id}`;
  }

  return 'not-selected';
}

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
