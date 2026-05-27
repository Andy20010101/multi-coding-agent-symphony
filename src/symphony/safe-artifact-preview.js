export const SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME = 'safe-artifact-preview.v1';
export const SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION = '1';

export const SAFE_ARTIFACT_PREVIEW_ARTIFACT_KINDS = Object.freeze([
  'project-context',
  'intake-summary',
  'patch-plan',
  'evidence',
  'handoff-contract'
]);

export const SAFE_ARTIFACT_PREVIEW_REQUIRED_FIELDS = Object.freeze([
  'contractName',
  'contractVersion',
  'ref',
  'uri',
  'mime',
  'displayTitle',
  'artifactKind',
  'sourceRunId',
  'sizeBytes',
  'previewAvailable',
  'safeToRenderInline',
  'truncated',
  'truncationReason',
  'maxPreviewBytes',
  'downloadAvailable'
]);

const CONTROLLED_URI_PREFIXES = Object.freeze([
  '/api/',
  'symphony-preview:'
]);

export function validateSafeArtifactPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return {
      ok: false,
      errors: ['preview must be a plain object']
    };
  }

  for (const field of SAFE_ARTIFACT_PREVIEW_REQUIRED_FIELDS) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExactString(errors, preview.contractName, 'contractName', SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME);
  requireExactString(errors, preview.contractVersion, 'contractVersion', SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION);
  validateStableRef(errors, preview.ref);
  validateControlledUri(errors, preview.uri);
  requireNonEmptyString(errors, preview.mime, 'mime');
  requireNonEmptyString(errors, preview.displayTitle, 'displayTitle');
  requireKnownArtifactKind(errors, preview.artifactKind);
  requireNonEmptyString(errors, preview.sourceRunId, 'sourceRunId');
  requireNonNegativeInteger(errors, preview.sizeBytes, 'sizeBytes');
  requireBoolean(errors, preview.previewAvailable, 'previewAvailable');
  requireBoolean(errors, preview.safeToRenderInline, 'safeToRenderInline');
  requireBoolean(errors, preview.truncated, 'truncated');
  requirePositiveInteger(errors, preview.maxPreviewBytes, 'maxPreviewBytes');

  if (preview.downloadAvailable !== false) {
    errors.push('downloadAvailable must be false');
  }

  validatePreviewText(errors, preview);
  validateTruncation(errors, preview);
  validateInlineSafety(errors, preview);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertSafeArtifactPreviewContract(preview) {
  const result = validateSafeArtifactPreviewContract(preview);

  if (!result.ok) {
    throw new Error(`Invalid safe artifact preview contract: ${result.errors.join('; ')}`);
  }

  return preview;
}

function validatePreviewText(errors, preview) {
  const hasPreviewText = Object.hasOwn(preview, 'previewText');
  const hasContentText = Object.hasOwn(preview, 'contentText');

  if (hasPreviewText && hasContentText) {
    errors.push('previewText and contentText are mutually exclusive');
  }

  if (hasPreviewText) {
    requireNonEmptyString(errors, preview.previewText, 'previewText');
  }

  if (hasContentText) {
    requireNonEmptyString(errors, preview.contentText, 'contentText');
  }

  if (preview.previewAvailable === true && preview.safeToRenderInline === true && !hasPreviewText && !hasContentText) {
    errors.push('previewText or contentText is required when previewAvailable and safeToRenderInline are true');
  }

  if ((preview.previewAvailable !== true || preview.safeToRenderInline !== true) && (hasPreviewText || hasContentText)) {
    errors.push('previewText/contentText must be absent unless previewAvailable and safeToRenderInline are true');
  }
}

function validateTruncation(errors, preview) {
  if (preview.truncated === false && Number.isInteger(preview.sizeBytes) && Number.isInteger(preview.maxPreviewBytes) && preview.sizeBytes > preview.maxPreviewBytes) {
    errors.push('previews larger than maxPreviewBytes must be truncated');
  }

  if (preview.truncated === true) {
    requireNonEmptyString(errors, preview.truncationReason, 'truncationReason');

    if (Number.isInteger(preview.sizeBytes) && Number.isInteger(preview.maxPreviewBytes) && preview.sizeBytes <= preview.maxPreviewBytes) {
      errors.push('truncated previews must have sizeBytes greater than maxPreviewBytes');
    }

    return;
  }

  if (preview.truncated === false && preview.truncationReason !== null) {
    errors.push('truncationReason must be null when truncated is false');
  }
}

function validateInlineSafety(errors, preview) {
  if (preview.safeToRenderInline === true && preview.previewAvailable !== true) {
    errors.push('safeToRenderInline true requires previewAvailable true');
  }

  if (preview.safeToRenderInline === true && !isInlineTextMime(preview.mime)) {
    errors.push('safeToRenderInline true requires a text or JSON MIME');
  }
}

function validateStableRef(errors, ref) {
  requireNonEmptyString(errors, ref, 'ref');

  if (typeof ref !== 'string') {
    return;
  }

  if (!/^[A-Za-z0-9._:-]+$/u.test(ref)) {
    errors.push('ref must be an opaque registered artifact ref, not a path');
  }

  if (ref.includes('..') || ref.startsWith('/') || ref.includes('\\')) {
    errors.push('ref must not contain traversal or filesystem path syntax');
  }
}

function validateControlledUri(errors, uri) {
  requireNonEmptyString(errors, uri, 'uri');

  if (typeof uri !== 'string') {
    return;
  }

  if (!CONTROLLED_URI_PREFIXES.some((prefix) => uri.startsWith(prefix))) {
    errors.push('uri must use a controlled API path or internal preview URI');
  }

  if (uri.includes('..') || uri.includes('\\') || /^file:/iu.test(uri)) {
    errors.push('uri must not contain traversal or filesystem path syntax');
  }
}

function requireKnownArtifactKind(errors, value) {
  requireNonEmptyString(errors, value, 'artifactKind');

  if (typeof value === 'string' && !SAFE_ARTIFACT_PREVIEW_ARTIFACT_KINDS.includes(value)) {
    errors.push(`artifactKind must be one of ${SAFE_ARTIFACT_PREVIEW_ARTIFACT_KINDS.join(', ')}`);
  }
}

function requireExactString(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${expected}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireNonNegativeInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function requirePositiveInteger(errors, value, path) {
  if (!Number.isInteger(value) || value <= 0) {
    errors.push(`${path} must be a positive integer`);
  }
}

function isInlineTextMime(mime) {
  return typeof mime === 'string' && (
    /^text\//iu.test(mime) ||
    /^application\/json\b/iu.test(mime)
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
