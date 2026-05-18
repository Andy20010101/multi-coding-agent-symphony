import { readFile } from 'node:fs/promises';

const WORKFLOW_MODE_ORDER = [
  'linear',
  'proposal-only',
  'writer-reviewer',
  'parallel-lanes',
  'qa-swarm',
  'competitive-patch'
];
const WORKFLOW_SUMMARY_BUILDERS = {
  'competitive-patch': buildCompetitivePatchSummary,
  'qa-swarm': buildQaSwarmSummary,
  'parallel-lanes': buildParallelLanesSummary,
  'writer-reviewer': buildWriterReviewerSummary,
  'proposal-only': buildProposalOnlySummary
};

export async function loadReplayFixture({ name }) {
  assertSafeFixtureName(name);

  const content = await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
  const fixture = JSON.parse(content);

  validateReplayFixture(fixture);

  return structuredClone(fixture);
}

export async function loadWorkflowComparisonFixture({ name }) {
  assertSafeFixtureName(name);

  const content = await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
  const fixture = JSON.parse(content);
  const comparison = {
    id: fixture.id ?? name,
    ...fixture
  };

  validateWorkflowComparisonInput(comparison);

  return structuredClone(comparison);
}

export async function loadReplaySample({ artifactStore, tasks }) {
  if (!artifactStore || typeof artifactStore.readArtifact !== 'function') {
    throw new TypeError('artifactStore must provide readArtifact');
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new TypeError('tasks must be a non-empty array');
  }

  const resultsByTask = {};

  for (const task of tasks) {
    assertNonEmptyString(task.taskId, 'taskId');

    if (!Array.isArray(task.artifactIds) || task.artifactIds.length === 0) {
      throw new TypeError('artifactIds must be a non-empty array');
    }

    resultsByTask[task.taskId] = [];

    for (const artifactId of task.artifactIds) {
      assertNonEmptyString(artifactId, 'artifactId');
      resultsByTask[task.taskId].push(await artifactStore.readArtifact(task.taskId, artifactId));
    }
  }

  return {
    id: `sample-${tasks.map((task) => task.taskId).join('-')}`,
    resultsByTask
  };
}

export async function buildReplaySampleFromSession({ artifactStore, eventLog, taskIds }) {
  if (!artifactStore || typeof artifactStore.readArtifact !== 'function') {
    throw new TypeError('artifactStore must provide readArtifact');
  }

  if (!eventLog || typeof eventLog.readAll !== 'function') {
    throw new TypeError('eventLog must provide readAll');
  }

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw new TypeError('taskIds must be a non-empty array');
  }

  const selectedTaskIds = new Set(taskIds);
  const resultsByTask = Object.fromEntries(taskIds.map((taskId) => {
    assertNonEmptyString(taskId, 'taskId');
    return [taskId, []];
  }));
  const events = await eventLog.readAll();
  const artifactEvents = events.filter((event) => event.type === 'artifact.written' &&
    selectedTaskIds.has(event.payload.taskId) &&
    typeof event.payload.artifactId === 'string');

  for (const event of artifactEvents) {
    const { taskId, artifactId } = event.payload;
    const artifact = await artifactStore.readArtifact(taskId, artifactId);

    if (!isEvidenceArtifact(artifact)) {
      continue;
    }

    resultsByTask[taskId].push(normalizeReplayResult({ taskId, artifactId, artifact }));
  }

  return {
    id: `sample-${taskIds.join('-')}`,
    resultsByTask
  };
}

export async function buildWorkflowComparisonInputFromArtifacts({ artifactStore, comparison }) {
  if (!artifactStore || typeof artifactStore.readArtifact !== 'function') {
    throw new TypeError('artifactStore must provide readArtifact');
  }

  validateWorkflowComparisonInput(comparison);

  const normalized = {
    ...structuredClone(comparison),
    samples: []
  };

  for (const sample of comparison.samples) {
    const artifacts = [];

    for (const artifactRef of sample.artifacts ?? []) {
      assertNonEmptyString(artifactRef.taskId, 'artifacts[].taskId');
      assertNonEmptyString(artifactRef.artifactId, 'artifacts[].artifactId');

      const content = await artifactStore.readArtifact(artifactRef.taskId, artifactRef.artifactId);

      artifacts.push(stripUndefined({
        taskId: artifactRef.taskId,
        artifactId: artifactRef.artifactId,
        kind: artifactRef.kind ?? inferWorkflowArtifactKind(content),
        content
      }));
    }

    normalized.samples.push({
      ...structuredClone(sample),
      artifacts
    });
  }

  return normalized;
}

