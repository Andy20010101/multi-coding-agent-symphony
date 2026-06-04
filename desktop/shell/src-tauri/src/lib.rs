use serde::Serialize;
use std::{
    io::{Read, Write},
    net::{TcpStream, ToSocketAddrs},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::Duration,
};

const CONTRACT_NAME: &str = "sidecar-host-lifecycle.v1";
const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 8765;
const MIN_PORT: u16 = 1024;
const MAX_PORT: u16 = 65535;
const HEALTH_ROUTE: &str = "/api/health";
const LAUNCH_COMMAND_ID: &str = "symphony.console.sidecar.launch";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SidecarBridgeState {
    contract_name: &'static str,
    contract_version: u8,
    host_kind: &'static str,
    sidecar_kind: &'static str,
    lifecycle: String,
    attach: AttachState,
    launcher: LauncherState,
    boundaries: BridgeBoundaries,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AttachState {
    state: String,
    strategy: &'static str,
    health_route: &'static str,
    endpoint: String,
    process_id: Option<u32>,
    source_contract: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LauncherState {
    state: String,
    command_id: &'static str,
    native_host_required: bool,
    renderer_launch_available: bool,
    allowed_hosts: [&'static str; 2],
    allowed_port_range: PortRange,
    state_dir_scope: &'static str,
    source: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PortRange {
    min: u16,
    max: u16,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BridgeBoundaries {
    read_only_health: bool,
    renderer_shell_execution_available: bool,
    generic_shell_runner_available: bool,
    arbitrary_command_available: bool,
    arbitrary_path_available: bool,
    model_invocation_available: bool,
    git_write_available: bool,
    release_write_available: bool,
}

#[derive(Debug)]
struct SidecarTarget {
    host: String,
    port: u16,
}

#[tauri::command]
fn attach_sidecar(host: Option<String>, port: Option<u16>) -> Result<SidecarBridgeState, String> {
    let target = normalize_target(host, port)?;
    let attached = probe_health(&target).unwrap_or(false);
    Ok(build_state(target, attached, None))
}

#[tauri::command]
fn launch_sidecar(host: Option<String>, port: Option<u16>) -> Result<SidecarBridgeState, String> {
    let target = normalize_target(host, port)?;

    if probe_health(&target).unwrap_or(false) {
        return Ok(build_state(target, true, None));
    }

    let port_text = target.port.to_string();
    let child = Command::new("pnpm")
        .args([
            "symphony",
            "console",
            "--host",
            target.host.as_str(),
            "--port",
            port_text.as_str(),
        ])
        .current_dir(repo_root())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("failed to launch controlled sidecar: {error}"))?;

    Ok(build_state(target, false, Some(child.id())))
}

fn build_state(target: SidecarTarget, attached: bool, launched_pid: Option<u32>) -> SidecarBridgeState {
    let lifecycle = if attached { "attached" } else { "needs-attach" };
    let attach_state = if attached { "attached" } else { "detached" };
    let launcher_state = if launched_pid.is_some() {
        "launch-requested"
    } else {
        "defined"
    };

    SidecarBridgeState {
        contract_name: CONTRACT_NAME,
        contract_version: 1,
        host_kind: "tauri-native-host",
        sidecar_kind: "symphony-console-sidecar",
        lifecycle: lifecycle.to_string(),
        attach: AttachState {
            state: attach_state.to_string(),
            strategy: "loopback-health-probe",
            health_route: HEALTH_ROUTE,
            endpoint: format!("http://{}:{}{}", target.host, target.port, HEALTH_ROUTE),
            process_id: launched_pid,
            source_contract: "local-runtime-health.v1",
        },
        launcher: LauncherState {
            state: launcher_state.to_string(),
            command_id: LAUNCH_COMMAND_ID,
            native_host_required: true,
            renderer_launch_available: false,
            allowed_hosts: [DEFAULT_HOST, "localhost"],
            allowed_port_range: PortRange {
                min: MIN_PORT,
                max: MAX_PORT,
            },
            state_dir_scope: "repo-local .symphony only",
            source: "desktop/shell/src-tauri controlled command registry",
        },
        boundaries: BridgeBoundaries {
            read_only_health: true,
            renderer_shell_execution_available: false,
            generic_shell_runner_available: false,
            arbitrary_command_available: false,
            arbitrary_path_available: false,
            model_invocation_available: false,
            git_write_available: false,
            release_write_available: false,
        },
    }
}

fn normalize_target(host: Option<String>, port: Option<u16>) -> Result<SidecarTarget, String> {
    let normalized_host = match host.as_deref().unwrap_or(DEFAULT_HOST) {
        DEFAULT_HOST => DEFAULT_HOST.to_string(),
        "localhost" => "localhost".to_string(),
        _ => return Err("sidecar host must be 127.0.0.1 or localhost".to_string()),
    };
    let normalized_port = port.unwrap_or(DEFAULT_PORT);

    if !(MIN_PORT..=MAX_PORT).contains(&normalized_port) {
        return Err(format!("sidecar port must be between {MIN_PORT} and {MAX_PORT}"));
    }

    Ok(SidecarTarget {
        host: normalized_host,
        port: normalized_port,
    })
}

fn probe_health(target: &SidecarTarget) -> Result<bool, String> {
    let address = (target.host.as_str(), target.port)
        .to_socket_addrs()
        .map_err(|error| format!("failed to resolve sidecar target: {error}"))?
        .next()
        .ok_or_else(|| "sidecar target did not resolve".to_string())?;
    let mut stream = TcpStream::connect_timeout(&address, Duration::from_millis(500))
        .map_err(|error| format!("sidecar health probe failed: {error}"))?;

    stream
        .set_read_timeout(Some(Duration::from_millis(500)))
        .map_err(|error| format!("failed to set sidecar probe read timeout: {error}"))?;
    stream
        .set_write_timeout(Some(Duration::from_millis(500)))
        .map_err(|error| format!("failed to set sidecar probe write timeout: {error}"))?;
    stream
        .write_all(format!("GET {HEALTH_ROUTE} HTTP/1.1\r\nHost: {}\r\nConnection: close\r\n\r\n", target.host).as_bytes())
        .map_err(|error| format!("failed to write sidecar health request: {error}"))?;

    let mut response = String::new();
    stream
        .take(16 * 1024)
        .read_to_string(&mut response)
        .map_err(|error| format!("failed to read sidecar health response: {error}"))?;

    Ok(response.starts_with("HTTP/1.1 200") && response.contains("local-runtime-health.v1"))
}

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![attach_sidecar, launch_sidecar])
        .run(tauri::generate_context!())
        .expect("failed to run Symphony Desktop Shell Tauri host");
}
