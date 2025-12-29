# Task Breakdown: Interactive Map Component

## Overview
Total Task Groups: 5
Total Tasks: 39 sub-tasks across 5 major groups

This breakdown implements the foundational interactive map interface using Leaflet.js with OpenStreetMap tiles, country boundary visualization, and mobile-optimized touch interactions for the GeoQuest geography quiz game.

## Task List

### Task Group 1: Dependencies and Leaflet Configuration
**Dependencies:** None (builds on completed Initial Project Setup)
**Can execute in parallel with:** None (foundation for all map work)

- [x] 1.0 Install and configure Leaflet.js with Vite
  - [x] 1.1 Install required npm packages
    - Install: `leaflet@^1.9.4` (core Leaflet library)
    - Install: `react-leaflet@^4.2.1` (React bindings for Leaflet)
    - Install dev: `@types/leaflet` (TypeScript type definitions)
    - Run from project root: `npm install leaflet react-leaflet && npm install -D @types/leaflet`
    - Verify packages added to `package.json` dependencies
  - [x] 1.2 Import Leaflet CSS in application entry point
    - Edit `/Users/omersher/Documents/projects/geoquest/src/main.tsx`
    - Add import after existing imports: `import 'leaflet/dist/leaflet.css'`
    - Ensure Leaflet base styles load before custom Tailwind styles
  - [x] 1.3 Configure Vite to bundle Leaflet assets correctly
    - Edit `/Users/omersher/Documents/projects/geoquest/vite.config.ts`
    - Verify Vite handles Leaflet marker icons and images in production build
    - No special config needed unless build errors occur (Vite handles this automatically)
  - [x] 1.4 Fix Leaflet default marker icon path issue
    - Create utility to configure Leaflet icon paths for Vite bundling
    - Import marker icon assets explicitly in component or utility file
    - Override default icon paths using Leaflet's `L.Icon.Default.prototype` if necessary
    - Reference solution: Leaflet with Vite requires manual icon path configuration

**Acceptance Criteria:**
- Leaflet, react-leaflet, and @types/leaflet installed without errors
- Leaflet CSS imports successfully in main.tsx
- Vite can bundle Leaflet assets without build errors
- Default marker icons display correctly (no broken images)

---

### Task Group 2: GeoJSON Data Sourcing and Integration
**Dependencies:** Task Group 1 (Leaflet installed)
**Can execute in parallel with:** Task Group 3 (Component scaffold)

- [x] 2.0 Source and integrate GeoJSON country boundary data
  - [x] 2.1 Source appropriate GeoJSON dataset for country boundaries
    - Research and download simplified world countries GeoJSON from Natural Earth or geojson-countries
    - Use low-resolution polygons optimized for mobile (target 100-500KB file size)
    - Recommended source: `https://github.com/datasets/geo-countries` or Natural Earth 110m admin-0 countries
    - Download `.geojson` or `.json` file with country polygons
  - [x] 2.2 Store GeoJSON file in project assets directory
    - Create directory: `/Users/omersher/Documents/projects/geoquest/src/assets/geo/`
    - Save downloaded file as: `/Users/omersher/Documents/projects/geoquest/src/assets/geo/countries.geojson`
    - Verify file size is within target range (100-500KB)
  - [x] 2.3 Create TypeScript type definitions for GeoJSON data
    - Create file: `/Users/omersher/Documents/projects/geoquest/src/types/geojson.ts` (optional if types needed)
    - Use GeoJSON standard types from `@types/geojson` package if complex typing needed
    - For simple usage, TypeScript can infer types from imported JSON
  - [x] 2.4 Import and load GeoJSON data in map component
    - Import GeoJSON data using Vite's JSON import: `import countriesData from '@/assets/geo/countries.geojson'`
    - Verify GeoJSON loads successfully without build errors
    - Log data structure to console to verify format matches expectations

**Acceptance Criteria:**
- GeoJSON dataset downloaded and optimized for mobile (100-500KB)
- GeoJSON file stored in `/src/assets/geo/countries.geojson`
- Data imports successfully in TypeScript without errors
- GeoJSON structure verified and ready for rendering

