import { lstat, open, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';

import {
  SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION,
  assertSafeArtifactPreviewContract
} from '../../safe-artifact-preview.js';
import { isMissingFileError } from '../errors.js';

const MAX_ARTIFACT_PREVIEW_BYTES = 200 * 1024;
const SAFE_ARTIFACT_TRUNCATION_REASON = 'size-exceeds-max-preview-bytes';
export const BLOCKED_ARTIFACT_PREVIEW_STATUS = 'blocked-artifact-path';
const BLOCKED_ARTIFACT_PREVIEW_MESSAGE = 'artifact path is outside the safe preview boundary';
const BLOCKED_ARTIFACT_PREVIEW_BASENAMES = Object.freeze([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
]);
const BLOCKED_ARTIFACT_PREVIEW_SEGMENTS = Object.freeze([
  'docs',
  'src'
]);
const SAFE_PREVIEW_TEXT_MIME_TYPES = Object.freeze([
  'application/json',
  'text/csv',
  'text/markdown',
  'text/plain',
  'text/x-diff',
  'text/x-patch'
]);
const SAFE_PREVIEW_ARTIFACT_KIND_BY_REGISTERED_KIND = Object.freeze({
  context: 'project-context',
  summary: 'intake-summary',
  evidence: 'evidence',
  harness: 'evidence',
  'task-packet': 'evidence',
  proof: 'evidence',
  'scaffold-plan': 'patch-plan',
  'scaffold-manifest': 'evidence',
  'execution-plan': 'patch-plan',
  'adoption-plan': 'patch-plan',
  'adoption-patch': 'patch-plan',
  'adoption-journal': 'evidence',
  'workspace-manifest': 'evidence',
  'stage-charter': 'patch-plan',
  'stage-charter-html': 'evidence',
  'stage-gate-event': 'evidence',
  'charter-repair-plan': 'patch-plan',
  'blocked-snapshot': 'evidence'
});
const ARTIFACT_DISPLAY_TITLES = Object.freeze({
  context: 'Project context artifact',
  summary: 'Intake summary artifact',
  evidence: 'Evidence artifact',
  harness: 'Harness output artifact',
  'task-packet': 'Task packet artifact',
  proof: 'Proof artifact',
  'scaffold-plan': 'Scaffold plan artifact',
  'scaffold-manifest': 'Scaffold manifest artifact',
  'execution-plan': 'Execution plan artifact',
  'adoption-plan': 'Adoption plan artifact',
  'adoption-patch': 'Adoption patch artifact',
  'adoption-journal': 'Adoption journal artifact',
  'workspace-manifest': 'Workspace manifest artifact',
  'stage-charter': 'Stage charter artifact',
  'stage-charter-html': 'Stage charter HTML artifact',
  'stage-gate-event': 'Stage gate event artifact',
  'charter-repair-plan': 'Charter repair plan artifact',
  'blocked-snapshot': 'Blocked snapshot artifact'
});

export async function buildSafeArtifactPreview({ runId, artifactRef, stateDir }) {
  let metadata;

  if (await isBlockedArtifactPreviewTarget(artifactRef.path, { stateDir })) {
    return assertSafeArtifactPreviewContract({
      ...safeArtifactPreviewBase({ runId, artifactRef }),
      mime: detectArtifactMime(artifactRef.path),
      sizeBytes: 0,
      previewAvailable: false,
      safeToRenderInline: false,
      truncated: false,
      truncationReason: null,
      status: BLOCKED_ARTIFACT_PREVIEW_STATUS,
      message: BLOCKED_ARTIFACT_PREVIEW_MESSAGE
    });
  }

  try {
    metadata = await stat(artifactRef.path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return assertSafeArtifactPreviewContract({
        ...safeArtifactPreviewBase({ runId, artifactRef }),
        mime: detectArtifactMime(artifactRef.path),
        sizeBytes: 0,
        previewAvailable: false,
        safeToRenderInline: false,
        truncated: false,
        truncationReason: null,
        status: 'missing-artifact',
        message: 'artifact file is missing'
      });
    }

    throw error;
  }

  const mime = metadata.isDirectory() ? 'application/x-directory' : detectArtifactMime(artifactRef.path);
  const safeToRenderInline = !metadata.isDirectory()
    && metadata.isFile()
    && metadata.size > 0
    && isSafePreviewTextMime(mime);
  const truncated = metadata.size > MAX_ARTIFACT_PREVIEW_BYTES;
  const base = {
    ...safeArtifactPreviewBase({ runId, artifactRef }),
    mime,
    sizeBytes: metadata.size,
    previewAvailable: safeToRenderInline,
    safeToRenderInline,
    truncated,
    truncationReason: truncated ? SAFE_ARTIFACT_TRUNCATION_REASON : null
  };

  if (!safeToRenderInline) {
    return assertSafeArtifactPreviewContract(base);
  }

  const contentText = await readBoundedArtifactText(artifactRef.path, metadata.size);

  return assertSafeArtifactPreviewContract({
    ...base,
    contentText
  });
}

export function buildLegacyConsoleArtifactPreview({ artifactRef, preview }) {
  const content = preview.contentText ?? preview.previewText;
  const type = preview.status === 'missing-artifact'
    ? 'missing'
    : preview.mime === 'application/x-directory'
      ? 'directory'
      : 'file';
  const legacyContentPreview = buildLegacyContentPreview({
    preview,
    content
  });

  return stripUndefined({
    ...artifactRef,
    type,
    status: preview.status,
    message: preview.message,
    ref: preview.ref,
    uri: preview.uri,
    mime: preview.mime,
    title: preview.displayTitle,
    displayTitle: preview.displayTitle,
    artifactKind: preview.artifactKind,
    sourceRunId: preview.sourceRunId,
    size: type === 'file' ? preview.sizeBytes : undefined,
    sizeBytes: preview.sizeBytes,
    previewAvailable: preview.previewAvailable,
    safeToRenderInline: preview.safeToRenderInline,
    truncated: preview.truncated,
    truncationReason: preview.truncationReason,
    previewLimitBytes: type === 'file' ? preview.maxPreviewBytes : undefined,
    maxPreviewBytes: preview.maxPreviewBytes,
    downloadAvailable: preview.downloadAvailable,
    ...legacyContentPreview,
    safePreview: preview
  });
}

export async function buildArtifactStatus(run) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  if (artifactRefs.length === 0) {
    return {
      status: 'empty',
      total: 0,
      available: 0,
      missing: 0,
      unknown: 0,
      missingKinds: []
    };
  }

  const refs = await Promise.all(artifactRefs.map(async (artifact) => {
    try {
      await stat(artifact.path);

      return {
        ...artifact,
        status: 'available'
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return {
          ...artifact,
          status: 'missing'
        };
      }

      return {
        ...artifact,
        status: 'unknown',
        message: error.message
      };
    }
  }));
  const missingRefs = refs.filter((artifact) => artifact.status === 'missing');
  const unknownRefs = refs.filter((artifact) => artifact.status === 'unknown');

  return stripUndefined({
    status: missingRefs.length > 0 ? 'missing' : unknownRefs.length > 0 ? 'unknown' : 'ok',
    total: refs.length,
    available: refs.filter((artifact) => artifact.status === 'available').length,
    missing: missingRefs.length,
    unknown: unknownRefs.length,
    missingKinds: missingRefs.map((artifact) => artifact.kind),
    missingRefs
  });
}

