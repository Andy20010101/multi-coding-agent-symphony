import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import {
  listRunStates,
  readAdoptionJournal,
  readAdoptionPlan,
  symphonyStatePaths
} from './state.js';
import {
  buildStageAdoptionSummary
} from './stage.js';

export async function buildAdoptionInspectionSummary({
  stateDir = '.symphony',
  adoptionId,
  exitCode = 0
} = {}) {
  const plan = await readAdoptionPlan({
    stateDir,
    adoptionId
  });

  if (plan === null) {
    throw new Error(`adoption plan not found: ${adoptionId}`);
  }

  assertAdoptionInspectionPlan(plan, adoptionId);

  const journal = await readAdoptionJournal({
    stateDir,
    adoptionId
  });
  const latestConfirmationRun = await findLatestAdoptionConfirmationRun({
    stateDir,
    adoptionId
  });
  const afterMatch = await compareWorktreeToFileOperationsAfter(plan);
  const beforeMatch = journal === null
    ? {
        matches: null,
        reason: 'adoption journal not found',
        files: []
      }
    : await compareWorktreeToBeforeFiles({
        projectRoot: plan.projectRoot,
        beforeFiles: journal.beforeFiles
      });
  const paths = symphonyStatePaths({
    stateDir,
    adoptionId: plan.adoptionId
  });

  return {
    version: '1',
    command: 'symphony adopt',
    intent: 'adopt-inspect',
    semanticCommand: 'adopt',
    pipeline: ['adopt-inspect'],
    safetyMode: 'read-only',
    projectWrites: false,
    mainWorktreeWrites: false,
    workspaceWrites: false,
    runtimeWrites: false,
    externalCalls: false,
    destructiveWrites: false,
    status: 'inspected',
    exitCode,
    verifierStatus: 'not-run',
    adoptionPlanId: plan.adoptionId,
    adoptionPlanArtifactPath: paths.adoptionPlanPath,
    adoptionJournalArtifactPath: journal === null ? undefined : paths.adoptionJournalPath,
    adoptionPlanRefs: {
      adoptionPlanArtifactPath: paths.adoptionPlanPath,
      executionPlanArtifactPath: plan.executionPlanArtifactPath,
      patchArtifactPath: plan.patchArtifactPath,
      sourceRunArtifactPath: plan.sourceRunArtifactPath
    },
    journalRef: journal === null
      ? null
      : {
          kind: 'adoption-journal',
          path: paths.adoptionJournalPath
        },
    sourceRunId: plan.sourceRunId,
    sourceRunArtifactPath: plan.sourceRunArtifactPath,
    sourceRun: {
      runId: plan.sourceRunId,
      artifactPath: plan.sourceRunArtifactPath,
      verifierStatus: plan.sourceVerifierStatus,
      workspacePath: plan.sourceWorkspacePath,
      workspaceManifestPath: plan.sourceWorkspaceManifestPath
    },
    executionPlanId: plan.executionPlanId,
    executionPlanArtifactPath: plan.executionPlanArtifactPath,
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    changedFiles: [...plan.changedFiles],
    fileOperations: structuredClone(plan.fileOperations),
    stageBinding: plan.stageBinding,
    stageAdoptionSummary: plan.stageAdoptionSummary ?? buildStageAdoptionSummary({
      stageBinding: plan.stageBinding,
      plan
    }),
    journal: journal === null
      ? null
      : {
          adoptionPlanId: journal.adoptionPlanId,
          confirmationRunId: journal.confirmationRunId,
          artifactPath: paths.adoptionJournalPath,
          status: journal.status,
          createdAt: journal.createdAt
        },
    latestConfirmationRun,
    currentWorktreeMatchesAfterHash: afterMatch.matches,
    currentWorktreeMatchesAfterHashDetails: afterMatch,
    currentWorktreeMatchesJournalBeforeFiles: beforeMatch.matches,
    currentWorktreeMatchesJournalBeforeFilesDetails: beforeMatch,
    recommendedCommands: buildAdoptionInspectRecommendedCommands({
      adoptionId: plan.adoptionId,
      stateDir
    }),
    nextAction: buildAdoptionConfirmationCommand({
      adoptionId: plan.adoptionId,
      stateDir
    })
  };
}

