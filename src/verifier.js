import { validateCommandSpec } from './contracts.js';

export function verifyEvidence({ commandSpec, evidence }) {
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

  return {
    status: 'passed',
    reason: 'checks-passed',
    checks: structuredClone(evidence.checks)
  };
}

function violatesReadOnlyScope({ commandSpec, changedFiles }) {
  return commandSpec.workspacePolicy === 'review-only' && changedFiles.length > 0;
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function hasFindings(evidence) {
  return Array.isArray(evidence.findings) && evidence.findings.some((finding) => isNonEmptyString(finding));
}
