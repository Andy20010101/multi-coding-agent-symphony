import {
  buildGoalSupervisorAppReadModelFromContracts
} from '../../goal-supervisor/index.js';

export function createGoalSupervisorService({
  buildReadModel = buildGoalSupervisorAppReadModelFromContracts
} = {}) {
  return {
    async buildSupervisorReadModel({ stateDir, goalId }) {
      return await buildReadModel({
        stateDir,
        goalId
      });
    }
  };
}