export async function buildSafeArtifactPreviewRefs(run, { stateDir = '.symphony' } = {}) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  return await Promise.all(artifactRefs.map(async (artifactRef) => {
    const descriptor = await buildSafeArtifactPreviewDescriptor({
      runId: run.runId,
      artifactRef,
      stateDir
    });

    return stripUndefined({
      ...artifactRef,
      ...descriptor
    });
  }));
}

async function readBoundedArtifactText(path, size) {
  const length = Math.min(size, MAX_ARTIFACT_PREVIEW_BYTES);
  const handle = await open(path, 'r');

  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);

    return buffer.toString('utf8', 0, bytesRead);
  } finally {
    await handle.close();
  }
}

function buildLegacyContentPreview({ preview, content }) {
  if (!preview.safeToRenderInline || content === undefined) {
    return {
      format: 'not-previewable'
    };
  }

  const jsonPreview = parseJsonPreviewWithError(content);
  const json = jsonPreview.value;
  const looksJson = isJsonPreviewContent({ preview, content });
  const malformedJson = !preview.truncated && json === null && looksJson;
  const truncatedJson = preview.truncated && json === null && looksJson;

  return stripUndefined({
    format: malformedJson ? 'malformed-json' : truncatedJson ? 'truncated-json' : json === null ? 'text' : 'json',
    content,
    ...(malformedJson ? { parseError: jsonPreview.error ?? 'invalid JSON artifact preview' } : {}),
    ...(preview.truncated ? { message: `preview truncated to ${preview.maxPreviewBytes} bytes` } : {}),
    ...(json === null ? {} : { json })
  });
}

