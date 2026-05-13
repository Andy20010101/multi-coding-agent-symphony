import { isAbsolute, relative, resolve } from 'node:path';

import { validateCommandSpec } from './contracts.js';

export function verifyEvidence({
  commandSpec,
  evidence,
  workspaceManifest,
  externalCiStatusArtifacts = [],
  requiredExternalCiProviders = []
}) {
  validateCommandSpec(commandSpec);

  if (evidence === null || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['evidence']
    };
  }

  if (!Array.isArray(evidence.checks) || evidence.checks.length === 0) {
    return {
      status: 'failed',
      reason: 'checks-missing',
      requiredEvidence: ['checks']
    };
  }

  const changedFiles = Array.isArray(evidence.changedFiles) ? evidence.changedFiles : [];

  if (violatesReadOnlyScope({ commandSpec, changedFiles })) {
    return {
      status: 'failed',
      reason: 'scope-violation',
      changedFiles: structuredClone(changedFiles),
      workspacePolicy: commandSpec.workspacePolicy
    };
  }

  const filesOutsideWorkspace = changedFilesOutsideWorkspace({ changedFiles, workspaceManifest });

  if (filesOutsideWorkspace.length > 0) {
    return {
      status: 'failed',
      reason: 'scope-violation',
      changedFiles: structuredClone(filesOutsideWorkspace),
      workspacePath: workspaceManifest.path
    };
  }

  const failedChecks = evidence.checks.filter((check) => check.status !== 'passed');

  if (failedChecks.length > 0) {
    return {
      status: 'failed',
      reason: 'check-failed',
      failedChecks: structuredClone(failedChecks)
    };
  }

  if (requiresProductionProvenance(commandSpec)) {
    const checksMissingProvenance = evidence.checks.filter((check) => !hasCheckProvenance(check));

    if (checksMissingProvenance.length > 0) {
      return {
        status: 'failed',
        reason: 'artifact-missing',
        requiredEvidence: ['checks[].command+exitCode', 'checks[].artifactId'],
        checks: structuredClone(checksMissingProvenance)
      };
    }
  }

  const commandSpecificFailure = verifyCommandSpecificEvidence({ commandSpec, evidence, changedFiles });

  if (commandSpecificFailure) {
    return commandSpecificFailure;
  }

  const externalCiFailure = verifyExternalCiStatus({
    externalCiStatusArtifacts,
    requiredExternalCiProviders
  });

  if (externalCiFailure) {
    return externalCiFailure;
  }

  const passed = {
    status: 'passed',
    reason: 'checks-passed',
    checks: structuredClone(evidence.checks)
  };

  if (externalCiStatusArtifacts.length > 0) {
    passed.externalCiStatusArtifacts = structuredClone(externalCiStatusArtifacts);
  }

  return passed;
}

function violatesReadOnlyScope({ commandSpec, changedFiles }) {
  return commandSpec.workspacePolicy === 'review-only' && changedFiles.length > 0;
}

function changedFilesOutsideWorkspace({ changedFiles, workspaceManifest }) {
  if (!isNonEmptyString(workspaceManifest?.path)) {
    return [];
  }

  const workspacePath = resolve(workspaceManifest.path);

  return changedFiles.filter((changedFile) => {
    if (!isNonEmptyString(changedFile)) {
      return false;
    }

    const resolvedChangedFile = isAbsolute(changedFile)
      ? resolve(changedFile)
      : resolve(workspacePath, changedFile);
    const relativePath = relative(workspacePath, resolvedChangedFile);

    return relativePath === '..' || relativePath.startsWith(`..${pathSeparator()}`) || isAbsolute(relativePath);
  });
}

function pathSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}

function requiresProductionProvenance(commandSpec) {
  return !isSmokeEvidence(commandSpec);
}

function verifyCommandSpecificEvidence({ commandSpec, evidence, changedFiles }) {
  if (isSmokeEvidence(commandSpec)) {
    return null;
  }

  if (commandSpec.name === 'implement' && changedFiles.length === 0 && !isNonEmptyString(evidence.noOpRationale)) {
    return {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['changedFiles', 'noOpRationale']
    };
  }

  if (commandSpec.name === 'review' && !hasFindings(evidence) && !isNonEmptyString(evidence.noFindingRationale)) {
    return {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['findings', 'noFindingRationale']
    };
  }

  if (commandSpec.name === 'qa' && !evidence.checks.some((check) => isNonEmptyString(check.artifactId))) {
    return {
      status: 'failed',
      reason: 'artifact-missing',
      requiredEvidence: ['checks[].artifactId']
    };
  }

  return null;
}

function isSmokeEvidence(commandSpec) {
  return commandSpec.evidenceSchema.includes('smoke') ||
    commandSpec.doneCriteria.includes('real-model-called');
}

function hasCheckProvenance(check) {
  return isNonEmptyString(check.artifactId) ||
    (isNonEmptyString(check.command) && Number.isInteger(check.exitCode));
}

function verifyExternalCiStatus({ externalCiStatusArtifacts, requiredExternalCiProviders }) {
  if (!Array.isArray(externalCiStatusArtifacts)) {
    return {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['externalCiStatusArtifacts']
    };
  }

  if (!Array.isArray(requiredExternalCiProviders)) {
    return {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['requiredExternalCiProviders']
    };
  }

  const missingProvenance = externalCiStatusArtifacts.filter((artifact) => {
    return !hasExternalCiProvenance(artifact);
  });

  if (missingProvenance.length > 0) {
    return {
      status: 'failed',
      reason: 'artifact-missing',
      requiredEvidence: [
        'externalCiStatusArtifacts[].command+exitCode',
        'externalCiStatusArtifacts[].artifactId'
      ],
      externalCiStatusArtifacts: structuredClone(missingProvenance)
    };
  }

  for (const provider of requiredExternalCiProviders) {
    const statusArtifact = externalCiStatusArtifacts.find((artifact) => artifact?.provider === provider);

    if (!statusArtifact) {
      return {
        status: 'failed',
        reason: 'external-ci-missing',
        requiredEvidence: [`externalCiStatusArtifacts[${provider}]`]
      };
    }

    if (statusArtifact.status !== 'passed') {
      return {
        status: 'failed',
        reason: 'external-ci-failed',
        provider,
        statusArtifact: structuredClone(statusArtifact),
        failedChecks: externalCiFailedChecks(statusArtifact)
      };
    }
  }

  return null;
}

function hasExternalCiProvenance(artifact) {
  return isNonEmptyString(artifact?.artifactId) ||
    (isNonEmptyString(artifact?.command) && Number.isInteger(artifact?.exitCode));
}

function externalCiFailedChecks(statusArtifact) {
  if (Array.isArray(statusArtifact.failingChecks)) {
    return structuredClone(statusArtifact.failingChecks);
  }

  if (!Array.isArray(statusArtifact.checks)) {
    return [];
  }

  return statusArtifact.checks
    .filter((check) => check.conclusion !== 'success')
    .map((check) => check.name)
    .filter(isNonEmptyString);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function hasFindings(evidence) {
  return Array.isArray(evidence.findings) && evidence.findings.some((finding) => isNonEmptyString(finding));
}
