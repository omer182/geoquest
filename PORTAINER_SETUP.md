# GeoQuest - Portainer Deployment Guide

Complete guide for deploying GeoQuest on your HP EliteDesk 800 Linux server using Portainer.

---

## 📋 Prerequisites

1. **Docker** and **Portainer** installed on your HP EliteDesk 800
2. **GitHub Actions** completed building the images
3. **Container images** set to public visibility

---

## ✅ Step 1: Wait for GitHub Actions Build

Check build status: https://github.com/omer182/geoquest/actions

You should see two successful workflows:
- ✅ Docker Build & Deploy - Frontend
- ✅ Docker Build & Deploy - Backend

Wait until both show green checkmarks (takes ~2-5 minutes).

---

## 🔓 Step 2: Make Container Images Public

1. Go to your packages: https://github.com/omer182?tab=packages

2. Click on **geoquest-frontend**:
   - Click **Package settings** (top right)
   - Scroll to **Danger Zone**
   - Click **Change visibility**
   - Select **Public**
   - Confirm

3. Click on **geoquest-backend**:
   - Repeat the same steps
   - Click **Package settings**
   - Change visibility to **Public**

---

## 🐳 Step 3: Deploy in Portainer

### Navigate to Stacks

1. Open Portainer web interface
2. Click **Stacks** in the left sidebar
3. Click **+ Add stack** button

### Configure Stack

**Stack name:** `geoquest`

**Build method:** Web editor

**Web editor - Paste this:**

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/omer182/geoquest-backend:latest
    container_name: geoquest-backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CORS_ORIGIN=http://frontend
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - geoquest-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  frontend:
    image: ghcr.io/omer182/geoquest-frontend:latest
    container_name: geoquest-frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - geoquest-network

networks:
  geoquest-network:
    driver: bridge
```

### Deploy

1. Scroll down
2. Click **Deploy the stack**
3. Wait for deployment to complete (~30 seconds)

---

## 🎮 Step 4: Access Your Game

Open your browser and navigate to:

```
http://YOUR_SERVER_IP:3000
```

**Example:**
- `http://192.168.1.100:3000` (replace with your HP EliteDesk IP)
- `http://homeserver.local:3000` (if you have local DNS)

### Find Your Server IP

On your HP EliteDesk, run:
```bash
hostname -I
```

---

## 🔧 Managing Your Deployment

### View Container Logs

1. Go to **Containers** in Portainer
2. Click on `geoquest-frontend` or `geoquest-backend`
3. Click **Logs** tab

### Stop/Start Containers

In Portainer → **Containers**:
- Click on container → **Stop** / **Start** buttons

### Update to Latest Version

When you push code changes to GitHub, new images build automatically.

To pull and deploy updates:

1. Portainer → **Stacks** → Click `geoquest`
2. Scroll down
3. Click **Pull and redeploy**

Or manually:
1. SSH into your server
2. Run:
   ```bash
   docker pull ghcr.io/omer182/geoquest-frontend:latest
   docker pull ghcr.io/omer182/geoquest-backend:latest
   docker-compose up -d
   ```

### Remove Stack

1. Portainer → **Stacks**
2. Select `geoquest` stack
3. Click **Delete**

---

## 🔍 Troubleshooting

### Frontend can't connect to backend

**Check CORS settings:**
- Make sure `CORS_ORIGIN=http://frontend` in backend environment
- Verify both containers are on the same network (`geoquest-network`)

### Container won't start

**Check logs:**
1. Portainer → **Containers**
2. Click the failing container
3. View **Logs** tab

**Common issues:**
- Port 3000 or 3001 already in use
- Images not pulled (ensure they're public)

### Can't access from browser

**Check firewall:**
```bash
# On HP EliteDesk, allow ports
sudo ufw allow 3000
sudo ufw allow 3001
```

**Verify containers are running:**
```bash
docker ps | grep geoquest
```

### Backend health check failing

The backend must respond on `/health` endpoint. Check:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok"}`

---

## 📊 Stack Information

### Ports

| Service  | Internal Port | External Port | Protocol |
|----------|---------------|---------------|----------|
| Frontend | 80            | 3000          | HTTP     |
| Backend  | 3001          | 3001          | HTTP/WS  |

### Container Names

- **Frontend:** `geoquest-frontend`
- **Backend:** `geoquest-backend`

### Network

- **Name:** `geoquest-network`
- **Driver:** bridge
- **Communication:** Internal DNS resolution (frontend → backend)

### Health Checks

**Backend:**
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3
- Start period: 5 seconds

**Frontend:**
- Waits for backend to be healthy before starting

### Auto-Restart Policy

Both containers: `unless-stopped`
- Auto-restart on failure
- Auto-start on server reboot
- Only stop when manually stopped

---

## 🚀 Next Steps

1. **Test the game**: Create a multiplayer room and test with a friend
2. **Set up reverse proxy** (optional): Use Nginx Proxy Manager in Portainer
3. **Enable HTTPS** (optional): Add SSL certificate with Let's Encrypt
4. **Monitor resources**: Check CPU/RAM usage in Portainer dashboard

---

## 📝 Notes

- Images are built automatically on every push to `main` branch
- Platform: `linux/amd64` (optimized for your HP EliteDesk)
- Registry: GitHub Container Registry (ghcr.io)
- Source: https://github.com/omer182/geoquest

Enjoy your game! 🌍🎮
