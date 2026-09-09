const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 150;
const PLAYER_SPEED = 6;

const colors = {
  ink: "#1f2924",
  muted: "#5f6964",
  background: "#edf5ea",
  grass: "#cfe2cd",
  pathLine: "#d9ead7",
  wrong: "#c74747",
  recycle: "#3284d6",
  compost: "#46964e",
  hazardous: "#dda42d",
  landfill: "#60636c",
  white: "#fffdf3"
};

const binData = [
  { type: "recycle", label: "RECYCLE", x: 70, color: colors.recycle },
  { type: "compost", label: "COMPOST", x: 280, color: colors.compost },
  { type: "hazardous", label: "HAZARD", x: 490, color: colors.hazardous },
  { type: "landfill", label: "LANDFILL", x: 700, color: colors.landfill }
];

const bins = binData.map((bin) => ({
  ...bin,
  y: HEIGHT - 125,
  width: 140,
  height: 92
}));

const trashTypes = [
  { label: "CAN", type: "recycle", color: colors.recycle },
  { label: "BOTTLE", type: "recycle", color: colors.recycle },
  { label: "PAPER", type: "recycle", color: colors.recycle },
  { label: "APPLE", type: "compost", color: colors.compost },
  { label: "PEEL", type: "compost", color: colors.compost },
  { label: "BREAD", type: "compost", color: colors.compost },
  { label: "BATTERY", type: "hazardous", color: colors.hazardous },
  { label: "PAINT", type: "hazardous", color: colors.hazardous },
  { label: "PILLS", type: "hazardous", color: colors.hazardous },
  { label: "WRAP", type: "landfill", color: colors.landfill },
  { label: "CHIPS", type: "landfill", color: colors.landfill },
  { label: "GLOVES", type: "landfill", color: colors.landfill }
];

const startButton = {
  x: WIDTH / 2 - 120,
  y: 460,
  width: 240,
  height: 62
};

const keys = {};

let screen = "menu";
let player;
let trash;
let holdingTrash;
let score;
let lives;
let message;
let warningFrames;

function chooseRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createTrash() {
  const item = chooseRandom(trashTypes);
  const direction = chooseRandom([-2, -1, 1, 2]);

  return {
    ...item,
    x: 20 + Math.floor(Math.random() * (WIDTH - 50)),
    y: -34,
    width: 32,
    height: 32,
    dx: direction
  };
}

function resetGame() {
  player = { x: 428, y: 390, width: 44, height: 44 };
  trash = createTrash();
  holdingTrash = false;
  score = 0;
  lives = 3;
  warningFrames = 0;
  message = "Catch the trash, then drop it in the matching bin.";
}

