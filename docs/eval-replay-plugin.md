# Eval Replay Plugin

Eval/Replay is an external plugin, not part of the hot execution path.

Current implementation path: `plugins/eval-replay/index.js`.

Implemented entrypoints:

- `loadReplaySample({ artifactStore, tasks })` loads explicit artifact IDs.
- `loadReplayFixture({ name })` loads bundled model-upgrade or adapter-regression replay fixtures.
- `buildReplaySampleFromSession({ artifactStore, eventLog, taskIds })` reads `artifact.written` session events and normalizes evidence artifacts into replay results without adapter state.
- `runEvalReplay(...)` scores baseline and candidate variants and emits recommendations without mutating core config.
- `loadWorkflowComparisonFixture({ name })` loads bundled workflow comparison fixtures.
- `buildWorkflowComparisonInputFromArtifacts({ artifactStore, comparison })` reads referenced workflow, EnsembleRun, and Harness evidence artifacts.
- `runWorkflowModeComparison(...)` compares workflow modes from structured artifacts.
- `writeEvalReportArtifact({ artifactStore, report, taskId, artifactId })` writes reports back to ArtifactStore and returns the artifact reference.
- `pnpm eval:replay -- ...` runs the external gate command against stored artifacts or workflow comparison fixtures and writes a report artifact.

## Purpose

The plugin answers these questions:

- Did a new model improve specific task classes?
- Did an adapter change introduce regressions?
- Did a harness refactor remove useful structure or dead weight?
- Did cost, latency, retry rate, or failure type distribution change?
- Which workflow mode passed or failed based on verifier-readable artifacts?

## Trigger Conditions

Run eval when one of these changes:

- Model profile.
- Runtime adapter.
- CommandSpec.
- Context Builder.
- Policy Engine.
- Router/Scheduler.
- Verifier.
- Workspace or sandbox configuration.

Also run eval for anomalies:

- Failure rate spike.
- Cost spike.
- Latency spike.
- Increase in `verification-insufficient`.
- Increase in `model-off-task`.

## Inputs

Required inputs:

- Task sample.
- TaskSpec snapshots.
- CommandSpec versions.
- AdapterMapping versions.
- ModelProfile versions.
- Context packs or context builder config.
- Session event logs.
- Artifacts and evidence.
- ResourceProfile.

`buildReplaySampleFromSession` ignores non-evidence run records and normalizes evidence fields into `variant`, `verified`, `failureCategory`, `command`, `taskClass`, `costUsd`, `latencySeconds`, `resourceProfile`, and `evidenceArtifactId`.

`runEvalReplay` accepts either one shared `resourceProfile` or separate `baselineResourceProfile` and `candidateResourceProfile` objects. Separate profiles are preserved in the report and compared field by field before the result is treated as directly comparable.

Workflow comparison inputs can provide direct `workflowResult`, `ensembleRun`, or `evidenceMap` objects, or `artifacts[]` references with `taskId`, `artifactId`, and optional `kind`. Replay normalizes these shapes inside the plugin boundary and never calls real CLIs.

## Outputs

The plugin writes an eval report:

```json
{
  "id": "eval-123",
  "reason": "model-upgrade",
  "baseline": "gpt-codex-default.v1",
  "candidate": "gpt-codex-default.v2",
  "taskSample": "sample-2026-05-13",
  "scores": {
    "baseline": {
      "verifiedSuccessRate": 0.0,
      "meanCostUsd": 0.0,
      "p50LatencySeconds": 0,
      "p95LatencySeconds": 0
    },
    "candidate": {
      "verifiedSuccessRate": 0.0,
      "meanCostUsd": 0.0,
      "p50LatencySeconds": 0,
      "p95LatencySeconds": 0
    }
  },
  "failureDelta": {},
  "taskClassSummary": {
    "model-upgrade": {
      "scores": {
        "baseline": {
          "verifiedSuccessRate": 0.5,
          "meanCostUsd": 0.0,
          "p50LatencySeconds": 0,
          "p95LatencySeconds": 0
        },
        "candidate": {
          "verifiedSuccessRate": 1.0,
          "meanCostUsd": 0.0,
          "p50LatencySeconds": 0,
          "p95LatencySeconds": 0
        }
      },
      "failureDelta": {
        "model-off-task": -1
      }
    }
  },
  "recommendations": [
    {
      "type": "review-routing",
      "reason": "candidate-verified-success-rate-improved",
      "candidate": "gpt-codex-default.v2",
      "tradeoffs": ["higher-cost"],
      "affectedFiles": ["src/router-scheduler.js"],
      "affectedContracts": ["ModelProfile"]
    }
  ],
  "resourceProfile": {},
  "resourceQualification": {
    "comparable": false,
    "reasons": ["resource-profile-mismatch"],
    "mismatchedFields": ["timeoutSeconds", "network"]
  },
  "mutatedCoreConfig": false,
  "version": "1"
}
```

Reports may be stored under a synthetic task such as `eval-reports`, keeping replay output outside core routing configuration.

Workflow comparison reports are operator-readable artifacts with these stable top-level fields:

- `samples[]`, `modes[]`, `resultsByMode`, `verifierSummary`, and `evidenceArtifacts`.
- `workflowSpecificSummary` for competitive candidates, QA findings, lane write sets, and writer/reviewer verification.
- `resourceProfile`, `costProfile`, and explicit unknown-profile reasons when data was not recorded.

Example gate command:

```bash
pnpm eval:replay -- \
  --artifacts ./artifacts \
  --events ./events \
  --session session-1 \
  --tasks task-1,task-2 \
  --reason model-upgrade \
  --baseline gpt-codex-default.v1 \
  --candidate gpt-codex-default.v2 \
  --resource-profile-json '{"cpu":"4","memoryMb":8192,"timeoutSeconds":3600,"concurrency":1,"network":"restricted","version":"1"}'
```

Workflow comparison fixture command:

```bash
pnpm eval:replay -- \
  --artifacts ./artifacts \
  --workflow-comparison-fixture workflow-comparison \
  --reason workflow-mode-comparison \
  --compared-at 2026-05-16T00:00:00.000Z
```

## Scoring Rules

Primary metrics:

- Verified success rate.
- Cost per verified success.
- Time to verified success.
- Retry count.
- Failure category distribution.
- Per-task-class success and failure deltas.

Secondary metrics:

- Diff size.
- Review findings.
- Test coverage delta.
- Artifact completeness.
- Human override rate.

## Resource Control

Resource configuration must be recorded as a first-class variable:

- CPU.
- Memory.
- Timeout.
- Concurrency.
- Network access.
- Cache state.
- Dependency install policy.

A model should not be compared against another model if resource conditions differ without being reported.

When baseline and candidate profiles differ, the report includes `resourceQualification.comparable = false`, a machine-readable reason, and the exact mismatched fields. A candidate can still be recommended for review, but the recommendation is qualified by cost/resource tradeoffs rather than applied automatically.

Real smoke evidence records `resourceProfile` so replay samples can preserve the resources observed during real CLI/model runs.

## Non-Goals

The plugin must not directly mutate production routing rules, model profiles, or command specs.

It may produce recommendations. A separate release or review step decides whether to apply them.
