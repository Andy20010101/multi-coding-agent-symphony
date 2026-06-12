import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, relative, sep } from 'node:path';

export const SESSION_CONTEXT_CONTRACT_NAME = 'sessionContext.v1';
export const SESSION_CONTEXT_CONTRACT_VERSION = 1;
export const SESSION_SOURCE_INVENTORY_CONTRACT_NAME = 'sessionSourceInventory.v1';
export const SESSION_SOURCE_INVENTORY_CONTRACT_VERSION = 1;
export const CONTEXT_ADVISORY_CONTRACT_NAME = 'contextAdvisory.v1';
export const CONTEXT_ADVISORY_CONTRACT_VERSION = 1;

const DEFAULT_STALE_AFTER_MS = 30 * 60 * 1000;
const DEFAULT_MAX_FILES_PER_PROVIDER = 200;
const SESSION_SOURCE_SCAN_SCOPE = 'bounded-provider-session-roots';
const SESSION_SOURCE_BOUNDARIES = Object.freeze({
  readOnly: true,
  willMutate: false,
  frontendMayScanFolders: false,
  exposesRawTranscript: false,
  exposesRawJsonl: false,
  launchesProvider: false,
  writesGoalState: false,
  writesLedgers: false,
  writesEventLogs: false,
  writesSymphonyState: false,
  dispatchesChildren: false,
  compactsTranscripts: false
});

