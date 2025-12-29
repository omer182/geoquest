# Specification: Interactive Map Component

## Goal
Build the foundational interactive map interface using Leaflet.js with OpenStreetMap tiles, enabling users to pan, zoom, and place pins on touch-enabled mobile screens with country boundary visualization for the GeoQuest geography quiz game.

## User Stories
- As a player, I want to see a world map with country boundaries so that I can visually navigate and understand the geographic context without country labels
- As a player, I want to tap on the map to place a pin and drag to reposition it so that I can select my answer for where I think a city is located
- As a player, I want smooth touch controls for panning and zooming so that I can explore the map comfortably on my mobile device

## Specific Requirements

**Leaflet.js Integration with OpenStreetMap Tiles**
- Install leaflet (^1.9.4), react-leaflet (^4.2.1), and @types/leaflet packages
- Configure Leaflet MapContainer with OpenStreetMap tile layer (free, no API key required)
- Import Leaflet CSS in component or main entry point for base map styles
- Set up Vite configuration to properly bundle Leaflet assets (markers, icons)
- Configure tile layer URL to use OpenStreetMap standard tiles with appropriate attribution
- Consider dark-themed tile layer (if available) to complement dark-mode-first design aesthetic

**GeoJSON Country Boundary Visualization**
- Source and load GeoJSON dataset for country boundaries (Natural Earth or geojson-countries recommended)
- Use simplified/low-resolution polygons for mobile performance (target 100-500KB file size)
- Store GeoJSON file in public/ or src/assets/ directory
- Load GeoJSON layer into map with custom styling function
- Apply random muted colors to each country (aligned with premium dark-mode palette, NOT bright/saturated)
- Set fillOpacity low (e.g., 0.2-0.3) to allow map tiles to show beneath
- Configure stroke/outline width for clear visibility on mobile screens
- Disable interactive features on country polygons (no click, hover, or tooltip events)
- Ensure NO country labels or names are displayed on map (critical gameplay requirement)

**Pin Placement and Interaction**
- Implement single pin marker using Leaflet Marker component
- Place pin at tap/click coordinates when user taps anywhere on map
- Allow only one pin at a time (remove previous pin before placing new one)
- Enable draggable marker property to allow repositioning via drag gesture
- Create custom pin icon matching design system (traditional map pin shape in teal/blue primary accent color)
- Use SVG or PNG for pin marker with appropriate size for mobile visibility
- Listen to map click/tap events to capture pin placement coordinates
- Listen to marker drag events to capture repositioned coordinates
- Notify parent component via onPinPlaced and onPinMoved callbacks with { lat, lng } position data

**Component State Architecture (Uncontrolled Component)**
- Component maintains its own internal state using React hooks (useState, useRef, useEffect)
- Internal state: pinPosition ({ lat: number, lng: number } | null), mapInstance (Leaflet.Map | null via useRef)
- Do NOT receive pin position as prop from parent
- Expose callback props: onPinPlaced and onPinMoved for parent notification
- Define clear TypeScript interface for props: onPinPlaced, onPinMoved (both optional), className (optional)
- Keep component self-contained and encapsulated following single responsibility principle

**Touch Optimization for Mobile Performance**
- Enable tap: true in Leaflet map options for mobile tap support
- Configure touchZoom and doubleClickZoom appropriately for mobile gestures
- Implement throttling for pan/zoom event handlers (100ms throttle recommended)
- Ensure smooth dragging without conflicts between map pan and marker drag
- Disable any Leaflet default behaviors that interfere with mobile touch interactions
- Optimize tile loading for mobile network conditions
- Minimize re-renders using React.memo if needed for performance
- Test smooth 60fps pan and zoom on actual mobile devices (iOS Safari, Android Chrome)

**Initial Map View Configuration**
- Center map on global view at approximately 0 latitude, 0 longitude
- Set initial zoom level to display full world map on mobile screen (zoom level 2-3)
- Configure minZoom to prevent zooming out beyond world view
- Configure maxZoom to approximately 50km view (zoom level 10-11) for city-level detail without street-level
- Test zoom constraints on actual mobile devices to ensure appropriate granularity
- Ensure world map fits mobile viewport without requiring initial pan

**Zoom Controls**
- Disable default Leaflet zoom controls (zoomControl: false in map options)
- Rely on native pinch-to-zoom and double-tap gestures for zooming on mobile
- No custom +/- zoom buttons needed

