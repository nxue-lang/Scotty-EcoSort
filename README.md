# Scotty Sort

Help CMU's Scotty catch randomly falling litter, carry it to a bin, and sort it.
The playable release is **14,931 bytes total, uncompressed**: `dist/index.html`
(14,194 bytes) and `dist/sw.js` (737 bytes). It fits below both 15,000 bytes and
15 KiB. Build tools, source files and tests are not part of the playable payload.

## Play

- **Phone / tablet:** drag or tap the field to move, or hold the Left / Right
  buttons. Once Scotty catches an item, tap a bin; he carries it over and drops it.
- **Keyboard:** A/D or Left/Right to move; 1–4 to choose a bin. Down, S or Space
  chooses the bin below Scotty. P/Escape pauses; R restarts.
- Correct sorting earns a point. Misses and incorrect bins cost one of three
  chances. Items fall faster as your score grows. The game pauses when hidden.
- Recycle: cans, bottles, paper. Compost: apple cores, banana peels, bread.
  Hazard: batteries, paint. Landfill: wrappers, chip bags.

## Offline and sharing

Share the published HTTPS game URL. No account or installation is required when
the Site's audience is public. On each device, open it online once and wait for
**“Saved on this device · Ready offline”** before disconnecting. The same URL can
then reopen offline while the browser retains its cached data. Clearing site data,
private browsing restrictions, or browser cache eviction can remove that copy.
The first visit to a web link requires a connection.

For a standalone offline submission, copy **`dist/index.html`** and open it in a
browser. All game code, styling, and canvas artwork are embedded; it works without
the service worker or any network request. The two-file `dist` folder is the
complete web release, including offline reopening. It uses no remote assets,
fonts, APIs, analytics, or runtime libraries.

## Edit and build

Edit `index.html`, `style.css`, and `game.js`; edit `sw.js` for web caching.
Install the pinned development dependency with `pnpm install --frozen-lockfile`.
Then run:

```sh
node build.mjs
node --test test.mjs
node serve.mjs
```

The preview is at `http://127.0.0.1:4173`. Serve/deploy **`dist`**, not the source
directory. You can also open the root `index.html` directly from disk to preview
source edits with its adjacent CSS and JavaScript files.

The build inlines the CSS and minified JavaScript, versions the offline cache
from the HTML content hash, and rejects a total payload of 15,000 bytes or more
or unexpected files in `dist`. Rebuild after edits; the printed sizes are the
authoritative measurements. No compression is needed to meet the limit.

The automated tests exercise all item categories, correct/wrong bins, misses,
restart, animation, keyboard and pointer handlers, pause, resize, packed-file
execution, offline navigation and cache cleanup. Game-field sizes cover small
phones, phones, landscape screens and tablets. These are simulated logic and
event tests; physical iOS/Android device testing has not been performed.

## Publishing

`.openai/hosting.json` points Sites at the tracked `dist` output. Deploy that
validated output with public access for anyone-with-the-link play. The same
two-file output can be hosted on another static HTTPS host if needed.
