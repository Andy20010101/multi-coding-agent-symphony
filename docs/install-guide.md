# Install Guide

## Installer ref policy

The default installer ref remains `v8`.

Use an explicit `MCAS_INSTALL_REF` when you want a newer verified release:

```sh
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v8/install.sh | MCAS_INSTALL_REF=v61 sh
```

Put `MCAS_INSTALL_REF` on the `sh` side of the pipe. Setting it only before `curl` does not pass it to the installer process.

Current verified release for intentional installs:

| Field | Value |
| --- | --- |
| Release tag | `v61` |
| Tag target | `d2cfff816b0111140b3e5e11fb819f60cc0c4911` |
| GitHub Release | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v61` |
| Asset policy | No attached assets |
| Installer default | `v8` |

The installer default should not move to a new tag until the release records:

- annotated tag object and dereferenced commit;
- GitHub Release URL, draft flag, prerelease flag, asset list, publish time, and target commitish;
- open PR state at the time of the decision;
- rollback ref and operator command.

## What the installer does

`install.sh`:

- clones or updates `MCAS_REPO_URL` under `MCAS_INSTALL_DIR`;
- checks out `MCAS_INSTALL_REF`;
- installs dependencies with `pnpm install --frozen-lockfile`, unless `MCAS_SKIP_INSTALL=1`;
- writes `symphony` and `mcas` shims under `MCAS_BIN_DIR`;
- runs `symphony doctor`, unless `MCAS_SKIP_DOCTOR=1`.

Default paths:

| Variable | Default |
| --- | --- |
| `MCAS_INSTALL_REF` | `v8` |
| `MCAS_INSTALL_DIR` | `~/.local/share/mcas` |
| `MCAS_BIN_DIR` | `~/.local/bin` |
| `MCAS_REPO_SLUG` | `Andy20010101/multi-coding-agent-symphony` |

## What the installer does not do

The installer does not provide public distribution, notarization, auto-update, background upgrade, Workbench-triggered checkout changes, renderer network fetches, or GitHub Release automation.

If the install directory is a git checkout with local changes, the installer stops before checkout. Resolve the local changes or use a different `MCAS_INSTALL_DIR`.

## Status check

Use the CLI status contract before deciding whether to install, upgrade, or rollback:

```sh
symphony install status --json
```

`installStatus.v1` reports the install directory, git checkout state, dirty flag, current ref, target ref, shim paths, and `symphony doctor` command text. It is read-only: it does not fetch, checkout, install dependencies, overwrite files, run doctor, or publish a GitHub Release.

Workbench reads the same status through `GET /api/install/status`. The route accepts no query parameters and does not let the renderer choose local paths or execute commands.

## Development checkout

For a development checkout, do not use the global installer path as the working tree. Clone or use the repository directly:

```sh
pnpm install
pnpm symphony doctor
pnpm workbench:build
pnpm symphony console
```

Use the installer for a user-level CLI shim. Use the development checkout for code edits, PR work, and release validation.

Upgrade and rollback steps are in [Upgrade Guide](upgrade-guide.md).
