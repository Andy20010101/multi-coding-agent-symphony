import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { ArtifactStore } from '../artifact-store.js';
import {
  atomicWriteJson,
  readLatestRun,
  symphonyStatePaths
} from './state.js';

export const DEFAULT_STAGE_ID = 'v14-stage-kernel-refactor';
export const DEFAULT_STAGE_DOCS_DIR = 'docs/stages';

const STAGE_CONTRACT = Object.freeze({
  version: '1',
  kind: 'symphony.stage-charter',
  contractName: 'symphony.stage-charter',
  contractVersion: '1.0'
});

const BOUNDARY_CHECK_PASS = Object.freeze({
  status: 'passed',
  riskLevel: 'low',
  goalRelation: 'serves-current-stage',
  nonGoalViolations: [],
  boundaryViolations: []
});

export function stageDocumentPaths({
  stageId = DEFAULT_STAGE_ID,
  docsDir = DEFAULT_STAGE_DOCS_DIR
} = {}) {
  assertSafeStageId(stageId);

  return {
    stageId,
    charterPath: join(docsDir, `${stageId}.stage.json`),
    htmlPath: join(docsDir, `${stageId}.html`)
  };
}

export function defaultStageCharter({
  stageId = DEFAULT_STAGE_ID,
  createdAt = '2026-05-26T00:00:00.000Z'
} = {}) {
  assertSafeStageId(stageId);

  const charter = {
    ...STAGE_CONTRACT,
    stageId,
    title: 'v14 Stage Kernel Refactor',
    goal: 'Upgrade Symphony from prompt/workflow/run-driven orchestration into a Stage-aware wrapper kernel.',
    goals: [
      '把 Symphony 从 prompt / workflow / run 驱动，升级成 Stage 驱动的项目推进内核。',
      'Make existing do/review/verify/adopt/diagnose/console flows Stage-aware without replacing the kernel.'
    ],
    status: 'active',
    owner: 'writer',
    createdAt,
    updatedAt: createdAt,
    nonGoals: [
      'Do not change v12 verified adoption apply safety semantics.',
      'Do not add browser write controls.',
      'Do not migrate Workbench to React or Vite in v14.',
      'Do not implement full Autopilot or Agent Capability Registry.',
      'Do not make .symphony replace ArtifactStore.'
    ],
    boundaries: [
      {
        id: 'wrapper-first',
        title: 'Wrapper-first Stage kernel',
        rule: 'Stage behavior wraps existing scan/do/review/verify/adopt flows instead of replacing the kernel.'
      },
      {
        id: 'v12-adoption-safety',
        title: 'Preserve v12 adoption safety',
        rule: 'Adoption keeps isolated workspace, frozen plan, verifier gate, frozen patch, fingerprint checks, git apply --check, and confirmation journal behavior.'
      },
      {
        id: 'workbench-read-only',
        title: 'Workbench remains read-only',
        rule: 'Workbench may display and copy commands, but must not add write, retry, adopt, delete, rollback, or browser-execute controls.'
      }
    ],
    tasks: [
      {
        id: 'charter-contract',
        title: 'Add Stage Charter JSON and generated HTML support',
        status: 'planned'
      },
      {
        id: 'local-state',
        title: 'Persist active Stage runtime state under .symphony/stages',
        status: 'planned'
      },
      {
        id: 'cli',
        title: 'Add Stage CLI commands and advisory next command',
        status: 'planned'
      },
      {
        id: 'run-binding',
        title: 'Bind do/review/verify runs to active Stage',
        status: 'planned'
      },
      {
        id: 'gate',
        title: 'Block writes/executions/adoption confirm when the Stage Charter is inconsistent',
        status: 'planned'
      },
      {
        id: 'workbench',
        title: 'Show current Stage overview in Workbench without write controls',
        status: 'planned'
      },
      {
        id: 'evidence',
        title: 'Add tests and v14 release evidence',
        status: 'planned'
      }
    ],
    risks: [
      {
        id: 'adoption-regression',
        severity: 'high',
        title: 'v12 adoption safety regression',
        mitigation: 'Keep adoption apply logic intact and add only wrapper summary/gate checks before confirmation.'
      },
      {
        id: 'charter-drift',
        severity: 'medium',
        title: 'Stage JSON and HTML drift',
        mitigation: 'Treat JSON as source of truth and gate write/execution actions on deterministic HTML consistency.'
      },
      {
        id: 'workbench-write-controls',
        severity: 'medium',
        title: 'Workbench accidentally grows write controls',
        mitigation: 'Expose Stage details through GET APIs and copy-only commands only.'
      }
    ],
    evidenceRefs: [
      {
        kind: 'release-evidence',
        path: 'docs/plans/v14-release-evidence-2026-05-26.md'
      }
    ],
    verificationProfile: {
      developmentGate: [
        'node --test tests/symphony-cli.test.js',
        'pnpm check',
        'pnpm test',
        'git diff --check'
      ],
      releaseGate: [
        'node --test tests/symphony-cli.test.js',
        'pnpm check',
        'pnpm test',
        'git diff --check',
        'pnpm audit --audit-level high',
        'pnpm test:mutation:gate'
      ],
      stageSmoke: [
        'symphony stage',
        'symphony stage --json',
        'symphony stage activate v14-stage-kernel-refactor',
        'symphony stage render v14-stage-kernel-refactor',
        'symphony stage summary',
        'symphony next'
      ]
    },
    riskPolicy: {
      stageRequiredAreas: [
        'Stage kernel',
        'adoption',
        'verifier',
        'policy',
        'workspace',
        'adapter',
        'dependency changes',
        'main-worktree writes'
      ],
      autoAdoptAllowedAreas: [],
      autoAdoptForbiddenAreas: [
        'adoption kernel',
        'policy engine',
        'workspace manager',
        'verifier',
        'dependencies'
      ]
    },
    nextAction: 'symphony stage activate v14-stage-kernel-refactor',
    charterHash: null
  };

  charter.charterHash = sha256Text(JSON.stringify({
    ...charter,
    charterHash: null
  }));

  return charter;
}