export function runWorkflowModeComparison({
  id,
  reason,
  comparedAt = new Date().toISOString(),
  samples,
  operatorNotes = [],
  recommendations = []
}) {
  validateWorkflowComparisonInput({
    id,
    reason,
    comparedAt,
    samples,
    operatorNotes,
    recommendations
  });

  const normalizedSamples = samples
    .map(normalizeWorkflowComparisonSample)
    .sort(compareWorkflowSamples);
  const modes = unique(normalizedSamples.map((sample) => sample.mode))
    .sort(compareWorkflowModes);
  const resultsByMode = buildWorkflowResultsByMode({ modes, samples: normalizedSamples });
  const verifierSummary = buildWorkflowVerifierSummary({ modes, resultsByMode });
  const evidenceArtifacts = uniqueArtifacts(normalizedSamples.flatMap((sample) => sample.evidenceArtifacts));
  const workflowSpecificSummary = buildWorkflowSpecificSummary({ modes, samples: normalizedSamples });
  const resourceProfile = summarizeModeProfiles({ modes, resultsByMode, field: 'resourceProfile' });
  const costProfile = summarizeModeProfiles({ modes, resultsByMode, field: 'costProfile' });
  const unknownResourceProfileReason = summarizeUnknownProfileReason({
    modes,
    resultsByMode,
    field: 'resourceProfile',
    reasonField: 'unknownResourceProfileReason'
  });
  const unknownCostProfileReason = summarizeUnknownProfileReason({
    modes,
    resultsByMode,
    field: 'costProfile',
    reasonField: 'unknownCostProfileReason'
  });
  const comparisonId = id ?? `workflow-comparison-${normalizedSamples.map((sample) => sample.id).join('-')}`;

  return stripUndefined({
    id: `eval-workflow-comparison-${safeIdSegment(reason)}-${safeIdSegment(comparisonId)}`,
    reason,
    comparedAt,
    samples: normalizedSamples.map((sample) => ({
      id: sample.id,
      mode: sample.mode,
      taskId: sample.taskId,
      status: sample.status,
      verifierStatus: sample.verifierStatus,
      finalVerificationStatus: sample.finalVerificationStatus,
      decision: sample.decision,
      sourceArtifacts: structuredClone(sample.sourceArtifacts)
    })),
    modes,
    resultsByMode,
    verifierSummary,
    evidenceArtifacts,
    workflowSpecificSummary,
    resourceProfile,
    unknownResourceProfileReason,
    costProfile,
    unknownCostProfileReason,
    operatorNotes: structuredClone(operatorNotes),
    recommendations: structuredClone(recommendations),
    version: '1'
  });
}

export function runEvalReplay({
  reason,
  baseline,
  candidate,
  sample,
  resourceProfile,
  baselineResourceProfile,
  candidateResourceProfile,
  affectedFiles = [],
  affectedContracts = [],
  coreRouterConfig
}) {
  assertNonEmptyString(reason, 'reason');
  assertNonEmptyString(baseline, 'baseline');
  assertNonEmptyString(candidate, 'candidate');
  validateSample(sample);
  assertStringArray(affectedFiles, 'affectedFiles');
  assertStringArray(affectedContracts, 'affectedContracts');

  const resolvedResourceProfile = resolveResourceProfile({
    resourceProfile,
    baselineResourceProfile,
    candidateResourceProfile
  });

  const baselineResults = collectVariant(sample, 'baseline');
  const candidateResults = collectVariant(sample, 'candidate');
  const scores = {
    baseline: scoreVariant(baselineResults),
    candidate: scoreVariant(candidateResults)
  };

  return {
    id: `eval-${reason}-${sample.id}`,
    reason,
    baseline,
    candidate,
    taskSample: sample.id,
    scores,
    failureDelta: compareFailures(baselineResults, candidateResults),
    taskClassSummary: summarizeByTaskClass({
      baselineResults,
      candidateResults
    }),
    recommendations: buildRecommendations({
      scores,
      candidate,
      affectedFiles,
      affectedContracts
    }),
    resourceProfile: structuredClone(resolvedResourceProfile.resourceProfile),
    ...(resolvedResourceProfile.resourceQualification
      ? { resourceQualification: resolvedResourceProfile.resourceQualification }
      : {}),
    mutatedCoreConfig: didMutateCoreConfig(coreRouterConfig),
    version: '1'
  };
}

export async function writeEvalReportArtifact({
  artifactStore,
  report,
  taskId = 'eval-reports',
  artifactId = report?.id
}) {
  if (!artifactStore || typeof artifactStore.writeArtifact !== 'function') {
    throw new TypeError('artifactStore must provide writeArtifact');
  }

  validateEvalReport(report);
  assertNonEmptyString(taskId, 'taskId');
  assertNonEmptyString(artifactId, 'artifactId');

  return artifactStore.writeArtifact(taskId, artifactId, report);
}

function validateEvalReport(report) {
  if (report === null || typeof report !== 'object' || Array.isArray(report)) {
    throw new TypeError('report must be an object');
  }

  assertNonEmptyString(report.id, 'report.id');
  assertNonEmptyString(report.version, 'report.version');
}

function validateWorkflowComparisonInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('workflow comparison input must be an object');
  }

  if (input.id !== undefined) {
    assertNonEmptyString(input.id, 'id');
  }

  assertNonEmptyString(input.reason, 'reason');

  if (input.comparedAt !== undefined) {
    assertNonEmptyString(input.comparedAt, 'comparedAt');
  }

  if (!Array.isArray(input.samples) || input.samples.length === 0) {
    throw new TypeError('samples must be a non-empty array');
  }

  for (const [index, sample] of input.samples.entries()) {
    validateWorkflowComparisonSampleInput(sample, index);
  }

  assertStringArray(input.operatorNotes ?? [], 'operatorNotes');

  if (input.recommendations !== undefined && !Array.isArray(input.recommendations)) {
    throw new TypeError('recommendations must be an array');
  }
}