function isTouching(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawText(value, x, y, size = 26, color = colors.ink, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function drawBackground() {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = colors.grass;
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);

  ctx.strokeStyle = colors.pathLine;
  for (let x = -200; x < WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 260, HEIGHT);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.fillStyle = "#eeeeee";
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(player.x + 22, player.y + 22, 23, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(player.x + 14, player.y + 18, 4, 0, Math.PI * 2);
  ctx.arc(player.x + 30, player.y + 18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x + 22, player.y + 23, 9, 0, Math.PI);
  ctx.stroke();

  if (holdingTrash) {
    ctx.beginPath();
    ctx.moveTo(player.x + 22, player.y);
    ctx.lineTo(player.x + 22, player.y - 19);
    ctx.stroke();
  }
}

function drawTrash() {
  ctx.fillStyle = trash.color;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(trash.x, trash.y, trash.width, trash.height);
  ctx.strokeRect(trash.x, trash.y, trash.width, trash.height);
  drawText(trash.label, trash.x + trash.width / 2, trash.y + 21, 10, "white", "center");
}

function drawBins() {
  for (const bin of bins) {
    ctx.fillStyle = bin.color;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3;
    ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
    ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);

    ctx.fillStyle = colors.white;
    ctx.fillRect(bin.x + 13, bin.y + 14, bin.width - 26, 17);
    drawText(bin.label, bin.x + bin.width / 2, bin.y + 58, 19, "white", "center");
  }
}

function drawMenu() {
  drawBackground();
  drawText("Waste Sorting", WIDTH / 2, 125, 58, colors.ink, "center");
  drawText("Move with W A S D or arrow keys.", WIDTH / 2, 205, 28, colors.ink, "center");
  drawText("Catch falling waste and carry it to the right bin.", WIDTH / 2, 245, 28, colors.ink, "center");
  drawText("Recycle: cans, bottles, paper", WIDTH / 2, 318, 23, colors.recycle, "center");
  drawText("Compost: apple, peel, bread", WIDTH / 2, 350, 23, colors.compost, "center");
  drawText("Hazardous: battery, paint, pills", WIDTH / 2, 382, 23, colors.hazardous, "center");
  drawText("Landfill: wrappers, chip bags, gloves", WIDTH / 2, 414, 23, colors.landfill, "center");

  ctx.fillStyle = colors.compost;
  ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(startButton.x, startButton.y, startButton.width, startButton.height);
  drawText("START", WIDTH / 2, 500, 31, "white", "center");
}

function drawGameOver() {
  drawBackground();
  drawText("Game Over", WIDTH / 2, 185, 60, colors.wrong, "center");
  drawText(`Final score: ${score}`, WIDTH / 2, 270, 32, colors.ink, "center");
  drawText("Press R to restart.", WIDTH / 2, 335, 24, colors.muted, "center");
}

function loseLife(reason) {
  lives -= 1;
  holdingTrash = false;
  trash = createTrash();
  message = reason;
  warningFrames = 45;

  if (lives < 1) {
    screen = "game-over";
  }
}

function movePlayer() {
  if (keys.ArrowLeft || keys.a) player.x -= PLAYER_SPEED;
  if (keys.ArrowRight || keys.d) player.x += PLAYER_SPEED;
  if (keys.ArrowUp || keys.w) player.y -= PLAYER_SPEED;
  if (keys.ArrowDown || keys.s) player.y += PLAYER_SPEED;

  player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));
  player.y = Math.max(0, Math.min(HEIGHT - GROUND_HEIGHT - player.height, player.y));
}

function updateHeldTrash() {
  trash.x = player.x + 6;
  trash.y = player.y - 30;

  for (const bin of bins) {
    if (!isTouching(player, bin)) continue;

    if (bin.type === trash.type) {
      score += 1;
      message = `Correct: ${trash.label} goes in ${bin.label}.`;
      holdingTrash = false;
      trash = createTrash();
    } else {
      loseLife(`Wrong bin: ${trash.label} is ${trash.type}.`);
    }
    break;
  }
}

function updateFallingTrash() {
  trash.y += 3;
  trash.x += trash.dx;

  if (trash.x < 0 || trash.x + trash.width > WIDTH) {
    trash.dx *= -1;
  }

  if (isTouching(player, trash)) {
    holdingTrash = true;
    message = `Carrying ${trash.label}: find ${trash.type}.`;
  } else if (trash.y > HEIGHT) {
    loseLife(`Missed ${trash.label}.`);
  }
}

function updateGame() {
  movePlayer();

  if (holdingTrash) {
    updateHeldTrash();
  } else {
    updateFallingTrash();
  }

  if (warningFrames > 0) {
    warningFrames -= 1;
  }
}

function drawGame() {
  drawBackground();
  drawBins();
  drawPlayer();
  drawTrash();
  drawText(`Score: ${score}`, 18, 38, 30);
  drawText(`Lives: ${lives}`, 18, 74, 30);
  drawText(message, 18, 108, 20, warningFrames ? colors.wrong : colors.muted);
}

function draw() {
  if (screen === "menu") drawMenu();
  if (screen === "play") drawGame();
  if (screen === "game-over") drawGameOver();
  requestAnimationFrame(draw);
}

function startGame() {
  resetGame();
  screen = "play";
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (screen === "game-over" && event.key.toLowerCase() === "r") {
    startGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

canvas.addEventListener("click", (event) => {
  const canvasBox = canvas.getBoundingClientRect();
  const mouseX = (event.clientX - canvasBox.left) * WIDTH / canvasBox.width;
  const mouseY = (event.clientY - canvasBox.top) * HEIGHT / canvasBox.height;

  const clickedStart =
    mouseX > startButton.x &&
    mouseX < startButton.x + startButton.width &&
    mouseY > startButton.y &&
    mouseY < startButton.y + startButton.height;

  if (screen === "menu" && clickedStart) {
    startGame();
  }
});

resetGame();
draw();
