# Provider Boundary Guide

## Current Position

v65 narrows provider readiness to two active Workbench candidates: Codex CLI for worker tasks and Claude Code CLI for reviewer tasks. Provider readiness is a sanitized status surface, not an execution surface.

Active Workbench provider execution must be backed by current source, fixtures, and tests. Unsupported provider claims are blocked. Readiness cards must not launch providers, expose raw provider output, or read local provider session folders.

## Provider Matrix

| Provider or path | v65 status | Boundary |
| --- | --- | --- |
| Codex CLI | Worker candidate | Readiness can show sanitized binary/profile/help-smoke/optional real-smoke status. Execution remains behind controlled backend contracts and later version gates. |
| Claude Code CLI | Reviewer candidate | Readiness can show sanitized binary/profile/help-smoke/optional real-smoke status. Reviewer execution is not claimed until the reviewer lane has its own contracts and tests. |
| Kiro adapter | Historical compatibility and optional smoke path | Not a v65 active Workbench provider, reviewer, or release gate. |
| DeepSeek provider setting | Claude Code provider configuration detail | Not an independent v65 Workbench provider claim. Missing or mismatched config can block Claude Code readiness without creating a DeepSeek provider lane. |
| Gemini or other providers | Unsupported | Do not claim support, launch, readiness, or release evidence. Unsupported active-provider claims must be blocked. |
| Raw provider CLI commands | Outside Workbench | Do not use raw provider stdout, raw model output, or local provider session files as Workbench evidence. |

## Allowed Evidence

- sanitized provider readiness fields from `providerReadiness.v1`;
- sanitized provider health fields from existing contracts;
- explicit controlled provider runner contract fields when a later version wires execution;
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

Release notes can say v65 adds sanitized provider readiness for Codex CLI worker and Claude Code CLI reviewer candidates. They must not say v65 runs providers from readiness cards, supports Kiro execution, supports Gemini execution, treats DeepSeek as an active Workbench provider, adds a generic provider picker, or automates provider recovery unless a later version adds tests and fixtures for those claims.
