#!/usr/bin/env bash

set -euo pipefail

# ==============================
# Learning_Studio One-Key Deploy
# Target: Ubuntu (root)
# ==============================

REPO_URL="https://github.com/ssfxx0923/Learning_Studio.git"
APP_DIR="/opt/Learning_Studio"
GPTLOAD_DIR="/opt/gpt-load"

NODE_VERSION="v20.19.0"

echo "[1/10] System update and base tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl wget git unzip gnupg lsb-release software-properties-common

echo "[2/10] Install Docker and Compose if missing..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y docker.io docker-compose-plugin
  systemctl enable --now docker
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

echo "[3/10] Install NVM and Node ${NODE_VERSION} if missing..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v || echo '')" != "${NODE_VERSION}" ]]; then
  if [[ ! -d "/root/.nvm" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck disable=SC1091
  source /root/.nvm/nvm.sh
  nvm install "${NODE_VERSION}"
  nvm alias default "${NODE_VERSION}"
  nvm use default
fi

echo "[4/10] Install pm2 globally and enable startup..."
# shellcheck disable=SC1091
source /root/.nvm/nvm.sh
npm i -g pm2
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "[5/10] Install n8n globally and run with pm2 on 5678 (no cookies)..."
npm i -g n8n
pm2 delete n8n >/dev/null 2>&1 || true
pm2 start "n8n" --name n8n -- \
  --tunnel=false
pm2 set pm2:autodump true >/dev/null 2>&1 || true
# Persist n8n env via ecosystem variables
pm2 restart n8n --update-env \
  -x --interpreter none \
  --env "N8N_HOST=0.0.0.0" \
  --env "N8N_PORT=5678" \
  --env "N8N_PROTOCOL=http" \
  --env "N8N_SECURE_COOKIE=false" \
  --env "N8N_DIAGNOSTICS_ENABLED=false" || true

echo "[6/10] Deploy gpt-load via docker compose..."
mkdir -p "${GPTLOAD_DIR}"
cd "${GPTLOAD_DIR}"
if [[ ! -f docker-compose.yml ]]; then
  wget -q https://raw.githubusercontent.com/tbphp/gpt-load/refs/heads/main/docker-compose.yml
fi
if [[ ! -f .env ]]; then
  wget -q -O .env https://raw.githubusercontent.com/tbphp/gpt-load/refs/heads/main/.env.example
fi
docker compose up -d

echo "[7/10] Clone or update Learning_Studio repo..."
if [[ -d "${APP_DIR}/.git" ]]; then
  cd "${APP_DIR}"
  git fetch --all --prune
  git reset --hard origin/$(git rev-parse --abbrev-ref HEAD || echo main)
else
  mkdir -p "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
fi

echo "[8/10] Install dependencies (frontend + server)..."
# Frontend (root)
npm install

# Backend (server)
cd server
npm install

echo "[9/10] Start backend (port 3002) with pm2..."
pm2 delete learning-backend >/dev/null 2>&1 || true
pm2 start npm --name learning-backend -- run dev --silent --cwd "${APP_DIR}/server" \
  --update-env -- 
pm2 restart learning-backend --update-env \
  --env "PORT=3002" \
  --env "NODE_ENV=development"

echo "[10/10] Start frontend (Vite dev, port 5173) with pm2..."
cd "${APP_DIR}"
pm2 delete learning-frontend >/dev/null 2>&1 || true
pm2 start npm --name learning-frontend -- run dev --silent -- \
  --host --port 5173

pm2 save

echo "\nDeployment completed. Services:"
echo "- Frontend:   http://<your-host>:5173"
echo "- Backend:    http://<your-host>:3002"
echo "- n8n:        http://<your-host>:5678"
echo "- gpt-load:   docker compose in ${GPTLOAD_DIR}"


