import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// Shared with the production server so dev and prod proxy behave identically.
import { createApiHandler } from './server/apiHandler.mjs';

function nasaApiProxy(apiKey: string | undefined): Plugin {
  const handler = createApiHandler({ apiKey });
  return {
    name: 'cosmos-nasa-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        void handler(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        void handler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Loads NASA_API_KEY (no VITE_ prefix) — it is only used server-side and never reaches the bundle.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), nasaApiProxy(env.NASA_API_KEY)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
    },
  };
});
