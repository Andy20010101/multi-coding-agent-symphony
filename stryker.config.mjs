/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  plugins: ['@stryker-mutator/tap-runner'],
  testRunner: 'tap',
  tap: {
    testFiles: ['tests/**/*.test.js']
  },
  mutate: [
    'src/contracts.js',
    'src/orchestrator.js',
    'src/verifier.js',
    'src/ensemble/arbitrator.js',
    'src/ensemble/ensemble-orchestrator.js',
    'src/policy-engine.js'
  ],
  reporters: ['clear-text', 'progress'],
  concurrency: 2,
  timeoutMS: 30000,
  tempDirName: '/tmp/stryker-mcas',
  thresholds: {
    high: 80,
    low: 70,
    break: 60
  }
};
