/**
 * renderer.js — Desktop Pet behaviour
 *
 * ─── Customisation knobs ──────────────────────────────────────────────────
 *  PET_SIZE         : pet image width & height (px)
 *  SLEEP_SIZE       : sleep-pose image size (px)  — set to PET_SIZE by default
 *  BUBBLE_W / H     : speech-bubble image dimensions (px)
 *  BUBBLE_TEXT_*    : inset of the text area inside the bubble image (px)
 *  BUBBLE_FONT_SIZE : font size for bubble text (px)
 *  ZZZ_SIZE         : zzz icon size (px)
 *  WALK_SPEED       : pixels moved per animation frame
 *  STAND_SWAP_MS    : how often to swap stand-still frames (ms)
 *  MESSAGE_HOLD_MS  : how long the message bubble stays visible (ms)
 *  SLEEP_HOLD_MS    : how long the pet sleeps (ms)
 *  SLEEP_EVERY_MS   : how often sleep is triggered (ms)
 *  MESSAGES         : array of strings shown in the bubble
 * ─────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Config — edit these freely
// ---------------------------------------------------------------------------
const PET_SIZE        = 150;    // px — character height/width
const SLEEP_SIZE      = PET_SIZE;
const BUBBLE_W        = 220;    // px — bubble image width
const BUBBLE_H        = 130;    // px — bubble image height
const BUBBLE_TEXT_TOP    = 20;  // px inset from top of bubble image
const BUBBLE_TEXT_LEFT   = 18;  // px inset from left
const BUBBLE_TEXT_RIGHT  = 18;  // px inset from right
const BUBBLE_TEXT_BOTTOM = 32;  // px inset from bottom (tail area)
const BUBBLE_FONT_SIZE   = 13;  // px
const ZZZ_SIZE        = 52;     // px
const WALK_SPEED      = 1.2;    // px per rAF tick (≈ 72 px/s at 60 fps)
const STAND_SWAP_MS   = 15000;  // ms — alternate stand frames
const MESSAGE_HOLD_MS = 5000;   // ms — message visible duration
const SLEEP_HOLD_MS   = 60000;  // ms — sleep duration (1 min)
const SLEEP_EVERY_MS  = 120000; // ms — sleep every 2 min

const MESSAGES = [
  'drink water, queen',
  'you are doing amazing',
  'sit straight, no shrimp mode',
  'shoulders down, jaw relaxed',
  'blink blink blink',
  'tiny stretch break now',
  'inhale, exhale, we got this',
  'your future self says thanks',
  'posture check rn',
  'you are iconic, keep going',
];

// ---------------------------------------------------------------------------
// Apply CSS custom properties from config
// ---------------------------------------------------------------------------
(function applyCSSVars() {
  const r = document.documentElement.style;
  r.setProperty('--pet-size',          `${PET_SIZE}px`);
  r.setProperty('--bubble-width',      `${BUBBLE_W}px`);
  r.setProperty('--bubble-height',     `${BUBBLE_H}px`);
  r.setProperty('--bubble-text-top',   `${BUBBLE_TEXT_TOP}px`);
  r.setProperty('--bubble-text-left',  `${BUBBLE_TEXT_LEFT}px`);
  r.setProperty('--bubble-text-right', `${BUBBLE_TEXT_RIGHT}px`);
  r.setProperty('--bubble-text-bottom',`${BUBBLE_TEXT_BOTTOM}px`);
  r.setProperty('--bubble-font-size',  `${BUBBLE_FONT_SIZE}px`);
  r.setProperty('--zzz-size',          `${ZZZ_SIZE}px`);
})();

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const petWrapper    = document.getElementById('pet-wrapper');
const petImg        = document.getElementById('pet-img');
const bubbleContainer = document.getElementById('bubble-container');
const bubbleText    = document.getElementById('bubble-text');
const zzzContainer  = document.getElementById('zzz-container');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
// Pet position is tracked in *screen* coordinates (main process moves window)
// Within the window, the pet is always at the bottom-left of the 300x300 frame.
// We keep a logical x offset so the pet walks inside a virtual "scene width"
// that maps to the actual screen width.

let workArea     = { x: 0, y: 0, width: 1920, height: 1080 };
let winBounds    = { x: 100, y: 800, width: 300, height: 300 };
const WIN_W      = 300; // matches main.js
const WIN_H      = 300;

// We walk the whole screen by moving the window; the pet is anchored to the
// window's left edge at all times.
let direction    = 1;     // 1 = right, -1 = left
let screenX      = 100;   // window's current left edge in screen coords

let state        = 'walking';  // 'walking' | 'message' | 'sleeping'
let standFrame   = 1;          // 1 or 2 for stand-still alternation
let messageIntervalMs = 30000;
let messageTimerId    = null;
let sleepTimerId      = null;
let standSwapTimerId  = null;
let rafId             = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

let currentImgSrc = '';
function setImg(src) {
  if (currentImgSrc !== src) {
    currentImgSrc = src;
    petImg.src = src;
  }
}

function showBubble(text) {
  bubbleText.textContent = text;
  // Position bubble above the pet, clamp so it doesn't go off the right edge
  const screenRight = workArea.x + workArea.width;
  const petScreenLeft = screenX;              // window left = pet left (pet fills window left side)
  let bubbleScreenLeft = petScreenLeft + PET_SIZE * 0.5 - BUBBLE_W * 0.5;

  // Clamp so bubble stays within work area
  bubbleScreenLeft = clamp(bubbleScreenLeft, workArea.x, screenRight - BUBBLE_W);

  // Convert to window-local coordinates
  const bubbleLocalLeft = bubbleScreenLeft - screenX;
  const bubbleLocalTop  = WIN_H - PET_SIZE - BUBBLE_H - 8;

  bubbleContainer.style.left = `${bubbleLocalLeft}px`;
  bubbleContainer.style.top  = `${Math.max(4, bubbleLocalTop)}px`;
  bubbleContainer.classList.remove('hidden');
}

function hideBubble() {
  bubbleContainer.classList.add('hidden');
}

function showZzz() {
  // Position ZZZ slightly above and to the right of the pet's head
  const zzzLocalLeft = PET_SIZE * 0.55;
  const zzzLocalTop  = WIN_H - PET_SIZE * 0.85;
  zzzContainer.style.left = `${zzzLocalLeft}px`;
  zzzContainer.style.top  = `${zzzLocalTop}px`;
  zzzContainer.classList.remove('hidden');
}

function hideZzz() {
  zzzContainer.classList.add('hidden');
}

function setFlip(facingLeft) {
  if (facingLeft) {
    petImg.classList.add('flip-x');
  } else {
    petImg.classList.remove('flip-x');
  }
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

function enterWalking() {
  state = 'walking';
  hideBubble();
  hideZzz();
  setImg(`assets/stand-still-${standFrame}.png`);
  scheduleStandSwap();
  scheduleMessage();
  scheduleSleep();
}

function enterMessage() {
  if (state === 'sleeping') return; // sleep takes priority
  state = 'message';
  clearTimers(false); // keep sleep timer

  setImg('assets/look-up.png');
  petImg.classList.remove('flip-x'); // look-up faces forward
  showBubble(rand(MESSAGES));

  setTimeout(() => {
    if (state === 'message') enterWalking();
  }, MESSAGE_HOLD_MS);
}

function enterSleep() {
  if (state === 'sleeping') return;
  state = 'sleeping';
  clearTimers(true);

  setImg('assets/sleep.png');
  hideBubble();
  showZzz();

  setTimeout(() => {
    if (state === 'sleeping') enterWalking();
  }, SLEEP_HOLD_MS);
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

function scheduleMessage() {
  clearInterval(messageTimerId);
  if (messageIntervalMs > 0) {
    messageTimerId = setInterval(() => {
      if (state === 'walking') enterMessage();
    }, messageIntervalMs);
  }
}

function scheduleSleep() {
  clearTimeout(sleepTimerId);
  sleepTimerId = setTimeout(() => {
    if (state !== 'sleeping') enterSleep();
    // Re-schedule after waking handled in enterWalking -> scheduleSleep
  }, SLEEP_EVERY_MS);
}

function scheduleStandSwap() {
  clearInterval(standSwapTimerId);
  standSwapTimerId = setInterval(() => {
    if (state === 'walking') {
      standFrame = standFrame === 1 ? 2 : 1;
      setImg(`assets/stand-still-${standFrame}.png`);
    }
  }, STAND_SWAP_MS);
}

function clearTimers(includeSleep) {
  clearInterval(messageTimerId);
  clearInterval(standSwapTimerId);
  if (includeSleep) clearTimeout(sleepTimerId);
}

// ---------------------------------------------------------------------------
// Walking animation loop
// ---------------------------------------------------------------------------

function walk() {
  if (state !== 'walking') {
    rafId = requestAnimationFrame(walk);
    return;
  }

  // Move window left edge
  screenX += direction * WALK_SPEED;

  const minX = workArea.x;
  const maxX = workArea.x + workArea.width - WIN_W;

  if (screenX >= maxX) {
    screenX = maxX;
    direction = -1;
  } else if (screenX <= minX) {
    screenX = minX;
    direction = 1;
  }

  setFlip(direction === -1);
  window.petAPI.setWindowPosition(screenX, winBounds.y);

  rafId = requestAnimationFrame(walk);
}

// ---------------------------------------------------------------------------
// Drag support
// ---------------------------------------------------------------------------

let isDragging      = false;
let dragOffsetX     = 0;
let dragOffsetY     = 0;
let dragStartTime   = 0;

petWrapper.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging    = true;
  dragOffsetX   = e.screenX - screenX;
  dragOffsetY   = e.screenY - winBounds.y;
  dragStartTime = Date.now();
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const nx = e.screenX - dragOffsetX;
  const ny = e.screenY - dragOffsetY;

  const minX = workArea.x;
  const maxX = workArea.x + workArea.width  - WIN_W;
  const minY = workArea.y;
  const maxY = workArea.y + workArea.height - WIN_H;

  screenX      = clamp(nx, minX, maxX);
  winBounds.y  = clamp(ny, minY, maxY);

  window.petAPI.setWindowPosition(screenX, winBounds.y);
});

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;

  const elapsed = Date.now() - dragStartTime;
  // Treat short press (< 200ms with minimal move) as a click → show message
  const dx = Math.abs(e.screenX - (screenX + dragOffsetX));
  const dy = Math.abs(e.screenY - (winBounds.y + dragOffsetY));
  if (elapsed < 200 && dx < 5 && dy < 5) {
    if (state !== 'sleeping') enterMessage();
  }
});

// ---------------------------------------------------------------------------
// Right-click → context menu
// ---------------------------------------------------------------------------

petWrapper.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.petAPI.showContextMenu();
});

// ---------------------------------------------------------------------------
// Message frequency changes from main process
// ---------------------------------------------------------------------------

window.petAPI.onMessageFrequencyChanged((ms) => {
  messageIntervalMs = ms;
  if (state === 'walking') scheduleMessage();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function init() {
  // Fetch initial state from main
  [workArea, winBounds] = await Promise.all([
    window.petAPI.getWorkArea(),
    window.petAPI.getWindowBounds(),
  ]);

  messageIntervalMs = await window.petAPI.getMessageIntervalMs();

  // Sync screenX with actual window position
  screenX = winBounds.x;

  // Pin window to bottom of work area
  winBounds.y = workArea.y + workArea.height - WIN_H;
  await window.petAPI.setWindowPosition(screenX, winBounds.y);

  enterWalking();
  rafId = requestAnimationFrame(walk);
}

init().catch(console.error);
