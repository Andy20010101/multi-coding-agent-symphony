import { validateCommandSpec } from './contracts.js';

export class RouterScheduler {
  constructor({ capabilityReports }) {
    if (!Array.isArray(capabilityReports)) {
      throw new TypeError('capabilityReports must be an array');
    }

    this.capabilityReports = structuredClone(capabilityReports);
  }

  route({ commandSpec, excludedAdapters = [] }) {
    validateCommandSpec(commandSpec);

    const excluded = new Set(excludedAdapters);
    const selected = this.capabilityReports.find((report) => (
      !excluded.has(report.adapterId)
      && report.supportsNonInteractive === true
      && Array.isArray(report.supportedCommands)
      && report.supportedCommands.includes(commandSpec.name)
    ));

    if (!selected) {
      throw new Error(`No capable adapter for command ${commandSpec.name}`);
    }

    return structuredClone(selected);
  }

  planRetry({ failure }) {
    if (failure?.retryable !== true) {
      return {
        retry: false,
        nextCommand: null,
        owner: failure?.owner ?? 'unknown'
      };
    }

    return {
      retry: true,
      nextCommand: failure.recommendedNextCommand,
      owner: failure.owner
    };
  }
}

