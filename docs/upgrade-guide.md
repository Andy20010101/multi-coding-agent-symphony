# Upgrade Guide

## Upgrade status

Run the status check first:

```sh
symphony install status --json
```

The status contract is `installStatus.v1`. It reports the install checkout, current ref, target ref, shim paths, blocked reasons, and the `symphony doctor` command text. It does not run doctor.

## Dry-run plan

Choose a verified release ref and run a dry-run:

```sh
symphony install upgrade --target-ref <verified-ref> --dry-run --json
```

Use `--rollback-ref <ref>` when you want the plan to check a specific rollback point:

```sh
symphony install upgrade --target-ref <verified-ref> --rollback-ref <current-ref> --dry-run --json
```

The contract is `installUpgradePlan.v1`. It checks whether the install directory is a git checkout, whether it is dirty, whether Node and pnpm are available, and whether target and rollback refs already exist locally. `plannedMutations` must remain an empty array.

## Manual upgrade

The dry-run does not fetch tags or change the checkout. If the plan is ready, perform the upgrade from a terminal you control:

```sh
git -C "$MCAS_INSTALL_DIR" fetch --tags origin
git -C "$MCAS_INSTALL_DIR" checkout <verified-ref>
pnpm --dir "$MCAS_INSTALL_DIR" install --frozen-lockfile
"$MCAS_BIN_DIR/symphony" doctor
```

Use the same `MCAS_INSTALL_DIR` and `MCAS_BIN_DIR` values reported by `installStatus.v1`. If those variables are not set, the installer defaults are `~/.local/share/mcas` and `~/.local/bin`.

## Rollback

Record the current ref from `installStatus.v1` before upgrading. If the upgrade fails after checkout, return to that ref:

```sh
git -C "$MCAS_INSTALL_DIR" checkout <rollback-ref>
pnpm --dir "$MCAS_INSTALL_DIR" install --frozen-lockfile
"$MCAS_BIN_DIR/symphony" doctor
```

Rollback is manual. Workbench does not run checkout, fetch, dependency install, doctor, overwrite, merge, push, tag, publish, or GitHub Release commands.

## Workbench surface

Workbench shows installer status from `GET /api/install/status` and copy-only CLI command text. It accepts no install path query, does not read arbitrary local folders, and does not expose an install, upgrade, or rollback button.
