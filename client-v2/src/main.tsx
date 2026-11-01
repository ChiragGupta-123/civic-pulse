import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/index.css';
import './styles/base.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('The register root element is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
