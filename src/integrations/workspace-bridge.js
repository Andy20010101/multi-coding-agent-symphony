export function buildWorkspaceConstraints({ runId, writeSet }) {
  const constraints = [];

  if (typeof runId === 'string' && runId.trim() !== '') {
    constraints.push(`harness.run_id:${runId}`);
  }

  for (const pattern of normalizeWriteSet(writeSet)) {
    constraints.push(`write_set:${pattern}`);
  }

  return constraints;
}

export function normalizeWriteSet(writeSet) {
  assertNonEmptyStringArray(writeSet, 'TaskPacket.write_set');
  return writeSet.map((pattern, index) => normalizePattern(pattern, `TaskPacket.write_set[${index}]`));
}

export function findWriteSetViolations({ changedFiles, writeSet }) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return [];
  }

  const normalizedWriteSet = normalizeWriteSet(writeSet);

  return changedFiles
    .map((changedFile) => normalizeChangedFile(changedFile))
    .filter((changedFile) => changedFile !== null)
    .filter((changedFile) => !matchesAnyPattern(changedFile, normalizedWriteSet));
}

export function findWriteSetOverlaps(claims) {
  if (!Array.isArray(claims)) {
    throw new TypeError('write set claims must be an array');
  }

  const normalizedClaims = claims.map((claim, index) => normalizeWriteSetClaim(claim, index));
  const overlaps = [];

  for (let firstIndex = 0; firstIndex < normalizedClaims.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < normalizedClaims.length; secondIndex += 1) {
      const first = normalizedClaims[firstIndex];
      const second = normalizedClaims[secondIndex];

      for (const firstPattern of first.writeSet) {
        for (const secondPattern of second.writeSet) {
          if (writeSetPatternsOverlap(firstPattern, secondPattern)) {
            overlaps.push({
              firstOwner: first.owner,
              secondOwner: second.owner,
              firstPattern,
              secondPattern
            });
          }
        }
      }
    }
  }

  return overlaps;
}

export function findWriteSetSubsetViolations({ claimedWriteSet, allowedWriteSet }) {
  const allowed = normalizeWriteSet(allowedWriteSet);
  const claimed = normalizeWriteSet(claimedWriteSet);

  return claimed.filter((claimedPattern) => !allowed.some((allowedPattern) => writeSetPatternCovers(allowedPattern, claimedPattern)));
}

function matchesAnyPattern(changedFile, patterns) {
  return patterns.some((pattern) => patternToRegExp(pattern).test(changedFile));
}

function patternToRegExp(pattern) {
  let source = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    source += escapeRegExp(char);
  }

  return new RegExp(`${source}$`);
}

function normalizeWriteSetClaim(claim, index) {
  if (claim === null || typeof claim !== 'object' || Array.isArray(claim)) {
    throw new TypeError(`write set claims[${index}] must be an object`);
  }

  if (typeof claim.owner !== 'string' || claim.owner.trim() === '') {
    throw new TypeError(`write set claims[${index}].owner must be a non-empty string`);
  }

  return {
    owner: claim.owner,
    writeSet: normalizeWriteSet(claim.writeSet)
  };
}

function writeSetPatternsOverlap(firstPattern, secondPattern) {
  return globPatternsIntersect(firstPattern, secondPattern);
}

function patternAllows(pattern, changedFile) {
  return matchesAnyPattern(normalizeChangedFile(changedFile), [pattern]);
}

function writeSetPatternCovers(allowedPattern, claimedPattern) {
  if (allowedPattern === claimedPattern || allowedPattern === '**') {
    return true;
  }

  if (!claimedPattern.includes('*')) {
    return patternAllows(allowedPattern, claimedPattern);
  }

  if (!allowedPattern.includes('*')) {
    return false;
  }

  return segmentPatternCovers(allowedPattern, claimedPattern);
}

