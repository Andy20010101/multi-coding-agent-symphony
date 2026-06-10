import { writeJsonResponse } from '../response.js';

export function createSummaryRoutes({
  buildConsoleSnapshot
}) {
  return [{
    id: 'console-summary',
    match({ url }) {
      return url.pathname === '/api/summary';
    },
    async handle({ response, stateDir }) {
      writeJsonResponse(response, 200, await buildConsoleSnapshot({ stateDir }));
    }
  }];
}
