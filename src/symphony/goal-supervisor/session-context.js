import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

export const SESSION_CONTEXT_CONTRACT_NAME = 'sessionContext.v1';
export const SESSION_CONTEXT_CONTRACT_VERSION = 1;

const DEFAULT_STALE_AFTER_MS = 30 * 60 * 1000;
const DEFAULT_MAX_FILES_PER_PROVIDER = 200;

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
  const totalTokens = sumNumeric(usages.map((usage) => usage.totalTokens));

  return {
    status: 'available',
    inputTokens,
    outputTokens,
    totalTokens: totalTokens ?? sumNumeric([inputTokens, outputTokens])
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
    usage.totalTokens,
    inputTokens === null || outputTokens === null ? null : inputTokens + outputTokens
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
  const normalizedRatio = ratio ?? (
    usedTokens === null || maxTokens === null || maxTokens === 0
      ? null
      : usedTokens / maxTokens
  );

  if (usedTokens === null && maxTokens === null && normalizedRatio === null) {
    return missingContextUtilization();
  }

  return {
    status: 'available',
    usedTokens,
    maxTokens,
    ratio: normalizedRatio
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
  const totalTokens = sumNumeric(available.map((usage) => usage.totalTokens));

  return {
    status: 'available',
    inputTokens,
    outputTokens,
    totalTokens: totalTokens ?? sumNumeric([inputTokens, outputTokens])
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
