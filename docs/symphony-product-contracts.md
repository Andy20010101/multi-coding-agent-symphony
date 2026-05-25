# Symphony Product JSON Contracts

v8.2 made the product CLI JSON surface stable for scripts and local UI consumers. v9 adds workbench-oriented console fields and read-only routes without changing `contractVersion`. v9.1 adds Workbench diagnostics, run filters, grouped commands, and risk summaries as additive fields. v10 adds the controlled `symphony diagnose` CLI report. v11 adds controlled kernel execution plans for `symphony do --write`. v12 adds verified adoption plans for applying verifier-passing isolated workspace changes through a separate frozen-patch confirmation step. v13 adds a compact Workbench information architecture with derived `overview` and `adoptionSummary` fields plus a read-only adoption inspect route. Contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only; non-GET HTTP requests return `405`.
- File previews are capped at 200 KiB and return `truncated: true` when capped.
- v9 workbench commands are copy-only recommendations. The browser UI does not execute commands or write files.
- v9 readiness checks may inspect local CLI availability, git state, GitHub auth/CI visibility, and real CLI gate status; they do not invoke models and must not expose token values.
- v9.1 run filters are read-only selectors. `GET /api/runs?filter=<filter>` supports `all`, `passed`, `failed`, `dry-run`, `real`, `scan`, `verify`, and the v13 additive `adoption` filter.
- v9.1 diagnostics may add `runStats`, `riskSummary`, `artifactStatus`, and `commandGroups`; older consumers can ignore these fields.
- v10 `symphony diagnose` does not start a server, invoke models, execute recommended commands, read artifact content, or write project files. `--html` writes only to stdout and the generated report is static HTML with no scripts or external resources.
- v10 diagnostics command recommendations remain copy-only text. `--json` and `--html` are mutually exclusive output modes.
- v11 `symphony do --write` is planning-only until the returned `symphony do --confirm-plan <plan-id>` command is run. Confirmed execution writes only to a managed isolated workspace and keeps `mainWorktreeWrites: false`.
- v11 real-agent execution plans require the existing adapter gate, such as `MCAS_RUN_REAL_CODEX=1`, during confirmation before any adapter starts.
- v12 `symphony adopt --run <run-id>` is planning-only. It creates a frozen `symphony.adoption-plan` and a registered patch artifact, and keeps the main worktree unchanged.
- v12 `symphony adopt --confirm <adoption-id>` accepts only `--confirm`, `--state-dir`, and `--json`; it revalidates the frozen plan, patch hash, source workspace fingerprint, git HEAD, dirty-worktree fingerprint, and `git apply --check` before writing. After those checks and before `git apply`, it writes an adoption journal and an `applying` confirmation run state.
- v12 `symphony adopt --inspect <adoption-id> --json` accepts only `--inspect`, `--state-dir`, and `--json`. It is read-only and reports plan, journal, latest confirmation, and current worktree hash matches.
- v12 adoption does not invoke adapters, models, package installers, generated execution plans, or external services.
- v13 Workbench `overview` and `adoptionSummary` are derived summaries, not canonical storage. They can be recomputed from run states, adoption plans, adoption journals, readiness, and diagnostics.
- v13 `GET /api/adoptions/<adoption-id>/inspect` reuses the CLI adoption inspection builder. It is read-only, writes no state files, executes no recommended commands, and returns only copy-only command recommendations.

## `symphony.product-json`