export async function buildSessionContext({
  threadId = null,
  generatedAt = new Date().toISOString(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
  codexRoot = join(homedir(), '.codex', 'sessions'),
  claudeRoot = join(homedir(), '.claude', 'projects'),
  codexFiles = null,
  claudeFiles = null,
  scanWithoutThreadId = false
} = {}) {
  const nowMs = millisOrNow(generatedAt);
  const normalizedThreadId = nonEmptyString(threadId) ? threadId : null;

  if (normalizedThreadId === null && scanWithoutThreadId !== true) {
    return missingSessionContext({
      generatedAt: new Date(nowMs).toISOString(),
      reason: 'no-active-thread-id'
    });
  }

  const providerContexts = await Promise.all([
    readProviderContext({
      provider: 'codex',
      root: codexRoot,
      files: codexFiles,
      threadId: normalizedThreadId,
      generatedAt: new Date(nowMs).toISOString()
    }),
    readProviderContext({
      provider: 'claude',
      root: claudeRoot,
      files: claudeFiles,
      threadId: normalizedThreadId,
      generatedAt: new Date(nowMs).toISOString()
    })
  ]);
  const readable = providerContexts.filter((context) => context.status === 'readable');
  const latest = latestProviderContext(readable);
  const latestTurnAt = latest?.latestTurnAt ?? null;
  const staleAgeMs = latestTurnAt === null ? null : Math.max(0, nowMs - Date.parse(latestTurnAt));
  const stale = Number.isFinite(staleAgeMs) && staleAgeMs > staleAfterMs;
  const missing = readable.length === 0;

  return {
    contractName: SESSION_CONTEXT_CONTRACT_NAME,
    contractVersion: SESSION_CONTEXT_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    generatedAt: new Date(nowMs).toISOString(),
    threadId: normalizedThreadId,
    sessionSourceSummaries: providerContexts.map(sourceSummary),
    transcriptAvailability: missing ? 'missing' : 'readable',
    exchangeCount: readable.reduce((sum, context) => sum + context.exchangeCount, 0),
    latestToolCall: aggregateLatestToolCall(readable),
    latestTurnState: latest?.latestTurnState ?? missingValue(),
    tokenUsage: aggregateTokenUsage(readable),
    contextUtilization: aggregateContextUtilization(readable),
    staleTranscriptState: {
      stale,
      reason: stale ? 'latest-session-turn-exceeded-stale-threshold' : null,
      thresholdMs: staleAfterMs,
      ageMs: Number.isFinite(staleAgeMs) ? staleAgeMs : null
    },
    missingTranscriptState: {
      missing,
      reason: missing ? 'no-readable-session-transcript' : null
    },
    resultBlockEvidence: aggregateResultBlockEvidence(readable),
    driftMarkers: []
  };
}

export function buildContextAdvisory({
  sessionContext = null,
  sessionSourceInventory = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const nowMs = millisOrNow(generatedAt);
  const effectiveGeneratedAt = new Date(nowMs).toISOString();
  const context = isPlainObject(sessionContext) ? sessionContext : {};
  const inventory = isPlainObject(sessionSourceInventory) ? sessionSourceInventory : null;
  const sessionSourceSummaries = normalizeAdvisorySourceSummaries(context.sessionSourceSummaries);
  const threadId = firstNonEmptyString(
    context.threadId,
    ...sessionSourceSummaries.map((source) => source.threadId)
  );
  const transcriptAvailability = normalizeTranscriptAvailability(context.transcriptAvailability);
  const latestToolCall = normalizeAdvisoryToolCall(context.latestToolCall);
  const latestTurnState = normalizeAdvisoryLatestTurnState(context.latestTurnState);
  const tokenUsage = normalizeAdvisoryTokenUsage(context.tokenUsage);
  const contextUtilization = normalizeAdvisoryContextUtilization(context.contextUtilization);
  const resultBlockEvidence = normalizeAdvisoryResultBlockEvidence(context.resultBlockEvidence);
  const staleTranscriptState = normalizeAdvisoryStaleTranscriptState(context.staleTranscriptState);
  const missingTranscriptState = normalizeAdvisoryMissingTranscriptState(context.missingTranscriptState);
  const degradedReasons = advisoryDegradedReasons({ inventory, staleTranscriptState, missingTranscriptState });
  const blockedFields = advisoryBlockedFields({
    transcriptAvailability,
    tokenUsage,
    contextUtilization
  });

  return {
    contractName: CONTEXT_ADVISORY_CONTRACT_NAME,
    contractVersion: CONTEXT_ADVISORY_CONTRACT_VERSION,
    generatedAt: effectiveGeneratedAt,
    readOnly: true,
    willMutate: false,
    sessionContextRef: advisoryContractRef({
      contract: context,
      fallbackName: SESSION_CONTEXT_CONTRACT_NAME,
      fallbackVersion: SESSION_CONTEXT_CONTRACT_VERSION
    }),
    inventoryRef: advisoryContractRef({
      contract: inventory,
      fallbackName: SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
      fallbackVersion: SESSION_SOURCE_INVENTORY_CONTRACT_VERSION
    }),
    transcriptAvailability,
    exchangeCount: Number.isInteger(context.exchangeCount) ? context.exchangeCount : 'missing',
    latestToolCall,
    latestTurnState,
    tokenUsage,
    contextUtilization,
    contextBand: contextBandFromRatio(contextUtilization.ratio),
    resultBlockEvidence,
    staleTranscriptState,
    missingTranscriptState,
    degradedReasons,
    blockedFields,
    policyInputs: {
      threadId,
      sessionSourceSummaries,
      inventorySourceSummaries: normalizeAdvisoryInventorySources(inventory),
      tokenUsage,
      contextUtilization,
      latestToolCall,
      latestTurnState,
      transcriptAvailability,
      resultBlockEvidence,
      staleTranscriptState: {
        stale: staleTranscriptState.stale,
        reason: staleTranscriptState.reason
      },
      missingTranscriptState: {
        missing: missingTranscriptState.missing,
        reason: missingTranscriptState.reason
      }
    },
    boundaries: { ...SESSION_SOURCE_BOUNDARIES }
  };
}

export async function normalizeSessionContextFromJsonl({
  provider,
  jsonl,
  threadId = null,
  sourceRef = null,
  generatedAt = new Date().toISOString()
}) {
  const entries = parseJsonl(jsonl);
  return normalizeProviderEntries({
    provider,
    entries,
    threadId,
    sourceRef,
    generatedAt
  });
}

export async function buildSessionSourceInventory({
  generatedAt = new Date().toISOString(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
  maxFilesPerProvider = DEFAULT_MAX_FILES_PER_PROVIDER,
  codexRoot = join(homedir(), '.codex', 'sessions'),
  claudeRoot = join(homedir(), '.claude', 'projects'),
  codexRootDisplayPath = '~/.codex/sessions',
  claudeRootDisplayPath = '~/.claude/projects',
  readSessionFile = safeReadFile
} = {}) {
  const nowMs = millisOrNow(generatedAt);
  const effectiveGeneratedAt = new Date(nowMs).toISOString();
  const effectiveMaxFiles = positiveIntegerOrDefault(maxFilesPerProvider, DEFAULT_MAX_FILES_PER_PROVIDER);
  const providers = await Promise.all([
    buildProviderSourceInventory({
      provider: 'codex',
      root: codexRoot,
      rootDisplayPath: codexRootDisplayPath,
      pattern: '~/.codex/sessions/YYYY/MM/DD/*.jsonl',
      generatedAt: effectiveGeneratedAt,
      staleAfterMs,
      maxFiles: effectiveMaxFiles,
      matchesPattern: codexSessionSourcePath,
      readSessionFile
    }),
    buildProviderSourceInventory({
      provider: 'claude',
      root: claudeRoot,
      rootDisplayPath: claudeRootDisplayPath,
      pattern: '~/.claude/projects/**/*.jsonl',
      generatedAt: effectiveGeneratedAt,
      staleAfterMs,
      maxFiles: effectiveMaxFiles,
      matchesPattern: () => true,
      readSessionFile
    })
  ]);

  return {
    contractName: SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
    contractVersion: SESSION_SOURCE_INVENTORY_CONTRACT_VERSION,
    generatedAt: effectiveGeneratedAt,
    readOnly: true,
    willMutate: false,
    scanScope: SESSION_SOURCE_SCAN_SCOPE,
    maxFilesPerProvider: effectiveMaxFiles,
    providers,
    summary: inventorySummary(providers),
    boundaries: { ...SESSION_SOURCE_BOUNDARIES }
  };
}

function advisoryContractRef({ contract, fallbackName, fallbackVersion }) {
  return {
    contractName: nonEmptyString(contract?.contractName) ? contract.contractName : fallbackName,
    contractVersion: Number.isInteger(contract?.contractVersion) ? contract.contractVersion : fallbackVersion,
    generatedAt: nonEmptyString(contract?.generatedAt) ? contract.generatedAt : null,
    readOnly: contract?.readOnly === true,
    threadId: nonEmptyString(contract?.threadId) ? contract.threadId : null
  };
}

function normalizeAdvisorySourceSummaries(sources) {
  return (Array.isArray(sources) ? sources : [])
    .filter(isPlainObject)
    .map((source) => ({
      provider: nonEmptyString(source.provider) ? source.provider : null,
      status: nonEmptyString(source.status) ? source.status : 'unknown',
      threadId: nonEmptyString(source.threadId) ? source.threadId : null,
      latestTurnAt: nonEmptyString(source.latestTurnAt) ? source.latestTurnAt : null
    }));
}

function normalizeAdvisoryInventorySources(inventory) {
  return (Array.isArray(inventory?.providers) ? inventory.providers : [])
    .filter(isPlainObject)
    .map((provider) => ({
      provider: nonEmptyString(provider.provider) ? provider.provider : null,
      state: nonEmptyString(provider.state) ? provider.state : 'unknown',
      sourceSummary: normalizeInventorySourceSummary(provider.sourceSummary)
    }));
}

function normalizeInventorySourceSummary(summary) {
  if (!isPlainObject(summary)) {
    return null;
  }

  return {
    availability: nonEmptyString(summary.availability) ? summary.availability : 'unknown',
    readState: nonEmptyString(summary.readState) ? summary.readState : 'unknown',
    candidateFileCount: Number.isInteger(summary.candidateFileCount) ? summary.candidateFileCount : 'missing',
    scannedFileCount: Number.isInteger(summary.scannedFileCount) ? summary.scannedFileCount : 'missing',
    readableFileCount: Number.isInteger(summary.readableFileCount) ? summary.readableFileCount : 'missing',
    unreadableFileCount: Number.isInteger(summary.unreadableFileCount) ? summary.unreadableFileCount : 'missing',
    latestModifiedAt: nonEmptyString(summary.latestModifiedAt) ? summary.latestModifiedAt : null,
    stale: summary.stale === true,
    latestSessionRef: nonEmptyString(summary.latestSessionRef) ? summary.latestSessionRef : null,
    failureReason: nonEmptyString(summary.failureReason) ? summary.failureReason : null
  };
}

function normalizeTranscriptAvailability(value) {
  return [
    'readable',
    'missing',
    'stale',
    'unreadable',
    'degraded'
  ].includes(value) ? value : 'missing';
}

function normalizeAdvisoryToolCall(toolCall) {
  if (!isPlainObject(toolCall)) {
    return null;
  }

  return {
    name: nonEmptyString(toolCall.name) ? toolCall.name : null,
    status: nonEmptyString(toolCall.status) ? toolCall.status : 'missing',
    updatedAt: nonEmptyString(toolCall.updatedAt) ? toolCall.updatedAt : null
  };
}

function normalizeAdvisoryLatestTurnState(turnState) {
  if (!isPlainObject(turnState)) {
    return missingValue();
  }

  return {
    status: nonEmptyString(turnState.status) ? turnState.status : 'missing',
    role: nonEmptyString(turnState.role) ? turnState.role : 'missing',
    updatedAt: nonEmptyString(turnState.updatedAt) ? turnState.updatedAt : null
  };
}

function normalizeAdvisoryTokenUsage(tokenUsage) {
  if (!isPlainObject(tokenUsage) || tokenUsage.status !== 'available') {
    return missingTokenUsage();
  }

  return {
    status: 'available',
    inputTokens: Number.isFinite(tokenUsage.inputTokens) ? tokenUsage.inputTokens : 'missing',
    outputTokens: Number.isFinite(tokenUsage.outputTokens) ? tokenUsage.outputTokens : 'missing',
    totalTokens: Number.isFinite(tokenUsage.totalTokens) ? tokenUsage.totalTokens : 'missing'
  };
}

function normalizeAdvisoryContextUtilization(contextUtilization) {
  if (!isPlainObject(contextUtilization) || contextUtilization.status !== 'available') {
    return missingContextUtilization();
  }

  return {
    status: 'available',
    usedTokens: Number.isFinite(contextUtilization.usedTokens) ? contextUtilization.usedTokens : 'missing',
    maxTokens: Number.isFinite(contextUtilization.maxTokens) ? contextUtilization.maxTokens : 'missing',
    ratio: Number.isFinite(contextUtilization.ratio) ? contextUtilization.ratio : 'missing'
  };
}

function normalizeAdvisoryResultBlockEvidence(resultBlockEvidence) {
  if (!isPlainObject(resultBlockEvidence)) {
    return { status: 'missing', present: false };
  }

  return {
    status: nonEmptyString(resultBlockEvidence.status) ? resultBlockEvidence.status : 'missing',
    present: resultBlockEvidence.present === true
  };
}

function normalizeAdvisoryStaleTranscriptState(staleTranscriptState) {
  if (!isPlainObject(staleTranscriptState)) {
    return {
      stale: false,
      reason: null,
      thresholdMs: DEFAULT_STALE_AFTER_MS,
      ageMs: null
    };
  }

  return {
    stale: staleTranscriptState.stale === true,
    reason: nonEmptyString(staleTranscriptState.reason) ? staleTranscriptState.reason : null,
    thresholdMs: Number.isFinite(staleTranscriptState.thresholdMs) ? staleTranscriptState.thresholdMs : null,
    ageMs: Number.isFinite(staleTranscriptState.ageMs) ? staleTranscriptState.ageMs : null
  };
}

function normalizeAdvisoryMissingTranscriptState(missingTranscriptState) {
  if (!isPlainObject(missingTranscriptState)) {
    return {
      missing: false,
      reason: null
    };
  }

  return {
    missing: missingTranscriptState.missing === true,
    reason: nonEmptyString(missingTranscriptState.reason) ? missingTranscriptState.reason : null
  };
}

function contextBandFromRatio(ratio) {
  if (!Number.isFinite(ratio)) {
    return 'unknown';
  }

  if (ratio >= 1) {
    return 'over-limit';
  }

  if (ratio >= 0.95) {
    return 'near-limit';
  }

  if (ratio >= 0.8) {
    return 'high';
  }

  if (ratio >= 0.5) {
    return 'moderate';
  }

  return 'low';
}

function advisoryDegradedReasons({ inventory, staleTranscriptState, missingTranscriptState }) {
  const inventoryReasons = (Array.isArray(inventory?.providers) ? inventory.providers : [])
    .filter(isPlainObject)
    .flatMap((provider) => (
      (Array.isArray(provider.degradedReasons) ? provider.degradedReasons : [])
        .filter(nonEmptyString)
        .map((reason) => `${provider.provider ?? 'provider'}:${reason}`)
    ));
  const sessionReasons = [
    staleTranscriptState.stale === true && nonEmptyString(staleTranscriptState.reason)
      ? `session:${staleTranscriptState.reason}`
      : null,
    missingTranscriptState.missing === true && nonEmptyString(missingTranscriptState.reason)
      ? `session:${missingTranscriptState.reason}`
      : null
  ].filter(nonEmptyString);

  return [...new Set([...inventoryReasons, ...sessionReasons])];
}

function advisoryBlockedFields({
  transcriptAvailability,
  tokenUsage,
  contextUtilization
}) {
  return [
    transcriptAvailability === 'missing' ? 'transcriptAvailability' : null,
    tokenUsage.status === 'missing' ? 'tokenUsage' : null,
    tokenUsage.status === 'available' && tokenUsage.totalTokens === 'missing' ? 'tokenUsage.totalTokens' : null,
    contextUtilization.status === 'missing' || contextUtilization.ratio === 'missing'
      ? 'contextUtilization.ratio'
      : null
  ].filter(nonEmptyString);
}

async function buildProviderSourceInventory({
  provider,
  root,
  rootDisplayPath,
  pattern,
  generatedAt,
  staleAfterMs,
  maxFiles,
  matchesPattern,
  readSessionFile
}) {
  const base = {
    provider,
    rootDisplayPath,
    pattern,
    scanScope: SESSION_SOURCE_SCAN_SCOPE,
    maxFiles,
    readOnly: true,
    willMutate: false
  };
  const rootInfo = await safeStatWithReason(root);

  if (rootInfo.status === 'failed') {
    return providerInventoryResult({
      ...base,
      state: 'failed',
      degradedReasons: ['root-stat-failed'],
      failureReason: rootInfo.reason
    });
  }

  if (rootInfo.info === null) {
    return providerInventoryResult({
      ...base,
      state: 'missing',
      degradedReasons: ['source-root-missing']
    });
  }

  if (!rootInfo.info.isDirectory() && !rootInfo.info.isFile()) {
    return providerInventoryResult({
      ...base,
      state: 'failed',
      degradedReasons: ['source-root-not-readable-directory']
    });
  }

  const discovered = await discoverProviderJsonlFiles({
    root,
    maxFiles,
    matchesPattern
  });

  if (discovered.status === 'failed') {
    return providerInventoryResult({
      ...base,
      state: 'failed',
      degradedReasons: ['source-scan-failed'],
      failureReason: discovered.reason
    });
  }

  if (discovered.files.length === 0) {
    return providerInventoryResult({
      ...base,
      state: 'missing',
      candidateFileCount: 0,
      degradedReasons: ['no-candidate-session-files']
    });
  }

  const candidates = await inspectCandidateSessionFiles({
    files: discovered.files,
    readSessionFile
  });
  const latest = candidates
    .filter((candidate) => candidate.stat !== null)
    .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs)
    .at(0) ?? null;
  const latestModifiedAt = latest === null ? null : new Date(latest.stat.mtimeMs).toISOString();
  const staleAgeMs = latest === null ? null : Math.max(0, Date.parse(generatedAt) - latest.stat.mtimeMs);
  const stale = Number.isFinite(staleAgeMs) && staleAgeMs > staleAfterMs;
  const readableFileCount = candidates.filter((candidate) => candidate.readable).length;
  const unreadableCount = candidates.filter((candidate) => candidate.readable === false).length;
  const invalidJsonlCount = candidates.filter((candidate) => candidate.invalidJsonl).length;
  const degradedReasons = [
    discovered.truncated ? 'max-files-per-provider-reached' : null,
    unreadableCount > 0 && readableFileCount > 0 ? 'some-candidate-files-unreadable' : null,
    invalidJsonlCount > 0 ? 'some-candidate-files-have-invalid-jsonl' : null,
    stale ? 'latest-session-file-exceeded-stale-threshold' : null
  ].filter(nonEmptyString);
  const state = providerInventoryState({
    readableFileCount,
    unreadableCount,
    stale,
    degradedReasons
  });

  return providerInventoryResult({
    ...base,
    state,
    readableFileCount,
    candidateFileCount: discovered.candidateFileCount,
    latestModifiedAt,
    latestSessionRef: latest === null ? null : sessionSourceRef({ provider, root, file: latest.file }),
    degradedReasons,
    sourceSummary: {
      availability: state === 'available' ? 'available' : state,
      readState: readableFileCount > 0 ? 'readable' : 'unreadable',
      scanScope: SESSION_SOURCE_SCAN_SCOPE,
      maxFiles,
      candidateFileCount: discovered.candidateFileCount,
      scannedFileCount: discovered.files.length,
      readableFileCount,
      unreadableFileCount: unreadableCount,
      latestModifiedAt,
      stale,
      staleAfterMs,
      latestSessionRef: latest === null ? null : sessionSourceRef({ provider, root, file: latest.file })
    }
  });
}

function providerInventoryResult({
  provider,
  rootDisplayPath,
  pattern,
  state,
  scanScope,
  maxFiles,
  readOnly,
  willMutate,
  readableFileCount = 0,
  candidateFileCount = 0,
  latestModifiedAt = null,
  latestSessionRef = null,
  degradedReasons = [],
  failureReason = null,
  sourceSummary = null
}) {
  return {
    provider,
    rootDisplayPath,
    pattern,
    state,
    readOnly,
    willMutate,
    readableFileCount,
    candidateFileCount,
    latestModifiedAt,
    latestSessionRef,
    degradedReasons,
    sourceSummary: sourceSummary ?? {
      availability: state,
      readState: state === 'missing' ? 'missing' : state,
      scanScope,
      maxFiles,
      candidateFileCount,
      scannedFileCount: candidateFileCount,
      readableFileCount,
      latestModifiedAt,
      latestSessionRef,
      failureReason
    },
    scanScope,
    maxFiles
  };
}

function providerInventoryState({
  readableFileCount,
  unreadableCount,
  stale,
  degradedReasons
}) {
  if (readableFileCount === 0 && unreadableCount > 0) {
    return 'unreadable';
  }

  if (stale) {
    return 'stale';
  }

  if (degradedReasons.length > 0) {
    return 'degraded';
  }

  return 'available';
}

function inventorySummary(providers) {
  const failedCount = providers.filter((provider) => provider.state === 'failed').length;
  const degradedCount = providers.filter((provider) => ['degraded', 'stale', 'unreadable'].includes(provider.state)).length;
  const availableCount = providers.filter((provider) => provider.state === 'available').length;
  const missingCount = providers.filter((provider) => provider.state === 'missing').length;

  return {
    providerCount: providers.length,
    availableProviderCount: availableCount,
    missingProviderCount: missingCount,
    degradedProviderCount: degradedCount,
    failedProviderCount: failedCount,
    state: failedCount > 0
      ? 'failed'
      : degradedCount > 0
        ? 'degraded'
        : availableCount > 0
          ? 'available'
          : 'missing'
  };
}

async function discoverProviderJsonlFiles({
  root,
  maxFiles,
  matchesPattern
}) {
  const files = [];
  const stack = [root];

  while (stack.length > 0 && files.length <= maxFiles) {
    const current = stack.pop();
    const currentInfo = await safeStatWithReason(current);

    if (currentInfo.status === 'failed') {
      return { status: 'failed', reason: currentInfo.reason, files: [], candidateFileCount: 0, truncated: false };
    }

    if (currentInfo.info === null) {
      continue;
    }

    if (currentInfo.info.isFile()) {
      if (current.endsWith('.jsonl') && matchesPattern(root, current)) {
        files.push(current);
      }
      continue;
    }

    if (!currentInfo.info.isDirectory()) {
      continue;
    }

    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      return { status: 'failed', reason: error?.code ?? 'readdir-failed', files: [], candidateFileCount: 0, truncated: false };
    }

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl') && matchesPattern(root, fullPath)) {
        files.push(fullPath);
      }

      if (files.length > maxFiles) {
        break;
      }
    }
  }

  const withStats = [];

  for (const file of files.slice(0, maxFiles + 1)) {
    const info = await safeStat(file);

    if (info !== null) {
      withStats.push({ file, mtimeMs: info.mtimeMs });
    }
  }

  const sorted = withStats
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .map((entry) => entry.file);

  return {
    status: 'ok',
    files: sorted.slice(0, maxFiles),
    candidateFileCount: Math.min(files.length, maxFiles),
    truncated: files.length > maxFiles
  };
}