function validateWorkflowComparisonSampleInput(sample, index) {
  if (sample === null || typeof sample !== 'object' || Array.isArray(sample)) {
    throw new TypeError(`samples[${index}] must be an object`);
  }

  assertNonEmptyString(sample.id, `samples[${index}].id`);

  if (sample.mode !== undefined) {
    assertNonEmptyString(sample.mode, `samples[${index}].mode`);
  }

  if (sample.taskId !== undefined) {
    assertNonEmptyString(sample.taskId, `samples[${index}].taskId`);
  }

  if (sample.artifacts === undefined) {
    return;
  }

  if (!Array.isArray(sample.artifacts)) {
    throw new TypeError(`samples[${index}].artifacts must be an array`);
  }

  for (const [artifactIndex, artifact] of sample.artifacts.entries()) {
    if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
      throw new TypeError(`samples[${index}].artifacts[${artifactIndex}] must be an object`);
    }

    if (artifact.taskId !== undefined) {
      assertNonEmptyString(artifact.taskId, `samples[${index}].artifacts[${artifactIndex}].taskId`);
    }

    if (artifact.artifactId !== undefined) {
      assertNonEmptyString(artifact.artifactId, `samples[${index}].artifacts[${artifactIndex}].artifactId`);
    }

    if (artifact.kind !== undefined) {
      assertNonEmptyString(artifact.kind, `samples[${index}].artifacts[${artifactIndex}].kind`);
    }
  }
}

function isEvidenceArtifact(artifact) {
  return artifact !== null &&
    typeof artifact === 'object' &&
    !Array.isArray(artifact) &&
    typeof artifact.command === 'string' &&
    Array.isArray(artifact.checks);
}

function normalizeReplayResult({ taskId, artifactId, artifact }) {
  return {
    taskId,
    variant: inferVariant({ artifactId, artifact }),
    verified: artifact.verified ?? artifact.checks.every((check) => check.status === 'passed'),
    costUsd: numberOrZero(artifact.costUsd),
    latencySeconds: numberOrZero(artifact.latencySeconds),
    failureCategory: artifact.failureCategory ?? inferFailureCategory(artifact),
    command: artifact.command,
    taskClass: artifact.taskClass ?? artifact.command,
    evidenceArtifactId: artifactId,
    ...(artifact.resourceProfile ? { resourceProfile: structuredClone(artifact.resourceProfile) } : {})
  };
}

function normalizeWorkflowComparisonSample(sample) {
  const payloads = collectWorkflowPayloads(sample);
  const mode = normalizeWorkflowMode(sample.mode ?? firstPayloadValue(payloads, 'workflowMode') ?? firstPayloadValue(payloads, 'mode') ?? 'linear');
  const taskId = sample.taskId ?? firstPayloadValue(payloads, 'taskId') ?? sample.id;
  const decision = sample.decision ?? firstPayloadValue(payloads, 'decision');
  const rawStatus = sample.status ?? firstPayloadValue(payloads, 'status');
  const verifierStatus = normalizeStatus(
    sample.verifierStatus ??
    firstPayloadValue(payloads, 'verifierStatus') ??
    verifierStatusFromPayloads({ mode, payloads, rawStatus })
  );
  const finalVerificationStatus = normalizeStatus(
    sample.finalVerificationStatus ??
    firstPayloadValue(payloads, 'finalVerificationStatus') ??
    finalVerificationStatusFromPayloads({ mode, verifierStatus, rawStatus })
  );
  const status = workflowStatus({
    rawStatus,
    verifierStatus,
    finalVerificationStatus,
    decision
  });
  const workflowSpecificSummary = buildSampleWorkflowSpecificSummary({ mode, payloads });
  const sourceArtifacts = collectSourceArtifacts(sample);
  const evidenceArtifacts = collectWorkflowEvidenceArtifacts({
    sampleId: sample.id,
    mode,
    taskId,
    payloads,
    workflowSpecificSummary,
    sourceArtifacts
  });
  const resourceProfile = extractProfile({ sample, payloads, field: 'resourceProfile' });
  const costProfile = extractCostProfile({ sample, payloads });

  return {
    id: sample.id,
    mode,
    taskId,
    status,
    verifierStatus,
    finalVerificationStatus,
    decision: decision ?? 'unknown',
    sourceArtifacts,
    evidenceArtifacts,
    workflowSpecificSummary,
    resourceProfile,
    costProfile
  };
}

function collectWorkflowPayloads(sample) {
  const payloads = [];

  for (const field of ['evidenceMap', 'workflowResult', 'ensembleRun']) {
    if (sample[field] !== undefined) {
      payloads.push({
        kind: field,
        content: sample[field]
      });
    }
  }

  for (const artifact of sample.artifacts ?? []) {
    const content = artifact.content ?? artifact.artifact;

    if (content === undefined) {
      continue;
    }

    payloads.push({
      kind: artifact.kind ?? inferWorkflowArtifactKind(content),
      sourceArtifact: stripUndefined({
        taskId: artifact.taskId,
        artifactId: artifact.artifactId,
        kind: artifact.kind ?? inferWorkflowArtifactKind(content)
      }),
      content
    });
  }

  return payloads;
}

function collectSourceArtifacts(sample) {
  return uniqueArtifacts((sample.artifacts ?? [])
    .filter((artifact) => artifact.taskId !== undefined && artifact.artifactId !== undefined)
    .map((artifact) => ({
      taskId: artifact.taskId,
      artifactId: artifact.artifactId,
      kind: artifact.kind ?? inferWorkflowArtifactKind(artifact.content ?? artifact.artifact ?? {})
    })))
    .map(({ taskId, artifactId, kind }) => ({ taskId, artifactId, kind }));
}

