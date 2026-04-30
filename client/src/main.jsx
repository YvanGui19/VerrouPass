import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Polices self-hostées via @fontsource (Vite bundle les WOFF2 dans dist).
// Aucune dépendance externe au runtime, évite Google Fonts pour la CSP.
// On importe le subset latin uniquement pour ne pas embarquer les caractères
// non utilisés (notamment le Devanagari de Rajdhani, ~750 KB inutiles).
import '@fontsource/share-tech-mono/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/orbitron/latin-400.css';
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/orbitron/latin-600.css';
import '@fontsource/orbitron/latin-700.css';
import '@fontsource/orbitron/latin-800.css';
import '@fontsource/orbitron/latin-900.css';
import '@fontsource/rajdhani/latin-300.css';
import '@fontsource/rajdhani/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
