// ---- Personalize via URL, e.g. ?name=Anna&msg=Have%20a%20great%20day ----
const params = new URLSearchParams(window.location.search);
const nameFromUrl = params.get("name");
const msgFromUrl = params.get("msg");
if (nameFromUrl) document.getElementById("name").textContent = nameFromUrl;
if (msgFromUrl) document.getElementById("message").textContent = msgFromUrl;

// ---- Blur-to-focus reveal for the photo on load ----
const orbPhoto = document.querySelector(".orb-photo");
function revealPhoto() {
  setTimeout(() => orbPhoto && orbPhoto.classList.add("revealed"), 250);
}
if (orbPhoto) {
  if (orbPhoto.complete) revealPhoto();
  else {
    orbPhoto.addEventListener("load", revealPhoto);
    orbPhoto.addEventListener("error", revealPhoto);
  }
}
window.addEventListener("load", revealPhoto);

// ---- Reveal-a-wish button ----
const wishes = [
  "May this year be your brightest one yet.",
  "Sending you calm mornings and golden evenings.",
  "You make the world a little warmer just by being in it.",
  "Here's to dreams that finally come true.",
  "Cake first. Everything else can wait.",
];
let widx = 0;
const btn = document.getElementById("surprise");
const text = document.getElementById("surpriseText");
btn.addEventListener("click", () => {
  text.classList.remove("show");
  setTimeout(() => {
    text.textContent = wishes[widx % wishes.length];
    text.classList.add("show");
    widx++;
    shootStar();
    launchBalloons(isTouch ? 3 : 6);
    glitterBurst(isTouch ? 55 : 90);
  }, 180);
});

// ---- shared audio volume state (song ducks under celebrity voices) ----
const SONG_FULL = 0.85;   // normal background song volume
const SONG_DUCK = 0.03;   // volume while a celebrity recording plays
let isDucked = false;     // true while a voice note is playing
let fadeTimer = null;     // the single active volume-ramp timer

// ---- Celebrity voice wishes ----
const celebAudio = document.getElementById("celebAudio");
const celebButtons = Array.from(document.querySelectorAll(".btn-celeb"));
let activeCelebBtn = null;

function labelFor(btn, playing) {
  const span = btn.querySelector("span");
  const name = span.textContent.replace(/^[▶⏸]\s*/, "");
  span.textContent = (playing ? "⏸ " : "▶ ") + name;
}

function stopCeleb() {
  celebAudio.pause();
  celebAudio.currentTime = 0;
  if (activeCelebBtn) {
    activeCelebBtn.classList.remove("playing");
    labelFor(activeCelebBtn, false);
    activeCelebBtn = null;
  }
  restoreSongVolume();
}

// duck / restore the background birthday song so the voice is clear.
// A single "isDucked" flag is the source of truth; the song's own fade-in
// respects it so nothing fights the duck.
function duckSong() {
  isDucked = true;
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  if (typeof song !== "undefined") song.volume = SONG_DUCK; // very faint under the voice
}
function restoreSongVolume() {
  isDucked = false;
  if (typeof song === "undefined" || song.paused) return;
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = setInterval(() => {
    if (isDucked) { clearInterval(fadeTimer); fadeTimer = null; return; } // re-ducked meanwhile
    song.volume = Math.min(SONG_FULL, song.volume + 0.05);
    if (song.volume >= SONG_FULL) { clearInterval(fadeTimer); fadeTimer = null; }
  }, 80);
}

celebButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const src = btn.getAttribute("data-src");
    // tapping the currently playing one stops it
    if (activeCelebBtn === btn && !celebAudio.paused) {
      stopCeleb();
      return;
    }
    // switch to this celebrity
    stopCeleb();
    celebAudio.src = src;
    duckSong();
    const p = celebAudio.play();
    if (p && p.catch) p.catch(() => {});
    activeCelebBtn = btn;
    btn.classList.add("playing");
    labelFor(btn, true);
    // little celebration
    if (typeof glitterBurst === "function") glitterBurst(isTouch ? 30 : 45);
  });
});

// when a voice note finishes, reset its button and bring the song back
celebAudio.addEventListener("ended", stopCeleb);

// ---- Surprise gift: reveal the hand-made painting ----
const giftBtn = document.getElementById("giftBtn");
const giftOverlay = document.getElementById("giftOverlay");
const giftClose = document.getElementById("giftClose");

