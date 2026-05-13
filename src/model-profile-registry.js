import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { validateModelProfile } from './contracts.js';

export class ModelProfileRegistry {
  constructor(rootDirectory) {
    assertNonEmptyString(rootDirectory, 'rootDirectory');
    this.rootDirectory = rootDirectory;
  }

  async register(profile) {
    validateModelProfile(profile);
    await mkdir(this.rootDirectory, { recursive: true });
    await writeFile(this.#profilePath(profile.id), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    return structuredClone(profile);
  }

  async get(id) {
    assertSafeId(id, 'id');
    const content = await readFile(this.#profilePath(id), 'utf8');
    return JSON.parse(content);
  }

  async list() {
    return this.#readAll();
  }

  async find({
    provider,
    costClass,
    supportsStructuredOutput,
    supportsVisionInput,
    reasoningControl
  } = {}) {
    const profiles = await this.#readAll();

    return profiles.filter((profile) => (
      (provider === undefined || profile.provider === provider) &&
      (costClass === undefined || profile.costClass === costClass) &&
      (supportsStructuredOutput === undefined || profile.supportsStructuredOutput === supportsStructuredOutput) &&
      (supportsVisionInput === undefined || profile.supportsVisionInput === supportsVisionInput) &&
      (reasoningControl === undefined || profile.reasoningControls.includes(reasoningControl))
    ));
  }

  async #readAll() {
    let entries;

    try {
      entries = await readdir(this.rootDirectory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }

    const profiles = [];

    for (const entry of entries.filter((file) => file.endsWith('.json')).sort()) {
      const content = await readFile(join(this.rootDirectory, entry), 'utf8');
      const profile = JSON.parse(content);
      validateModelProfile(profile);
      profiles.push(profile);
    }

    return profiles;
  }

  #profilePath(id) {
    assertSafeId(id, 'id');
    return join(this.rootDirectory, `${encodeURIComponent(id)}.json`);
  }
}

function assertSafeId(value, field) {
  assertNonEmptyString(value, field);

  if (value.includes('/') || value.includes('..')) {
    throw new TypeError(`${field} must be a safe id`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
