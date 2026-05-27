export const GUIDED_GOAL_HANDOFF_CONTRACT_NAME = 'guided-goal-handoff.v1';
export const GUIDED_GOAL_HANDOFF_CONTRACT_VERSION = '1';

export const GUIDED_GOAL_HANDOFF_ROLE_IDS = Object.freeze([
  'planner',
  'worker',
  'reviewer',
  'verifier',
  'release-evidence'
]);

export const GUIDED_GOAL_HANDOFF_COMMAND_BLOCK_IDS = Object.freeze([
  'preflight',
  'task-branch',
  'local-validation',
  'independent-review',
  'commit-push-merge',
  'main-post-merge-validation'
]);

const REQUIRED_TOP_LEVEL_FIELDS = Object.freeze([
  'contractName',
  'contractVersion',
  'goalId',
  'title',
  'titleZh',
  'baseline',
  'scope',
  'nonGoals',
  'safetyBoundaries',
  'roles',
  'tasks',
  'commands',
  'reviewModel',
  'releaseGates',
  'stopConditions',
  'deferredContracts'
]);

const FORBIDDEN_COMMAND_BLOCK_FIELDS = Object.freeze([
  'apiRoute',
  'endpoint',
  'handler',
  'httpMethod',
  'method',
  'route',
  'writeEndpoint'
]);