async function inspectCandidateSessionFiles({ files, readSessionFile }) {
  const inspected = [];

  for (const file of files) {
    const info = await safeStat(file);
    const text = await safeReadSessionFile(readSessionFile, file);

    inspected.push({
      file,
      stat: info,
      readable: text !== null,
      invalidJsonl: text !== null && hasInvalidJsonlLine(text)
    });
  }

  return inspected.sort((left, right) => {
    const leftMs = left.stat?.mtimeMs ?? -1;
    const rightMs = right.stat?.mtimeMs ?? -1;

    return rightMs - leftMs;
  });
}

async function safeReadSessionFile(readSessionFile, file) {
  try {
    return await readSessionFile(file);
  } catch {
    return null;
  }
}

function codexSessionSourcePath(root, file) {
  const parts = relative(root, file).split(sep);

  return parts.length === 4 &&
    /^\d{4}$/u.test(parts[0]) &&
    /^\d{2}$/u.test(parts[1]) &&
    /^\d{2}$/u.test(parts[2]) &&
    parts[3].endsWith('.jsonl');
}

function sessionSourceRef({ provider, root, file }) {
  const rel = relative(root, file)
    .split(sep)
    .filter(nonEmptyString)
    .join('/');

  return `${provider}:${rel === '' ? basename(file) : rel}`;
}

