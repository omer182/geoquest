import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InteractiveMap from './InteractiveMap';

// Mock react-leaflet components to avoid DOM dependencies
vi.mock('react-leaflet', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapContainer: ({ children, className }: any) => (
    <div data-testid="map-container" className={className}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Marker: ({ position, draggable }: any) => (
    <div data-testid="marker" data-position={JSON.stringify(position)} data-draggable={draggable} />
  ),
  GeoJSON: () => <div data-testid="geojson" />,
  Polyline: () => <div data-testid="polyline" />,
  Tooltip: () => null,
  // Event hooks return the map, like the real hook
  useMapEvents: () => fakeMap,
  useMap: () => fakeMap,
}));

// Minimal Leaflet map stub for the pane / zoom helper components
const fakeMap = {
  getPane: () => undefined,
  createPane: () => ({ style: {} }),
  getSize: () => ({ x: 800, y: 600 }),
  options: { zoomSnap: 0.25 },
  setMinZoom: vi.fn(),
  getZoom: () => 2,
  setZoom: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  flyToBounds: vi.fn(),
};

// Mock fetch for GeoJSON data loading
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        type: 'FeatureCollection',
        features: [],
      }),
  })
) as unknown as typeof fetch;

describe('InteractiveMap', () => {
  it('renders MapContainer without errors', () => {
    render(<InteractiveMap />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('does not load terrain tiles by default (pure vector map)', () => {
    render(<InteractiveMap />);
    expect(screen.queryByTestId('tile-layer')).not.toBeInTheDocument();
  });

  it('does not render marker initially when no pin is placed', () => {
    render(<InteractiveMap />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('applies custom className to map container', () => {
    const customClass = 'custom-map-class';
    render(<InteractiveMap className={customClass} />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveClass(customClass);
  });

  it('accepts onPinPlaced callback prop without errors', () => {
    const handlePinPlaced = vi.fn();
    render(<InteractiveMap onPinPlaced={handlePinPlaced} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('accepts onPinMoved callback prop without errors', () => {
    const handlePinMoved = vi.fn();
    render(<InteractiveMap onPinMoved={handlePinMoved} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
