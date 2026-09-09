import {readFileSync, writeFileSync, mkdirSync, readdirSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {minify} from 'terser';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
// Preserve JS newlines for automatic semicolons.
const compact = source => source.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('//')).join('\n');
const compactCss = source => compact(source).replace(/;}/g, '}');
const js = read('game.js'), css = read('style.css');
new Script(js);
const packed = await minify(js, {toplevel: true, compress: {passes: 3}, format: {comments: false}});
const html = compact(read('index.html'))
  .replace(/>\s+</g, '><')
  .replace('<link rel="stylesheet" href="style.css">', '<style>' + compactCss(css) + '</style>')
  .replace('<script src="game.js"></script>', '<script>' + packed.code + '</script>');
const hash = createHash('sha256').update(html).digest('hex').slice(0, 12);
const sw = (await minify(read('sw.js').replace('scotty-sort-v1', 'scotty-sort-' + hash), {toplevel: true})).code;
new Script(sw);
const total = Buffer.byteLength(html) + Buffer.byteLength(sw);
if (total >= 15000) throw new Error('Game exceeds the strict 15,000-byte limit: ' + total);
mkdirSync(new URL('dist/', import.meta.url), {recursive: true});
writeFileSync(new URL('dist/index.html', import.meta.url), html);
writeFileSync(new URL('dist/sw.js', import.meta.url), sw);
const files = readdirSync(new URL('dist/', import.meta.url));
if (files.some(file => !['index.html', 'sw.js'].includes(file))) throw new Error('Unexpected assets in dist; check the full payload size.');
const measured = files.reduce((sum, file) => sum + statSync(new URL('dist/' + file, import.meta.url)).size, 0);
console.log('Playable HTML: ' + Buffer.byteLength(html) + ' bytes');
console.log('Offline worker: ' + Buffer.byteLength(sw) + ' bytes');
console.log('Complete uncompressed payload: ' + measured + ' / 15,000 bytes');
