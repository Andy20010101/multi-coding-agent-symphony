import { join } from 'node:path';

import { buildAgentCliProviderHealthContract } from './agent-cli-provider-health.js';
import { buildAgentCliProviderProfileContract } from './agent-cli-provider-profile.js';
import { buildAppStateSnapshot } from './app-state-snapshot.js';
import { buildArtifactIndex } from './artifact-indexer.js';
import { buildJobModelContract } from './job-model-contract.js';
import { buildProjectRegistry } from './project-registry.js';

export const APP_DATA_INVENTORY_CONTRACT_NAME = 'app-data-inventory.v1';
export const APP_DATA_INVENTORY_CONTRACT_VERSION = 1;

const REQUIRED_DOMAIN_IDS = Object.freeze([
  'project-registry',
  'runtime-snapshots',
  'job-state',
  'artifact-index',
  'settings',
  'provider-profiles',
  'evidence-refs'
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'project-registry.v1',
  'current-project-resolver.v1',
  'app-state-snapshot.v1',
  'job-model.v1',
  'artifact-index.v1',
  'agent-cli-provider.v1',
  'agent-cli-provider-health.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1'
]);

const INVENTORY_BOUNDARY_FALSE_FIELDS = Object.freeze([
  'shellExecutionAvailable',
  'modelInvocationAvailable',
  'arbitraryCommandExecutionAvailable',
  'arbitraryPathReadAvailable',
  'localFileOpenAvailable',
  'artifactDownloadAvailable',
  'jobExecutionAvailable',
  'providerCliExecutionAvailable',
  'gitWriteAvailable',
  'mergeAvailable',
  'pushAvailable',
  'tagAvailable',
  'publishAvailable',
  'selfApprovalAvailable',
  'releaseWriteAvailable',
  'secretValueExposureAvailable'
]);

