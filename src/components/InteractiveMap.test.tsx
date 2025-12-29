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
  useMapEvents: () => {
    // Return null for the map events hook
    return null;
  },
}));

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

  // Note: TileLayer was removed in favor of GeoJSON for country boundaries
  // This test is commented out as it's no longer relevant to the current implementation
  // it('renders TileLayer component', () => {
  //   render(<InteractiveMap />);
  //   expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  // });

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
