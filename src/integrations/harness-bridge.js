import { readFile } from 'node:fs/promises';

import { validateTaskSpec } from '../contracts.js';
import { EnsembleOrchestrator } from '../ensemble/ensemble-orchestrator.js';
import {
  buildWorkspaceConstraints,
  findWriteSetSubsetViolations,
  findWriteSetOverlaps,
  findWriteSetViolations,
  normalizeWriteSet
} from './workspace-bridge.js';

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
    constraints: [
      ...buildWorkspaceConstraints({ runId, writeSet }),
      ...buildExpectedChecks(taskPacket).map((command) => `verification_command:${command}`)
    ],
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
  const observedExpectedChecks = new Set();
  const commands = Array.isArray(workflowResult?.commands) ? workflowResult.commands : [];
  const policyDenied = policyDeniedFromError(error);
  const diagnostics = [];

  for (const command of commands) {
    const evidence = await readEvidence(command);
    const changedFiles = Array.isArray(evidence?.changedFiles) ? evidence.changedFiles : [];
    const violatingFiles = findWriteSetViolations({ changedFiles, writeSet });
    const diagnostic = commandDiagnostic({ command, evidence });

    if (diagnostic) {
      diagnostics.push(diagnostic);
    }

    if (violatingFiles.length > 0) {
      writeSetViolations.push({
        command: command.command,
        artifactId: command.artifactId,
        changedFiles: violatingFiles
      });
    }

    recordObservedExpectedChecks({
      evidence,
      expectedChecks,
      observedExpectedChecks
    });
  }

  const missingExpectedCommands = expectedChecks.filter((expected) => !observedExpectedChecks.has(expected));
  const missingExpectedChecks = missingExpectedCommands.length > 0
    ? [{
        command: 'workflow',
        artifactId: null,
        expectedCommands: missingExpectedCommands
      }]
    : [];
  const failedSymphony = workflowResult?.status !== 'passed';
  const reason = failureReason({
    policyDenied,
    failedSymphony,
    writeSetViolations,
    missingExpectedChecks
  });
  const diagnosticLayer = harnessDiagnosticLayer({
    reason,
    policyDenied,
    failedSymphony,
    writeSetViolations,
    missingExpectedChecks,
    diagnostics
  });

  return {
    version: '1',
    status: reason === 'checks-passed' ? 'passed' : 'failed',
    reason,
    ...(diagnosticLayer ? { diagnosticLayer } : {}),
    expectedChecks,
    writeSet,
    writeSetViolations,
    missingExpectedChecks,
    diagnostics,
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
  commandSequence = 'standard',
  timeoutMs
}) {
  const taskSpec = taskPacketToTaskSpec(taskPacket, { runId });
  const policy = buildHarnessPolicy(taskPacket);
  const workflow = buildTaskPacketWorkflow(taskPacket, { commandSequence });

  await artifactStore.writeArtifact(taskSpec.id, 'harness-taskpacket', {
    version: '1',
    kind: 'harness-taskpacket',
    runId,
    taskPacket: structuredClone(taskPacket)
  });

  let workflowResult;
  let workflowError;

  try {
    workflowResult = await runTaskPacketWorkflow({
      workflow,
      taskSpec,
      policyRequests: policy.requests,
      orchestrator,
      artifactStore,
      executionMode,
      timeoutMs
    });
  } catch (error) {
    workflowError = error;
    workflowResult = {
      taskId: taskSpec.id,
      status: 'failed',
      mode: workflow.mode,
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

async function runTaskPacketWorkflow({
  workflow,
  taskSpec,
  policyRequests,
  orchestrator,
  artifactStore,
  executionMode,
  timeoutMs
}) {
  if (workflow.mode === 'linear') {
    return orchestrator.runTaskWorkflow({
      taskSpec,
      policyRequests,
      commandSequence: workflow.commandSequence,
      executionMode,
      timeoutMs
    });
  }

  const ensemble = new EnsembleOrchestrator({
    artifactStore,
    eventLog: orchestrator.eventLog,
    orchestrator
  });

  if (workflow.mode === 'parallel-lanes') {
    const result = await ensemble.runParallelLanes({
      ensembleId: workflow.ensembleId,
      taskSpec,
      lanes: workflow.lanes,
      executionMode,
      timeoutMs,
      policyRequests
    });

    return parallelLanesResultToWorkflowResult(result);
  }

  const result = await ensemble.runWriterReviewer({
    ensembleId: workflow.ensembleId,
    taskSpec,
    writer: workflow.writer,
    reviewers: workflow.reviewers,
    executionMode,
    timeoutMs,
    policyRequests
  });

  return writerReviewerResultToWorkflowResult(result);
}

function buildTaskPacketWorkflow(taskPacket, { commandSequence }) {
  const workflow = taskPacket.workflow;

  if (workflow === undefined) {
    return {
      mode: 'linear',
      commandSequence
    };
  }

  assertPlainObject(workflow, 'TaskPacket.workflow');
  const mode = requireNonEmptyString(workflow.mode, 'TaskPacket.workflow.mode');

  if (mode === 'linear') {
    return {
      mode,
      commandSequence: workflow.sequence ?? commandSequence
    };
  }

  if (mode === 'parallel-lanes') {
    const ensembleId = workflow.ensemble_id ?? workflow.ensembleId ?? `${taskPacket.id}-parallel-lanes`;
    const lanes = normalizeParallelWorkflowLanes(workflow.lanes);
    const taskWriteSet = requireWriteSet(taskPacket.write_set);

    assertSafeId(ensembleId, 'TaskPacket.workflow.ensemble_id');
    assertDisjointParallelWorkflowLanes(lanes);
    assertParallelWorkflowLanesWithinTaskWriteSet(lanes, taskWriteSet);

    return {
      mode,
      ensembleId,
      lanes
    };
  }

  if (mode !== 'writer-reviewer') {
    throw new TaskPacketValidationError('TaskPacket.workflow.mode must be one of: linear, writer-reviewer, parallel-lanes');
  }

  const ensembleId = workflow.ensemble_id ?? workflow.ensembleId ?? `${taskPacket.id}-writer-reviewer`;

  assertSafeId(ensembleId, 'TaskPacket.workflow.ensemble_id');

  return {
    mode,
    ensembleId,
    writer: normalizeWorkflowAgent(workflow.writer, 'TaskPacket.workflow.writer'),
    reviewers: requireNonEmptyArray(workflow.reviewers, 'TaskPacket.workflow.reviewers')
      .map((reviewer, index) => normalizeWorkflowAgent(reviewer, `TaskPacket.workflow.reviewers[${index}]`))
  };
}

function normalizeWorkflowAgent(agent, field) {
  assertPlainObject(agent, field);
  const agentId = agent.agent_id ?? agent.agentId;
  const modelProfile = agent.model_profile ?? agent.modelProfile;
  const normalized = {
    agentId: requireNonEmptyString(agentId, `${field}.agent_id`)
  };

  if (modelProfile !== undefined) {
    normalized.modelProfile = requireNonEmptyString(modelProfile, `${field}.model_profile`);
  }

  return normalized;
}

function normalizeParallelWorkflowLanes(lanes) {
  return requireNonEmptyArray(lanes, 'TaskPacket.workflow.lanes')
    .map((lane, index) => normalizeParallelWorkflowLane(lane, `TaskPacket.workflow.lanes[${index}]`));
}

function normalizeParallelWorkflowLane(lane, field) {
  assertPlainObject(lane, field);
  const laneId = lane.lane_id ?? lane.laneId;
  const agentId = lane.agent_id ?? lane.agentId;
  const modelProfile = lane.model_profile ?? lane.modelProfile;
  const writeSet = lane.write_set ?? lane.writeSet;
  const normalized = {
    laneId: requireNonEmptyString(laneId, `${field}.lane_id`),
    agentId: requireNonEmptyString(agentId, `${field}.agent_id`),
    writeSet: requireWriteSet(writeSet)
  };

  assertSafeId(normalized.laneId, `${field}.lane_id`);

  if (modelProfile !== undefined) {
    normalized.modelProfile = requireNonEmptyString(modelProfile, `${field}.model_profile`);
  }

  return normalized;
}

function assertDisjointParallelWorkflowLanes(lanes) {
  const laneIds = new Set();

  for (const lane of lanes) {
    if (laneIds.has(lane.laneId)) {
      throw new TaskPacketValidationError('TaskPacket.workflow.lanes[].lane_id must be unique');
    }

    laneIds.add(lane.laneId);
  }

  const overlaps = findWriteSetOverlaps(lanes.map((lane) => ({
    owner: lane.laneId,
    writeSet: lane.writeSet
  })));

  if (overlaps.length > 0) {
    const overlap = overlaps[0];
    throw new TaskPacketValidationError(
      `parallel lane write sets overlap: ${overlap.firstOwner} and ${overlap.secondOwner} both claim ${overlap.firstPattern}`
    );
  }
}

function assertParallelWorkflowLanesWithinTaskWriteSet(lanes, taskWriteSet) {
  for (const lane of lanes) {
    const violations = findWriteSetSubsetViolations({
      claimedWriteSet: lane.writeSet,
      allowedWriteSet: taskWriteSet
    });

    if (violations.length > 0) {
      throw new TaskPacketValidationError(
        `parallel lane write set escapes TaskPacket.write_set: ${lane.laneId} claims ${violations[0]}`
      );
    }
  }
}

function writerReviewerResultToWorkflowResult(result) {
  const commands = [
    roleSummaryToCommand({
      role: 'writer',
      stage: 'writer',
      commandName: 'implement',
      summary: result.writer
    }),
    ...result.reviewers.map((reviewer) => roleSummaryToCommand({
      role: 'reviewer',
      stage: `reviewer:${reviewer.agentId}`,
      commandName: 'review',
      summary: reviewer
    }))
  ];
  const failedCommand = commands.find((command) => command.verification.status !== 'passed');

  return {
    taskId: result.taskId,
    status: result.finalVerificationStatus === 'passed' ? 'passed' : 'failed',
    mode: 'writer-reviewer',
    ensembleRunArtifactId: result.runArtifactId,
    decision: result.decision,
    finalVerificationStatus: result.finalVerificationStatus,
    rejectionReasons: structuredClone(result.rejectionReasons),
    commands,
    artifactRefs: commands.map((command) => ({
      taskId: result.taskId,
      artifactId: command.artifactId,
      command: command.command,
      verificationStatus: command.verification.status
    })),
    ...(failedCommand ? { failedCommand: failedCommand.command } : {})
  };
}

function parallelLanesResultToWorkflowResult(result) {
  const commands = result.lanes.map((lane) => roleSummaryToCommand({
    role: 'parallel-writer',
    stage: `lane:${lane.laneId}`,
    commandName: 'implement',
    summary: lane
  }));
  const failedCommand = commands.find((command) => command.verification.status !== 'passed');

  return {
    taskId: result.taskId,
    status: result.finalVerificationStatus === 'passed' ? 'passed' : 'failed',
    mode: 'parallel-lanes',
    ensembleRunArtifactId: result.runArtifactId,
    decision: result.decision,
    finalVerificationStatus: result.finalVerificationStatus,
    rejectionReasons: structuredClone(result.rejectionReasons),
    commands,
    artifactRefs: commands.map((command) => ({
      taskId: result.taskId,
      artifactId: command.artifactId,
      command: command.command,
      verificationStatus: command.verification.status
    })),
    ...(failedCommand ? { failedCommand: failedCommand.command } : {})
  };
}

function roleSummaryToCommand({ role, stage, commandName, summary }) {
  return {
    stage,
    role,
    ...(summary.laneId ? { laneId: summary.laneId } : {}),
    agentId: summary.agentId,
    command: commandName,
    adapterId: summary.adapterId,
    ...(summary.writeSet ? { writeSet: structuredClone(summary.writeSet) } : {}),
    workspace: structuredClone(summary.workspace),
    artifactId: summary.evidenceArtifactId,
    runArtifactId: summary.runArtifactId,
    routeDecisionArtifactId: summary.routeDecisionArtifactId,
    ...(summary.adapterArtifactRefs ? { adapterArtifactRefs: structuredClone(summary.adapterArtifactRefs) } : {}),
    verification: structuredClone(summary.verification)
  };
}

function recordObservedExpectedChecks({ evidence, expectedChecks, observedExpectedChecks }) {
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : [];

  for (const expected of expectedChecks) {
    if (checks.some((check) => check?.command === expected || check?.name === expected)) {
      observedExpectedChecks.add(expected);
    }
  }
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

function commandDiagnostic({ command, evidence }) {
  const verificationStatus = command.verification?.status ?? command.verificationStatus;
  const verificationReason = command.verification?.reason ?? command.verificationReason;
  const diagnosticLayer = commandDiagnosticLayer({ verificationStatus, verificationReason, evidence });

  if (!diagnosticLayer) {
    return null;
  }

  return {
    command: command.command,
    artifactId: command.artifactId,
    verificationStatus: verificationStatus ?? 'unknown',
    verificationReason: verificationReason ?? 'unknown',
    diagnosticLayer
  };
}

function commandDiagnosticLayer({ verificationStatus, verificationReason, evidence }) {
  if (hasSchemaRisk(evidence)) {
    return 'schema';
  }

  if (verificationReason === 'scope-violation') {
    return 'workspace';
  }

  if (verificationStatus === 'failed') {
    return 'prompt';
  }

  return null;
}

function harnessDiagnosticLayer({
  reason,
  policyDenied,
  failedSymphony,
  writeSetViolations,
  missingExpectedChecks,
  diagnostics
}) {
  if (reason === 'checks-passed') {
    return null;
  }

  if (policyDenied || writeSetViolations.length > 0 || diagnostics.some((diagnostic) => diagnostic.diagnosticLayer === 'workspace')) {
    return 'workspace';
  }

  if (diagnostics.some((diagnostic) => diagnostic.diagnosticLayer === 'schema')) {
    return 'schema';
  }

  if (missingExpectedChecks.length > 0) {
    return 'expected-check';
  }

  if (diagnostics.some((diagnostic) => diagnostic.diagnosticLayer === 'prompt') || failedSymphony) {
    return 'prompt';
  }

  return null;
}

function hasSchemaRisk(evidence) {
  return Array.isArray(evidence?.knownRisks) && evidence.knownRisks.includes('real-cli-output-unverified');
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

function requireNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TaskPacketValidationError(`${field} must be a non-empty array`);
  }

  return value;
}

function assertSafeId(value, field) {
  const id = requireNonEmptyString(value, field);

  if (id.includes('/') || id.includes('..')) {
    throw new TaskPacketValidationError(`${field} must be a safe id`);
  }
}
