import { hasSearchParams } from '../request.js';
import { writeApiErrorResponse, writeJsonResponse } from '../response.js';

export function createReadinessRoutes({
  buildConsoleReadiness,
  buildLocalRuntimeHealth
}) {
  return [
    {
      id: 'runtime-health',
      match({ url }) {
        return url.pathname === '/api/health';
      },
      async handle({ response, url, method, cwd, runtimeStartedAt }) {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-health-request',
            message: 'Runtime health does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildLocalRuntimeHealth({
          cwd,
          startedAt: runtimeStartedAt
        }));
      }
    },
    {
      id: 'console-readiness',
      match({ url }) {
        return url.pathname === '/api/readiness';
      },
      async handle({ response, stateDir, cwd, env, runner, readinessTimeoutMs }) {
        writeJsonResponse(response, 200, await buildConsoleReadiness({
          stateDir,
          cwd,
          env,
          runner,
          timeoutMs: readinessTimeoutMs
        }));
      }
    }
  ];
}
