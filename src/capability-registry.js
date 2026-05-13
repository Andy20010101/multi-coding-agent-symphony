import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class CapabilityRegistry {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async register(report) {
    validateCapabilityReport(report);
    await mkdir(this.rootDirectory, { recursive: true });
    await writeFile(this.#reportPath(report.adapterId), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return structuredClone(report);
  }

  async get(adapterId) {
    assertSafeId(adapterId, 'adapterId');
    const content = await readFile(this.#reportPath(adapterId), 'utf8');
    return JSON.parse(content);
  }

  async findByCommand(commandName) {
    const reports = await this.#readIndex();
    return reports.filter((report) => report.supportedCommands.includes(commandName));
  }

  async #readIndex() {
    let entries;

    try {
      entries = await readdir(this.rootDirectory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }

    const reports = [];

    for (const entry of entries.filter((file) => file.endsWith('.json')).sort()) {
      const content = await readFile(join(this.rootDirectory, entry), 'utf8');
      reports.push(JSON.parse(content));
    }

    return reports;
  }

  #reportPath(adapterId) {
    return join(this.rootDirectory, `${adapterId}.json`);
  }
}

function validateCapabilityReport(report) {
  if (report === null || typeof report !== 'object' || Array.isArray(report)) {
    throw new TypeError('capability report must be an object');
  }

  assertSafeId(report.adapterId, 'adapterId');
  assertNonEmptyString(report.cliName, 'cliName');
  assertNonEmptyString(report.cliVersion, 'cliVersion');
  assertNonEmptyArray(report.supportedCommands, 'supportedCommands');
  assertNonEmptyArray(report.modelProfiles, 'modelProfiles');
  assertBoolean(report.supportsNonInteractive, 'supportsNonInteractive');
  assertBoolean(report.supportsResume, 'supportsResume');
  assertBoolean(report.supportsCancel, 'supportsCancel');
  assertBoolean(report.supportsHooks, 'supportsHooks');
  assertBoolean(report.supportsMcp, 'supportsMcp');
  assertBoolean(report.supportsStructuredOutput, 'supportsStructuredOutput');
  assertNonEmptyString(report.workspaceIsolation, 'workspaceIsolation');
  assertNonEmptyString(report.logStrategy, 'logStrategy');
  assertNonEmptyString(report.version, 'version');
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

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${field} must be a boolean`);
  }
}