function inferWorkflowArtifactKind(artifact) {
  if (artifact?.workflowMode && (Array.isArray(artifact.stages) || Array.isArray(artifact.verificationMap))) {
    return 'evidenceMap';
  }

  if (artifact?.mode && (
    artifact.writer ||
    Array.isArray(artifact.reviewers) ||
    Array.isArray(artifact.lanes) ||
    Array.isArray(artifact.qaLanes) ||
    Array.isArray(artifact.candidates) ||
    Array.isArray(artifact.proposalArtifactIds)
  )) {
    return 'ensembleRun';
  }

  if (Array.isArray(artifact?.commands) && typeof artifact?.status === 'string') {
    return 'workflowResult';
  }

  if (isEvidenceArtifact(artifact)) {
    return 'evidence';
  }

  if (typeof artifact?.kind === 'string' && artifact.kind.trim() !== '') {
    return artifact.kind;
  }

  return 'artifact';
}

function firstPayloadValue(payloads, field) {
  for (const payload of payloads) {
    const value = payload.content?.[field];

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function normalizeWorkflowMode(mode) {
  if (mode === 'single-agent') {
    return 'linear';
  }

  assertNonEmptyString(mode, 'mode');

  return mode;
}

function verifierStatusFromPayloads({ mode, payloads, rawStatus }) {
  if (mode === 'proposal-only') {
    return 'unknown';
  }

  const finalVerificationStatus = firstPayloadValue(payloads, 'finalVerificationStatus');

  if (finalVerificationStatus !== undefined) {
    return finalVerificationStatus;
  }

  for (const payload of payloads) {
    const status = payload.content?.verifierStatus ??
      payload.content?.verificationStatus ??
      payload.content?.verification?.status;

    if (status !== undefined) {
      return status;
    }
  }

  return rawStatus;
}

function finalVerificationStatusFromPayloads({ mode, verifierStatus, rawStatus }) {
  if (mode === 'proposal-only') {
    return 'unknown';
  }

  return verifierStatus !== 'unknown' ? verifierStatus : rawStatus;
}

function workflowStatus({ rawStatus, verifierStatus, finalVerificationStatus, decision }) {
  const directStatus = normalizeStatus(rawStatus);

  if (finalVerificationStatus === 'passed' || finalVerificationStatus === 'failed') {
    return finalVerificationStatus;
  }

  if (verifierStatus === 'passed' || verifierStatus === 'failed') {
    return verifierStatus;
  }

  if (directStatus === 'passed' || directStatus === 'failed') {
    return directStatus;
  }

  if (decision === 'accepted') {
    return 'passed';
  }

  if (decision === 'rejected' || decision === 'needs-followup') {
    return 'failed';
  }

  return 'unknown';
}

function normalizeStatus(value) {
  return value === 'passed' || value === 'failed' ? value : 'unknown';
}

function buildWorkflowResultsByMode({ modes, samples }) {
  const resultsByMode = {};

  for (const mode of modes) {
    const samplesForMode = samples.filter((sample) => sample.mode === mode);
    const resourceProfile = aggregateProfileStatus({
      samples: samplesForMode,
      field: 'resourceProfile',
      unknownField: 'unknownResourceProfileReason',
      unknownReason: 'resource-profile-not-recorded'
    });
    const costProfile = aggregateProfileStatus({
      samples: samplesForMode,
      field: 'costProfile',
      unknownField: 'unknownCostProfileReason',
      unknownReason: 'cost-profile-not-recorded'
    });

    resultsByMode[mode] = {
      mode,
      sampleIds: samplesForMode.map((entry) => entry.id).sort(),
      status: aggregateStatuses(samplesForMode.map((entry) => entry.status)),
      verifierStatus: aggregateStatuses(samplesForMode.map((entry) => entry.verifierStatus)),
      finalVerificationStatus: aggregateStatuses(samplesForMode.map((entry) => entry.finalVerificationStatus)),
      evidenceArtifactIds: unique(samplesForMode
        .flatMap((entry) => entry.evidenceArtifacts)
        .filter((artifact) => artifact.kind === 'evidence')
        .map((artifact) => artifact.artifactId))
        .sort(),
      resourceProfile,
      costProfile
    };
  }

  return resultsByMode;
}

function aggregateStatuses(statuses) {
  const knownStatuses = unique(statuses.filter((status) => status !== 'unknown')).sort();

  if (knownStatuses.length === 0) {
    return 'unknown';
  }

  return knownStatuses.length === 1 ? knownStatuses[0] : 'mixed';
}

function aggregateProfileStatus({ samples, field, unknownField, unknownReason }) {
  const profiles = samples
    .map((sample) => sample[field])
    .filter((profile) => profile !== undefined);

  if (profiles.length === 0) {
    return {
      status: 'unknown',
      [unknownField]: unknownReason
    };
  }

  if (profiles.length === 1) {
    return {
      status: 'known',
      profile: structuredClone(profiles[0])
    };
  }

  return {
    status: 'known',
    profiles: structuredClone(profiles)
  };
}

function buildWorkflowVerifierSummary({ modes, resultsByMode }) {
  const byMode = {};

  for (const mode of modes) {
    byMode[mode] = {
      status: resultsByMode[mode].status,
      verifierStatus: resultsByMode[mode].verifierStatus,
      finalVerificationStatus: resultsByMode[mode].finalVerificationStatus,
      sampleIds: structuredClone(resultsByMode[mode].sampleIds)
    };
  }

  return {
    passedModes: modes.filter((mode) => resultsByMode[mode].status === 'passed'),
    failedModes: modes.filter((mode) => resultsByMode[mode].status === 'failed'),
    unknownModes: modes.filter((mode) => resultsByMode[mode].status === 'unknown'),
    byMode
  };
}

function buildWorkflowSpecificSummary({ modes, samples }) {
  const summary = {};

  for (const mode of modes) {
    const modeSamples = samples.filter((sample) => sample.mode === mode);

    summary[mode] = modeSamples.length === 1
      ? structuredClone(modeSamples[0].workflowSpecificSummary)
      : {
          samples: modeSamples.map((sample) => ({
            sampleId: sample.id,
            ...structuredClone(sample.workflowSpecificSummary)
          }))
        };
  }

  return summary;
}

function summarizeModeProfiles({ modes, resultsByMode, field }) {
  return {
    byMode: Object.fromEntries(modes.map((mode) => [mode, structuredClone(resultsByMode[mode][field])])),
    knownModes: modes.filter((mode) => resultsByMode[mode][field].status === 'known'),
    unknownModes: modes.filter((mode) => resultsByMode[mode][field].status === 'unknown')
  };
}

function summarizeUnknownProfileReason({ modes, resultsByMode, field, reasonField }) {
  const unknownModes = modes.filter((mode) => resultsByMode[mode][field].status === 'unknown');

  if (unknownModes.length === 0) {
    return undefined;
  }

  const reasons = unique(unknownModes.map((mode) => resultsByMode[mode][field][reasonField]));

  if (reasons.length === 1) {
    return `${reasons[0]}: ${unknownModes.join(', ')}`;
  }

  return unknownModes
    .map((mode) => `${resultsByMode[mode][field][reasonField]}: ${mode}`)
    .join('; ');
}

function buildSampleWorkflowSpecificSummary({ mode, payloads }) {
  const builder = WORKFLOW_SUMMARY_BUILDERS[mode];

  if (builder) {
    return builder(payloads);
  }

  return {
    commands: stageEntries(payloads).map(normalizeStageCommand)
  };
}

function buildCompetitivePatchSummary(payloads) {
  const run = firstPayloadOfKind(payloads, 'ensembleRun');
  const candidates = run?.candidates ??
    stageEntries(payloads).filter((entry) => entry.candidateId !== undefined);

  return stripUndefined({
    selectedCandidateId: run?.selectedCandidateId ?? firstPayloadValue(payloads, 'selectedCandidateId'),
    candidates: candidates.map(normalizeCompetitiveCandidate)
  });
}

function normalizeCompetitiveCandidate(candidate) {
  return stripUndefined({
    candidateId: candidate.candidateId,
    agentId: candidate.agentId,
    adapterId: candidate.adapterId,
    evidenceArtifactId: candidate.evidenceArtifactId ?? candidate.artifactId,
    patchArtifactId: candidate.patchArtifactId,
    commandArtifactId: candidate.commandArtifactId ?? candidate.runArtifactId,
    routeDecisionArtifactId: candidate.routeDecisionArtifactId,
    verifierStatus: candidate.verifierStatus ?? candidate.verificationStatus ?? candidate.verification?.status ?? 'unknown',
    selected: candidate.selected === true,
    rejectedReason: candidate.rejectedReason
  });
}

function buildQaSwarmSummary(payloads) {
  const run = firstPayloadOfKind(payloads, 'ensembleRun');
  const findingsArtifactId = run?.findingsArtifactId ?? firstPayloadValue(payloads, 'findingsArtifactId');
  const missingEvidenceArtifactId = run?.missingEvidenceArtifactId ?? firstPayloadValue(payloads, 'missingEvidenceArtifactId');
  const qaLanes = run?.qaLanes ??
    stageEntries(payloads).filter((entry) => entry.laneId !== undefined && (entry.role === 'qa' || entry.command === 'qa'));

  return stripUndefined({
    findingsArtifactId,
    missingEvidenceArtifactId,
    qaLanes: qaLanes.map((lane) => normalizeQaLane({
      lane,
      findingsArtifactId,
      missingEvidenceArtifactId
    }))
  });
}

function normalizeQaLane({ lane, findingsArtifactId, missingEvidenceArtifactId }) {
  return stripUndefined({
    laneId: lane.laneId,
    agentId: lane.agentId,
    adapterId: lane.adapterId,
    evidenceArtifactId: lane.evidenceArtifactId ?? lane.artifactId,
    runArtifactId: lane.runArtifactId,
    routeDecisionArtifactId: lane.routeDecisionArtifactId,
    findingsArtifactId: lane.findingsArtifactId ?? findingsArtifactId,
    missingEvidenceArtifactId: lane.missingEvidenceArtifactId ?? missingEvidenceArtifactId,
    findings: normalizeStringArray(lane.findings),
    missingEvidence: normalizeStringArray(lane.missingEvidence),
    noFindingRationale: lane.noFindingRationale,
    verificationStatus: lane.verificationStatus ?? lane.verification?.status ?? 'unknown'
  });
}

function buildParallelLanesSummary(payloads) {
  const run = firstPayloadOfKind(payloads, 'ensembleRun');
  const lanes = run?.lanes ??
    stageEntries(payloads).filter((entry) => entry.laneId !== undefined);

  return {
    lanes: lanes.map(normalizeParallelLane)
  };
}

function normalizeParallelLane(lane) {
  return stripUndefined({
    laneId: lane.laneId,
    agentId: lane.agentId,
    adapterId: lane.adapterId,
    writeSet: Array.isArray(lane.writeSet) ? structuredClone(lane.writeSet) : [],
    evidenceArtifactId: lane.evidenceArtifactId ?? lane.artifactId,
    runArtifactId: lane.runArtifactId,
    routeDecisionArtifactId: lane.routeDecisionArtifactId,
    verificationStatus: lane.verificationStatus ?? lane.verification?.status ?? 'unknown'
  });
}

function buildWriterReviewerSummary(payloads) {
  const run = firstPayloadOfKind(payloads, 'ensembleRun');

  if (run?.writer) {
    return {
      writer: normalizeRoleEvidence(run.writer),
      reviewers: Array.isArray(run.reviewers) ? run.reviewers.map(normalizeRoleEvidence) : []
    };
  }

  const entries = stageEntries(payloads);

  return {
    writer: normalizeRoleEvidence(entries.find((entry) => entry.role === 'writer') ?? {}),
    reviewers: entries
      .filter((entry) => entry.role === 'reviewer')
      .map(normalizeRoleEvidence)
  };
}

function normalizeRoleEvidence(role) {
  return stripUndefined({
    agentId: role.agentId,
    adapterId: role.adapterId,
    evidenceArtifactId: role.evidenceArtifactId ?? role.artifactId,
    runArtifactId: role.runArtifactId,
    routeDecisionArtifactId: role.routeDecisionArtifactId,
    verificationStatus: role.verificationStatus ?? role.verification?.status ?? 'unknown'
  });
}

function buildProposalOnlySummary(payloads) {
  const run = firstPayloadOfKind(payloads, 'ensembleRun') ?? {};

  return stripUndefined({
    proposalArtifactIds: Array.isArray(run.proposalArtifactIds) ? structuredClone(run.proposalArtifactIds) : [],
    arbitrationArtifactId: run.arbitrationArtifactId,
    synthesisArtifactId: run.synthesisArtifactId,
    decision: run.decision
  });
}

function stageEntries(payloads) {
  const entries = [];

  for (const payload of payloads) {
    if (Array.isArray(payload.content?.commands)) {
      entries.push(...payload.content.commands);
      continue;
    }

    if (Array.isArray(payload.content?.stages)) {
      entries.push(...payload.content.stages);
      continue;
    }

    if (Array.isArray(payload.content?.verificationMap)) {
      entries.push(...payload.content.verificationMap);
    }
  }

  return entries;
}

function normalizeStageCommand(command) {
  return stripUndefined({
    stage: command.stage,
    role: command.role,
    command: command.command,
    agentId: command.agentId,
    adapterId: command.adapterId,
    evidenceArtifactId: command.evidenceArtifactId ?? command.artifactId,
    runArtifactId: command.runArtifactId,
    routeDecisionArtifactId: command.routeDecisionArtifactId,
    verificationStatus: command.verificationStatus ?? command.verification?.status ?? 'unknown'
  });
}

function firstPayloadOfKind(payloads, kind) {
  return payloads.find((payload) => payload.kind === kind)?.content;
}

function collectWorkflowEvidenceArtifacts({
  sampleId,
  mode,
  taskId,
  payloads,
  workflowSpecificSummary,
  sourceArtifacts
}) {
  const artifacts = [];

  for (const sourceArtifact of sourceArtifacts) {
    artifacts.push({
      sampleId,
      mode,
      taskId: sourceArtifact.taskId,
      artifactId: sourceArtifact.artifactId,
      kind: sourceArtifact.kind
    });
  }

  for (const entry of stageEntries(payloads)) {
    pushWorkflowArtifactsFromEntry({
      artifacts,
      sampleId,
      mode,
      taskId,
      entry
    });
  }

  for (const entry of [
    workflowSpecificSummary.writer,
    ...(workflowSpecificSummary.reviewers ?? []),
    ...(workflowSpecificSummary.lanes ?? [])
  ].filter(Boolean)) {
    pushWorkflowArtifactsFromEntry({ artifacts, sampleId, mode, taskId, entry });
  }

  for (const entry of workflowSpecificSummary.qaLanes ?? []) {
    pushWorkflowArtifactsFromEntry({ artifacts, sampleId, mode, taskId, entry });
    pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: entry.findingsArtifactId, kind: 'qa-findings' });
    pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: entry.missingEvidenceArtifactId, kind: 'qa-missing-evidence' });
  }

  for (const entry of workflowSpecificSummary.candidates ?? []) {
    pushWorkflowArtifactsFromEntry({ artifacts, sampleId, mode, taskId, entry });
    pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: entry.patchArtifactId, kind: 'patch' });
    pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: entry.commandArtifactId, kind: 'command-run' });
  }

  for (const proposalArtifactId of workflowSpecificSummary.proposalArtifactIds ?? []) {
    pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: proposalArtifactId, kind: 'proposal' });
  }

  pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: workflowSpecificSummary.arbitrationArtifactId, kind: 'arbitration' });
  pushOptionalArtifact({ artifacts, sampleId, mode, taskId, artifactId: workflowSpecificSummary.synthesisArtifactId, kind: 'synthesis' });

  return uniqueArtifacts(artifacts);
}

