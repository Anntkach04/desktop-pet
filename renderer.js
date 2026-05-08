const pet = document.getElementById("pet");
const scene = document.getElementById("scene");
const bubbleWrap = document.getElementById("bubbleWrap");
const bubbleText = document.getElementById("bubbleText");
const zzzWrap = document.getElementById("zzzWrap");

const PET_IMAGES = {
  stand1: "./assets/stand-still-1.png",
  stand2: "./assets/stand-still-2.png",
  lookup: "./assets/look-up.png",
  sleep: "./assets/sleep.png"
};

const DEFAULT_MESSAGES = [
  "drink water, queen",
  "you are doing amazing",
  "sit straight, no shrimp mode",
  "shoulders down, jaw relaxed",
  "blink blink blink",
  "tiny stretch break now",
  "inhale, exhale, we got this",
  "your future self says thanks",
  "posture check rn",
  "you are iconic, keep going"
];

const WALK_SPEED_PX_PER_SEC = 96;
const SLEEP_EVERY_MS = 2 * 60 * 1000;
const SLEEP_DURATION_MS = 60 * 1000;
const MESSAGE_DURATION_MS = 5000;
const IDLE_FRAME_SWAP_MS = 15000;
const HORIZONTAL_MARGIN = 2;
const FLOOR_OFFSET = 8;

const state = {
  direction: 1,
  x: 0,
  y: 0,
  workArea: null,
  windowBounds: null,
  isSleeping: false,
  isShowingMessage: false,
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  messageIntervalMs: 25000,
  messagePreset: "25s",
  nextMessageAt: Date.now() + 25000,
  nextSleepAt: Date.now() + SLEEP_EVERY_MS,
  sleepUntil: 0,
  messageUntil: 0,
  lastFrameTs: 0,
  idleFrameIndex: 0,
  lastIdleSwapAt: Date.now()
};

function randomMessage() {
  const index = Math.floor(Math.random() * DEFAULT_MESSAGES.length);
  return DEFAULT_MESSAGES[index];
}

function setPetImage(path) {
  if (pet.getAttribute("src") !== path) {
    pet.setAttribute("src", path);
  }
}

async function refreshBounds() {
  state.workArea = await window.petAPI.getWorkArea();
  state.windowBounds = await window.petAPI.getWindowBounds();
  state.x = state.windowBounds.x;
  state.y = state.windowBounds.y;
  clampAndApplyPosition();
}

function clampAndApplyPosition() {
  if (!state.workArea || !state.windowBounds) {
    return;
  }
  const minX = state.workArea.x;
  const maxX = state.workArea.x + state.workArea.width - state.windowBounds.width;
  const targetY = state.workArea.y + state.workArea.height - state.windowBounds.height - FLOOR_OFFSET;
  state.x = Math.max(minX, Math.min(maxX, state.x));
  state.y = targetY;
  window.petAPI.setWindowPosition(state.x, state.y);
  updateBubbleSide();
}

function updateBubbleSide() {
  if (!state.workArea || !state.windowBounds) {
    return;
  }
  const rightEdge = state.x + state.windowBounds.width;
  const proximityToRight = state.workArea.x + state.workArea.width - rightEdge;
  const shouldMirror = proximityToRight < 120;
  bubbleWrap.classList.toggle("mirrored", shouldMirror);
}

function showMessageBubble(text) {
  bubbleText.textContent = text;
  bubbleWrap.classList.remove("hidden");
  updateBubbleSide();
}

function hideMessageBubble() {
  bubbleWrap.classList.add("hidden");
}

function showSleepVisuals() {
  scene.classList.add("sleeping");
  zzzWrap.classList.remove("hidden");
}

function hideSleepVisuals() {
  scene.classList.remove("sleeping");
  zzzWrap.classList.add("hidden");
}

function enterMessageState() {
  if (state.isSleeping || state.isShowingMessage) {
    return;
  }
  state.isShowingMessage = true;
  state.messageUntil = Date.now() + MESSAGE_DURATION_MS;
  setPetImage(PET_IMAGES.lookup);
  showMessageBubble(randomMessage());
}

function exitMessageState() {
  state.isShowingMessage = false;
  state.messageUntil = 0;
  hideMessageBubble();
  if (!state.isSleeping) {
    setPetImage(state.idleFrameIndex === 0 ? PET_IMAGES.stand1 : PET_IMAGES.stand2);
  }
}

function enterSleepState() {
  if (state.isSleeping) {
    return;
  }
  if (state.isShowingMessage) {
    exitMessageState();
  }
  state.isSleeping = true;
  state.sleepUntil = Date.now() + SLEEP_DURATION_MS;
  setPetImage(PET_IMAGES.sleep);
  showSleepVisuals();
}