function openGift() {
  giftOverlay.hidden = false;
  if (typeof glitterBurst === "function") glitterBurst(isTouch ? 60 : 100);
  if (typeof launchBalloons === "function") launchBalloons(isTouch ? 3 : 6);
}
function closeGift() {
  giftOverlay.hidden = true;
}

giftBtn.addEventListener("click", openGift);
giftClose.addEventListener("click", closeGift);
// tap the dark backdrop (but not the image/caption) to close
giftOverlay.addEventListener("click", (e) => {
  if (e.target === giftOverlay) closeGift();
});
// Escape key closes it too
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !giftOverlay.hidden) closeGift();
});

// ---- Want more surprise? -> Yes / Of course yes -> heartfelt message ----
const moreBtn = document.getElementById("moreBtn");
const choiceRow = document.getElementById("choiceRow");
const finalMessage = document.getElementById("finalMessage");

moreBtn.addEventListener("click", () => {
  choiceRow.hidden = false;
  moreBtn.disabled = true;
  moreBtn.style.opacity = "0.6";
  moreBtn.style.cursor = "default";
});

choiceRow.querySelectorAll(".btn-choice").forEach((b) => {
  b.addEventListener("click", () => {
    // hide the choices, reveal the message
    choiceRow.hidden = true;
    finalMessage.textContent = "More to come, baby — but nothing is more special than you 💛";
    // let the fade-in transition trigger
    requestAnimationFrame(() => finalMessage.classList.add("show"));
    // celebrate
    if (typeof launchBalloons === "function") launchBalloons(isTouch ? 3 : 6);
    if (typeof glitterBurst === "function") glitterBurst(isTouch ? 60 : 100);
    if (typeof shootStar === "function") shootStar();
  });
});

// ---- Birthday song ----
// Browsers block audio until the user interacts, so we try to autoplay,
// and if that's blocked we start on her very first tap/touch/keypress.
const song = document.getElementById("song");
const musicBtn = document.getElementById("musicToggle");
let musicStarted = false;

song.volume = 0.0; // start silent, fade in for a gentle intro

function fadeIn(step = 0.03) {
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = setInterval(() => {
    // never fight the duck: if a voice note is playing, stop ramping up
    if (isDucked) { clearInterval(fadeTimer); fadeTimer = null; song.volume = SONG_DUCK; return; }
    song.volume = Math.min(SONG_FULL, song.volume + step);
    if (song.volume >= SONG_FULL) { clearInterval(fadeTimer); fadeTimer = null; }
  }, 80);
}

function startMusic() {
  if (musicStarted) return;
  const p = song.play();
  if (p && typeof p.then === "function") {
    p.then(() => {
      musicStarted = true;
      musicBtn.classList.add("playing");
      musicBtn.classList.remove("muted");
      fadeIn();
    }).catch(() => {
      // autoplay blocked — will retry on first user interaction
    });
  }
}

// try immediately (works where allowed)
startMusic();

// fallback: first interaction anywhere kicks it off
function firstInteractionStart() {
  startMusic();
  if (musicStarted) removeFirstInteraction();
}
function removeFirstInteraction() {
  ["pointerdown", "touchstart", "keydown", "click"].forEach((ev) =>
    window.removeEventListener(ev, firstInteractionStart)
  );
}
["pointerdown", "touchstart", "keydown", "click"].forEach((ev) =>
  window.addEventListener(ev, firstInteractionStart, { passive: true })
);

// toggle button: play/pause
musicBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!musicStarted) {
    startMusic();
    return;
  }
  if (song.paused) {
    song.play();
    musicBtn.classList.add("playing");
    musicBtn.classList.remove("muted");
  } else {
    song.pause();
    musicBtn.classList.remove("playing");
    musicBtn.classList.add("muted");
  }
});

// =====================================================================
//  Two-layer party engine
//   #bg  -> stars + nebula (behind the card)
//   #fx  -> balloons + glitter + wishes (above the card, tappable)
// =====================================================================
const bg = document.getElementById("bg");
const bgx = bg.getContext("2d");
const fx = document.getElementById("fx");
const fxx = fx.getContext("2d");
let W, H, DPR;

const pointer = { x: 0, y: 0, ex: 0, ey: 0 };

function sizeCanvas(cv, cx) {
  cv.width = W * DPR;
  cv.height = H * DPR;
  cv.style.width = W + "px";
  cv.style.height = H + "px";
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  sizeCanvas(bg, bgx);
  sizeCanvas(fx, fxx);
  buildStars();
}
window.addEventListener("resize", resize);

