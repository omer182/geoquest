# Specification: Initial Project Setup

## Goal
Establish a complete development foundation for GeoQuest, a mobile-first geography game, with React 18 + TypeScript + Vite frontend, Node.js + Socket.IO backend, Docker development environment, and production-ready tooling for code quality and consistent development workflow.

## User Stories
- As a developer, I want a fully configured development environment so that I can start building features immediately without setup friction
- As a team member, I want consistent tooling and folder structure so that I can navigate the codebase and follow established patterns easily

## Specific Requirements

**Frontend Application Structure**
- React 18 application with TypeScript using Vite as the build tool for fast development and optimized production builds
- Organized folder structure: `/src/components` for UI components, `/src/pages` for route pages, `/src/utils` for helper functions, `/src/context` for React Context state management, `/src/hooks` for custom reusable hooks, `/src/services` for WebSocket client and future API integrations
- TypeScript configuration with strict mode enabled for compile-time type safety
- Vite configuration optimized for mobile-first development with hot module replacement enabled
- Package.json with comprehensive scripts: `dev` (local Vite server), `build` (production build), `preview` (preview build), `lint` (ESLint), `format` (Prettier), `type-check` (TypeScript validation), `docker:dev` (Docker Compose), `docker:build` (build Docker images)
- Index.html with proper viewport meta tags for mobile optimization (viewport width=device-width, initial-scale=1.0)
- Basic Vite template starter files (App.tsx, main.tsx) to verify setup works
- All source code in `/src` directory with clear separation of concerns

**Backend WebSocket Server Structure**
- Separate `/backend` directory at project root with its own package.json and dependencies
- Node.js + Express server setup for handling HTTP upgrade requests to WebSocket connections
- Socket.IO integration for real-time multiplayer communication (foundation only, no game logic yet)
- Backend folder structure: `/backend/src` for server code, organized for future scalability
- Package.json scripts: `dev` (nodemon for auto-restart on changes), `start` (production server), `lint` (ESLint for backend)
- Express server configured to listen on configurable port (default 5001) with CORS enabled for frontend origin
- Basic Socket.IO connection handler to verify WebSocket handshake works
- Separate TypeScript or JavaScript configuration for backend (aligned with team preference)