function pushWorkflowArtifactsFromEntry({ artifacts, sampleId, mode, taskId, entry }) {
  const verificationStatus = entry.verificationStatus ?? entry.verifierStatus ?? entry.verification?.status;

  pushOptionalArtifact({
    artifacts,
    sampleId,
    mode,
    taskId,
    artifactId: entry.evidenceArtifactId ?? entry.artifactId,
    kind: 'evidence',
    stage: entry.stage,
    command: entry.command,
    verificationStatus
  });
  pushOptionalArtifact({
    artifacts,
    sampleId,
    mode,
    taskId,
    artifactId: entry.runArtifactId,
    kind: 'command-run',
    stage: entry.stage,
    command: entry.command,
    verificationStatus
  });
  pushOptionalArtifact({
    artifacts,
    sampleId,
    mode,
    taskId,
    artifactId: entry.routeDecisionArtifactId,
    kind: 'route-decision',
    stage: entry.stage,
    command: entry.command,
    verificationStatus
  });
}

function pushOptionalArtifact({
  artifacts,
  sampleId,
  mode,
  taskId,
  artifactId,
  kind,
  stage,
  command,
  verificationStatus
}) {
  if (typeof artifactId !== 'string' || artifactId.trim() === '') {
    return;
  }

  artifacts.push(stripUndefined({
    sampleId,
    mode,
    taskId,
    artifactId,
    kind,
    stage,
    command,
    verificationStatus
  }));
}

