#!/usr/bin/env node
import { runKiroRealSmoke } from '../src/kiro-real-smoke.js';

try {
  const result = await runKiroRealSmoke();

  console.log(JSON.stringify(result, null, 2));

  if (!result.skipped && result.verification.status !== 'passed') {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
}
