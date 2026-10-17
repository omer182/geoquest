/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBSOCKET_URL: string;
  readonly VITE_MAP_PROVIDER: 'leaflet' | 'mapbox';
  readonly VITE_MAP_API_KEY?: string;
  /** 'on' adds the hillshade relief tiles (off by default for smoother panning) */
  readonly VITE_MAP_RELIEF?: 'on' | 'off';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare GeoJSON module - imports as URL string
declare module '*.geojson?url' {
  const value: string;
  export default value;
}
