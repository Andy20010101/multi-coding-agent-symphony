import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { redactSecrets } from './redaction.js';

export class ArtifactStore {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async writeArtifact(taskId, artifactId, artifact) {
    assertSafePathSegment(taskId, 'taskId');
    assertSafePathSegment(artifactId, 'artifactId');

    const directory = join(this.rootDirectory, taskId);
    const redactedArtifact = redactSecrets(artifact);
    await mkdir(directory, { recursive: true });
    await writeFile(
      this.#artifactPath(taskId, artifactId),
      `${JSON.stringify(redactedArtifact, null, 2)}\n`,
      'utf8'
    );

    return { taskId, artifactId };
  }

  async readArtifact(taskId, artifactId) {
    assertSafePathSegment(taskId, 'taskId');
    assertSafePathSegment(artifactId, 'artifactId');

    const content = await readFile(this.#artifactPath(taskId, artifactId), 'utf8');
    return JSON.parse(content);
  }

  #artifactPath(taskId, artifactId) {
    return join(this.rootDirectory, taskId, `${artifactId}.json`);
  }
}

function assertSafePathSegment(value, field) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/') || value.includes('..')) {
    throw new TypeError(`${field} must be a safe path segment`);
  }
}
