# v7 Project Intake Workflow Plan

Date: 2026-05-20
Status: implementation-complete pending release
Canonical planning source: `.omx/plans/v7-project-intake-workflow-plan.md`

## Scope

v7 adds a read-only project intake workflow for new or existing checkouts. The workflow writes reusable `ArtifactStore` JSON artifacts under task id `project-intake`:

- `project-context`
- `intake-summary`

## Surfaces

```sh
symphony intake --project-dir . --output-dir tmp/symphony-intake
mcas intake --project-dir . --runtime-dir .mcas
symphony work --preflight-intake --dry-run "inspect README"
symphony work --intake-artifact <project-context.json> --dry-run "inspect README"
```

## Boundaries

- Built-in intake is deterministic and does not invoke real models.
- Default `symphony work` behavior is unchanged unless intake flags are passed.
- `grill-me-docs` is an optional provider adapter only; it is not an npm dependency.
- Artifacts are persisted through `ArtifactStore`, so stored JSON passes through existing redaction.
- Large scans stay bounded by fixed file, byte, depth, and ignored-root limits.

## Verification

Verification evidence lives in `docs/plans/v7-release-evidence-2026-05-20.md`.
