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

export function runEvalReplay({
  reason,
  baseline,
  candidate,
  sample,
  resourceProfile,
  coreRouterConfig
}) {
  assertNonEmptyString(reason, 'reason');
  assertNonEmptyString(baseline, 'baseline');
  assertNonEmptyString(candidate, 'candidate');
  validateSample(sample);
  validateResourceProfile(resourceProfile);

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
    recommendations: buildRecommendations({ scores, candidate }),
    resourceProfile: structuredClone(resourceProfile),
    mutatedCoreConfig: didMutateCoreConfig(coreRouterConfig),
    version: '1'
  };
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
    evidenceArtifactId: artifactId
  };
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

function buildRecommendations({ scores, candidate }) {
  if (scores.candidate.verifiedSuccessRate > scores.baseline.verifiedSuccessRate) {
    return [
      {
        type: 'review-routing',
        reason: 'candidate-verified-success-rate-improved',
        candidate
      }
    ];
  }

  return [];
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