Product commands such as `symphony scan --json` keep their legacy fields and add the stable envelope.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.product-summary",
  "contract": {
    "name": "symphony.product-summary",
    "version": "1",
    "stability": "stable",
    "minimumCli": "v8.2"
  },
  "identity": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "intent": "scan-project",
    "semanticCommand": "scan"
  },
  "safety": {
    "mode": "read-only",
    "projectWrites": false,
    "runtimeWrites": true,
    "externalCalls": false,
    "destructiveWrites": false
  },
  "workflow": {
    "pipeline": ["scan"]
  },
  "artifactRefs": [
    {
      "kind": "context",
      "path": "tmp/symphony-scan/run/runtime/artifacts/project-intake/project-context.json"
    }
  ],
  "action": {
    "next": "symphony do --dry-run \"inspect README\""
  },
  "timestamps": {
    "createdAt": null,
    "updatedAt": null,
    "generatedAt": "2026-05-22T00:00:00.000Z"
  }
}
```

## `symphony.run-state`

New product runs persist the contracted state under `.symphony/runs/<run-id>.json` and `.symphony/runs/latest.json`.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-new-demo-abc123-1",
  "command": "symphony new",
  "semanticCommand": "new",
  "safetyMode": "dry-run",
  "status": "preview",
  "verifierStatus": "not-run",
  "routeDecision": {
    "intent": "new-project",
    "safetyMode": "dry-run"
  },
  "unsupportedRequests": [],
  "scaffoldPlan": {
    "template": "empty",
    "networkInstall": false
  },
  "changedFiles": [],
  "artifactRefs": [
    {
      "kind": "scaffold-plan",
      "path": "tmp/symphony-new/run/runtime/artifacts/symphony-new/scaffold-plan.json"
    }
  ],
  "action": {
    "next": "symphony new demo --template empty --write"
  }
}
```

Older run-state files can omit v8.2 fields. Consumers should treat missing optional fields as unavailable, not invalid.

Planned v11 write runs add controlled execution metadata without changing `contractVersion`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-plan-writer-reviewer-abc123",
  "command": "symphony do",
  "semanticCommand": "do",
  "safetyMode": "write",
  "status": "planned",
  "verifierStatus": "not-run",
  "projectWrites": true,
  "mainWorktreeWrites": false,
  "workspaceWrites": true,
  "runtimeWrites": true,
  "externalCalls": false,
  "writeBoundary": "isolated-workspace",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
  "artifactRefs": [
    {
      "kind": "execution-plan",
      "path": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json"
    }
  ],
  "action": {
    "next": "symphony do --confirm-plan symphony-plan-writer-reviewer-abc123"
  }
}
```

Confirmed v11 runs preserve `executionPlanId`, `plannedRunId`, and `executionPlanArtifactPath`, then add the usual evidence, Harness, task-packet, verifier, and changed-file fields from the kernel workflow.

Planned v12 adoption runs add frozen patch metadata while keeping `mainWorktreeWrites: false`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-adoption-source-abc123-planned",
  "command": "symphony adopt",
  "semanticCommand": "adopt",
  "status": "adoption-planned",
  "verifierStatus": "not-run",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionPlanArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.json",
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "mainWorktreeWrites": false,
  "writeBoundary": "main-worktree",
  "artifactRefs": [
    {
      "kind": "adoption-plan",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123.json"
    },
    {
      "kind": "adoption-patch",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123.patch"
    }
  ],
  "action": {
    "next": "symphony adopt --confirm symphony-adoption-source-abc123"
  }
}
```

