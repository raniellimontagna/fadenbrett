#!/usr/bin/env bash
# ============================================================================
# Fadenbrett — Proxmox LXC Installer
# https://github.com/raniellimontagna/fadenbrett
#
# Usage (run on Proxmox VE host shell):
#   bash <(curl -fsSL https://raw.githubusercontent.com/raniellimontagna/fadenbrett/main/scripts/proxmox/install.sh)
#
# Optional env overrides before piping:
#   CT_ID=200 CT_RAM=1024 FADENBRETT_PORT=8080 bash <(curl -fsSL ...)
#
# Compatible with Proxmox VE 7.x and 8.x
# ============================================================================
set -euo pipefail

# ── ANSI helpers ─────────────────────────────────────────────────────────────
YW="\033[33m" GN="\033[1;92m" RD="\033[01;31m" CL="\033[m" BFR="\\r\\033[K" HOLD=" "
msg_info()  { local msg="$1"; echo -ne "${HOLD} ${YW}${msg}...${CL}"; }
msg_ok()    { local msg="$1"; echo -e "${BFR} ${GN}✔ ${msg}${CL}"; }
msg_error() { local msg="$1"; echo -e "${BFR} ${RD}✖ ${msg}${CL}"; exit 1; }

# ── Configurable parameters (override via env) ────────────────────────────────
CT_ID="${CT_ID:-$(pvesh get /cluster/nextid 2>/dev/null || echo 200)}"
CT_HOSTNAME="${CT_HOSTNAME:-fadenbrett}"
CT_RAM="${CT_RAM:-512}"
CT_CORES="${CT_CORES:-1}"
CT_DISK="${CT_DISK:-8}"
CT_STORAGE="${CT_STORAGE:-}"
CT_BRIDGE="${CT_BRIDGE:-vmbr0}"
FADENBRETT_PORT="${FADENBRETT_PORT:-80}"

REPO_URL="https://github.com/raniellimontagna/fadenbrett.git"

# ── Detect storage if not provided ────────────────────────────────────────────
if [[ -z "$CT_STORAGE" ]]; then
  CT_STORAGE=$(pvesm status --content rootdir 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
  [[ -z "$CT_STORAGE" ]] && CT_STORAGE="local-lvm"
fi

echo -e "\n\033[1;96m  Fadenbrett LXC Installer\033[m"
echo    "  ─────────────────────────────────────────"
printf  "  CT ID:    %s\n  Hostname: %s\n  RAM:      %s MB\n  Cores:    %s\n  Disk:     %s GB\n  Storage:  %s\n  Port:     %s\n\n" \
  "$CT_ID" "$CT_HOSTNAME" "$CT_RAM" "$CT_CORES" "$CT_DISK" "$CT_STORAGE" "$FADENBRETT_PORT"

# ── Download Debian 12 template ───────────────────────────────────────────────
TEMPLATE_STORAGE=$(pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
[[ -z "$TEMPLATE_STORAGE" ]] && TEMPLATE_STORAGE="local"

msg_info "Downloading Debian 12 template"
pveam update &>/dev/null || true
TEMPLATE=$(pveam available --section system 2>/dev/null | grep "debian-12-standard" | sort -V | tail -1 | awk '{print $2}')
[[ -z "$TEMPLATE" ]] && msg_error "Could not find debian-12-standard template"
pveam download "$TEMPLATE_STORAGE" "$TEMPLATE" &>/dev/null || true
msg_ok "Template ready: $TEMPLATE"

# ── Create the LXC container ─────────────────────────────────────────────────
msg_info "Creating LXC container $CT_ID"
pct create "$CT_ID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
  --hostname "$CT_HOSTNAME" \
  --cores "$CT_CORES" \
  --memory "$CT_RAM" \
  --rootfs "${CT_STORAGE}:${CT_DISK}" \
  --net0 "name=eth0,bridge=${CT_BRIDGE},ip=dhcp,ip6=auto" \
  --unprivileged 1 \
  --features "nesting=1" \
  --ostype debian \
  --start 0 \
  --onboot 1 \
  --tags fadenbrett
msg_ok "Container $CT_ID created"

# ── Start and wait for network ────────────────────────────────────────────────
msg_info "Starting container"
pct start "$CT_ID"
sleep 8
msg_ok "Container started"

# ── Install Docker + git inside the LXC ──────────────────────────────────────
msg_info "Installing Docker (this may take a minute)"
pct exec "$CT_ID" -- bash -c "
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \$(. /etc/os-release && echo \"\$VERSION_CODENAME\") stable\" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
" 2>&1 | grep -v "^$" || true
msg_ok "Docker installed"

# ── Clone repo and build images locally ──────────────────────────────────────
msg_info "Cloning Fadenbrett and building (first build takes a few minutes)"
pct exec "$CT_ID" -- bash -c "
  set -euo pipefail
  git clone --depth 1 ${REPO_URL} /opt/fadenbrett
  cd /opt/fadenbrett/deploy
  PORT=${FADENBRETT_PORT} docker compose up --build -d
" 2>&1 | grep -v "^$" || true
msg_ok "Fadenbrett built and deployed"

# ── Write PORT to env file for systemd ───────────────────────────────────────
pct exec "$CT_ID" -- bash -c "
  echo 'PORT=${FADENBRETT_PORT}' > /opt/fadenbrett/deploy/.env
"

# ── Auto-start compose on LXC boot ───────────────────────────────────────────
pct exec "$CT_ID" -- bash -c "
  cat > /etc/systemd/system/fadenbrett.service <<'SVC'
[Unit]
Description=Fadenbrett
After=docker.service network-online.target
Requires=docker.service

[Service]
WorkingDirectory=/opt/fadenbrett/deploy
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=on-failure
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
SVC
  systemctl daemon-reload
  systemctl enable fadenbrett
" 2>/dev/null
msg_ok "Auto-start configured"

# ── Display result ────────────────────────────────────────────────────────────
CT_IP=$(pct exec "$CT_ID" -- hostname -I 2>/dev/null | awk '{print $1}' || echo "<IP pending>")

echo ""
echo -e "\033[1;92m  ✔ Fadenbrett is running!\033[m"
echo -e "  ─────────────────────────────────────────"
echo -e "  URL:      \033[1;96mhttp://${CT_IP}:${FADENBRETT_PORT}\033[m"
echo -e "  Data dir: inside LXC $CT_ID at /opt/fadenbrett/deploy (Docker volume)"
echo -e "  Update:   CT_ID=$CT_ID bash <(curl -fsSL https://raw.githubusercontent.com/raniellimontagna/fadenbrett/main/scripts/proxmox/update.sh)"
echo ""
