import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { validateAdapterMapping } from './contracts.js';

export class AdapterMappingRegistry {
  constructor(rootDirectory) {
    assertNonEmptyString(rootDirectory, 'rootDirectory');
    this.rootDirectory = rootDirectory;
  }

  async register(mapping) {
    validateAdapterMapping(mapping);
    await mkdir(this.rootDirectory, { recursive: true });
    await writeFile(this.#mappingPath(mapping), `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
    return structuredClone(mapping);
  }

  async list() {
    return this.#readAll();
  }

  async findByCommand(command) {
    assertNonEmptyString(command, 'command');
    const mappings = await this.#readAll();
    return mappings.filter((mapping) => mapping.command === command);
  }

  async findCandidates({
    command,
    capabilityReports,
    excludedAdapters = []
  }) {
    assertNonEmptyString(command, 'command');

    if (!Array.isArray(capabilityReports)) {
      throw new TypeError('capabilityReports must be an array');
    }

    if (!Array.isArray(excludedAdapters)) {
      throw new TypeError('excludedAdapters must be an array');
    }

    const excluded = new Set(excludedAdapters);
    const capableAdapters = new Set(capabilityReports
      .filter((report) => report.supportsNonInteractive === true &&
        Array.isArray(report.supportedCommands) &&
        report.supportedCommands.includes(command) &&
        !excluded.has(report.adapterId))
      .map((report) => report.adapterId));
    const mappings = await this.findByCommand(command);

    return mappings.filter((mapping) => capableAdapters.has(mapping.adapter));
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

    const mappings = [];

    for (const entry of entries.filter((file) => file.endsWith('.json')).sort()) {
      const content = await readFile(join(this.rootDirectory, entry), 'utf8');
      const mapping = JSON.parse(content);
      validateAdapterMapping(mapping);
      mappings.push(mapping);
    }

    return mappings;
  }

  #mappingPath(mapping) {
    return join(this.rootDirectory, `${mapping.command}__${mapping.adapter}__${mapping.commandVersion}__${encodeURIComponent(mapping.modelProfile)}.json`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
