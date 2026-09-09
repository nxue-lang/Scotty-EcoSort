import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const files = {'/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/sw.js': ['sw.js', 'text/javascript']};
const server = createServer(async (request, response) => {
  const entry = files[new URL(request.url, 'http://localhost').pathname];
  if (!entry) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const data = await readFile(new URL('dist/' + entry[0], import.meta.url));
    response.writeHead(200, {'Content-Type': entry[1] + '; charset=utf-8', 'Cache-Control': 'no-cache'});
    response.end(data);
  } catch {
    response.writeHead(503); response.end('Run node build.mjs first.');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
