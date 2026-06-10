import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: './',
  server: { port: 5180, open: false },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
  plugins: [
    {
      // dev-only: POST data-URL → plik w .shots/ (podgląd sceny bez widocznego okna)
      name: 'shot-endpoint',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__shot', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            const m = body.match(/^data:image\/(png|jpeg);base64,(.+)$/s);
            if (!m) { res.statusCode = 400; res.end('bad payload'); return; }
            const dir = path.resolve(process.cwd(), '.shots');
            fs.mkdirSync(dir, { recursive: true });
            const name = `shot-${Date.now()}.${m[1] === 'jpeg' ? 'jpg' : 'png'}`;
            fs.writeFileSync(path.join(dir, name), Buffer.from(m[2], 'base64'));
            res.setHeader('content-type', 'text/plain');
            res.end(name);
          });
        });
      },
    },
  ],
});
