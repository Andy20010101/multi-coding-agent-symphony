export const SUPERVISOR_LIVE_STATUSES = Object.freeze([
  'thread-requested',
  'thread-active',
  'active',
  'result-ready',
  'result-invalid'
]);

export const SUPERVISOR_RESULT_READY_STATUS = 'result-ready';

const SUPERVISOR_LIVE_STATUS_SET = new Set(SUPERVISOR_LIVE_STATUSES);

export function isLiveSupervisorStatus(status) {
  return SUPERVISOR_LIVE_STATUS_SET.has(status);
}

export function isSupervisorResultReadyStatus(status) {
  return status === SUPERVISOR_RESULT_READY_STATUS;
}

export function isLiveSupervisorLease(active) {
  return isPlainObject(active) && isLiveSupervisorStatus(active.status);
}

export function liveSupervisorThreadIds(threads) {
  return Array.isArray(threads)
    ? threads
      .filter((thread) => isLiveSupervisorStatus(thread?.status))
      .map((thread) => thread.threadId)
      .filter(isNonEmptyString)
    : [];
}

export function hasLiveSupervisorThread(threads) {
  return Array.isArray(threads) &&
    threads.some((thread) => isLiveSupervisorStatus(thread?.status));
}

export function hasLiveSupervisorState(state) {
  return isLiveSupervisorLease(state?.active) || hasLiveSupervisorThread(state?.threads);
}

export function isActiveSupervisorLeaseForCurrent({ active, current }) {
  return isLiveSupervisorLease(active) &&
    active.taskId === current?.taskId &&
    active.role === current?.role &&
    active.phase === current?.phase;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
