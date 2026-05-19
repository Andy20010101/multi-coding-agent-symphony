import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { CODEX_CONFIG_DEFAULT_MODEL_PROFILE } from './adapters/codex-adapter.js';

export const DEFAULT_REAL_CLI_RELEASE_CONFIG_PATH = 'config/real-cli-release.json';

export const REAL_CLI_MODEL_ENV = Object.freeze({
  codex: 'MCAS_CODEX_MODEL',
  'claude-code': 'MCAS_CLAUDE_MODEL',
  'kiro-cli': 'MCAS_KIRO_MODEL'
});

export const REAL_CLI_PROVIDER_ENV = Object.freeze({
  codex: 'MCAS_CODEX_PROVIDER',
  'claude-code': 'MCAS_CLAUDE_PROVIDER',
  'kiro-cli': 'MCAS_KIRO_PROVIDER'
});

export const REAL_CLI_DEFAULT_MODELS = Object.freeze({
  codex: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
  'claude-code': 'deepseek-claude-code',
  'kiro-cli': 'claude-kiro-default'
});

export function readRealCliReleaseConfig({
  configFile,
  env = process.env,
  cwd = process.cwd(),
  required = false
} = {}) {
  const selectedPath = configFile ?? env.MCAS_REAL_CLI_CONFIG ?? DEFAULT_REAL_CLI_RELEASE_CONFIG_PATH;
  const resolvedPath = isAbsolute(selectedPath) ? selectedPath : resolve(cwd, selectedPath);

  if (!existsSync(resolvedPath)) {
    if (required || configFile !== undefined || env.MCAS_REAL_CLI_CONFIG !== undefined) {
      throw new Error(`real CLI config file does not exist: ${resolvedPath}`);
    }

    return {
      path: resolvedPath,
      exists: false,
      config: {
        version: '1'
      }
    };
  }

  const config = JSON.parse(readFileSync(resolvedPath, 'utf8'));

  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('real CLI config must contain a JSON object');
  }

  if (config.version !== undefined && config.version !== '1') {
    throw new Error('real CLI config version must be "1"');
  }

  assertOptionalStringMap(config.models, 'models');
  assertOptionalStringMap(config.providers, 'providers');

  return {
    path: resolvedPath,
    exists: true,
    config: {
      version: '1',
      ...config
    }
  };
}

export function resolveRealCliModelProfile({
  adapterId,
  env = process.env,
  config = {},
  adapterDefault = REAL_CLI_DEFAULT_MODELS[adapterId]
} = {}) {
  const envName = REAL_CLI_MODEL_ENV[adapterId];

  if (!envName) {
    throw new Error(`unknown real CLI adapter: ${adapterId}`);
  }

  const envValue = nonEmptyString(env[envName]);

  if (envValue !== undefined) {
    return {
      profile: envValue,
      source: 'env',
      envName
    };
  }

  const configValue = nonEmptyString(config.models?.[adapterId]);

  if (configValue !== undefined) {
    return {
      profile: configValue,
      source: 'release-config',
      envName
    };
  }

  return {
    profile: adapterDefault,
    source: 'adapter-default',
    envName
  };
}

export function resolveRealCliProvider({
  adapterId,
  env = process.env,
  config = {}
} = {}) {
  const envName = REAL_CLI_PROVIDER_ENV[adapterId];

  if (!envName) {
    throw new Error(`unknown real CLI adapter: ${adapterId}`);
  }

  const envValue = nonEmptyString(env[envName]);

  if (envValue !== undefined) {
    return {
      name: envValue,
      source: 'env',
      envName
    };
  }

  const configValue = nonEmptyString(config.providers?.[adapterId]);

  if (configValue !== undefined) {
    return {
      name: configValue,
      source: 'release-config',
      envName
    };
  }

  return {
    name: 'unknown',
    source: 'unknown',
    envName
  };
}

function assertOptionalStringMap(value, field) {
  if (value === undefined) {
    return;
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`real CLI config ${field} must be an object`);
  }

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new Error(`real CLI config ${field}.${key} must be a non-empty string`);
    }
  }
}

function nonEmptyString(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value.trim();
}
