const DEFAULT_DENIED_PATHS = [
  '.env',
  '.env.*',
  '**/.ssh/**',
  '.npmrc',
  '.netrc',
  '**/secrets/**'
];
const COMMAND_PATTERN_WILDCARD = '[^\\s;&|<>`$()\\n\\r]+';
const NETWORK_STATES = new Set(['enabled', 'disabled', 'restricted']);

export class PolicyEngine {
  constructor(policy = {}) {
    this.deniedPaths = [...DEFAULT_DENIED_PATHS, ...(policy.deniedPaths ?? [])];
    this.allowedCommands = [...(policy.allowedCommands ?? [])];
    this.deniedCommands = [...(policy.deniedCommands ?? [])];
    this.allowedCommandPatterns = [...(policy.allowedCommandPatterns ?? [])];
    this.deniedCommandPatterns = [...(policy.deniedCommandPatterns ?? [])];
    this.network = policy.network ?? 'disabled';
    this.allowedNetworkHosts = [...(policy.allowedNetworkHosts ?? [])];
    this.deniedNetworkHosts = [...(policy.deniedNetworkHosts ?? [])];
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

    if (request.action === 'network') {
      return this.#decideNetwork(request.target);
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

    const deniedCommand = this.deniedCommands.find((deniedCommand) => command === deniedCommand);

    if (deniedCommand) {
      return {
        decision: 'deny',
        reason: 'denied-command',
        matchedRule: deniedCommand
      };
    }

    const deniedCommandPattern = this.deniedCommandPatterns.find((pattern) => {
      return matchesCommandPattern(pattern, command);
    });

    if (deniedCommandPattern) {
      return {
        decision: 'deny',
        reason: 'denied-command-pattern',
        matchedRule: deniedCommandPattern
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

    const allowedCommandPattern = this.allowedCommandPatterns.find((pattern) => {
      return matchesCommandPattern(pattern, command);
    });

    if (allowedCommandPattern) {
      return {
        decision: 'allow',
        reason: 'allowed-command-pattern',
        matchedRule: allowedCommandPattern
      };
    }

    return {
      decision: 'deny',
      reason: 'command-not-allowed',
      matchedRule: null
    };
  }

  #decideNetwork(target) {
    const host = normalizeNetworkTarget(target);

    if (!host) {
      return {
        decision: 'deny',
        reason: 'invalid-network-target',
        matchedRule: null
      };
    }

    if (!NETWORK_STATES.has(this.network)) {
      return {
        decision: 'deny',
        reason: 'invalid-network-policy',
        matchedRule: this.network
      };
    }

    const deniedHost = this.deniedNetworkHosts.find((pattern) => matchesHostPattern(pattern, host));

    if (deniedHost) {
      return {
        decision: 'deny',
        reason: 'network-denied',
        matchedRule: deniedHost
      };
    }

    if (this.network === 'disabled') {
      return {
        decision: 'deny',
        reason: 'network-denied',
        matchedRule: 'disabled'
      };
    }

    if (this.network === 'enabled') {
      return {
        decision: 'allow',
        reason: 'network-allowed',
        matchedRule: 'enabled'
      };
    }

    if (this.network === 'restricted') {
      const allowedHost = this.allowedNetworkHosts.find((pattern) => matchesHostPattern(pattern, host));

      if (allowedHost) {
        return {
          decision: 'allow',
          reason: 'network-host-allowed',
          matchedRule: allowedHost
        };
      }

      return {
        decision: 'deny',
        reason: 'network-denied',
        matchedRule: 'restricted'
      };
    }

    throw new Error(`Unhandled network policy: ${this.network}`);
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

function matchesCommandPattern(pattern, command) {
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    return false;
  }

  const regex = new RegExp(`^${escapeCommandPattern(pattern)}$`);
  return regex.test(command);
}

function escapeCommandPattern(pattern) {
  return [...pattern].map((character) => {
    if (character === '*') {
      return COMMAND_PATTERN_WILDCARD;
    }

    return escapeRegExp(character);
  }).join('');
}

function escapeRegExp(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function normalizeNetworkTarget(target) {
  if (typeof target !== 'string' || target.trim() === '') {
    return null;
  }

  const value = target.trim();

  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return normalizeHost(url.hostname);
  } catch {
    return normalizeHost(value.replace(/:\d+$/, ''));
  }
}

function matchesHostPattern(pattern, host) {
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    return false;
  }

  const normalizedPattern = normalizeHostPattern(pattern);

  if (!normalizedPattern) {
    return false;
  }

  if (normalizedPattern.startsWith('*.')) {
    return host.endsWith(normalizedPattern.slice(1));
  }

  return host === normalizedPattern;
}

function normalizeHostPattern(pattern) {
  const value = pattern.trim().toLowerCase();

  if (value.startsWith('*.')) {
    return normalizeHost(value);
  }

  return normalizeNetworkTarget(value);
}

function normalizeHost(host) {
  return host.toLowerCase().replace(/\.$/, '');
}
