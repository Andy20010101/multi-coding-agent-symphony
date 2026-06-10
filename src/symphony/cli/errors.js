export const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 64
};

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

export function readRequiredValue(args, index, optionName) {
  const value = args[index + 1];

  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('--')) {
    throw new UsageError(`${optionName} requires a value`);
  }

  return value;
}
