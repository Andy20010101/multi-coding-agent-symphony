#!/bin/sh
set -eu

REPO_URL="${MCAS_REPO_URL:-https://github.com/Andy20010101/multi-coding-agent-symphony.git}"
INSTALL_REF="${MCAS_INSTALL_REF:-v6}"
INSTALL_DIR="${MCAS_INSTALL_DIR:-$HOME/.local/share/mcas}"
BIN_DIR="${MCAS_BIN_DIR:-$HOME/.local/bin}"
SKIP_INSTALL="${MCAS_SKIP_INSTALL:-0}"
SKIP_DOCTOR="${MCAS_SKIP_DOCTOR:-0}"

log() {
  printf '%s\n' "mcas-install: $*"
}

warn() {
  printf '%s\n' "mcas-install: warning: $*" >&2
}

fail() {
  printf '%s\n' "mcas-install: error: $*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

shell_quote() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

require_command() {
  command_exists "$1" || fail "$1 is required but was not found on PATH"
}

require_node_20() {
  require_command node

  if ! node -e 'const major = Number(process.versions.node.split(".")[0]); process.exit(major >= 20 ? 0 : 1);' >/dev/null 2>&1; then
    fail "node >=20 is required; found $(node --version 2>/dev/null || printf unknown)"
  fi
}

prepare_install_dir() {
  install_parent=$(dirname "$INSTALL_DIR")
  mkdir -p "$install_parent"

  if [ -d "$INSTALL_DIR/.git" ]; then
    if [ -n "$(git -C "$INSTALL_DIR" status --porcelain)" ]; then
      fail "$INSTALL_DIR has local changes; resolve them or set MCAS_INSTALL_DIR to a clean path"
    fi

    log "updating $INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --tags origin
  elif [ -e "$INSTALL_DIR" ]; then
    fail "$INSTALL_DIR exists but is not a git checkout"
  else
    log "cloning $REPO_URL into $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi

  if git -C "$INSTALL_DIR" show-ref --verify --quiet "refs/remotes/origin/$INSTALL_REF"; then
    git -C "$INSTALL_DIR" checkout -B "$INSTALL_REF" "origin/$INSTALL_REF"
  else
    git -C "$INSTALL_DIR" checkout "$INSTALL_REF"
  fi

  INSTALL_DIR=$(cd "$INSTALL_DIR" && pwd -P)
}

install_dependencies() {
  if [ "$SKIP_INSTALL" = "1" ]; then
    warn "skipping pnpm install because MCAS_SKIP_INSTALL=1"
    return
  fi

  if ! command_exists pnpm && command_exists corepack; then
    log "pnpm not found; trying corepack enable"
    corepack enable >/dev/null 2>&1 || true
  fi

  require_command pnpm

  log "installing dependencies"
  (cd "$INSTALL_DIR" && CI="${CI:-1}" pnpm install --frozen-lockfile)
}

write_shim() {
  name="$1"
  script="$2"
  quoted_install_dir=$(shell_quote "$INSTALL_DIR")
  target="$BIN_DIR/$name"

  {
    printf '%s\n' '#!/bin/sh'
    printf 'exec node %s/%s "$@"\n' "$quoted_install_dir" "$script"
  } > "$target"

  chmod 755 "$target"
}

install_shims() {
  mkdir -p "$BIN_DIR"
  BIN_DIR=$(cd "$BIN_DIR" && pwd -P)

  write_shim symphony scripts/symphony.js
  write_shim mcas scripts/mcas.js
}

verify_install() {
  if [ "$SKIP_DOCTOR" = "1" ]; then
    warn "skipping symphony doctor because MCAS_SKIP_DOCTOR=1"
    return
  fi

  log "running symphony doctor"
  "$BIN_DIR/symphony" doctor
}

print_summary() {
  log "installed symphony from $REPO_URL at $INSTALL_REF"
  log "install dir: $INSTALL_DIR"
  log "bin dir: $BIN_DIR"

  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) warn "$BIN_DIR is not on PATH; add it before running symphony directly" ;;
  esac

  log "try: symphony doctor"
}

main() {
  require_node_20
  require_command git

  if ! command_exists gh; then
    warn "gh was not found on PATH; GitHub-backed commands will need GitHub CLI later"
  fi

  prepare_install_dir
  install_dependencies
  install_shims
  verify_install
  print_summary
}

main "$@"
