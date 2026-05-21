export function buildWorkflowHints({ inventory, runtime, documentation, risks, openQuestions, packageJson }) {
  const verificationCommands = runtime.verificationCommands.length > 0
    ? runtime.verificationCommands
    : ['manual verification required'];
  const highUncertainty = openQuestions.length >= 5
    || risks.some((risk) => risk.severity === 'critical' || risk.severity === 'high');
  const multiplePackages = Array.isArray(packageJson?.workspaces)
    || Boolean(packageJson?.workspaces?.packages);
  const recommendedMode = recommendMode({
    highUncertainty,
    multiplePackages,
    documentation,
    verificationCommands
  });

  return {
    recommendedMode,
    recommendedAdapter: 'codex',
    verificationCommands,
    writeSetHints: buildWriteSetHints(inventory),
    preflightSummary: buildPreflightSummary({
      recommendedMode,
      verificationCommands,
      documentation
    })
  };
}

function recommendMode({ highUncertainty, multiplePackages, documentation, verificationCommands }) {
  if (highUncertainty || verificationCommands[0] === 'manual verification required') {
    return 'qa-swarm';
  }

  if (multiplePackages) {
    return 'parallel-lanes';
  }

  if (documentation.readme.present && verificationCommands.length > 0) {
    return 'writer-reviewer';
  }

  return 'linear';
}

function buildWriteSetHints(inventory) {
  const roots = inventory.sourceRoots.length > 0 ? inventory.sourceRoots : ['.'];

  return roots.map((root) => (root === '.' ? '*' : `${root}/**`));
}

function buildPreflightSummary({ recommendedMode, verificationCommands, documentation }) {
  if (!documentation.readme.present) {
    return `Use ${recommendedMode}; README is missing and verification needs extra care.`;
  }

  return `Use ${recommendedMode}; run ${verificationCommands.slice(0, 2).join(' and ')} before claiming completion.`;
}
