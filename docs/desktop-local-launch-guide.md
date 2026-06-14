# Desktop Local Launch Guide

Date: 2026-06-15
Scope: v63 Mac App Local Launch MVP

## What This Path Covers

The v63 local launch path is for a developer checkout on macOS. It opens the existing Workbench App Home route at `/workbench/desktop/` through the Tauri shell when local tooling is available, or through the browser fallback when the native host cannot be started.

This path does not provide a public installer, signed app, notarized app, app store package, auto-update channel, release publisher, generic terminal, or provider launcher.

## Validate The Checkout

Run these checks from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

Expected result:

- `pnpm desktop:shell:smoke` prints `desktop-shell-smoke.v1` with `status: "ok"`;
- `cargo check` finishes the `symphony-desktop-shell` crate;
- `bundle.active` remains `false`;
- the native bridge remains limited to `attach_sidecar` and `launch_sidecar`;
- the renderer still shows command text only and does not execute shell commands.

## Start The Local Sidecar

Start the Workbench sidecar from the repository root:

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
```

Health check:

```sh
curl -fsS http://127.0.0.1:8765/api/health
```

Expected result: the response includes `local-runtime-health.v1`.

## Open The Browser Fallback

When the native app host is unavailable, use the browser route:

```text
http://127.0.0.1:8765/workbench/desktop/
```

This route is the same App Home surface used by the Tauri window. It shows current project, backend health, sidecar state, active goal, next action, route provenance, and local recovery status from read-only contracts.

## Run The Local Tauri Host

For source-level host verification:

```sh
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

For a local native window on a machine with the Tauri development prerequisites available, keep the sidecar running and start the host from the checkout:

```sh
cargo run --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

The native window route is `/workbench/desktop/`. The host bridge can attach to the loopback sidecar or request the fixed sidecar launch command. It does not accept arbitrary command text, arbitrary paths, model options, git operations, or release operations.

## Sidecar Recovery

Use these manual checks when App Home shows a sidecar state other than `attached`:

| Visible state | Check | Recovery |
| --- | --- | --- |
| `sidecar missing` | `curl -fsS http://127.0.0.1:8765/api/health` fails or `sidecar-host-lifecycle.v1` is missing. | Start `pnpm symphony console --host 127.0.0.1 --port 8765`, then refresh App Home. |
| `sidecar launchable` | App Home sees the fixed launcher but no attached sidecar. | Start the sidecar manually or use the native host attach/launch bridge when running inside Tauri. |
| `sidecar launching` | Native host requested the fixed sidecar command. | Wait for `/api/health`, then refresh App Home. |
| `sidecar failed` | Attach or launch state reports `failed`. | Stop the failed process, start the sidecar manually, then rerun the health check. |
| `sidecar wrong port` | Health endpoint is not the expected loopback port. | Restart the sidecar on `127.0.0.1:8765` or use the configured local port. |
| `sidecar port conflict` | The configured port is already occupied or points to the wrong process. | Choose a free loopback port or stop the conflicting local process. |
| `sidecar stale` | Runtime freshness is stale. | Restart the sidecar and refresh App Home after `/api/health` returns. |
| `sidecar unavailable` | Runtime route or health contract is unavailable. | Confirm dependencies are installed, start the sidecar, and use the browser fallback if native host startup is blocked. |

## Boundaries

The Workbench renderer must not:

- execute shell commands;
- read local JSONL files, provider session folders, `.symphony` internals, raw transcripts, or raw model output;
- open arbitrary local paths;
- invoke provider CLIs;
- append goal events or complete tasks from provider output;
- create worktrees;
- merge, push, tag, publish, or create GitHub Releases;
- claim public distribution, signing, notarization, or auto-update.

Those actions remain terminal-owned or release-controller-owned outside product code.