export function buildConsoleAdoptionInspectContract(summary) {
  return {
    contractVersion: '1',
    contractName: 'symphony.console-adoption-inspect',
    ...summary
  };
}

function buildAdoptionInspectRecommendedCommands({ adoptionId, stateDir }) {
  return [
    commandRecommendation({
      id: 'inspect-adoption',
      label: 'Inspect adoption',
      command: `symphony adopt --inspect ${adoptionId} --state-dir '${stateDir}' --json`,
      description: 'Read adoption plan, journal, and current worktree match status.'
    }),
    commandRecommendation({
      id: 'confirm-adoption',
      label: 'Confirm adoption',
      command: buildAdoptionConfirmationCommand({ adoptionId, stateDir }),
      description: 'Apply the frozen adoption patch from the terminal after reviewing it.'
    }),
    commandRecommendation({
      id: 'status',
      label: 'Status',
      command: 'symphony status',
      description: 'Print the latest Symphony run state.'
    }),
    commandRecommendation({
      id: 'diagnose',
      label: 'Diagnose',
      command: `symphony diagnose --state-dir '${stateDir}' --json`,
      description: 'Inspect all Workbench diagnostics as JSON.'
    })
  ];
}

function commandRecommendation({ id, label, command, description }) {
  return {
    id,
    label,
    command,
    description,
    mode: 'copy-only'
  };
}

function buildAdoptionConfirmationCommand({ adoptionId, stateDir }) {
  const args = ['symphony', 'adopt', '--confirm', adoptionId];

  if (stateDir !== '.symphony') {
    args.push('--state-dir', quoteShellArg(stateDir));
  }

  return args.join(' ');
}

function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/u.test(value)) {
    return value;
  }

  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

async function findLatestAdoptionConfirmationRun({ stateDir, adoptionId }) {
  const runs = await listRunStates({ stateDir });
  const run = runs.find((candidate) => candidate.adoptionPlanId === adoptionId
    && Array.isArray(candidate.pipeline)
    && candidate.pipeline.includes('adopt-confirm'));

  if (run === undefined) {
    return null;
  }

  return {
    runId: run.runId,
    status: run.status,
    verifierStatus: run.verifierStatus,
    mainWorktreeWrites: run.mainWorktreeWrites,
    failurePhase: run.failurePhase,
    adoptionJournalArtifactPath: run.adoptionJournalArtifactPath,
    evidenceArtifactPath: run.evidenceArtifactPath,
    updatedAt: run.updatedAt,
    nextAction: run.nextAction
  };
}

async function compareWorktreeToFileOperationsAfter(plan) {
  const files = [];

  for (const operation of plan.fileOperations) {
    const path = normalizeAdoptionRelativePath(operation.path);
    const snapshot = await readComparableWorktreeFileSnapshot({
      projectRoot: plan.projectRoot,
      path
    });
    const matches = snapshot.exists === true
      && snapshot.hash === operation.afterHash
      && snapshot.size === operation.size
      && snapshot.textEncoding === operation.textEncoding;

    files.push({
      path,
      matches,
      expected: {
        exists: true,
        hash: operation.afterHash,
        size: operation.size,
        textEncoding: operation.textEncoding
      },
      actual: snapshot
    });
  }

  return {
    matches: files.every((file) => file.matches),
    files
  };
}

async function compareWorktreeToBeforeFiles({ projectRoot, beforeFiles }) {
  if (!Array.isArray(beforeFiles)) {
    return {
      matches: null,
      reason: 'journal beforeFiles is missing',
      files: []
    };
  }

  const files = [];

  for (const beforeFile of beforeFiles) {
    const path = normalizeAdoptionRelativePath(beforeFile.path);
    const snapshot = await readComparableWorktreeFileSnapshot({
      projectRoot,
      path
    });
    const expected = {
      exists: beforeFile.exists,
      hash: beforeFile.hash ?? null,
      size: beforeFile.size,
      textEncoding: beforeFile.textEncoding ?? null
    };
    const matches = snapshot.exists === expected.exists
      && snapshot.hash === expected.hash
      && snapshot.size === expected.size
      && snapshot.textEncoding === expected.textEncoding;

    files.push({
      path,
      matches,
      expected,
      actual: snapshot
    });
  }

  return {
    matches: files.every((file) => file.matches),
    files
  };
}

