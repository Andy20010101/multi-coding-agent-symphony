# Eval Replay Plugin

Eval/Replay is an external plugin, not part of the hot execution path.

## Purpose

The plugin answers these questions:

- Did a new model improve specific task classes?
- Did an adapter change introduce regressions?
- Did a harness refactor remove useful structure or dead weight?
- Did cost, latency, retry rate, or failure type distribution change?

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
    "successRate": 0.0,
    "verifiedSuccessRate": 0.0,
    "meanCostUsd": 0.0,
    "p50LatencySeconds": 0,
    "p95LatencySeconds": 0
  },
  "failureDelta": {},
  "recommendations": [],
  "resourceProfile": {},
  "version": "1"
}
```

## Scoring Rules

Primary metrics:

- Verified success rate.
- Cost per verified success.
- Time to verified success.
- Retry count.
- Failure category distribution.

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

## Non-Goals

The plugin must not directly mutate production routing rules, model profiles, or command specs.

It may produce recommendations. A separate release or review step decides whether to apply them.

