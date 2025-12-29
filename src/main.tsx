import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import { configureLeafletIcons } from './utils/leafletConfig';

// Configure Leaflet default marker icons for Vite bundling
configureLeafletIcons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
