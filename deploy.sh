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
  ca-certificates curl wget git unzip gnupg lsb-release software-properties-common nginx

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

echo "[8.5/10] Create .env files with auto-detected IP/domain..."
cd "${APP_DIR}"

# Use domain if provided via environment variable, otherwise use IP
DOMAIN="${APP_DOMAIN:-}"
if [[ -n "${DOMAIN}" ]]; then
  # Use relative path when Nginx reverse proxy is configured (no IP needed)
  API_BASE_URL="/api"
  WEBHOOK_URL="/webhook"
else
  # Auto-detect server IP only when not using reverse proxy
  SERVER_IP=$(hostname -I | awk '{print $1}' || curl -s ifconfig.me || echo "localhost")
  # Use full URL when accessing directly (no Nginx)
  API_BASE_URL="http://${SERVER_IP}:3002"
  WEBHOOK_URL="http://${SERVER_IP}:5678/webhook"
fi

# Create .env file in project root with detected IP/domain
cat > .env <<EOF
# AI学习平台环境变量配置
VITE_API_BASE_URL=${API_BASE_URL}
VITE_N8N_WEBHOOK_URL=${WEBHOOK_URL}
EOF
echo "Created .env in project root with API URL: ${API_BASE_URL}"

# Create .env file in server directory
cat > server/.env <<EOF
PORT=3002
NODE_ENV=development
ARTICLES_BASE_PATH=../public/data/english/artikel
EOF
echo "Created server/.env with backend configuration"

echo "[9/10] Start backend (port 3002) with pm2..."
pm2 delete learning-backend >/dev/null 2>&1 || true
cd "${APP_DIR}/server"
PORT=3002 NODE_ENV=development pm2 start "npm run dev" --name learning-backend --cwd "${APP_DIR}/server"

echo "[10/10] Start frontend (Vite dev, port 5173) with pm2..."
cd "${APP_DIR}"
pm2 delete learning-frontend >/dev/null 2>&1 || true
pm2 start "npm run dev -- --host --port 5173" --name learning-frontend --cwd "${APP_DIR}"

pm2 save

echo "[11/11] Configure Nginx reverse proxy..."
# Use domain if provided, otherwise skip Nginx config
DOMAIN="${APP_DOMAIN:-}"
if [[ -n "${DOMAIN}" ]]; then
  # Create Nginx config for the domain
  cat > "/etc/nginx/sites-available/${DOMAIN}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend proxy (Vite dev server on 5173)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support for Vite HMR
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API proxy (Express server on 3002) - eliminates CORS
    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    # n8n Webhook proxy (n8n on 5678) - eliminates CORS
    location /webhook/ {
        proxy_pass http://127.0.0.1:5678/webhook/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

  # Enable the site
  ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
  
  # Remove default nginx site if exists
  rm -f /etc/nginx/sites-enabled/default
  
  # Test and reload Nginx
  if nginx -t; then
    systemctl reload nginx || systemctl restart nginx
    echo "Nginx configured for domain: ${DOMAIN}"
    echo "Access your app at: http://${DOMAIN} or https://${DOMAIN} (after SSL setup)"
  else
    echo "Warning: Nginx configuration test failed. Please check manually."
  fi
else
  echo "Skipping Nginx config (no APP_DOMAIN set). To use domain, set APP_DOMAIN env var and re-run."
fi

echo "\nDeployment completed. Services:"
if [[ -n "${DOMAIN}" ]]; then
  echo "- Frontend:   https://${DOMAIN}"
  echo "- Backend:    https://${DOMAIN}/api"
  echo "- n8n Webhook: https://${DOMAIN}/webhook"
else
  echo "- Frontend:   http://${SERVER_IP}:5173"
  echo "- Backend:    http://${SERVER_IP}:3002"
  echo "- n8n:        http://${SERVER_IP}:5678"
fi
echo "- gpt-load:   docker compose in ${GPTLOAD_DIR}"


