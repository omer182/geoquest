# Spec Requirements: Interactive Map Component

## Initial Description

Build the core map interface with Leaflet.js integration, allowing users to pan, zoom, and place pins on touch-enabled mobile screens. Include country boundary visualization with colored outlines but no country labels.

This is Phase 1 from the product roadmap and is the foundation for the entire GeoQuest game. Without this component, no gameplay is possible.

## Product Context

### Product Mission Alignment
GeoQuest is a mobile-first geographic quiz game targeting casual gamers (ages 20+) who want to test their world geography knowledge through fast-paced competitive gameplay. The interactive map component is the foundational interface that enables all core gameplay mechanics including:
- 30-second rounds where players pin city locations
- Distance-based scoring to determine winners
- Real-time multiplayer synchronization
- Progressive difficulty in single-player mode

### Roadmap Position
This is **Phase 1** of the product roadmap, representing the critical foundation:
- **Phase 0** (Initial Project Setup) is complete with React 18 + TypeScript + Vite, Tailwind CSS, and Docker environment
- **Phase 1** (Interactive Map Component) - THIS SPEC
- **Phase 2** (Single Player Game Logic) will build on this component
- **Phase 3** (Game Round Flow UI) will integrate with this component

The map component must support future features including pin placement coordination, results visualization with distance lines, and multi-round gameplay flows.

## Requirements Discussion

### User Requirements

**Map Tile Provider:**
Leaflet.js with OpenStreetMap tiles (free, no API key required, customizable)

**Country Boundaries:**
- All countries visible with colored outlines
- Random colors for each country
- NO country labels or names displayed (intentional gameplay requirement)
- Implemented using GeoJSON for country boundaries with custom styling

**Pin Placement Interaction:**
- Single tap/touch places pin on map
- Drag to reposition existing pin
- Only one pin allowed at a time (replacing previous pin if placed again)
- Max zoom level approximately 50km (city-level detail)
- No street-level zoom allowed

**Component Architecture:**
- Self-managed state (uncontrolled component)
- Component maintains its own pin position state
- Exposes callback/event handlers to parent for pin placement notifications
- Does not receive pin position as prop from parent

**Touch Optimization:**
- Throttling/debouncing enabled for pan/zoom events
- Disable conflicting Leaflet defaults that interfere with mobile touch
- Optimize for smooth mobile performance
- Native pinch-to-zoom and double-tap gestures for zooming
- No custom +/- zoom control buttons needed

**Initial View:**
- World map zoomed out to show all continents
- Centered on global view (approximately 0° latitude, 0° longitude)
- Appropriate zoom level to display full world map on mobile screen

**Pin Design:**
- Traditional map pin/marker shape
- Color selected from custom Tailwind palette
- Modern, premium aesthetic matching dark-mode-first design
- Designer's choice for specific color (likely teal/blue accent or amber/purple secondary accent)

**Out of Scope:**
- Multiple pins on map simultaneously
- Results visualization (distance lines to target)
- Displaying city names or labels
- Animation for pin placement
- Confirm button UI (handled by parent component)

## Design Direction

### CRITICAL: Modern Dark-Mode-First Premium Design

**Visual mockup provided (`map.png`) shows colorful light-mode design - IGNORE THIS STYLE**

The actual design direction is:
- **Modern, premium, competitive feel** (fitness/productivity app aesthetic, NOT educational/playful)
- **Dark-mode-first** design with deep neutral grays as base
- **Target audience:** Adults 20+, "Educational, but cool"
- **NOT** colorful, playful, or cartoonish

### Design System Specifications

**Color Palette:**
- **Base:** Deep neutral grays (dark backgrounds)
- **Primary Accent:** Teal/blue for interactive actions and CTAs
- **Secondary Accent:** Amber/purple for rewards and highlights
- **Background Gradients:** Subtle gradients only, no bold colorful backgrounds

**UI Patterns:**
- Card-based layouts with breathing room
- Rounded corners with soft shadows
- Clean, minimal navigation
- Bold modern typography
- Motion-driven interactions (smooth animations, button scales, subtle celebrations)

**Map-Specific Design:**
- Map tiles should complement dark theme (consider dark map tile theme if available)
- Country boundaries with muted, premium colors (not bright/saturated)
- Pin design should use primary accent color (teal/blue)
- Zoom controls with dark-mode styling, rounded, minimal

### Tailwind CSS Implementation
- Leverage existing Tailwind configuration
- Use utility classes for all styling
- Define custom colors in Tailwind config if needed for premium palette
- Use Tailwind's dark mode utilities
- Minimize custom CSS beyond framework utilities

## Technical Considerations