async function readProviderContext({
  provider,
  root,
  files,
  threadId,
  generatedAt
}) {
  const candidates = Array.isArray(files)
    ? files
    : await discoverJsonlFiles(root, DEFAULT_MAX_FILES_PER_PROVIDER);
  const matchingFiles = threadId === null
    ? candidates
    : candidates.filter((file) => basename(file).includes(threadId));
  const filesToRead = matchingFiles.length > 0 ? matchingFiles : candidates;
  const contexts = [];

  for (const file of filesToRead) {
    const text = await safeReadFile(file);

    if (text === null) {
      continue;
    }

    const context = await normalizeSessionContextFromJsonl({
      provider,
      jsonl: text,
      threadId,
      sourceRef: file,
      generatedAt
    });

    if (context.status === 'readable') {
      contexts.push(context);
    }
  }

  return latestProviderContext(contexts) ?? {
    provider,
    status: 'missing',
    threadId,
    sourceRef: null,
    latestTurnAt: null,
    exchangeCount: 0,
    latestToolCall: null,
    latestTurnState: missingValue(),
    tokenUsage: missingTokenUsage(),
    contextUtilization: missingContextUtilization(),
    resultBlockEvidence: { status: 'missing', present: false }
  };
}

function normalizeProviderEntries({
  provider,
  entries,
  threadId,
  sourceRef,
  generatedAt
}) {
  const matchingEntries = entries.filter((entry) => entryMatchesThread(entry, threadId, sourceRef));

  if (matchingEntries.length === 0) {
    return {
      provider,
      status: 'missing',
      threadId,
      sourceRef,
      latestTurnAt: null,
      exchangeCount: 0,
      latestToolCall: null,
      latestTurnState: missingValue(),
      tokenUsage: missingTokenUsage(),
      contextUtilization: missingContextUtilization(),
      resultBlockEvidence: { status: 'missing', present: false }
    };
  }

  const turns = matchingEntries
    .map((entry, index) => normalizeTurn(entry, index))
    .filter((turn) => turn.timestamp !== null || turn.role !== null || turn.toolCalls.length > 0);
  const latestTurn = latestByTimestamp(turns) ?? turns.at(-1) ?? null;

  return {
    provider,
    status: 'readable',
    threadId: threadId ?? firstNonEmptyString(...matchingEntries.map(extractThreadId)),
    sourceRef,
    latestTurnAt: latestTurn?.timestamp ?? generatedAt,
    exchangeCount: turns.filter((turn) => turn.role === 'user' || turn.role === 'assistant').length,
    latestToolCall: latestToolCall(turns),
    latestTurnState: latestTurnState(latestTurn),
    tokenUsage: providerTokenUsage(matchingEntries),
    contextUtilization: providerContextUtilization(matchingEntries),
    resultBlockEvidence: {
      status: hasResultBlock(matchingEntries) ? 'present' : 'missing',
      present: hasResultBlock(matchingEntries)
    }
  };
}

