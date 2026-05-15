/**
 * Targeted tests to kill surviving mutants in contracts.js.
 *
 * Key mutant types:
 * - ObjectLiteral: { field } → {} in ValidationError details
 * - ConditionalExpression: validation conditions replaced with false
 * - StringLiteral: error message text (mostly equivalent, skip)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateTaskSpec,
  validateCommandSpec,
  validateAdapterMapping,
  validateModelProfile,
  validateEvidencePackage,
  ValidationError
} from '../src/contracts.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function validTask(overrides = {}) {
  return {
    id: 'task-1',
    source: 'github',
    repository: 'owner/repo',
    objective: 'Do the work',
    acceptance: ['tests pass'],
    version: '1',
    ...overrides
  };
}

function validCommand(overrides = {}) {
  return {
    name: 'implement',
    version: '1',
    allowedTools: ['read', 'write'],
    workspacePolicy: 'primary-writer',
    doneCriteria: ['diff-created'],
    evidenceSchema: 'impl.v1',
    ...overrides
  };
}

function validEvidence(overrides = {}) {
  return {
    command: 'implement',
    taskId: 'task-1',
    workspaceId: 'ws-1',
    diffSummary: [],
    changedFiles: [],
    checks: [{ name: 'test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' }],
    knownRisks: [],
    agentSummary: 'done',
    version: '1',
    ...overrides
  };
}

function validAdapter(overrides = {}) {
  return {
    adapter: 'codex',
    command: 'implement',
    commandVersion: '1',
    modelProfile: 'gpt-codex-default',
    configTemplate: 'codex-config.json',
    promptTemplate: 'codex-prompt.md',
    outputParser: 'codex-parser.js',
    failureMapper: 'codex-failure.js',
    ...overrides
  };
}

function validProfile(overrides = {}) {
  return {
    id: 'gpt-codex-default',
    provider: 'openai',
    model: 'gpt-4o',
    contextTokens: 128000,
    maxOutputTokens: 4096,
    supportsStructuredOutput: true,
    supportsVisionInput: false,
    reasoningControls: ['none'],
    costClass: 'medium',
    retryPolicy: 'exponential',
    version: '1',
    ...overrides
  };
}

// ── ObjectLiteral mutants: error.details.field ────────────────────────────────
// Kills: { field } → {} in ValidationError constructor calls

describe('contracts.js targeted: ValidationError details.field', () => {
  it('TaskSpec.id error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ id: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.id');
    }
  });

  it('TaskSpec.source error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ source: 'unknown' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.source');
    }
  });

  it('TaskSpec.repository error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ repository: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.repository');
    }
  });

  it('TaskSpec.objective error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ objective: '  ' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.objective');
    }
  });

  it('TaskSpec.acceptance error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ acceptance: [] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.acceptance');
    }
  });

  it('TaskSpec.acceptance[i] error includes field and index in details', () => {
    try {
      validateTaskSpec(validTask({ acceptance: ['valid', ''] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.acceptance');
      assert.equal(err.details.index, 1);
    }
  });

  it('TaskSpec.version error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ version: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.version');
    }
  });

  it('TaskSpec.priority error includes field and value in details', () => {
    try {
      validateTaskSpec(validTask({ priority: 'urgent' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.priority');
      assert.equal(err.details.value, 'urgent');
    }
  });

  it('TaskSpec.createdAt error includes field in details', () => {
    try {
      validateTaskSpec(validTask({ createdAt: 'not-a-date' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.createdAt');
    }
  });

  it('CommandSpec.name error includes field in details', () => {
    try {
      validateCommandSpec(validCommand({ name: 'unknown' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.name');
    }
  });

  it('CommandSpec.version error includes field in details', () => {
    try {
      validateCommandSpec(validCommand({ version: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.version');
    }
  });

  it('CommandSpec.workspacePolicy error includes field in details', () => {
    try {
      validateCommandSpec(validCommand({ workspacePolicy: 'bad-policy' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.workspacePolicy');
    }
  });

  it('CommandSpec.doneCriteria error includes field in details', () => {
    try {
      validateCommandSpec(validCommand({ doneCriteria: [] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.doneCriteria');
    }
  });

  it('CommandSpec.evidenceSchema error includes field in details', () => {
    try {
      validateCommandSpec(validCommand({ evidenceSchema: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.evidenceSchema');
    }
  });

  it('EvidencePackage.command error includes field in details', () => {
    try {
      validateEvidencePackage(validEvidence({ command: 'bad' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.command');
    }
  });

  it('EvidencePackage.taskId error includes field in details', () => {
    try {
      validateEvidencePackage(validEvidence({ taskId: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.taskId');
    }
  });

  it('EvidencePackage.agentSummary error includes field in details', () => {
    try {
      validateEvidencePackage(validEvidence({ agentSummary: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.agentSummary');
    }
  });

  it('EvidencePackage.checks error includes field in details', () => {
    try {
      validateEvidencePackage(validEvidence({ checks: [] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.checks');
    }
  });

  it('EvidencePackage.checks[i] missing output/artifactId error includes field and index', () => {
    try {
      validateEvidencePackage(validEvidence({
        checks: [{ name: 'test', status: 'passed' }]
      }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.checks');
      assert.equal(err.details.index, 0);
    }
  });

  it('ModelProfile.contextTokens error includes field in details', () => {
    try {
      validateModelProfile(validProfile({ contextTokens: 0 }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'ModelProfile.contextTokens');
    }
  });

  it('ModelProfile.provider error includes field in details', () => {
    try {
      validateModelProfile(validProfile({ provider: 'unknown' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'ModelProfile.provider');
    }
  });

  it('AdapterMapping.adapter error includes field in details', () => {
    try {
      validateAdapterMapping(validAdapter({ adapter: 'unknown' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'AdapterMapping.adapter');
    }
  });

  it('AdapterMapping.command error includes field in details', () => {
    try {
      validateAdapterMapping(validAdapter({ command: 'unknown' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'AdapterMapping.command');
    }
  });
});

// ── ConditionalExpression mutants: validation conditions ──────────────────────
// Kills: condition → false (never throws)

describe('contracts.js targeted: ConditionalExpression boundaries', () => {
  it('assertNonEmptyString rejects empty string (not just null)', () => {
    assert.throws(() => validateTaskSpec(validTask({ id: '' })), ValidationError);
  });

  it('assertNonEmptyString rejects whitespace-only string', () => {
    assert.throws(() => validateTaskSpec(validTask({ id: '   ' })), ValidationError);
  });

  it('assertNonEmptyString rejects tab-only string', () => {
    assert.throws(() => validateTaskSpec(validTask({ id: '\t' })), ValidationError);
  });

  it('assertNonEmptyStringArray rejects array with empty string item', () => {
    assert.throws(
      () => validateTaskSpec(validTask({ acceptance: [''] })),
      ValidationError
    );
  });

  it('assertNonEmptyStringArray rejects array with whitespace-only item', () => {
    assert.throws(
      () => validateTaskSpec(validTask({ acceptance: ['  '] })),
      ValidationError
    );
  });

  it('assertPositiveInteger rejects 0', () => {
    assert.throws(() => validateModelProfile(validProfile({ contextTokens: 0 })), ValidationError);
  });

  it('assertPositiveInteger rejects negative', () => {
    assert.throws(() => validateModelProfile(validProfile({ contextTokens: -1 })), ValidationError);
  });

  it('assertPositiveInteger rejects float', () => {
    assert.throws(() => validateModelProfile(validProfile({ contextTokens: 1.5 })), ValidationError);
  });

  it('assertBoolean rejects 0', () => {
    assert.throws(
      () => validateModelProfile(validProfile({ supportsStructuredOutput: 0 })),
      ValidationError
    );
  });

  it('assertBoolean rejects 1', () => {
    assert.throws(
      () => validateModelProfile(validProfile({ supportsStructuredOutput: 1 })),
      ValidationError
    );
  });

  it('assertBoolean rejects string "true"', () => {
    assert.throws(
      () => validateModelProfile(validProfile({ supportsStructuredOutput: 'true' })),
      ValidationError
    );
  });

  it('assertOptionalResourceProfile validates all fields when present', () => {
    assert.throws(
      () => validateEvidencePackage(validEvidence({
        resourceProfile: {
          cpu: 'low',
          memoryMb: 0,  // invalid: must be positive
          timeoutSeconds: 60,
          concurrency: 1,
          network: 'disabled',
          version: '1'
        }
      })),
      ValidationError
    );
  });

  it('assertOptionalResourceProfile accepts valid resource profile', () => {
    assert.doesNotThrow(() => validateEvidencePackage(validEvidence({
      resourceProfile: {
        cpu: 'low',
        memoryMb: 512,
        timeoutSeconds: 60,
        concurrency: 1,
        network: 'disabled',
        version: '1'
      }
    })));
  });
});

// ── ValidationError.name field ────────────────────────────────────────────────
// Kills: StringLiteral 'ValidationError' → ''

describe('contracts.js targeted: ValidationError.name', () => {
  it('ValidationError has name "ValidationError"', () => {
    try {
      validateTaskSpec(validTask({ id: '' }));
      assert.fail('should throw');
    } catch (err) {
      assert.equal(err.name, 'ValidationError');
    }
  });
});

// ── ADAPTER_NAMES and NETWORK_STATES set values ───────────────────────────────
// Kills: StringLiteral mutations on set member values

describe('contracts.js targeted: enum set values', () => {
  it('claude-code is a valid adapter name', () => {
    assert.doesNotThrow(() => validateAdapterMapping(validAdapter({ adapter: 'claude-code' })));
  });

  it('kiro-cli is a valid adapter name', () => {
    assert.doesNotThrow(() => validateAdapterMapping(validAdapter({ adapter: 'kiro-cli' })));
  });

  it('enabled is a valid network state in resourceProfile', () => {
    assert.doesNotThrow(() => validateEvidencePackage(validEvidence({
      resourceProfile: {
        cpu: 'low', memoryMb: 512, timeoutSeconds: 60, concurrency: 1,
        network: 'enabled', version: '1'
      }
    })));
  });

  it('restricted is a valid network state in resourceProfile', () => {
    assert.doesNotThrow(() => validateEvidencePackage(validEvidence({
      resourceProfile: {
        cpu: 'low', memoryMb: 512, timeoutSeconds: 60, concurrency: 1,
        network: 'restricted', version: '1'
      }
    })));
  });

  it('invalid network state is rejected', () => {
    assert.throws(() => validateEvidencePackage(validEvidence({
      resourceProfile: {
        cpu: 'low', memoryMb: 512, timeoutSeconds: 60, concurrency: 1,
        network: 'open', version: '1'
      }
    })), ValidationError);
  });
});

// ── Remaining ObjectLiteral/ConditionalExpression mutants ─────────────────────
// Targets: assertPlainObject, assertStringArray, assertSetSubset,
//          assertOptionalStringArray, assertOptionalInteger, assertBoolean

describe('contracts.js targeted: remaining ObjectLiteral/Conditional mutants', () => {
  // L99-100: assertPlainObject { field } → {}
  it('assertPlainObject error includes field in details', () => {
    try {
      validateTaskSpec(null);
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec');
    }
  });

  it('assertPlainObject error includes field when array passed', () => {
    try {
      validateTaskSpec([]);
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec');
    }
  });

  // L119: assertNonEmptyString condition → false
  it('assertNonEmptyString rejects non-string (number)', () => {
    assert.throws(() => validateTaskSpec(validTask({ id: 42 })), ValidationError);
  });

  it('assertNonEmptyString rejects non-string (null)', () => {
    assert.throws(() => validateTaskSpec(validTask({ id: null })), ValidationError);
  });

  // L130: assertNonEmptyStringArray condition → false
  it('assertNonEmptyStringArray rejects non-array', () => {
    assert.throws(() => validateTaskSpec(validTask({ acceptance: 'not-array' })), ValidationError);
  });

  // L161: assertSetSubset { field, value: item } → {}
  it('assertSetSubset error includes field and value in details', () => {
    try {
      validateCommandSpec(validCommand({ allowedTools: ['read', 'bad-tool'] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.allowedTools');
      assert.equal(err.details.value, 'bad-tool');
    }
  });

  // L178: assertOptionalStringArray { field, index } → {}
  it('assertOptionalStringArray error includes field and index in details', () => {
    try {
      validateTaskSpec(validTask({ constraints: ['valid', ''] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'TaskSpec.constraints');
      assert.equal(err.details.index, 1);
    }
  });

  // L206: assertBoolean { field } → {}
  it('assertBoolean error includes field in details', () => {
    try {
      validateModelProfile(validProfile({ supportsStructuredOutput: 'yes' }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'ModelProfile.supportsStructuredOutput');
    }
  });

  // L212-216: assertStringArray condition → false, { field, index } → {}
  it('assertStringArray rejects non-array (diffSummary)', () => {
    assert.throws(
      () => validateEvidencePackage(validEvidence({ diffSummary: 'not-array' })),
      ValidationError
    );
  });

  it('assertStringArray error includes field and index when item is non-string', () => {
    try {
      validateEvidencePackage(validEvidence({ diffSummary: ['valid', 42] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.diffSummary');
      assert.equal(err.details.index, 1);
    }
  });

  it('assertStringArray error includes field and index for changedFiles', () => {
    try {
      validateEvidencePackage(validEvidence({ changedFiles: [null] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.changedFiles');
      assert.equal(err.details.index, 0);
    }
  });

  // L266: assertOptionalInteger { field } → {}
  it('assertOptionalInteger error includes field in details', () => {
    try {
      validateEvidencePackage(validEvidence({
        checks: [{ name: 'test', status: 'passed', exitCode: 1.5, output: 'ok' }]
      }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.match(err.details.field, /exitCode/);
    }
  });
});

// ── Final 3 surviving non-StringLiteral mutants ───────────────────────────────

describe('contracts.js targeted: final surviving mutants', () => {
  // L99 ConditionalExpression → false: assertPlainObject entire condition
  // Need to verify the throw happens for EACH branch independently
  it('assertPlainObject throws for null (null branch)', () => {
    try {
      validateCommandSpec(null);
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec');
    }
  });

  it('assertPlainObject throws for non-object primitive (typeof branch)', () => {
    try {
      validateCommandSpec('string');
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec');
    }
  });

  it('assertPlainObject throws for array (Array.isArray branch)', () => {
    try {
      validateCommandSpec(['a', 'b']);
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec');
    }
  });

  it('assertPlainObject throws for EvidencePackage null', () => {
    try {
      validateEvidencePackage(null);
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage');
    }
  });

  // L130 ConditionalExpression → false: assertNonEmptyStringArray item.trim() === ''
  // The condition is: typeof item !== 'string' || item.trim() === ''
  // Mutation replaces entire condition with false → blank items pass through
  it('assertNonEmptyStringArray rejects blank item in ModelProfile.reasoningControls', () => {
    try {
      validateModelProfile(validProfile({ reasoningControls: ['valid', '   '] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'ModelProfile.reasoningControls');
      assert.equal(err.details.index, 1);
    }
  });

  it('assertNonEmptyStringArray rejects blank item in CommandSpec.doneCriteria', () => {
    try {
      validateCommandSpec(validCommand({ doneCriteria: ['diff-created', '\t'] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'CommandSpec.doneCriteria');
      assert.equal(err.details.index, 1);
    }
  });

  // L212 ObjectLiteral → {}: assertStringArray { field, index } → {}
  it('assertStringArray error for non-string item includes field and index (knownRisks)', () => {
    try {
      validateEvidencePackage(validEvidence({ knownRisks: ['valid', 42] }));
      assert.fail('should throw');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.details.field, 'EvidencePackage.knownRisks');
      assert.equal(err.details.index, 1);
    }
  });
});

// ── StringLiteral mutants: field name strings in assert calls ─────────────────
// Each test asserts error.details.field equals the exact field name string.
// This kills mutations that replace 'AdapterMapping.commandVersion' with "".

describe('contracts.js targeted: field name StringLiteral mutants', () => {
  it('AdapterMapping.commandVersion error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ commandVersion: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.commandVersion'); }
  });

  it('AdapterMapping.modelProfile error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ modelProfile: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.modelProfile'); }
  });

  it('AdapterMapping.configTemplate error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ configTemplate: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.configTemplate'); }
  });

  it('AdapterMapping.promptTemplate error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ promptTemplate: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.promptTemplate'); }
  });

  it('AdapterMapping.outputParser error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ outputParser: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.outputParser'); }
  });

  it('AdapterMapping.failureMapper error has correct field', () => {
    try { validateAdapterMapping(validAdapter({ failureMapper: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'AdapterMapping.failureMapper'); }
  });

  it('ModelProfile.id error has correct field', () => {
    try { validateModelProfile(validProfile({ id: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.id'); }
  });

  it('ModelProfile.model error has correct field', () => {
    try { validateModelProfile(validProfile({ model: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.model'); }
  });

  it('ModelProfile.maxOutputTokens error has correct field', () => {
    try { validateModelProfile(validProfile({ maxOutputTokens: 0 })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.maxOutputTokens'); }
  });

  it('ModelProfile.supportsVisionInput error has correct field', () => {
    try { validateModelProfile(validProfile({ supportsVisionInput: 'no' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.supportsVisionInput'); }
  });

  it('ModelProfile.reasoningControls error has correct field', () => {
    try { validateModelProfile(validProfile({ reasoningControls: [] })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.reasoningControls'); }
  });

  it('ModelProfile.costClass error has correct field', () => {
    try { validateModelProfile(validProfile({ costClass: 'ultra' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.costClass'); }
  });

  it('ModelProfile.retryPolicy error has correct field', () => {
    try { validateModelProfile(validProfile({ retryPolicy: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.retryPolicy'); }
  });

  it('ModelProfile.version error has correct field', () => {
    try { validateModelProfile(validProfile({ version: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'ModelProfile.version'); }
  });

  it('EvidencePackage.workspaceId error has correct field', () => {
    try { validateEvidencePackage(validEvidence({ workspaceId: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'EvidencePackage.workspaceId'); }
  });

  it('EvidencePackage.version error has correct field', () => {
    try { validateEvidencePackage(validEvidence({ version: '' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'EvidencePackage.version'); }
  });

  it('EvidencePackage.diffSummary error has correct field', () => {
    try { validateEvidencePackage(validEvidence({ diffSummary: 'bad' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'EvidencePackage.diffSummary'); }
  });

  it('EvidencePackage.changedFiles error has correct field', () => {
    try { validateEvidencePackage(validEvidence({ changedFiles: 'bad' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'EvidencePackage.changedFiles'); }
  });

  it('EvidencePackage.knownRisks error has correct field', () => {
    try { validateEvidencePackage(validEvidence({ knownRisks: 'bad' })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'EvidencePackage.knownRisks'); }
  });

  it('TaskSpec.constraints error has correct field when blank item', () => {
    try { validateTaskSpec(validTask({ constraints: ['\t'] })); assert.fail(); }
    catch (err) { assert.equal(err.details.field, 'TaskSpec.constraints'); }
  });
});