**Tailwind CSS Configuration**
- Tailwind CSS v3+ installed and configured with PostCSS and Autoprefixer
- Tailwind config file with mobile-first breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Custom color palette in tailwind.config matching visual mockup: pastel colors for countries (beige: #F5E6D3, yellow: #FFE5A0, green: #C8E6C9, pink: #F8BBD0), light blue ocean background (#B3E5FC), interactive blue for buttons (#1976D2)
- Design tokens for consistent spacing, typography, and border radius aligned with visual mockup
- Content purge configuration to scan all .tsx, .ts, .jsx, .js files in /src for used classes
- CSS imports in main entry point (main.tsx) to load Tailwind base, components, and utilities
- Configured to support touch-friendly sizing (minimum 44x44px tap targets per mobile standards)

**ESLint and Prettier Setup**
- ESLint installed with standard React + Vite + TypeScript recommended configurations
- ESLint plugins: @typescript-eslint/eslint-plugin, eslint-plugin-react, eslint-plugin-react-hooks for React-specific linting
- Prettier installed with standard configuration for consistent code formatting
- ESLint integration with Prettier (eslint-config-prettier) to avoid rule conflicts
- Pre-configured rules: TypeScript strict checks, React hooks dependency validation, import order organization
- .eslintrc.json and .prettierrc files in project root
- .eslintignore and .prettierignore to exclude node_modules, dist, build artifacts
- Editor configuration hints (.editorconfig) for consistent formatting across IDEs

**Environment Variable Configuration**
- Frontend .env file (not committed to git) with VITE_ prefixed variables: `VITE_WEBSOCKET_URL` (backend WebSocket URL, default ws://localhost:5001), `VITE_MAP_PROVIDER` (choice between 'leaflet' or 'mapbox'), `VITE_MAP_API_KEY` (Mapbox API key if provider is mapbox)
- Frontend .env.example file (committed to git) with placeholder values and comments explaining each variable
- Backend .env file (not committed) with: `PORT` (WebSocket server port, default 5001), `CORS_ORIGIN` (allowed frontend origin, default http://localhost:5173)
- Backend .env.example file with placeholder values and setup instructions
- TypeScript type definitions for import.meta.env to provide autocomplete for environment variables
- Vite configuration to load environment variables and make them available via import.meta.env

**Docker Development Environment**
- docker-compose.yml file defining multi-container development setup with frontend and backend services
- Frontend Dockerfile (Dockerfile.dev in root) based on Node.js 20 LTS, copying package files first for layer caching, running npm install, exposing port 5173, starting Vite dev server with --host flag for Docker networking
- Backend Dockerfile (backend/Dockerfile.dev) based on Node.js 20 LTS, similar layer caching strategy, exposing port 5001, starting backend dev server with nodemon
- Volume mounts for live code editing: frontend source code, backend source code, node_modules volumes to preserve installed packages
- Docker network configuration for frontend-to-backend communication using service names
- Environment variables passed from .env files to containers in docker-compose.yml
- Docker Compose configured for development only (not production optimization)

**Git Repository Configuration**
- Git repository initialized in project root with .gitignore file
- .gitignore entries: node_modules, .env files (but NOT .env.example), dist, build, .DS_Store, Vite cache, TypeScript build info, editor files (.vscode, .idea), coverage reports, logs
- Initial commit structure with clear separation: root for frontend, /backend for backend
- No actual commits yet, just .gitignore and repository initialization

**Comprehensive README Documentation**
- README.md in project root with clear sections: Project Overview (GeoQuest description and tech stack summary), Prerequisites (Node.js 20+, npm, Docker/Docker Compose), Installation (clone repo, install frontend/backend dependencies), Running Locally (without Docker), Running with Docker (docker:dev script), Environment Setup (copy .env.example files and configure), Project Structure (folder organization explanation), Development Workflow (how to develop, lint, format), Technology Stack (detailed list), Future Roadmap (link to product vision)
- Code examples for common tasks: installing dependencies, starting dev servers, running lints, building for production
- Troubleshooting section with common issues and solutions (port conflicts, Docker networking, WebSocket connection errors)
- Contributing guidelines placeholder for future team expansion

**TypeScript Configuration**
- tsconfig.json for frontend with strict mode, ES2020 target, module resolution node16, JSX preserve for React, path aliases for clean imports (@/components, @/utils, etc.)
- Compiler options: noUnusedLocals, noUnusedParameters, noImplicitReturns for code quality
- Include /src directory, exclude node_modules, dist
- Backend tsconfig.json (if using TypeScript for backend) with similar strict settings but Node.js specific module resolution

**Dependency Management**
- Frontend dependencies: react@^18, react-dom@^18, TypeScript, Vite, Tailwind CSS, PostCSS, Autoprefixer
- Frontend dev dependencies: ESLint, Prettier, TypeScript ESLint plugins, Vite React plugin, Tailwind CSS
- Backend dependencies: express, socket.io, cors, dotenv for environment variables
- Backend dev dependencies: nodemon for auto-restart, ESLint
- Lock files (package-lock.json) committed to git for consistent dependency versions
- No unnecessary dependencies installed (lean setup, add libraries only when needed per features)

**Code Quality Tooling Integration**
- ESLint script in package.json to check all .ts, .tsx files with auto-fix option
- Prettier script to format all source files with write option
- TypeScript type-check script to validate types without emitting files
- Pre-commit hook setup placeholder (note to add husky + lint-staged in future for automated checks)
- VS Code settings recommendation file (.vscode/settings.json) with ESLint, Prettier, TypeScript configuration for team editor consistency

## Visual Design

**`planning/visuals/cover.png`**
- Branding establishes playful, educational, travel-themed visual identity with colorful illustrated world landmarks (Statue of Liberty, Big Ben, Eiffel Tower, Tokyo Tower) on globe background
- Airplane and hot air balloon elements suggest exploration and journey theme
- "Geography Map Games" title uses friendly, approachable typography
- Color palette: vibrant blues, greens, warm earth tones establishing the game's cheerful, engaging personality
- This branding identity should inform loading screens, splash pages, and marketing materials (future specs)

**`planning/visuals/map.png`**
- Top header bar layout with left-aligned game title ("Countries of the World"), center-aligned level indicator and question counter ("Level 1", "Question: 1/30"), right-aligned score and timer ("Score: 100", "00:00")
- World map occupies majority of screen with pastel country fills (beige, yellow, green, pink) and NO country name labels for gameplay challenge
- Light blue ocean background (#B3E5FC or similar) provides high contrast with country colors
- Zoom controls (+/-) positioned on left side as circular buttons with clear touch targets
- Large blue "START" button centered on map using interactive blue color (#1976D2 or similar)
- Clean, minimal UI chrome to maximize map visibility on mobile screens
- Country borders visible but subtle to maintain visual distinction without clutter
- Mobile-optimized layout with all controls sized for touch interaction (44x44px minimum)

## Existing Code to Leverage

**No existing code available**
- This is a greenfield project initialization with no prior codebase
- However, setup should establish reusable patterns: service layer structure in `/src/services` for future WebSocket client and API integrations, context pattern in `/src/context` for global state management (GameContext, PlayerContext, RoomContext in future), custom hooks pattern in `/src/hooks` for reusable logic (useWebSocket, useTimer, useGameState in future)
- Folder organization should support future component additions without major refactoring
- Docker Compose structure allows easy addition of services (Redis cache, database) when needed for multiplayer features

## Out of Scope
- PWA configuration with service worker, manifest.json, offline capabilities (add later for installable mobile app)
- Production-optimized Docker configurations and deployment setup (dev environment only)
- CI/CD pipeline with GitHub Actions for automated testing and deployment
- Actual Leaflet or Mapbox library installation and map integration (covered in separate "Interactive Map Component" spec)
- WebSocket implementation details beyond basic connection handler (game logic, room management in separate specs)
- Testing framework setup with Jest, React Testing Library, Playwright, or test files
- City/country database JSON files with coordinates and difficulty levels (separate data spec)
- Actual React UI components beyond basic Vite template starter (Button, Input, Modal components in separate specs)
- Backend database integration with PostgreSQL, MongoDB, or Redis (not needed for MVP)
- User authentication, accounts, or login functionality (no auth in MVP per tech stack)
- Error monitoring with Sentry, analytics integration, or APM tools
- Performance monitoring or real user monitoring setup
- Accessibility testing tools or automated a11y checks (manual testing only for now)
- Internationalization (i18n) setup or multi-language support
