#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer as createViteServer } from 'vite';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const workbenchConfigPath = 'frontend/workbench/vite.config.js';
const supervisorSourcePath = 'frontend/workbench/src/v46SupervisorWorkbench.jsx';
const workbenchCssPath = 'frontend/workbench/src/styles/workbench.css';
const visualChecklistPath = 'docs/qa/v46-workbench-supervisor-dashboard-acceptance.md';
const originalSsrLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');

const readOnlyForbiddenPatterns = Object.freeze([
  ['<button', /<button\b/iu],
  ['<a ', /<a(?=\s|>)/iu],
  ['href=', /\bhref\s*=/iu],
  ['fetch(', /\bfetch\s*\(/u],
  ['/api', /\/api/u],
  ['<script', /<script\b/iu],
  ['onclick', /\bonclick\b/iu],
  ['role="button"', /role\s*=\s*["']button["']/iu],
  ['cursor: pointer', /cursor\s*:\s*pointer/iu],
  ['<input', /<input\b/iu],
  ['<label', /<label\b/iu],
  ['<form', /<form\b/iu],
  ['<select', /<select\b/iu],
  ['<textarea', /<textarea\b/iu],
  ['Show all', /Show all/u],
  ['disclosure', /disclosure/u],
  ['details', /details/u],
  ['summary', /summary/u],
  ['Run', /\bRun\b/u],
  ['Execute', /\bExecute\b/u],
  ['Approve', /\bApprove\b/u],
  ['Dispatch', /\bDispatch\b/u],
  ['Apply', /\bApply\b/u],
  ['Release', /\bRelease\b/u],
  ['Publish', /\bPublish\b/u],
  ['Tag', /\bTag\b/u],
  ['Closeout', /\bCloseout\b/u]
]);

const sidebarForbiddenPatterns = Object.freeze([
  ['writing-mode', /writing-mode/u],
  ['rotate(', /rotate\(/u],
  ['vertical-rl', /vertical-rl/u],
  ['sideways', /sideways/u]
]);

async function main() {
  const externalPaths = parseExternalPaths(process.argv.slice(2));
  if (externalPaths === null) {
    return;
  }

  const supervisorSource = await readProjectFile(supervisorSourcePath);
  const v46CssSection = extractV46CssSection(await readProjectFile(workbenchCssPath));
  const {
    renderedMarkup,
    renderedRouteMarkup
  } = await renderSupervisorArtifacts();
  const coverage = assertQaCoverage({
    renderedMarkup,
    renderedRouteMarkup,
    supervisorSource,
    v46CssSection
  });

  const artifacts = [
    {
      name: 'rendered v46 SupervisorShell markup',
      path: `${supervisorSourcePath}#rendered-markup`,
      text: renderedMarkup
    },
    {
      name: 'rendered /workbench/supervisor/ route markup',
      path: 'frontend/workbench/src/App.jsx#/workbench/supervisor/',
      text: renderedRouteMarkup
    },
    {
      name: 'v46 supervisor source',
      path: supervisorSourcePath,
      text: supervisorSource
    },
    {
      name: 'v46 CSS section',
      path: `${workbenchCssPath}#v46-section`,
      text: v46CssSection
    }
  ];

  for (const externalPath of externalPaths) {
    artifacts.push({
      name: 'external static artifact',
      path: externalPath,
      text: await readExternalArtifact(externalPath)
    });
  }

  const matches = artifacts.flatMap((artifact) => [
    ...scanArtifact(artifact, readOnlyForbiddenPatterns, 'read-only forbidden pattern'),
    ...scanArtifact(artifact, sidebarForbiddenPatterns, 'sidebar anti-pattern')
  ]);

  if (matches.length > 0) {
    process.stderr.write(formatMatches(matches));
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify({
    contractName: 'workbench-v46-static-qa.v1',
    contractVersion: 1,
    status: 'ok',
    scanScope: {
      defaultScope: 'v46 supervisor route only',
      bundlePolicy: 'does not scan src/symphony/workbench-static by default; known Vite bundle artifacts are rejected as external inputs'
    },
    checkedArtifacts: artifacts.map((artifact) => artifact.path),
    coverage,
    readOnlyForbiddenPatterns: readOnlyForbiddenPatterns.map(([label]) => label),
    sidebarForbiddenPatterns: sidebarForbiddenPatterns.map(([label]) => label),
    visualQa: {
      automatedBrowserCheck: 'not configured in this repo',
      manualChecklist: visualChecklistPath
    }
  }, null, 2)}\n`);
}

function parseExternalPaths(args) {
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write([
      'Usage: node scripts/workbench-v46-static-qa.js [external-static-html ...]',
      '',
      'Default scope:',
      `  - ${supervisorSourcePath} rendered markup`,
      `  - ${supervisorSourcePath} source`,
      `  - ${workbenchCssPath} v46 CSS section`,
      '',
      'Known Vite bundle files under src/symphony/workbench-static are rejected as external inputs.',
      'They include legacy Workbench routes and Vite loader script tags, so they are not the v46 acceptance target.',
      ''
    ].join('\n'));
    return null;
  }

  const unsupportedFlag = args.find((arg) => arg.startsWith('-'));
  if (unsupportedFlag !== undefined) {
    throw new Error(`unsupported argument ${unsupportedFlag}`);
  }

  return args;
}

async function renderSupervisorArtifacts() {
  const server = await createViteServer({
    configFile: `${repoRoot}${workbenchConfigPath}`,
    server: {
      hmr: false,
      middlewareMode: true
    },
    appType: 'custom',
    optimizeDeps: {
      include: [],
      noDiscovery: true
    },
    logLevel: 'error'
  });

  try {
    const supervisorModule = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
    const appModule = await server.ssrLoadModule('/src/App.jsx');
    const renderedMarkup = renderToStaticMarkup(
      React.createElement(supervisorModule.SupervisorShell, {
        view: supervisorModule.SUPERVISOR_WORKBENCH_VIEW
      })
    );
    const renderedRouteMarkup = renderSupervisorRouteMarkup(appModule.WorkbenchShell);

    return { renderedMarkup, renderedRouteMarkup };
  } finally {
    restoreSsrLocation();
    await server.close();
  }
}

function renderSupervisorRouteMarkup(WorkbenchShell) {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: new URL('http://127.0.0.1/workbench/supervisor/')
  });

  return renderToStaticMarkup(
    React.createElement(WorkbenchShell, {
      viewState: {
        phase: 'ready',
        model: null
      },
      onRefreshWorkbenchContracts: () => undefined
    })
  );
}

function restoreSsrLocation() {
  if (originalSsrLocation) {
    Object.defineProperty(globalThis, 'location', originalSsrLocation);
    return;
  }

  delete globalThis.location;
}

async function readProjectFile(path) {
  return readFile(`${repoRoot}${path}`, 'utf8');
}

async function readExternalArtifact(path) {
  if (isKnownViteBundleArtifact(path)) {
    throw new Error(
      `${path} is a Vite Workbench bundle artifact. Use the default route-rendered QA scope or pass a standalone static v46 HTML artifact instead.`
    );
  }

  return readFile(path, 'utf8');
}

function isKnownViteBundleArtifact(path) {
  return /(^|\/)src\/symphony\/workbench-static\/(index\.html|assets\/index-[^/]+\.(js|css))$/u
    .test(path.replace(/\\/gu, '/'));
}

function extractV46CssSection(css) {
  const lines = css.split(/\r?\n/u);
  const firstV46Line = lines.findIndex((line) => line.includes('.v46-'));
  const firstLegacyLine = lines.findIndex((line, index) => (
    index > firstV46Line && line.trim().startsWith('.workbench-shell')
  ));

  if (firstV46Line === -1) {
    throw new Error(`${workbenchCssPath} does not contain v46 styles`);
  }

  return lines.slice(0, firstLegacyLine === -1 ? lines.length : firstLegacyLine).join('\n');
}

function assertQaCoverage({ renderedMarkup, renderedRouteMarkup, supervisorSource, v46CssSection }) {
  const renderedTokens = Object.freeze([
    ['sidebar', 'data-od-id="sidebar"'],
    ['status header', 'data-od-id="status-header"'],
    ['goal snapshot', 'data-od-id="goal-snapshot"'],
    ['active lease', 'data-od-id="active-lease"'],
    ['current gate', 'data-od-id="current-gate"'],
    ['recommended next action', 'data-od-id="recommended-next-action"'],
    ['context status', 'data-od-id="context-status"'],
    ['pending result', 'data-od-id="pending-result"'],
    ['command boundary', 'data-od-id="command-boundary"'],
    ['goal timeline', 'data-od-id="goal-timeline"'],
    ['ownership', 'data-od-id="ownership"']
  ]);
  const sourceTokens = Object.freeze([
    ['immutable view model', 'export const SUPERVISOR_WORKBENCH_VIEW = Object.freeze({'],
    ['live dashboard projection', 'export function projectSupervisorDashboardToWorkbenchView'],
    ['route shell export', 'export function SupervisorShell'],
    ['pending empty contract', "contract: '[ EMPTY ]'"],
    ['overview sidebar label', "label: 'Overview'"],
    ['active lease sidebar label', "label: 'Active Lease'"],
    ['current gate sidebar label', "label: 'Current Gate'"],
    ['command boundary sidebar label', "label: 'Command Boundary'"],
    ['context status sidebar label', "label: 'Context Status'"],
    ['timeline sidebar label', "label: 'Timeline'"],
    ['ownership sidebar label', "label: 'Ownership'"]
  ]);
  const cssTokens = Object.freeze([
    ['desktop two-column shell', 'grid-template-columns: 232px minmax(0, 1fr);'],
    ['opendesign dashboard grid', '.v46-dashboard-grid'],
    ['opendesign dashboard areas', '"goal lease"'],
    ['opendesign decision boundary row', '"decision boundary"'],
    ['sidebar labels', '.v46-sidebar-label'],
    ['mobile collapse breakpoint', '@media (max-width: 980px)'],
    ['mobile column dashboard', '.v46-dashboard-grid {\n    display: flex;'],
    ['mobile pending order', '.v46-pending-panel {\n    order: 5;'],
    ['mobile command boundary order', '.v46-command-panel {\n    order: 6;'],
    ['mobile context order', '.v46-context-panel {\n    order: 7;'],
    ['small mobile breakpoint', '@media (max-width: 520px)']
  ]);

  assertRequiredTokens(renderedMarkup, renderedTokens, `${supervisorSourcePath}#rendered-markup`);
  assertRequiredTokens(renderedRouteMarkup, [
    ['route shell', 'class="workbench-shell supervisor-shell-route"'],
    ['v46 route shell', 'class="v46-supervisor-shell"'],
    ['v46 route title', 'Workbench Supervisor Dashboard']
  ], 'frontend/workbench/src/App.jsx#/workbench/supervisor/');
  assertForbiddenTokens(renderedRouteMarkup, [
    'class="workbench-header"',
    'class="header-copy"',
    'id="workbench-title"',
    'class="status-strip"'
  ], 'frontend/workbench/src/App.jsx#/workbench/supervisor/');
  assertRequiredTokens(supervisorSource, sourceTokens, supervisorSourcePath);
  assertRequiredTokens(v46CssSection, cssTokens, `${workbenchCssPath}#v46-section`);
  assertSidebarLabels(renderedMarkup);

  return {
    renderedMarkup: renderedTokens.map(([label]) => label),
    renderedRouteMarkup: [
      'route shell',
      'v46 route shell',
      'legacy outer header absent'
    ],
    source: sourceTokens.map(([label]) => label),
    css: cssTokens.map(([label]) => label)
  };
}

function assertForbiddenTokens(text, tokens, path) {
  const present = tokens.filter((token) => text.includes(token));

  if (present.length > 0) {
    throw new Error(`${path} contains forbidden route token(s): ${present.join('; ')}`);
  }
}

function assertSidebarLabels(renderedMarkup) {
  const labels = [
    ...renderedMarkup.matchAll(/class="v46-sidebar-label">([^<]+)</gu)
  ].map((match) => match[1]);
  const expected = [
    'Overview',
    'Active Lease',
    'Current Gate',
    'Command Boundary',
    'Context Status',
    'Timeline',
    'Ownership'
  ];

  if (labels.join('|') !== expected.join('|')) {
    throw new Error(
      `${supervisorSourcePath}#rendered-markup sidebar labels mismatch. Expected ${expected.join(', ')}; got ${labels.join(', ')}`
    );
  }
}

function assertRequiredTokens(text, tokens, path) {
  const missing = tokens
    .filter(([, token]) => !text.includes(token))
    .map(([label, token]) => `${label}: ${token}`);

  if (missing.length > 0) {
    throw new Error(`${path} is missing QA coverage token(s): ${missing.join('; ')}`);
  }
}

function scanArtifact(artifact, patterns, category) {
  const matches = [];
  const lines = artifact.text.split(/\r?\n/u);

  lines.forEach((line, index) => {
    for (const [label, pattern] of patterns) {
      const match = pattern.exec(line);

      if (match !== null) {
        matches.push({
          category,
          label,
          path: artifact.path,
          line: index + 1,
          column: match.index + 1,
          text: line.trim()
        });
      }
    }
  });

  return matches;
}

function formatMatches(matches) {
  const lines = [
    `workbench-v46-static-qa failed with ${matches.length} match${matches.length === 1 ? '' : 'es'}:`
  ];

  for (const match of matches) {
    lines.push(
      `- ${match.category}: ${match.label} at ${displayPath(match.path)}:${match.line}:${match.column}`
    );
    lines.push(`  ${match.text}`);
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

function displayPath(path) {
  if (path.startsWith(repoRoot)) {
    return relative(repoRoot, path);
  }

  return path;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
