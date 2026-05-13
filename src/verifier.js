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
      reason: 'verification-insufficient',
      requiredEvidence: ['checks']
    };
  }

  const failedCheck = evidence.checks.find((check) => check.status !== 'passed');

  if (failedCheck) {
    return {
      status: 'failed',
      reason: 'check-failed',
      checks: structuredClone(evidence.checks)
    };
  }

  return {
    status: 'passed',
    reason: 'checks-passed',
    checks: structuredClone(evidence.checks)
  };
}

