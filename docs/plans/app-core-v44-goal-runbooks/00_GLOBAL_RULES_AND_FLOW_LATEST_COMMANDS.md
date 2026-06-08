# v44 Project-internal Goal Supervisor Core Latest Commands

Date: 2026-06-08

Goal id draft: `v44-project-internal-goal-supervisor-core`

## Command Spine

Use the existing managed goal workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout
```

v44 adds repository-owned supervisor core logic around result parsing, route decisions, progress state, and write previews. It does not replace the managed goal command spine.

## Runtime Boundary

The live temporary automation path remains external:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Repository implementation in v44 should read and project state, validate results, and preview writes. Do not make repository code the live daemon owner in this release.

## Provider Boundary

Active providers remain:

```text
claude-code-cli
codex-cli
```

Do not add Gemini CLI, Kiro CLI, DeepSeek, raw provider CLI execution, browser terminal automation, tag/push/publish automation, or a generic shell runner.

## v44 Default Checks

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Use docs-updated evidence in task or closeout evidence. Do not add mutation, audit, doctor, tag, push, publish, or external daemon commands to scoped closeout unless a later task explicitly changes the fixture.

## Event Registration Rule

`state-writer.js` and `event-registrar.js` are preview-only in v44 unless a later task explicitly authorizes confirm paths.

Preview payloads must include:

- goal id
- task id
- role
- event type
- evidence ref
- target branch
- target head
- refusal reasons when blocked

## Result Consumption Rule

- Valid escrow or bounded result state takes priority over lossy thread-read failures.
- `notLoaded` is not a success result and not a failure result.
- Reviewer approval is not main verification.
- Release closeout remains blocked until explicit operator authorization exists.
