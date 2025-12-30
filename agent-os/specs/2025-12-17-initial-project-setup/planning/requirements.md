# Spec Requirements: Initial Project Setup

## Initial Description
Set up the foundational project structure for GeoQuest including:
- React 18 + Vite project initialization
- Tailwind CSS configuration
- Docker and Docker Compose setup (frontend + backend containers)
- ESLint + Prettier configuration
- Basic folder structure for components, pages, and utilities
- Package.json scripts for development and production
- Environment configuration
- Basic README with setup instructions

## Requirements Discussion

### First Round Questions

**Q1: I assume we'll use TypeScript with React for type safety and better developer experience. Is that correct, or should we use plain JavaScript?**
**Answer:** Use React + TypeScript (not JavaScript)

**Q2: For the folder structure, I'm thinking we'll need: `/src/components`, `/src/pages`, `/src/utils`, and `/src/context` for the React Context API state management. Should we also include `/src/hooks` for custom hooks and `/src/services` for API/WebSocket client logic?**
**Answer:** Include: `/src/components`, `/src/pages`, `/src/utils`, `/src/context`, `/src/hooks`, `/src/services` (for WebSocket client logic)

**Q3: For Docker setup, I assume we want a development-oriented Docker Compose configuration that runs both frontend and backend containers locally. Should we also set up production-optimized Dockerfiles at this stage, or just focus on the development environment?**
**Answer:** Development environment only (not production yet)

**Q4: For environment variables, I'm thinking we'll need at minimum: `VITE_WEBSOCKET_URL` (backend WebSocket connection). Based on the tech stack mentioning Leaflet with optional Mapbox tiles, should we also include `VITE_MAP_PROVIDER` (to toggle between Leaflet/Mapbox) and `VITE_MAP_API_KEY` (for Mapbox if used)?**
**Answer:** Include:
- `VITE_WEBSOCKET_URL` - backend WebSocket connection
- `VITE_MAP_PROVIDER` - Leaflet vs Mapbox choice
- `VITE_MAP_API_KEY` - if using Mapbox

**Q5: For ESLint and Prettier configuration, should we use the standard React + Vite recommended configs with TypeScript support, or do you have specific linting rules or style guides you prefer?**
**Answer:** Use standard React/Vite configurations

**Q6: For package.json scripts, I'll include the standard `dev`, `build`, `preview`, `lint`, and `format` scripts. Since we're using Docker, should I also add Docker-specific scripts like `docker:dev` (run via Docker Compose) and `docker:build` (build Docker images)?**
**Answer:** Include Docker-specific scripts (e.g., `docker:dev`, `docker:build`)

**Q7: Since the tech stack mentions a separate backend WebSocket server using Node.js + Express + Socket.IO, should the initial project setup include a `/backend` directory with its own package.json, or will the backend be set up separately in a different repository?**
**Answer:** Separate `/backend` directory with its own package.json

**Q8: The tech stack mentions PWA capabilities for installable mobile experience. Should the initial setup include PWA configuration (manifest.json, service worker), or should we skip that for now and add it later?**
**Answer:** Skip PWA setup for now (can add later for installable mobile app)

### Existing Code to Reference
No similar existing features identified for reference. This is a greenfield project initialization.

### Visual Assets

#### Files Provided:
- `cover.png`: Branding/marketing image showing "Geography Map Games" title with illustrated world landmarks (Statue of Liberty, Big Ben, Eiffel Tower, Tokyo Tower, etc.) on a colorful globe background with airplane and hot air balloon. Establishes the playful, educational, travel-themed visual identity of the game.

- `map.png`: Game UI mockup showing the core interface design with:
  - Header bar containing: "Countries of the World" title, "Level 1" indicator, "Question: 1/30", "Score: 100", and timer "00:00"
  - World map displaying all countries with pastel colors (beige, yellow, green, pink) with visible borders but NO country labels
  - Clean, minimalist aesthetic with light blue ocean background
  - Zoom controls (+/-) on the left side of the map
  - Prominent blue "START" button centered on the map
  - Mobile-optimized layout with touch-friendly control placement

#### Visual Insights:
- **Design Language**: Clean, modern interface with soft pastel color palette for countries, creating visual distinction without text labels
- **Map Requirements**: Countries must be displayed with colored fills and borders but without name labels (for added difficulty)
- **UI Layout Pattern**: Top header bar for game state information (level, question count, score, timer) - this pattern should be reusable across game modes
- **Mobile-First Design**: All controls (zoom, start button) are sized and positioned for easy touch interaction on smartphone screens
- **Visual Hierarchy**: Important game information in header, map takes majority of screen real estate, minimal UI chrome to maximize map visibility
- **Color Coding Strategy**: Distinct pastel colors for neighboring countries to create clear visual boundaries without requiring labels
- **Fidelity Level**: High-fidelity mockup with specific design decisions (colors, spacing, typography) that should guide implementation

