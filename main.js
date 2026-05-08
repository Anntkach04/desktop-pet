const path = require("path");
const { app, BrowserWindow, ipcMain, Menu, screen } = require("electron");

let petWindow;
let hiddenTimeout = null;
let messagePreset = "30s";
let messageIntervalMs = 30000;

const MESSAGE_OPTIONS = [
  { label: "15 seconds", preset: "15s", ms: 15000 },
  { label: "30 seconds", preset: "30s", ms: 30000 },
  { label: "60 seconds", preset: "60s", ms: 60000 },
  { label: "Off", preset: "off", ms: 0 }
];

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const windowWidth = 420;
  const windowHeight = 320;
  const startX = Math.max(workArea.x, workArea.x + 80);
  const startY = workArea.y + workArea.height - windowHeight - 8;

  petWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  petWindow.setAlwaysOnTop(true, "screen-saver");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.setMenuBarVisibility(false);
  petWindow.loadFile("index.html");
}

function setMessageFrequency(preset, ms) {
  messagePreset = preset;
  messageIntervalMs = ms;
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("message-frequency-changed", {
      preset: messagePreset,
      intervalMs: messageIntervalMs
    });
  }
}

function showContextMenu() {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  const menu = Menu.buildFromTemplate([
    {
      label: "Hide for 1 hour",
      click: () => {
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout);
          hiddenTimeout = null;
        }
        petWindow.hide();
        hiddenTimeout = setTimeout(
          () => {
            if (petWindow && !petWindow.isDestroyed()) {
              petWindow.showInactive();
              petWindow.setAlwaysOnTop(true, "screen-saver");
              petWindow.webContents.send("wake-from-hide");
            }
            hiddenTimeout = null;
          },
          60 * 60 * 1000
        );
      }
    },
    {
      label: "Change message frequency",
      submenu: MESSAGE_OPTIONS.map((option) => ({
        label: option.label,
        type: "radio",
        checked: option.preset === messagePreset,
        click: () => setMessageFrequency(option.preset, option.ms)
      }))
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit()
    }
  ]);

  menu.popup({ window: petWindow });
}

ipcMain.handle("get-work-area", () => {
  const target = petWindow?.getBounds() || { x: 0, y: 0 };
  const display = screen.getDisplayNearestPoint({ x: target.x, y: target.y });
  return display.workArea;
});

ipcMain.handle("get-window-bounds", () => {
  if (!petWindow || petWindow.isDestroyed()) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return petWindow.getBounds();
});

ipcMain.handle("set-window-position", (_event, { x, y }) => {
  if (!petWindow || petWindow.isDestroyed()) {
    return false;
  }
  petWindow.setPosition(Math.round(x), Math.round(y));
  return true;
});

ipcMain.handle("show-context-menu", () => {
  showContextMenu();
  return true;
});

ipcMain.handle("get-message-interval-ms", () => messageIntervalMs);
ipcMain.handle("get-message-preset", () => messagePreset);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
