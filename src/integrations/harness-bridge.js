import { readFile } from 'node:fs/promises';

import { validateTaskSpec } from '../contracts.js';
import { findWriteSetViolations, buildWorkspaceConstraints, normalizeWriteSet } from './workspace-bridge.js';

const TASK_PRIORITIES = new Set(['low', 'normal', 'high']);
const POLICY_CONFIG_FIELDS = [
  'deniedPaths',
  'allowedCommands',
  'deniedCommands',
  'allowedCommandPatterns',
  'deniedCommandPatterns',
  'network',
  'allowedNetworkHosts',
  'deniedNetworkHosts'
];

export class TaskPacketValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'TaskPacketValidationError';
    this.details = details;
  }
}

export async function readTaskPacketJsonFile(path) {
  try {
    return parseTaskPacketJson(await readFile(path, 'utf8'));
  } catch (error) {
    if (error instanceof TaskPacketValidationError) {
      throw error;
    }

    throw new TaskPacketValidationError(`TaskPacket file must be readable JSON: ${error.message}`);
  }
}

export function parseTaskPacketJson(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new TaskPacketValidationError(`TaskPacket file must be readable JSON: ${error.message}`);
  }
}

export function taskPacketToTaskSpec(taskPacket, { runId = taskPacket?.run_id } = {}) {
  assertPlainObject(taskPacket, 'TaskPacket');
  const id = requireNonEmptyString(taskPacket.id, 'TaskPacket.id');
  const intent = requireNonEmptyString(taskPacket.intent, 'TaskPacket.intent');
  const acceptance = requireNonEmptyStringArray(taskPacket.acceptance, 'TaskPacket.acceptance');
  const writeSet = requireWriteSet(taskPacket.write_set);
  const priority = taskPacket.priority ?? 'normal';

  buildExpectedChecks(taskPacket);

  if (!TASK_PRIORITIES.has(priority)) {
    throw new TaskPacketValidationError('TaskPacket.priority must be one of: low, normal, high');
  }

  const taskSpec = {
    id,
    source: 'manual',
    repository: typeof taskPacket.repository === 'string' && taskPacket.repository.trim() !== ''
      ? taskPacket.repository
      : 'harness-taskpacket',
    objective: intent,
    constraints: buildWorkspaceConstraints({ runId, writeSet }),
    acceptance,
    priority,
    version: '1'
  };

  validateTaskSpec(taskSpec);

  return taskSpec;
}

export function buildExpectedChecks(taskPacket) {
  assertPlainObject(taskPacket, 'TaskPacket');
  assertPlainObject(taskPacket.verification, 'TaskPacket.verification');
  return requireNonEmptyStringArray(taskPacket.verification.commands, 'TaskPacket.verification.commands');
}

export function buildHarnessPolicy(taskPacket) {
  assertPlainObject(taskPacket, 'TaskPacket');
  const writeSet = requireWriteSet(taskPacket.write_set);
  const policy = taskPacket.policy ?? {};

  if (policy === null || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new TaskPacketValidationError('TaskPacket.policy must be an object');
  }

  const config = {};

  for (const field of POLICY_CONFIG_FIELDS) {
    if (policy[field] !== undefined) {
      config[field] = structuredClone(policy[field]);
    }
  }

  const requests = writeSet.map((target) => ({
    action: 'write',
    target
  }));

  if (policy.requests !== undefined) {
    if (!Array.isArray(policy.requests)) {
      throw new TaskPacketValidationError('TaskPacket.policy.requests must be an array');
    }

    for (const request of policy.requests) {
      requests.push(validatePolicyRequest(request));
    }
  }

  return {
    config,
    requests
  };
}

export async function verifyHarnessResult({
  taskPacket,
  workflowResult,
  readEvidence,
  error
}) {
  const expectedChecks = buildExpectedChecks(taskPacket);
  const writeSet = requireWriteSet(taskPacket.write_set);
  const writeSetViolations = [];
  const missingExpectedChecks = [];
  const commands = Array.isArray(workflowResult?.commands) ? workflowResult.commands : [];
  const policyDenied = policyDeniedFromError(error);

  for (const command of commands) {
    const evidence = await readEvidence(command);
    const changedFiles = Array.isArray(evidence?.changedFiles) ? evidence.changedFiles : [];
    const violatingFiles = findWriteSetViolations({ changedFiles, writeSet });
    const missingChecks = missingChecksForEvidence({ evidence, expectedChecks });

    if (violatingFiles.length > 0) {
      writeSetViolations.push({
        command: command.command,
        artifactId: command.artifactId,
        changedFiles: violatingFiles
      });
    }

    if (missingChecks.length > 0) {
      missingExpectedChecks.push({
        command: command.command,
        artifactId: command.artifactId,
        expectedCommands: missingChecks
      });
    }
  }

  const failedSymphony = workflowResult?.status !== 'passed';
  const reason = failureReason({
    policyDenied,
    failedSymphony,
    writeSetViolations,
    missingExpectedChecks
  });

  return {
    version: '1',
    status: reason === 'checks-passed' ? 'passed' : 'failed',
    reason,
    expectedChecks,
    writeSet,
    writeSetViolations,
    missingExpectedChecks,
    ...(policyDenied ? { policyDenied } : {})
  };
}