V12 confirmation first writes an `applying` run state after the journal is durable and before `git apply`:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.run-state",
  "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
  "command": "symphony adopt",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-confirm"],
  "status": "applying",
  "verifierStatus": "not-run",
  "mainWorktreeWrites": false,
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionJournalArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json",
  "artifactRefs": [
    {
      "kind": "adoption-journal",
      "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
    }
  ]
}
```

Confirmed v12 adoption runs set `mainWorktreeWrites: true` only after the frozen patch is applied, post-apply evidence is recorded, and journal status is advanced from `applying` to `applied`. Failed preflight confirmations write a failed adoption run with `mainWorktreeWrites: false`; post-apply evidence or final state persistence failures do not roll back and best-effort write a failed run with `mainWorktreeWrites: true`, `failurePhase: "post-apply-evidence"`, `adoptionJournalArtifactPath`, and `nextAction: "symphony status"`.

## `symphony.execution-plan`

`symphony do --write` writes a frozen plan to `.symphony/plans/<plan-id>.json` and persists a planned run. It does not start an adapter. `symphony do --write --real codex` may create a plan without the gate, but `symphony do --confirm-plan <plan-id>` requires `MCAS_RUN_REAL_CODEX=1` before adapter start.

```json
{
  "version": "1",
  "kind": "symphony.execution-plan",
  "contractVersion": "1",
  "contractName": "symphony.execution-plan",
  "planId": "symphony-plan-writer-reviewer-abc123",
  "command": "symphony do",
  "intent": "work",
  "semanticCommand": "do",
  "prompt": "inspect README",
  "pipeline": ["scan-if-needed", "do"],
  "safetyMode": "write",
  "projectWrites": true,
  "mainWorktreeWrites": false,
  "workspaceWrites": true,
  "runtimeWrites": true,
  "externalCalls": false,
  "destructiveWrites": false,
  "writeBoundary": "isolated-workspace",
  "projectRoot": "/repo",
  "projectFingerprint": "sha256:...",
  "contextArtifactPath": "tmp/symphony-scan/.../project-context.json",
  "summaryArtifactPath": "tmp/symphony-scan/.../intake-summary.json",
  "workflowMode": "writer-reviewer",
  "adapter": "codex",
  "executionMode": "dry-run",
  "workDir": "tmp/symphony-work",
  "requiresGate": null,
  "confirmationCommand": "symphony do --confirm-plan symphony-plan-writer-reviewer-abc123",
  "createdAt": "2026-05-23T00:00:00.000Z"
}
```

Confirmation accepts only `--confirm-plan <plan-id>`, `--state-dir <path>`, and `--json`. Extra prompt text or execution flags are rejected so the frozen plan cannot drift. The generated `confirmationCommand` includes the non-default state dir when a plan is stored outside `.symphony`. Confirmation also rejects missing plans, unsupported plan contracts, stale project fingerprints, unsupported write boundaries, invalid audit invariants, and missing real-agent gates before the kernel workflow starts.

## `symphony.adoption-plan`

`symphony adopt --run <run-id>` writes a frozen adoption plan to `.symphony/adoptions/<adoption-id>.json` and a registered patch artifact to `.symphony/adoptions/<adoption-id>.patch`. The source run must be a confirmed v11 run with `status: "passed"`, `verifierStatus: "passed"`, `writeBoundary: "isolated-workspace"`, `mainWorktreeWrites: false`, verifier evidence, and source workspace refs.

```json
{
  "version": "1",
  "kind": "symphony.adoption-plan",
  "contractName": "symphony.adoption-plan",
  "contractVersion": "1",
  "adoptionId": "symphony-adoption-source-abc123",
  "command": "symphony adopt",
  "intent": "adopt",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-plan"],
  "safetyMode": "write",
  "stateDir": ".symphony",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "sourceRunArtifactPath": ".symphony/runs/symphony-work-confirmed-abc123.json",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
  "plannedRunId": "symphony-adoption-source-abc123-planned",
  "projectRoot": "/repo",
  "projectFingerprint": "sha256:...",
  "gitHead": "0123456789abcdef...",
  "gitStatusFingerprint": "sha256:...",
  "sourceWorkspacePath": "/repo/.symphony/work/run/runtime/workspaces/task/ws",
  "sourceWorkspaceManifestPath": "/repo/.symphony/work/run/runtime/workspaces/task/ws/workspace-manifest.json",
  "sourceWorkspaceFingerprint": "sha256:...",
  "sourceEvidenceArtifactPath": "/repo/.symphony/work/run/runtime/artifacts/task/implement-evidence.json",
  "sourceVerifierStatus": "passed",
  "sourceWriteBoundary": "isolated-workspace",
  "writeBoundary": "main-worktree",
  "projectWrites": true,
  "mainWorktreeWrites": true,
  "workspaceWrites": false,
  "runtimeWrites": true,
  "externalCalls": false,
  "destructiveWrites": false,
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "unsupportedChanges": [],
  "confirmationCommand": "symphony adopt --confirm symphony-adoption-source-abc123",
  "createdAt": "2026-05-24T00:00:00.000Z"
}
```

v12 supports only text-file `add` and `modify` operations. Planning rejects deletion, rename, binary files, symlinks, chmod-only changes, ignored-root changes such as `.symphony/`, `.git/`, `node_modules/`, path traversal, missing workspace refs, missing evidence, stale source metadata, and dirty non-Symphony main worktree changes. Confirmation never regenerates the patch from the current isolated workspace; it uses the registered patch artifact and plan hashes only.

## `symphony.adoption-journal`

`symphony adopt --confirm <adoption-id>` writes `.symphony/adoptions/<adoption-id>-journal.json` after all pre-write checks and before `git apply`. The journal is also exposed through run-state `artifactRefs` with `kind: "adoption-journal"`.

```json
{
  "version": "1",
  "kind": "symphony.adoption-journal",
  "contractName": "symphony.adoption-journal",
  "contractVersion": "1",
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "confirmationRunId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
  "sourceRunId": "symphony-work-confirmed-abc123",
  "executionPlanId": "symphony-plan-writer-reviewer-abc123",
  "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "fileOperations": [
    {
      "path": "README.md",
      "operation": "modify",
      "beforeHash": "sha256:...",
      "afterHash": "sha256:...",
      "size": 42,
      "textEncoding": "utf8"
    }
  ],
  "beforeFiles": [
    {
      "path": "README.md",
      "exists": true,
      "hash": "sha256:...",
      "size": 10,
      "textEncoding": "utf8"
    }
  ],
  "createdAt": "2026-05-24T00:00:00.000Z",
  "status": "applying"
}
```

If post-apply evidence succeeds, the same artifact status is advanced to `"applied"`. If patch application succeeds but post-apply evidence or state persistence fails, the journal may remain `"applying"` and diagnostics use it as recovery visibility.

## `symphony adopt --inspect`

`symphony adopt --inspect <adoption-id> --json` is a read-only inspection surface. It rejects prompt text, `--write`, execution flags, and mixed modes such as `--inspect` plus `--confirm`.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.product-summary",
  "command": "symphony adopt",
  "intent": "adopt-inspect",
  "semanticCommand": "adopt",
  "pipeline": ["adopt-inspect"],
  "safety": {
    "mode": "read-only",
    "projectWrites": false,
    "mainWorktreeWrites": false,
    "runtimeWrites": false,
    "externalCalls": false,
    "destructiveWrites": false
  },
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "adoptionPlanRefs": {
    "adoptionPlanArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.json",
    "executionPlanArtifactPath": ".symphony/plans/symphony-plan-writer-reviewer-abc123.json",
    "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
    "sourceRunArtifactPath": ".symphony/runs/symphony-work-confirmed-abc123.json"
  },
  "journalRef": {
    "kind": "adoption-journal",
    "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
  },
  "sourceRun": {
    "runId": "symphony-work-confirmed-abc123",
    "verifierStatus": "passed",
    "workspacePath": "/repo/.symphony/work/run/runtime/workspaces/task/ws"
  },
  "patchHash": "sha256:...",
  "changedFiles": ["README.md"],
  "latestConfirmationRun": {
    "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
    "status": "passed",
    "mainWorktreeWrites": true
  },
  "currentWorktreeMatchesAfterHash": true,
  "currentWorktreeMatchesJournalBeforeFiles": false,
  "action": {
    "next": "symphony adopt --confirm symphony-adoption-source-abc123"
  }
}
```

