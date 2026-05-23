# Symphony Product JSON Contracts

v8.2 made the product CLI JSON surface stable for scripts and local UI consumers. v9 adds workbench-oriented console fields and read-only routes without changing `contractVersion`. v9.1 adds Workbench diagnostics, run filters, grouped commands, and risk summaries as additive fields. v10 adds the controlled `symphony diagnose` CLI report. Contract v1 changes are additive unless a future response declares a new `contractVersion`.

## Shared Rules

- `contractVersion` is the version gate. v8.2 emits `"1"`.
- `contractName` identifies the response shape.
- Legacy top-level fields remain in product command JSON responses.
- `artifactRefs` is the only artifact path source used by `symphony console` previews.
- The console is local and read-only; non-GET HTTP requests return `405`.
- File previews are capped at 200 KiB and return `truncated: true` when capped.
- v9 workbench commands are copy-only recommendations. The browser UI does not execute commands or write files.
- v9 readiness checks may inspect local CLI availability, git state, GitHub auth/CI visibility, and real CLI gate status; they do not invoke models and must not expose token values.
- v9.1 run filters are read-only selectors. `GET /api/runs?filter=<filter>` supports `all`, `passed`, `failed`, `dry-run`, `real`, `scan`, and `verify`.
- v9.1 diagnostics may add `runStats`, `riskSummary`, `artifactStatus`, and `commandGroups`; older consumers can ignore these fields.
- v10 `symphony diagnose` does not start a server, invoke models, execute recommended commands, read artifact content, or write project files. `--html` writes only to stdout and the generated report is static HTML with no scripts or external resources.
- v10 diagnostics command recommendations remain copy-only text. `--json` and `--html` are mutually exclusive output modes.

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

When no runs exist, `status` is `"no-runs"`, `latestRun` is `null`, and the next action is `symphony scan`.

`GET /api/runs` also accepts an optional v9.1 filter query:

```json
{
  "contractVersion": "1",
  "contractName": "symphony.console-runs",
  "filter": "failed",
  "availableFilters": ["all", "passed", "failed", "dry-run", "real", "scan", "verify"],
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