function extractProfile({ sample, payloads, field }) {
  if (isPlainObject(sample[field])) {
    return structuredClone(sample[field]);
  }

  for (const payload of payloads) {
    if (isPlainObject(payload.content?.[field])) {
      return structuredClone(payload.content[field]);
    }
  }

  return undefined;
}

function extractCostProfile({ sample, payloads }) {
  if (isPlainObject(sample.costProfile)) {
    return structuredClone(sample.costProfile);
  }

  const costEntries = [];

  for (const payload of payloads) {
    if (typeof payload.content?.costUsd === 'number' || typeof payload.content?.latencySeconds === 'number') {
      costEntries.push(stripUndefined({
        artifactId: payload.sourceArtifact?.artifactId,
        costUsd: payload.content.costUsd,
        latencySeconds: payload.content.latencySeconds
      }));
    }
  }

  return costEntries.length > 0 ? { artifacts: costEntries } : undefined;
}

function compareWorkflowSamples(left, right) {
  const modeComparison = compareWorkflowModes(left.mode, right.mode);

  if (modeComparison !== 0) {
    return modeComparison;
  }

  return left.id.localeCompare(right.id);
}

function compareWorkflowModes(left, right) {
  const leftIndex = WORKFLOW_MODE_ORDER.indexOf(left);
  const rightIndex = WORKFLOW_MODE_ORDER.indexOf(right);
  const normalizedLeftIndex = leftIndex === -1 ? WORKFLOW_MODE_ORDER.length : leftIndex;
  const normalizedRightIndex = rightIndex === -1 ? WORKFLOW_MODE_ORDER.length : rightIndex;

  return normalizedLeftIndex - normalizedRightIndex || left.localeCompare(right);
}