---

### Task Group 3: Component Architecture and State Management
**Dependencies:** Task Group 1 (Leaflet installed)
**Can execute in parallel with:** Task Group 2 (GeoJSON sourcing)

- [x] 3.0 Create InteractiveMap component with uncontrolled state architecture
  - [x] 3.1 Write 2-8 focused tests for InteractiveMap component
    - Limit to 2-8 highly focused tests maximum
    - Test only critical component behaviors:
      - Component renders MapContainer without errors
      - Map instance initializes with correct center and zoom
      - Pin placement callback fires with correct coordinates on map click
      - Pin drag callback fires with updated coordinates on marker drag
    - Skip exhaustive testing of all props, edge cases, and UI states
    - Use React Testing Library with @testing-library/react
    - Mock Leaflet components if necessary to avoid full map rendering in tests
  - [x] 3.2 Create component file and folder structure
    - Create file: `/Users/omersher/Documents/projects/geoquest/src/components/InteractiveMap.tsx`
    - Follow functional component pattern from existing `App.tsx`
    - Use TypeScript with strict mode enabled
  - [x] 3.3 Define TypeScript interface for component props
    - Define `InteractiveMapProps` interface with JSDoc comments:
      - `onPinPlaced?: (position: { lat: number; lng: number }) => void` - Callback when pin placed
      - `onPinMoved?: (position: { lat: number; lng: number }) => void` - Callback when pin dragged
      - `className?: string` - Optional CSS classes for container styling
    - Export interface for external use
  - [x] 3.4 Set up internal component state using React hooks
    - Use `useState` for `pinPosition: { lat: number; lng: number } | null`
    - Use `useRef` for `mapInstance: Leaflet.Map | null` to access Leaflet map instance
    - Component maintains own state (uncontrolled component pattern)
    - Do NOT accept pin position as prop from parent
  - [x] 3.5 Implement component structure with MapContainer
    - Import: `MapContainer`, `TileLayer`, `Marker`, `useMapEvents` from `react-leaflet`
    - Import: `LatLngExpression`, `LeafletMouseEvent` from `leaflet` for TypeScript types
    - Create MapContainer with required props: `center`, `zoom`, `className`
    - Configure container to fill parent using Tailwind classes
  - [x] 3.6 Configure map event handlers for pin placement
    - Use `useMapEvents` hook to listen to map click events
    - On click: capture `{ lat, lng }` from event
    - Update `pinPosition` state with new coordinates
    - Call `onPinPlaced` callback prop if provided
    - Remove previous pin before placing new one (single pin constraint)
  - [x] 3.7 Ensure component tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify component renders and state management works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- Component file created with TypeScript strict mode
- Props interface clearly defined and documented
- Internal state hooks configured correctly
- Uncontrolled component pattern implemented
- Map click events captured and pin state updates

---

### Task Group 4: Map Features and Visual Styling
**Dependencies:** Task Group 2 (GeoJSON data), Task Group 3 (Component scaffold)
**Cannot be parallelized:** Requires both GeoJSON data and component structure