export async function createStageCharter({
  stageId = DEFAULT_STAGE_ID,
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  overwrite = false,
  generatedAt = new Date().toISOString()
} = {}) {
  const paths = stageDocumentPaths({ stageId, docsDir });
  const charter = defaultStageCharter({
    stageId,
    createdAt: generatedAt
  });
  const jsonExists = await fileExists(paths.charterPath);
  const htmlExists = await fileExists(paths.htmlPath);
  const writes = [];

  if (!jsonExists || overwrite) {
    await mkdir(dirname(paths.charterPath), { recursive: true });
    await writeFile(paths.charterPath, `${JSON.stringify(charter, null, 2)}\n`, 'utf8');
    writes.push(paths.charterPath);
  }

  if (!htmlExists || overwrite) {
    await mkdir(dirname(paths.htmlPath), { recursive: true });
    await writeFile(paths.htmlPath, renderStageCharterHtml(charter), 'utf8');
    writes.push(paths.htmlPath);
  }

  return {
    stageId,
    status: writes.length === 0 ? 'exists' : 'created',
    charter,
    paths,
    writes
  };
}

export async function readStageCharter({
  stageId = DEFAULT_STAGE_ID,
  docsDir = DEFAULT_STAGE_DOCS_DIR
} = {}) {
  const paths = stageDocumentPaths({ stageId, docsDir });
  const charter = JSON.parse(await readFile(paths.charterPath, 'utf8'));

  assertStageCharter(charter, stageId);

  return {
    charter,
    paths
  };
}

export function assertStageCharter(charter, expectedStageId) {
  if (charter === null || typeof charter !== 'object' || Array.isArray(charter)) {
    throw new TypeError('stage charter must be an object');
  }

  for (const [field, value] of Object.entries(STAGE_CONTRACT)) {
    if (charter[field] !== value) {
      throw new TypeError(`stage charter ${field} must be ${value}`);
    }
  }

  assertSafeStageId(charter.stageId);

  if (expectedStageId !== undefined && charter.stageId !== expectedStageId) {
    throw new TypeError('stage charter id does not match requested stage');
  }

  for (const field of ['title', 'goal', 'status', 'nextAction', 'createdAt', 'updatedAt', 'charterHash']) {
    assertNonEmptyString(charter[field], `stage charter ${field}`);
  }

  assertStringArray(charter.goals, 'stage charter goals');
  assertStringArray(charter.nonGoals, 'stage charter nonGoals');
  assertObjectArray(charter.boundaries, 'stage charter boundaries');
  assertObjectArray(charter.tasks, 'stage charter tasks');
  assertObjectArray(charter.risks, 'stage charter risks');
  assertObject(charter.verificationProfile, 'stage charter verificationProfile');
  assertObject(charter.riskPolicy, 'stage charter riskPolicy');
  assertStringArray(charter.verificationProfile.developmentGate, 'stage charter verificationProfile.developmentGate');
  assertStringArray(charter.verificationProfile.releaseGate, 'stage charter verificationProfile.releaseGate');
  assertStringArray(charter.verificationProfile.stageSmoke, 'stage charter verificationProfile.stageSmoke');
  assertStringArray(charter.riskPolicy.stageRequiredAreas, 'stage charter riskPolicy.stageRequiredAreas');
  assertStringArray(charter.riskPolicy.autoAdoptAllowedAreas, 'stage charter riskPolicy.autoAdoptAllowedAreas');
  assertStringArray(charter.riskPolicy.autoAdoptForbiddenAreas, 'stage charter riskPolicy.autoAdoptForbiddenAreas');

  for (const boundary of charter.boundaries) {
    assertNonEmptyString(boundary.id, 'stage boundary id');
    assertNonEmptyString(boundary.title, 'stage boundary title');
    assertNonEmptyString(boundary.rule, 'stage boundary rule');
  }

  for (const task of charter.tasks) {
    assertNonEmptyString(task.id, 'stage task id');
    assertNonEmptyString(task.title, 'stage task title');
    assertNonEmptyString(task.status, 'stage task status');
  }

  for (const risk of charter.risks) {
    assertNonEmptyString(risk.id, 'stage risk id');
    assertNonEmptyString(risk.severity, 'stage risk severity');
    assertNonEmptyString(risk.title, 'stage risk title');
  }
}

