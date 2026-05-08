const petAPI = window.petAPI;

const CONFIG = {
  window: {
    width: 520,
    height: 360,
    groundPadding: 8
  },
  movement: {
    speedPxPerSecond: 66
  },
  timing: {
    standSwapMs: 15000,
    defaultMessageMs: 30000,
    messageDurationMs: 5000,
    sleepEveryMs: 120000,
    sleepDurationMs: 60000
  },
  sprites: {
    stand1: "assets/stand-still-1.png",
    stand2: "assets/stand-still-2.png",
    lookUp: "assets/look-up.png",
    sleep: "assets/sleep.png"
  },
  messages: [
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
  ]
};

const petWrap = document.getElementById("pet-wrap");
const petSprite = document.getElementById("pet-sprite");
const bubbleWrap = document.getElementById("bubble-wrap");
const bubbleText = document.getElementById("bubble-text");
const zzzIcon = document.getElementById("zzz-icon");

const state = {
  petX: 230,
  direction: 1,
  dragging: false,
  dragOffset: { x: 0, y: 0 },
  workArea: null,
  currentPose: "stand1",
  inMessage: false,
  inSleep: false,
  messageIntervalMs: CONFIG.timing.defaultMessageMs,
  messagePreset: "30s",
  lastFrameAt: performance.now(),
  standSwapAt: performance.now() + CONFIG.timing.standSwapMs,
  nextMessageAt: performance.now() + CONFIG.timing.defaultMessageMs,
  nextSleepAt: performance.now() + CONFIG.timing.sleepEveryMs,
  activeStateUntil: 0
};

