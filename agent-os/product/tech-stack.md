# Tech Stack

## Framework & Runtime
- **Application Framework:** Vite (for fast React development and optimized mobile builds)
- **Language/Runtime:** Node.js (for backend WebSocket server)
- **Package Manager:** npm

## Frontend
- **JavaScript Framework:** React 18+ (with hooks for state management)
- **CSS Framework:** Tailwind CSS (for responsive mobile-first design)
- **UI Components:** Custom components optimized for touch interactions
- **State Management:** React Context API + useReducer (lightweight state management for game state, no heavy library needed)
- **Mobile Optimization:** React Touch Events, Viewport meta tags for mobile UX

## Map Integration
- **Map Library:** Leaflet.js with React-Leaflet (free, open-source alternative to Google Maps with full customization)
- **Map Tiles:** OpenStreetMap tiles (free) or Mapbox (better styling, free tier available)
- **Custom Map Styling:** GeoJSON for country boundaries with custom colored outlines and no labels
- **Distance Calculation:** Haversine formula implementation for accurate geographic distance between coordinates

## Backend & Real-Time
- **WebSocket Server:** Socket.IO (Node.js) for reliable real-time bidirectional communication between players
- **Backend Framework:** Express.js (lightweight HTTP server for WebSocket upgrade and room management)
- **Session Management:** In-memory storage for active game rooms and player states (Redis optional for scaling)

## Database & Storage
- **Primary Database:** NOT REQUIRED for MVP - all game state managed in-memory on WebSocket server
- **City Data Storage:** Static JSON file with city coordinates and difficulty levels (embedded in frontend or served statically)
- **Future Consideration:** PostgreSQL or MongoDB if user accounts, leaderboards, or persistent stats are added later

## Game Logic
- **Distance Calculation:** Custom Haversine distance formula (calculate great-circle distance between lat/long coordinates)
- **City Database:** Curated JSON dataset with cities organized by difficulty tiers (Level 1 = capitals/major cities, higher levels = smaller cities)
- **Random Selection:** Seeded random number generator for reproducible city selection in multiplayer rounds

## Testing & Quality
- **Test Framework:** Jest + React Testing Library (for component and game logic testing)
- **E2E Testing:** Playwright (for testing multiplayer flows and mobile interactions)
- **Linting/Formatting:** ESLint + Prettier (enforce code consistency)

## Deployment & Infrastructure
- **Containerization:** Docker (frontend + backend services in separate containers)
- **Orchestration:** Docker Compose (manage multi-container application)
- **Local Development:** npm + serve (for local testing)
- **Production Server:** Home server with Docker deployment
- **CI/CD:** GitHub Actions (automated testing and Docker image builds)

## Third-Party Services
- **Analytics (Optional):** Plausible or Google Analytics (track game sessions, popular cities)
- **Error Monitoring (Optional):** Sentry (track WebSocket connection issues and game errors)
- **URL Shortening (Optional):** Bitly API or custom short-link service for room code sharing

## Architecture Notes

### Why No Database for MVP?
- Game sessions are ephemeral (5 rounds, then complete)
- No user accounts or login required
- Room codes can be generated and validated in-memory
- City data is static and can be bundled with frontend
- Reduces infrastructure complexity and costs
- **Future Addition:** Add database only if implementing user profiles, statistics tracking, or persistent leaderboards

### WebSocket vs REST API?
- WebSocket required for real-time multiplayer synchronization (pin placements, ready states, round transitions)
- Eliminates polling overhead
- Provides instant bidirectional communication critical for 30-second rounds

### Leaflet vs Google Maps?
- Leaflet is free, open-source, and highly customizable
- Easier to hide country labels and customize map styling
- No API key limits or billing concerns
- Lighter weight for mobile performance
- **Alternative:** Use Mapbox GL JS with free tier for more polished visuals while maintaining customization

### Mobile-First Considerations
- PWA (Progressive Web App) capabilities for installable mobile experience
- Service Worker for offline map tile caching
- Responsive touch-optimized controls
- Minimal bundle size for fast loading on mobile networks
