import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, Marker, GeoJSON, useMapEvents, Polyline, useMap, Tooltip, TileLayer } from 'react-leaflet';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import pinIconUrl from '@/assets/icons/pin.svg';
import pinRedIconUrl from '@/assets/icons/pin-red.svg';
import countriesLowGeoJSON from '@/assets/geo/countries-low.geojson?url';
import countriesMidGeoJSON from '@/assets/geo/countries-mid.geojson?url';
import countriesHighGeoJSON from '@/assets/geo/countries.geojson?url';
import usStatesGeoJSON from '@/assets/geo/us-states.geojson?url';
import { greatCircleSegments, greatCircleMidpoint, findContainingFeature } from '@/utils/geo';
import { COUNTRY_COLORS, OCEAN_COLOR } from '@/utils/mapStyle';

/**
 * Component to initialize custom map panes with explicit z-index values
 * This ensures distance lines render behind pins properly
 */
function MapPaneInitializer() {
  const map = useMap();

  useEffect(() => {
    const panes: [name: string, zIndex: number, blend?: string][] = [
      ['gratPane', 380], // Lat/lng grid over the ocean, hidden under land
      ['linesPane', 500], // Above countries/relief/highlight, below markers (600)
      ['countriesPane', 440], // Below states so state borders render on top
      ['reliefPane', 445, 'multiply'], // Hillshade darkens the pastel fills to show terrain
      ['statesPane', 450], // State borders above relief, fillOpacity: 0 so country fill shows
      ['highlightPane', 455], // Target country outline after the reveal
      ['pinsPane', 650], // Above markers and tooltips
    ];
    for (const [name, zIndex, blend] of panes) {
      if (map.getPane(name)) continue;
      const pane = map.createPane(name);
      pane.style.zIndex = String(zIndex);
      if (blend && RELIEF_ENABLED) pane.style.mixBlendMode = blend;
      if (name !== 'pinsPane') pane.style.pointerEvents = 'none';
    }
  }, [map]);

  return null;
}

/**
 * Player guess data for multiplayer mode
 */
export interface PlayerGuess {
  playerId: string;
  playerName: string;
  guess: { lat: number; lng: number };
  color: string;
  distance?: number;
}

/**
 * Props for the InteractiveMap component
 */
interface InteractiveMapProps {
  /**
   * Callback fired when user places a pin on the map by clicking/tapping.
   * @param position - The latitude and longitude where the pin was placed
   */
  onPinPlaced?: (position: { lat: number; lng: number }) => void;

  /**
   * Callback fired when user drags an existing pin to a new location.
   * @param position - The new latitude and longitude of the pin after dragging
   */
  onPinMoved?: (position: { lat: number; lng: number }) => void;

  /**
   * Optional CSS class names to apply to the map container
   */
  className?: string;

  /**
   * Optional guess location to display (user's pin position)
   */
  guessLocation?: { lat: number; lng: number };

  /**
   * Optional target location to show (e.g., actual city location after guess)
   */
  targetLocation?: { lat: number; lng: number };

  /**
   * Whether to show a line connecting user's guess to the target
   */
  showLine?: boolean;

  /**
   * Optional distance in kilometers to display on the line
   */
  distance?: number;

  /**
   * Callback fired when zoom animation completes
   */
  onZoomComplete?: () => void;

  /**
   * Array of player guesses for multiplayer mode
   * Each guess includes player info, position, and assigned color
   */
  playerGuesses?: PlayerGuess[];

  /**
   * Optional city name to display on the target pin
   */
  cityName?: string;
}

// Type for GeoJSON FeatureCollection
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
}

/**
 * Optional hillshade relief drawn over the country fills (multiply blend).
 * Esri's World Hillshade has no labels and needs no API key. Off by default:
 * the blend makes the browser re-composite the whole map on every frame while
 * panning/zooming and new tiles stream in at each zoom level, which costs
 * smoothness on phones. Set VITE_MAP_RELIEF=on to bring it back.
 */
