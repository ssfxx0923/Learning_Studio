#!/usr/bin/env bash

set -euo pipefail

# ==============================
# Learning_Studio One-Key Deploy
# Target: Ubuntu (root)
# ==============================

REPO_URL="https://github.com/ssfxx0923/Learning_Studio.git"
APP_DIR="/root/Learning_Studio"
GPTLOAD_DIR="/root/gpt-load"

NODE_VERSION="v20.19.0"

echo "[1/10] System update and base tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl wget git unzip gnupg lsb-release software-properties-common

echo "[2/10] Install Docker and Compose if missing..."
if ! command -v docker >/dev/null 2>&1; then
  # Prefer official Docker APT repo to ensure compose plugin availability (e.g., Ubuntu 25.04)
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin || true
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

  # Make nvm available for all future shells
  cat >/etc/profile.d/nvm.sh <<'EOF'
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
EOF
  chmod 644 /etc/profile.d/nvm.sh
fi

echo "[4/10] Install pm2 globally and enable startup..."
# shellcheck disable=SC1091
source /root/.nvm/nvm.sh
npm i -g pm2
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# Ensure pm2 is available globally in PATH for future sessions
if command -v pm2 >/dev/null 2>&1; then
  ln -sf "$(command -v pm2)" /usr/local/bin/pm2 || true
fi

echo "[5/10] Install n8n globally and run with pm2 on 5678 (no cookies)..."
npm i -g n8n
pm2 delete n8n >/dev/null 2>&1 || true
N8N_HOST=0.0.0.0 \
N8N_PORT=5678 \
N8N_PROTOCOL=http \
N8N_SECURE_COOKIE=false \
N8N_DIAGNOSTICS_ENABLED=false \
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
pm2 start "n8n" --name n8n
pm2 set pm2:autodump true >/dev/null 2>&1 || true

echo "[6/10] Deploy gpt-load via docker compose..."
mkdir -p "${GPTLOAD_DIR}"
cd "${GPTLOAD_DIR}"
if [[ ! -f docker-compose.yml ]]; then
  wget -q https://raw.githubusercontent.com/tbphp/gpt-load/refs/heads/main/docker-compose.yml
fi
if [[ ! -f .env ]]; then
  wget -q -O .env https://raw.githubusercontent.com/tbphp/gpt-load/refs/heads/main/.env.example
fi

# Configure required envs for gpt-load
sed -i 's/^PORT=.*/PORT=3001/; t; $ a PORT=3001' .env
sed -i 's/^HOST=.*/HOST=0.0.0.0/; t; $ a HOST=0.0.0.0' .env
sed -i 's/^ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=*/; t; $ a ALLOWED_ORIGINS=*' .env
# Inject provided AUTH_KEY
if grep -q '^AUTH_KEY=' .env; then
  sed -i 's/^AUTH_KEY=.*/AUTH_KEY=sk-uUA6A4mKsx7z5utdJyr2zTjxqmfD1d4J0WndpnTzgWriJ7HT/' .env
else
  echo 'AUTH_KEY=sk-uUA6A4mKsx7z5utdJyr2zTjxqmfD1d4J0WndpnTzgWriJ7HT' >> .env
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
cd "${APP_DIR}/server"
PORT=3002 NODE_ENV=development pm2 start "npm run dev" --name learning-backend --cwd "${APP_DIR}/server"

echo "[10/10] Start frontend (Vite dev, port 5173) with pm2..."
cd "${APP_DIR}"
pm2 delete learning-frontend >/dev/null 2>&1 || true
pm2 start "npm run dev -- --host --port 5173" --name learning-frontend --cwd "${APP_DIR}"

pm2 save

echo "\nDeployment completed. Services:"
echo "- Frontend:   http://<your-host>:5173"
echo "- Backend:    http://<your-host>:3002"
echo "- n8n:        http://<your-host>:5678"
echo "- gpt-load:   docker compose in ${GPTLOAD_DIR}"