export async function buildAppDataInventory({
  cwd = process.cwd(),
  stateDir,
  goalId = 'latest',
  taskId = null,
  startedAt = new Date().toISOString(),
  generatedAt = new Date().toISOString(),
  env = process.env,
  artifactStoreDir
} = {}) {
  const resolvedStateDir = typeof stateDir === 'string' && stateDir.trim() !== ''
    ? stateDir
    : '.symphony';
  const resolvedArtifactStoreDir = typeof artifactStoreDir === 'string' && artifactStoreDir.trim() !== ''
    ? artifactStoreDir
    : join(resolvedStateDir, 'artifacts');

  const [
    projectRegistry,
    runtimeSnapshot,
    jobModel,
    artifactIndex,
    providerProfile,
    providerHealth
  ] = await Promise.all([
    buildProjectRegistry({ cwd, stateDir: resolvedStateDir, generatedAt }),
    buildAppStateSnapshot({ cwd, stateDir: resolvedStateDir, goalId, startedAt, generatedAt }),
    buildJobModelContract({ goalId, taskId, generatedAt }),
    buildArtifactIndex({
      artifactStoreDir: resolvedArtifactStoreDir,
      stateDir: resolvedStateDir,
      goalId,
      taskId,
      generatedAt
    }),
    buildAgentCliProviderProfileContract({ goalId, taskId: taskId ?? 'task-1', generatedAt }),
    buildAgentCliProviderHealthContract({ generatedAt, env })
  ]);
  const currentProject = projectRegistry.projects[0] ?? null;
  const evidenceRefs = normalizeEvidenceRefs(runtimeSnapshot.evidence_refs);
  const domains = [
    buildDomain({
      domainId: 'project-registry',
      label: 'Project registry',
      contractName: projectRegistry.contractName,
      route: '/api/projects',
      storageKind: 'repo-local-metadata',
      canonicalSource: 'project-registry.v1',
      state: projectRegistry.projects.length > 0 ? 'available' : 'empty',
      itemCount: projectRegistry.projects.length,
      refs: [
        refItem('currentProjectId', projectRegistry.currentProjectId),
        refItem('stateDir', projectRegistry.source.stateDir),
        refItem('repoPath', currentProject?.repo_path)
      ],
      boundaries: projectRegistry.boundaries
    }),
    buildDomain({
      domainId: 'runtime-snapshots',
      label: 'Runtime snapshots',
      contractName: runtimeSnapshot.contractName,
      route: '/api/runtime/snapshot',
      storageKind: 'read-only-aggregation',
      canonicalSource: 'app-state-snapshot.v1',
      state: runtimeSnapshot.freshness.status,
      itemCount: 1,
      refs: [
        refItem('goalId', runtimeSnapshot.active_goal?.goal_id),
        refItem('taskId', runtimeSnapshot.current_task?.task_id),
        refItem('snapshotGeneratedAt', runtimeSnapshot.generatedAt)
      ],
      boundaries: runtimeSnapshot.boundaries
    }),
    buildDomain({
      domainId: 'job-state',
      label: 'Job state',
      contractName: jobModel.contractName,
      route: '/api/jobs',
      storageKind: 'job-contract-projection',
      canonicalSource: 'job-model.v1',
      state: jobModel.job.status,
      itemCount: 1,
      refs: [
        refItem('jobId', jobModel.job.job_id),
        refItem('queueState', jobModel.job.queue_state),
        refItem('actionId', jobModel.job.action_id)
      ],
      boundaries: jobModel.boundaries
    }),
    buildDomain({
      domainId: 'artifact-index',
      label: 'Artifact index',
      contractName: artifactIndex.contractName,
      route: '/api/artifacts',
      storageKind: 'derived-cache-and-search',
      canonicalSource: 'ArtifactStore',
      state: artifactIndex.entries.length > 0 ? 'available' : 'empty',
      itemCount: artifactIndex.entries.length,
      refs: [
        refItem('artifactStoreDir', resolvedArtifactStoreDir),
        refItem('goalId', artifactIndex.context.goalId),
        refItem('indexRole', artifactIndex.context.indexRole)
      ],
      boundaries: artifactIndex.boundaries
    }),
    buildDomain({
      domainId: 'settings',
      label: 'Settings',
      contractName: 'app-settings-inventory.v1',
      route: '/api/app/data-inventory',
      storageKind: 'repo-local-settings-pointers',
      canonicalSource: 'repo-local-metadata',
      state: currentProject === null ? 'empty' : 'available',
      itemCount: [
        currentProject?.default_branch,
        resolvedStateDir
      ].filter((value) => typeof value === 'string' && value.trim() !== '').length,
      refs: [
        refItem('defaultBranch', currentProject?.default_branch),
        refItem('stateDir', resolvedStateDir)
      ],
      boundaries: {
        readOnly: true,
        settingsWriteAvailable: false,
        arbitraryPathReadAvailable: false,
        shellExecutionAvailable: false,
        secretValueExposureAvailable: false
      }
    }),
    buildDomain({
      domainId: 'provider-profiles',
      label: 'Provider profiles',
      contractName: providerHealth.contractName,
      route: '/api/providers/health',
      storageKind: 'sanitized-provider-profile',
      canonicalSource: 'agent-cli-provider.v1 + agent-cli-provider-health.v1',
      state: providerHealth.summary.state,
      itemCount: providerHealth.providers.length,
      refs: providerProfile.activeProviders.map((provider) => refItem(provider.providerId, provider.backendProfile.profileRef)),
      boundaries: providerHealth.boundaries
    }),
    buildDomain({
      domainId: 'evidence-refs',
      label: 'Evidence refs',
      contractName: 'goal-evidence-ref-inventory.v1',
      route: '/api/runtime/snapshot',
      storageKind: 'explicit-event-ref-list',
      canonicalSource: 'goal-event-log.v1 + goal-progress-ledger.v1',
      state: evidenceRefs.length > 0 ? 'available' : 'empty',
      itemCount: evidenceRefs.length,
      refs: evidenceRefs.map((evidence) => refItem(evidence.kind, evidence.ref)),
      boundaries: {
        readOnly: true,
        evidenceBodyReadAvailable: false,
        arbitraryPathReadAvailable: false,
        localFileOpenAvailable: false,
        shellExecutionAvailable: false
      }
    })
  ];

  return assertAppDataInventoryContract({
    contractName: APP_DATA_INVENTORY_CONTRACT_NAME,
    contractVersion: APP_DATA_INVENTORY_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: REQUIRED_SOURCE_CONTRACTS,
      stateSource: 'explicit-backend-contracts',
      inventoryScope: 'registry-snapshots-job-state-artifact-index-settings-provider-profiles-evidence-refs'
    },
    summary: {
      domainCount: domains.length,
      availableDomainCount: domains.filter((domain) => domain.state === 'available' || domain.state === 'current').length,
      evidenceRefCount: evidenceRefs.length,
      persistedDataKinds: domains.map((domain) => domain.domainId)
    },
    domains,
    evidenceRefs,
    settings: {
      stateDir: resolvedStateDir,
      artifactStoreDir: resolvedArtifactStoreDir,
      repoPath: currentProject?.repo_path ?? null,
      settingsWriteAvailable: false,
      secretValueExposureAvailable: false
    },
    boundaries: inventoryBoundaries()
  });
}

