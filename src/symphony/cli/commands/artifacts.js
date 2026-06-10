import { readRunState } from '../../state.js';
import { EXIT_CODES, UsageError, readRequiredValue } from '../errors.js';
import { writeProductOutput } from '../output.js';

export async function runArtifactsCommand({ args, stdout, routeDecision }) {
  const options = parseArtifactsArgs(args);
  const runState = await readRunState({
    stateDir: options.stateDir,
    runId: options.runId
  });
  const summary = runState === null
    ? {
        version: '1',
        command: 'symphony artifacts',
        intent: 'artifacts',
        semanticCommand: 'artifacts',
        pipeline: ['artifacts'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: 'missing',
        runId: options.runId ?? 'latest',
        nextAction: 'symphony status',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      }
    : {
        version: '1',
        command: 'symphony artifacts',
        intent: 'artifacts',
        semanticCommand: 'artifacts',
        pipeline: ['artifacts'],
        safetyMode: 'read-only',
        projectWrites: false,
        runtimeWrites: false,
        externalCalls: false,
        status: runState.status,
        runId: runState.runId,
        contextArtifactPath: runState.contextArtifactPath,
        summaryArtifactPath: runState.summaryArtifactPath,
        evidenceArtifactPath: runState.evidenceArtifactPath,
        harnessOutputPath: runState.harnessOutputPath,
        taskPacketPath: runState.taskPacketPath,
        proofArtifactPath: runState.proofArtifactPath,
        scaffoldPlanArtifactPath: runState.scaffoldPlanArtifactPath,
        scaffoldManifestArtifactPath: runState.scaffoldManifestArtifactPath,
        executionPlanArtifactPath: runState.executionPlanArtifactPath,
        executionPlanId: runState.executionPlanId,
        adoptionPlanArtifactPath: runState.adoptionPlanArtifactPath,
        adoptionPlanId: runState.adoptionPlanId,
        sourceRunId: runState.sourceRunId,
        patchArtifactPath: runState.patchArtifactPath,
        patchHash: runState.patchHash,
        changedFiles: runState.changedFiles,
        confirmationCommand: runState.confirmationCommand,
        nextAction: 'symphony status',
        ...(routeDecision ? { matchedSignals: routeDecision.matchedSignals, routeDecision } : {})
      };

  writeProductOutput(stdout, summary, options.json);
  return EXIT_CODES.ok;
}

function parseArtifactsArgs(args) {
  const options = {
    stateDir: '.symphony',
    json: false
  };
  const positional = [];

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
      throw new UsageError(`unknown artifacts option: ${value}`);
    }

    positional.push(value);
  }

  if (positional.length > 1) {
    throw new UsageError('artifacts accepts at most one run id');
  }

  return {
    ...options,
    runId: positional[0]
  };
}
