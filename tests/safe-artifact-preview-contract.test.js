import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SAFE_ARTIFACT_PREVIEW_ARTIFACT_KINDS,
  SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION,
  SAFE_ARTIFACT_PREVIEW_REQUIRED_FIELDS,
  assertSafeArtifactPreviewContract,
  validateSafeArtifactPreviewContract
} from '../src/symphony/safe-artifact-preview.js';

const VALID_FIXTURE_FILES = Object.freeze({
  safeText: '../fixtures/contracts/safe-artifact-preview.safe-text.v1.json',
  unsafeBinary: '../fixtures/contracts/safe-artifact-preview.unsafe-binary.v1.json',
  unknownMime: '../fixtures/contracts/safe-artifact-preview.unknown-mime.v1.json',
  oversizeTruncated: '../fixtures/contracts/safe-artifact-preview.oversize-truncated.v1.json'
});

const INVALID_MISSING_SAFETY_FIELDS_FIXTURE =
  '../fixtures/contracts/safe-artifact-preview.missing-safety-fields.invalid.v1.json';

describe('v16 safe artifact preview contract fixtures', () => {
  it('validates safe-artifact-preview.v1 valid fixtures', async () => {
    const fixtures = await loadValidFixtures();

    for (const [fixtureName, preview] of Object.entries(fixtures)) {
      assert.deepEqual(validateSafeArtifactPreviewContract(preview), {
        ok: true,
        errors: []
      }, fixtureName);
      assert.equal(assertSafeArtifactPreviewContract(preview), preview);
      assert.equal(preview.contractName, SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME);
      assert.equal(preview.contractVersion, SAFE_ARTIFACT_PREVIEW_CONTRACT_VERSION);

      for (const field of SAFE_ARTIFACT_PREVIEW_REQUIRED_FIELDS) {
        assert.equal(Object.hasOwn(preview, field), true, `${fixtureName} missing ${field}`);
      }
    }
  });

  it('freezes safe text, unsafe binary, unknown MIME, and oversize/truncated semantics', async () => {
    const {
      safeText,
      unsafeBinary,
      unknownMime,
      oversizeTruncated
    } = await loadValidFixtures();

    assert.deepEqual(SAFE_ARTIFACT_PREVIEW_ARTIFACT_KINDS, [
      'project-context',
      'intake-summary',
      'patch-plan',
      'evidence',
      'handoff-contract'
    ]);

    assert.equal(safeText.previewAvailable, true);
    assert.equal(safeText.safeToRenderInline, true);
    assert.equal(safeText.truncated, false);
    assert.equal(safeText.truncationReason, null);
    assert.equal(Object.hasOwn(safeText, 'previewText'), true);
    assert.equal(Object.hasOwn(safeText, 'contentText'), false);
    assert.equal(safeText.downloadAvailable, false);

    assert.equal(unsafeBinary.mime, 'application/octet-stream');
    assert.equal(unsafeBinary.previewAvailable, false);
    assert.equal(unsafeBinary.safeToRenderInline, false);
    assert.equal(Object.hasOwn(unsafeBinary, 'previewText'), false);
    assert.equal(Object.hasOwn(unsafeBinary, 'contentText'), false);

    assert.equal(unknownMime.mime, 'application/x-unknown');
    assert.equal(unknownMime.previewAvailable, false);
    assert.equal(unknownMime.safeToRenderInline, false);

    assert.equal(oversizeTruncated.previewAvailable, true);
    assert.equal(oversizeTruncated.safeToRenderInline, true);
    assert.equal(oversizeTruncated.truncated, true);
    assert.equal(oversizeTruncated.truncationReason, 'size-exceeds-max-preview-bytes');
    assert.equal(oversizeTruncated.sizeBytes > oversizeTruncated.maxPreviewBytes, true);
    assert.equal(Object.hasOwn(oversizeTruncated, 'contentText'), true);
    assert.equal(Object.hasOwn(oversizeTruncated, 'previewText'), false);
  });

  it('keeps refs opaque and URIs controlled', async () => {
    const fixtures = await loadValidFixtures();

    for (const [fixtureName, preview] of Object.entries(fixtures)) {
      assert.doesNotMatch(preview.ref, /[\\/]|(^|[\\/])\.\.([\\/]|$)|^file:/iu, fixtureName);
      assert.match(preview.uri, /^\/api\/|^symphony-preview:/u, fixtureName);
      assert.doesNotMatch(preview.uri, /\.\.|\\|^file:/iu, fixtureName);
    }
  });

  it('rejects the missing safety fields fixture', async () => {
    const preview = await loadFixture(INVALID_MISSING_SAFETY_FIELDS_FIXTURE);
    const result = validateSafeArtifactPreviewContract(preview);

    assert.equal(result.ok, false);
    assert.equal(result.errors.includes('previewAvailable is required'), true);
    assert.equal(result.errors.includes('safeToRenderInline is required'), true);
    assert.equal(result.errors.includes('truncated is required'), true);
    assert.equal(result.errors.includes('truncationReason is required'), true);
    assert.equal(result.errors.includes('maxPreviewBytes is required'), true);
    assert.equal(result.errors.includes('downloadAvailable is required'), true);
    assert.equal(result.errors.includes('previewText/contentText must be absent unless previewAvailable and safeToRenderInline are true'), true);
  });

  it('rejects unsafe inline content, downloads, local file URIs, and path-like refs', async () => {
    const { safeText } = await loadValidFixtures();
    const unsafeInline = structuredClone(safeText);
    unsafeInline.safeToRenderInline = false;

    assert.equal(
      validateSafeArtifactPreviewContract(unsafeInline).errors.includes('previewText/contentText must be absent unless previewAvailable and safeToRenderInline are true'),
      true
    );

    const downloadable = structuredClone(safeText);
    downloadable.downloadAvailable = true;

    assert.deepEqual(validateSafeArtifactPreviewContract(downloadable), {
      ok: false,
      errors: ['downloadAvailable must be false']
    });

    const localFileUri = structuredClone(safeText);
    localFileUri.uri = 'file:///Users/example/secret.txt';

    assert.deepEqual(validateSafeArtifactPreviewContract(localFileUri), {
      ok: false,
      errors: [
        'uri must use a controlled API path or internal preview URI',
        'uri must not contain traversal or filesystem path syntax'
      ]
    });

    const pathRef = structuredClone(safeText);
    pathRef.ref = '../secret.txt';

    assert.deepEqual(validateSafeArtifactPreviewContract(pathRef), {
      ok: false,
      errors: [
        'ref must be an opaque registered artifact ref, not a path',
        'ref must not contain traversal or filesystem path syntax'
      ]
    });
  });

  it('requires explicit truncation and safe inline MIME constraints', async () => {
    const { safeText, oversizeTruncated, unsafeBinary } = await loadValidFixtures();
    const missingTruncationReason = structuredClone(oversizeTruncated);
    missingTruncationReason.truncationReason = null;

    assert.equal(
      validateSafeArtifactPreviewContract(missingTruncationReason).errors.includes('truncationReason must be a non-empty string'),
      true
    );

    const impossibleTruncation = structuredClone(oversizeTruncated);
    impossibleTruncation.sizeBytes = impossibleTruncation.maxPreviewBytes;

    assert.equal(
      validateSafeArtifactPreviewContract(impossibleTruncation).errors.includes('truncated previews must have sizeBytes greater than maxPreviewBytes'),
      true
    );

    const oversizedWithoutTruncation = structuredClone(safeText);
    oversizedWithoutTruncation.sizeBytes = oversizedWithoutTruncation.maxPreviewBytes + 1;

    assert.deepEqual(validateSafeArtifactPreviewContract(oversizedWithoutTruncation), {
      ok: false,
      errors: ['previews larger than maxPreviewBytes must be truncated']
    });

    const staleReason = structuredClone(safeText);
    staleReason.truncationReason = 'size-exceeds-max-preview-bytes';

    assert.deepEqual(validateSafeArtifactPreviewContract(staleReason), {
      ok: false,
      errors: ['truncationReason must be null when truncated is false']
    });

    const binaryInline = structuredClone(unsafeBinary);
    binaryInline.previewAvailable = true;
    binaryInline.safeToRenderInline = true;
    binaryInline.previewText = 'unsafe binary preview';

    assert.equal(
      validateSafeArtifactPreviewContract(binaryInline).errors.includes('safeToRenderInline true requires a text or JSON MIME'),
      true
    );
  });
});

async function loadValidFixtures() {
  return Object.fromEntries(await Promise.all(
    Object.entries(VALID_FIXTURE_FILES).map(async ([name, path]) => [
      name,
      await loadFixture(path)
    ])
  ));
}

async function loadFixture(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}
