import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'out');
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function safeJoin(base, requestedPath) {
  const normalized = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(base, normalized);
}

async function statIfExists(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    const filePath = safeJoin(outDir, pathname);
    const fileStat = await statIfExists(filePath);

    if (!fileStat || !fileStat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const data = await fs.readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
    // eslint-disable-next-line no-console
    console.error(err);
  }
});

server.listen(port, async () => {
  const exists = await statIfExists(outDir);
  if (!exists) {
    // eslint-disable-next-line no-console
    console.warn(`No out/ directory at ${outDir}. Run "npm run build" first.`);
  }
  // eslint-disable-next-line no-console
  console.log(`Serving static export from ${outDir}`);
  // eslint-disable-next-line no-console
  console.log(`http://localhost:${port}`);
});

