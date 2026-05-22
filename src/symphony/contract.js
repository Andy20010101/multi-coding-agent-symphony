export const PRODUCT_JSON_CONTRACT = Object.freeze({
  name: 'symphony.product-json',
  version: '1',
  stability: 'stable',
  minimumCli: 'v8.2'
});

const ARTIFACT_FIELDS = [
  ['context', 'contextArtifactPath'],
  ['summary', 'summaryArtifactPath'],
  ['evidence', 'evidenceArtifactPath'],
  ['harness', 'harnessOutputPath'],
  ['task-packet', 'taskPacketPath'],
  ['proof', 'proofArtifactPath'],
  ['scaffold-plan', 'scaffoldPlanArtifactPath'],
  ['scaffold-manifest', 'scaffoldManifestArtifactPath']
];

export function withProductJsonContract(summary, {
  contractName = 'symphony.product-summary',
  generatedAt = new Date().toISOString()
} = {}) {
  const artifactRefs = buildArtifactRefs(summary);

  return {
    ...summary,
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName,
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: contractName
    },
    identity: buildIdentity(summary),
    safety: buildSafety(summary),
    workflow: buildWorkflow(summary),
    artifactRefs,
    action: {
      next: summary.nextAction ?? null
    },
    timestamps: {
      createdAt: summary.createdAt ?? null,
      updatedAt: summary.updatedAt ?? null,
      generatedAt
    }
  };
}

export function buildArtifactRefs(source = {}) {
  return ARTIFACT_FIELDS
    .filter(([, field]) => isNonEmptyString(source[field]))
    .map(([kind, field]) => ({
      kind,
      path: source[field]
    }));
}

export function compactRunState(runState) {
  if (runState === null) {
    return null;
  }

  const compact = {
    runId: runState.runId,
    command: runState.command,
    intent: runState.intent,
    semanticCommand: runState.semanticCommand,
    pipeline: Array.isArray(runState.pipeline) ? [...runState.pipeline] : [],
    status: runState.status,
    verifierStatus: runState.verifierStatus,
    safetyMode: runState.safetyMode,
    projectWrites: runState.projectWrites,
    runtimeWrites: runState.runtimeWrites,
    externalCalls: runState.externalCalls,
    destructiveWrites: runState.destructiveWrites,
    routeDecision: cloneStructuredValue(runState.routeDecision),
    matchedSignals: cloneStringArray(runState.matchedSignals),
    workflowMode: runState.workflowMode,
    adapter: runState.adapter,
    executionMode: runState.executionMode,
    providerMode: runState.providerMode,
    provider: runState.provider,
    providerStatus: runState.providerStatus,
    providerFallback: cloneStructuredValue(runState.providerFallback),
    modelInvocation: runState.modelInvocation,
    projectRoot: runState.projectRoot,
    projectFingerprint: runState.projectFingerprint,
    contextReused: runState.contextReused,
    recommendedWorkflow: runState.recommendedWorkflow,
    verificationCommands: cloneStringArray(runState.verificationCommands),
    riskCounts: cloneStructuredValue(runState.riskCounts),
    openQuestionCount: runState.openQuestionCount,
    targetDir: runState.targetDir,
    template: runState.template,
    projectKind: runState.projectKind,
    detectedStack: runState.detectedStack,
    networkInstall: runState.networkInstall,
    unsupportedRequests: cloneStructuredValue(runState.unsupportedRequests),
    scaffoldPlan: cloneStructuredValue(runState.scaffoldPlan),
    changedFiles: cloneStringArray(runState.changedFiles),
    createdFiles: cloneStringArray(runState.createdFiles),
    artifactRefs: buildArtifactRefs(runState),
    nextAction: runState.nextAction,
    createdAt: runState.createdAt,
    updatedAt: runState.updatedAt
  };

  return stripUndefined(compact);
}

function buildIdentity(summary) {
  return stripUndefined({
    runId: summary.runId,
    latestRunId: summary.latestRunId,
    command: summary.command,
    intent: summary.intent,
    semanticCommand: summary.semanticCommand
  });
}

function buildSafety(summary) {
  return stripUndefined({
    mode: summary.safetyMode,
    projectWrites: summary.projectWrites,
    runtimeWrites: summary.runtimeWrites,
    externalCalls: summary.externalCalls,
    destructiveWrites: summary.destructiveWrites ?? false
  });
}

function buildWorkflow(summary) {
  return stripUndefined({
    pipeline: Array.isArray(summary.pipeline) ? [...summary.pipeline] : undefined,
    workflowMode: summary.workflowMode,
    adapter: summary.adapter,
    executionMode: summary.executionMode
  });
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function cloneStringArray(value) {
  return Array.isArray(value) ? [...value] : undefined;
}

function cloneStructuredValue(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