## Requirements Summary

### Functional Requirements

#### Project Structure
- **Frontend**: React 18 + TypeScript + Vite application in project root
  - Source code in `/src` directory
  - Organized subdirectories: `/src/components`, `/src/pages`, `/src/utils`, `/src/context`, `/src/hooks`, `/src/services`
  - TypeScript configuration for strict type checking
  - Vite configuration optimized for mobile-first React development

- **Backend**: Node.js + Express + Socket.IO server in `/backend` directory
  - Separate `package.json` for backend dependencies
  - WebSocket server setup for real-time multiplayer communication
  - Express server for HTTP upgrade and basic API endpoints

#### Styling and UI Framework
- **Tailwind CSS**: Configured for mobile-first responsive design
  - Custom color palette matching visual mockup (pastel colors for map countries)
  - Design tokens for consistent spacing, typography, and colors
  - Purge configuration to minimize production bundle size
  - Mobile-optimized breakpoints and touch-friendly sizing

#### Development Tools
- **ESLint**: Standard React + TypeScript configuration with Vite recommended rules
  - TypeScript-specific linting rules
  - React hooks linting
  - Import order and organization

- **Prettier**: Code formatting with standard configuration
  - Integration with ESLint for consistent formatting
  - Pre-configured formatting rules for TypeScript/JSX

#### Environment Configuration
- **Frontend Environment Variables** (`.env` file with Vite prefix):
  - `VITE_WEBSOCKET_URL`: Backend WebSocket server URL (e.g., `ws://localhost:5001` for dev)
  - `VITE_MAP_PROVIDER`: Choice between `leaflet` or `mapbox` for map rendering
  - `VITE_MAP_API_KEY`: API key for Mapbox (if `VITE_MAP_PROVIDER=mapbox`)

- **Backend Environment Variables** (separate `.env` in `/backend`):
  - `PORT`: WebSocket server port (default: 5001)
  - `CORS_ORIGIN`: Allowed CORS origin for frontend (default: `http://localhost:5173` for Vite dev)

#### Docker Development Setup
- **Docker Compose Configuration**: Multi-container development environment
  - Frontend container: Vite dev server with hot module replacement
  - Backend container: Node.js WebSocket server with auto-restart on changes
  - Volume mounts for live code editing without rebuilding containers
  - Network configuration for container-to-container communication

- **Dockerfile (Frontend)**: Development-oriented Node.js container
  - Based on Node.js LTS image
  - Install dependencies and run Vite dev server
  - Expose port 5173 for dev server

- **Dockerfile (Backend)**: Development-oriented Node.js container
  - Based on Node.js LTS image
  - Install dependencies and run Express + Socket.IO server
  - Expose port 5001 for WebSocket connections

#### Package Scripts
- **Frontend Scripts** (`package.json`):
  - `dev`: Start Vite dev server locally (without Docker)
  - `build`: Production build with TypeScript compilation and Vite bundling
  - `preview`: Preview production build locally
  - `lint`: Run ESLint on all TypeScript/TSX files
  - `format`: Format all files with Prettier
  - `type-check`: Run TypeScript compiler in check mode
  - `docker:dev`: Start frontend + backend via Docker Compose
  - `docker:build`: Build Docker images for both services

- **Backend Scripts** (`/backend/package.json`):
  - `dev`: Start Express + Socket.IO server with nodemon for auto-restart
  - `start`: Start production server
  - `lint`: Run ESLint on backend JavaScript/TypeScript files

#### Documentation
- **README.md**: Comprehensive setup and development instructions including:
  - Project overview and technology stack
  - Prerequisites (Node.js version, Docker/Docker Compose)
  - Installation steps (npm install for frontend and backend)
  - Running locally without Docker (`npm run dev` in both directories)
  - Running with Docker (`npm run docker:dev`)
  - Environment variable configuration guide
  - Project structure explanation
  - Link to product mission and roadmap
  - Development workflow guidelines

### Reusability Opportunities
No existing features to reuse as this is greenfield project initialization. However, the setup should establish patterns for:
- **Component Organization**: Clear structure for future UI components (buttons, inputs, map controls)
- **Service Layer Pattern**: `/src/services` for WebSocket client that can be extended for future API integrations
- **Context Pattern**: `/src/context` for React Context API state management that will be used across single-player and multiplayer modes
- **Custom Hooks**: `/src/hooks` for reusable logic patterns (e.g., useWebSocket, useTimer, useGameState)

### Scope Boundaries