window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / W) * 2 - 1;
  pointer.y = (e.clientY / H) * 2 - 1;
  document.body.style.setProperty("--mx", (pointer.x * 30).toFixed(1) + "px");
  document.body.style.setProperty("--my", (pointer.y * 30).toFixed(1) + "px");
});

function rand(a, b) { return a + Math.random() * (b - a); }
const palette = ["#ff5c9d", "#8b5cff", "#33c4ff", "#ffd166", "#4cd4b0", "#ff8c42"];
const balloonColors = ["#ff5c9d", "#8b5cff", "#33c4ff", "#ffd166", "#ff8c42", "#4cd4b0", "#ff3b6b"];

// ---- Tap a balloon to pop it and reveal a fading wish ----
const balloonWishes = [
  "Happy Birthday, Divyanshi! 🎉",
  "Make a wish! ✨",
  "Hope your day is magical 💫",
  "You deserve all the cake 🍰",
  "Shine bright this year 🌟",
  "So glad you were born 💛",
  "Here's to an amazing year! 🥳",
  "Sending you all my love 💖",
];
let bwidx = 0;
const wishLabels = [];

const isTouch = window.matchMedia("(pointer: coarse)").matches;
const tapPad = isTouch ? 24 : 6;

function tryPopAt(mx, my) {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    const sway = Math.sin(b.sway) * b.swayAmp;
    const bx = b.x + sway - pointer.ex * 18;
    const by = b.y;
    const ry = b.rx * 1.25;
    const dx = (mx - bx) / (b.rx + tapPad);
    const dy = (my - by) / (ry + tapPad);
    if (dx * dx + dy * dy <= 1) {
      popBalloon(b, i, bx, by);
      return true;
    }
  }
  return false;
}

// Handle taps at the window level so balloons pop even when floating over the card.
// Only consume the event if a balloon was actually hit; otherwise let the button/card work.
window.addEventListener("pointerdown", (e) => {
  startMusic(); // ensure the song starts even if this tap pops a balloon
  // don't pop balloons while the gift overlay is open
  const giftOpen = giftOverlay && !giftOverlay.hidden;
  if (giftOpen) return;
  const hit = tryPopAt(e.clientX, e.clientY);
  if (hit) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true); // capture phase so we see it before the button

function popBalloon(b, index, x, y) {
  balloons.splice(index, 1);
  for (let k = 0; k < 36; k++) {
    glitter.push({
      x, y,
      r: rand(1.5, 4),
      c: Math.random() < 0.5 ? b.c : palette[(Math.random() * palette.length) | 0],
      vx: rand(-1, 1) * 6,
      vy: rand(-1, 1) * 6,
      tw: Math.random() * Math.PI * 2,
      tws: rand(0.1, 0.25),
      life: 60,
    });
  }
  wishLabels.push({
    text: balloonWishes[bwidx % balloonWishes.length],
    x, y,
    c: b.c,
    life: 225,      // ~3.7s at 60fps
    maxLife: 225,
    vy: 0.35,
  });
  bwidx++;
}

// ---------- twinkling confetti-stars (background) ----------
let stars = [];
const LAYERS = [
  { count: 120, speed: 0.02, size: [0.4, 1.0], depth: 8 },
  { count: 80,  speed: 0.05, size: [0.8, 1.8], depth: 24 },
  { count: 40,  speed: 0.10, size: [1.2, 2.8], depth: 55 },
];
function buildStars() {
  stars = [];
  LAYERS.forEach((layer, li) => {
    const n = Math.round(layer.count * (W * H) / (1440 * 900));
    for (let i = 0; i < Math.max(n, 18); i++) {
      stars.push({
        layer: li,
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(layer.size[0], layer.size[1]),
        c: palette[(Math.random() * palette.length) | 0],
        tw: Math.random() * Math.PI * 2,
        tws: rand(0.01, 0.04),
        vx: rand(-0.15, 0.15) * layer.speed * 20,
        vy: rand(-0.15, 0.15) * layer.speed * 20,
      });
    }
  });
}

// ---------- glitter (foreground) ----------
let glitter = [];
function seedGlitter(n) {
  for (let i = 0; i < n; i++) {
    glitter.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(0.8, 2.4),
      c: palette[(Math.random() * palette.length) | 0],
      vx: rand(-0.3, 0.3),
      vy: rand(0.1, 0.6),
      tw: Math.random() * Math.PI * 2,
      tws: rand(0.05, 0.14),
      life: Infinity,
    });
  }
}
function glitterBurst(n) {
  for (let i = 0; i < n; i++) {
    glitter.push({
      x: W / 2, y: H / 2,
      r: rand(1, 3),
      c: palette[(Math.random() * palette.length) | 0],
      vx: rand(-1, 1) * 5,
      vy: rand(-1, 1) * 5,
      tw: Math.random() * Math.PI * 2,
      tws: rand(0.1, 0.25),
      life: 70,
    });
  }
}

