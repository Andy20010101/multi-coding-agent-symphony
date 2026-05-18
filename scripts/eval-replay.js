#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import {
  runEvalReplayGate,
  runEvalWorkflowComparisonGate
} from '../src/eval-replay-gate.js';

try {
  const { values } = parseArgs({
    args: stripLeadingSeparator(process.argv.slice(2)),
    options: {
      artifacts: { type: 'string' },
      events: { type: 'string' },
      session: { type: 'string' },
      tasks: { type: 'string' },
      reason: { type: 'string' },
      baseline: { type: 'string' },
      candidate: { type: 'string' },
      'resource-profile-json': { type: 'string' },
      'baseline-resource-profile-json': { type: 'string' },
      'candidate-resource-profile-json': { type: 'string' },
      'affected-files': { type: 'string' },
      'affected-contracts': { type: 'string' },
      'report-task-id': { type: 'string' },
      'report-artifact-id': { type: 'string' },
      'workflow-comparison-file': { type: 'string' },
      'workflow-comparison-fixture': { type: 'string' },
      'compared-at': { type: 'string' }
    }
  });

  const result = isWorkflowComparison(values)
    ? await runEvalWorkflowComparisonGate({
        artifactDirectory: values.artifacts,
        comparison: await readComparisonFile(values['workflow-comparison-file']),
        comparisonFixture: values['workflow-comparison-fixture'],
        reason: values.reason,
        comparedAt: values['compared-at'],
        reportTaskId: values['report-task-id'] ?? 'eval-reports',
        reportArtifactId: values['report-artifact-id']
      })
    : await runEvalReplayGate({
        artifactDirectory: values.artifacts,
        eventLogDirectory: values.events,
        sessionId: values.session,
        taskIds: parseList(values.tasks, 'tasks'),
        reason: values.reason,
        baseline: values.baseline,
        candidate: values.candidate,
        resourceProfile: parseJsonOption(values['resource-profile-json'], 'resource-profile-json'),
        baselineResourceProfile: parseJsonOption(values['baseline-resource-profile-json'], 'baseline-resource-profile-json'),
        candidateResourceProfile: parseJsonOption(values['candidate-resource-profile-json'], 'candidate-resource-profile-json'),
        affectedFiles: parseList(values['affected-files'], 'affected-files', { required: false }),
        affectedContracts: parseList(values['affected-contracts'], 'affected-contracts', { required: false }),
        reportTaskId: values['report-task-id'] ?? 'eval-reports',
        reportArtifactId: values['report-artifact-id']
      });

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
}

function isWorkflowComparison(values) {
  return values['workflow-comparison-file'] !== undefined ||
    values['workflow-comparison-fixture'] !== undefined;
}

function stripLeadingSeparator(args) {
  return args[0] === '--' ? args.slice(1) : args;
}

async function readComparisonFile(path) {
  if (path === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new TypeError(`workflow-comparison-file must be readable JSON: ${error.message}`);
  }
}

function parseList(value, field, { required = true } = {}) {
  if (value === undefined) {
    if (required) {
      throw new TypeError(`${field} must be a comma-separated list`);
    }

    return [];
  }

  const items = value.split(',').map((item) => item.trim()).filter(Boolean);

  if (items.length === 0) {
    throw new TypeError(`${field} must contain at least one value`);
  }

  return items;
}

function parseJsonOption(value, field) {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new TypeError(`${field} must be valid JSON: ${error.message}`);
  }
}