function segmentPatternCovers(allowedPattern, claimedPattern) {
  const allowedSegments = allowedPattern.split('/');
  const claimedSegments = claimedPattern.split('/');

  for (let allowedIndex = 0, claimedIndex = 0; allowedIndex < allowedSegments.length; allowedIndex += 1, claimedIndex += 1) {
    const allowedSegment = allowedSegments[allowedIndex];
    const claimedSegment = claimedSegments[claimedIndex];

    if (allowedSegment === '**') {
      return allowedIndex === allowedSegments.length - 1;
    }

    if (claimedSegment === undefined || !segmentCovers(allowedSegment, claimedSegment)) {
      return false;
    }
  }

  return allowedSegments.length === claimedSegments.length;
}

function segmentCovers(allowedSegment, claimedSegment) {
  if (allowedSegment === claimedSegment || allowedSegment === '*') {
    return claimedSegment !== '**';
  }

  if (!claimedSegment.includes('*')) {
    return patternToRegExp(allowedSegment).test(claimedSegment);
  }

  return false;
}

function globPatternsIntersect(firstPattern, secondPattern) {
  const firstTokens = tokenizeGlobPattern(firstPattern);
  const secondTokens = tokenizeGlobPattern(secondPattern);
  const visited = new Set();

  function canReach(firstIndex, secondIndex) {
    const key = `${firstIndex}:${secondIndex}`;
    if (visited.has(key)) {
      return false;
    }
    visited.add(key);

    if (firstIndex === firstTokens.length && secondIndex === secondTokens.length) {
      return true;
    }

    const firstToken = firstTokens[firstIndex];
    const secondToken = secondTokens[secondIndex];

    if (tokenCanMatchEmpty(firstToken) && canReach(firstIndex + 1, secondIndex)) {
      return true;
    }

    if (tokenCanMatchEmpty(secondToken) && canReach(firstIndex, secondIndex + 1)) {
      return true;
    }

    if (tokensCanShareCharacter(firstToken, secondToken)) {
      return canReach(nextTokenIndexAfterConsume(firstTokens, firstIndex), nextTokenIndexAfterConsume(secondTokens, secondIndex));
    }

    return false;
  }

  return canReach(0, 0);
}

function tokenizeGlobPattern(pattern) {
  const tokens = [];

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === '*' && next === '*') {
      tokens.push({ type: 'globstar' });
      index += 1;
      continue;
    }

    if (char === '*') {
      tokens.push({ type: 'star' });
      continue;
    }

    tokens.push({ type: 'literal', value: char });
  }

  return tokens;
}

function tokenCanMatchEmpty(token) {
  return token?.type === 'star' || token?.type === 'globstar';
}

function tokensCanShareCharacter(firstToken, secondToken) {
  if (firstToken === undefined || secondToken === undefined) {
    return false;
  }

  if (firstToken.type === 'literal' && secondToken.type === 'literal') {
    return firstToken.value === secondToken.value;
  }

  if (firstToken.type === 'literal') {
    return tokenCanConsumeCharacter(secondToken, firstToken.value);
  }

  if (secondToken.type === 'literal') {
    return tokenCanConsumeCharacter(firstToken, secondToken.value);
  }

  return true;
}

function tokenCanConsumeCharacter(token, value) {
  return token.type === 'globstar' || (token.type === 'star' && value !== '/');
}

function nextTokenIndexAfterConsume(tokens, index) {
  const token = tokens[index];
  return token.type === 'literal' ? index + 1 : index;
}

function normalizePattern(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  const normalized = normalizePortablePath(value);

  if (normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')) {
    throw new TypeError(`${field} must be a relative write-set pattern`);
  }

  return normalized;
}

function normalizeChangedFile(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const normalized = normalizePortablePath(value);

  if (normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')) {
    return normalized;
  }

  return normalized;
}

function normalizePortablePath(value) {
  return value
    .trim()
    .replaceAll('\\', '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '');
}

function assertNonEmptyStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty string array`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TypeError(`${field}[${index}] must be a non-empty string`);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
