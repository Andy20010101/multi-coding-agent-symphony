# Security Checklist

Run this checklist before enabling real CLI execution, after changing policy code, and before release tags.

## Redaction

- Artifact Store must redact token-looking values, authorization headers, `.env` paths, `.npmrc`, `.netrc`, and SSH key paths before writing JSON artifacts.
- Session Event Log must redact the same classes before persistence.
- Caller-owned objects must not be mutated by redaction.
- Verification command: `node --test tests/security-policy.test.js`.

## Policy Gate

- Path requests use `{ "action": "read|write", "target": "path" }`; default denied paths include `.env`, `.env.*`, `.ssh`, `.npmrc`, `.netrc`, and `secrets`.
- Shell requests use `{ "action": "shell", "command": "command" }`; denied exact commands and denied patterns take precedence over allowed commands and patterns.
- Network requests use `{ "action": "network", "target": "host-or-url" }`; `network: "disabled"` denies all, `network: "restricted"` allows only `allowedNetworkHosts`, and `deniedNetworkHosts` takes precedence.
- Orchestrator must emit `policy.decision` for each request and must stop before adapter start on any denied decision.
- Verification command: `node --test tests/security-policy.test.js`.

## Adapter Permissions

- Codex must map denied shell or network decisions to `--sandbox read-only` and render denied path, shell, and network restrictions into the prompt.
- Claude Code must map denied paths to `Read(<rule>)`, denied shell to `Bash`, and denied network to `WebFetch` plus `WebSearch` through `--disallowedTools`.
- Kiro CLI must remove `read` and `grep` for denied path decisions and remove `bash` for denied shell or network decisions.
- Adapter permission mapping must not mutate `CommandSpec`.
- Verification command: `node --test tests/phase3.test.js`.

## Release Gates

Use the active version runbook for scoped release gates. For v60 Stable Personal Workbench Release, `docs/plans/v60-stable-personal-workbench-release-runbook-2026-06-14.md` owns the focused test list and the `pnpm test` decision before tagging.

- Static syntax check: `pnpm check`.
- Full test suite: `pnpm test`.
- Whitespace check: `git diff --check`.
- Codex help smoke: `pnpm smoke:codex:help`, when the runbook asks for installed CLI validation.
- Claude Code help smoke: `pnpm smoke:claude:help`, when the runbook asks for installed CLI validation.
- Kiro CLI help smoke: `pnpm smoke:kiro:help`, as a historical optional repo-level check, not a v60 active Workbench provider gate.
- Real model smokes are opt-in and must stay gated by their environment variables: `pnpm smoke:codex:real`, `pnpm smoke:claude:real`, and `pnpm smoke:kiro:real`. They are not v60 default release gates.

## v60 Workbench Boundary

- Workbench must not expose raw transcripts, raw model output, provider payloads, local JSONL session files, provider session folders, `.symphony` internals, or goal ledgers to the frontend.
- Workbench must not add generic shell or terminal UI, renderer-side command execution, provider launch outside existing controlled contracts, direct goal event append, direct task completion, worktree creation, tag/push/publish automation, or GitHub Release creation/edit/upload controls.
- Release readiness must come from explicit contracts and recorded evidence, not branch names, filenames, prompt text, test success, or UI state.
