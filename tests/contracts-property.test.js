import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import {
  validateTaskSpec,
  validateCommandSpec,
  validateAdapterMapping,
  validateModelProfile,
  validateEvidencePackage,
  ValidationError
} from '../src/contracts.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);
const blankString = fc.oneof(fc.constant(''), fc.constant('   '), fc.constant('\t\n'));
const taskSource = fc.constantFrom('github', 'linear', 'manual');
const commandName = fc.constantFrom('plan', 'implement', 'review', 'fix-ci', 'qa');
const toolName = fc.constantFrom('read', 'write', 'shell', 'test', 'browser', 'network');
const workspacePolicy = fc.constantFrom('primary-writer', 'parallel-writer', 'review-only', 'isolated', 'none');
const adapterName = fc.constantFrom('codex', 'claude-code', 'kiro-cli');
const providerName = fc.constantFrom('openai', 'deepseek', 'anthropic');
const costClass = fc.constantFrom('low', 'medium', 'high');
const priority = fc.constantFrom('low', 'normal', 'high');
const checkStatus = fc.constantFrom('passed', 'failed');
const networkState = fc.constantFrom('enabled', 'disabled', 'restricted');

// check requires output or artifactId (or both); command/exitCode/output/artifactId are optional
const validCheck = fc.oneof(
  // has output only
  fc.record({
    name: nonEmptyString,
    status: checkStatus,
    output: nonEmptyString
  }),
  // has artifactId only
  fc.record({
    name: nonEmptyString,
    status: checkStatus,
    artifactId: nonEmptyString
  }),
  // has both, plus optional fields
  fc.record({
    name: nonEmptyString,
    status: checkStatus,
    command: nonEmptyString,
    exitCode: fc.integer({ min: 0, max: 255 }),
    artifactId: nonEmptyString,
    output: nonEmptyString
  })
);

const validTaskSpec = fc.record({
  id: nonEmptyString,
  source: taskSource,
  repository: nonEmptyString,
  objective: nonEmptyString,
  acceptance: fc.array(nonEmptyString, { minLength: 1 }),
  version: nonEmptyString
});

const validCommandSpec = fc.record({
  name: commandName,
  version: nonEmptyString,
  allowedTools: fc.array(toolName, { minLength: 1 }).map((arr) => [...new Set(arr)]),
  workspacePolicy,
  doneCriteria: fc.array(nonEmptyString, { minLength: 1 }),
  evidenceSchema: nonEmptyString
});

const validEvidencePackage = fc.record({
  command: commandName,
  taskId: nonEmptyString,
  workspaceId: nonEmptyString,
  diffSummary: fc.array(fc.string()),
  changedFiles: fc.array(fc.string()),
  checks: fc.array(validCheck, { minLength: 1 }),
  knownRisks: fc.array(fc.string()),
  agentSummary: nonEmptyString,
  version: nonEmptyString
});

// ── TaskSpec ──────────────────────────────────────────────────────────────────