function exitSleepState() {
  state.isSleeping = false;
  state.sleepUntil = 0;
  hideSleepVisuals();
  setPetImage(state.idleFrameIndex === 0 ? PET_IMAGES.stand1 : PET_IMAGES.stand2);
  state.nextSleepAt = Date.now() + SLEEP_EVERY_MS;
}

function maybeSwapIdleFrame(now) {
  if (now - state.lastIdleSwapAt >= IDLE_FRAME_SWAP_MS) {
    state.idleFrameIndex = state.idleFrameIndex === 0 ? 1 : 0;
    state.lastIdleSwapAt = now;
    if (!state.isSleeping && !state.isShowingMessage) {
      setPetImage(state.idleFrameIndex === 0 ? PET_IMAGES.stand1 : PET_IMAGES.stand2);
    }
  }
}

function stepWalk(dtMs) {
  if (!state.workArea || !state.windowBounds) {
    return;
  }
  const minX = state.workArea.x + HORIZONTAL_MARGIN;
  const maxX = state.workArea.x + state.workArea.width - state.windowBounds.width - HORIZONTAL_MARGIN;
  const distance = (WALK_SPEED_PX_PER_SEC * dtMs) / 1000;
  state.x += distance * state.direction;

  if (state.x <= minX) {
    state.x = minX;
    state.direction = 1;
  } else if (state.x >= maxX) {
    state.x = maxX;
    state.direction = -1;
  }
  clampAndApplyPosition();
}

function tick(ts) {
  const now = Date.now();
  if (!state.lastFrameTs) {
    state.lastFrameTs = ts;
  }
  const dt = ts - state.lastFrameTs;
  state.lastFrameTs = ts;

  maybeSwapIdleFrame(now);

  if (!state.isDragging) {
    if (!state.isSleeping && now >= state.nextSleepAt) {
      enterSleepState();
    }
    if (state.isSleeping && now >= state.sleepUntil) {
      exitSleepState();
      state.nextMessageAt = Date.now() + state.messageIntervalMs;
    }
    if (!state.isSleeping && state.isShowingMessage && now >= state.messageUntil) {
      exitMessageState();
      if (state.messageIntervalMs > 0) {
        state.nextMessageAt = Date.now() + state.messageIntervalMs;
      }
    }
    if (
      !state.isSleeping &&
      !state.isShowingMessage &&
      state.messageIntervalMs > 0 &&
      now >= state.nextMessageAt
    ) {
      enterMessageState();
    }
    if (!state.isSleeping && !state.isShowingMessage) {
      stepWalk(dt);
    }
  }

  requestAnimationFrame(tick);
}

function onPointerDown(event) {
  if (event.button !== 0) {
    return;
  }
  state.isDragging = true;
  state.dragOffsetX = event.screenX - state.x;
  state.dragOffsetY = event.screenY - state.y;
}

async function onPointerMove(event) {
  if (!state.isDragging) {
    return;
  }
  if (!state.workArea || !state.windowBounds) {
    await refreshBounds();
  }
  const minX = state.workArea.x;
  const maxX = state.workArea.x + state.workArea.width - state.windowBounds.width;
  state.x = Math.max(minX, Math.min(maxX, event.screenX - state.dragOffsetX));
  clampAndApplyPosition();
}

function onPointerUp() {
  state.isDragging = false;
}

async function init() {
  const [intervalMs, preset] = await Promise.all([
    window.petAPI.getMessageIntervalMs(),
    window.petAPI.getMessagePreset()
  ]);

  state.messageIntervalMs = intervalMs;
  state.messagePreset = preset;
  state.nextMessageAt = Date.now() + (state.messageIntervalMs || 25000);

  await refreshBounds();
  setPetImage(PET_IMAGES.stand1);

  window.petAPI.onMessageFrequencyChanged(({ preset: nextPreset, intervalMs: nextIntervalMs }) => {
    state.messagePreset = nextPreset;
    state.messageIntervalMs = nextIntervalMs;
    state.nextMessageAt = Date.now() + (nextIntervalMs || Number.MAX_SAFE_INTEGER);
    if (nextIntervalMs === 0 && state.isShowingMessage) {
      exitMessageState();
    }
  });

  pet.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  pet.addEventListener("click", () => {
    if (!state.isSleeping) {
      enterMessageState();
    }
  });

  pet.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    await window.petAPI.showContextMenu();
  });

  window.addEventListener("resize", refreshBounds);
  requestAnimationFrame(tick);
}

init().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize pet renderer", error);
});