// ---------- balloons (foreground) ----------
let balloons = [];
function makeBalloon(fromBottom) {
  const c = balloonColors[(Math.random() * balloonColors.length) | 0];
  const big = isTouch ? rand(26, 42) : rand(20, 34);
  return {
    x: rand(W * 0.08, W * 0.92),
    y: fromBottom ? H + rand(20, 160) : rand(0, H),
    rx: big,
    c,
    vy: rand(0.4, 0.9),
    sway: Math.random() * Math.PI * 2,
    sways: rand(0.01, 0.03),
    swayAmp: rand(8, 26),
  };
}
function seedBalloons(n) { for (let i = 0; i < n; i++) balloons.push(makeBalloon(false)); }
function launchBalloons(n) { for (let i = 0; i < n; i++) balloons.push(makeBalloon(true)); }

function drawBalloon(b) {
  const ry = b.rx * 1.25;
  const sway = Math.sin(b.sway) * b.swayAmp;
  const x = b.x + sway - pointer.ex * 18;
  const y = b.y;

  // string
  fxx.globalAlpha = 0.5;
  fxx.strokeStyle = "rgba(120,110,150,0.55)";
  fxx.lineWidth = 1.2;
  fxx.beginPath();
  fxx.moveTo(x, y + ry);
  fxx.quadraticCurveTo(x + sway * 0.4, y + ry + 28, x - sway * 0.2, y + ry + 56);
  fxx.stroke();

  // body
  fxx.globalAlpha = 0.95;
  fxx.fillStyle = b.c;
  fxx.beginPath();
  fxx.ellipse(x, y, b.rx, ry, 0, 0, Math.PI * 2);
  fxx.fill();

  // knot
  fxx.beginPath();
  fxx.moveTo(x - 4, y + ry);
  fxx.lineTo(x + 4, y + ry);
  fxx.lineTo(x, y + ry + 7);
  fxx.closePath();
  fxx.fill();

  // shine
  fxx.globalAlpha = 0.4;
  fxx.fillStyle = "#ffffff";
  fxx.beginPath();
  fxx.ellipse(x - b.rx * 0.35, y - ry * 0.35, b.rx * 0.28, ry * 0.2, -0.5, 0, Math.PI * 2);
  fxx.fill();
}

// ---------- shooting stars (background) ----------
const shooters = [];
function shootStar() {
  shooters.push({ x: rand(W * 0.1, W * 0.5), y: rand(0, H * 0.3), vx: rand(6, 10), vy: rand(3, 5), life: 60, len: rand(80, 160) });
}
setInterval(() => { if (Math.random() < 0.5) shootStar(); }, 4200);
// fewer balloons + slower spawn on phones so the screen isn't crowded
const MAX_BALLOONS = isTouch ? 6 : 16;
const SPAWN_MS = isTouch ? 5200 : 3000;
setInterval(() => { if (balloons.length < MAX_BALLOONS) launchBalloons(1); }, SPAWN_MS);

