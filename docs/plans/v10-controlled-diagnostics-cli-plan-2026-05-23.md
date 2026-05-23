# v10 Plan: Controlled Diagnostics CLI and HTML Report

## Summary

v10 moves the v9.1 Workbench diagnostics into a stable CLI surface: `symphony diagnose`. It gives users and CI a way to inspect project health, latest run trust, visible risks, readiness, and copy-only next commands without starting the browser Workbench.

The safety boundary remains unchanged: v10 does not implement `symphony do --write`, does not add browser execution buttons, does not call models, does not execute recommended commands, and does not write project files. The HTML report is written only to stdout so users can redirect it intentionally.

## Behavior

- `symphony diagnose` prints a compact terminal summary.
- `symphony diagnose --json` emits `contractName: "symphony.diagnostics-report"` with `contractVersion: "1"`.
- `symphony diagnose --html` emits a complete static HTML document to stdout.
- `--state-dir <path>` selects a state directory; the default remains `.symphony`.
- `--json` and `--html` are mutually exclusive and return a usage failure when combined.
- Unknown diagnose options return a usage failure.

## JSON Contract

The diagnostics report contains:

- `generatedAt`, `stateDir`, and `cwd`.
- `status`: `no-runs` when no runs exist, `attention` when high risks or required tool gaps are visible, and `ready` otherwise.
- `snapshot`: the existing `buildConsoleSnapshot()` output, including `runStats`, `riskSummary`, and `commandGroups`.
- `readiness`: the existing `buildConsoleReadiness()` output with redaction preserved.
- `risks`: a deduplicated combined risk summary from run diagnostics and readiness.
- `commands`: combined copy-only command items grouped as Inspect, Verify, Artifacts, and Real-agent gates when present.
- `action`: a copy-only next command, using `symphony scan` for no-run states.

## HTML Report

The HTML output is a single document with no external resources, no scripts, and no network references. It includes overall status, latest run, recent runs, risk panel, readiness checks, artifact health, and grouped copy-only commands. All dynamic state text is escaped before rendering.

## Implementation Notes

- `src/symphony/console.js` exports `buildConsoleDiagnosticsReport()`, `renderDiagnosticsText()`, and `renderDiagnosticsHtml()`.
- `scripts/symphony.js` adds `diagnose` to `KNOWN_COMMANDS` and implements argument parsing plus output dispatch.
- The diagnose path aggregates `.symphony` state, readiness probes, run refs, and existing diagnostic summaries; it does not preview artifact content.
- Existing Workbench `/api/*` routes keep their contracts, non-GET requests still return `405`, and artifact preview allowlist plus the 200 KiB cap remain unchanged.

## Verification

- `node --test tests/symphony-cli.test.js`
- `pnpm check`
- `pnpm test`
- `git diff --check`
- `pnpm audit --audit-level high`