## `symphony.console-snapshot`

`symphony console --snapshot --json` and `GET /api/summary` return the read-only state overview.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-snapshot",
  "stateDir": ".symphony",
  "status": "ready",
  "overview": {
    "status": "ready",
    "headline": "Latest run passed and no high-priority risks are visible.",
    "latestRunId": "symphony-scan-demo-abc123-1",
    "topRisks": [],
    "nextAction": "symphony status"
  },
  "adoptionSummary": {
    "status": "clear",
    "pendingCount": 0,
    "applyingCount": 0,
    "postApplyFailedCount": 0,
    "staleCount": 0,
    "unsupportedCount": 0,
    "completedCount": 0,
    "dirtyBlocked": false
  },
  "latestRun": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "status": "passed",
    "artifactHealth": {
      "status": "registered",
      "total": 1,
      "kinds": ["context"]
    },
    "timeline": [
      {
        "id": "verification",
        "label": "Verifier",
        "status": "done",
        "detail": "passed"
      }
    ],
    "artifactRefs": [],
    "recommendedCommands": [
      {
        "id": "status",
        "label": "Status",
        "command": "symphony status",
        "description": "Read the latest product state.",
        "mode": "copy-only"
      }
    ]
  },
  "runs": [],
  "adoptionPlans": [
    {
      "adoptionPlanId": "symphony-adoption-source-abc123",
      "sourceRunId": "symphony-work-confirmed-abc123",
      "executionPlanId": "symphony-plan-writer-reviewer-abc123",
      "status": "adoption-planned",
      "patchArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123.patch",
      "patchHash": "sha256:...",
      "changedFiles": ["README.md"],
      "confirmationCommand": "symphony adopt --confirm symphony-adoption-source-abc123"
    }
  ],
  "adoptionJournals": [
    {
      "adoptionPlanId": "symphony-adoption-source-abc123",
      "confirmationRunId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
      "status": "applied",
      "patchHash": "sha256:...",
      "changedFiles": ["README.md"],
      "adoptionJournalArtifactPath": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
    }
  ],
  "runStats": {
    "total": 1,
    "recentRuns": [
      {
        "runId": "symphony-scan-demo-abc123-1",
        "status": "passed",
        "verifierStatus": "passed",
        "artifactStatus": "ok"
      }
    ],
    "failedCount": 0,
    "verifier": {
      "total": 1,
      "passed": 1,
      "failed": 0,
      "passRate": 1
    },
    "artifacts": {
      "status": "ok",
      "registered": 1,
      "missing": 0,
      "runsWithMissing": 0
    }
  },
  "riskSummary": {
    "status": "ok",
    "total": 0,
    "counts": {
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "items": []
  },
  "recommendedCommands": [
    {
      "id": "console",
      "label": "Open workbench",
      "command": "symphony console",
      "description": "Return to this read-only dashboard.",
      "mode": "copy-only"
    }
  ],
  "commandGroups": [
    {
      "group": "Inspect",
      "commands": []
    }
  ],
  "action": {
    "next": "symphony status"
  }
}
```

When no runs exist, `status` and `overview.status` are `"no-runs"`, `latestRun` is `null`, and the next action is `symphony scan`. The v13 Workbench renders the compact Overview by default, with deeper details separated into Overview, Adoptions, Runs, Diagnostics, and Artifacts sections. v13.1 localizes visible Workbench presentation text to Chinese, but it does not localize JSON field names, status enum values, copy-only command strings, or raw/debug JSON blocks. Field ownership is:

- Overview: `overview`, latest run summary, top risks capped to three, compact readiness, and current next action.
- Adoptions: `adoptionSummary`, `adoptionPlans`, `adoptionJournals`, adoption run fields, and inspect match results.
- Runs: `runs`, `runStats`, filters, timelines, selected run details, and run-level commands.
- Diagnostics: full risk/readiness payloads and grouped copy-only commands.
- Artifacts: registered `artifactRefs`, artifact health/status, and bounded previews.
- Raw/debug: raw run state, route/provider blocks, unsupported requests, scaffold plans, and JSON detail blocks.

`GET /api/runs` also accepts an optional v9.1 filter query:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-runs",
  "filter": "failed",
  "availableFilters": ["all", "passed", "failed", "dry-run", "real", "scan", "verify", "adoption"],
  "runs": []
}
```

