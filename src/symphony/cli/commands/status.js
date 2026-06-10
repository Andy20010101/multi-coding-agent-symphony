import { readLatestRun } from '../../state.js';
import { EXIT_CODES, UsageError, readRequiredValue } from '../errors.js';
import { writeProductOutput } from '../output.js';

export async function runStatusCommand({ args, stdout, routeDecision }) {
  const options = parseStateReaderArgs(args);
  const latestRun = await readLatestRun({ stateDir: options.stateDir });
  const summary = latestRun === null
    ? {
        version: '1',
        command: 'symphony status',
        intent: 'status',
        semanticCommand: 'status',
        pipeline: ['status'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: 'no-runs',
        nextAction: 'symphony scan',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      }
    : {
        version: '1',
        command: 'symphony status',
        intent: 'status',
        semanticCommand: 'status',
        pipeline: ['status'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: latestRun.status,
        latestRunId: latestRun.runId,
        latestIntent: latestRun.intent,
        verifierStatus: latestRun.verifierStatus,
        contextArtifactPath: latestRun.contextArtifactPath,
        evidenceArtifactPath: latestRun.evidenceArtifactPath,
        executionPlanArtifactPath: latestRun.executionPlanArtifactPath,
        executionPlanId: latestRun.executionPlanId,
        adoptionPlanArtifactPath: latestRun.adoptionPlanArtifactPath,
        adoptionPlanId: latestRun.adoptionPlanId,
        sourceRunId: latestRun.sourceRunId,
        patchArtifactPath: latestRun.patchArtifactPath,
        patchHash: latestRun.patchHash,
        changedFiles: latestRun.changedFiles,
        confirmationCommand: latestRun.confirmationCommand,
        harnessOutputPath: latestRun.harnessOutputPath,
        taskPacketPath: latestRun.taskPacketPath,
        nextAction: latestRun.nextAction ?? 'symphony artifacts',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

function parseStateReaderArgs(args) {
  const options = {
    stateDir: '.symphony',
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--state-dir') {
      options.stateDir = readRequiredValue(args, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new UsageError(`unknown state option: ${value}`);
    }

    throw new UsageError(`unexpected state argument: ${value}`);
  }

  return options;
}
