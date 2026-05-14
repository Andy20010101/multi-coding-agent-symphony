import { validateTaskSpec } from '../contracts.js';

const COMMAND_NAMES = new Set(['plan', 'implement', 'review', 'fix-ci', 'qa']);

export class ProposalRegistry {
  constructor({ artifactStore, eventLog }) {
    this.artifactStore = requireMethod(artifactStore, 'writeArtifact', 'artifactStore');
    this.eventLog = requireMethod(eventLog, 'append', 'eventLog');
    this.eventSequence = 0;
  }

  async writeProposal({ taskSpec, command, proposal }) {
    validateTaskSpec(taskSpec);
    assertOneOf(command, COMMAND_NAMES, 'command');
    const normalized = normalizeProposal({ taskSpec, command, proposal });

    await this.artifactStore.writeArtifact(taskSpec.id, normalized.id, normalized);
    await this.#appendEvent({
      type: 'ensemble.proposal.written',
      payload: {
        taskId: taskSpec.id,
        command,
        proposalId: normalized.id,
        artifactId: normalized.id,
        agentId: normalized.agentId,
        adapterId: normalized.adapterId,
        modelProfile: normalized.modelProfile
      }
    });

    return structuredClone(normalized);
  }

  async #appendEvent({ type, payload }) {
    this.eventSequence += 1;

    return this.eventLog.append({
      id: `ensemble-proposal-${this.eventSequence}`,
      type,
      timestamp: new Date().toISOString(),
      actor: 'ensemble',
      payload,
      version: '1'
    });
  }
}

function normalizeProposal({ taskSpec, command, proposal }) {
  assertPlainObject(proposal, 'proposal');

  const agentId = requireNonEmptyString(proposal.agentId, 'proposal.agentId');
  const adapterId = requireNonEmptyString(proposal.adapterId, 'proposal.adapterId');
  const id = proposal.id ?? `proposal-${safeId(agentId)}`;

  assertSafeArtifactId(id, 'proposal.id');

  return {
    version: '1',
    kind: 'agent-proposal',
    id,
    agentId,
    adapterId,
    modelProfile: requireNonEmptyString(proposal.modelProfile, 'proposal.modelProfile'),
    role: requireNonEmptyString(proposal.role, 'proposal.role'),
    taskId: taskSpec.id,
    command,
    summary: requireNonEmptyString(proposal.summary, 'proposal.summary'),
    changes: requireStringArray(proposal.changes, 'proposal.changes'),
    risks: requireStringArray(proposal.risks, 'proposal.risks'),
    evidenceArtifactId: requireNonEmptyString(proposal.evidenceArtifactId, 'proposal.evidenceArtifactId'),
    evidenceStatus: requireNonEmptyString(proposal.evidenceStatus, 'proposal.evidenceStatus'),
    ...(proposal.resourceProfile ? { resourceProfile: structuredClone(proposal.resourceProfile) } : {}),
    ...(proposal.confidence ? { confidence: requireNonEmptyString(proposal.confidence, 'proposal.confidence') } : {})
  };
}

function requireStringArray(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be a string array`);
  }

  return value.map((item, index) => requireNonEmptyString(item, `${field}[${index}]`));
}

function safeId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assertSafeArtifactId(value, field) {
  requireNonEmptyString(value, field);

  if (value.includes('/') || value.includes('..')) {
    throw new TypeError(`${field} must be a safe artifact id`);
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  return value;
}

function assertOneOf(value, allowed, field) {
  if (!allowed.has(value)) {
    throw new TypeError(`${field} must be one of: ${Array.from(allowed).join(', ')}`);
  }
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
}

function requireMethod(value, method, field) {
  if (!value || typeof value[method] !== 'function') {
    throw new TypeError(`${field} must provide ${method}`);
  }

  return value;
}
