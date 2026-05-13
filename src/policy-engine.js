const DEFAULT_DENIED_PATHS = [
  '.env',
  '.env.*',
  '**/.ssh/**',
  '.npmrc',
  '.netrc',
  '**/secrets/**'
];

export class PolicyEngine {
  constructor(policy = {}) {
    this.deniedPaths = [...DEFAULT_DENIED_PATHS, ...(policy.deniedPaths ?? [])];
    this.allowedCommands = [...(policy.allowedCommands ?? [])];
  }

  decide(request) {
    if (request === null || typeof request !== 'object' || Array.isArray(request)) {
      throw new TypeError('policy request must be an object');
    }

    if (request.action === 'read' || request.action === 'write') {
      return this.#decidePath(request.target);
    }

    if (request.action === 'shell') {
      return this.#decideCommand(request.command);
    }

    return {
      decision: 'deny',
      reason: 'unsupported-action',
      matchedRule: request.action ?? null
    };
  }

  #decidePath(target) {
    if (typeof target !== 'string' || target.trim() === '') {
      return {
        decision: 'deny',
        reason: 'invalid-target',
        matchedRule: null
      };
    }

    const matchedRule = this.deniedPaths.find((pattern) => matchesPathPattern(pattern, target));

    if (matchedRule) {
      return {
        decision: 'deny',
        reason: 'sensitive-path',
        matchedRule
      };
    }

    return {
      decision: 'allow',
      reason: 'path-not-denied',
      matchedRule: null
    };
  }

  #decideCommand(command) {
    if (typeof command !== 'string' || command.trim() === '') {
      return {
        decision: 'deny',
        reason: 'invalid-command',
        matchedRule: null
      };
    }

    const matchedRule = this.allowedCommands.find((allowedCommand) => command === allowedCommand);

    if (matchedRule) {
      return {
        decision: 'allow',
        reason: 'allowed-command',
        matchedRule
      };
    }

    return {
      decision: 'deny',
      reason: 'command-not-allowed',
      matchedRule: null
    };
  }
}

function matchesPathPattern(pattern, target) {
  if (pattern === target || target.endsWith(`/${pattern}`)) {
    return true;
  }

  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -1);
    return target.startsWith(prefix) || target.includes(`/${prefix}`);
  }

  if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
    return target.includes(pattern.slice(3, -3));
  }

  return false;
}
