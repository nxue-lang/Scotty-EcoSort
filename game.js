'use strict';
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const binButtons = [...document.querySelectorAll('[data-bin]')];
const names = ['Recycle', 'Compost', 'Hazard', 'Landfill'];
const colors = ['#1467a1', '#25733e', '#915a0b', '#49515d'];
// Labels and shapes identify items without relying on color vision.
const items = [
  ['Can', 0, 0], ['Bottle', 0, 1], ['Paper', 0, 2],
  ['Apple core', 1, 3], ['Banana peel', 1, 4], ['Bread', 1, 5],
  ['Battery', 2, 6], ['Paint', 2, 7], ['Wrapper', 3, 8], ['Chip bag', 3, 8]
];
let w = 800, h = 480, state = 'menu', score = 0, lives = 3;
let player = {x: 400, y: 340}, trash, holding = false, route = -1;
let target = null, keys = {}, direction = 1, last = 0, clock = 0, delay = 1;
let pointer = null, walk = 0, feedback = '', flash = 0;
const lane = () => h - 143;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const binX = i => 10 + (w - 20) * (i + .5) / 4;

function resize() {
  const oldW = w;
  w = canvas.clientWidth; h = canvas.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  player.x = clamp(player.x * w / oldW, 30, w - 30); player.y = lane();
  if (trash) { trash.x = clamp(trash.x * w / oldW, 28, w - 28); trash.y = Math.min(trash.y, lane() - 25); }
  if (target !== null) target = clamp(target * w / oldW, 30, w - 30);
}
window.addEventListener('resize', resize);
function status(text) { $('status').textContent = text; }
function hud() {
  $('score').textContent = score;
  $('lives').textContent = lives + ' / 3';
  $('lives').setAttribute('aria-label', lives + ' chances left');
  $('carry').textContent = holding ? 'Carrying: ' + trash.item[0] : 'Drag to move · Catch the falling litter';
  binButtons.forEach(b => b.disabled = state !== 'play' || !holding || route !== -1);
}
function start() {
  state = 'play'; score = 0; lives = 3; holding = false; route = -1;
  trash = null; target = null; pointer = null; keys = {}; clock = 0; delay = .65; flash = 0;
  player = {x: w / 2, y: lane()};
  $('overlay').hidden = true; $('pause').disabled = false;
  $('pause').textContent = 'Pause'; $('pause').setAttribute('aria-label', 'Pause game');
  status('Move Scotty under the falling litter.'); hud();
}
function overlay(title, intro, action) {
  $('eyebrow').textContent = state === 'over' ? 'CAMPUS CLEANUP COMPLETE' : 'TAKE A BREATHER';
  $('title').textContent = title; $('intro').textContent = intro;
  $('start').textContent = action; $('overlay').hidden = false; $('start').focus();
}
function pause() {
  if (state !== 'play' && state !== 'paused') return;
  state = state === 'play' ? 'paused' : 'play'; keys = {}; target = null; pointer = null;
  $('pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
  $('pause').setAttribute('aria-label', state === 'paused' ? 'Resume game' : 'Pause game');
  if (state === 'paused') overlay('Scotty is on a break.', 'Your cleanup will be right here.', 'Keep cleaning');
  else $('overlay').hidden = true;
  hud();
}
function spawn() {
  const item = items[Math.floor(Math.random() * items.length)];
  const horizontalSpeed = 70 + Math.random() * 90;
  const vx = (Math.random() < 0.5 ? -1 : 1) * horizontalSpeed;

  trash = {
    item,
    x: 30 + Math.random() * (w - 60),
    y: -26,
    speed: (lane() + 26) / Math.max(1.5 , 2 - score * .07),
    vx: vx
  };

  status('Catch the ' + item[0].toLowerCase() + '!');
}

function finish(correct, text) {
  if (correct) score++; else lives--;
  feedback = correct ? '+1  Sorted!' : text; flash = 1.6;
  status(text); holding = false; trash = null; route = -1; target = null; delay = 1.05;
  if (!lives) {
    state = 'over'; keys = {}; $('pause').disabled = true;
    overlay('Good dog. Cleaner campus.', 'You sorted ' + score + ' item' + (score === 1 ? '' : 's') + '. Ready for another round?', 'Play again');
  }
  hud();
}
function chooseBin(i) {
  if (state !== 'play' || !holding || route !== -1) return;
  route = i; target = null; keys = {}; hud();
  status('Scotty is carrying ' + trash.item[0].toLowerCase() + ' to ' + names[i] + '.');
}
function moveToward(x, y, dt) {
  const dx = x - player.x, dy = y - player.y, distance = Math.hypot(dx, dy);
  const step = Math.min(distance, Math.max(310, w * .7) * dt);
  if (distance > 1) {
    player.x += dx / distance * step; player.y += dy / distance * step;
    if (Math.abs(dx) > 1) direction = dx > 0 ? 1 : -1;
    walk += dt * 15;
  }
  return distance < 3;
}
function update(dt) {
  clock += dt; flash = Math.max(0, flash - dt);
  if (route !== -1) {
    if (moveToward(binX(route), h - 86, dt)) {
      const expected = trash.item[1], label = trash.item[0];
      finish(route === expected, label + ' goes in ' + names[expected] + '.');
    }
    return;
  }
  const dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
  if (dx) { target = null; moveToward(clamp(player.x + dx * w, 30, w - 30), lane(), dt); }
  else moveToward(target === null ? player.x : target, lane(), dt);
  if (holding) return;
  if (!trash) { delay -= dt; if (delay <= 0) spawn(); return; }
  const before = trash.y;
  trash.y += trash.speed * dt;
  trash.x += trash.vx * dt;

  // Bounce from the left and right sides.
  if (trash.x < 25) {
    trash.x = 25;
    trash.vx = Math.abs(trash.vx);
  } else if (trash.x > w - 25) {
    trash.x = w - 25;
    trash.vx = -Math.abs(trash.vx);
  }
  // Swept vertical collision prevents fast items skipping through Scotty.
  if (Math.abs(trash.x - player.x) < 36 && before < player.y + 12 && trash.y >= player.y - 39) {
    holding = true; target = null; status('Caught ' + trash.item[0].toLowerCase() + '! Choose a bin.'); hud();
  } else if (trash.y > lane() + 29) finish(false, 'Missed the ' + trash.item[0].toLowerCase() + '.');
}
function rect(x, y, width, height, color) { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function text(value, x, y, size, color = '#24352f') {
  ctx.fillStyle = color; ctx.font = '600 ' + size + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(value, x, y);
}
function scene() {
  rect(0, 0, w, h, '#dff1f7'); ellipse(w - 65, 50, 25, 25, '#ffe18e');
  for (let i = 0; i < 4; i++) {
    const x = ((i * w / 3 + clock * 3) % (w + 100)) - 50;
    ellipse(x, 48 + i % 2 * 40, 35, 9, '#fff'); ellipse(x - 10, 43 + i % 2 * 40, 16, 12, '#fff');
  }
  const ground = h - 121;
  rect(0, ground - 54, w, 65, '#c4dacf');
  for (let i = 0; i < 7; i++) {
    const x = i * w / 6 - 30, top = ground - 80 - i % 3 * 15;
    rect(x, top, 70, ground - top, '#b0c8bc'); rect(x - 4, top, 78, 5, '#99b5a7');
    for (let j = 0; j < 3; j++) rect(x + 10 + j * 18, top + 17, 8, 13, '#d8e7d9');
  }
  rect(0, ground, w, h - ground, '#93bf83'); rect(0, ground + 5, w, 5, '#81ac74');
  rect(0, ground + 23, w, h - ground - 23, '#d9d7bf');
  for (let x = 20; x < w; x += 46) rect(x, ground + 37, 18, 2, '#c2c5ad');
}
function dog() {
  const x = player.x, y = player.y, bounce = Math.sin(walk) * 1.5;
  ellipse(x, y + 21, 30, 5, '#24352f25');
  ctx.save(); ctx.translate(x, y + bounce); ctx.scale(direction, 1);
  // A canvas sprite with upright ears, long muzzle, short legs and tartan coat.
  rect(-22, -10, 40, 25, '#283137'); rect(9, -24, 24, 25, '#283137');
  rect(24, -16, 18, 13, '#283137'); rect(35, -17, 8, 6, '#10191e');
  ctx.fillStyle = '#283137'; ctx.beginPath(); ctx.moveTo(9, -21); ctx.lineTo(9, -39); ctx.lineTo(21, -22); ctx.lineTo(25, -36); ctx.lineTo(31, -20); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-21, -6); ctx.lineTo(-32, -26); ctx.lineTo(-29, 5); ctx.fill();
  rect(-19, 10, 8, 11 + Math.sin(walk) * 2, '#20292f'); rect(9, 10, 8, 11 - Math.sin(walk) * 2, '#20292f');
  rect(-20, -12, 28, 25, '#a6192e');
  rect(-16, -12, 4, 25, '#e8ad78'); rect(-4, -12, 3, 25, '#e8ad78');
  rect(-20, -6, 28, 3, '#e8ad78'); rect(-20, 5, 28, 3, '#e8ad78');
  rect(10, -5, 9, 5, '#d14349'); ellipse(26, -20, 2, 2, '#fff'); ctx.restore();
}
function drawItem(item, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 2.5; ctx.strokeStyle = '#24352f';
  ellipse(0, 0, 21, 21, '#ffffffdf');
  const kind = item[2], color = colors[item[1]];
  if (kind === 0 || kind === 6 || kind === 7) {
    rect(-9, -12, 18, 25, kind === 6 ? '#49515d' : color);
    rect(-9, -12, 18, 4, '#c6dce2'); rect(-9, 9, 18, 4, '#c6dce2');
    text(kind === 6 ? '+' : kind === 7 ? 'P' : '=', 0, 5, 16, '#fff');
  } else if (kind === 1) {
    rect(-4, -16, 8, 7, '#1467a1'); rect(-8, -9, 16, 24, '#54aec6'); rect(-8, 0, 16, 8, '#fff');
  } else if (kind === 2) {
    rect(-11, -14, 22, 28, '#fff'); ctx.strokeRect(-11, -14, 22, 28);
    for (let i = -6; i < 10; i += 5) rect(-7, i, 14, 2, '#1467a1');
  } else if (kind === 3) {
    ellipse(-5, 0, 9, 12, '#d7504e'); ellipse(5, 0, 9, 12, '#d7504e');
    rect(-2, -15, 3, 7, '#705332'); ellipse(5, -12, 5, 3, '#25733e');
    ellipse(-12, 0, 6, 7, '#fff'); ellipse(12, 0, 6, 7, '#fff');
  } else if (kind === 4) {
    ctx.strokeStyle = '#e6b82c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -6, 13, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-3, -12); ctx.stroke();
  } else if (kind === 5) {
    rect(-12, -8, 24, 23, '#b6793d'); ellipse(0, -8, 14, 9, '#b6793d'); rect(-9, -7, 18, 19, '#f4d6a0');
  } else {
    rect(-12, -13, 24, 26, '#aa5791'); rect(-12, -13, 24, 3, '#723e69'); rect(-12, 10, 24, 3, '#723e69'); text('*', 0, 9, 24, '#fff');
  }
  ctx.restore(); text(item[0], clamp(x, 44, w - 44), y - 29, 14);
}
function draw() {
  scene();
  if (target !== null && state === 'play' && route === -1) {
    ctx.strokeStyle = '#24352f55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(target, lane() + 21, 12, 4, 0, 0, 7); ctx.stroke();
  }
  dog();
  if (trash) drawItem(trash.item, holding ? player.x : trash.x, holding ? player.y - 65 : trash.y);
  if (flash && state === 'play') text(feedback, w / 2, 30, 15);
}
function frame(time) {
  const dt = Math.min((time - (last || time)) / 1000, .05); last = time;
  if (state === 'play') update(dt);
  draw(); requestAnimationFrame(frame);
}
function point(event) {
  if (state !== 'play' || route !== -1) return;
  const box = canvas.getBoundingClientRect();
  target = clamp((event.clientX - box.left) * w / box.width, 30, w - 30);
}
canvas.addEventListener('pointerdown', event => {
  if (pointer !== null || state !== 'play') return;
  pointer = event.pointerId; canvas.setPointerCapture(pointer); point(event); event.preventDefault();
});
canvas.addEventListener('pointermove', event => { if (event.pointerId === pointer) point(event); });
canvas.addEventListener('pointerup', () => { pointer = null; });
canvas.addEventListener('pointercancel', () => { pointer = null; target = null; });
canvas.addEventListener('lostpointercapture', () => { pointer = null; });
function holdButton(id, key) {
  const button = $(id);
  button.addEventListener('pointerdown', event => {
    if (state !== 'play') return;
    button.setPointerCapture(event.pointerId); keys[key] = true; target = null; event.preventDefault();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => { keys[key] = false; });
  button.addEventListener('click', event => { if (!event.detail && state === 'play') target = clamp(player.x + (key === 'a' ? -70 : 70), 30, w - 30); });
}
holdButton('left', 'a'); holdButton('right', 'd');
window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key.startsWith('arrow') || (key === ' ' && event.target.tagName !== 'BUTTON')) event.preventDefault();
  if (key.startsWith('arrow') || key === 'a' || key === 'd') keys[key] = true;
  if (event.repeat) return;
  if (key === 'p' || key === 'escape') pause();
  if (key === 'r') start();
  if (key >= '1' && key <= '4') chooseBin(Number(key) - 1);
  if (key === 'arrowdown' || key === 's' || (key === ' ' && event.target.tagName !== 'BUTTON')) chooseBin(clamp(Math.floor(player.x / w * 4), 0, 3));
});
window.addEventListener('keyup', event => { keys[event.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { keys = {}; if (state === 'play') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pause(); });
$('start').onclick = () => state === 'paused' ? pause() : start();
$('restart').onclick = start; $('pause').onclick = pause;
binButtons.forEach((button, i) => button.onclick = () => chooseBin(i));
resize(); requestAnimationFrame(frame);
// The packed HTML works from disk. HTTPS adds offline reopening.
if (location.protocol === 'file:') $('offline').textContent = 'Offline file · Ready to play';
else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready)
    .then(() => { $('offline').textContent = 'Saved on this device · Ready offline'; })
    .catch(() => { $('offline').textContent = 'Play now · Offline save unavailable'; });
}
