#!/usr/bin/env bash
# ============================================================================
# Fadenbrett — Proxmox LXC Updater
# Pulls latest source and rebuilds the stack without data loss.
#
# Usage (run on Proxmox VE host shell):
#   CT_ID=200 bash <(curl -fsSL https://raw.githubusercontent.com/raniellimontagna/fadenbrett/main/scripts/proxmox/update.sh)
# ============================================================================
set -euo pipefail

YW="\033[33m" GN="\033[1;92m" RD="\033[01;31m" CL="\033[m" BFR="\\r\\033[K" HOLD=" "
msg_info()  { local msg="$1"; echo -ne "${HOLD} ${YW}${msg}...${CL}"; }
msg_ok()    { local msg="$1"; echo -e "${BFR} ${GN}✔ ${msg}${CL}"; }
msg_error() { local msg="$1"; echo -e "${BFR} ${RD}✖ ${msg}${CL}"; exit 1; }

CT_ID="${CT_ID:-200}"

# Verify container exists and is running
pct status "$CT_ID" &>/dev/null || msg_error "Container $CT_ID not found"

msg_info "Pulling latest Fadenbrett source into CT $CT_ID"
pct exec "$CT_ID" -- bash -c "
  cd /opt/fadenbrett
  git pull --ff-only
" 2>&1 | grep -v "^$" || true
msg_ok "Source updated"

msg_info "Rebuilding and restarting Fadenbrett"
pct exec "$CT_ID" -- bash -c "
  cd /opt/fadenbrett/deploy
  docker compose up --build -d --remove-orphans
" 2>&1 | grep -v "^$" || true
msg_ok "Fadenbrett restarted"

CT_IP=$(pct exec "$CT_ID" -- hostname -I 2>/dev/null | awk '{print $1}' || echo "<IP pending>")
echo ""
echo -e "\033[1;92m  ✔ Update complete!\033[m  http://${CT_IP}"
echo ""
