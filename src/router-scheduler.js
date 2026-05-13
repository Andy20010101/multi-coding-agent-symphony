import { validateAdapterMapping, validateCommandSpec, validateModelProfile } from './contracts.js';

const COST_RANK = {
  low: 0,
  medium: 1,
  high: 2
};

export class RouterScheduler {
  constructor({ capabilityReports }) {
    if (!Array.isArray(capabilityReports)) {
      throw new TypeError('capabilityReports must be an array');
    }

    this.capabilityReports = structuredClone(capabilityReports);
  }

  route({
    commandSpec,
    excludedAdapters = [],
    adapterMappings,
    modelProfiles = [],
    failureHistory = [],
    explicitModelProfile
  }) {
    validateCommandSpec(commandSpec);

    const excluded = buildExcludedAdapters({ excludedAdapters, failureHistory });
    const capableReports = this.capabilityReports.filter((report) => isCapableReport({
      report,
      commandName: commandSpec.name,
      excluded
    }));

    if (!Array.isArray(adapterMappings) || adapterMappings.length === 0) {
      const selected = capableReports[0];

      if (!selected) {
        throw new Error(`No capable adapter for command ${commandSpec.name}`);
      }

      return {
        ...structuredClone(selected),
        modelProfile: selected.modelProfiles[0],
        routeDecision: {
          command: commandSpec.name,
          adapterId: selected.adapterId,
          modelProfile: selected.modelProfiles[0],
          reason: excluded.size > excludedAdapters.length ? 'retryable-failure-excluded' : 'first-capable-adapter',
          excludedAdapters: Array.from(excluded).sort(),
          candidateCount: capableReports.length,
          version: '1'
        }
      };
    }

    validateRoutingInputs({ adapterMappings, modelProfiles, failureHistory });

    const profileById = new Map(modelProfiles.map((profile) => [profile.id, profile]));
    const reportByAdapter = new Map(capableReports.map((report) => [report.adapterId, report]));
    const candidates = adapterMappings
      .filter((mapping) => mapping.command === commandSpec.name && reportByAdapter.has(mapping.adapter))
      .map((mapping) => ({
        mapping,
        report: reportByAdapter.get(mapping.adapter),
        profile: profileById.get(mapping.modelProfile)
      }))
      .filter((candidate) => candidate.profile);

    const selected = selectCandidate({
      candidates,
      commandName: commandSpec.name,
      explicitModelProfile
    });

    if (!selected) {
      throw new Error(`No capable adapter for command ${commandSpec.name}`);
    }

    return buildRouteDecision({
      selected,
      commandName: commandSpec.name,
      excluded,
      candidateCount: candidates.length,
      reason: decisionReason({
        commandName: commandSpec.name,
        explicitModelProfile,
        excludedAdapters,
        excluded
      })
    });
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

function buildExcludedAdapters({ excludedAdapters, failureHistory }) {
  if (!Array.isArray(excludedAdapters)) {
    throw new TypeError('excludedAdapters must be an array');
  }

  if (!Array.isArray(failureHistory)) {
    throw new TypeError('failureHistory must be an array');
  }

  const excluded = new Set(excludedAdapters);

  for (const failure of failureHistory) {
    if (failure?.retryable === true && typeof failure.adapterId === 'string' && failure.adapterId.trim() !== '') {
      excluded.add(failure.adapterId);
    }
  }

  return excluded;
}

function validateRoutingInputs({ adapterMappings, modelProfiles }) {
  if (!Array.isArray(adapterMappings)) {
    throw new TypeError('adapterMappings must be an array');
  }

  if (!Array.isArray(modelProfiles)) {
    throw new TypeError('modelProfiles must be an array');
  }

  for (const mapping of adapterMappings) {
    validateAdapterMapping(mapping);
  }

  for (const profile of modelProfiles) {
    validateModelProfile(profile);
  }
}

function isCapableReport({ report, commandName, excluded }) {
  return !excluded.has(report.adapterId) &&
    report.supportsNonInteractive === true &&
    Array.isArray(report.supportedCommands) &&
    report.supportedCommands.includes(commandName);
}

function selectCandidate({ candidates, commandName, explicitModelProfile }) {
  if (typeof explicitModelProfile === 'string' && explicitModelProfile.trim() !== '') {
    return candidates.find((candidate) => candidate.mapping.modelProfile === explicitModelProfile);
  }

  if (commandName === 'review') {
    return [...candidates].sort(compareByCostThenStableFields)[0];
  }

  return candidates[0];
}

function compareByCostThenStableFields(left, right) {
  return COST_RANK[left.profile.costClass] - COST_RANK[right.profile.costClass] ||
    left.mapping.adapter.localeCompare(right.mapping.adapter) ||
    left.mapping.modelProfile.localeCompare(right.mapping.modelProfile);
}

function buildRouteDecision({ selected, commandName, excluded, candidateCount, reason }) {
  return {
    ...structuredClone(selected.report),
    adapterId: selected.mapping.adapter,
    adapterMapping: structuredClone(selected.mapping),
    modelProfile: selected.mapping.modelProfile,
    modelProfiles: [selected.mapping.modelProfile],
    routeDecision: {
      command: commandName,
      adapterId: selected.mapping.adapter,
      modelProfile: selected.mapping.modelProfile,
      reason,
      excludedAdapters: Array.from(excluded).sort(),
      candidateCount,
      version: '1'
    }
  };
}

function decisionReason({ commandName, explicitModelProfile, excludedAdapters, excluded }) {
  if (typeof explicitModelProfile === 'string' && explicitModelProfile.trim() !== '') {
    return 'explicit-model-override';
  }

  if (excluded.size > excludedAdapters.length) {
    return 'retryable-failure-excluded';
  }

  if (commandName === 'review') {
    return 'lower-cost-review-profile';
  }

  return 'first-capable-mapping';
}