#### In Scope:
- React 18 + TypeScript + Vite project initialization with proper configuration
- Tailwind CSS setup with mobile-first responsive design configuration
- ESLint + Prettier with standard React/TypeScript rules
- Folder structure: `/src/components`, `/src/pages`, `/src/utils`, `/src/context`, `/src/hooks`, `/src/services`
- Separate `/backend` directory with Node.js + Express + Socket.IO foundation
- Docker and Docker Compose development environment (frontend + backend containers)
- Environment variable configuration (`.env` files with frontend and backend variables)
- Package.json scripts for development, building, linting, formatting, and Docker operations
- Comprehensive README with setup and development instructions
- Git repository initialization with `.gitignore` for node_modules, .env files, and build artifacts

#### Out of Scope (Future Work):
- **PWA Configuration**: Service worker, manifest.json, offline capabilities (can be added later for installable mobile app experience)
- **Production Docker Configuration**: Optimized production Dockerfiles and deployment configurations (focus is on dev environment only)
- **CI/CD Pipeline**: GitHub Actions workflows for automated testing and deployment
- **Actual Map Integration**: Leaflet or Mapbox library installation and configuration (covered in separate "Interactive Map Component" spec)
- **WebSocket Implementation Details**: Actual Socket.IO client/server logic for rooms and gameplay (foundation only)
- **Testing Setup**: Jest, React Testing Library, Playwright configuration and test files
- **City Database**: JSON file with city coordinates and difficulty levels
- **Any UI Components**: No actual React components beyond basic Vite template starter
- **Backend Database**: No PostgreSQL, MongoDB, or Redis setup (not needed for MVP per tech stack)
- **Authentication System**: No user accounts or login functionality
- **Error Monitoring**: No Sentry or analytics integration

### Technical Considerations

#### Technology Stack Alignment
- **React 18**: Aligns with product tech stack decision for hooks-based state management
- **TypeScript**: Provides type safety for complex game state and WebSocket message types
- **Vite**: Fast development experience with HMR, optimized for mobile-first builds
- **Tailwind CSS**: Mobile-first utility framework matches product tech stack and visual mockup requirements
- **Socket.IO**: Reliable WebSocket library for real-time multiplayer per tech stack
- **Node.js/Express**: Lightweight backend framework for WebSocket server per tech stack

#### Mobile-First Constraints
- Vite configuration should optimize bundle size for fast mobile network loading
- Tailwind configuration must use mobile-first breakpoints (sm, md, lg)
- Touch-friendly sizing standards (minimum 44x44px tap targets)
- Viewport meta tags configured for mobile devices
- Map interface must support touch gestures (pan, zoom, pinch)

#### Development Environment Requirements
- Docker Compose for consistent dev environment across team members
- Volume mounts to enable live code editing without container rebuilds
- Hot module replacement (HMR) for frontend development efficiency
- Nodemon or similar for backend auto-restart on file changes
- Environment variable separation between frontend (VITE_ prefix) and backend

#### Integration Points
- **Frontend → Backend WebSocket**: Frontend connects to backend via `VITE_WEBSOCKET_URL`
- **Frontend → Map Provider**: Frontend uses either Leaflet (free) or Mapbox (API key required) based on `VITE_MAP_PROVIDER`
- **Docker Networking**: Frontend container can communicate with backend container via Docker Compose networking
- **CORS Configuration**: Backend must allow requests from frontend dev server origin

#### Code Organization Philosophy
- **Component-Driven Architecture**: Components should follow single responsibility principle
- **Service Layer Separation**: WebSocket and future API logic isolated in `/src/services`
- **Context for Global State**: React Context API for game state, player state, room state
- **Custom Hooks for Logic Reuse**: Extract reusable logic patterns into `/src/hooks`
- **Type Safety First**: TypeScript strict mode to catch errors at compile time
- **Minimal External Dependencies**: Start lean, add libraries only when needed

#### Standards Compliance
- **Consistent Project Structure**: Logical, predictable folder organization per global conventions
- **Environment Configuration**: All secrets/config via environment variables, never committed
- **Clear Documentation**: Comprehensive README with setup, architecture, and contribution guidelines
- **Version Control Best Practices**: Proper `.gitignore` to exclude node_modules, .env, build outputs
- **CSS Methodology**: Tailwind utility-first approach, minimize custom CSS per frontend CSS standards
- **Component Best Practices**: Single responsibility, reusability, clear props, minimal state per component standards

#### Performance Considerations
- **Vite Build Optimization**: Tree-shaking, code-splitting, minification for production builds
- **Tailwind Purge**: Remove unused CSS classes in production builds
- **TypeScript Compilation**: Strict type checking without runtime overhead
- **Docker Layer Caching**: Structure Dockerfiles to maximize layer reuse and minimize rebuild time
- **Minimal Bundle Size**: Target small initial bundle for fast mobile loading

#### Future Extensibility
- Folder structure supports future additions without major refactoring
- Service layer pattern allows adding REST API calls alongside WebSocket
- Context structure can scale to multiple contexts (GameContext, PlayerContext, RoomContext)
- Docker Compose can easily add services (Redis, database) when needed
- Environment variable pattern supports adding more configuration as features grow
