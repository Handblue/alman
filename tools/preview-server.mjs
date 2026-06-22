// Minimal zero-dependency static server with SPA fallback for the Expo web export (dist/).
// Used only for local UI preview/screenshots.  Usage: node tools/preview-server.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 8765);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.map': 'application/json',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) { res.writeHead(403).end(); return; }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (e, data) => {
      if (e) {
        // SPA fallback: serve index.html for unknown (non-asset) routes.
        if (!path.extname(urlPath)) {
          fs.readFile(path.join(DIST, 'index.html'), (e2, html) => {
            if (e2) { res.writeHead(404).end('not found'); return; }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
          });
        } else { res.writeHead(404).end('not found'); }
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' }).end(data);
    });
  });
}).listen(PORT, () => console.log(`preview server on http://localhost:${PORT}`));