**Mobile-First Responsive Layout**
- Map container fills full width and height using viewport units (100vh, 100vw) or flex layouts
- No fixed pixel dimensions for map container
- Ensure map responsively adapts from mobile to tablet to desktop breakpoints
- Use Tailwind mobile-first breakpoints (sm: 640px, md: 768px, lg: 1024px)
- Prioritize mobile layout and performance, enhance for larger screens progressively

**TypeScript Type Safety and Integration**
- Write component in TypeScript with strict mode enabled
- Define explicit prop interface types with JSDoc comments
- Type internal state and Leaflet map instances properly
- Follow ESLint and Prettier configuration from Phase 0 setup
- Ensure no TypeScript errors or ESLint warnings
- Remove unused imports and dead code

## Visual Design

**`planning/visuals/map.png`**
- Map fills majority of screen real estate for maximum geographic visibility
- Countries shown with colored fills and clear outlines, NO country labels displayed
- Zoom controls positioned in top-left corner as circular/rounded buttons
- Clean minimal UI chrome to avoid cluttering the map interface
- Full world map visible in initial view showing all continents
- CRITICAL: Mockup shows light-mode colorful design with bright pastels (beige, yellow, green, pink) and light blue ocean
- DESIGN DEVIATION: Ignore mockup's colorful light-mode aesthetic, apply DARK-MODE-FIRST premium design instead
- Use deep neutral grays for backgrounds, muted country colors (not bright/saturated), teal/blue primary accent for pin and interactive elements
- Apply modern, premium, competitive aesthetic targeting adults 20+ (NOT educational/playful style)

## Existing Code to Leverage

**React Functional Component Pattern from App.tsx**
- Use useState and useEffect hooks for state management and side effects as demonstrated in App.tsx
- Follow functional component structure with clear, focused logic
- Import and use environment variables via import.meta.env pattern
- Apply Tailwind utility classes for all styling consistently

**Tailwind CSS Configuration and Color Palette**
- Leverage existing Tailwind config with mobile-first breakpoints (sm, md, lg, xl)
- Extend Tailwind config to add dark-mode premium colors: deep neutral grays (base), teal/blue (primary accent), amber/purple (secondary accent)
- Use existing touch-friendly spacing tokens (minHeight/minWidth touch: 44px) for zoom controls
- Replace mockup's bright colors (beige, yellow, pink, oceanBlue) with muted premium palette for dark theme
- Apply Tailwind dark mode utilities throughout component

**Vite Build Configuration and Asset Handling**
- Import Leaflet CSS in main.tsx or component file following existing import patterns
- Ensure Vite bundles Leaflet assets correctly (markers, icons) in production build
- Leverage Vite's fast HMR for efficient development workflow
- Follow existing package.json script patterns for linting and formatting

**Project Folder Structure and Organization**
- Place InteractiveMap component in /src/components/ directory
- Store GeoJSON country data in /src/assets/ or /public/ directory
- Create custom TypeScript types in component file or separate types file if complex
- Follow single responsibility and encapsulation principles from component standards

**ESLint and Prettier Formatting Standards**
- Run ESLint on component code to ensure no warnings or errors
- Format code with Prettier before committing
- Follow DRY principle by extracting reusable logic
- Use meaningful variable and function names
- Keep functions small and focused on single tasks

## Out of Scope
- Multiple pins simultaneously on map (only single pin allowed in this phase)
- Results visualization with distance lines from user pin to target location (Phase 7 feature)
- Displaying city names, labels, or any geographic text on map
- Animation effects for pin placement or removal
- Confirm button UI for submitting pin selection (parent component responsibility in Phase 3)
- Round timer, scoring display, or game status UI (parent component in Phase 3)
- Opponent pin display for multiplayer mode (future phase)
- Programmatic map control from parent (zoom to city, center on location) - future enhancement
- Custom dark-themed map tile provider beyond standard OpenStreetMap (future polish)
- Offline map tile caching with PWA service workers (future enhancement)
- Accessibility features like keyboard navigation or screen reader support (future improvement)
- Country highlighting or hover effects on country boundaries (intentionally disabled)
- Loading states or error handling for GeoJSON data fetch (assume data loads successfully)
- Alternative map providers (Mapbox, Google Maps) - Leaflet with OpenStreetMap only