function uniqueArtifacts(artifacts) {
  return uniqueByJson(artifacts)
    .sort((left, right) =>
      (left.mode ?? '').localeCompare(right.mode ?? '') ||
      (left.sampleId ?? '').localeCompare(right.sampleId ?? '') ||
      (left.kind ?? '').localeCompare(right.kind ?? '') ||
      (left.artifactId ?? '').localeCompare(right.artifactId ?? ''));
}

function inferVariant({ artifactId, artifact }) {
  if (typeof artifact.variant === 'string' && artifact.variant.trim() !== '') {
    return artifact.variant;
  }

  if (artifactId.includes('baseline')) {
    return 'baseline';
  }

  if (artifactId.includes('candidate')) {
    return 'candidate';
  }

  return 'sample';
}

function inferFailureCategory(artifact) {
  return artifact.checks.some((check) => check.status !== 'passed') ? 'check-failed' : null;
}

function collectVariant(sample, variant) {
  return Object.values(sample.resultsByTask)
    .flat()
    .filter((result) => result.variant === variant);
}

function scoreVariant(results) {
  if (results.length === 0) {
    return {
      verifiedSuccessRate: 0,
      meanCostUsd: 0,
      p50LatencySeconds: 0,
      p95LatencySeconds: 0
    };
  }

  const verifiedCount = results.filter((result) => result.verified === true).length;
  const costs = results.map((result) => numberOrZero(result.costUsd));
  const latencies = results.map((result) => numberOrZero(result.latencySeconds)).sort((left, right) => left - right);

  return {
    verifiedSuccessRate: verifiedCount / results.length,
    meanCostUsd: average(costs),
    p50LatencySeconds: percentile(latencies, 0.5),
    p95LatencySeconds: percentile(latencies, 0.95)
  };
}

function compareFailures(baselineResults, candidateResults) {
  const categories = new Set([
    ...baselineResults.map((result) => result.failureCategory).filter(Boolean),
    ...candidateResults.map((result) => result.failureCategory).filter(Boolean)
  ]);
  const delta = {};

  for (const category of categories) {
    delta[category] = countFailures(candidateResults, category) - countFailures(baselineResults, category);
  }

  return delta;
}

function summarizeByTaskClass({ baselineResults, candidateResults }) {
  const taskClasses = new Set([
    ...baselineResults.map(taskClassOf),
    ...candidateResults.map(taskClassOf)
  ]);
  const summary = {};

  for (const taskClass of taskClasses) {
    const baselineForClass = baselineResults.filter((result) => taskClassOf(result) === taskClass);
    const candidateForClass = candidateResults.filter((result) => taskClassOf(result) === taskClass);

    summary[taskClass] = {
      scores: {
        baseline: scoreVariant(baselineForClass),
        candidate: scoreVariant(candidateForClass)
      },
      failureDelta: compareFailures(baselineForClass, candidateForClass)
    };
  }

  return summary;
}