- [x] 4.0 Implement map features with dark-mode premium styling
  - [x] 4.1 Configure OpenStreetMap tile layer with attribution
    - Add `TileLayer` component inside `MapContainer`
    - Set URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
    - Add attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
    - Consider dark-themed tile alternatives if available (e.g., CartoDB Dark Matter)
    - For dark theme, use: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - [x] 4.2 Extend Tailwind config with dark-mode premium color palette
    - Edit `/Users/omersher/Documents/projects/geoquest/tailwind.config.js`
    - REMOVE mockup's bright pastel colors (beige, yellow, green, pink, oceanBlue)
    - ADD dark-mode premium colors:
      - Base: Deep neutral grays (e.g., `gray-900: '#0f172a'`, `gray-800: '#1e293b'`)
      - Primary accent: Teal/blue (e.g., `primary: '#06b6d4'`, `primaryDark: '#0891b2'`)
      - Secondary accent: Amber/purple (e.g., `accent: '#f59e0b'`, `accentAlt: '#a855f7'`)
    - Add custom spacing for touch targets: `touch: '44px'` (minimum touch target size)
    - Update color palette to match premium, competitive aesthetic for adults 20+
  - [x] 4.3 Render GeoJSON country boundaries with custom styling
    - Import `GeoJSON` component from `react-leaflet`
    - Add `GeoJSON` component with imported countries data as data prop
    - Implement `style` function for custom polygon styling:
      - Generate random muted colors for each country (NOT bright/saturated)
      - Use low `fillOpacity: 0.2-0.3` to allow map tiles to show beneath
      - Set visible stroke width (e.g., `weight: 1`, `color: '#ffffff'`, `opacity: 0.5`)
    - Disable interactive features: `interactive: false` (no click, hover, tooltip)
    - Ensure NO country labels or names displayed (critical gameplay requirement)
  - [x] 4.4 Set initial map view configuration
    - Set `center` prop: `[0, 0]` (latitude 0, longitude 0 for global view)
    - Set `zoom` prop: `2` (full world map visible on mobile)
    - Configure `minZoom`: `1` (prevent zooming out beyond world view)
    - Configure `maxZoom`: `10` (city-level detail without street-level granularity)
    - Add `scrollWheelZoom` prop: `true` for desktop mouse wheel zoom
    - Test zoom constraints on actual mobile devices to verify appropriate granularity
  - [x] 4.5 Optimize map for mobile touch performance
    - Set map options in MapContainer:
      - `tap: true` (enable mobile tap support)
      - `touchZoom: true` (enable pinch-to-zoom on mobile)
      - `doubleClickZoom: true` (enable double-tap zoom)
    - Implement throttling for pan/zoom event handlers using `useEffect` with debounce (100ms recommended)
    - Use `React.memo` to minimize re-renders if performance issues occur
    - Ensure smooth 60fps pan and zoom (test on iOS Safari and Android Chrome)
  - [x] 4.6 Apply mobile-first responsive layout with Tailwind
    - Add className to MapContainer: `w-full h-full` (fill parent container)
    - Use viewport units or flex layouts for parent container in parent component
    - Ensure map adapts from mobile to tablet to desktop breakpoints
    - Use Tailwind breakpoints: `sm:`, `md:`, `lg:` for progressive enhancement
    - Prioritize mobile layout and performance first

**Acceptance Criteria:**
- OpenStreetMap tiles load successfully with proper attribution
- Dark-mode premium color palette integrated into Tailwind config
- GeoJSON country boundaries render with muted colors and clear outlines
- No country labels or names displayed on map
- Initial view shows full world map at appropriate zoom level
- Map performs smoothly on mobile devices (60fps pan/zoom)
- Responsive layout works from mobile to desktop

---

### Task Group 5: Pin Interaction
**Dependencies:** Task Group 4 (Map features and styling)
**Cannot be parallelized:** Requires working map with complete feature set

