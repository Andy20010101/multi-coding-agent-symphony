# Symphony Product JSON Contracts

v8.2 makes the product CLI JSON surface stable for scripts and local UI consumers. Contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only; non-GET HTTP requests return `405`.
- File previews are capped at 200 KiB and return `truncated: true` when capped.

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
    "artifactRefs": []
  },
  "runs": [],
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
    "nextAction": "symphony do --dry-run \"inspect README\""
  },
  "rawRunState": {}
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