### Leaflet.js Configuration

**Core Setup:**
- Install `leaflet` and `react-leaflet` packages
- Import Leaflet CSS for base map styles
- Configure OpenStreetMap tile layer as default

**Country Boundaries:**
- Use GeoJSON data for country polygons
- Load GeoJSON layer with custom styling options
- Apply random colors to each country via style function
- Set `fillOpacity` low to show map tiles beneath
- Stroke/outline width for clear visibility on mobile
- Disable interactive features on country polygons (no click/hover)

**Zoom Constraints:**
- `minZoom`: Set to display full world (approximately zoom level 2-3)
- `maxZoom`: Set to approximately 50km view (approximately zoom level 10-11)
- Test zoom levels on actual mobile devices to ensure appropriate granularity

**Touch Interaction:**
- Enable `tap: true` for mobile tap support
- Disable `dragging` conflicts (ensure smooth pan with touch)
- Configure `touchZoom` and `doubleClickZoom` appropriately
- Add throttling to pan/zoom event handlers (e.g., 100ms throttle)

**Pin Marker:**
- Use Leaflet's `Marker` component
- Custom icon using SVG or PNG matching design system
- `draggable: true` to allow repositioning
- Only one marker instance on map at a time
- Marker positioned at tap coordinates

### Component Architecture

**Component Structure:**
```
InteractiveMap (React functional component)
├── MapContainer (from react-leaflet)
│   ├── TileLayer (OpenStreetMap tiles)
│   ├── GeoJSON (country boundaries)
│   └── Marker (user-placed pin)
└── Custom Zoom Controls (dark-mode styled)
```

**State Management:**
- Use React hooks (useState, useRef, useEffect)
- Internal state:
  - `pinPosition: { lat: number, lng: number } | null`
  - `mapInstance: Leaflet.Map | null` (via useRef)
- No external state passed in as props
- Expose callback props:
  - `onPinPlaced?: (position: { lat: number, lng: number }) => void`
  - `onPinMoved?: (position: { lat: number, lng: number }) => void`

**Props Interface:**
```typescript
interface InteractiveMapProps {
  onPinPlaced?: (position: { lat: number, lng: number }) => void;
  onPinMoved?: (position: { lat: number, lng: number }) => void;
  className?: string;
}
```

**Event Handling:**
- Map click/tap event listener to place pin
- Marker drag event listener to update pin position
- Notify parent component via callbacks when pin placed/moved
- Prevent default behaviors that conflict with touch interactions

### Mobile-First Responsive Design

**Viewport:**
- Full-width, full-height map container
- Use viewport units (vh/vw) or flex layouts to fill screen
- No fixed pixel dimensions

**Touch Targets:**
- Zoom controls minimum 44x44px
- Adequate spacing between controls
- Test on actual mobile devices (iOS Safari, Android Chrome)

**Performance:**
- Lazy load GeoJSON data if file is large
- Optimize tile loading for mobile network
- Use CSS transforms for smooth animations
- Consider PWA service worker for offline tile caching (future enhancement)

**Breakpoints (Tailwind defaults):**
- Mobile-first: base styles for small screens
- `sm:` 640px+ (if needed for larger phones)
- `md:` 768px+ (tablets)
- `lg:` 1024px+ (desktop - lower priority)

### Integration with Existing Tech Stack

**React 18 + TypeScript:**
- Component written in TypeScript with strict typing
- Use functional component with hooks
- Follow component best practices (single responsibility, encapsulation)

**Vite:**
- Import Leaflet CSS in component or main entry
- Ensure Leaflet assets (markers, etc.) bundled correctly
- Optimize production build with tree-shaking

**Tailwind CSS:**
- Apply Tailwind utilities for layout and styling
- Customize Tailwind config for premium dark-mode colors if needed
- Use @apply directive sparingly (prefer utility classes)

**ESLint/Prettier:**
- Follow existing linting rules
- Ensure code formatted with Prettier
- No unused imports or dead code

### GeoJSON Data Source

**Country Boundaries:**
- Source: Use public GeoJSON dataset (e.g., Natural Earth, geojson-countries)
- Format: Standard GeoJSON FeatureCollection
- Storage: Static file in `public/` or bundled in `src/assets/`
- Size consideration: Use simplified/low-resolution polygons for performance on mobile

**Color Assignment:**
- Generate random color for each country on load
- Use deterministic seed for consistent colors across sessions (optional)
- Color palette: Muted, premium colors matching dark theme (not bright RGB)

### Future Extensibility Considerations