- [x] 5.0 Implement pin placement and dragging
  - [x] 5.1 Create custom pin icon matching design system
    - Design or source SVG/PNG pin icon in teal/blue primary accent color
    - Use traditional map pin shape for familiarity
    - Size icon appropriately for mobile visibility (recommend 40x40px or similar)
    - Store icon in `/Users/omersher/Documents/projects/geoquest/src/assets/icons/pin.svg`
    - Import icon in component and create Leaflet Icon instance
  - [x] 5.2 Implement single draggable pin marker
    - Conditionally render `Marker` component only when `pinPosition` is not null
    - Set `position` prop to `pinPosition` state value
    - Set `draggable` prop: `true` to enable drag repositioning
    - Use custom icon created in 5.1 via `icon` prop
    - Ensure only one pin exists at a time (remove previous on new placement)
  - [x] 5.3 Implement pin drag event handlers
    - Add `eventHandlers` prop to Marker component
    - Listen to `dragend` event to capture final dragged position
    - Update `pinPosition` state with new coordinates after drag
    - Call `onPinMoved` callback prop with new `{ lat, lng }` position
    - Ensure smooth dragging without conflicts with map pan gestures
  - [x] 5.4 Disable default zoom controls
    - Set `zoomControl: false` in MapContainer props
    - Rely on native pinch-to-zoom and double-tap gestures for mobile
    - No custom +/- zoom buttons needed
  - [x] 5.5 Test pin placement and interaction workflow end-to-end
    - Test: Tap map to place pin at coordinates
    - Test: Drag pin to new location and verify position updates
    - Test: Place new pin removes previous pin (single pin constraint)
    - Test: onPinPlaced callback fires with correct coordinates
    - Test: onPinMoved callback fires with updated coordinates after drag
    - Test: Pinch-to-zoom and double-tap zoom work correctly on mobile
  - [x] 5.6 Run component tests to verify all features
    - Run ONLY the 2-8 tests written in 3.1
    - Verify all critical component behaviors work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- Custom pin icon displays correctly in teal/blue accent color
- Single draggable pin marker functions correctly
- Pin placement updates state and triggers onPinPlaced callback
- Pin drag updates state and triggers onPinMoved callback
- Only one pin exists on map at any time
- Default zoom controls are disabled
- Pinch-to-zoom and double-tap zoom gestures work smoothly on mobile devices

---

## Execution Order

**Recommended implementation sequence:**

1. **Task Group 1: Dependencies and Leaflet Configuration** (Foundation - must be first)
2. **Parallel execution:**
   - **Task Group 2: GeoJSON Data Sourcing and Integration**
   - **Task Group 3: Component Architecture and State Management**
3. **Task Group 4: Map Features and Visual Styling** (depends on Groups 2 & 3)
4. **Task Group 5: Pin Interaction** (depends on Group 4, final polish)

---

## Testing Strategy

**Focused Testing Approach:**
- Task Group 3 writes 2-8 focused tests for critical component behaviors (render, state, callbacks)
- Tests focus on user-facing workflows, not implementation details
- Tests run ONLY the newly written tests, not entire suite
- No dedicated test gap analysis phase (testing kept minimal per standards)
- Manual testing on actual mobile devices (iOS Safari, Android Chrome) for touch interactions
- Performance validation: smooth 60fps pan/zoom on mobile

**Manual Verification Points:**
- Test on actual mobile devices for touch optimization
- Verify zoom constraints prevent excessive zoom in/out
- Verify country boundaries render without labels
- Verify pin placement and drag gestures work smoothly
- Verify custom zoom controls are touch-friendly (44x44px targets)
- Verify dark-mode premium styling matches design system

---

## Standards Alignment

**Mobile-First Responsive Design:**
- Tailwind mobile-first breakpoints (sm, md, lg) used throughout
- Touch-friendly design with minimum 44x44px touch targets
- Map fills viewport using `w-full h-full` Tailwind utilities
- Performance optimized for mobile network and rendering (simplified GeoJSON, throttled events)

**Component Architecture:**
- Single responsibility: InteractiveMap handles only map rendering and pin interaction
- Uncontrolled component pattern: component maintains own state, notifies parent via callbacks
- Clear prop interface with TypeScript and JSDoc documentation
- Encapsulation: internal implementation details (map instance, pin state) kept private

**TypeScript Type Safety:**
- Strict mode enabled for compile-time safety
- Explicit prop interface types with JSDoc comments
- Leaflet types from @types/leaflet for map instance and events
- No TypeScript errors or ESLint warnings

**CSS Methodology:**
- Consistent Tailwind utility classes for all styling
- Dark-mode premium color palette (deep neutrals, teal/blue primary, amber/purple accent)
- No custom CSS unless absolutely necessary
- Tailwind config extended with custom design tokens

**Code Quality:**
- ESLint and Prettier formatting applied
- DRY principle: extract reusable logic into utility functions
- Small focused functions for single tasks
- Remove unused imports and dead code

