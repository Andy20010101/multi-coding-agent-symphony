const FAILURE_CATEGORIES = new Map([
  ['build-failed', {
    retryable: true,
    owner: 'implementer',
    recommendedNextCommand: 'fix-ci'
  }],
  ['test-failed', {
    retryable: true,
    owner: 'implementer',
    recommendedNextCommand: 'fix-ci'
  }],
  ['lint-failed', {
    retryable: true,
    owner: 'implementer',
    recommendedNextCommand: 'fix-ci'
  }],
  ['context-missing', {
    retryable: true,
    owner: 'orchestrator',
    recommendedNextCommand: 'plan'
  }],
  ['permission-denied', {
    retryable: false,
    owner: 'policy',
    recommendedNextCommand: 'plan'
  }],
  ['adapter-crashed', {
    retryable: true,
    owner: 'adapter',
    recommendedNextCommand: 'qa'
  }],
  ['cli-timeout', {
    retryable: true,
    owner: 'adapter',
    recommendedNextCommand: 'qa'
  }],
  ['model-off-task', {
    retryable: true,
    owner: 'router',
    recommendedNextCommand: 'plan'
  }],
  ['verification-insufficient', {
    retryable: true,
    owner: 'verifier',
    recommendedNextCommand: 'qa'
  }],
  ['checks-missing', {
    retryable: true,
    owner: 'verifier',
    recommendedNextCommand: 'qa'
  }],
  ['artifact-missing', {
    retryable: true,
    owner: 'verifier',
    recommendedNextCommand: 'qa'
  }],
  ['check-failed', {
    retryable: true,
    owner: 'implementer',
    recommendedNextCommand: 'fix-ci'
  }],
  ['scope-violation', {
    retryable: false,
    owner: 'policy',
    recommendedNextCommand: 'plan'
  }],
  ['workspace-conflict', {
    retryable: false,
    owner: 'orchestrator',
    recommendedNextCommand: 'plan'
  }],
  ['infrastructure-failure', {
    retryable: true,
    owner: 'orchestrator',
    recommendedNextCommand: 'qa'
  }]
]);

export function classifyFailure(category) {
  const metadata = FAILURE_CATEGORIES.get(category) ?? FAILURE_CATEGORIES.get('infrastructure-failure');

  return {
    category: FAILURE_CATEGORIES.has(category) ? category : 'infrastructure-failure',
    ...metadata
  };
}

export function listFailureCategories() {
  return Array.from(FAILURE_CATEGORIES.keys());
}