function isJsonPreviewContent({ preview, content }) {
  const mediaType = String(preview.mime).split(';')[0].trim().toLowerCase();
  const trimmed = content.trimStart();

  return mediaType === 'application/json' || trimmed.startsWith('{') || trimmed.startsWith('[');
}

function safeArtifactPreviewBase({ runId, artifactRef }) {
  return {
    contractName: SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
    contractVersion: SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION,
    ref: buildSafeArtifactRef({ runId, artifactKind: artifactRef.kind }),
    uri: buildSafeArtifactPreviewUri({ runId, artifactKind: artifactRef.kind }),
    displayTitle: ARTIFACT_DISPLAY_TITLES[artifactRef.kind] ?? `${artifactRef.kind} artifact`,
    artifactKind: SAFE_PREVIEW_ARTIFACT_KIND_BY_REGISTERED_KIND[artifactRef.kind] ?? 'evidence',
    sourceRunId: runId,
    maxPreviewBytes: MAX_ARTIFACT_PREVIEW_BYTES,
    downloadAvailable: false,
    registeredKind: artifactRef.kind
  };
}

function buildSafeArtifactRef({ runId, artifactKind }) {
  return `artifact:${safeOpaqueRefToken(runId)}:${safeOpaqueRefToken(artifactKind)}`;
}

function safeOpaqueRefToken(value) {
  const token = String(value ?? 'unknown');

  if (/^[A-Za-z0-9._:-]+$/u.test(token) && !token.includes('..') && !token.includes('\\') && !token.includes('/')) {
    return token;
  }

  return `b64.${Buffer.from(token, 'utf8').toString('base64url')}`;
}

function buildSafeArtifactPreviewUri({ runId, artifactKind }) {
  return `/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactKind)}/preview`;
}

