import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SYSTEM_GOLDEN_PATH_BOUNDARIES,
  SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
  SYSTEM_GOLDEN_PATH_CONTRACT_VERSION,
  SYSTEM_GOLDEN_PATH_STEP_IDS,
  SystemGoldenPathContractError,
  assertSystemGoldenPathContract,
  buildSystemGoldenPathContract,
  collectSystemGoldenPathBlockedReasons,
  deriveSystemGoldenPathOverallState,
  validateSystemGoldenPathContract
} from '../src/symphony/system-golden-path-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts');

const FIXTURES = Object.freeze([
  'system-golden-path.ready.v1.json',
  'system-golden-path.missing-project.v1.json',
  'system-golden-path.missing-supervisor.v1.json',
  'system-golden-path.result-intake-blocked.v1.json',
  'system-golden-path.event-preview-blocked.v1.json',
  'system-golden-path.review-gate-manual.v1.json',
  'system-golden-path.closeout-gaps.v1.json'
]);

const SCENARIOS = Object.freeze([
  {
    fixture: 'system-golden-path.missing-project.v1.json',
    overallState: 'missing',
    stepId: 'project-binding',
    stepState: 'missing',
    reason: 'project-binding-missing'
  },
  {
    fixture: 'system-golden-path.missing-supervisor.v1.json',
    overallState: 'missing',
    stepId: 'supervisor',
    stepState: 'missing',
    reason: 'supervisor-read-model-missing'
  },
  {
    fixture: 'system-golden-path.result-intake-blocked.v1.json',
    overallState: 'blocked',
    stepId: 'result-intake',
    stepState: 'blocked',
    reason: 'pending-result-blocked'
  },
  {
    fixture: 'system-golden-path.event-preview-blocked.v1.json',
    overallState: 'blocked',
    stepId: 'event-preview',
    stepState: 'blocked',
    reason: 'event-preview-not-eligible'
  },
  {
    fixture: 'system-golden-path.review-gate-manual.v1.json',
    overallState: 'manual-required',
    stepId: 'review-gate',
    stepState: 'manual-required',
    reason: null
  },
  {
    fixture: 'system-golden-path.closeout-gaps.v1.json',
    overallState: 'blocked',
    stepId: 'closeout',
    stepState: 'blocked',
    reason: 'closeout-evidence-missing'
  }
]);

const FORBIDDEN_VISIBLE_LABELS = new Set([
  'Run Agent',
  'Execute',
  'Launch Provider',
  'Dispatch Child',
  'Compact Now',
  'New Thread',
  'Push',
  'Tag',
  'Publish',
  'Release'
]);