const RELIEF_ENABLED = import.meta.env.VITE_MAP_RELIEF === 'on';

/**
 * Border detail by zoom. Redrawing every border point on each zoom step was
 * the main source of jank (~160k points ≈ 47 ms per redraw at world view), so
 * the map swaps between Douglas-Peucker-simplified copies of the same borders:
 *   low  (tolerance 0.08°, ~24k points): zoom < 4, sub-pixel at that scale
 *   mid  (0.02°, ~52k points):           zoom 4-6, mostly off-screen anyway
 *   high (full 50m data, ~100k points):  zoom 6+
 * US state lines only appear from zoom 4, where they're actually readable.
 */
type Detail = 'low' | 'mid' | 'high';
const detailForZoom = (z: number): Detail => (z < 4 ? 'low' : z < 6 ? 'mid' : 'high');
const COUNTRY_URLS: Record<Detail, string> = {
  low: countriesLowGeoJSON,
  mid: countriesMidGeoJSON,
  high: countriesHighGeoJSON,
};

/**
 * Parsed border data, cached for the whole visit. The map remounts every round,
 * so without this each round would re-download and re-parse the same files.
 */
const geoCache = new Map<string, Promise<GeoJSONFeatureCollection>>();
function fetchGeo(url: string): Promise<GeoJSONFeatureCollection> {
  let pending = geoCache.get(url);
  if (!pending) {
    pending = fetch(url).then(response => response.json());
    pending.catch(() => geoCache.delete(url)); // allow a retry after a failed download
    geoCache.set(url, pending);
  }
  return pending;
}

/**
 * Reports the current detail level, re-rendering only when it changes
 * (not on every fractional zoom step).
 */
function DetailWatcher({ onChange }: { onChange: (detail: Detail) => void }) {
  const map = useMapEvents({
    zoomend: () => onChange(detailForZoom(map.getZoom())),
  });
  useEffect(() => onChange(detailForZoom(map.getZoom())), [map, onChange]);
  return null;
}
const RELIEF_URL =
  'https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}';

/**
 * Latitude/longitude grid every 30° to give the ocean some structure.
 */
const GRATICULE: [number, number][][] = [
  ...[-60, -30, 0, 30, 60].map(lat => [
    [lat, -180],
    [lat, 180],
  ] as [number, number][]),
  ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lng => [
    [-85, lng],
    [85, lng],
  ] as [number, number][]),
];

/**
 * Custom pin icon in primary teal/blue accent color
 * Size optimized for mobile visibility (40x50px)
 */
const customPinIcon = new L.Icon({
  iconUrl: pinIconUrl,
  iconSize: [40, 50],
  iconAnchor: [20, 50], // Anchor at bottom center of pin
  popupAnchor: [0, -50], // Popup appears above pin
  className: 'guess-pin-marker',
});

/**
 * Target pin icon in red color (same style as guess pin)
 * Uses separate red pin SVG
 */
const targetPinIcon = new L.Icon({
  iconUrl: pinRedIconUrl,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
  className: 'target-pin-marker',
});

/**
 * Create a colored pin icon for multiplayer mode
 * Uses CSS filter to tint the pin to the specified color
 */
const createColoredPinIcon = (color: string) => {
  return new L.DivIcon({
    html: `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C9 0 0 9 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 9 31 0 20 0Z"
              fill="${color}"
              stroke="white"
              stroke-width="2"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
      </svg>
    `,
    className: 'player-pin-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

/**
 * Keeps the minimum zoom high enough that one copy of the world always fills
 * the container, so wide screens never show empty space past ±180° and tall
 * phone screens never show empty bands above the Arctic / below Antarctica.
 * (The Web Mercator world is square: 256px × 2^zoom on each side.)
 */
function WorldFitController() {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      const { x: width, y: height } = map.getSize();
      const snap = map.options.zoomSnap || 1;
      const minZoom = Math.max(1, Math.ceil(Math.log2(Math.max(width, height) / 256) / snap) * snap);
      map.setMinZoom(minZoom);
      if (map.getZoom() < minZoom) map.setZoom(minZoom, { animate: false });
    };
    fit();
    map.on('resize', fit);
    return () => {
      map.off('resize', fit);
    };
  }, [map]);

  return null;
}

