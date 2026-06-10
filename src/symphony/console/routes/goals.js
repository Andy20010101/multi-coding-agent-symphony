import {
  hasSearchParams,
  isUnsafeGoalRouteSegment,
  safeDecodePathSegment
} from '../request.js';
import {
  writeApiErrorResponse,
  writeJsonResponse
} from '../response.js';

export function createGoalRoutes({
  buildGoalSupervisorAppReadModelFromContracts
}) {
  return [{
    id: 'goal-supervisor',
    match({ url }) {
      return parseGoalSupervisorRequestPath(url.pathname, url.searchParams) !== null;
    },
    async handle({ response, url, method, stateDir }) {
      const request = parseGoalSupervisorRequestPath(url.pathname, url.searchParams);

      if (request.kind === 'invalid') {
        writeInvalidGoalRunbookControlResponse({
          response,
          route: url.pathname,
          method
        });
        return;
      }

      writeJsonResponse(response, 200, await buildGoalSupervisorAppReadModelFromContracts({
        stateDir,
        goalId: request.goalId
      }));
    }
  }];
}

function parseGoalSupervisorRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseGoalRunbookControlRequestPath({
    pathname,
    searchParams,
    suffix: 'supervisor'
  });
}

function parseGoalRunbookControlRequestPath({ pathname, searchParams, suffix }) {
  const latestPath = `/api/goals/latest/${suffix}`;
  const explicitPattern = new RegExp(`^/api/goals/([^/]+)/${suffix}$`, 'u');

  if (hasSearchParams(searchParams)) {
    if (pathname === latestPath || explicitPattern.test(pathname)) {
      return {
        kind: 'invalid',
        goalId: null
      };
    }

    return null;
  }

  if (pathname === latestPath) {
    return {
      kind: 'goal-runbook-control',
      goalId: 'latest'
    };
  }

  const match = explicitPattern.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null
    };
  }

  return {
    kind: 'goal-runbook-control',
    goalId: decoded.value
  };
}

function writeInvalidGoalRunbookControlResponse({ response, route, method }) {
  writeApiErrorResponse(response, {
    status: 400,
    code: 'invalid-goal-ref',
    message: 'Goal runbook control ref is invalid.',
    route,
    method,
    safeDetails: {
      reason: 'invalid-route-segment'
    }
  });
}
