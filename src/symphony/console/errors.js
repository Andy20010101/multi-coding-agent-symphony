export class GoalEventPlanPreviewError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalEventPlanPreviewError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export function isMissingFileError(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
}
