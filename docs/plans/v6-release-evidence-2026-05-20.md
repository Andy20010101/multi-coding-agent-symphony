# v6 Release Evidence

Date: 2026-05-20
Base tag: `v5`
Scope: public raw curl installer, global `symphony`/`mcas` shims, package-root dispatch from any caller repository.

## Local Gates

All commands exited `0`:

```sh
node --test tests/installer.test.js tests/mcas-cli.test.js tests/symphony-cli.test.js
pnpm check
git diff --check
sh -n install.sh
pnpm test
```

`pnpm test` result: 41 test files passed.

Mutation gate:

```sh
pnpm test:mutation:gate
```

Result: passed. Final mutation score `74.18`; break threshold `60`; killed `1762`; timed out `5`; survived `493`; no errors; no coverage `122`.

## Installer Proofs

Isolated install proof:

```sh
env MCAS_REPO_URL=/path/to/multi-coding-agent-symphony \
  MCAS_INSTALL_REF=main \
  MCAS_INSTALL_DIR=/tmp/mcas-v6-install-proof-3/share/mcas \
  MCAS_BIN_DIR=/tmp/mcas-v6-install-proof-3/bin \
  ./install.sh
```

Result: passed. The installer cloned the project, ran `pnpm install --frozen-lockfile`, wrote both shims, and `symphony doctor` returned `status: ok`.

Shim proof from another directory:

```sh
PATH=/tmp/mcas-v6-install-proof-3/bin:$PATH symphony doctor
PATH=/tmp/mcas-v6-install-proof-3/bin:$PATH mcas doctor
```

Result: both returned `status: ok` from `/tmp`.

Package-root dispatch proof from another directory:

```sh
node /path/to/multi-coding-agent-symphony/scripts/mcas.js smoke codex
```

Result: passed from `/tmp`; the internal `pnpm smoke:codex:help` ran from the package root instead of the caller directory.

## Fixes Found During Release Closure

- `install.sh` defaults `MCAS_INSTALL_REF` to `v6`, so the release installer is reproducible after the tag exists.
- `install.sh` supports `gh repo clone` when GitHub CLI credentials are available, then falls back to `git clone` for the public repository.
- `mcas smoke` and `mcas eval replay` now run package scripts with `cwd` fixed to the installed package root.
- Installer tests disable inherited Git commit signing in the fixture repository.
- Public release docs use `raw.githubusercontent.com/.../v6/install.sh` so the install path works without GitHub authentication.
- Static fake secret-shaped test literals were converted to runtime-built fixtures so current-tree secret scans stay clean before public exposure.

## Known Release Notes

- The isolated install proof used `MCAS_INSTALL_REF=main` before the `v6` tag existed; run the pinned public raw curl command after pushing `v6`.
- Mutation testing covers the existing core source set in `stryker.config.mjs`; installer behavior is covered by `tests/installer.test.js`, targeted CLI tests, and the isolated install proof.
- Git history contains old fake test-token literals from pre-public commits; current-tree scans do not contain those static fixtures.
