# Troubleshooting

## CLI Binary Missing

Symptom: `pnpm smoke:<adapter>:help` fails with command not found.

Check:

```sh
codex exec --help
claude --help
kiro-cli --help
```

Fix the local CLI installation or PATH, then rerun the matching help smoke.

## Real Smoke Skipped

Symptom: real smoke output says the run was skipped.

Cause: real model calls are gated by environment variables.

Enable only the intended gate:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real
```

## Structured Output Schema Failure

Symptom: verifier reports missing checks, invalid evidence, or `real-cli-output-unverified`.

Check:

- The adapter raw stdout/stderr artifacts.
- `schemas/evidence-package.schema.json` for strict object fields.
- The final message artifact for Codex real runs.
- The relevant adapter test: `node --test tests/codex-real-cli.test.js`, `node --test tests/claude-real-cli.test.js`, or `node --test tests/kiro-real-cli.test.js`.

## Policy Denied Before Adapter Start

Symptom: `PolicyDeniedError` appears and no adapter run starts.

Check the `policy.decision` event. Common causes:

- Sensitive path request matched `.env`, `.env.*`, `.ssh`, `.npmrc`, `.netrc`, or `secrets`.
- Shell command did not match `allowedCommands` or `allowedCommandPatterns`.
- Network policy is `disabled` or `restricted` without a matching `allowedNetworkHosts` entry.

Run:

```sh
node --test tests/security-policy.test.js
```

## GitHub Intake Fails

Symptom: `pnpm mcas github issue ...` cannot fetch an issue.

Check:

```sh
gh auth status
gh issue view 123 --repo OWNER/REPO --json number,title,body,url,state,labels,assignees,milestone
```

The MCAS CLI uses `gh issue view` for read-only intake and does not invoke a model.

## Workspace Conflict

Symptom: primary writer allocation fails.

Cause: one task already has a primary writer workspace.

Use a new task id or clean the configured runtime workspace directory after preserving needed artifacts.