---

## Visual Design Implementation

**Dark-Mode Premium Aesthetic (DEVIATION FROM MOCKUP):**
- IGNORE mockup's colorful light-mode aesthetic (beige, yellow, green, pink, light blue ocean)
- APPLY dark-mode-first premium design instead:
  - Deep neutral gray backgrounds (gray-900, gray-800)
  - Muted country colors with low opacity (NOT bright/saturated pastels)
  - Teal/blue primary accent for pin and interactive elements
  - Subtle shadows and modern minimal UI chrome
- Target demographic: Adults 20+ with competitive, premium aesthetic (NOT educational/playful)

**Map Visual Characteristics:**
- Country boundaries with muted random colors and clear outlines
- Low fill opacity (0.2-0.3) to show map tiles beneath
- NO country labels or names (critical gameplay requirement)
- Clean minimal UI with custom zoom controls in top-left
- Full world map visible in initial view

---

## Out of Scope

**Explicitly NOT included in this implementation:**
- Multiple pins simultaneously (only single pin allowed)
- Results visualization with distance lines (Phase 7 feature)
- City names, labels, or geographic text on map
- Animation effects for pin placement or removal
- Confirm button UI for submitting answer (parent component responsibility)
- Round timer, scoring, or game status UI (parent component)
- Opponent pins for multiplayer mode (future phase)
- Programmatic map control from parent (zoom to city, center on location) - future enhancement
- Custom dark-themed map tile provider beyond CartoDB Dark Matter
- Offline map tile caching with PWA service workers
- Accessibility features (keyboard navigation, screen reader support) - future improvement
- Country highlighting or hover effects on boundaries (intentionally disabled)
- Loading states or error handling for GeoJSON fetch (assume data loads successfully)
- Alternative map providers (Mapbox, Google Maps) - Leaflet with OpenStreetMap only
- Testing framework setup (use existing setup from Phase 0)

---

## Integration with Existing Codebase

**Leverage from Initial Project Setup (Phase 0):**
- Use existing Tailwind config and extend with dark-mode premium colors
- Follow React functional component pattern from `App.tsx`
- Use established ESLint and Prettier configurations
- Import environment variables via `import.meta.env` pattern
- Place component in `/src/components/` directory following project structure
- Store assets in `/src/assets/` directory

**Parent Component Integration (Future Phase 3):**
- InteractiveMap will be imported into game page component
- Parent will listen to `onPinPlaced` and `onPinMoved` callbacks
- Parent will manage game state (target city, scoring, round timer)
- Parent will provide confirm button UI for submitting pin selection
- InteractiveMap remains self-contained and reusable

---

## Notes

**GeoJSON Recommendations:**
- Natural Earth 110m Admin 0 Countries: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/
- geojson-countries dataset: https://github.com/datasets/geo-countries
- Use simplified/low-resolution for mobile performance (100-500KB target)
- Verify no country labels in GeoJSON properties to prevent accidental display

**Leaflet with Vite Configuration:**
- Leaflet default marker icons require manual path configuration with Vite
- Import marker icons explicitly and override default paths
- Common solution: Create utility to fix icon paths on component mount

**Dark-Themed Tile Alternatives:**
- OpenStreetMap default: Light theme tiles
- CartoDB Dark Matter: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Stamen Toner: Dark high-contrast tiles (alternative option)
- Choose tile layer that complements dark-mode premium design aesthetic

**Performance Optimization:**
- Throttle pan/zoom event handlers to 100ms for smooth mobile performance
- Use React.memo if re-renders impact performance
- Simplified GeoJSON polygons reduce rendering overhead
- Test on actual devices, not just browser dev tools

**Mobile Testing Checklist:**
- iOS Safari: Test touch gestures, pinch-zoom, double-tap zoom
- Android Chrome: Test touch gestures and performance
- Verify 60fps pan and zoom (use browser performance tools)
- Verify touch targets are comfortable and accessible (44x44px minimum)
- Test on various screen sizes (small phones to tablets)