/**
 * Result line style shared by single player and multiplayer: a bold dashed
 * great-circle arc from the guess to the city.
 */
const resultLineOptions = (color: string, opacity: number): L.PathOptions => ({
  color,
  weight: 4,
  opacity,
  dashArray: '10, 8',
  lineCap: 'round',
  lineJoin: 'round',
  fill: false,
});

/**
 * Distance pill placed at the midpoint of a result line. In multiplayer the
 * border takes the player's colour so each label matches its line.
 */
const distanceLabelIcon = (km: number, opacity: number, borderColor?: string) =>
  new L.DivIcon({
    html: `<div class="distance-label" style="opacity: ${opacity}${
      borderColor ? `; border-color: ${borderColor}; box-shadow: 0 0 0 2px ${borderColor}55, 0 4px 10px -2px rgba(30,42,68,0.5)` : ''
    }">${Math.round(km).toLocaleString('en-US')} km</div>`,
    className: 'distance-label-container',
    iconSize: [120, 30],
    iconAnchor: [60, 15],
  });

/**
 * Padding for the results zoom so every pin, line and label lands in the part
 * of the map the HUD leaves free. Overlays opt in with data-map-overlay:
 *   "bottom" - fixed result cards (measured at their final position, so the
 *              slide-up animation doesn't matter)
 *   "top"    - cards pinned to the top of the map (score card)
 */
function overlayPadding(map: L.Map): { topLeft: L.PointTuple; bottomRight: L.PointTuple } {
  const rect = map.getContainer().getBoundingClientRect();
  let top = 0;
  let bottom = 0;
  document.querySelectorAll<HTMLElement>('[data-map-overlay]').forEach(el => {
    if (el.dataset.mapOverlay === 'bottom') {
      const offset = parseFloat(getComputedStyle(el).bottom) || 0;
      const finalTop = window.innerHeight - offset - el.offsetHeight;
      bottom = Math.max(bottom, rect.bottom - finalTop);
    } else {
      top = Math.max(top, el.getBoundingClientRect().bottom - rect.top);
    }
  });

  // Room for the pin icon + its name tag above the topmost pin, a little below the lowest
  let padTop = top + 80;
  let padBottom = bottom + 24;
  const side = Math.round(Math.min(70, rect.width * 0.1));

  // On short screens never squeeze the visible map below ~140px
  const maxTotal = Math.max(0, rect.height - 140);
  if (padTop + padBottom > maxTotal) {
    const k = maxTotal / (padTop + padBottom);
    padTop = Math.round(padTop * k);
    padBottom = Math.round(padBottom * k);
  }
  return { topLeft: [side, padTop], bottomRight: [side, padBottom] };
}

/**
 * Internal component to handle map click events for pin placement
 */
function MapClickHandler({ onMapClick, disabled }: { onMapClick: (e: LeafletMouseEvent) => void; disabled?: boolean }) {
  useMapEvents({
    click: disabled ? () => {} : onMapClick,
  });
  return null;
}

/**
 * Internal component to handle map zoom when showing results
 */
