const IMPLEMENT_COMMAND_SPEC = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

export function synthesizeDecision({ taskId, decision, proposals }) {
  assertNonEmptyString(taskId, 'taskId');
  assertPlainObject(decision, 'decision');
  assertNonEmptyArray(proposals, 'proposals');

  if (decision.decision !== 'accepted') {
    return synthesizeFollowupRequest({ taskId, decision, proposals });
  }

  const selected = proposals.find((proposal) => proposal.id === decision.selectedProposalId);

  if (!selected) {
    throw new Error(`Selected proposal is missing: ${decision.selectedProposalId}`);
  }

  return {
    version: '1',
    kind: 'ensemble-synthesis',
    taskId,
    sourceProposalId: selected.id,
    sourceProposalArtifactIds: proposals.map((proposal) => proposal.id),
    arbitrationDecision: {
      selectedProposalId: decision.selectedProposalId,
      rejectedProposalIds: [...decision.rejectedProposalIds],
      reasons: [...decision.reasons]
    },
    rejectedTradeoffs: buildRejectedTradeoffs(decision),
    followUpCommand: structuredClone(IMPLEMENT_COMMAND_SPEC),
    instruction: buildInstruction({ selected, decision })
  };
}

function synthesizeFollowupRequest({ taskId, decision, proposals }) {
  return {
    version: '1',
    kind: 'ensemble-synthesis',
    taskId,
    sourceProposalId: null,
    sourceProposalArtifactIds: proposals.map((proposal) => proposal.id),
    arbitrationDecision: {
      selectedProposalId: null,
      rejectedProposalIds: [...decision.rejectedProposalIds],
      reasons: [...decision.reasons]
    },
    rejectedTradeoffs: buildRejectedTradeoffs(decision),
    followUpCommand: null,
    instruction: [
      'Collect verifier-passed evidence before implementation.',
      ...decision.requiredFollowups
    ].join('\n')
  };
}

function buildRejectedTradeoffs(decision) {
  if (Array.isArray(decision.rejections) && decision.rejections.length > 0) {
    return decision.rejections.map((rejection) => ({
      proposalId: rejection.proposalId,
      reason: rejection.reason
    }));
  }

  return decision.rejectedProposalIds.map((proposalId) => ({
    proposalId,
    reason: 'not-selected'
  }));
}

function buildInstruction({ selected, decision }) {
  const sections = [
    `Implement the selected proposal ${selected.id}.`,
    `Summary: ${selected.summary}`,
    listSection('Required changes', selected.changes),
    listSection('Known risks', selected.risks),
    listSection('Arbitration reasons', decision.reasons)
  ];

  return sections.filter((section) => section !== '').join('\n');
}

function listSection(title, values) {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }

  return [
    `${title}:`,
    ...values.map((value) => `- ${value}`)
  ].join('\n');
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
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