describe('contracts property tests: TaskSpec', () => {
  it('accepts any valid TaskSpec', () => {
    fc.assert(fc.property(validTaskSpec, (spec) => {
      assert.doesNotThrow(() => validateTaskSpec(spec));
    }));
  });

  it('rejects when id is blank', () => {
    fc.assert(fc.property(validTaskSpec, blankString, (spec, blank) => {
      assert.throws(() => validateTaskSpec({ ...spec, id: blank }), ValidationError);
    }));
  });

  it('rejects when source is not a known value', () => {
    const unknownSource = fc.string().filter((s) => !['github', 'linear', 'manual'].includes(s));
    fc.assert(fc.property(validTaskSpec, unknownSource, (spec, src) => {
      assert.throws(() => validateTaskSpec({ ...spec, source: src }), ValidationError);
    }));
  });

  it('rejects when objective is blank', () => {
    fc.assert(fc.property(validTaskSpec, blankString, (spec, blank) => {
      assert.throws(() => validateTaskSpec({ ...spec, objective: blank }), ValidationError);
    }));
  });

  it('rejects when acceptance is empty array', () => {
    fc.assert(fc.property(validTaskSpec, (spec) => {
      assert.throws(() => validateTaskSpec({ ...spec, acceptance: [] }), ValidationError);
    }));
  });

  it('rejects when acceptance contains a blank entry', () => {
    fc.assert(fc.property(validTaskSpec, blankString, (spec, blank) => {
      assert.throws(
        () => validateTaskSpec({ ...spec, acceptance: ['valid', blank] }),
        ValidationError
      );
    }));
  });

  it('rejects when priority is present but not a known value', () => {
    const unknownPriority = fc.string().filter((s) => !['low', 'normal', 'high'].includes(s));
    fc.assert(fc.property(validTaskSpec, unknownPriority, (spec, p) => {
      assert.throws(() => validateTaskSpec({ ...spec, priority: p }), ValidationError);
    }));
  });

  it('accepts valid optional priority', () => {
    fc.assert(fc.property(validTaskSpec, priority, (spec, p) => {
      assert.doesNotThrow(() => validateTaskSpec({ ...spec, priority: p }));
    }));
  });

  it('rejects when createdAt is present but not a valid timestamp', () => {
    const badTimestamp = fc.string().filter((s) => Number.isNaN(Date.parse(s)));
    fc.assert(fc.property(validTaskSpec, badTimestamp, (spec, ts) => {
      assert.throws(() => validateTaskSpec({ ...spec, createdAt: ts }), ValidationError);
    }));
  });

  it('rejects non-object inputs', () => {
    const nonObject = fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.string());
    fc.assert(fc.property(nonObject, (val) => {
      assert.throws(() => validateTaskSpec(val), ValidationError);
    }));
  });

  it('rejects when constraints contains a blank entry', () => {
    fc.assert(fc.property(validTaskSpec, blankString, (spec, blank) => {
      assert.throws(
        () => validateTaskSpec({ ...spec, constraints: ['valid', blank] }),
        ValidationError
      );
    }));
  });
});

// ── CommandSpec ───────────────────────────────────────────────────────────────

describe('contracts property tests: CommandSpec', () => {
  it('accepts any valid CommandSpec', () => {
    fc.assert(fc.property(validCommandSpec, (spec) => {
      assert.doesNotThrow(() => validateCommandSpec(spec));
    }));
  });

  it('rejects unknown command name', () => {
    const unknown = fc.string().filter(
      (s) => !['plan', 'implement', 'review', 'fix-ci', 'qa'].includes(s)
    );
    fc.assert(fc.property(validCommandSpec, unknown, (spec, name) => {
      assert.throws(() => validateCommandSpec({ ...spec, name }), ValidationError);
    }));
  });

  it('rejects unknown tool in allowedTools', () => {
    const unknownTool = fc.string().filter(
      (s) => !['read', 'write', 'shell', 'test', 'browser', 'network'].includes(s)
    );
    fc.assert(fc.property(validCommandSpec, unknownTool, (spec, tool) => {
      assert.throws(
        () => validateCommandSpec({ ...spec, allowedTools: [tool] }),
        ValidationError
      );
    }));
  });

  it('rejects empty doneCriteria', () => {
    fc.assert(fc.property(validCommandSpec, (spec) => {
      assert.throws(() => validateCommandSpec({ ...spec, doneCriteria: [] }), ValidationError);
    }));
  });

  it('rejects unknown workspacePolicy', () => {
    const unknown = fc.string().filter(
      (s) => !['primary-writer', 'review-only', 'isolated', 'none'].includes(s)
    );
    fc.assert(fc.property(validCommandSpec, unknown, (spec, policy) => {
      assert.throws(() => validateCommandSpec({ ...spec, workspacePolicy: policy }), ValidationError);
    }));
  });
});

// ── EvidencePackage ───────────────────────────────────────────────────────────