function MapZoomHandler({
  displayPinPosition,
  targetLocation,
  showLine,
  onZoomComplete,
  playerGuesses,
}: {
  displayPinPosition: { lat: number; lng: number } | null;
  targetLocation: { lat: number; lng: number } | undefined;
  showLine: boolean;
  onZoomComplete?: () => void;
  playerGuesses?: PlayerGuess[];
}) {
  const map = useMap();
  const hasZoomedRef = useRef(false);
  // Pending zoom/completion timers. Kept in a ref (not effect cleanup) so a parent
  // re-render mid-animation - e.g. the multiplayer countdown ticking every second -
  // can't cancel the completion callback that fades the result lines in.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset when the results are hidden, and on unmount
  useEffect(() => {
    if (!showLine) {
      hasZoomedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }
  }, [showLine]);
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    []
  );

  useEffect(() => {
    // Prevent multiple zoom animations
    if (hasZoomedRef.current || !targetLocation || !showLine) {
      return;
    }

    // Multiplayer: frame every player's guess; single-player: frame the one guess
    const guesses =
      playerGuesses && playerGuesses.length > 0
        ? playerGuesses.map(pg => pg.guess)
        : displayPinPosition
          ? [displayPinPosition]
          : [];
    if (guesses.length === 0) {
      return;
    }

    hasZoomedRef.current = true;

    // Small delay before starting zoom animation
    const timer = setTimeout(() => {
      // Include the great-circle path so arcs over the poles stay on screen
      const allPoints: [number, number][] = [];
      for (const guess of guesses) {
        for (const segment of greatCircleSegments(guess, targetLocation, 16)) {
          allPoints.push(...segment);
        }
      }

      // Fit everything into the space left free by the score and results cards
      const { topLeft, bottomRight } = overlayPadding(map);
      // flyToBounds ignores maxBounds, and the off-centre padding can push the view
      // past ±180°; ease back inside the world once the flight lands
      map.once('moveend', () => {
        const limits = map.options.maxBounds;
        if (limits) map.panInsideBounds(limits, { animate: true, duration: 0.3 });
      });
      map.flyToBounds(L.latLngBounds(allPoints), {
        paddingTopLeft: topLeft,
        paddingBottomRight: bottomRight,
        duration: 0.8, // Fast but visible animation
        easeLinearity: 0.25,
        maxZoom: 7,
        animate: true,
      });

      timersRef.current.push(setTimeout(() => onZoomComplete?.(), 800)); // Match animation duration
    }, 300);
    timersRef.current.push(timer);
  }, [displayPinPosition, targetLocation, showLine, map, onZoomComplete, playerGuesses]);

  return null;
}

/**
 * InteractiveMap Component
 *
 * A mobile-first interactive world map using Leaflet.js that allows users to:
 * - Pan and zoom the map with touch gestures
 * - Place a single pin by tapping/clicking on the map
 * - Reposition the pin by dragging it to a new location
 * - View country boundaries without labels for geography quiz gameplay
 *
 * This is an uncontrolled component that manages its own pin position state
 * and notifies the parent via callback props when pin events occur.
 */