export function validateAppDataInventoryContract(inventory) {
  const errors = [];

  if (!isPlainObject(inventory)) {
    return { ok: false, errors: ['app data inventory must be a plain object'] };
  }

  requireExact(errors, inventory.contractName, 'contractName', APP_DATA_INVENTORY_CONTRACT_NAME);
  requireExact(errors, inventory.contractVersion, 'contractVersion', APP_DATA_INVENTORY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, inventory.generatedAt, 'generatedAt');
  requireExact(errors, inventory.readOnly, 'readOnly', true);
  validateContext(errors, inventory.context);
  validateSummary(errors, inventory.summary);
  validateDomains(errors, inventory.domains);
  validateEvidenceRefs(errors, inventory.evidenceRefs);
  validateSettings(errors, inventory.settings);
  validateBoundaries(errors, inventory.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertAppDataInventoryContract(inventory) {
  const result = validateAppDataInventoryContract(inventory);

  if (!result.ok) {
    throw new Error(`Invalid app data inventory contract: ${result.errors.join('; ')}`);
  }

  return inventory;
}

function buildDomain({
  domainId,
  label,
  contractName,
  route,
  storageKind,
  canonicalSource,
  state,
  itemCount,
  refs,
  boundaries
}) {
  return {
    domainId,
    label,
    contractName,
    route,
    storageKind,
    canonicalSource,
    state,
    itemCount,
    refs: refs.filter((ref) => ref.value !== null),
    boundaries: normalizeBoundaryFlags(boundaries)
  };
}

function refItem(kind, value) {
  return {
    kind,
    value: typeof value === 'string' && value.trim() !== '' ? value : null
  };
}

function normalizeEvidenceRefs(refs) {
  if (!Array.isArray(refs)) return [];

  return refs
    .map((ref) => ({
      kind: typeof ref.kind === 'string' && ref.kind.trim() !== '' ? ref.kind : 'evidence',
      ref: typeof ref.ref === 'string' && ref.ref.trim() !== '' ? ref.ref : null,
      source: typeof ref.source === 'string' && ref.source.trim() !== '' ? ref.source : 'app-state-snapshot.v1'
    }))
    .filter((ref) => ref.ref !== null);
}

function normalizeBoundaryFlags(boundaries) {
  if (!isPlainObject(boundaries)) {
    return { readOnly: true };
  }

  const normalized = { readOnly: boundaries.readOnly === false ? false : true };

  for (const key of INVENTORY_BOUNDARY_FALSE_FIELDS) {
    if (Object.hasOwn(boundaries, key)) {
      normalized[key] = boundaries[key];
    }
  }

  return normalized;
}

function inventoryBoundaries() {
  return {
    readOnly: true,
    shellExecutionAvailable: false,
    modelInvocationAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    localFileOpenAvailable: false,
    artifactDownloadAvailable: false,
    jobExecutionAvailable: false,
    providerCliExecutionAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false,
    releaseWriteAvailable: false,
    secretValueExposureAvailable: false,
    stateSource: 'explicit backend contracts only'
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  if (!Array.isArray(context.sourceContracts)) {
    errors.push('context.sourceContracts must be an array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(
    errors,
    context.inventoryScope,
    'context.inventoryScope',
    'registry-snapshots-job-state-artifact-index-settings-provider-profiles-evidence-refs'
  );
}

function validateSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('summary must be a plain object');
    return;
  }

  requireNonNegativeInteger(errors, summary.domainCount, 'summary.domainCount');
  requireNonNegativeInteger(errors, summary.availableDomainCount, 'summary.availableDomainCount');
  requireNonNegativeInteger(errors, summary.evidenceRefCount, 'summary.evidenceRefCount');

  if (!Array.isArray(summary.persistedDataKinds)) {
    errors.push('summary.persistedDataKinds must be an array');
  } else {
    for (const required of REQUIRED_DOMAIN_IDS) {
      if (!summary.persistedDataKinds.includes(required)) {
        errors.push(`summary.persistedDataKinds must include ${required}`);
      }
    }
  }
}

function validateDomains(errors, domains) {
  if (!Array.isArray(domains)) {
    errors.push('domains must be an array');
    return;
  }

  const domainIds = domains.map((domain) => domain?.domainId);
  for (const required of REQUIRED_DOMAIN_IDS) {
    if (!domainIds.includes(required)) {
      errors.push(`domains must include ${required}`);
    }
  }

  domains.forEach((domain, index) => validateDomain(errors, domain, `domains[${index}]`));
}

function validateDomain(errors, domain, path) {
  if (!isPlainObject(domain)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, domain.domainId, `${path}.domainId`);
  requireNonEmptyString(errors, domain.label, `${path}.label`);
  requireContractName(errors, domain.contractName, `${path}.contractName`);
  requireApiRoute(errors, domain.route, `${path}.route`);
  requireNonEmptyString(errors, domain.storageKind, `${path}.storageKind`);
  requireNonEmptyString(errors, domain.canonicalSource, `${path}.canonicalSource`);
  requireSafeRef(errors, domain.state, `${path}.state`);
  requireNonNegativeInteger(errors, domain.itemCount, `${path}.itemCount`);

  if (!Array.isArray(domain.refs)) {
    errors.push(`${path}.refs must be an array`);
  } else {
    domain.refs.forEach((ref, refIndex) => {
      if (!isPlainObject(ref)) {
        errors.push(`${path}.refs[${refIndex}] must be a plain object`);
      } else {
        requireSafeRef(errors, ref.kind, `${path}.refs[${refIndex}].kind`);
        requireNonEmptyString(errors, ref.value, `${path}.refs[${refIndex}].value`);
      }
    });
  }

  if (!isPlainObject(domain.boundaries)) {
    errors.push(`${path}.boundaries must be a plain object`);
  } else if (domain.boundaries.readOnly !== true) {
    errors.push(`${path}.boundaries.readOnly must be true`);
  }
}

function validateEvidenceRefs(errors, evidenceRefs) {
  if (!Array.isArray(evidenceRefs)) {
    errors.push('evidenceRefs must be an array');
    return;
  }

  evidenceRefs.forEach((ref, index) => {
    if (!isPlainObject(ref)) {
      errors.push(`evidenceRefs[${index}] must be a plain object`);
      return;
    }

    requireSafeRef(errors, ref.kind, `evidenceRefs[${index}].kind`);
    requireNonEmptyString(errors, ref.ref, `evidenceRefs[${index}].ref`);
    requireContractName(errors, ref.source, `evidenceRefs[${index}].source`);
  });
}

function validateSettings(errors, settings) {
  if (!isPlainObject(settings)) {
    errors.push('settings must be a plain object');
    return;
  }

  requireNonEmptyString(errors, settings.stateDir, 'settings.stateDir');
  requireNonEmptyString(errors, settings.artifactStoreDir, 'settings.artifactStoreDir');

  if (settings.repoPath !== null) {
    requireNonEmptyString(errors, settings.repoPath, 'settings.repoPath');
  }

  requireExact(errors, settings.settingsWriteAvailable, 'settings.settingsWriteAvailable', false);
  requireExact(errors, settings.secretValueExposureAvailable, 'settings.secretValueExposureAvailable', false);
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  for (const field of INVENTORY_BOUNDARY_FALSE_FIELDS) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
  requireExact(errors, boundaries.stateSource, 'boundaries.stateSource', 'explicit backend contracts only');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireExact(errors, actual, path, expected) {
  if (actual !== expected) {
    errors.push(`${path} must be ${expected}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireNonNegativeInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.v[0-9]+$/u.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function requireApiRoute(errors, value, path) {
  if (typeof value !== 'string' || !value.startsWith('/api/') || value.includes('..') || value.includes('\\')) {
    errors.push(`${path} must be a safe API route`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}