async function readComparableWorktreeFileSnapshot({ projectRoot, path }) {
  try {
    return await readWorktreeFileSnapshot({
      projectRoot,
      path
    });
  } catch (error) {
    return {
      path,
      exists: null,
      hash: null,
      size: null,
      textEncoding: null,
      error: error.message
    };
  }
}

async function readWorktreeFileSnapshot({ projectRoot, path }) {
  const root = resolve(projectRoot);
  const filePath = resolve(projectRoot, path);
  assertPathInside({
    root,
    target: filePath,
    message: 'adoption path must stay inside the project'
  });

  let metadata;

  try {
    metadata = await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        path,
        exists: false,
        hash: null,
        size: 0,
        textEncoding: null
      };
    }

    throw error;
  }

  if (metadata.isSymbolicLink()) {
    throw new Error(`adoption file is a symlink: ${path}`);
  }

  if (!metadata.isFile()) {
    throw new Error(`adoption path is not a regular file: ${path}`);
  }

  const content = await readFile(filePath);

  decodeUtf8Text(content, path);

  return {
    path,
    exists: true,
    hash: sha256Buffer(content),
    size: content.length,
    textEncoding: 'utf8'
  };
}

function assertAdoptionInspectionPlan(plan, expectedAdoptionId) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new Error('adoption plan must be an object');
  }

  if (plan.kind !== 'symphony.adoption-plan'
    || plan.contractName !== 'symphony.adoption-plan'
    || plan.contractVersion !== '1') {
    throw new Error('adoption plan has an unsupported contract');
  }

  if (plan.adoptionId !== expectedAdoptionId) {
    throw new Error('adoption plan id does not match requested adoption');
  }

  for (const field of [
    'projectRoot',
    'sourceRunId',
    'executionPlanId',
    'patchArtifactPath',
    'patchHash'
  ]) {
    assertNonEmptyString(plan[field], `adoption plan ${field}`);
  }

  if (!Array.isArray(plan.changedFiles) || !Array.isArray(plan.fileOperations)) {
    throw new Error('adoption plan changedFiles and fileOperations must be arrays');
  }

  for (const operation of plan.fileOperations) {
    assertFileOperation(operation);
  }
}

function assertFileOperation(operation) {
  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new Error('adoption file operation must be an object');
  }

  const path = normalizeAdoptionRelativePath(operation.path);

  if (operation.path !== path) {
    throw new Error('adoption file operation path is not normalized');
  }

  if (operation.operation !== 'add' && operation.operation !== 'modify') {
    throw new Error('adoption file operation must be add or modify');
  }

  assertNonEmptyString(operation.afterHash, 'file operation afterHash');

  if (typeof operation.size !== 'number' || operation.size < 0) {
    throw new Error('file operation size must be a non-negative number');
  }

  if (operation.textEncoding !== 'utf8') {
    throw new Error('file operation textEncoding must be utf8');
  }
}

function normalizeAdoptionRelativePath(path) {
  if (typeof path !== 'string' || path.trim() === '') {
    throw new Error('adoption path must be a non-empty string');
  }

  if (path.includes('\\') || path.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error('adoption path must be a canonical POSIX relative path');
  }

  if (isAbsolute(path)) {
    throw new Error('adoption path must be relative');
  }

  return path;
}

function assertPathInside({ root, target, message }) {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}/`)) {
    throw new Error(message);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function decodeUtf8Text(buffer, path) {
  if (buffer.includes(0)) {
    throw new Error(`binary file is unsupported: ${path}`);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new Error(`non-utf8 text is unsupported: ${path}`);
  }
}

function sha256Buffer(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}
