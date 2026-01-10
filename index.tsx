import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * ARCHITECT.IO - STANDALONE INITIALIZATION
 * This version is optimized for Vercel/Netlify deployment.
 * Data persistence is handled via LocalVault (localStorage).
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Architect Engine: Critical failure - Could not find root element.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);