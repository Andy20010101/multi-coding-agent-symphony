import { basename, join, resolve } from 'node:path';

import { ArtifactStore } from '../artifact-store.js';
import { NodeProcessRunner } from '../process-runner.js';
import { analyzeCi } from './ci-analyzer.js';
import {
  riskSeverityRank,
  summarizeRiskCounts,
  validateIntakeSummaryArtifact,
  validateProjectContextArtifact
} from './intake-contracts.js';
import { analyzeDocs } from './docs-analyzer.js';
import { collectFileInventory } from './file-inventory.js';
import { analyzeGit } from './git-analyzer.js';
import { runGrillMeDocsProvider } from './grill-me-docs-provider.js';
import { analyzePackage } from './package-analyzer.js';
import { buildWorkflowHints } from './workflow-hints.js';

export const PROJECT_INTAKE_TASK_ID = 'project-intake';
export const PROJECT_CONTEXT_ARTIFACT_ID = 'project-context';
export const INTAKE_SUMMARY_ARTIFACT_ID = 'intake-summary';

export async function runProjectIntake({
  projectDir = '.',
  artifactDirectory,
  eventDirectory,
  sessionId = 'mcas-cli',
  provider = 'builtin',
  providerCommand = 'grill-me-docs',
  requireProvider = false,
  failOn,
  runner = new NodeProcessRunner(),
  now = new Date()
}) {
  if (artifactDirectory === undefined) {
    throw new TypeError('artifactDirectory is required');
  }

  if (!['builtin', 'grill-me-docs'].includes(provider)) {
    throw new TypeError('provider must be one of: builtin, grill-me-docs');
  }

  const root = resolve(projectDir);
  const generatedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const inventory = await collectFileInventory({ projectDir: root });
  const packageAnalysis = await analyzePackage({ projectDir: root, inventory });
  const ci = await analyzeCi({ projectDir: root, inventory });
  const docs = await analyzeDocs({
    projectDir: root,
    inventory,
    runtime: packageAnalysis.runtime,
    ci
  });
  const git = await analyzeGit({ projectDir: root, runner });
  const providerResult = provider === 'grill-me-docs'
    ? await runGrillMeDocsProvider({
        projectDir: root,
        providerCommand,
        runner
      })
    : {
        name: 'builtin',
        status: 'completed',
        modelInvocation: false,
        risks: [],
        openQuestions: [],
        constraints: []
      };

  if (requireProvider && providerResult.status === 'unavailable') {
    return {
      requiredProviderUnavailable: true,
      providerResult
    };
  }

  const risks = reindexItems([...docs.risks, ...providerResult.risks], 'risk');
  const openQuestions = reindexItems([...docs.openQuestions, ...providerResult.openQuestions], 'question');
  const constraints = reindexItems([...docs.constraints, ...providerResult.constraints], 'constraint');
  const workflowHints = buildWorkflowHints({
    inventory,
    runtime: packageAnalysis.runtime,
    documentation: docs.documentation,
    risks,
    openQuestions,
    packageJson: packageAnalysis.packageJson
  });
  const status = shouldFailOnRisk({ risks, failOn }) ? 'failed' : 'passed';
  const exitCode = status === 'passed' ? 0 : 70;
  const context = {
    version: '1',
    kind: 'project-context',
    schema: 'project-context.v1',
    generatedAt,
    project: {
      root,
      name: basename(root),
      git
    },
    inventory: {
      docs: inventory.docs,
      configFiles: inventory.configFiles,
      ciFiles: inventory.ciFiles,
      sourceRoots: inventory.sourceRoots,
      ignoredRoots: inventory.ignoredRoots,
      truncated: inventory.truncated,
      limits: inventory.limits
    },
    documentation: docs.documentation,
    runtime: packageAnalysis.runtime,
    ci,
    constraints,
    risks,
    openQuestions,
    workflowHints,
    provider: {
      name: providerResult.name,
      status: providerResult.status,
      modelInvocation: false,
      ...(providerResult.note ? { note: providerResult.note } : {}),
      ...(providerResult.exitCode !== undefined ? { exitCode: providerResult.exitCode } : {})
    }
  };
  const summary = {
    version: '1',
    kind: 'intake-summary',
    schema: 'intake-summary.v1',
    status,
    riskCounts: summarizeRiskCounts(risks),
    openQuestionCount: openQuestions.length,
    recommendedWorkflow: workflowHints.recommendedMode,
    verificationCommands: workflowHints.verificationCommands,
    modelInvocation: false,
    providerStatus: provider === 'builtin' ? 'builtin' : providerResult.status
  };

  validateProjectContextArtifact(context);
  validateIntakeSummaryArtifact(summary);

  const store = new ArtifactStore(artifactDirectory);

  await store.writeArtifact(PROJECT_INTAKE_TASK_ID, PROJECT_CONTEXT_ARTIFACT_ID, context);
  await store.writeArtifact(PROJECT_INTAKE_TASK_ID, INTAKE_SUMMARY_ARTIFACT_ID, summary);

  const contextArtifactPath = join(
    artifactDirectory,
    PROJECT_INTAKE_TASK_ID,
    `${PROJECT_CONTEXT_ARTIFACT_ID}.json`
  );
  const summaryArtifactPath = join(
    artifactDirectory,
    PROJECT_INTAKE_TASK_ID,
    `${INTAKE_SUMMARY_ARTIFACT_ID}.json`
  );

  return {
    exitCode,
    output: {
      version: '1',
      command: 'intake',
      status,
      exitCode,
      projectDir: root,
      artifactDirectory,
      eventDirectory,
      sessionId,
      taskId: PROJECT_INTAKE_TASK_ID,
      contextArtifactId: PROJECT_CONTEXT_ARTIFACT_ID,
      summaryArtifactId: INTAKE_SUMMARY_ARTIFACT_ID,
      contextArtifactPath,
      summaryArtifactPath,
      modelInvocation: false,
      providerStatus: provider === 'builtin' ? 'builtin' : providerResult.status,
      riskCounts: summary.riskCounts,
      openQuestionCount: summary.openQuestionCount,
      recommendedWorkflow: summary.recommendedWorkflow,
      verificationCommands: summary.verificationCommands
    },
    context,
    summary
  };
}

function shouldFailOnRisk({ risks, failOn }) {
  if (failOn === undefined) {
    return false;
  }

  const threshold = riskSeverityRank(failOn);

  return risks.some((risk) => riskSeverityRank(risk.severity) >= threshold);
}

function reindexItems(items, prefix) {
  return items.map((item, index) => ({
    ...item,
    id: `${prefix}-${String(index + 1).padStart(3, '0')}`
  }));
}
