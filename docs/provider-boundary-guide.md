# Provider Boundary Guide

## Current Position

v60 does not broaden provider execution. It documents the stable local Workbench baseline after v59 and keeps provider behavior inside the contracts already proven by tests and fixtures.

Active Workbench provider execution must be backed by current source, fixtures, and tests. Unsupported provider claims are blocked.

## Provider Matrix

| Provider or path | v60 status | Boundary |
| --- | --- | --- |
| Codex provider execution preview | Existing controlled contract path | Only the tested preview/recovery contracts may describe execution. Workbench must not become a generic launcher. |
| Claude Code adapter | Adapter and optional real smoke path | Not a v60 active Workbench execution provider unless a version-specific contract and test prove the path. |
| Kiro adapter | Historical compatibility and optional smoke path | Not a v60 active Workbench execution provider or release gate. |
| DeepSeek provider setting | Local Claude provider configuration detail | Not an independent v60 Workbench provider claim. |
| Gemini or other providers | Unsupported | Do not claim support, launch, readiness, or release evidence. |
| Raw provider CLI commands | Outside Workbench | Do not use raw provider stdout, raw model output, or local provider session files as Workbench evidence. |

## Allowed Evidence

- sanitized provider health fields from existing contracts;
- explicit controlled provider runner contract fields;
- Codex provider execution preview/recovery evidence covered by current tests;
- proof artifact refs that do not expose raw output or local session paths;
- blocked state with a concrete reason when provider evidence is missing.

## Disallowed Evidence

- raw transcript text;
- raw model output;
- provider payloads;
- local JSONL session files;
- `.codex`, `.claude`, provider session folder, or `/Users/...` paths;
- frontend reads of provider state folders;
- raw provider CLI stdout/stderr as a Workbench contract payload;
- test success used as a substitute for review approval, main verification, or release readiness.

## Workbench Rules

Workbench may display provider state only through backend-owned contracts. It must not add:

- provider launch controls outside existing controlled contracts;
- generic shell or terminal UI;
- renderer-side command execution;
- arbitrary provider selection;
- prompt dispatch from frontend state;
- direct event append from provider output;
- direct task completion from provider output;
- unsupported provider readiness claims.

## Release Wording

Release notes can say v60 documents the current local Workbench path and keeps provider execution behind explicit contracts. They must not say v60 supports public provider execution, Kiro execution, Gemini execution, DeepSeek as an active Workbench provider, generic provider launch, or automatic provider recovery unless a later version adds tests and fixtures for those claims.
