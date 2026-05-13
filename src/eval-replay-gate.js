import { ArtifactStore } from './artifact-store.js';
import { SessionEventLog } from './session-event-log.js';
import {
  buildReplaySampleFromSession,
  runEvalReplay,
  writeEvalReportArtifact
} from '../plugins/eval-replay/index.js';

export async function runEvalReplayGate({
  artifactDirectory,
  eventLogDirectory,
  sessionId,
  taskIds,
  reason,
  baseline,
  candidate,
  resourceProfile,
  baselineResourceProfile,
  candidateResourceProfile,
  affectedFiles = [],
  affectedContracts = [],
  reportTaskId = 'eval-reports',
  reportArtifactId,
  coreRouterConfig
}) {
  assertNonEmptyString(artifactDirectory, 'artifactDirectory');
  assertNonEmptyString(eventLogDirectory, 'eventLogDirectory');
  assertNonEmptyString(sessionId, 'sessionId');
  assertStringArray(taskIds, 'taskIds');
  assertStringArray(affectedFiles, 'affectedFiles', { allowEmpty: true });
  assertStringArray(affectedContracts, 'affectedContracts', { allowEmpty: true });

  const artifactStore = new ArtifactStore(artifactDirectory);
  const eventLog = new SessionEventLog(eventLogDirectory, sessionId);
  const sample = await buildReplaySampleFromSession({
    artifactStore,
    eventLog,
    taskIds
  });
  const report = runEvalReplay({
    reason,
    baseline,
    candidate,
    sample,
    resourceProfile,
    baselineResourceProfile,
    candidateResourceProfile,
    affectedFiles,
    affectedContracts,
    coreRouterConfig
  });
  const reportRef = await writeEvalReportArtifact({
    artifactStore,
    report,
    taskId: reportTaskId,
    artifactId: reportArtifactId
  });

  return {
    status: 'passed',
    reportRef,
    recommendations: structuredClone(report.recommendations),
    report,
    mutatedCoreConfig: report.mutatedCoreConfig,
    version: '1'
  };
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function assertStringArray(value, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${field} must be a non-empty string array`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TypeError(`${field}[${index}] must be a non-empty string`);
    }
  }
}
