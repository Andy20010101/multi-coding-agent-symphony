import { writeConsoleMethodNotAllowedResponse } from './server.js';

export function createConsoleRouteRegistry({
  routes
}) {
  const registeredRoutes = routes.flat();

  return {
    async handle(context) {
      const route = registeredRoutes.find((candidate) => candidate.match(context));

      if (route === undefined) {
        return false;
      }

      if (context.method !== 'GET') {
        writeConsoleMethodNotAllowedResponse({
          response: context.response,
          route: context.url.pathname,
          method: context.method
        });
        return true;
      }

      await route.handle(context);
      return true;
    }
  };
}
