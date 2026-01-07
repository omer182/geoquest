# Ngrok Setup for Mobile Testing

This guide helps you set up ngrok to test GeoQuest on your mobile device.

## Prerequisites

1. Install ngrok: https://ngrok.com/download
2. Sign up for a free ngrok account: https://dashboard.ngrok.com/signup
3. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

## Setup Steps

### 1. Configure ngrok authtoken

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 2. Start the frontend server

In one terminal:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Start the backend server

In another terminal:
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

### 4. Start ngrok tunnels

You need **two separate ngrok tunnels** - one for frontend and one for backend.

#### Option A: Two separate terminal windows

**Terminal 1 (Frontend):**
```bash
ngrok http 3000
```

**Terminal 2 (Backend):**
```bash
ngrok http 3001
```

#### Option B: Use ngrok config file

Create `ngrok.yml` in the project root (not committed to git):

```yaml
version: "2"
authtoken: YOUR_AUTHTOKEN_HERE
tunnels:
  frontend:
    addr: 3000
    proto: http
  backend:
    addr: 3001
    proto: http
```

Then run:
```bash
ngrok start --all
```

### 5. Update environment variables

After starting ngrok, you'll get URLs like:
- Frontend: `https://xxxx-frontend.ngrok-free.dev`
- Backend: `https://xxxx-backend.ngrok-free.dev`

**Update `.env` (root):**
```bash
VITE_WEBSOCKET_URL=https://xxxx-backend.ngrok-free.dev
```

**Update `backend/.env`:**
```bash
CORS_ORIGIN=https://xxxx-frontend.ngrok-free.dev
PORT=3001
```

### 6. Restart servers

After updating `.env` files, restart both frontend and backend servers.

### 7. Access from mobile

Open the frontend ngrok URL (`https://xxxx-frontend.ngrok-free.dev`) on your mobile device.

## Troubleshooting

### "Blocked request" error

- Make sure `vite.config.ts` has `allowedHosts` configured (already done)
- Restart the frontend dev server after updating `vite.config.ts`

### WebSocket connection fails

- Make sure `VITE_WEBSOCKET_URL` in `.env` points to the **backend** ngrok URL
- Make sure `CORS_ORIGIN` in `backend/.env` includes the **frontend** ngrok URL
- Check that both ngrok tunnels are running

### ngrok free plan limitations

- Free plan allows only one tunnel at a time per domain
- Use separate terminal windows or the `ngrok.yml` config file approach
- URLs change each time you restart ngrok (unless you have a paid plan)

## Notes

- Ngrok URLs are temporary and change on restart (free plan)
- You'll need to update `.env` files each time you restart ngrok
- The frontend `vite.config.ts` already includes ngrok domains in `allowedHosts`
- Backend CORS is configured to accept the frontend ngrok URL