This component must support future phases:
- **Phase 3 (Game Round Flow UI):** Parent will trigger zoom to specific city, display results
- **Phase 7 (Results Visualization):** Map will need to display distance lines from pin to target
- **Multiplayer:** Map may need to show opponent's pin in different color

**Design for extensibility:**
- Keep component interface simple and focused
- Allow parent to control zoom/center via props (future enhancement)
- Support additional markers or overlays (future enhancement)
- Expose map instance via ref for programmatic control (future)

## Existing Code to Reference

No similar features identified for reference. This is the first map-related component in the codebase.

The project has been initialized with React 18, TypeScript, Vite, and Tailwind CSS (Phase 0 complete), so standard React component patterns and Tailwind utilities should be followed.

## Visual Assets

### Files Provided:
- `map.png`: Shows a light-mode colorful map interface with country boundaries, zoom controls, header with "Countries of the World", level indicator, score, timer, and START button overlay

### Visual Insights:

**From mockup (map.png) - FOR REFERENCE ONLY:**
- Map fills majority of screen with header bar above
- Countries shown with pastel colored fills (beige, yellow, green, peach, pink, etc.)
- Clean country outlines visible
- Zoom controls (+ and -) positioned in top-left corner
- Simple, clear interface with minimal chrome
- Ocean/water shown in light blue background
- Full world map visible in initial view

**CRITICAL DESIGN DEVIATION:**
The mockup shows a **light, colorful, educational aesthetic** which does NOT match the actual product design direction.

**IGNORE the mockup's visual style.** Use it ONLY for:
- Layout reference (map fills screen, zoom controls top-left)
- Functional understanding (country boundaries visible, no labels)

**APPLY the actual design direction:**
- Dark-mode-first theme
- Premium, modern aesthetic
- Muted colors, not bright pastels
- Sophisticated adult-oriented styling
- Teal/blue and amber/purple accents

### Fidelity Level:
The mockup appears to be a **high-fidelity design** but represents an **outdated design direction** that has been superseded by the modern dark-mode premium aesthetic.

## Requirements Summary

### Functional Requirements

**Core Functionality:**
- Display interactive world map using Leaflet.js and OpenStreetMap tiles
- Allow users to pan (drag) and zoom (pinch/controls) on touch-enabled mobile devices
- Place a pin marker on map with single tap/touch
- Reposition pin by dragging marker to new location
- Display all country boundaries with colored outlines
- Show no country labels or names on map
- Maintain single pin at a time (replace previous pin on new tap)

**User Actions Enabled:**
- Tap anywhere on map to place pin
- Drag existing pin to new position
- Pan map by touch-drag gesture
- Zoom in/out via pinch gesture or zoom controls
- Explore world geography without labels

**Data Managed:**
- Pin position (latitude, longitude) stored in component state
- Country boundary GeoJSON data loaded and styled
- Map tile data from OpenStreetMap
- Current map center and zoom level (managed by Leaflet)

### Reusability Opportunities

No existing components identified for reuse. This is a foundational component that future features will build upon.

**Potential future reuse:**
- Other map views (if game adds different map modes)
- Admin tools for city location validation
- Results visualization (extending this component)

### Scope Boundaries

**In Scope:**
- Leaflet.js integration with React
- OpenStreetMap tile layer configuration
- GeoJSON country boundary loading and styling
- Random color assignment to countries
- Single pin placement via tap
- Pin repositioning via drag
- Pan and zoom controls (touch-optimized)
- Zoom level constraints (max ~50km, min world view)
- Mobile-first responsive design
- Dark-mode premium styling
- Component state management for pin position
- Callback props for parent notification on pin events
- Touch interaction optimization (throttling, debouncing)

**Out of Scope:**
- Multiple pins simultaneously on map
- Distance calculation logic (belongs in game logic layer)
- Results visualization (distance lines from pin to target)
- City name display or labels
- Confirm button UI (parent component responsibility)
- Round timer or scoring display (parent component)
- Opponent pin display for multiplayer (future phase)
- Map center/zoom control from parent (future enhancement)
- Offline map tile caching (future PWA enhancement)
- Custom map tile providers beyond OpenStreetMap (future enhancement)
- Animation effects for pin placement (future polish)
- Country highlighting on hover/tap (intentionally disabled)

**Future Enhancements Mentioned:**
- Programmatic map control (zoom to city, center on location)
- Multiple marker support for multiplayer
- Distance line overlays for results visualization
- Custom dark-themed map tiles for better aesthetics
- Offline capability with service workers
- Accessibility improvements (keyboard navigation, screen reader support)

### Technical Considerations