export async function runHarnessTaskPacket({
  taskPacket,
  runId,
  orchestrator,
  artifactStore,
  evidenceSink,
  runtime,
  taskPacketPath,
  executionMode = 'dry-run',
  timeoutMs
}) {
  const taskSpec = taskPacketToTaskSpec(taskPacket, { runId });
  const policy = buildHarnessPolicy(taskPacket);

  await artifactStore.writeArtifact(taskSpec.id, 'harness-taskpacket', {
    version: '1',
    kind: 'harness-taskpacket',
    runId,
    taskPacket: structuredClone(taskPacket)
  });

  let workflowResult;
  let workflowError;

  try {
    workflowResult = await orchestrator.runTaskWorkflow({
      taskSpec,
      policyRequests: policy.requests,
      executionMode,
      timeoutMs
    });
  } catch (error) {
    workflowError = error;
    workflowResult = {
      taskId: taskSpec.id,
      status: 'failed',
      commands: [],
      artifactRefs: []
    };
  }

  const harnessVerification = await verifyHarnessResult({
    taskPacket,
    workflowResult,
    error: workflowError,
    readEvidence: (command) => artifactStore.readArtifact(taskSpec.id, command.artifactId)
  });
  const evidencePaths = await evidenceSink.write({
    taskPacket,
    taskSpec,
    workflowResult,
    harnessVerification,
    runtime,
    taskPacketPath,
    executionMode
  });

  return {
    taskSpec,
    workflowResult,
    harnessVerification,
    evidencePaths,
    executionMode,
    error: workflowError
  };
}

function missingChecksForEvidence({ evidence, expectedChecks }) {
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : [];

  return expectedChecks.filter((expected) => !checks.some((check) => (
    check?.command === expected || check?.name === expected
  )));
}

function failureReason({ policyDenied, failedSymphony, writeSetViolations, missingExpectedChecks }) {
  if (policyDenied) {
    return 'policy-denied';
  }

  if (writeSetViolations.length > 0) {
    return 'write-set-violation';
  }

  if (missingExpectedChecks.length > 0) {
    return 'expected-check-missing';
  }

  if (failedSymphony) {
    return 'symphony-verification-failed';
  }

  return 'checks-passed';
}

function policyDeniedFromError(error) {
  if (!error || error.name !== 'PolicyDeniedError') {
    return null;
  }

  const decision = error.details?.decision ?? {};

  return {
    message: error.message,
    decision: decision.decision ?? 'deny',
    reason: decision.reason ?? 'policy-denied',
    matchedRule: decision.matchedRule ?? null,
    target: decision.request?.target ?? decision.matchedRule ?? null
  };
}

function validatePolicyRequest(request) {
  if (request === null || typeof request !== 'object' || Array.isArray(request)) {
    throw new TaskPacketValidationError('TaskPacket.policy.requests[] must be an object');
  }

  const action = requireNonEmptyString(request.action, 'TaskPacket.policy.requests[].action');
  const normalized = {
    action
  };

  if (request.target !== undefined) {
    normalized.target = requireNonEmptyString(request.target, 'TaskPacket.policy.requests[].target');
  }

  if (request.command !== undefined) {
    normalized.command = requireNonEmptyString(request.command, 'TaskPacket.policy.requests[].command');
  }

  return normalized;
}

function requireWriteSet(writeSet) {
  try {
    return normalizeWriteSet(writeSet);
  } catch (error) {
    throw new TaskPacketValidationError(error.message);
  }
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TaskPacketValidationError(`${field} must be an object`);
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TaskPacketValidationError(`${field} must be a non-empty string`);
  }

  return value;
}

function requireNonEmptyStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TaskPacketValidationError(`${field} must be a non-empty string array`);
  }

  return value.map((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TaskPacketValidationError(`${field}[${index}] must be a non-empty string`);
    }

    return item;
  });
}