describe('contracts property tests: EvidencePackage', () => {
  it('accepts any valid EvidencePackage', () => {
    fc.assert(fc.property(validEvidencePackage, (pkg) => {
      assert.doesNotThrow(() => validateEvidencePackage(pkg));
    }));
  });

  it('rejects empty checks array', () => {
    fc.assert(fc.property(validEvidencePackage, (pkg) => {
      assert.throws(() => validateEvidencePackage({ ...pkg, checks: [] }), ValidationError);
    }));
  });

  it('rejects blank agentSummary', () => {
    fc.assert(fc.property(validEvidencePackage, blankString, (pkg, blank) => {
      assert.throws(() => validateEvidencePackage({ ...pkg, agentSummary: blank }), ValidationError);
    }));
  });

  it('rejects unknown command', () => {
    const unknown = fc.string().filter(
      (s) => !['plan', 'implement', 'review', 'fix-ci', 'qa'].includes(s)
    );
    fc.assert(fc.property(validEvidencePackage, unknown, (pkg, cmd) => {
      assert.throws(() => validateEvidencePackage({ ...pkg, command: cmd }), ValidationError);
    }));
  });

  it('rejects check with unknown status', () => {
    const badCheck = validCheck.map((c) => ({ ...c, status: 'unknown' }));
    fc.assert(fc.property(validEvidencePackage, badCheck, (pkg, check) => {
      assert.throws(
        () => validateEvidencePackage({ ...pkg, checks: [check] }),
        ValidationError
      );
    }));
  });

  it('rejects non-integer exitCode in check when present', () => {
    const nonIntExitCode = fc.oneof(fc.constant(1.5), fc.constant('0'), fc.constant(true));
    fc.assert(fc.property(validEvidencePackage, nonIntExitCode, (pkg, exitCode) => {
      const badCheck = { name: 'check', status: 'passed', output: 'ok', exitCode };
      assert.throws(
        () => validateEvidencePackage({ ...pkg, checks: [badCheck] }),
        ValidationError
      );
    }));
  });
});

// ── ModelProfile ──────────────────────────────────────────────────────────────

describe('contracts property tests: ModelProfile', () => {
  const validModelProfile = fc.record({
    id: nonEmptyString,
    provider: providerName,
    model: nonEmptyString,
    contextTokens: fc.integer({ min: 1, max: 2_000_000 }),
    maxOutputTokens: fc.integer({ min: 1, max: 100_000 }),
    supportsStructuredOutput: fc.boolean(),
    supportsVisionInput: fc.boolean(),
    reasoningControls: fc.array(nonEmptyString, { minLength: 1 }),
    costClass,
    retryPolicy: nonEmptyString,
    version: nonEmptyString
  });

  it('accepts any valid ModelProfile', () => {
    fc.assert(fc.property(validModelProfile, (profile) => {
      assert.doesNotThrow(() => validateModelProfile(profile));
    }));
  });

  it('rejects non-positive contextTokens', () => {
    const nonPositive = fc.oneof(fc.constant(0), fc.integer({ max: -1 }), fc.constant(1.5));
    fc.assert(fc.property(validModelProfile, nonPositive, (profile, tokens) => {
      assert.throws(() => validateModelProfile({ ...profile, contextTokens: tokens }), ValidationError);
    }));
  });

  it('rejects unknown provider', () => {
    const unknown = fc.string().filter(
      (s) => !['openai', 'deepseek', 'anthropic'].includes(s)
    );
    fc.assert(fc.property(validModelProfile, unknown, (profile, provider) => {
      assert.throws(() => validateModelProfile({ ...profile, provider }), ValidationError);
    }));
  });

  it('rejects non-boolean supportsStructuredOutput', () => {
    const nonBool = fc.oneof(fc.constant(0), fc.constant(1), fc.string(), fc.constant(null));
    fc.assert(fc.property(validModelProfile, nonBool, (profile, val) => {
      assert.throws(
        () => validateModelProfile({ ...profile, supportsStructuredOutput: val }),
        ValidationError
      );
    }));
  });
});
