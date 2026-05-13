#!/usr/bin/env node
import { runClaudeRealSmoke } from '../src/claude-real-smoke.js';

try {
  const result = await runClaudeRealSmoke();

  console.log(JSON.stringify(result, null, 2));

  if (!result.skipped && result.verification.status !== 'passed') {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
}