## `symphony.console-run`

`GET /api/runs/latest` and `GET /api/runs/<run-id>` return a compact run plus the raw persisted state for compatibility.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-run",
  "run": {
    "runId": "symphony-scan-demo-abc123-1",
    "command": "symphony scan",
    "semanticCommand": "scan",
    "safetyMode": "read-only",
    "providerMode": "auto",
    "providerFallback": {
      "from": "grill-me-docs",
      "to": "builtin",
      "reason": "unavailable"
    },
    "verifierStatus": "passed",
    "nextAction": "symphony do --dry-run \"inspect README\"",
    "timeline": [
      {
        "id": "safety",
        "label": "Safety boundary",
        "status": "done",
        "detail": "read-only"
      }
    ],
    "recommendedCommands": [
      {
        "id": "next",
        "label": "Suggested next",
        "command": "symphony do --dry-run \"inspect README\"",
        "description": "Copy the next action recorded by the latest run.",
        "mode": "copy-only"
      }
    ],
    "artifactStatus": {
      "status": "ok",
      "total": 1,
      "available": 1,
      "missing": 0,
      "unknown": 0,
      "missingKinds": []
    },
    "riskSummary": {
      "status": "ok",
      "total": 0,
      "items": []
    },
    "commandGroups": [
      {
        "group": "Inspect",
        "commands": []
      }
    ]
  },
  "rawRunState": {}
}
```

## `symphony.console-adoption-inspect`

`GET /api/adoptions/<adoption-id>/inspect` returns read-only adoption recovery data using the same inspection builder as `symphony adopt --inspect <adoption-id> --json`. It rejects unsafe ids before reading state and does not write files, run `git apply`, invoke adapters, invoke models, run installers, or execute recommended commands.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-adoption-inspect",
  "status": "inspected",
  "safetyMode": "read-only",
  "runtimeWrites": false,
  "adoptionPlanId": "symphony-adoption-source-abc123",
  "journalRef": {
    "kind": "adoption-journal",
    "path": ".symphony/adoptions/symphony-adoption-source-abc123-journal.json"
  },
  "latestConfirmationRun": {
    "runId": "symphony-adopt-confirm-symphony-adoption-source-abc123-1",
    "status": "passed",
    "mainWorktreeWrites": true
  },
  "currentWorktreeMatchesAfterHash": true,
  "currentWorktreeMatchesJournalBeforeFiles": false,
  "recommendedCommands": [
    {
      "id": "inspect-adoption",
      "label": "Inspect adoption",
      "command": "symphony adopt --inspect symphony-adoption-source-abc123 --json",
      "mode": "copy-only"
    }
  ]
}
```

