# v6 Curl Installer Plan

Date: 2026-05-20
Baseline: `v5` at `69907f0`
Status: implemented locally

## Goal

Make `symphony` usable from any repository with one install command:

```sh
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v6/install.sh | sh
```

The install path should preserve the v5 boundary: `symphony` remains the user CLI, `mcas` remains the kernel/debug CLI, and all orchestration still runs through the existing repo code rather than duplicated shell logic.

## Scope

- Add a POSIX `install.sh` entrypoint.
- Clone or update the project under `~/.local/share/mcas` by default.
- Install the `v6` release by default.
- Install dependencies with `pnpm install --frozen-lockfile`.
- Write executable shims to `~/.local/bin/symphony` and `~/.local/bin/mcas`.
- Verify with `symphony doctor`.
- Support override env vars:
  - `MCAS_REPO_URL`
  - `MCAS_INSTALL_REF`
  - `MCAS_INSTALL_DIR`
  - `MCAS_BIN_DIR`
  - `MCAS_SKIP_INSTALL`
  - `MCAS_SKIP_DOCTOR`

## Non-Goals

- No npm package publishing.
- No dashboard or server process.
- No new runtime dependencies.
- No automatic real model calls during installation.

## Acceptance

```sh
sh install.sh
symphony doctor
mcas doctor
```

Installer tests must run without network by using a temporary install directory and a local repository URL.
