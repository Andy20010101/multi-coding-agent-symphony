import { validateTaskSpec } from './contracts.js';

export function buildContextPack(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('context builder input must be an object');
  }

  validateTaskSpec(input.taskSpec);

  if (typeof input.commandName !== 'string' || input.commandName.trim() === '') {
    throw new TypeError('commandName must be a non-empty string');
  }

  const events = cloneArray(input.events ?? [], 'events');
  const artifactRefs = cloneArray(input.artifactRefs ?? [], 'artifactRefs').map(stripArtifactContent);
  const hydratedArtifacts = cloneArray(input.hydratedArtifacts ?? [], 'hydratedArtifacts');

  return {
    version: '1',
    commandName: input.commandName,
    task: {
      id: input.taskSpec.id,
      source: input.taskSpec.source,
      repository: input.taskSpec.repository,
      objective: input.taskSpec.objective,
      ...(input.taskSpec.constraints ? { constraints: [...input.taskSpec.constraints] } : {}),
      acceptance: [...input.taskSpec.acceptance],
      version: input.taskSpec.version
    },
    events,
    artifactRefs,
    hydratedArtifacts
  };
}

function cloneArray(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }

  return structuredClone(value);
}

function stripArtifactContent(ref) {
  if (ref === null || typeof ref !== 'object' || Array.isArray(ref)) {
    throw new TypeError('artifact reference must be an object');
  }

  const { content, ...withoutContent } = ref;
  return withoutContent;
}
