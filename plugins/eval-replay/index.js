import { readFile } from 'node:fs/promises';

export async function loadReplayFixture({ name }) {
  assertSafeFixtureName(name);

  const content = await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
  const fixture = JSON.parse(content);

  validateReplayFixture(fixture);

  return structuredClone(fixture);
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
