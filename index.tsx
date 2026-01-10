
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from './App';

/**
 * ARCHITECT.IO - CLOUD INITIALIZATION
 * Robustly attempts to locate the Convex deployment URL across various 
 * possible environment variable injection methods.
 */
const getConvexUrl = () => {
  try {
    // 1. Check process.env (Common in environments mimicking Node-style build tools)
    if (typeof process !== 'undefined' && process.env && process.env.VITE_CONVEX_URL) {
      return process.env.VITE_CONVEX_URL;
    }
    // 2. Check import.meta.env (Vite/Modern Browser standard)
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv.VITE_CONVEX_URL) {
      return metaEnv.VITE_CONVEX_URL;
    }
    // 3. Check window (Fallback for manual script-based injections)
    if (typeof window !== 'undefined' && (window as any).VITE_CONVEX_URL) {
      return (window as any).VITE_CONVEX_URL;
    }
  } catch (e) {
    console.warn("Architect Engine: Warning while scanning for cloud configuration:", e);
  }
  return null;
};

const convexUrl = getConvexUrl();
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Architect Engine: Critical failure - Could not find root element to mount application.");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * ERROR BOUNDARY RENDER
 * If the Convex URL is missing, we render a professional setup dashboard 
 * instead of letting the application crash with a blank screen.
 */
if (!convexUrl) {
  root.render(
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-[#11141b] border border-white/5 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Visual Polish */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
        
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">Connection Locked</h2>
        <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
          The <strong>Architect Cloud Engine</strong> requires a valid Convex deployment URL to sync your prompt vault and credits. 
          The <code className="bg-white/5 px-2 py-1 rounded text-red-400 border border-white/5">VITE_CONVEX_URL</code> variable is currently missing.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Instructions</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Run <code className="text-indigo-400">npx convex dev</code> in your terminal or provide the URL in your environment settings to authorize this deployment.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="py-4 bg-white/10 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
            >
              Refresh
            </button>
            <a 
              href="https://docs.convex.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} else {
  // CONFIGURATION VALID - BOOTING SYSTEM
  const convex = new ConvexReactClient(convexUrl);
  root.render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </React.StrictMode>
  );
}