function normalizeTurn(entry, index) {
  const timestamp = firstNonEmptyString(
    entry.timestamp,
    entry.createdAt,
    entry.updatedAt,
    entry.message?.created_at,
    entry.message?.timestamp
  );
  const role = normalizeRole(firstNonEmptyString(
    entry.role,
    entry.message?.role,
    entry.item?.role,
    entry.payload?.role
  ));
  const status = firstNonEmptyString(
    entry.status,
    entry.message?.status,
    entry.item?.status,
    entry.payload?.status
  );

  return {
    index,
    timestamp,
    role,
    status,
    toolCalls: extractToolCalls(entry)
  };
}

function latestToolCall(turns) {
  const calls = turns.flatMap((turn) => (
    turn.toolCalls.map((call) => ({
      ...call,
      updatedAt: call.updatedAt ?? turn.timestamp
    }))
  ));

  return calls.at(-1) ?? null;
}

function latestTurnState(turn) {
  if (!isPlainObject(turn)) {
    return missingValue();
  }

  return {
    status: turn.status ?? 'missing',
    role: turn.role ?? 'missing',
    updatedAt: turn.timestamp ?? null
  };
}

function extractToolCalls(entry) {
  const calls = [];
  const pushCall = (candidate) => {
    if (!isPlainObject(candidate)) {
      return;
    }

    const name = firstNonEmptyString(candidate.name, candidate.toolName, candidate.function?.name);
    const type = firstNonEmptyString(candidate.type, candidate.kind);

    if (name === null || !isToolCallType(type)) {
      return;
    }

    calls.push({
      name,
      status: firstNonEmptyString(candidate.status, candidate.result?.status) ?? 'missing',
      updatedAt: firstNonEmptyString(candidate.timestamp, candidate.updatedAt) ?? null
    });
  };

  for (const candidate of [
    entry,
    entry.item,
    entry.payload,
    entry.message
  ]) {
    pushCall(candidate);
  }

  for (const content of arrayFrom(entry.message?.content)) {
    pushCall(content);
  }

  for (const content of arrayFrom(entry.content)) {
    pushCall(content);
  }

  return calls;
}

