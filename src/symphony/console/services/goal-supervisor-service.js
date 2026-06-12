import {
  join
} from 'node:path';

import {
  buildGoalSupervisorAppReadModelFromContracts
} from '../../goal-supervisor/index.js';

export function createGoalSupervisorService({
  buildReadModel = buildGoalSupervisorAppReadModelFromContracts
} = {}) {
  return {
    async buildSupervisorReadModel({ stateDir, goalId, env = process.env }) {
      const sessionRoots = sessionRootsFromEnv(env);

      return await buildReadModel({
        stateDir,
        goalId,
        sessionHookOptions: sessionRoots,
        sessionInventoryOptions: sessionRoots
      });
    }
  };
}

function sessionRootsFromEnv(env) {
  const home = typeof env?.HOME === 'string' && env.HOME.trim() !== ''
    ? env.HOME
    : null;

  if (home === null) {
    return {};
  }

  return {
    codexRoot: join(home, '.codex', 'sessions'),
    claudeRoot: join(home, '.claude', 'projects')
  };
}