describe('v52 systemGoldenPath.v1 contracts and fixtures', () => {
  it('validates every PR-2 fixture with required step order and review gate default', () => {
    for (const name of FIXTURES) {
      const contract = fixture(name);
      const validation = validateSystemGoldenPathContract(contract);

      assert.equal(validation.ok, true, `${name}: ${validation.errors.join('; ')}`);
      assert.equal(contract.contractName, SYSTEM_GOLDEN_PATH_CONTRACT_NAME);
      assert.equal(contract.contractVersion, SYSTEM_GOLDEN_PATH_CONTRACT_VERSION);
      assert.deepEqual(contract.steps.map((step) => step.id), SYSTEM_GOLDEN_PATH_STEP_IDS);
      assert.equal(stepById(contract, 'review-gate').state, 'manual-required');
      assertReadOnlyVisibilityBoundary(contract);
    }
  });

  it('captures required missing, blocked, manual, and closeout fixture scenarios', () => {
    for (const scenario of SCENARIOS) {
      const contract = fixture(scenario.fixture);
      const step = stepById(contract, scenario.stepId);

      assert.equal(contract.overallState, scenario.overallState, scenario.fixture);
      assert.equal(step.state, scenario.stepState, scenario.fixture);

      if (scenario.reason !== null) {
        assert.ok(step.blockedReasons.includes(scenario.reason), scenario.fixture);
        assert.ok(contract.blockedReasons.includes(scenario.reason), scenario.fixture);
        assert.equal(contract.nextSafeAction.kind, 'refresh-state', scenario.fixture);
      } else {
        assert.deepEqual(step.blockedReasons, []);
        assert.equal(contract.nextSafeAction.kind, 'manual-cli-required');
        assert.equal(contract.nextSafeAction.label, 'Manual CLI Required');
        assert.equal(contract.nextSafeAction.commandName, 'symphony goal review');
      }
    }
  });

  it('builds a contract from explicit read-model inputs without opening mutation paths', () => {
    const ready = fixture('system-golden-path.ready.v1.json');
    const built = buildSystemGoldenPathContract({
      generatedAt: ready.generatedAt,
      project: ready.project,
      goal: ready.goal,
      steps: ready.steps,
      sourceContracts: ready.sourceContracts,
      routeProvenance: ready.routeProvenance
    });

    assert.equal(built.contractName, SYSTEM_GOLDEN_PATH_CONTRACT_NAME);
    assert.equal(built.overallState, 'ready');
    assert.equal(built.nextSafeAction.kind, 'manual-cli-required');
    assert.equal(deriveSystemGoldenPathOverallState(ready.steps), 'ready');
    assert.equal(
      deriveSystemGoldenPathOverallState(fixture('system-golden-path.review-gate-manual.v1.json').steps),
      'manual-required'
    );
    assert.deepEqual(collectSystemGoldenPathBlockedReasons(ready.steps), []);
    assertReadOnlyVisibilityBoundary(built);
  });

  it('rejects top-level state, blockers, and next action that drift from steps', () => {
    const drift = fixture('system-golden-path.ready.v1.json');

    drift.steps[0] = {
      ...drift.steps[0],
      state: 'blocked',
      blockedReasons: ['project-binding-blocked']
    };
    drift.overallState = 'ready';
    drift.blockedReasons = [];
    drift.nextSafeAction = {
      kind: 'manual-cli-required',
      label: 'Manual CLI Required',
      reason: 'review-gate-manual-required',
      commandName: 'symphony goal review',
      willMutate: false
    };

    const validation = validateSystemGoldenPathContract(drift);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('overallState must match derived step state "blocked"'));
    assert.ok(validation.errors.includes('blockedReasons must match derived step blocked reasons'));
    assert.ok(validation.errors.includes('nextSafeAction must match derived step next safe action'));
  });

  it('rejects extra fields across contract objects instead of accepting hidden write routes', () => {
    const drift = fixture('system-golden-path.ready.v1.json');

    drift.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.project.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.goal.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.steps[0].executeRoute = '/api/providers/run';
    drift.steps[0].nextSafeAction.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.steps[0].sourceRef.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.sourceContracts[0].writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.routeProvenance.writeRoute = '/api/goals/<goal-id>/event-plan-confirm';
    drift.boundaries.providerExecutionRoute = '/api/providers/run';

    const validation = validateSystemGoldenPathContract(drift);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('contract.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('project.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('goal.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('steps[0].executeRoute is not allowed'));
    assert.ok(validation.errors.includes('steps[0].nextSafeAction.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('steps[0].sourceRef.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('sourceContracts[0].writeRoute is not allowed'));
    assert.ok(validation.errors.includes('routeProvenance.writeRoute is not allowed'));
    assert.ok(validation.errors.includes('boundaries.providerExecutionRoute is not allowed'));
  });

  it('rejects unsafe routes carried in otherwise allowed route fields', () => {
    const confirmRoute = fixture('system-golden-path.ready.v1.json');
    const providerRoute = fixture('system-golden-path.ready.v1.json');

    confirmRoute.steps[0].nextSafeAction.routeTemplate = '/api/goals/<goal-id>/event-plan-confirm';
    providerRoute.routeProvenance.refreshRouteTemplate = '/api/providers/run';

    const confirmValidation = validateSystemGoldenPathContract(confirmRoute);
    const providerValidation = validateSystemGoldenPathContract(providerRoute);

    assert.equal(confirmValidation.ok, false);
    assert.ok(confirmValidation.errors.includes(
      'steps[0].nextSafeAction.routeTemplate must be one of /api/goals/<goal-id>/supervisor'
    ));
    assert.equal(providerValidation.ok, false);
    assert.ok(providerValidation.errors.includes(
      'routeProvenance.refreshRouteTemplate must be one of /api/goals/<goal-id>/supervisor'
    ));
  });

  it('rejects action-kind fields that do not belong to that action shape', () => {
    const manualWithRoute = fixture('system-golden-path.ready.v1.json');
    const refreshWithCommand = fixture('system-golden-path.ready.v1.json');

    manualWithRoute.steps[7].nextSafeAction = {
      ...manualWithRoute.steps[7].nextSafeAction,
      method: 'GET',
      routeTemplate: '/api/goals/<goal-id>/supervisor'
    };
    refreshWithCommand.steps[0].nextSafeAction = {
      ...refreshWithCommand.steps[0].nextSafeAction,
      commandName: 'symphony goal review'
    };

    const manualValidation = validateSystemGoldenPathContract(manualWithRoute);
    const refreshValidation = validateSystemGoldenPathContract(refreshWithCommand);

    assert.equal(manualValidation.ok, false);
    assert.ok(manualValidation.errors.includes(
      'steps[7].nextSafeAction.method is not allowed for manual-cli-required'
    ));
    assert.ok(manualValidation.errors.includes(
      'steps[7].nextSafeAction.routeTemplate is not allowed for manual-cli-required'
    ));
    assert.equal(refreshValidation.ok, false);
    assert.ok(refreshValidation.errors.includes(
      'steps[0].nextSafeAction.commandName is not allowed for refresh-state'
    ));
  });

  it('returns validation errors when a blocking step omits blockedReasons', () => {
    const drift = fixture('system-golden-path.ready.v1.json');

    drift.steps[0] = {
      ...drift.steps[0],
      state: 'blocked'
    };
    delete drift.steps[0].blockedReasons;

    const validation = validateSystemGoldenPathContract(drift);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('steps[0].blockedReasons is required'));
    assert.ok(validation.errors.includes('steps[0].blockedReasons must be an array'));
    assert.ok(validation.errors.includes('steps[0].blockedReasons must explain blocked state'));
  });

  it('returns located validation errors for mutation drift and unsafe source refs', () => {
    const drift = fixture('system-golden-path.ready.v1.json');

    drift.steps[0].willMutate = true;
    drift.steps[1].sourceRef.ref = '.codex/sessions/raw-secret.jsonl';
    drift.nextSafeAction = {
      ...drift.nextSafeAction,
      label: 'Run Agent'
    };
    drift.routeProvenance.mutationRoutes = ['/api/goals/v52-system-golden-path-closeout/event-plan-confirm'];
    drift.boundaries.childDispatchAvailable = true;

    const validation = validateSystemGoldenPathContract(drift);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.includes('steps[0].willMutate must be false'));
    assert.ok(validation.errors.includes('nextSafeAction.label must be one of Refresh State, Manual CLI Required'));
    assert.ok(validation.errors.includes('nextSafeAction.label must not be a forbidden action label'));
    assert.ok(validation.errors.includes('routeProvenance.mutationRoutes must be empty'));
    assert.ok(validation.errors.includes('boundaries.childDispatchAvailable must be false'));
    assert.ok(validation.errors.includes(
      'contract.steps[1].sourceRef.ref must not contain raw transcript, model output, or local session references'
    ));
  });

  it('throws a typed contract error from the assert helper', () => {
    const invalid = fixture('system-golden-path.ready.v1.json');

    invalid.contractName = 'systemGoldenPath.v2';

    assert.throws(
      () => assertSystemGoldenPathContract(invalid),
      (error) => (
        error instanceof SystemGoldenPathContractError &&
        error.code === 'invalid-system-golden-path' &&
        error.details.reason === 'contractName must be "systemGoldenPath.v1"'
      )
    );
  });
});

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