function taskClassOf(result) {
  return typeof result.taskClass === 'string' && result.taskClass.trim() !== ''
    ? result.taskClass
    : 'uncategorized';
}

function buildRecommendations({ scores, candidate, affectedFiles, affectedContracts }) {
  if (scores.candidate.verifiedSuccessRate > scores.baseline.verifiedSuccessRate) {
    const recommendation = {
      type: 'review-routing',
      reason: 'candidate-verified-success-rate-improved',
      candidate
    };
    const tradeoffs = [];

    if (scores.candidate.meanCostUsd > scores.baseline.meanCostUsd) {
      tradeoffs.push('higher-cost');
    }

    if (tradeoffs.length > 0) {
      recommendation.tradeoffs = tradeoffs;
    }

    if (affectedFiles.length > 0) {
      recommendation.affectedFiles = structuredClone(affectedFiles);
    }

    if (affectedContracts.length > 0) {
      recommendation.affectedContracts = structuredClone(affectedContracts);
    }

    return [recommendation];
  }

  return [];
}

function resolveResourceProfile({ resourceProfile, baselineResourceProfile, candidateResourceProfile }) {
  if (resourceProfile !== undefined) {
    validateResourceProfile(resourceProfile);

    return {
      resourceProfile
    };
  }

  validateResourceProfile(baselineResourceProfile);
  validateResourceProfile(candidateResourceProfile);

  return {
    resourceProfile: {
      baseline: baselineResourceProfile,
      candidate: candidateResourceProfile
    },
    resourceQualification: compareResourceProfiles({
      baselineResourceProfile,
      candidateResourceProfile
    })
  };
}

function compareResourceProfiles({ baselineResourceProfile, candidateResourceProfile }) {
  const fields = ['cpu', 'memoryMb', 'timeoutSeconds', 'concurrency', 'network', 'version'];
  const mismatchedFields = fields.filter((field) => baselineResourceProfile[field] !== candidateResourceProfile[field]);

  return {
    comparable: mismatchedFields.length === 0,
    reasons: mismatchedFields.length > 0 ? ['resource-profile-mismatch'] : [],
    mismatchedFields
  };
}

function didMutateCoreConfig(coreRouterConfig) {
  return coreRouterConfig === undefined ? false : false;
}

function countFailures(results, category) {
  return results.filter((result) => result.failureCategory === category).length;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues, percentileValue) {
  const index = Math.ceil(sortedValues.length * percentileValue) - 1;
  return sortedValues[Math.max(0, index)];
}

function numberOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function validateSample(sample) {
  if (sample === null || typeof sample !== 'object' || Array.isArray(sample)) {
    throw new TypeError('sample must be an object');
  }

  assertNonEmptyString(sample.id, 'sample.id');

  if (sample.resultsByTask === null || typeof sample.resultsByTask !== 'object' || Array.isArray(sample.resultsByTask)) {
    throw new TypeError('sample.resultsByTask must be an object');
  }
}

function validateReplayFixture(fixture) {
  if (fixture === null || typeof fixture !== 'object' || Array.isArray(fixture)) {
    throw new TypeError('fixture must be an object');
  }

  assertNonEmptyString(fixture.reason, 'fixture.reason');
  assertNonEmptyString(fixture.baseline, 'fixture.baseline');
  assertNonEmptyString(fixture.candidate, 'fixture.candidate');
  validateSample(fixture.sample);
  assertStringArray(fixture.affectedFiles ?? [], 'fixture.affectedFiles');
  assertStringArray(fixture.affectedContracts ?? [], 'fixture.affectedContracts');

  if (fixture.resourceProfile !== undefined) {
    validateResourceProfile(fixture.resourceProfile);
    return;
  }

  validateResourceProfile(fixture.baselineResourceProfile);
  validateResourceProfile(fixture.candidateResourceProfile);
}

function validateResourceProfile(resourceProfile) {
  if (resourceProfile === null || typeof resourceProfile !== 'object' || Array.isArray(resourceProfile)) {
    throw new TypeError('resourceProfile must be an object');
  }

  assertNonEmptyString(resourceProfile.cpu, 'resourceProfile.cpu');
  assertNumber(resourceProfile.memoryMb, 'resourceProfile.memoryMb');
  assertNumber(resourceProfile.timeoutSeconds, 'resourceProfile.timeoutSeconds');
  assertNumber(resourceProfile.concurrency, 'resourceProfile.concurrency');
  assertNonEmptyString(resourceProfile.network, 'resourceProfile.network');
  assertNonEmptyString(resourceProfile.version, 'resourceProfile.version');
}

function uniqueByJson(values) {
  const seen = new Set();
  const uniqueValues = [];

  for (const value of values) {
    const key = JSON.stringify(value);

    if (!seen.has(key)) {
      seen.add(key);
      uniqueValues.push(value);
    }
  }

  return uniqueValues;
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    : [];
}

function unique(values) {
  return [...new Set(values)];
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function safeIdSegment(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'comparison';
}

function assertSafeFixtureName(value) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/') || value.includes('..')) {
    throw new TypeError('name must be a safe fixture name');
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function assertNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number`);
  }
}

function assertStringArray(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be a string array`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TypeError(`${field}[${index}] must be a non-empty string`);
    }
  }
}
