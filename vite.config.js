import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { WebSocketServer } from 'ws';
import manifest from './public/manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    {
      configureServer() {
        if (!globalThis.__EXT_WSS__) {
          globalThis.__EXT_WSS__ = new WebSocketServer({ port: 5174 });
        }
      },
      handleHotUpdate(ctx) {
        const wss = globalThis.__EXT_WSS__;
        if (wss) {
          wss.clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'full-reload' }));
          });
        }
      },
    },
  ],
  server: {
    port: 5173,
  },
});
