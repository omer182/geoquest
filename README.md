# GeoQuest 🌍

A real-time multiplayer geography game where you race to pin cities on a map. Test your geography knowledge in fast-paced 5-round matches with friends.

## Features

- **Single Player** - Infinite progression through 10 difficulty levels with 500 cities
- **Multiplayer** - Real-time 5-round matches with configurable timers (15s/30s/45s/60s)
- **Room System** - Create/join games with shareable room codes
- **Mobile-First** - Optimized for iPhone/Android with responsive design
- **Interactive Map** - Pan, zoom, and pin locations with touch controls

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.IO
- **Map:** Leaflet.js with OpenStreetMap tiles

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
cp .env.example .env
cp backend/.env.example backend/.env

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

## Development

### Environment Variables

**Frontend (.env)**
```env
VITE_WEBSOCKET_URL=http://localhost:5001
VITE_MAP_PROVIDER=leaflet
```

**Backend (backend/.env)**
```env
PORT=5001
CORS_ORIGIN=http://localhost:5000
NODE_ENV=development
```

### Scripts

**Frontend**
```bash
npm run dev          # Start dev server (port 5000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

**Backend**
```bash
cd backend
npm run dev          # Start dev server with nodemon
npm run start        # Start production server
npm test             # Run tests
```

## Deploying to iOS

### Option 1: Progressive Web App (PWA) - Recommended

**Easiest path to get on iOS devices without App Store:**

1. **Add PWA manifest** (create `public/manifest.json`):
```json
{
  "name": "GeoQuest",
  "short_name": "GeoQuest",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e1a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. **Add manifest to `index.html`**:
```html
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

3. **Deploy to a hosting service** (choose one):
   - **Vercel:** `npm i -g vercel && vercel` (easiest)
   - **Netlify:** Drag `dist` folder to netlify.com
   - **Railway:** Connect GitHub repo
   - **Render:** Connect GitHub repo

4. **Install on iPhone:**
   - Open your deployed URL in Safari
   - Tap Share button → "Add to Home Screen"
   - App installs like a native app!

**Pros:** No App Store approval, instant updates, works on Android too
**Cons:** No access to native APIs, must use Safari to install

---

### Option 2: Capacitor (Native iOS App)

**For App Store distribution:**

1. **Install Capacitor**:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init GeoQuest com.yourname.geoquest --web-dir=dist
```

2. **Build frontend**:
```bash
npm run build
```

3. **Add iOS platform**:
```bash
npx cap add ios
npx cap sync
```

4. **Open in Xcode**:
```bash
npx cap open ios
```

5. **Configure in Xcode**:
   - Set your Team (Apple Developer account required - $99/year)
   - Update Bundle Identifier
   - Add icons and splash screens
   - Configure capabilities (network, location if needed)

6. **Test on device**:
   - Connect iPhone
   - Select your device in Xcode
   - Click Run (▶️)

7. **Submit to App Store**:
   - Archive in Xcode (Product → Archive)
   - Use App Store Connect to submit
   - Wait for Apple review (1-3 days)

**Pros:** Full native app, App Store visibility, push notifications
**Cons:** $99/year dev account, App Store approval process

---

### Option 3: TestFlight (Beta Testing)

For testing before App Store:

1. Follow Capacitor steps above (1-6)
2. In Xcode: Product → Archive
3. Upload to App Store Connect
4. Add external testers (up to 10,000)
5. Share TestFlight link with testers

**Pros:** Real device testing, no App Store approval for beta
**Cons:** Still need $99/year dev account

---

### Recommendation

**Start with PWA** - It's free, fast, and perfect for friends/portfolio. You can deploy in 5 minutes on Vercel and share a link.

**Upgrade to Capacitor later** if you want App Store distribution or need native features.

## Project Structure

```
geoquest/
├── src/
│   ├── components/       # React components
│   ├── context/          # GameContext, WebSocketContext
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Scoring, distance calculations
│   ├── data/             # Cities database (500 cities)
│   └── types/            # TypeScript definitions
├── backend/
│   ├── src/              # Express server, Socket.IO handlers
│   ├── services/         # GameSessionManager, RoomManager
│   ├── data/             # Cities database
│   └── tests/            # Backend tests (46 passing)
└── public/               # Static assets
```

## Game Modes

### Single Player
- Infinite levels (1-∞)
- 5 cities per level
- Progressive difficulty (500 cities across 10 tiers)
- Distance-based scoring with level multipliers

### Multiplayer
- 2 players per room
- 5-round matches
- Configurable timer (15s/30s/45s/60s)
- Real-time synchronization
- Rematch functionality

## Contributing

Built by Rio. Feel free to fork and customize!

## License

MIT