export function validateGuidedGoalHandoffContract(handoff) {
  const errors = [];

  if (!isPlainObject(handoff)) {
    return {
      ok: false,
      errors: ['handoff must be a plain object']
    };
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!Object.hasOwn(handoff, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExactString(errors, handoff.contractName, 'contractName', GUIDED_GOAL_HANDOFF_CONTRACT_NAME);
  requireExactString(errors, handoff.contractVersion, 'contractVersion', GUIDED_GOAL_HANDOFF_CONTRACT_VERSION);
  requireNonEmptyString(errors, handoff.goalId, 'goalId');
  requireNonEmptyString(errors, handoff.title, 'title');
  requireNonEmptyString(errors, handoff.titleZh, 'titleZh');
  validateBaseline(errors, handoff.baseline);
  requireNonEmptyStringArray(errors, handoff.scope, 'scope');
  requireNonEmptyStringArray(errors, handoff.nonGoals, 'nonGoals');
  requireNonEmptyStringArray(errors, handoff.safetyBoundaries, 'safetyBoundaries');
  validateRoles(errors, handoff.roles);
  validateTasks(errors, handoff.tasks);
  validateCommands(errors, handoff.commands);
  validateReviewModel(errors, handoff.reviewModel);
  validateObjectArray(errors, handoff.releaseGates, 'releaseGates', ['id', 'requirement', 'evidence']);
  validateObjectArray(errors, handoff.stopConditions, 'stopConditions', ['id', 'condition']);
  validateObjectArray(errors, handoff.deferredContracts, 'deferredContracts', ['contractName', 'status', 'reason']);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGuidedGoalHandoffContract(handoff) {
  const result = validateGuidedGoalHandoffContract(handoff);

  if (!result.ok) {
    throw new Error(`Invalid guided goal handoff contract: ${result.errors.join('; ')}`);
  }

  return handoff;
}

function validateBaseline(errors, baseline) {
  if (!isPlainObject(baseline)) {
    errors.push('baseline must be a plain object');
    return;
  }

  requireNonEmptyString(errors, baseline.releaseTag, 'baseline.releaseTag');
  requireNonEmptyString(errors, baseline.releaseTagCommit, 'baseline.releaseTagCommit');
  requireNonEmptyString(errors, baseline.planningCommit, 'baseline.planningCommit');
  requireNonEmptyString(errors, baseline.approvalCommit, 'baseline.approvalCommit');
  requireNonEmptyStringArray(errors, baseline.previousEvidence, 'baseline.previousEvidence');
}

function validateRoles(errors, roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    errors.push('roles must be a non-empty array');
    return;
  }

  const roleIds = new Set();

  roles.forEach((role, index) => {
    const path = `roles[${index}]`;

    if (!isPlainObject(role)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, role.id, `${path}.id`);
    requireNonEmptyString(errors, role.description, `${path}.description`);
    requireNonEmptyStringArray(errors, role.inputs, `${path}.inputs`);
    requireNonEmptyStringArray(errors, role.outputs, `${path}.outputs`);
    requireNonEmptyStringArray(errors, role.prohibited, `${path}.prohibited`);

    if (role.id) {
      roleIds.add(role.id);
    }
  });

  for (const roleId of GUIDED_GOAL_HANDOFF_ROLE_IDS) {
    if (!roleIds.has(roleId)) {
      errors.push(`roles must include ${roleId}`);
    }
  }
}

function validateTasks(errors, tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    errors.push('tasks must be a non-empty array');
    return;
  }

  const roleIds = new Set(GUIDED_GOAL_HANDOFF_ROLE_IDS);
  const taskIds = new Set();

  tasks.forEach((task, index) => {
    const path = `tasks[${index}]`;

    if (!isPlainObject(task)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, task.id, `${path}.id`);
    requireNonEmptyString(errors, task.name, `${path}.name`);
    requireNonEmptyString(errors, task.titleZh, `${path}.titleZh`);
    requireNonEmptyString(errors, task.role, `${path}.role`);
    requireNonEmptyStringArray(errors, task.scope, `${path}.scope`);
    requireNonEmptyStringArray(errors, task.risks, `${path}.risks`);
    requireNonEmptyStringArray(errors, task.acceptance, `${path}.acceptance`);
    requireNonEmptyStringArray(errors, task.prohibited, `${path}.prohibited`);
    requireNonEmptyStringArray(errors, task.verification, `${path}.verification`);
    requireNonEmptyString(errors, task.evidencePath, `${path}.evidencePath`);
    requireNonEmptyString(errors, task.reviewGate, `${path}.reviewGate`);

    if (Array.isArray(task.dependsOn) === false) {
      errors.push(`${path}.dependsOn must be an array`);
    } else {
      for (const dependency of task.dependsOn) {
        if (typeof dependency !== 'string' || dependency.trim() === '') {
          errors.push(`${path}.dependsOn must contain non-empty strings`);
        }
      }
    }

    if (task.id) {
      taskIds.add(task.id);
    }

    if (task.role && !roleIds.has(task.role)) {
      errors.push(`${path}.role must be one of ${Array.from(roleIds).join(', ')}`);
    }
  });

  for (const task of tasks) {
    if (!isPlainObject(task) || !Array.isArray(task.dependsOn)) continue;

    for (const dependency of task.dependsOn) {
      if (!taskIds.has(dependency)) {
        errors.push(`${task.id}.dependsOn references unknown task ${dependency}`);
      }
    }
  }
}

function validateCommands(errors, commands) {
  if (!isPlainObject(commands)) {
    errors.push('commands must be a plain object');
    return;
  }

  if (commands.copyOnly !== true) {
    errors.push('commands.copyOnly must be true');
  }

  if (!Array.isArray(commands.blocks) || commands.blocks.length === 0) {
    errors.push('commands.blocks must be a non-empty array');
    return;
  }

  const blockIds = new Set();

  commands.blocks.forEach((block, index) => {
    const path = `commands.blocks[${index}]`;

    if (!isPlainObject(block)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    for (const field of FORBIDDEN_COMMAND_BLOCK_FIELDS) {
      if (Object.hasOwn(block, field)) {
        errors.push(`${path}.${field} is not allowed in copy-only command blocks`);
      }
    }

    requireNonEmptyString(errors, block.id, `${path}.id`);
    requireNonEmptyString(errors, block.title, `${path}.title`);
    requireNonEmptyStringArray(errors, block.commands, `${path}.commands`);

    if (block.copyOnly !== true) {
      errors.push(`${path}.copyOnly must be true`);
    }

    if (block.id) {
      blockIds.add(block.id);
    }
  });

  for (const blockId of GUIDED_GOAL_HANDOFF_COMMAND_BLOCK_IDS) {
    if (!blockIds.has(blockId)) {
      errors.push(`commands.blocks must include ${blockId}`);
    }
  }
}

function validateReviewModel(errors, reviewModel) {
  if (!isPlainObject(reviewModel)) {
    errors.push('reviewModel must be a plain object');
    return;
  }

  if (reviewModel.contextIsolation !== true) {
    errors.push('reviewModel.contextIsolation must be true');
  }

  if (reviewModel.workerSelfCheckIsFinal !== false) {
    errors.push('reviewModel.workerSelfCheckIsFinal must be false');
  }

  requireNonEmptyStringArray(errors, reviewModel.allowedStatuses, 'reviewModel.allowedStatuses');
  requireNonEmptyStringArray(errors, reviewModel.requirements, 'reviewModel.requirements');

  if (Array.isArray(reviewModel.allowedStatuses)) {
    for (const status of ['APPROVED', 'NEEDS_REVISION']) {
      if (!reviewModel.allowedStatuses.includes(status)) {
        errors.push(`reviewModel.allowedStatuses must include ${status}`);
      }
    }
  }
}

function validateObjectArray(errors, value, path, requiredFields) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;

    if (!isPlainObject(entry)) {
      errors.push(`${entryPath} must be a plain object`);
      return;
    }

    for (const field of requiredFields) {
      requireNonEmptyString(errors, entry[field], `${entryPath}.${field}`);
    }
  });
}

function requireExactString(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${expected}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireNonEmptyStringArray(errors, value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty string array`);
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