function stepById(contract, id) {
  return contract.steps.find((step) => step.id === id);
}

function assertReadOnlyVisibilityBoundary(contract) {
  assert.equal(contract.routeProvenance.readModelOwner, 'backend');
  assert.equal(contract.routeProvenance.frontendLocalFileReads, false);
  assert.deepEqual(contract.routeProvenance.mutationRoutes, []);

  for (const [field, expected] of Object.entries(SYSTEM_GOLDEN_PATH_BOUNDARIES)) {
    assert.equal(contract.boundaries[field], expected, `boundaries.${field}`);
  }

  for (const step of contract.steps) {
    assert.equal(step.willMutate, false, `${step.id}.willMutate`);
    assert.equal(step.nextSafeAction.willMutate, false, `${step.id}.nextSafeAction.willMutate`);
  }

  for (const sourceContract of contract.sourceContracts) {
    assert.equal(sourceContract.readOnly, true, `${sourceContract.contractName}.readOnly`);
  }

  for (const label of actionLabels(contract)) {
    assert.equal(FORBIDDEN_VISIBLE_LABELS.has(label), false, label);
  }

  for (const value of stringValues(contract)) {
    assert.doesNotMatch(
      value,
      /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/])/iu
    );
  }
}

function actionLabels(contract) {
  return [
    contract.nextSafeAction.label,
    ...contract.steps.map((step) => step.nextSafeAction.label)
  ];
}

function stringValues(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => stringValues(entry));
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap((entry) => stringValues(entry));
  }

  return typeof value === 'string' ? [value] : [];
}
