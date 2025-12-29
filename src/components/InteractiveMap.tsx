import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, Marker, GeoJSON, useMapEvents, Polyline, useMap, Tooltip } from 'react-leaflet';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import pinIconUrl from '@/assets/icons/pin.svg';
import pinRedIconUrl from '@/assets/icons/pin-red.svg';
import countriesGeoJSON from '@/assets/geo/countries.geojson?url';

/**
 * Component to initialize custom map panes with explicit z-index values
 * This ensures distance lines render behind pins properly
 */
function MapPaneInitializer() {
  const map = useMap();

  useEffect(() => {
    // Create custom panes if they don't exist
    if (!map.getPane('linesPane')) {
      const linesPane = map.createPane('linesPane');
      linesPane.style.zIndex = '400'; // Below markers (600) but above overlays (400)
    }
    if (!map.getPane('pinsPane')) {
      const pinsPane = map.createPane('pinsPane');
      pinsPane.style.zIndex = '650'; // Above markers and tooltips
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

// Professional atlas-style color palette for Four Color Theorem
// More muted, realistic colors that resemble actual world maps
const FOUR_COLORS = [
  '#D4C5B9', // Warm beige/tan (land mass)
  '#C4D4C8', // Sage green (land mass)
  '#D1D9D4', // Cool gray-green (land mass)
  '#D9D1C7', // Warm gray (land mass)
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
 * Internal component to handle map click events for pin placement
 */
function MapClickHandler({ onMapClick, disabled }: { onMapClick: (e: LeafletMouseEvent) => void; disabled?: boolean }) {
  useMapEvents({
    click: disabled ? () => {} : onMapClick,
  });
  return null;
}

/**
 * Component to disable map interactions when showing results
 */
function MapInteractionController({ disabled }: { disabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (disabled) {
      // Disable all map interactions
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    } else {
      // Re-enable map interactions
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }, [disabled, map]);

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

  // Reset zoom flag when showLine changes
  useEffect(() => {
    if (!showLine) {
      hasZoomedRef.current = false;
    }
  }, [showLine]);

  useEffect(() => {
    // Prevent multiple zoom animations
    if (hasZoomedRef.current) {
      return;
    }

    // For multiplayer mode with playerGuesses
    if (playerGuesses && playerGuesses.length > 0 && targetLocation && showLine) {
      hasZoomedRef.current = true;
      const timer = setTimeout(() => {
        // Create bounds including all player guesses and target
        const allPoints: [number, number][] = [
          ...playerGuesses.map(pg => [pg.guess.lat, pg.guess.lng] as [number, number]),
          [targetLocation.lat, targetLocation.lng],
        ];

        const bounds = L.latLngBounds(allPoints);

        // Use flyToBounds with optimized animation
        // Increased padding to zoom out 20% for better visibility of all pins
        map.flyToBounds(bounds, {
          padding: [150, 150],
          duration: 0.8, // Fast but visible animation
          easeLinearity: 0.25,
          maxZoom: 7,
          animate: true,
        });

        const completeTimer = setTimeout(() => {
          if (onZoomComplete) {
            onZoomComplete();
          }
        }, 800); // Match animation duration

        return () => clearTimeout(completeTimer);
      }, 300);

      return () => clearTimeout(timer);
    }

    // For single-player mode
    if (!displayPinPosition || !targetLocation || !showLine) {
      return;
    }

    hasZoomedRef.current = true;
    // Small delay before starting zoom animation
    const timer = setTimeout(() => {
      const bounds = L.latLngBounds([
        [displayPinPosition.lat, displayPinPosition.lng],
        [targetLocation.lat, targetLocation.lng],
      ]);

      console.log('Zooming to bounds:', bounds);

      // Use flyToBounds with optimized animation
      // Increased padding to zoom out 20% for better visibility of both pins
      map.flyToBounds(bounds, {
        padding: [150, 150],
        duration: 0.8, // Fast but visible animation
        easeLinearity: 0.25,
        maxZoom: 7,
        animate: true,
      });

      // Trigger callback after animation
      const completeTimer = setTimeout(() => {
        if (onZoomComplete) {
          onZoomComplete();
        }
      }, 800); // Match animation duration

      return () => clearTimeout(completeTimer);
    }, 300); // 300ms delay for better UX

    return () => clearTimeout(timer);
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
  const [countriesData, setCountriesData] = useState<GeoJSONFeatureCollection | null>(null);

  // State for line fade-in animation
  const [lineOpacity, setLineOpacity] = useState(0);
  const hasFadedInRef = useRef(false);

  // Store generated colors for each country using Four Color Theorem
  const countryColorsRef = useRef<Map<string, string>>(new Map());

  // Store adjacency information for Four Color Theorem
  const adjacencyMapRef = useRef<Map<string, Set<string>>>(new Map());

  // Canvas renderer for smooth line rendering during zoom animations
  // SVG causes pixelation during zoom, Canvas provides smooth scaling
  // Increased padding for better rendering during zoom
  const canvasRenderer = useRef(L.canvas({ padding: 1.0, tolerance: 5 }));

  // Initial map center: global view at 0 latitude, 0 longitude
  const center: LatLngExpression = [0, 0];

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

  // Load GeoJSON data on mount and apply Four Color Theorem
  useEffect(() => {
    // Fetch GeoJSON data from the URL
    fetch(countriesGeoJSON)
      .then(response => response.json())
      .then((data: GeoJSONFeatureCollection) => {
        console.log('GeoJSON loaded, features count:', data.features.length);

        // Build adjacency map
        const adjacencyMap = buildAdjacencyMap(data.features);
        adjacencyMapRef.current = adjacencyMap;

        // Assign colors using Four Color Theorem
        data.features.forEach(feature => {
          const countryName = feature.properties?.NAME;
          if (countryName && !countryColorsRef.current.has(countryName)) {
            const color = assignColorToCountry(countryName, adjacencyMap);
            countryColorsRef.current.set(countryName, color);
          }
        });

        setCountriesData(data);
      })
      .catch(error => {
        console.error('Failed to load GeoJSON:', error);
      });

    /**
     * Get bounding box for a feature
     */
    const getFeatureBounds = (feature: GeoJSON.Feature) => {
      if (!feature.geometry) return null;

      let minLat = Infinity,
        maxLat = -Infinity;
      let minLng = Infinity,
        maxLng = -Infinity;

      const processCoordinates = (coords: number[] | number[][] | number[][][]): void => {
        if (typeof coords[0] === 'number') {
          // This is a [lng, lat] pair
          minLng = Math.min(minLng, coords[0] as number);
          maxLng = Math.max(maxLng, coords[0] as number);
          minLat = Math.min(minLat, coords[1] as number);
          maxLat = Math.max(maxLat, coords[1] as number);
        } else {
          // This is an array of coordinates
          (coords as number[][] | number[][][]).forEach(processCoordinates);
        }
      };

      if (feature.geometry.type === 'Polygon') {
        const polygon = feature.geometry as GeoJSON.Polygon;
        processCoordinates(polygon.coordinates as number[][][]);
      } else if (feature.geometry.type === 'MultiPolygon') {
        const multiPolygon = feature.geometry as GeoJSON.MultiPolygon;
        multiPolygon.coordinates.forEach(coords => processCoordinates(coords as number[][][]));
      }

      return {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng,
      };
    };

    /**
     * Check if two countries share a border
     * First check bounding box overlap, then verify with coordinate proximity
     */
    const areCountriesAdjacent = (
      feature1: GeoJSON.Feature,
      feature2: GeoJSON.Feature
    ): boolean => {
      const bounds1 = getFeatureBounds(feature1);
      const bounds2 = getFeatureBounds(feature2);

      if (!bounds1 || !bounds2) return false;

      // First, quick rejection test: if bounding boxes don't overlap or touch, countries can't be adjacent
      const bboxThreshold = 0.5; // degrees - slightly larger for initial check
      const bboxesOverlap = !(
        bounds1.east < bounds2.west - bboxThreshold ||
        bounds1.west > bounds2.east + bboxThreshold ||
        bounds1.north < bounds2.south - bboxThreshold ||
        bounds1.south > bounds2.north + bboxThreshold
      );

      if (!bboxesOverlap) return false;

      // If bounding boxes overlap, check actual coordinate proximity
      const coords1 = extractBorderCoordinates(feature1);
      const coords2 = extractBorderCoordinates(feature2);

      if (coords1.length === 0 || coords2.length === 0) return false;

      // Check if any border points are very close
      const threshold = 0.001; // Very small threshold in degrees (~111 meters)

      // Use a spatial hash for efficiency
      const gridSize = 0.1;
      const hash2 = new Map<string, [number, number][]>();

      // Build spatial hash for coords2
      for (const coord of coords2) {
        const key = `${Math.floor(coord[0] / gridSize)},${Math.floor(coord[1] / gridSize)}`;
        if (!hash2.has(key)) {
          hash2.set(key, []);
        }
        hash2.get(key)!.push(coord);
      }

      // Check coords1 against nearby cells in hash2
      for (const [lng1, lat1] of coords1) {
        const baseX = Math.floor(lng1 / gridSize);
        const baseY = Math.floor(lat1 / gridSize);

        // Check this cell and 8 surrounding cells
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${baseX + dx},${baseY + dy}`;
            const nearbyCoords = hash2.get(key);
            if (!nearbyCoords) continue;

            for (const [lng2, lat2] of nearbyCoords) {
              const distance = Math.sqrt(Math.pow(lng1 - lng2, 2) + Math.pow(lat1 - lat2, 2));
              if (distance < threshold) {
                return true;
              }
            }
          }
        }
      }

      return false;
    };

    /**
     * Extract border coordinates from a feature (sampling for performance)
     */
    const extractBorderCoordinates = (feature: GeoJSON.Feature): [number, number][] => {
      if (!feature.geometry) return [];

      const points: [number, number][] = [];
      let pointCount = 0;
      const maxPoints = 500; // Limit points per country for performance

      const addPoints = (coords: number[] | number[][] | number[][][]): void => {
        if (pointCount >= maxPoints) return;

        if (typeof coords[0] === 'number') {
          // This is a [lng, lat] pair
          points.push([coords[0] as number, coords[1] as number]);
          pointCount++;
        } else {
          // This is an array of coordinates
          (coords as number[][] | number[][][]).forEach(addPoints);
        }
      };

      if (feature.geometry.type === 'Polygon') {
        const polygon = feature.geometry as GeoJSON.Polygon;
        // Only use outer ring (first array) for border detection
        if (polygon.coordinates[0]) {
          addPoints(polygon.coordinates[0] as number[][]);
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        const multiPolygon = feature.geometry as GeoJSON.MultiPolygon;
        multiPolygon.coordinates.forEach(polyCoords => {
          // Only use outer ring of each polygon
          if (polyCoords[0]) {
            addPoints(polyCoords[0] as number[][]);
          }
        });
      }

      return points;
    };

    /**
     * Builds adjacency map by checking which countries share borders
     */
    const buildAdjacencyMap = (features: GeoJSON.Feature[]) => {
      const adjacencyMap = new Map<string, Set<string>>();

      features.forEach(feature => {
        const countryName = feature.properties?.NAME;
        if (!countryName) return;

        if (!adjacencyMap.has(countryName)) {
          adjacencyMap.set(countryName, new Set());
        }
      });

      // Check for adjacency by comparing geometries
      // Two countries are adjacent if they share a border
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          const country1 = features[i].properties?.NAME;
          const country2 = features[j].properties?.NAME;

          if (!country1 || !country2) continue;

          // Check if countries are adjacent by examining their geometries
          if (areCountriesAdjacent(features[i], features[j])) {
            adjacencyMap.get(country1)?.add(country2);
            adjacencyMap.get(country2)?.add(country1);
          }
        }
      }

      return adjacencyMap;
    };

    /**
     * Assign color to a country using greedy Four Color Theorem algorithm
     */
    const assignColorToCountry = (
      countryName: string,
      adjacencyMap: Map<string, Set<string>>
    ): string => {
      const neighbors = adjacencyMap.get(countryName);
      if (!neighbors) return FOUR_COLORS[0];

      // Get colors used by neighbors
      const usedColors = new Set<string>();
      neighbors.forEach(neighbor => {
        const neighborColor = countryColorsRef.current.get(neighbor);
        if (neighborColor) {
          usedColors.add(neighborColor);
        }
      });

      // Find first available color not used by neighbors
      for (const color of FOUR_COLORS) {
        if (!usedColors.has(color)) {
          return color;
        }
      }

      // Fallback to first color (shouldn't happen with proper Four Color Theorem)
      return FOUR_COLORS[0];
    };
  }, []);

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
   * Uses Four Color Theorem to ensure no adjacent countries share the same color
   * Professional atlas-style appearance with subtle borders
   */
  const countryStyle = (feature?: GeoJSON.Feature) => {
    if (!feature?.properties?.NAME) {
      return {
        fillColor: FOUR_COLORS[0],
        fillOpacity: 0.95,
        color: '#8B7E74', // Darker brown border for definition
        weight: 1.2,
        opacity: 0.6,
      };
    }

    const countryName = feature.properties.NAME;
    const fillColor = countryColorsRef.current.get(countryName) || FOUR_COLORS[0];

    return {
      fillColor,
      fillOpacity: 0.95, // Slightly transparent for depth
      color: '#8B7E74', // Darker brown border for realistic country lines
      weight: 1.2, // Slightly thicker for visibility
      opacity: 0.6, // Semi-transparent borders
    };
  };

  /**
   * Disable interactive features on country polygons
   */
  const onEachCountry = (_feature: GeoJSON.Feature, layer: L.Layer) => {
    // Disable all interactive features (no click, hover, tooltip)
    if ('options' in layer && layer.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer.options as any).interactive = false;
    }
  };

  // Max bounds to constrain map to show only one world instance (no horizontal wrapping)
  const maxBounds: L.LatLngBoundsExpression = [
    [-90, -180], // Southwest coordinates
    [90, 180], // Northeast coordinates
  ];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={2}
      maxZoom={10}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      className={`${className} bg-[#A8BFCF]`}
      style={{ backgroundColor: '#A8BFCF' }}
      zoomControl={false}
      preferCanvas={true}
      zoomAnimation={true}
      fadeAnimation={true}
      markerZoomAnimation={true}
      scrollWheelZoom={true}
      zoomSnap={0.25}
      zoomDelta={0.25}
      wheelPxPerZoomLevel={120}
    >
      {/* Initialize custom panes for proper z-index layering */}
      <MapPaneInitializer />

      {/* Country boundaries with Four Color Theorem coloring - MUST BE FIRST */}
      {countriesData && (
        <GeoJSON
          key="countries"
          data={countriesData}
          style={countryStyle}
          onEachFeature={onEachCountry}
          pane="tilePane"
        />
      )}

      {/* Map click handler for pin placement - disabled when showing results */}
      <MapClickHandler onMapClick={handleMapClick} disabled={!!targetLocation || showLine} />

      {/* Map remains interactive during results - users can pan/zoom to explore */}

      {/* Map zoom handler for results view */}
      <MapZoomHandler
        displayPinPosition={displayPinPosition}
        targetLocation={targetLocation}
        showLine={showLine}
        onZoomComplete={handleZoomComplete}
        playerGuesses={playerGuesses}
      />

      {/* Line connecting guess to target - Render behind pins using overlayPane (z-index 400) */}
      {/* Line appears immediately when showLine is true, visible during entire zoom animation */}
      {/* Canvas renderer with increased padding prevents pixelation during zoom */}
      {showLine && displayPinPosition && targetLocation && (
        <>
          <Polyline
            positions={[
              [displayPinPosition.lat, displayPinPosition.lng],
              [targetLocation.lat, targetLocation.lng],
            ]}
            pathOptions={{
              color: '#ef4444', // Solid red (red-500)
              weight: 4,
              opacity: lineOpacity,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            pane="linesPane"
          />
          {/* Distance label at midpoint of line - renders on top using tooltipPane */}
          {distance !== undefined && (
            <Marker
              position={[
                (displayPinPosition.lat + targetLocation.lat) / 2,
                (displayPinPosition.lng + targetLocation.lng) / 2,
              ]}
              icon={
                new L.DivIcon({
                  html: `<div class="distance-label" style="opacity: ${lineOpacity}">${distance.toLocaleString('en-US')} km</div>`,
                  className: 'distance-label-container',
                  iconSize: [120, 30],
                  iconAnchor: [60, 15],
                })
              }
              pane="tooltipPane"
            />
          )}
        </>
      )}

      {/* Draggable pin marker (only rendered when position is set) - renders above line */}
      {displayPinPosition && (
        <Marker
          position={[displayPinPosition.lat, displayPinPosition.lng]}
          icon={customPinIcon}
          draggable={!guessLocation} // Only draggable if not using external guess location
          eventHandlers={{
            dragend: handleMarkerDragEnd,
          }}
          pane="markerPane"
        />
      )}

      {/* Multiplayer: Render player distance lines (behind pins) */}
      {/* Lines appear immediately, visible during entire zoom animation */}
      {/* Lines render behind pins using custom linesPane (z-index 400) */}
      {playerGuesses && targetLocation && showLine && playerGuesses.map((playerGuess) => (
        <Polyline
          key={`line-${playerGuess.playerId}`}
          positions={[
            [playerGuess.guess.lat, playerGuess.guess.lng],
            [targetLocation.lat, targetLocation.lng],
          ]}
          pathOptions={{
            color: playerGuess.color,
            weight: 3,
            opacity: lineOpacity * 0.7,
            dashArray: '8, 6',
            lineCap: 'round',
            lineJoin: 'round',
          }}
          pane="linesPane"
        />
      ))}

      {/* Multiplayer: Render player pins (above lines) */}
      {/* Pins render on top using markerPane (z-index 600) */}
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
            className="!bg-black !border-gray-600 !rounded-lg before:!hidden"
            opacity={0.9}
          >
            <div className="text-xs sm:text-sm font-bold px-2 py-1" style={{ color: playerGuess.color }}>
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
            <Tooltip permanent direction="top" offset={[0, -50]} className="!bg-black !border-orange-400 !rounded-lg before:!hidden" opacity={0.9}>
              <div className="text-sm font-bold text-orange-400 px-3 py-1">
                {cityName}
              </div>
            </Tooltip>
          )}
        </Marker>
      )}
    </MapContainer>
  );
}