function randomMessage() {
  const index = Math.floor(Math.random() * CONFIG.messages.length);
  return CONFIG.messages[index];
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function updatePose() {
  if (state.inSleep) {
    petSprite.src = CONFIG.sprites.sleep;
    return;
  }
  if (state.inMessage) {
    petSprite.src = CONFIG.sprites.lookUp;
    return;
  }
  petSprite.src = state.currentPose === "stand1" ? CONFIG.sprites.stand1 : CONFIG.sprites.stand2;
}

function setBubbleVisible(visible, message = "") {
  if (!visible) {
    bubbleWrap.classList.add("hidden");
    return;
  }

  bubbleText.textContent = message;
  bubbleWrap.classList.remove("hidden");
  updateBubblePosition();
}

function setSleepVisual(visible) {
  if (visible) {
    zzzIcon.classList.remove("hidden");
    petSprite.style.height = "var(--sleep-size-h)";
  } else {
    zzzIcon.classList.add("hidden");
    petSprite.style.height = "var(--pet-size-h)";
  }
}

function updateBubblePosition() {
  const bubbleWidth = bubbleWrap.offsetWidth || 210;
  const petLeft = state.petX;
  const desiredLeft = petLeft + 28;
  const rightLimit = CONFIG.window.width - bubbleWidth - 6;

  if (desiredLeft > rightLimit) {
    bubbleWrap.style.left = `${Math.max(6, petLeft - bubbleWidth + 104)}px`;
    bubbleWrap.classList.add("mirror");
  } else {
    bubbleWrap.style.left = `${Math.max(6, desiredLeft)}px`;
    bubbleWrap.classList.remove("mirror");
  }
}

function clampToWorkArea(x, y) {
  const area = state.workArea;
  const minX = area.x;
  const maxX = area.x + area.width - CONFIG.window.width;
  const minY = area.y;
  const maxY = area.y + area.height - CONFIG.window.height;
  return {
    x: clamp(Math.round(x), minX, maxX),
    y: clamp(Math.round(y), minY, maxY)
  };
}

async function moveWindowToDesktopBottom() {
  const bounds = await petAPI.getWindowBounds();
  const area = await petAPI.getWorkArea();
  state.workArea = area;

  const x = bounds ? bounds.x : area.x + Math.round((area.width - CONFIG.window.width) / 2);
  const y = area.y + area.height - CONFIG.window.height - CONFIG.window.groundPadding;
  const next = clampToWorkArea(x, y);
  await petAPI.setWindowPosition(next.x, next.y);
}

async function moveWindowHorizontally(deltaX) {
  const bounds = await petAPI.getWindowBounds();
  const area = await petAPI.getWorkArea();
  state.workArea = area;
  if (!bounds) {
    return;
  }
  const next = clampToWorkArea(bounds.x + deltaX, area.y + area.height - CONFIG.window.height - CONFIG.window.groundPadding);
  await petAPI.setWindowPosition(next.x, next.y);
}

function finishActiveState(now) {
  if (state.inSleep && now >= state.activeStateUntil) {
    state.inSleep = false;
    setSleepVisual(false);
    state.nextSleepAt = now + CONFIG.timing.sleepEveryMs;
    updatePose();
  }
  if (state.inMessage && now >= state.activeStateUntil) {
    state.inMessage = false;
    setBubbleVisible(false);
    state.nextMessageAt = state.messageIntervalMs > 0 ? now + state.messageIntervalMs : Number.POSITIVE_INFINITY;
    updatePose();
  }
}

function beginMessage(now, forced = false) {
  if (state.inSleep) {
    return;
  }
  if (state.inMessage && !forced) {
    return;
  }
  state.inMessage = true;
  state.activeStateUntil = now + CONFIG.timing.messageDurationMs;
  setBubbleVisible(true, randomMessage());
  updatePose();
}

function beginSleep(now) {
  if (state.inSleep) {
    return;
  }
  state.inMessage = false;
  setBubbleVisible(false);
  state.inSleep = true;
  state.activeStateUntil = now + CONFIG.timing.sleepDurationMs;
  setSleepVisual(true);
  updatePose();
}

async function tick(now) {
  const dt = Math.max(0, now - state.lastFrameAt);
  state.lastFrameAt = now;

  finishActiveState(now);

  if (!state.dragging && !state.inSleep && !state.inMessage) {
    if (now >= state.standSwapAt) {
      state.currentPose = state.currentPose === "stand1" ? "stand2" : "stand1";
      state.standSwapAt = now + CONFIG.timing.standSwapMs;
      updatePose();
    }

    const step = (CONFIG.movement.speedPxPerSecond * dt) / 1000;
    state.petX += state.direction * step;
    const minX = 0;
    const maxX = CONFIG.window.width - petWrap.offsetWidth;
    if (state.petX <= minX) {
      state.petX = minX;
      state.direction = 1;
    } else if (state.petX >= maxX) {
      state.petX = maxX;
      state.direction = -1;
    }
    petWrap.style.left = `${state.petX}px`;
    updateBubblePosition();
    await moveWindowHorizontally(state.direction * step);
  }

  if (!state.inSleep && now >= state.nextSleepAt) {
    beginSleep(now);
  } else if (!state.inSleep && state.messageIntervalMs > 0 && now >= state.nextMessageAt) {
    beginMessage(now);
  }

  requestAnimationFrame((ts) => {
    tick(ts);
  });
}

function startDragging(event) {
  state.dragging = true;
  petWrap.classList.add("dragging");
  state.dragOffset.x = event.clientX;
  state.dragOffset.y = event.clientY;
}

async function doDrag(event) {
  if (!state.dragging) {
    return;
  }
  const area = await petAPI.getWorkArea();
  state.workArea = area;
  const rawX = event.screenX - state.dragOffset.x;
  const rawY = event.screenY - state.dragOffset.y;
  const next = clampToWorkArea(rawX, rawY);
  await petAPI.setWindowPosition(next.x, next.y);
}

async function stopDragging() {
  if (!state.dragging) {
    return;
  }
  state.dragging = false;
  petWrap.classList.remove("dragging");
  await moveWindowToDesktopBottom();
}

async function initializeMessagePreset() {
  const preset = await petAPI.getMessagePreset();
  const intervalMs = await petAPI.getMessageIntervalMs();
  state.messagePreset = preset;
  state.messageIntervalMs = intervalMs;
  state.nextMessageAt = intervalMs > 0 ? performance.now() + intervalMs : Number.POSITIVE_INFINITY;
}

function bindEvents() {
  petWrap.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      startDragging(event);
    }
  });

  window.addEventListener("mousemove", (event) => {
    doDrag(event);
  });

  window.addEventListener("mouseup", () => {
    stopDragging();
  });

  petWrap.addEventListener("click", () => {
    beginMessage(performance.now(), true);
  });

  petWrap.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    await petAPI.showContextMenu();
  });

  petAPI.onMessageFrequencyChanged((payload) => {
    state.messagePreset = payload.preset;
    state.messageIntervalMs = payload.intervalMs;
    state.nextMessageAt =
      payload.intervalMs > 0 ? performance.now() + payload.intervalMs : Number.POSITIVE_INFINITY;
  });
}

async function boot() {
  await initializeMessagePreset();
  await moveWindowToDesktopBottom();
  bindEvents();
  updatePose();
  requestAnimationFrame((ts) => {
    state.lastFrameAt = ts;
    tick(ts);
  });
}

boot();