## `symphony.console-readiness`

`GET /api/readiness` returns local readiness data for the v9 workbench. It is read-only and model-free.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-readiness",
  "status": "ready",
  "readOnly": true,
  "modelInvocation": false,
  "tools": {
    "node": {
      "status": "available",
      "version": "v24.11.1"
    },
    "packageManager": {
      "name": "pnpm",
      "status": "available",
      "version": "10.30.3",
      "command": "pnpm --version"
    },
    "git": {
      "status": "available",
      "branch": "main",
      "head": "abc1234",
      "dirty": false,
      "dirtyFilesCount": 0,
      "dirtyPaths": []
    },
    "github": {
      "status": "authenticated",
      "account": "Andy20010101",
      "ci": {
        "status": "available",
        "latest": {
          "workflowName": "CI",
          "status": "completed",
          "conclusion": "success"
        }
      }
    },
    "realCli": {
      "status": "available",
      "adapters": [
        {
          "adapterId": "codex",
          "status": "available",
          "gate": {
            "envName": "MCAS_RUN_REAL_CODEX",
            "status": "not-enabled"
          },
          "modelInvocation": false
        }
      ]
    }
  },
  "checks": [
    {
      "id": "pnpm",
      "label": "pnpm",
      "status": "ok",
      "detail": "10.30.3"
    }
  ],
  "recommendedCommands": [
    {
      "id": "doctor",
      "label": "Doctor",
      "command": "symphony doctor",
      "description": "Check the base CLI environment.",
      "mode": "copy-only"
    }
  ],
  "riskSummary": {
    "status": "attention",
    "total": 1,
    "items": [
      {
        "id": "dirty_git",
        "category": "dirty_git",
        "severity": "medium",
        "title": "Dirty git worktree",
        "detail": "1 dirty file(s) may affect run trust.",
        "command": {
          "command": "git status --short",
          "mode": "copy-only"
        }
      }
    ]
  },
  "commandGroups": [
    {
      "group": "Inspect",
      "commands": []
    }
  ]
}
```

If optional tools such as `gh`, Codex, Claude, or Kiro are missing, their status is reported as unavailable or optional rather than failing the read-only console route.

## `symphony.diagnostics-report`

`symphony diagnose --json` returns a stable v10 report for terminals, CI, and static HTML generation. It combines the v9.1 console snapshot and readiness data without changing the `/api/*` Workbench contracts.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.diagnostics-report",
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "stateDir": ".symphony",
  "cwd": "/repo",
  "status": "attention",
  "snapshot": {
    "contractName": "symphony.console-snapshot",
    "runStats": {
      "total": 2,
      "failedCount": 1,
      "artifacts": {
        "status": "missing",
        "registered": 2,
        "missing": 1,
        "runsWithMissing": 1
      }
    },
    "riskSummary": {
      "status": "attention",
      "total": 2,
      "items": []
    },
    "commandGroups": []
  },
  "readiness": {
    "contractName": "symphony.console-readiness",
    "status": "attention",
    "readOnly": true,
    "modelInvocation": false,
    "riskSummary": {
      "status": "attention",
      "total": 1,
      "items": []
    },
    "commandGroups": []
  },
  "risks": {
    "status": "attention",
    "total": 3,
    "counts": {
      "high": 1,
      "medium": 1,
      "low": 1
    },
    "items": [
      {
        "id": "run-1:verifier_failed",
        "category": "verifier_failed",
        "severity": "high",
        "title": "Verifier failed",
        "runId": "run-1",
        "command": {
          "command": "symphony status",
          "mode": "copy-only"
        }
      }
    ]
  },
  "commands": {
    "mode": "copy-only",
    "items": [
      {
        "id": "status",
        "label": "Status",
        "command": "symphony status",
        "description": "Read the latest product state.",
        "group": "Inspect",
        "mode": "copy-only"
      }
    ],
    "groups": [
      {
        "group": "Inspect",
        "commands": [
          {
            "id": "status",
            "label": "Status",
            "command": "symphony status",
            "description": "Read the latest product state.",
            "group": "Inspect",
            "mode": "copy-only"
          }
        ]
      }
    ],
    "commandGroups": [
      {
        "group": "Inspect",
        "commands": [
          {
            "id": "status",
            "label": "Status",
            "command": "symphony status",
            "description": "Read the latest product state.",
            "group": "Inspect",
            "mode": "copy-only"
          }
        ]
      }
    ]
  },
  "action": {
    "next": "symphony status",
    "mode": "copy-only"
  }
}
```

Report `status` is `"no-runs"` when no run states exist, `"attention"` when high-severity risks or required tool gaps are visible, and `"ready"` otherwise. Required readiness currently means Node.js is running and `pnpm` plus git worktree checks are available; optional GitHub and real-agent CLI gaps appear in `risks` but do not by themselves make a report unusable.

`symphony diagnose` without flags renders a short terminal summary. `symphony diagnose --html` renders the same report as a single HTML document to stdout, suitable for `symphony diagnose --html > report.html`. The HTML report escapes all dynamic text, has no `<script>` block, has no external resource references, and presents commands only as copyable text.

v12 diagnostics add adoption-specific risk categories as additive values:

- `pending_adoption` for frozen plans waiting on copy-only confirmation.
- `stale_adoption` for confirmation preflights that detect drift.
- `dirty_worktree_blocks_adoption` when local git dirtiness blocks pending adoption.
- `adoption_dirty_file_details` when pending or stale adoption is blocked by dirty files; the risk includes `dirtyPaths` when available and always includes `dirtyPathCount`.
- `adoption_apply_in_progress` when an adoption confirmation run is `applying` or an adoption journal remains `applying`.
- `adoption_post_apply_failed` when patch application succeeded but post-apply evidence or final state persistence failed with `failurePhase: "post-apply-evidence"`.
- `unsupported_adoption_changes` when the source workspace contains changes outside v12 text add/modify support.

## `symphony.console-run-timeline`

`GET /api/runs/<run-id>/timeline` derives a compact v9 timeline from persisted run state. It does not introduce new canonical storage.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-run-timeline",
  "runId": "symphony-scan-demo-abc123-1",
  "timeline": [
    {
      "id": "created",
      "label": "Run created",
      "status": "done",
      "detail": "symphony-scan-demo-abc123-1",
      "at": "2026-05-23T00:00:00.000Z"
    },
    {
      "id": "artifacts",
      "label": "Artifacts",
      "status": "done",
      "detail": "2 registered"
    }
  ],
  "recommendedCommands": [
    {
      "id": "artifacts",
      "label": "Artifacts",
      "command": "symphony artifacts symphony-scan-demo-abc123-1",
      "description": "Print registered artifact references for this run.",
      "mode": "copy-only"
    }
  ]
}
```

## `symphony.console-artifact`

`GET /api/runs/<run-id>/artifacts/<kind>` reads only a path already registered in that run's `artifactRefs`. v12 adoption patch and journal previews use the normal `adoption-patch` and `adoption-journal` artifact refs and keep the same 200 KiB cap.

JSON file preview:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-artifact",
  "runId": "symphony-scan-demo-abc123-1",
  "artifact": {
    "kind": "context",
    "path": "tmp/context.json",
    "type": "file",
    "size": 512,
    "truncated": false,
    "format": "json",
    "content": "{\"kind\":\"project-context\"}",
    "json": {
      "kind": "project-context"
    }
  }
}
```

Directory preview:

```json
{
  "contractName": "symphony.console-artifact",
  "artifact": {
    "kind": "evidence",
    "path": "tmp/evidence",
    "type": "directory",
    "entryCount": 1,
    "limit": 100,
    "entries": [
      {
        "name": "summary.json",
        "type": "file"
      }
    ],
    "truncated": false
  }
}
```

Missing or malformed previews stay read-only and structured:

```json
{
  "contractName": "symphony.console-artifact",
  "status": "missing-artifact",
  "artifact": {
    "kind": "context",
    "path": "tmp/missing.json",
    "type": "missing",
    "message": "artifact file is missing"
  }
}
```

```json
{
  "contractName": "symphony.console-artifact",
  "artifact": {
    "kind": "summary",
    "path": "tmp/summary.json",
    "type": "file",
    "format": "malformed-json",
    "parseError": "Unexpected end of JSON input"
  }
}
```

Large file previews include the same `content` field capped at 200 KiB plus `truncated: true`, `previewLimitBytes: 204800`, and a human-readable `message`. Truncated JSON-shaped files are reported as `format: "truncated-json"` rather than malformed, because the Workbench has intentionally read only the preview window.
