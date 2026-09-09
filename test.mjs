import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const code = read('game.js');
function game(width = 390, height = 480, source = code) {
  const elements = new Map();
  const drawing = new Proxy({}, {get: (_, prop) => prop === 'measureText' ? value => ({width: value.length * 8}) : () => {}, set: () => true});
  function element(id) {
    if (!elements.has(id)) elements.set(id, {id, textContent: '', hidden: false, disabled: true, clientWidth: width, clientHeight: height,
      events: {}, attributes: {}, addEventListener(name, fn) { this.events[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; }, focus() {},
      getContext: () => drawing, getBoundingClientRect: () => ({left: 10, top: 0, width}), setPointerCapture() {}});
    return elements.get(id);
  }
  const windowEvents = {}, documentEvents = {};
  let nextFrame;
  const context = createContext({console, location: {protocol: 'file:'}, navigator: {},
    window: {devicePixelRatio: 2, addEventListener: (name, fn) => { windowEvents[name] = fn; }},
    document: {getElementById: element, querySelectorAll: () => [0, 1, 2, 3].map(i => element('bin' + i)),
      addEventListener: (name, fn) => { documentEvents[name] = fn; }},
    requestAnimationFrame: fn => { nextFrame = fn; }});
  runInContext(source, context);
  return {element, windowEvents, documentEvents, run: js => runInContext(js, context), frame: time => nextFrame(time)};
}

for (const [width, height] of [[304, 330], [390, 480], [752, 300], [944, 550]]) {
  test(`Every item can be caught and delivered at ${width}x${height}`, () => {
    const g = game(width, height);
    g.element('start').onclick();
    assert.equal(g.run('state'), 'play');
    for (let i = 0; i < 10; i++) {
      g.run('for(let tick=0;tick<30;tick++) update(1/60);');
      g.run(`trash = {item: items[${i}], x: player.x, y: lane() - 40, speed: 100, vx: 0}; update(.05);`);
      assert.equal(g.run('holding'), true);
      const bin = g.run('trash.item[1]');
      assert.equal(g.element('bin' + bin).disabled, false);
      g.element('bin' + bin).onclick();
      g.run('for(let i=0;i<150 && route !== -1;i++) update(1/60);');
      assert.equal(g.run('score'), i + 1);
      assert.equal(g.run('lives'), 3);
      assert.equal(g.run('holding'), false);
    }
  });
}

test('Wrong bins cost one chance; three mistakes end the round; touch restart resets it', () => {
  const g = game(); g.element('start').onclick();
  for (let i = 0; i < 3; i++) {
    g.run('for(let tick=0;tick<30;tick++) update(1/60);');
    g.run('trash = {item: items[0], x: player.x, y: lane()-40, speed:100, vx:0}; update(.05); chooseBin(1); for(let i=0;i<150 && route !== -1;i++) update(1/60);');
    assert.equal(g.run('lives'), 2 - i);
  }
  assert.equal(g.run('score'), 0); assert.equal(g.run('state'), 'over');
  assert.equal(g.element('overlay').hidden, false);
  assert.match(g.element('status').textContent, /Recycle/);
  g.element('start').onclick();
  assert.equal(g.run('lives'), 3); assert.equal(g.run('state'), 'play');
});

test('The animation loop spawns random falling items, detects misses and caps background time', () => {
  const g = game(); g.element('start').onclick(); g.frame(1000);
  for (let time = 1016; time < 1850; time += 16) g.frame(time);
  assert.equal(g.run('!!trash'), true);
  const y = g.run('trash.y'); g.frame(50000);
  assert.ok(g.run('trash.y') > y); assert.equal(g.run('lives'), 3);
  g.run('trash = {item: items[0], x: w - 26, y: 0, speed: 0, vx: 100}; update(.1);');
  assert.equal(g.run('trash.x'), g.run('w - 25'));
  assert.equal(g.run('trash.vx'), -100);
  g.run('player.x=30; trash.x=w-30; trash.y=lane()+30; update(.016);');
  assert.equal(g.run('lives'), 2); assert.equal(g.run('trash'), null);
  const xs = g.run('Array.from({length:20},()=>{spawn(); return trash.x})');
  assert.ok(new Set(xs).size > 1); assert.ok(xs.every(x => x >= 30 && x <= 360));
});

test('Tap, drag, held buttons, pointer cancellation and keyboard input move Scotty', () => {
  const g = game(); g.element('start').onclick();
  const event = {pointerId: 1, clientX: 350, preventDefault() {}};
  g.element('game').events.pointerdown(event); g.run('update(.05)');
  assert.ok(g.run('player.x') > 195);
  g.element('game').events.pointermove({...event, clientX: 40}); g.run('update(.05)');
  assert.equal(g.run('target'), 30);
  g.element('game').events.pointercancel(); assert.equal(g.run('target'), null);
  g.element('left').events.pointerdown(event); g.run('update(.05)');
  assert.equal(g.run('keys.a'), true);
  g.element('left').events.lostpointercapture(); assert.equal(g.run('keys.a'), false);
  let prevented = false;
  g.windowEvents.keydown({key:'ArrowRight', target:{tagName:'BUTTON'}, preventDefault(){prevented=true;}});
  assert.ok(prevented); assert.equal(g.run('keys.arrowright'), true);
  g.windowEvents.keyup({key:'ArrowRight'}); assert.equal(g.run('keys.arrowright'), false);
});

test('Pause freezes the game and tab switching clears movement; resize preserves a playable field', () => {
  const g = game(); g.element('start').onclick(); g.run('spawn()');
  const before = g.run('trash.y'); g.element('pause').onclick();
  g.frame(1000); g.frame(2000); assert.equal(g.run('trash.y'), before);
  assert.equal(g.run('state'), 'paused'); g.element('start').onclick();
  assert.equal(g.run('state'), 'play');
  g.run('keys.a = true'); g.windowEvents.blur();
  assert.equal(g.run('state'), 'paused'); assert.equal(g.run('!!keys.a'), false);
  g.element('game').clientWidth = 304; g.element('game').clientHeight = 330;
  g.windowEvents.resize(); assert.ok(g.run('player.x <= w-30 && player.y === lane()'));
});

test('Published payload is under 15,000 bytes, self-contained and executable from disk', () => {
  const files = readdirSync(new URL('dist/', import.meta.url));
  const total = files.reduce((sum, file) => sum + statSync(new URL('dist/' + file, import.meta.url)).size, 0);
  assert.ok(total < 15000, String(total));
  const html = read('dist/index.html');
  assert.doesNotMatch(html, /(?:src|href)=["']https?:/);
  assert.doesNotMatch(html, /src="game.js"|href="style.css"/);
  const packed = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const g = game(390, 480, packed); g.element('start').onclick();
  g.frame(1000); for(let time=1016; time<3000; time+=16) g.frame(time);
  assert.equal(g.element('overlay').hidden, true);
  assert.match(g.element('status').textContent, /Catch/);
  assert.match(g.element('offline').textContent, /Ready to play/);
});

test('Service worker caches the game, reopens it offline, and leaves other caches alone', async () => {
  const events = {}, stores = new Map([['unrelated-app', new Map()], ['scotty-sort-old', new Map()]]);
  const cacheAPI = {
    open: async key => {
      if (!stores.has(key)) stores.set(key, new Map());
      return {addAll: async urls => urls.forEach(url => stores.get(key).set(url, 'cached game')),
        put: async (url, value) => stores.get(key).set(url, value)};
    },
    keys: async () => [...stores.keys()], delete: async key => stores.delete(key),
    match: async url => {for (const store of stores.values()) if(store.has(url)) return store.get(url);}
  };
  const self = {location: new URL('https://example.test/game/sw.js'),
    addEventListener: (name, fn) => {events[name] = fn;}, skipWaiting: async () => {}, clients: {claim: async () => {}}};
  runInContext(read('dist/sw.js'), createContext({self, URL, caches: cacheAPI, fetch: async () => {throw new Error('Offline');}}));
  let pending;
  events.install({waitUntil: promise => {pending = promise;}}); await pending;
  events.activate({waitUntil: promise => {pending = promise;}}); await pending;
  assert.ok(stores.has('unrelated-app')); assert.ok(!stores.has('scotty-sort-old'));
  events.fetch({request: {method:'GET', mode:'navigate', url:'https://example.test/game/index.html'}, respondWith: promise => {pending = promise;}});
  assert.equal(await pending, 'cached game');
});