function draw() {
  pointer.ex += (pointer.x - pointer.ex) * 0.06;
  pointer.ey += (pointer.y - pointer.ey) * 0.06;

  // ---------------- BACKGROUND LAYER ----------------
  bgx.clearRect(0, 0, W, H);

  for (const s of stars) {
    const d = LAYERS[s.layer].depth;
    s.x += s.vx * 0.016;
    s.y += s.vy * 0.016;
    if (s.x < -5) s.x = W + 5; if (s.x > W + 5) s.x = -5;
    if (s.y < -5) s.y = H + 5; if (s.y > H + 5) s.y = -5;
    const px = s.x - pointer.ex * d;
    const py = s.y - pointer.ey * d;
    s.tw += s.tws;
    const alpha = 0.5 + Math.sin(s.tw) * 0.5;
    bgx.globalAlpha = alpha;
    bgx.fillStyle = s.c;
    bgx.beginPath();
    bgx.arc(px, py, s.r, 0, Math.PI * 2);
    bgx.fill();
    if (s.layer === 2) {
      bgx.globalAlpha = alpha * 0.18;
      bgx.beginPath();
      bgx.arc(px, py, s.r * 2.6, 0, Math.PI * 2);
      bgx.fill();
    }
  }

  // nebula glow following cursor
  const gx = W / 2 + pointer.ex * 60;
  const gy = H / 2 + pointer.ey * 60;
  const grad = bgx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.4);
  grad.addColorStop(0, "rgba(255,92,157,0.10)");
  grad.addColorStop(0.5, "rgba(139,92,255,0.06)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  bgx.globalAlpha = 1;
  bgx.fillStyle = grad;
  bgx.fillRect(0, 0, W, H);

  // shooting stars
  for (let i = shooters.length - 1; i >= 0; i--) {
    const sh = shooters[i];
    sh.x += sh.vx; sh.y += sh.vy; sh.life--;
    const tailX = sh.x - sh.vx * (sh.len / 10);
    const tailY = sh.y - sh.vy * (sh.len / 10);
    const g = bgx.createLinearGradient(sh.x, sh.y, tailX, tailY);
    g.addColorStop(0, "rgba(255,92,157,0.95)");
    g.addColorStop(0.5, "rgba(139,92,255,0.6)");
    g.addColorStop(1, "rgba(51,196,255,0)");
    bgx.globalAlpha = Math.max(sh.life / 60, 0);
    bgx.strokeStyle = g;
    bgx.lineWidth = 2;
    bgx.beginPath();
    bgx.moveTo(sh.x, sh.y);
    bgx.lineTo(tailX, tailY);
    bgx.stroke();
    if (sh.life <= 0 || sh.x > W + 200 || sh.y > H + 200) shooters.splice(i, 1);
  }
  bgx.globalAlpha = 1;

  // ---------------- FOREGROUND LAYER ----------------
  fxx.clearRect(0, 0, W, H);

  // balloons
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.y -= b.vy;
    b.sway += b.sways;
    drawBalloon(b);
    if (b.y < -140) balloons.splice(i, 1);
  }

  // glitter
  for (let i = glitter.length - 1; i >= 0; i--) {
    const p = glitter[i];
    p.x += p.vx;
    p.y += p.vy;
    p.tw += p.tws;
    if (p.life !== Infinity) { p.life--; }
    else {
      if (p.y > H + 5) { p.y = -5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
    }
    const spark = 0.4 + Math.abs(Math.sin(p.tw)) * 0.6;
    fxx.globalAlpha = p.life === Infinity ? spark : Math.max(spark * (p.life / 70), 0);
    fxx.fillStyle = p.c;
    fxx.beginPath();
    fxx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    fxx.fill();
  }
  glitter = glitter.filter((p) => p.life === Infinity || p.life > 0);

  // wish labels (fading)
  fxx.textAlign = "center";
  fxx.textBaseline = "middle";
  const wishFontSize = Math.max(20, Math.min(30, W * 0.055));
  fxx.font = `700 ${wishFontSize}px Inter, system-ui, sans-serif`;
  for (let i = wishLabels.length - 1; i >= 0; i--) {
    const wl = wishLabels[i];
    wl.life--;
    wl.y -= wl.vy;
    const t = wl.life / wl.maxLife;
    const alpha = t > 0.85 ? (1 - t) / 0.15 : Math.min(t / 0.6, 1);
    fxx.globalAlpha = Math.max(alpha, 0);
    fxx.shadowColor = wl.c;
    fxx.shadowBlur = 18;
    fxx.fillStyle = wl.c;
    const halfW = fxx.measureText(wl.text).width / 2;
    const drawX = Math.max(halfW + 12, Math.min(W - halfW - 12, wl.x));
    fxx.fillText(wl.text, drawX, wl.y);
    fxx.shadowBlur = 0;
    if (wl.life <= 0) wishLabels.splice(i, 1);
  }
  fxx.globalAlpha = 1;

  requestAnimationFrame(draw);
}

resize();
seedGlitter(isTouch ? 45 : 70);
seedBalloons(isTouch ? 3 : 8);
draw();

// welcoming burst on arrival (gentler on phones)
launchBalloons(isTouch ? 3 : 6);
glitterBurst(isTouch ? 40 : 60);