export function renderStageCharterHtml(charter) {
  assertStageCharter(charter, charter.stageId);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(charter.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fa;
      --panel: #ffffff;
      --text: #20242c;
      --muted: #5f6b7a;
      --line: #d8dee8;
      --accent: #0b6b57;
      --accent-soft: #e4f3ee;
      --warn: #9b6b1f;
      --warn-soft: #fff5dc;
      --danger: #a53d2d;
      --danger-soft: #fae8e4;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }
    main {
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 36px;
    }
    header {
      margin-bottom: 18px;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 26px; font-weight: 700; }
    h2 { margin: 0 0 10px; font-size: 16px; }
    h3 { margin: 0 0 6px; color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .subtitle {
      margin-top: 8px;
      color: var(--muted);
      line-height: 1.45;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
    }
    .badge.active, .badge.low, .badge.planned { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .badge.medium { border-color: var(--warn); background: var(--warn-soft); color: var(--warn); }
    .badge.high { border-color: var(--danger); background: var(--danger-soft); color: var(--danger); }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
      gap: 16px;
      align-items: start;
    }
    .stack { display: grid; gap: 16px; }
    section {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 16px;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li { margin: 8px 0; line-height: 1.45; }
    .item {
      border-top: 1px solid var(--line);
      padding-top: 10px;
      margin-top: 10px;
    }
    .item:first-of-type {
      border-top: 0;
      padding-top: 0;
      margin-top: 0;
    }
    code {
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }
    @media (max-width: 820px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(charter.title)}</h1>
      <p class="subtitle">${escapeHtml(charter.goal)}</p>
      <div class="meta">
        <span class="badge ${escapeHtml(charter.status)}">${escapeHtml(charter.status)}</span>
        <span class="badge">${escapeHtml(charter.stageId)}</span>
        <span class="badge">JSON source of truth</span>
      </div>
    </header>
    <div class="grid">
      <div class="stack">
        <section>
          <h2>Boundaries</h2>
          ${renderObjectItems(charter.boundaries, (boundary) => `
            <div class="item">
              <h3>${escapeHtml(boundary.id)}</h3>
              <p><strong>${escapeHtml(boundary.title)}</strong></p>
              <p class="subtitle">${escapeHtml(boundary.rule)}</p>
            </div>`)}
        </section>
        <section>
          <h2>Tasks</h2>
          ${renderObjectItems(charter.tasks, (task) => `
            <div class="item">
              <h3>${escapeHtml(task.id)}</h3>
              <p><strong>${escapeHtml(task.title)}</strong> <span class="badge ${escapeHtml(task.status)}">${escapeHtml(task.status)}</span></p>
            </div>`)}
        </section>
      </div>
      <div class="stack">
        <section>
          <h2>Top Risks</h2>
          ${renderObjectItems(charter.risks, (risk) => `
            <div class="item">
              <h3>${escapeHtml(risk.id)}</h3>
              <p><strong>${escapeHtml(risk.title)}</strong> <span class="badge ${escapeHtml(risk.severity)}">${escapeHtml(risk.severity)}</span></p>
              <p class="subtitle">${escapeHtml(risk.mitigation ?? '')}</p>
            </div>`)}
        </section>
        <section>
          <h2>Non-Goals</h2>
          <ul>${charter.nonGoals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join('')}</ul>
        </section>
        <section>
          <h2>Next Action</h2>
          <code>${escapeHtml(charter.nextAction)}</code>
        </section>
      </div>
    </div>
  </main>
</body>
</html>
`;
}

export async function checkStageCharterConsistency({
  stageId = DEFAULT_STAGE_ID,
  docsDir = DEFAULT_STAGE_DOCS_DIR
} = {}) {
  const paths = stageDocumentPaths({ stageId, docsDir });
  const errors = [];
  let charter = null;
  let expectedHtml = null;
  let actualHtml = null;
  let charterHash = null;
  let htmlHash = null;

  try {
    const content = await readFile(paths.charterPath, 'utf8');
    charterHash = sha256Text(content);
    charter = JSON.parse(content);
    assertStageCharter(charter, stageId);
    expectedHtml = renderStageCharterHtml(charter);
  } catch (error) {
    errors.push({
      code: 'stage-charter-invalid',
      message: error.message,
      path: paths.charterPath
    });
  }

  try {
    actualHtml = await readFile(paths.htmlPath, 'utf8');
    htmlHash = sha256Text(actualHtml);
  } catch (error) {
    if (error.code === 'ENOENT') {
      errors.push({
        code: 'stage-charter-html-missing',
        message: 'Stage Charter HTML is missing',
        path: paths.htmlPath
      });
    } else {
      errors.push({
        code: 'stage-charter-html-unreadable',
        message: error.message,
        path: paths.htmlPath
      });
    }
  }

  if (expectedHtml !== null && actualHtml !== null && expectedHtml !== actualHtml) {
    errors.push({
      code: 'stage-charter-html-mismatch',
      message: 'Stage Charter HTML does not match generated JSON rendering',
      path: paths.htmlPath
    });
  }

  return {
    status: errors.length === 0 ? 'passed' : 'failed',
    stageId,
    paths,
    charter,
    expectedHtml,
    actualHtml,
    hashes: {
      charterHash,
      htmlHash,
      expectedHtmlHash: expectedHtml === null ? null : sha256Text(expectedHtml)
    },
    errors
  };
}

export async function renderStageCharterFile({
  stageId = DEFAULT_STAGE_ID,
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  write = false
} = {}) {
  const { charter, paths } = await readStageCharter({ stageId, docsDir });
  const html = renderStageCharterHtml(charter);
  const exists = await fileExists(paths.htmlPath);

  if (!exists || write) {
    await mkdir(dirname(paths.htmlPath), { recursive: true });
    await writeFile(paths.htmlPath, html, 'utf8');
  }

  return {
    stageId,
    status: !exists ? 'generated' : write ? 'written' : 'preview',
    runtimeWrites: !exists || write,
    paths,
    html
  };
}

export async function readLatestStageState({ stateDir = '.symphony' } = {}) {
  return await readJsonIfExists(symphonyStatePaths({ stateDir }).latestStagePath);
}

export async function readStageState({
  stateDir = '.symphony',
  stageId
} = {}) {
  assertSafeStageId(stageId);

  return await readJsonIfExists(symphonyStatePaths({ stateDir, stageId }).stagePath);
}

export async function activateStage({
  stateDir = '.symphony',
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  stageId = DEFAULT_STAGE_ID,
  activatedAt = new Date().toISOString()
} = {}) {
  const consistency = await checkStageCharterConsistency({ stageId, docsDir });

  if (consistency.charter === null) {
    throw new TypeError(consistency.errors[0]?.message ?? 'stage charter is invalid');
  }

  const previous = await readStageState({ stateDir, stageId });
  const state = {
    version: '1',
    kind: 'symphony-stage-state',
    stageId,
    status: consistency.status === 'passed' ? 'active' : 'attention',
    active: true,
    charterPath: consistency.paths.charterPath,
    htmlPath: consistency.paths.htmlPath,
    charterHash: consistency.hashes.charterHash,
    htmlHash: consistency.hashes.htmlHash,
    consistency: compactConsistency(consistency),
    blocker: previous?.blocker ?? null,
    gateEvents: Array.isArray(previous?.gateEvents) ? previous.gateEvents : [],
    blockedSnapshot: compactBlockedSnapshot(previous?.blockedSnapshot),
    blockedSnapshotRef: previous?.blockedSnapshotRef ?? previous?.blocker?.blockedSnapshotRef ?? null,
    repairArtifactRef: previous?.repairArtifactRef ?? previous?.blocker?.repairArtifactRef ?? null,
    repairArtifactPath: previous?.repairArtifactPath ?? null,
    activatedAt: previous?.activatedAt ?? activatedAt,
    updatedAt: activatedAt
  };

  await writeStageState({
    stateDir,
    state,
    makeLatest: true
  });

  return {
    stageId,
    status: state.status,
    state,
    consistency
  };
}

export async function buildStageCommandSummary({
  stateDir = '.symphony',
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  stageId,
  command = 'symphony stage'
} = {}) {
  const latestState = await readLatestStageState({ stateDir });
  const selectedStageId = stageId ?? latestState?.stageId ?? DEFAULT_STAGE_ID;
  const state = stageId === undefined ? latestState : await readStageState({ stateDir, stageId });
  const consistency = await checkStageCharterConsistency({
    stageId: selectedStageId,
    docsDir
  }).catch((error) => ({
    status: 'failed',
    stageId: selectedStageId,
    paths: stageDocumentPaths({ stageId: selectedStageId, docsDir }),
    charter: null,
    hashes: {},
    errors: [{
      code: 'stage-summary-error',
      message: error.message
    }]
  }));
  const charter = consistency.charter;
  const compactCharter = charter === null ? null : compactStageCharter(charter);
  const status = state?.blocker
    ? 'blocked'
    : state?.status ?? (charter === null ? 'missing' : 'available');
  const nextAction = buildStageNextAction({
    state,
    charter,
    stageId: selectedStageId,
    consistency
  });

  return {
    version: '1',
    command,
    intent: 'stage',
    semanticCommand: 'stage',
    pipeline: ['stage'],
    safetyMode: 'read-only',
    projectWrites: false,
    runtimeWrites: false,
    externalCalls: false,
    destructiveWrites: false,
    status,
    stageId: selectedStageId,
    active: state?.active === true,
    activeStage: state?.active === true ? compactCharter : null,
    stage: compactCharter,
    goal: charter?.goal,
    topRisks: topStageRisks(charter),
    blocker: state?.blocker ?? null,
    blockedSnapshot: state?.blockedSnapshot ?? null,
    blockedSnapshotRef: state?.blockedSnapshotRef ?? state?.blocker?.blockedSnapshotRef ?? null,
    repairArtifactRef: state?.repairArtifactRef ?? state?.blocker?.repairArtifactRef ?? null,
    repairArtifactPath: state?.repairArtifactPath ?? null,
    stageGateEventArtifactPath: state?.blocker?.gateEventPath ?? null,
    charterRepairPlanArtifactPath: state?.repairArtifactPath ?? null,
    blockedSnapshotArtifactPath: state?.blocker?.blockedSnapshotPath ?? null,
    gateEvents: Array.isArray(state?.gateEvents) ? state.gateEvents : [],
    consistency: compactConsistency(consistency),
    stageCharterArtifactPath: consistency.paths.charterPath,
    stageCharterHtmlArtifactPath: consistency.paths.htmlPath,
    nextAction
  };
}

export async function buildStageBinding({
  stateDir = '.symphony',
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  explicitStageId,
  noStage = false,
  taskId = null
} = {}) {
  if (noStage) {
    return {
      stageBinding: buildUnboundStageBinding({
        bindingSource: 'no-stage',
        taskId
      }),
      consistency: null,
      stageState: null
    };
  }

  const latestState = await readLatestStageState({ stateDir });
  const stageId = explicitStageId ?? latestState?.stageId;

  if (!stageId) {
    return {
      stageBinding: buildUnboundStageBinding({
        bindingSource: 'no-active-stage',
        taskId
      }),
      consistency: null,
      stageState: null
    };
  }

  assertSafeStageId(stageId);

  const consistency = await checkStageCharterConsistency({ stageId, docsDir });
  const boundaryCheck = consistency.status === 'passed'
    ? { ...BOUNDARY_CHECK_PASS, nonGoalViolations: [], boundaryViolations: [] }
    : {
        status: 'failed',
        riskLevel: 'high',
        goalRelation: 'unknown',
        nonGoalViolations: [],
        boundaryViolations: consistency.errors.map((error) => ({
          code: error.code,
          message: error.message,
          path: error.path
        }))
      };

  return {
    stageBinding: {
      stageId,
      bindingSource: explicitStageId ? 'explicit-stage' : 'active-stage',
      taskId,
      boundaryCheck
    },
    consistency,
    stageState: latestState?.stageId === stageId
      ? latestState
      : await readStageState({ stateDir, stageId })
  };
}

export async function enforceStageConsistencyGate({
  stateDir = '.symphony',
  docsDir = DEFAULT_STAGE_DOCS_DIR,
  explicitStageId,
  noStage = false,
  taskId = null,
  action,
  attemptedCommand,
  projectState,
  highRisk = false,
  now = new Date().toISOString()
} = {}) {
  const binding = await buildStageBinding({
    stateDir,
    docsDir,
    explicitStageId,
    noStage,
    taskId
  });

  if (binding.stageBinding === null) {
    return {
      blocked: false,
      stageBinding: null,
      stageGate: null
    };
  }

  if (binding.consistency === null) {
    return {
      blocked: false,
      stageBinding: binding.stageBinding,
      stageGate: {
        status: 'not-run',
        stageId: binding.stageBinding.stageId,
        action,
        checkedAt: now,
        reason: binding.stageBinding.bindingSource
      }
    };
  }

  if (binding.consistency.status === 'passed') {
    const resolved = await clearStageBlockerAfterPassedGate({
      stateDir,
      stageId: binding.stageBinding.stageId,
      consistency: binding.consistency,
      action,
      attemptedCommand,
      projectState,
      highRisk,
      now
    });

    if (resolved?.snapshotMismatch) {
      return {
        blocked: true,
        stageBinding: binding.stageBinding,
        stageGate: {
          status: 'blocked',
          stageId: binding.stageBinding.stageId,
          action,
          checkedAt: now,
          reason: 'stage-blocked-snapshot-mismatch',
          normalRunCreated: false,
          expectedBlockedAction: resolved.expectedBlockedAction,
          currentBlockedAction: resolved.currentBlockedAction,
          ...(Array.isArray(resolved.mismatches) ? { mismatches: resolved.mismatches } : {})
        },
        blocker: resolved.blocker,
        repairArtifactPath: resolved.blocker?.repairArtifactPath
      };
    }

    return {
      blocked: false,
      stageBinding: binding.stageBinding,
      stageGate: {
        status: 'passed',
        stageId: binding.stageBinding.stageId,
        action,
        checkedAt: now,
        ...(resolved?.gateEventPath ? { resolvedGateEventPath: resolved.gateEventPath } : {}),
        ...(resolved?.gateEvent ? { resolvedGateEventId: resolved.gateEvent.gateEventId } : {})
      }
    };
  }

  const failure = await recordStageGateFailure({
    stateDir,
    docsDir,
    binding,
    action,
    attemptedCommand,
    projectState,
    highRisk,
    now
  });

  return {
    blocked: true,
    stageBinding: binding.stageBinding,
    stageGate: failure.gateEvent,
    blocker: failure.blocker,
    blockedSnapshot: failure.blockedSnapshot,
    repairArtifactPath: failure.repairArtifactPath,
    gateEventPath: failure.gateEventPath
  };
}

export function buildStageAdoptionSummary({ stageBinding, sourceRun, plan } = {}) {
  const binding = stageBinding ?? sourceRun?.stageBinding ?? plan?.stageBinding;

  if (!binding?.stageId) {
    return null;
  }

  return {
    version: '1',
    kind: 'symphony.stage-adoption-summary',
    behavior: 'summary-only',
    v12ApplyLogicChanged: false,
    stageId: binding.stageId,
    bindingSource: binding.bindingSource,
    sourceRunId: sourceRun?.runId ?? plan?.sourceRunId,
    adoptionPlanId: plan?.adoptionId,
    note: 'Stage metadata wraps the adoption summary without changing frozen v12 adoption apply behavior.'
  };
}

async function recordStageGateFailure({
  stateDir,
  docsDir,
  binding,
  action,
  attemptedCommand,
  projectState,
  highRisk,
  now
}) {
  const stageId = binding.stageBinding.stageId;
  const gateEventId = `stage-gate-${Date.now().toString(36)}-${process.pid.toString(36)}`;
  const paths = symphonyStatePaths({ stateDir, stageId, gateEventId });
  const artifacts = stageGateArtifactRefs({
    stateDir,
    stageId,
    gateEventId
  });
  const latestRun = await readLatestRun({ stateDir });
  const repairArtifactRef = buildStageArtifactRef({
    kind: 'charter-repair-plan',
    taskId: artifacts.taskId,
    artifactId: artifacts.repairArtifactId,
    path: artifacts.repairArtifactPath
  });
  const blockedSnapshotRef = buildStageArtifactRef({
    kind: 'blocked-snapshot',
    taskId: artifacts.taskId,
    artifactId: artifacts.blockedSnapshotArtifactId,
    path: artifacts.blockedSnapshotArtifactPath
  });
  const blockedAction = buildStageBlockedAction({
    action,
    attemptedCommand,
    stageId,
    highRisk
  });
  const frozenRefs = await buildFrozenRefs({
    stateDir,
    action,
    latestRun,
    repairPlanRef: repairArtifactRef,
    blockedSnapshotRef
  });
  const frozenProjectState = normalizeProjectState({ projectState, latestRun });
  const blockedSnapshot = {
    version: '1',
    kind: 'symphony.stage-blocked-snapshot',
    gateId: gateEventId,
    stageId,
    stageCharterJsonHash: binding.consistency.hashes.charterHash,
    stageCharterHtmlHashAtBlock: binding.consistency.hashes.htmlHash,
    blockedAction,
    action,
    attemptedCommand,
    highRisk,
    projectState: frozenProjectState,
    frozenRefs,
    blockedReason: 'stage-charter-consistency-mismatch',
    latestRun: latestRun === null
      ? null
      : {
          runId: latestRun.runId,
          command: latestRun.command,
          status: latestRun.status,
          updatedAt: latestRun.updatedAt
        },
    consistency: compactConsistency(binding.consistency),
    identity: stageSnapshotIdentity({
      latestRun,
      stageId,
      action,
      consistency: binding.consistency
    }),
    createdAt: now
  };
  const repairPlan = {
    version: '1',
    kind: 'symphony.charter-repair-plan',
    contractName: 'symphony.charter-repair-plan',
    contractVersion: '1',
    stageId,
    gateEventId,
    attemptedCommand,
    highRisk,
    errors: binding.consistency.errors,
    artifactRef: repairArtifactRef,
    blockedSnapshotRef,
    recommendedSteps: [
      `symphony stage render ${stageId} --write`,
      `symphony stage activate ${stageId}`,
      'Rerun the blocked action after reviewing the repaired Stage Charter HTML.'
    ],
    createdAt: now
  };
  const gateEvent = {
    version: '1',
    kind: 'symphony.stage-gate-event',
    contractName: 'symphony.stage-gate-event',
    contractVersion: '1',
    gateEventId,
    stageId,
    action,
    attemptedCommand,
    highRisk,
    status: 'blocked',
    reason: 'stage-charter-inconsistent',
    normalRunCreated: false,
    consistency: compactConsistency(binding.consistency),
    stageBinding: binding.stageBinding,
    blockedSnapshotRef,
    repairArtifactRef,
    blockedSnapshotPath: blockedSnapshotRef.path,
    repairArtifactPath: repairArtifactRef.path,
    createdAt: now
  };
  const blocker = {
    status: 'blocked',
    reason: 'stage-charter-inconsistent',
    action,
    attemptedCommand,
    highRisk,
    gateEventId,
    gateEventPath: paths.stageGateEventPath,
    repairArtifactRef,
    blockedSnapshotRef,
    repairArtifactPath: repairArtifactRef.path,
    blockedSnapshotPath: blockedSnapshotRef.path,
    createdAt: now
  };
  const previous = await readStageState({ stateDir, stageId }).catch(() => null);
  const stageState = {
    version: '1',
    kind: 'symphony-stage-state',
    stageId,
    status: 'blocked',
    active: previous?.active ?? true,
    charterPath: binding.consistency.paths.charterPath,
    htmlPath: binding.consistency.paths.htmlPath,
    charterHash: binding.consistency.hashes.charterHash,
    htmlHash: binding.consistency.hashes.htmlHash,
    consistency: compactConsistency(binding.consistency),
    blocker,
    gateEvents: [
      ...(Array.isArray(previous?.gateEvents) ? previous.gateEvents.slice(-19) : []),
      gateEvent
    ],
    blockedSnapshot: compactBlockedSnapshot(blockedSnapshot),
    blockedSnapshotRef,
    repairArtifactRef,
    repairArtifactPath: repairArtifactRef.path,
    activatedAt: previous?.activatedAt ?? now,
    updatedAt: now
  };

  const artifactStore = new ArtifactStore(artifacts.artifactRoot);

  await artifactStore.writeArtifact(artifacts.taskId, artifacts.repairArtifactId, repairPlan);
  await artifactStore.writeArtifact(artifacts.taskId, artifacts.blockedSnapshotArtifactId, blockedSnapshot);
  await atomicWriteJson(paths.stageGateEventPath, gateEvent);
  await writeStageState({
    stateDir,
    state: stageState,
    makeLatest: previous?.active !== false
  });

  return {
    blocker,
    blockedSnapshot: compactBlockedSnapshot(blockedSnapshot),
    gateEvent,
    repairArtifactPath: repairArtifactRef.path,
    gateEventPath: paths.stageGateEventPath
  };
}

async function clearStageBlockerAfterPassedGate({
  stateDir,
  stageId,
  consistency,
  action,
  attemptedCommand,
  projectState,
  highRisk,
  now
}) {
  const previous = await readStageState({ stateDir, stageId });

  if (previous === null) {
    return null;
  }

  if (previous.blocker === null && previous.status === 'active') {
    return null;
  }

  let resolvedGateEvent = null;
  let resolvedGateEventPath;

  if (previous.blocker !== null) {
    const currentBlockedAction = buildStageBlockedAction({
      action,
      attemptedCommand,
      stageId,
      highRisk
    });
    const blockedSnapshot = await readBlockedSnapshotForState({
      stateDir,
      state: previous
    });
    const latestRun = await readLatestRun({ stateDir });
    const currentFrozenRefs = await buildFrozenRefs({
      stateDir,
      action,
      latestRun,
      repairPlanRef: previous.repairArtifactRef ?? previous.blocker.repairArtifactRef ?? null,
      blockedSnapshotRef: previous.blockedSnapshotRef ?? previous.blocker.blockedSnapshotRef ?? null
    });
    const currentProjectState = normalizeProjectState({ projectState, latestRun });
    const mismatch = compareFrozenBlockedSnapshot({
      snapshot: blockedSnapshot,
      stageId,
      consistency,
      currentBlockedAction,
      currentProjectState,
      currentFrozenRefs
    });

    if (mismatch.mismatches.length > 0) {
      return {
        snapshotMismatch: true,
        blocker: previous.blocker,
        expectedBlockedAction: blockedSnapshot?.blockedAction ?? previous.blockedSnapshot?.blockedAction,
        currentBlockedAction,
        mismatches: mismatch.mismatches
      };
    }

    const gateEventId = `stage-gate-resolved-${Date.now().toString(36)}-${process.pid.toString(36)}`;
    const paths = symphonyStatePaths({ stateDir, stageId, gateEventId });

    resolvedGateEvent = {
      version: '1',
      kind: 'symphony.stage-gate-event',
      contractName: 'symphony.stage-gate-event',
      contractVersion: '1',
      gateEventId,
      stageId,
      action,
      attemptedCommand,
      highRisk,
      renewedConfirmation: highRisk === true,
      status: 'resolved',
      reason: 'stage-charter-consistent',
      previousGateEventId: previous.blocker.gateEventId,
      normalRunCreated: false,
      consistency: compactConsistency(consistency),
      blockedSnapshotRef: previous.blockedSnapshotRef ?? previous.blocker.blockedSnapshotRef ?? null,
      repairArtifactRef: previous.repairArtifactRef ?? previous.blocker.repairArtifactRef ?? null,
      createdAt: now
    };
    resolvedGateEventPath = paths.stageGateEventPath;
    await atomicWriteJson(resolvedGateEventPath, resolvedGateEvent);
  }

  const state = {
    ...previous,
    status: 'active',
    blocker: null,
    consistency: compactConsistency(consistency),
    charterHash: consistency.hashes.charterHash,
    htmlHash: consistency.hashes.htmlHash,
    gateEvents: resolvedGateEvent === null
      ? previous.gateEvents
      : [
          ...(Array.isArray(previous.gateEvents) ? previous.gateEvents.slice(-19) : []),
          resolvedGateEvent
        ],
    updatedAt: now
  };

  await writeStageState({
    stateDir,
    state,
    makeLatest: previous.active === true
  });

  return resolvedGateEvent === null
    ? null
    : {
        gateEvent: resolvedGateEvent,
        gateEventPath: resolvedGateEventPath
      };
}

async function writeStageState({ stateDir, state, makeLatest }) {
  const paths = symphonyStatePaths({ stateDir, stageId: state.stageId });

  await atomicWriteJson(paths.stagePath, state);

  if (makeLatest) {
    await atomicWriteJson(paths.latestStagePath, state);
  }

  return paths;
}

function compactConsistency(consistency) {
  return {
    status: consistency.status,
    stageId: consistency.stageId,
    charterPath: consistency.paths?.charterPath,
    htmlPath: consistency.paths?.htmlPath,
    hashes: consistency.hashes,
    errors: consistency.errors
  };
}

function buildUnboundStageBinding({ bindingSource, taskId }) {
  return {
    stageId: null,
    bindingSource,
    taskId,
    boundaryCheck: {
      status: 'not-run',
      riskLevel: 'low',
      goalRelation: 'unknown',
      nonGoalViolations: [],
      boundaryViolations: []
    }
  };
}

function compactStageCharter(charter) {
  return {
    stageId: charter.stageId,
    title: charter.title,
    goal: charter.goal,
    status: charter.status,
    nonGoals: [...charter.nonGoals],
    boundaries: structuredClone(charter.boundaries),
    tasks: structuredClone(charter.tasks),
    risks: structuredClone(charter.risks),
    evidenceRefs: Array.isArray(charter.evidenceRefs) ? structuredClone(charter.evidenceRefs) : [],
    verificationProfile: structuredClone(charter.verificationProfile),
    riskPolicy: structuredClone(charter.riskPolicy),
    nextAction: charter.nextAction
  };
}

function topStageRisks(charter) {
  if (charter === null || !Array.isArray(charter.risks)) {
    return [];
  }

  return charter.risks.slice(0, 3).map((risk) => ({
    id: risk.id,
    severity: risk.severity,
    title: risk.title,
    detail: risk.mitigation
  }));
}

function buildStageNextAction({ state, charter, stageId, consistency }) {
  if (state?.blocker) {
    return `symphony stage render ${stageId} --write`;
  }

  if (consistency.status !== 'passed') {
    return `symphony stage render ${stageId} --write`;
  }

  if (state?.active === true) {
    return 'symphony do --dry-run "inspect README"';
  }

  return charter?.nextAction ?? `symphony stage activate ${stageId}`;
}

function renderObjectItems(items, renderItem) {
  return items.length === 0
    ? '<p class="subtitle">None.</p>'
    : items.map(renderItem).join('');
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function readBlockedSnapshotForState({ state }) {
  if (state?.blockedSnapshot?.kind === 'symphony.stage-blocked-snapshot') {
    return state.blockedSnapshot;
  }

  const ref = state?.blockedSnapshotRef ?? state?.blocker?.blockedSnapshotRef;

  if (ref?.path) {
    return await readJsonIfExists(ref.path);
  }

  if (state?.blocker?.blockedSnapshotPath) {
    return await readJsonIfExists(state.blocker.blockedSnapshotPath);
  }

  return null;
}

function compareFrozenBlockedSnapshot({
  snapshot,
  stageId,
  consistency,
  currentBlockedAction,
  currentProjectState,
  currentFrozenRefs
}) {
  const mismatches = [];

  if (snapshot === null) {
    return {
      mismatches: [{
        field: 'blockedSnapshot',
        reason: 'missing'
      }]
    };
  }

  compareRequiredValue(mismatches, 'stageId', snapshot.stageId, stageId);
  compareRequiredValue(
    mismatches,
    'stageCharterJsonHash',
    snapshot.stageCharterJsonHash,
    consistency.hashes?.charterHash
  );

  if (!stageBlockedActionMatches(snapshot.blockedAction, currentBlockedAction)) {
    mismatches.push({
      field: 'blockedAction',
      reason: 'digest-mismatch',
      expected: snapshot.blockedAction,
      actual: currentBlockedAction
    });
  }

  compareProjectState(mismatches, snapshot.projectState, currentProjectState);
  compareFrozenRefs(mismatches, snapshot.frozenRefs, currentFrozenRefs);

  return { mismatches };
}

function compareProjectState(mismatches, expected = {}, actual = {}) {
  for (const field of ['gitHead', 'projectFingerprint', 'dirtyWorktreeHash']) {
    compareFrozenOptionalValue(mismatches, `projectState.${field}`, expected?.[field], actual?.[field]);
  }
}

function compareFrozenRefs(mismatches, expected = {}, actual = {}) {
  for (const [field, expectedValue] of Object.entries(expected ?? {})) {
    compareFrozenOptionalValue(mismatches, `frozenRefs.${field}`, expectedValue, actual?.[field]);
  }
}

function compareRequiredValue(mismatches, field, expected, actual) {
  if (!deepEqualStable(expected, actual)) {
    mismatches.push({
      field,
      reason: 'mismatch',
      expected,
      actual
    });
  }
}

function compareFrozenOptionalValue(mismatches, field, expected, actual) {
  if (expected === null || expected === undefined) {
    return;
  }

  if (!deepEqualStable(expected, actual)) {
    mismatches.push({
      field,
      reason: 'mismatch',
      expected,
      actual
    });
  }
}

function deepEqualStable(left, right) {
  return stableJsonStringify(left) === stableJsonStringify(right);
}

function stageSnapshotIdentity({ latestRun, stageId, action, consistency }) {
  return sha256Text(JSON.stringify({
    latestRunId: latestRun?.runId ?? null,
    latestRunUpdatedAt: latestRun?.updatedAt ?? null,
    stageId,
    action,
    charterHash: consistency.hashes.charterHash,
    htmlHash: consistency.hashes.htmlHash,
    expectedHtmlHash: consistency.hashes.expectedHtmlHash
  }));
}

function stageGateArtifactRefs({ stateDir, stageId, gateEventId }) {
  const artifactRoot = join(stateDir, 'artifacts');
  const taskId = `stage-${stageId}`;
  const repairArtifactId = `${gateEventId}-charter-repair-plan`;
  const blockedSnapshotArtifactId = `${gateEventId}-blocked-snapshot`;

  return {
    artifactRoot,
    taskId,
    repairArtifactId,
    blockedSnapshotArtifactId,
    repairArtifactPath: join(artifactRoot, taskId, `${repairArtifactId}.json`),
    blockedSnapshotArtifactPath: join(artifactRoot, taskId, `${blockedSnapshotArtifactId}.json`)
  };
}

function buildStageArtifactRef({ kind, taskId, artifactId, path }) {
  return {
    kind,
    taskId,
    artifactId,
    uri: `artifact://${taskId}/${artifactId}`,
    path
  };
}

async function buildFrozenRefs({
  stateDir,
  action,
  latestRun,
  repairPlanRef,
  blockedSnapshotRef
}) {
  const executionPlanPath = action?.planId
    ? symphonyStatePaths({ stateDir, planId: action.planId }).executionPlanPath
    : latestRun?.executionPlanArtifactPath;
  const executionPlanHash = await hashFileIfExists(executionPlanPath);
  const executionPlanRef = executionPlanPath
    ? {
        kind: 'execution-plan',
        path: executionPlanPath,
        planId: action?.planId ?? latestRun?.executionPlanId ?? null
      }
    : null;

  return {
    executionPlanHash,
    executionPlanRef,
    adoptionPatchHash: action?.adoptionPatchHash ?? latestRun?.patchHash ?? null,
    riskOverrideId: action?.overrideId ?? latestRun?.riskOverrideId ?? null,
    workspaceRef: latestRun?.sourceWorkspaceManifestPath
      ? {
          kind: 'workspace-manifest',
          path: latestRun.sourceWorkspaceManifestPath
        }
      : null,
    sourceWorkspaceFingerprint: latestRun?.sourceWorkspaceFingerprint ?? null,
    repairPlanRef,
    blockedSnapshotRef
  };
}

async function hashFileIfExists(path) {
  if (!path) {
    return null;
  }

  try {
    return sha256Text(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function normalizeProjectState({ projectState, latestRun }) {
  return {
    gitHead: projectState?.gitHead ?? latestRun?.gitHead ?? null,
    projectFingerprint: projectState?.projectFingerprint ?? latestRun?.projectFingerprint ?? null,
    dirtyWorktreeHash: projectState?.dirtyWorktreeHash ?? latestRun?.gitStatusFingerprint ?? null
  };
}

function compactBlockedSnapshot(snapshot) {
  if (snapshot === null || snapshot === undefined) {
    return null;
  }

  return {
    version: '1',
    kind: 'symphony.stage-blocked-snapshot-summary',
    gateId: snapshot.gateId,
    stageId: snapshot.stageId,
    stageCharterJsonHash: snapshot.stageCharterJsonHash,
    stageCharterHtmlHashAtBlock: snapshot.stageCharterHtmlHashAtBlock,
    blockedAction: snapshot.blockedAction === undefined
      ? undefined
      : {
          type: snapshot.blockedAction.type,
          targetId: snapshot.blockedAction.targetId,
          commandDigest: snapshot.blockedAction.commandDigest
        },
    blockedReason: snapshot.blockedReason,
    highRisk: snapshot.highRisk,
    createdAt: snapshot.createdAt
  };
}

function buildStageBlockedAction({
  action,
  attemptedCommand,
  stageId,
  highRisk
}) {
  const type = action?.kind ?? 'unknown';
  const targetId = action?.targetId
    ?? action?.planId
    ?? action?.adoptionId
    ?? action?.sourceRunId
    ?? action?.semanticCommand
    ?? null;
  const canonical = normalizeStableValue({
    version: '1',
    stageId,
    type,
    command: action?.command ?? attemptedCommand ?? null,
    subcommand: action?.subcommand ?? action?.semanticCommand ?? null,
    prompt: action?.prompt ?? null,
    flags: action?.flags ?? {},
    writeMode: action?.writeMode ?? action?.safetyMode ?? null,
    riskMode: action?.riskMode ?? (highRisk ? 'high' : 'standard'),
    safetyMode: action?.safetyMode ?? null,
    targetId,
    planId: action?.planId ?? null,
    adoptionId: action?.adoptionId ?? null,
    overrideId: action?.overrideId ?? null
  });

  return {
    type,
    targetId,
    commandDigest: sha256Text(stableJsonStringify(canonical)),
    canonical
  };
}

function stageBlockedActionMatches(expected, actual) {
  return expected?.type === actual.type
    && expected?.targetId === actual.targetId
    && expected?.commandDigest === actual.commandDigest;
}

function normalizeStableValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeStableValue);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, normalizeStableValue(entryValue)])
    );
  }

  return value;
}

function stableJsonStringify(value) {
  return JSON.stringify(normalizeStableValue(value));
}

function sha256Text(text) {
  return `sha256:${createHash('sha256').update(text).digest('hex')}`;
}

function assertSafeStageId(stageId) {
  if (typeof stageId !== 'string'
    || stageId.trim() === ''
    || stageId.includes('/')
    || stageId.includes('..')) {
    throw new TypeError('stage id must be a safe path segment');
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function assertStringArray(value, field) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === '')) {
    throw new TypeError(`${field} must be an array of non-empty strings`);
  }
}

function assertObjectArray(value, field) {
  if (!Array.isArray(value) || value.some((entry) => entry === null || typeof entry !== 'object' || Array.isArray(entry))) {
    throw new TypeError(`${field} must be an array of objects`);
  }
}

function assertObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