export default function InteractiveMap({
  onPinPlaced,
  onPinMoved,
  className = '',
  guessLocation,
  targetLocation,
  showLine = false,
  distance,
  onZoomComplete,
  playerGuesses,
  cityName,
}: InteractiveMapProps) {
  // Internal state for pin position (uncontrolled component pattern)
  // Use guessLocation prop if provided, otherwise use internal state
  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);
  const displayPinPosition = guessLocation || pinPosition;

  // State for GeoJSON country data
  const [countries, setCountries] = useState<Partial<Record<Detail, GeoJSONFeatureCollection>>>({});
  const [detail, setDetail] = useState<Detail>('low');

  // State for USA states GeoJSON data
  const [usStatesData, setUsStatesData] = useState<GeoJSONFeatureCollection | null>(null);

  // State for line fade-in animation
  const [lineOpacity, setLineOpacity] = useState(0);
  const hasFadedInRef = useRef(false);

  // Initial map center: global view at 0 latitude, 0 longitude
  const center: LatLngExpression = [20, 0];

  // Initial zoom level to display full world map on mobile
  const zoom = 2;

  // Reset fade-in state when showLine changes from true to false
  useEffect(() => {
    if (!showLine) {
      setLineOpacity(0);
      hasFadedInRef.current = false;
    }
  }, [showLine]);

  // Callback for when zoom animation completes
  // Wrapped in useCallback to prevent re-triggering zoom effect
  const handleZoomComplete = useCallback(() => {
    // Only fade in once per line display to prevent blinking
    if (!hasFadedInRef.current) {
      hasFadedInRef.current = true;

      setTimeout(() => {
        // Animate opacity from 0 to 1 over 500ms for smooth fade-in
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setLineOpacity(progress);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }, 100);
    }

    if (onZoomComplete) {
      onZoomComplete();
    }
  }, [onZoomComplete]);

  // Load border data: the light world-view copy first, more detail only once it's needed
  const mountedRef = useRef(true);
  useEffect(() => {
    // Re-arm on (re)mount: React's dev StrictMode unmounts and remounts once
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const load = useCallback((url: string, set: (d: GeoJSONFeatureCollection) => void, label: string) => {
    fetchGeo(url)
      .then(data => {
        if (mountedRef.current) set(data);
      })
      .catch(error => console.error(`Failed to load ${label} GeoJSON:`, error));
  }, []);
  // Track requests so each file downloads once (a dev-mode remount may drop the
  // first response, so a level counts as requested only until its data arrives or fails)
  const requestedRef = useRef(new Set<Detail>());
  const statesRequestedRef = useRef(false);
  useEffect(
    () => () => {
      requestedRef.current.clear();
      statesRequestedRef.current = false;
    },
    []
  );
  const ensureCountries = useCallback(
    (level: Detail) => {
      if (requestedRef.current.has(level)) return;
      requestedRef.current.add(level);
      load(COUNTRY_URLS[level], data => setCountries(p => ({ ...p, [level]: data })), `${level} countries`);
    },
    [load]
  );
  useEffect(() => ensureCountries('low'), [ensureCountries]);
  useEffect(() => {
    if (detail !== 'low') ensureCountries(detail);
    if (detail !== 'low' && !statesRequestedRef.current) {
      statesRequestedRef.current = true;
      load(usStatesGeoJSON, setUsStatesData, 'USA states');
    }
  }, [detail, ensureCountries, load]);
  // The reveal outlines the target country, which needs better than world-view borders
  useEffect(() => {
    if (targetLocation) ensureCountries('mid');
  }, [targetLocation, ensureCountries]);

  // Best borders loaded so far for the current zoom (falls back to a coarser copy while loading)
  const order: Detail[] = detail === 'high' ? ['high', 'mid', 'low'] : detail === 'mid' ? ['mid', 'low'] : ['low'];
  const shownDetail = order.find(level => countries[level]);
  const countriesData = shownDetail ? countries[shownDetail] : undefined;

  // Country containing the target city, outlined after the reveal
  const lookupCountries = countries.high ?? countries.mid;
  const targetCountry = useMemo(() => {
    if (!targetLocation || !lookupCountries) return null;
    return findContainingFeature(lookupCountries.features, targetLocation);
  }, [targetLocation, lookupCountries]);

  // Great-circle paths from each guess to the target
  const guessArc = useMemo(
    () =>
      showLine && displayPinPosition && targetLocation
        ? greatCircleSegments(displayPinPosition, targetLocation)
        : null,
    [showLine, displayPinPosition, targetLocation]
  );
  const playerArcs = useMemo(
    () =>
      showLine && playerGuesses && targetLocation
        ? playerGuesses.map(pg => ({
            ...pg,
            arc: greatCircleSegments(pg.guess, targetLocation),
            mid: greatCircleMidpoint(pg.guess, targetLocation),
          }))
        : [],
    [showLine, playerGuesses, targetLocation]
  );

  /**
   * Handle map click/tap events to place pin
   */
  const handleMapClick = (e: LeafletMouseEvent) => {
    const newPosition = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    };

    // Update internal state (remove previous pin, place new one)
    setPinPosition(newPosition);

    // Notify parent component
    onPinPlaced?.(newPosition);
  };

  /**
   * Handle pin marker drag events to update position
   */
  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target as L.Marker;
    const newPosition = marker.getLatLng();

    const updatedPosition = {
      lat: newPosition.lat,
      lng: newPosition.lng,
    };

    // Update internal state
    setPinPosition(updatedPosition);

    // Notify parent component
    onPinMoved?.(updatedPosition);
  };

  /**
   * Style function for GeoJSON country boundaries
   * Opaque pastel fills keyed by MAPCOLOR7 so neighbours always differ
   */
  const countryStyle = (feature?: GeoJSON.Feature) => ({
    fillColor: COUNTRY_COLORS[feature?.properties?.MAPCOLOR7 as number] ?? COUNTRY_COLORS[1],
    fillOpacity: 1,
    color: '#5b6b7a', // Slate border - clear but not overpowering
    weight: 0.9,
    opacity: 0.85,
    interactive: false,
    smoothFactor: 1.5,
  });

  /**
   * Style function for USA state boundaries
   * Subtle overlay - transparent fill with thin borders
   */
  const usStateStyle = () => ({
    fillOpacity: 0,
    color: '#8a97a3', // Lighter than country borders
    weight: 0.6,
    opacity: 0.7,
    interactive: false,
    smoothFactor: 1.5,
  });

  // Max bounds to constrain map to show only one world instance (no horizontal wrapping)
  const maxBounds: L.LatLngBoundsExpression = [
    [-85, -180], // Southwest coordinates
    [85, 180], // Northeast coordinates
  ];

  const distanceLabelPosition =
    distance !== undefined && displayPinPosition && targetLocation
      ? greatCircleMidpoint(displayPinPosition, targetLocation)
      : null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={2}
      maxZoom={10}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
      className={`${className} geoquest-map`}
      style={{ backgroundColor: OCEAN_COLOR }}
      zoomControl={false}
      preferCanvas={true}
      zoomAnimation={true}
      fadeAnimation={true}
      markerZoomAnimation={true}
      scrollWheelZoom={true}
      zoomSnap={0.5}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={120}
    >
      {/* Initialize custom panes for proper z-index layering */}
      <MapPaneInitializer />
      <WorldFitController />
      <DetailWatcher onChange={setDetail} />

      {/* Faint lat/lng grid on the ocean */}
      <Polyline
        positions={GRATICULE}
        pathOptions={{ color: '#ffffff', weight: 1, opacity: 0.25, interactive: false }}
        pane="gratPane"
      />

      {/* Country fills - fully vector, no labels, works offline */}
      {countriesData && (
        <GeoJSON
          key={`countries-${shownDetail}`}
          data={countriesData}
          style={countryStyle}
          pane="countriesPane"
          attribution={RELIEF_ENABLED ? undefined : 'Borders &copy; <a href="https://www.naturalearthdata.com">Natural Earth</a>'}
        />
      )}

      {/* Terrain relief multiplied over the country fills (mountains, deserts, river valleys) */}
      {RELIEF_ENABLED && (
        <TileLayer
          url={RELIEF_URL}
          pane="reliefPane"
          opacity={0.55}
          maxNativeZoom={13}
          bounds={maxBounds}
          noWrap
          attribution='Relief &copy; <a href="https://www.esri.com">Esri</a> | Borders &copy; <a href="https://www.naturalearthdata.com">Natural Earth</a>'
        />
      )}

      {/* USA state boundaries - borders only */}
      {usStatesData && detail !== 'low' && (
        <GeoJSON key="us-states" data={usStatesData} style={usStateStyle} pane="statesPane" />
      )}

      {/* Target country outline - fades in with the distance line */}
      {targetCountry && showLine && (
        <GeoJSON
          key={`target-${targetCountry.properties?.NAME}`}
          data={targetCountry}
          style={{
            fillColor: '#C8553D',
            fillOpacity: 0.16 * lineOpacity,
            color: '#A8432E',
            weight: 2.5,
            opacity: lineOpacity,
            interactive: false,
          }}
          pane="highlightPane"
        />
      )}

      {/* Map click handler for pin placement - disabled when showing results */}
      <MapClickHandler onMapClick={handleMapClick} disabled={!!targetLocation || showLine} />

      {/* Map zoom handler for results view */}
      <MapZoomHandler
        displayPinPosition={displayPinPosition}
        targetLocation={targetLocation}
        showLine={showLine}
        onZoomComplete={handleZoomComplete}
        playerGuesses={playerGuesses}
      />

      {/* Great-circle line from guess to target, behind pins */}
      {guessArc && (
        <Polyline
          positions={guessArc}
          pathOptions={resultLineOptions('#C8553D', lineOpacity)} // Compass red
          pane="linesPane"
        />
      )}

      {/* Distance label at the midpoint of the arc */}
      {distanceLabelPosition && distance !== undefined && (
        <Marker
          position={[distanceLabelPosition.lat, distanceLabelPosition.lng]}
          interactive={false}
          icon={distanceLabelIcon(distance, lineOpacity)}
          pane="tooltipPane"
        />
      )}

      {/* Draggable pin marker (only rendered when position is set) - renders above line */}
      {displayPinPosition && (
        <Marker
          position={[displayPinPosition.lat, displayPinPosition.lng]}
          icon={customPinIcon}
          draggable={!guessLocation && !targetLocation} // Only draggable while guessing
          eventHandlers={{
            dragend: handleMarkerDragEnd,
          }}
          pane="markerPane"
        />
      )}

      {/* Multiplayer: same lines as single player, one per player in their colour (behind pins) */}
      {playerArcs.map(pa => (
        <Polyline
          key={`line-${pa.playerId}`}
          positions={pa.arc}
          pathOptions={resultLineOptions(pa.color, lineOpacity)}
          pane="linesPane"
        />
      ))}

      {/* Multiplayer: distance label at the midpoint of each player's line */}
      {playerArcs.map(pa =>
        pa.distance !== undefined ? (
          <Marker
            key={`dist-${pa.playerId}`}
            position={[pa.mid.lat, pa.mid.lng]}
            interactive={false}
            icon={distanceLabelIcon(pa.distance, lineOpacity, pa.color)}
            pane="tooltipPane"
          />
        ) : null
      )}

      {/* Multiplayer: Render player pins (above lines) */}
      {playerGuesses && playerGuesses.map((playerGuess) => (
        <Marker
          key={`pin-${playerGuess.playerId}`}
          position={[playerGuess.guess.lat, playerGuess.guess.lng]}
          icon={createColoredPinIcon(playerGuess.color)}
          pane="markerPane"
        >
          {/* Tooltip with player name */}
          <Tooltip
            permanent
            direction="top"
            offset={[0, -50]}
            className="atlas-tooltip"
            opacity={1}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-ink sm:text-sm">
              <span className="status-dot" style={{ backgroundColor: playerGuess.color }} />
              {playerGuess.playerName}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {/* Target location marker (shown after guess confirmation) - RED color - renders above line */}
      {targetLocation && (
        <Marker position={[targetLocation.lat, targetLocation.lng]} icon={targetPinIcon} pane="markerPane">
          {/* Show city name label */}
          {cityName && (
            <Tooltip permanent direction="top" offset={[0, -50]} className="atlas-tooltip" opacity={1}>
              <div className="px-3 py-1 font-display text-sm font-semibold text-compass-dark sm:text-base">
                {cityName}
              </div>
            </Tooltip>
          )}
        </Marker>
      )}
    </MapContainer>
  );
}
