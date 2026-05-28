export const CAPABILITIES_CONTRACT_NAME = 'capabilities.v1';
export const CAPABILITIES_CONTRACT_VERSION = 1;

export function buildCapabilitiesContract() {
  return {
    contractName: CAPABILITIES_CONTRACT_NAME,
    contractVersion: CAPABILITIES_CONTRACT_VERSION,
    readOnly: true,
    displayOnly: true,
    copyOnly: true,
    mutationAvailable: false,
    browserExecutionAvailable: false,
    modelInvocationAvailable: false,
    artifactDownloadAvailable: false,
    safePreview: {
      available: true,
      inlineModes: ['bounded-text'],
      rawHtmlInlineAvailable: false,
      svgInlineAvailable: false,
      javascriptInlineAvailable: false,
      binaryInlineAvailable: false
    },
    routes: {
      handoff: true,
      safePreview: true,
      goalProgress: true,
      diagnostics: true
    }
  };
}

export function validateCapabilitiesContract(capabilities) {
  const errors = [];

  if (!isPlainObject(capabilities)) {
    return {
      ok: false,
      errors: ['capabilities must be a plain object']
    };
  }

  requireExact(errors, capabilities.contractName, 'contractName', CAPABILITIES_CONTRACT_NAME);
  requireExact(errors, capabilities.contractVersion, 'contractVersion', CAPABILITIES_CONTRACT_VERSION);

  for (const field of ['readOnly', 'displayOnly', 'copyOnly']) {
    requireExact(errors, capabilities[field], field, true);
  }

  for (const field of ['mutationAvailable', 'browserExecutionAvailable', 'modelInvocationAvailable', 'artifactDownloadAvailable']) {
    requireExact(errors, capabilities[field], field, false);
  }

  validateSafePreview(errors, capabilities.safePreview);
  validateRoutes(errors, capabilities.routes);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertCapabilitiesContract(capabilities) {
  const result = validateCapabilitiesContract(capabilities);

  if (!result.ok) {
    throw new Error(`Invalid capabilities contract: ${result.errors.join('; ')}`);
  }

  return capabilities;
}

function validateSafePreview(errors, safePreview) {
  if (!isPlainObject(safePreview)) {
    errors.push('safePreview must be a plain object');
    return;
  }

  requireExact(errors, safePreview.available, 'safePreview.available', true);

  if (!Array.isArray(safePreview.inlineModes)) {
    errors.push('safePreview.inlineModes must be an array');
  } else if (safePreview.inlineModes.length !== 1 || safePreview.inlineModes[0] !== 'bounded-text') {
    errors.push('safePreview.inlineModes must contain bounded-text only');
  }

  for (const field of ['rawHtmlInlineAvailable', 'svgInlineAvailable', 'javascriptInlineAvailable', 'binaryInlineAvailable']) {
    requireExact(errors, safePreview[field], `safePreview.${field}`, false);
  }
}

function validateRoutes(errors, routes) {
  if (!isPlainObject(routes)) {
    errors.push('routes must be a plain object');
    return;
  }

  for (const field of ['handoff', 'safePreview', 'goalProgress', 'diagnostics']) {
    if (typeof routes[field] !== 'boolean') {
      errors.push(`routes.${field} must be a boolean`);
    }
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