function detectArtifactMime(path) {
  switch (extname(path).toLowerCase()) {
    case '.json':
      return 'application/json';
    case '.txt':
    case '.log':
      return 'text/plain; charset=utf-8';
    case '.md':
    case '.markdown':
      return 'text/markdown; charset=utf-8';
    case '.csv':
      return 'text/csv; charset=utf-8';
    case '.diff':
      return 'text/x-diff; charset=utf-8';
    case '.patch':
      return 'text/x-patch; charset=utf-8';
    case '.html':
    case '.htm':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'application/javascript';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

function isSafePreviewTextMime(mime) {
  const mediaType = String(mime).split(';')[0].trim().toLowerCase();

  return SAFE_PREVIEW_TEXT_MIME_TYPES.includes(mediaType);
}

async function isBlockedArtifactPreviewTarget(path, { stateDir }) {
  if (
    isBlockedArtifactPreviewPath(path) ||
    !isAllowedArtifactPreviewPath(path, { stateDir })
  ) {
    return true;
  }

  let metadata;

  try {
    metadata = await lstat(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }

  if (metadata.isSymbolicLink()) {
    return true;
  }

  if (metadata.isFile() && metadata.nlink > 1) {
    return true;
  }

  const resolvedPath = await realpath(path);

  return isBlockedArtifactPreviewPath(resolvedPath) ||
    !isPathInsideArtifactPreviewRoots(resolvedPath, await allowedArtifactPreviewRealRoots({ stateDir }));
}

async function buildSafeArtifactPreviewDescriptor({ runId, artifactRef, stateDir }) {
  let metadata;

  if (await isBlockedArtifactPreviewTarget(artifactRef.path, { stateDir })) {
    return {
      ...safeArtifactPreviewBase({ runId, artifactRef }),
      mime: detectArtifactMime(artifactRef.path),
      sizeBytes: 0,
      previewAvailable: false,
      safeToRenderInline: false,
      truncated: false,
      truncationReason: null,
      previewStatus: BLOCKED_ARTIFACT_PREVIEW_STATUS,
      previewMessage: BLOCKED_ARTIFACT_PREVIEW_MESSAGE
    };
  }

  try {
    metadata = await stat(artifactRef.path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        ...safeArtifactPreviewBase({ runId, artifactRef }),
        mime: detectArtifactMime(artifactRef.path),
        sizeBytes: 0,
        previewAvailable: false,
        safeToRenderInline: false,
        truncated: false,
        truncationReason: null
      };
    }

    return {
      ...safeArtifactPreviewBase({ runId, artifactRef }),
      mime: detectArtifactMime(artifactRef.path),
      sizeBytes: 0,
      previewAvailable: false,
      safeToRenderInline: false,
      truncated: false,
      truncationReason: null,
      previewStatus: 'unknown',
      previewMessage: error.message
    };
  }

  const mime = metadata.isDirectory() ? 'application/x-directory' : detectArtifactMime(artifactRef.path);
  const previewAvailable = metadata.isFile() && metadata.size > 0 && isSafePreviewTextMime(mime);
  const truncated = metadata.size > MAX_ARTIFACT_PREVIEW_BYTES;

  return {
    ...safeArtifactPreviewBase({ runId, artifactRef }),
    mime,
    sizeBytes: metadata.size,
    previewAvailable,
    safeToRenderInline: previewAvailable,
    truncated,
    truncationReason: truncated ? SAFE_ARTIFACT_TRUNCATION_REASON : null
  };
}

function isAllowedArtifactPreviewPath(path, { stateDir }) {
  return isPathInsideArtifactPreviewRoots(resolve(path), allowedArtifactPreviewRoots({ stateDir }));
}

function isPathInsideArtifactPreviewRoots(path, roots) {
  return roots.some((root) => path === root || path.startsWith(`${root}${sep}`));
}

function allowedArtifactPreviewRoots({ stateDir }) {
  const stateRoot = resolve(stateDir);
  const stateParent = dirname(stateRoot);

  return [
    stateRoot,
    resolve(stateParent, 'artifacts')
  ];
}

async function allowedArtifactPreviewRealRoots({ stateDir }) {
  return await Promise.all(allowedArtifactPreviewRoots({ stateDir }).map(async (root) => {
    try {
      return await realpath(root);
    } catch (error) {
      if (isMissingFileError(error)) {
        return root;
      }

      throw error;
    }
  }));
}

function isBlockedArtifactPreviewPath(path) {
  const parts = String(path ?? '')
    .replaceAll('\\', '/')
    .split('/')
    .filter((part) => part !== '')
    .map((part) => part.toLowerCase());
  const basename = parts.at(-1) ?? '';

  return BLOCKED_ARTIFACT_PREVIEW_BASENAMES.includes(basename) ||
    parts.some((part) => BLOCKED_ARTIFACT_PREVIEW_SEGMENTS.includes(part));
}

function parseJsonPreviewWithError(content) {
  try {
    return {
      value: JSON.parse(content)
    };
  } catch (error) {
    return {
      value: null,
      error: error.message
    };
  }
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}
