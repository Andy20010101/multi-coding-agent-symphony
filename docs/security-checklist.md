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

- Static syntax check: `pnpm check`.
- Full test suite: `pnpm test`.
- Whitespace check: `git diff --check`.
- Codex help smoke: `pnpm smoke:codex:help`.
- Claude Code help smoke: `pnpm smoke:claude:help`.
- Kiro CLI help smoke: `pnpm smoke:kiro:help`.
- Real model smokes are opt-in and must stay gated by their environment variables: `pnpm smoke:codex:real`, `pnpm smoke:claude:real`, and `pnpm smoke:kiro:real`.
