/**
 * Targeted tests to kill surviving mutants in policy-engine.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { PolicyEngine } from '../src/policy-engine.js';

// ── L14-21: ArrayDeclaration — DEFAULT_DENIED_PATHS members ──────────────────
// Kills: each array member replaced with "Stryker was here"

describe('policy-engine.js targeted: DEFAULT_DENIED_PATHS members', () => {
  const engine = new PolicyEngine();

  it('denies .env (exact match)', () => {
    assert.equal(engine.decide({ action: 'read', target: '.env' }).decision, 'deny');
  });

  it('denies .env.production (.env.* pattern)', () => {
    assert.equal(engine.decide({ action: 'read', target: '.env.production' }).decision, 'deny');
  });

  it('denies .env.local (.env.* pattern)', () => {
    assert.equal(engine.decide({ action: 'read', target: '.env.local' }).decision, 'deny');
  });

  it('denies path containing .ssh (**/.ssh/** pattern)', () => {
    assert.equal(engine.decide({ action: 'read', target: '/home/user/.ssh/id_rsa' }).decision, 'deny');
  });

  it('denies .npmrc', () => {
    assert.equal(engine.decide({ action: 'read', target: '.npmrc' }).decision, 'deny');
  });

  it('denies .netrc', () => {
    assert.equal(engine.decide({ action: 'read', target: '.netrc' }).decision, 'deny');
  });

  it('denies path containing secrets (**/secrets/** pattern)', () => {
    assert.equal(engine.decide({ action: 'read', target: '/app/secrets/db_pass' }).decision, 'deny');
  });
});

// ── L25: decide() null/object/array guard ─────────────────────────────────────
// Kills: ConditionalExpression(false), LogicalOperator(&&)

describe('policy-engine.js targeted: decide() input validation', () => {
  const engine = new PolicyEngine();

  it('throws TypeError for null request', () => {
    assert.throws(() => engine.decide(null), TypeError);
  });

  it('throws TypeError for array request', () => {
    assert.throws(() => engine.decide([]), TypeError);
  });

  it('throws TypeError for string request', () => {
    assert.throws(() => engine.decide('read'), TypeError);
  });

  it('throws TypeError for number request', () => {
    assert.throws(() => engine.decide(42), TypeError);
  });
});

// ── L37: shell action check ───────────────────────────────────────────────────
// Kills: ConditionalExpression(true) — always routes to shell

describe('policy-engine.js targeted: action routing', () => {
  it('read action routes to path decision (not shell)', () => {
    const engine = new PolicyEngine({ allowedCommands: [] });
    const result = engine.decide({ action: 'read', target: '/safe/path' });
    // path decision returns allow or deny with path-related reason
    assert.ok(['allow', 'deny'].includes(result.decision));
    assert.notEqual(result.reason, 'invalid-command');
  });

  it('shell action routes to command decision', () => {
    const engine = new PolicyEngine({ allowedCommands: ['pnpm test'] });
    const result = engine.decide({ action: 'shell', command: 'pnpm test' });
    assert.equal(result.decision, 'allow');
  });

  it('network action routes to network decision', () => {
    const engine = new PolicyEngine({ network: 'enabled' });
    const result = engine.decide({ action: 'network', target: 'https://api.github.com' });
    assert.equal(result.decision, 'allow');
  });

  it('unknown action is denied with unsupported-action reason', () => {
    const engine = new PolicyEngine();
    const result = engine.decide({ action: 'execute', target: '/bin/sh' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'unsupported-action');
  });

  it('unsupported-action matchedRule is the action value', () => {
    const engine = new PolicyEngine();
    const result = engine.decide({ action: 'spawn' });
    assert.equal(result.matchedRule, 'spawn');
  });
});

// ── L75: #decideCommand blank/non-string guard ────────────────────────────────
// Kills: ConditionalExpression(false), LogicalOperator(&&), MethodExpression(.trim)

describe('policy-engine.js targeted: #decideCommand validation', () => {
  const engine = new PolicyEngine({ allowedCommands: ['pnpm test'] });

  it('denies blank command string', () => {
    const result = engine.decide({ action: 'shell', command: '' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'invalid-command');
  });

  it('denies whitespace-only command', () => {
    const result = engine.decide({ action: 'shell', command: '   ' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'invalid-command');
  });

  it('denies null command', () => {
    const result = engine.decide({ action: 'shell', command: null });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'invalid-command');
  });

  it('denies undefined command', () => {
    const result = engine.decide({ action: 'shell', command: undefined });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'invalid-command');
  });
});

// ── L137, L145: network disabled/enabled decisions ───────────────────────────
// Kills: ConditionalExpression(false) on network state checks

describe('policy-engine.js targeted: network state decisions', () => {
  it('disabled network denies with matchedRule "disabled"', () => {
    const engine = new PolicyEngine({ network: 'disabled' });
    const result = engine.decide({ action: 'network', target: 'https://api.github.com' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.matchedRule, 'disabled');
  });

  it('enabled network allows with matchedRule "enabled"', () => {
    const engine = new PolicyEngine({ network: 'enabled' });
    const result = engine.decide({ action: 'network', target: 'https://api.github.com' });
    assert.equal(result.decision, 'allow');
    assert.equal(result.matchedRule, 'enabled');
  });

  it('restricted network allows listed host', () => {
    const engine = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['api.github.com']
    });
    const result = engine.decide({ action: 'network', target: 'https://api.github.com' });
    assert.equal(result.decision, 'allow');
    assert.equal(result.matchedRule, 'api.github.com');
  });

  it('restricted network denies unlisted host with matchedRule "restricted"', () => {
    const engine = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['api.github.com']
    });
    const result = engine.decide({ action: 'network', target: 'https://evil.com' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.matchedRule, 'restricted');
  });

  it('deniedNetworkHosts takes precedence over enabled network', () => {
    const engine = new PolicyEngine({
      network: 'enabled',
      deniedNetworkHosts: ['evil.com']
    });
    const result = engine.decide({ action: 'network', target: 'https://evil.com' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'network-denied');
  });
});

// ── L171: invalid network policy ─────────────────────────────────────────────

describe('policy-engine.js targeted: invalid network policy', () => {
  it('invalid network policy value is denied', () => {
    const engine = new PolicyEngine({ network: 'open' }); // not in NETWORK_STATES
    const result = engine.decide({ action: 'network', target: 'https://api.github.com' });
    assert.equal(result.decision, 'deny');
    assert.equal(result.reason, 'invalid-network-policy');
  });
});

// ── L211: matchesPathPattern glob ─────────────────────────────────────────────
// Kills: LogicalOperator on startsWith('**/') || endsWith('/**')

describe('policy-engine.js targeted: path pattern matching', () => {
  it('**/.ssh/** matches nested .ssh path', () => {
    const engine = new PolicyEngine();
    assert.equal(engine.decide({ action: 'read', target: '/home/user/.ssh/config' }).decision, 'deny');
  });

  it('**/secrets/** matches nested secrets path', () => {
    const engine = new PolicyEngine();
    assert.equal(engine.decide({ action: 'read', target: '/app/config/secrets/key' }).decision, 'deny');
  });

  it('.env.* matches .env.test', () => {
    const engine = new PolicyEngine();
    assert.equal(engine.decide({ action: 'read', target: '.env.test' }).decision, 'deny');
  });

  it('exact match works for .npmrc', () => {
    const engine = new PolicyEngine();
    assert.equal(engine.decide({ action: 'read', target: '.npmrc' }).decision, 'deny');
  });

  it('path ending with /.npmrc is denied', () => {
    const engine = new PolicyEngine();
    assert.equal(engine.decide({ action: 'read', target: '/home/user/.npmrc' }).decision, 'deny');
  });
});

// ── L252: Regex port stripping ────────────────────────────────────────────────
// Kills: /:\d+$/ → /:\d+/ or /:\D+$/

describe('policy-engine.js targeted: network target normalization', () => {
  it('host with port is normalized correctly', () => {
    const engine = new PolicyEngine({ network: 'enabled' });
    // api.github.com:443 should normalize to api.github.com
    const result = engine.decide({ action: 'network', target: 'api.github.com:443' });
    assert.equal(result.decision, 'allow');
  });

  it('host with port is matched against allowedNetworkHosts without port', () => {
    const engine = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['api.github.com']
    });
    const result = engine.decide({ action: 'network', target: 'api.github.com:443' });
    assert.equal(result.decision, 'allow');
  });
});

// ── L275, L285: toUpperCase/toLowerCase normalization ─────────────────────────
// Kills: MethodExpression removing case normalization

describe('policy-engine.js targeted: case normalization', () => {
  it('host matching is case-insensitive', () => {
    const engine = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['api.github.com']
    });
    const result = engine.decide({ action: 'network', target: 'API.GITHUB.COM' });
    assert.equal(result.decision, 'allow');
  });

  it('denied host matching is case-insensitive', () => {
    const engine = new PolicyEngine({
      network: 'enabled',
      deniedNetworkHosts: ['evil.com']
    });
    const result = engine.decide({ action: 'network', target: 'EVIL.COM' });
    assert.equal(result.decision, 'deny');
  });

  it('wildcard host pattern matching is case-insensitive', () => {
    const engine = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['*.github.com']
    });
    const result = engine.decide({ action: 'network', target: 'API.GITHUB.COM' });
    assert.equal(result.decision, 'allow');
  });
});
