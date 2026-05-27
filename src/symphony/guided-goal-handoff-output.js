import { readFile } from 'node:fs/promises';

import {
  assertGuidedGoalHandoffContract
} from './guided-goal-handoff.js';

const BUNDLED_HANDOFF_FIXTURE_URL = new URL(
  '../../fixtures/contracts/guided-goal-handoff.v1.json',
  import.meta.url
);

export async function loadGuidedGoalHandoffFixture() {
  const content = await readFile(BUNDLED_HANDOFF_FIXTURE_URL, 'utf8');
  return assertGuidedGoalHandoffContract(JSON.parse(content));
}

export function buildGuidedGoalHandoffJson(handoff) {
  return structuredClone(assertGuidedGoalHandoffContract(handoff));
}

export function renderGuidedGoalHandoffMarkdown(handoff) {
  const contract = assertGuidedGoalHandoffContract(handoff);
  const lines = [
    `# ${contract.titleZh}`,
    '',
    `Contract: ${contract.contractName}@${contract.contractVersion}`,
    `Goal: ${contract.goalId}`,
    'Mode: copy-only manual. This CLI prints JSON or Markdown only; it does not run commands, call models, write files, create branches, commit, push, or merge.',
    '',
    '## Baseline',
    '',
    `- Release tag: ${contract.baseline.releaseTag} (${contract.baseline.releaseTagCommit})`,
    `- Planning commit: ${contract.baseline.planningCommit}`,
    `- Approval commit: ${contract.baseline.approvalCommit}`,
    '- Previous evidence:',
    ...contract.baseline.previousEvidence.map((evidencePath) => `  - ${evidencePath}`),
    '',
    '## Scope',
    '',
    ...renderList(contract.scope),
    '',
    '## Non-Goals',
    '',
    ...renderList(contract.nonGoals),
    '',
    '## Safety Boundaries',
    '',
    ...renderList(contract.safetyBoundaries),
    '',
    '## Roles',
    '',
    ...contract.roles.flatMap(renderRole),
    '## Tasks',
    '',
    '| ID | Name | Role | Depends on | Evidence |',
    '| --- | --- | --- | --- | --- |',
    ...contract.tasks.map(renderTaskRow),
    '',
    '## Copy-Only Commands',
    '',
    'The command blocks below are reference text for manual copy and review. They are not executed by this CLI.',
    '',
    ...contract.commands.blocks.flatMap(renderCommandBlock),
    '## Review Model',
    '',
    `- Context isolation: ${contract.reviewModel.contextIsolation}`,
    `- Worker self-check is final: ${contract.reviewModel.workerSelfCheckIsFinal}`,
    `- Allowed statuses: ${contract.reviewModel.allowedStatuses.join(', ')}`,
    ...contract.reviewModel.requirements.map((requirement) => `- ${requirement}`),
    '',
    '## Release Gates',
    '',
    ...contract.releaseGates.map((gate) => `- ${gate.id}: ${gate.requirement} Evidence: ${gate.evidence}`),
    '',
    '## Stop Conditions',
    '',
    ...contract.stopConditions.map((condition) => `- ${condition.id}: ${condition.condition}`),
    '',
    '## Deferred Contracts',
    '',
    ...contract.deferredContracts.map((deferred) => `- ${deferred.contractName}: ${deferred.status}. ${deferred.reason}`)
  ];

  return lines.join('\n');
}

function renderList(items) {
  return items.map((item) => `- ${item}`);
}

function renderRole(role) {
  return [
    `### ${role.id}`,
    '',
    role.description,
    '',
    `- Inputs: ${role.inputs.join(', ')}`,
    `- Outputs: ${role.outputs.join(', ')}`,
    `- Prohibited: ${role.prohibited.join(', ')}`,
    ''
  ];
}

function renderTaskRow(task) {
  return [
    task.id,
    task.name,
    task.role,
    task.dependsOn.length === 0 ? 'none' : task.dependsOn.join(', '),
    task.evidencePath
  ].map(markdownTableCell).join(' | ').replace(/^/u, '| ').replace(/$/u, ' |');
}

function renderCommandBlock(block) {
  return [
    `### ${block.title}`,
    '',
    `Block ID: ${block.id}. Copy-only: ${block.copyOnly}.`,
    '',
    '```bash',
    ...block.commands,
    '```',
    ''
  ];
}

function markdownTableCell(value) {
  return String(value).replace(/\|/gu, '\\|').replace(/\n/gu, ' ');
}