function isToolCallType(type) {
  return [
    'tool_call',
    'toolCall',
    'tool_use',
    'function_call',
    'functionCall'
  ].includes(type);
}

function providerTokenUsage(entries) {
  const usages = entries
    .map(extractUsage)
    .filter((usage) => usage.status === 'available');

  if (usages.length === 0) {
    return missingTokenUsage();
  }

  const inputTokens = sumNumeric(usages.map((usage) => usage.inputTokens));
  const outputTokens = sumNumeric(usages.map((usage) => usage.outputTokens));
  const totalTokens = sumAllNumericOrMissing(usages.map((usage) => usage.totalTokens));

  return {
    status: 'available',
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function extractUsage(entry) {
  const usage = firstPlainObject(entry.usage, entry.message?.usage, entry.payload?.usage, entry.response?.usage);

  if (!isPlainObject(usage)) {
    return missingTokenUsage();
  }

  const inputTokens = firstFiniteNumber(
    usage.input_tokens,
    usage.inputTokens,
    usage.prompt_tokens,
    usage.promptTokens
  );
  const outputTokens = firstFiniteNumber(
    usage.output_tokens,
    usage.outputTokens,
    usage.completion_tokens,
    usage.completionTokens
  );
  const totalTokens = firstFiniteNumber(
    usage.total_tokens,
    usage.totalTokens
  );

  if (inputTokens === null && outputTokens === null && totalTokens === null) {
    return missingTokenUsage();
  }

  return {
    status: 'available',
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function providerContextUtilization(entries) {
  const explicit = entries
    .map(extractContextUtilization)
    .filter((context) => context.status === 'available')
    .at(-1);

  if (explicit !== undefined) {
    return explicit;
  }

  return missingContextUtilization();
}

function extractContextUtilization(entry) {
  const context = firstPlainObject(
    entry.context,
    entry.contextUsage,
    entry.context_usage,
    entry.message?.context,
    entry.message?.contextUsage,
    entry.payload?.context,
    entry.payload?.contextUsage
  );

  if (!isPlainObject(context)) {
    return missingContextUtilization();
  }

  const usedTokens = firstFiniteNumber(context.used_tokens, context.usedTokens, context.tokens_used, context.tokensUsed);
  const maxTokens = firstFiniteNumber(context.max_tokens, context.maxTokens, context.context_window, context.contextWindow);
  const ratio = firstFiniteNumber(context.ratio, context.utilization, context.context_utilization);

  if (usedTokens === null && maxTokens === null && ratio === null) {
    return missingContextUtilization();
  }

  return {
    status: 'available',
    usedTokens,
    maxTokens,
    ratio: ratio ?? 'missing'
  };
}

function aggregateTokenUsage(contexts) {
  const available = contexts
    .map((context) => context.tokenUsage)
    .filter((usage) => usage?.status === 'available');

  if (available.length === 0) {
    return missingTokenUsage();
  }

  const inputTokens = sumNumeric(available.map((usage) => usage.inputTokens));
  const outputTokens = sumNumeric(available.map((usage) => usage.outputTokens));
  const totalTokens = sumAllNumericOrMissing(available.map((usage) => usage.totalTokens));

  return {
    status: 'available',
    inputTokens,
    outputTokens,
    totalTokens
  };
}

function aggregateLatestToolCall(contexts) {
  return contexts
    .map((context) => context.latestToolCall)
    .filter(isPlainObject)
    .sort((left, right) => {
      const leftMs = Date.parse(left.updatedAt ?? '');
      const rightMs = Date.parse(right.updatedAt ?? '');

      return (Number.isFinite(rightMs) ? rightMs : -1) - (Number.isFinite(leftMs) ? leftMs : -1);
    })
    .at(0) ?? null;
}

function aggregateContextUtilization(contexts) {
  return contexts
    .map((context) => context.contextUtilization)
    .filter((context) => context?.status === 'available')
    .at(-1) ?? missingContextUtilization();
}

function aggregateResultBlockEvidence(contexts) {
  return {
    status: contexts.some((context) => context.resultBlockEvidence?.present === true) ? 'present' : 'missing',
    present: contexts.some((context) => context.resultBlockEvidence?.present === true)
  };
}

function sourceSummary(context) {
  return {
    provider: context.provider,
    status: context.status,
    threadId: context.threadId ?? null,
    latestTurnAt: context.latestTurnAt ?? null
  };
}

async function discoverJsonlFiles(root, maxFiles) {
  const files = await walkJsonl(root);
  const withStats = [];

  for (const file of files) {
    const info = await safeStat(file);

    if (info !== null) {
      withStats.push({ file, mtimeMs: info.mtimeMs });
    }
  }

  return withStats
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, maxFiles)
    .map((entry) => entry.file);
}

async function walkJsonl(root) {
  const rootStat = await safeStat(root);

  if (rootStat === null) {
    return [];
  }

  if (rootStat.isFile()) {
    return root.endsWith('.jsonl') ? [root] : [];
  }

  if (!rootStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      return walkJsonl(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.jsonl') ? [fullPath] : [];
  }));

  return nested.flat();
}

function parseJsonl(jsonl) {
  return String(jsonl)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(isPlainObject);
}

function entryMatchesThread(entry, threadId, sourceRef) {
  if (threadId === null) {
    return true;
  }

  return [
    extractThreadId(entry),
    entry.session_id,
    entry.conversation_id,
    entry.parentUuid,
    entry.cwd,
    sourceRef === null ? null : basename(sourceRef)
  ].some((value) => value === threadId || (typeof value === 'string' && value.includes(threadId)));
}

function extractThreadId(entry) {
  return firstNonEmptyString(
    entry.threadId,
    entry.thread_id,
    entry.sessionId,
    entry.session_id,
    entry.conversationId,
    entry.conversation_id,
    entry.id
  );
}

function hasResultBlock(entries) {
  return entries.some((entry) => objectContainsResultBlock(entry));
}

function objectContainsResultBlock(value) {
  if (typeof value === 'string') {
    return value.includes('RESULT_BLOCK_START') && value.includes('RESULT_BLOCK_END');
  }

  if (Array.isArray(value)) {
    return value.some(objectContainsResultBlock);
  }

  if (isPlainObject(value)) {
    return Object.values(value).some(objectContainsResultBlock);
  }

  return false;
}

async function safeReadFile(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function safeStat(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

async function safeStatWithReason(path) {
  try {
    return {
      status: 'ok',
      info: await stat(path),
      reason: null
    };
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return {
        status: 'ok',
        info: null,
        reason: error.code
      };
    }

    return {
      status: 'failed',
      info: null,
      reason: error?.code ?? 'stat-failed'
    };
  }
}

function latestProviderContext(contexts) {
  return latestByTimestamp(contexts, (context) => context.latestTurnAt);
}

function latestByTimestamp(values, accessor = (value) => value.timestamp) {
  return values
    .filter(isPlainObject)
    .sort((left, right) => {
      const leftMs = Date.parse(accessor(left) ?? '');
      const rightMs = Date.parse(accessor(right) ?? '');

      return (Number.isFinite(rightMs) ? rightMs : -1) - (Number.isFinite(leftMs) ? leftMs : -1);
    })
    .at(0) ?? null;
}

function missingSessionContext({ generatedAt, reason }) {
  return {
    contractName: SESSION_CONTEXT_CONTRACT_NAME,
    contractVersion: SESSION_CONTEXT_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    generatedAt,
    sessionSourceSummaries: [],
    transcriptAvailability: 'missing',
    exchangeCount: 0,
    latestToolCall: null,
    latestTurnState: missingValue(),
    tokenUsage: missingTokenUsage(),
    contextUtilization: missingContextUtilization(),
    staleTranscriptState: {
      stale: false,
      reason: null,
      thresholdMs: DEFAULT_STALE_AFTER_MS,
      ageMs: null
    },
    missingTranscriptState: {
      missing: true,
      reason
    },
    resultBlockEvidence: { status: 'missing', present: false },
    driftMarkers: []
  };
}

function missingTokenUsage() {
  return {
    status: 'missing',
    inputTokens: 'missing',
    outputTokens: 'missing',
    totalTokens: 'missing'
  };
}

function missingContextUtilization() {
  return {
    status: 'missing',
    usedTokens: 'missing',
    maxTokens: 'missing',
    ratio: 'missing'
  };
}

function missingValue() {
  return {
    status: 'missing'
  };
}

function normalizeRole(role) {
  return ['user', 'assistant', 'tool', 'system'].includes(role) ? role : null;
}

function millisOrNow(value) {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function positiveIntegerOrDefault(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function hasInvalidJsonlLine(jsonl) {
  return String(jsonl)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .some((line) => {
      try {
        JSON.parse(line);
        return false;
      } catch {
        return true;
      }
    });
}

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function firstPlainObject(...values) {
  return values.find(isPlainObject) ?? null;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function sumNumeric(values) {
  const numeric = values.filter(Number.isFinite);

  if (numeric.length === 0) {
    return null;
  }

  return numeric.reduce((sum, value) => sum + value, 0);
}

function sumAllNumericOrMissing(values) {
  return values.every(Number.isFinite) ? sumNumeric(values) : 'missing';
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
