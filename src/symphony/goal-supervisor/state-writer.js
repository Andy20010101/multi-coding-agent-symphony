import { buildGoalSupervisorEventRegistrarPreview } from './event-registrar.js';

export const GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_NAME = 'goal-supervisor-state-writer-preview.v1';
export const GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_VERSION = 1;

export async function buildGoalSupervisorStateWriterPreview(options = {}) {
  if (!isPlainObject(options)) {
    throw new TypeError('state writer preview options must be a plain object');
  }

  const requestedMode = typeof options.requestedMode === 'string'
    ? options.requestedMode
    : (typeof options.writeMode === 'string' ? options.writeMode : 'dry-run');
  const eventRegistrar = await buildGoalSupervisorEventRegistrarPreview({
    ...options,
    requestedMode
  });

  return {
    contractName: GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_STATE_WRITER_PREVIEW_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    writer: {
      id: 'goal-supervisor-state-writer',
      singleWriter: true,
      owns: [
        'managed-goal-event-registration-preview',
        'registration-audit-preview'
      ]
    },
    requestedMode,
    status: eventRegistrar.status,
    reason: eventRegistrar.reason,
    refusalReasons: eventRegistrar.refusalReasons,
    operations: [{
      kind: 'goal-event-registration',
      status: eventRegistrar.status,
      reason: eventRegistrar.reason,
      targetEvent: eventRegistrar.targetEvent,
      target: eventRegistrar.target
    }],
    eventRegistrar,
    boundaries: {
      dryRunOnly: true,
      writesInPreview: false,
      liveManagedGoalAppendIntroduced: false,
      confirmExecutorAvailable: false,
      nonGoalStateWriteAvailable: false
    }
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
