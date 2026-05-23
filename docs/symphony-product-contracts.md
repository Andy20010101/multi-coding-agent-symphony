# Symphony Product JSON Contracts

v8.2 made the product CLI JSON surface stable for scripts and local UI consumers. v9 adds workbench-oriented console fields and read-only routes without changing `contractVersion`. Contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only; non-GET HTTP requests return `405`.
- File previews are capped at 200 KiB and return `truncated: true` when capped.
- v9 workbench commands are copy-only recommendations. The browser UI does not execute commands or write files.
- v9 readiness checks may inspect local CLI availability, git state, GitHub auth/CI visibility, and real CLI gate status; they do not invoke models and must not expose token values.

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

## `symphony.console-snapshot`

`symphony console --snapshot --json` and `GET /api/summary` return the read-only state overview.

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-snapshot",
  "stateDir": ".symphony",
  "status": "ready",
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
  "recommendedCommands": [
    {
      "id": "console",
      "label": "Open workbench",
      "command": "symphony console",
      "description": "Return to this read-only dashboard.",
      "mode": "copy-only"
    }
  ],
  "action": {
    "next": "symphony status"
  }
}
```

When no runs exist, `status` is `"no-runs"`, `latestRun` is `null`, and the next action is `symphony scan`.

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
    ]
  },
  "rawRunState": {}
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
      "dirtyFilesCount": 0
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
  ]
}
```

If optional tools such as `gh`, Codex, Claude, or Kiro are missing, their status is reported as unavailable or optional rather than failing the read-only console route.

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

`GET /api/runs/<run-id>/artifacts/<kind>` reads only a path already registered in that run's `artifactRefs`.

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
    "parseError": "invalid JSON artifact preview"
  }
}
```