**Integration Points:**
- Parent component will wrap InteractiveMap and handle game logic
- Pin position communicated to parent via `onPinPlaced` and `onPinMoved` callbacks
- Component integrates with React 18 + TypeScript + Vite stack
- Tailwind CSS for all styling (no CSS modules or styled-components)
- GeoJSON data loaded as static asset

**Existing System Constraints:**
- Must work on touch-enabled mobile devices (iOS Safari, Android Chrome)
- Must perform well on mobile network (optimize tile loading, GeoJSON size)
- Must follow mobile-first responsive design principles
- Minimum 44x44px touch targets
- Must use Tailwind CSS methodology consistently
- Must follow ESLint/Prettier formatting rules
- Must be written in TypeScript with proper types

**Technology Preferences:**
- Leaflet.js over Google Maps (free, customizable, no API key)
- OpenStreetMap tiles (free, no billing)
- React hooks for state management (no Redux or external state library)
- Functional component pattern (no class components)
- Tailwind utilities (minimize custom CSS)

**Similar Code Patterns to Follow:**
- React component structure matching Phase 0 project setup
- TypeScript strict mode and type safety
- Tailwind utility-first CSS approach
- Mobile-first responsive breakpoints
- Single responsibility principle for components
- DRY principle (extract reusable logic)

### Performance Requirements

**Mobile Optimization:**
- Throttle pan/zoom events to 100ms
- Debounce pin placement callbacks
- Lazy load GeoJSON if file is large (>500KB)
- Optimize tile loading for mobile network
- Minimize re-renders (use React.memo if needed)

**Bundle Size:**
- Keep component bundle small (Leaflet is ~140KB gzipped)
- Tree-shake unused Leaflet features
- Compress GeoJSON data (use simplified country boundaries)

**Rendering Performance:**
- Smooth 60fps pan and zoom on mobile devices
- No jank or lag during touch interactions
- Efficient GeoJSON rendering (use Leaflet's built-in optimizations)

### Accessibility Considerations

**Touch Accessibility:**
- Minimum 44x44px touch targets for zoom controls
- Clear visual feedback for interactive elements
- Support pinch-to-zoom gesture
- Support double-tap-to-zoom (if enabled)

**Future Considerations (out of scope for Phase 1):**
- Keyboard navigation for desktop users
- Screen reader support for map interactions
- ARIA labels for controls and map regions
- High contrast mode support

### Testing Requirements

**Manual Testing:**
- Test on iOS Safari (iPhone)
- Test on Android Chrome (various devices)
- Verify zoom limits (max ~50km, min world view)
- Verify pin placement accuracy
- Verify pin drag repositioning
- Verify smooth pan/zoom performance
- Verify dark-mode styling

**Automated Testing (future):**
- Unit tests for component logic
- Integration tests for Leaflet interactions
- E2E tests with Playwright for touch gestures

### Documentation Needs

**Code Documentation:**
- JSDoc comments for component props interface
- Inline comments for complex Leaflet configuration
- README section explaining Leaflet integration

**Usage Examples:**
- Example of component usage in parent component
- Example of handling pin placement callbacks
- Example of styling customization via className prop

## Dependencies

**New Packages Required:**
- `leaflet` (^1.9.4 or latest stable)
- `react-leaflet` (^4.2.1 or latest compatible with React 18)
- `@types/leaflet` (for TypeScript support)

**GeoJSON Data:**
- Country boundaries dataset (recommend Natural Earth or geojson-countries)
- Simplified/low-resolution for performance (~100-500KB file size)

**Assets:**
- Custom pin marker icon (SVG or PNG, matching design system)
- Zoom control icons (if customizing beyond Leaflet defaults)

## Success Criteria

**Functional Success:**
- User can tap on map to place pin at desired location
- User can drag pin to reposition to new location
- Map displays all country boundaries with colored outlines
- Map does not display country names or labels
- Zoom is constrained to world view minimum and ~50km maximum
- Pin position is communicated to parent component via callbacks

**Performance Success:**
- Map loads in under 2 seconds on 4G mobile network
- Pan and zoom feel smooth and responsive on mobile devices
- No visual lag or jank during touch interactions
- Component bundle size is reasonable (under 200KB gzipped including Leaflet)

**Design Success:**
- Component matches dark-mode premium design aesthetic
- Pin marker uses primary accent color (teal/blue)
- Country colors are muted and premium (not bright/saturated)
- Zoom controls are styled for dark mode with rounded, minimal design
- Layout is clean with adequate breathing room

**Code Quality Success:**
- TypeScript strict mode passes with no errors
- ESLint and Prettier pass with no warnings
- Component follows single responsibility principle
- Code is DRY with no duplication
- Component is reusable and extensible for future phases
