const path = require("path");
const { app, BrowserWindow, Menu, ipcMain, screen } = require("electron");

let mainWindow;
let messagePreset = "30s";
const MESSAGE_INTERVAL_BY_PRESET = {
  "15s": 15000,
  "30s": 30000,
  "60s": 60000,
  off: 0
};

function getWorkArea() {
  if (!mainWindow) {
    return screen.getPrimaryDisplay().workArea;
  }

  const bounds = mainWindow.getBounds();
  return screen.getDisplayMatching(bounds).workArea;
}

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 520;
  const height = 360;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x + Math.floor((workArea.width - width) / 2),
    y: workArea.y + workArea.height - height - 8,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile("index.html");
  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) {
      return;
    }
    mainWindow.showInactive();
  });
}

function sendMessagePresetChanged() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("message-frequency-changed", {
      preset: messagePreset,
      intervalMs: MESSAGE_INTERVAL_BY_PRESET[messagePreset]
    });
  }
}

function showContextMenu() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const menu = Menu.buildFromTemplate([
    {
      label: "Hide for 1 hour",
      click: () => {
        if (!mainWindow) {
          return;
        }
        mainWindow.hide();
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.showInactive();
          }
        }, 60 * 60 * 1000);
      }
    },
    {
      label: "Change message frequency",
      submenu: [
        {
          label: "15 seconds",
          type: "radio",
          checked: messagePreset === "15s",
          click: () => {
            messagePreset = "15s";
            sendMessagePresetChanged();
          }
        },
        {
          label: "30 seconds",
          type: "radio",
          checked: messagePreset === "30s",
          click: () => {
            messagePreset = "30s";
            sendMessagePresetChanged();
          }
        },
        {
          label: "60 seconds",
          type: "radio",
          checked: messagePreset === "60s",
          click: () => {
            messagePreset = "60s";
            sendMessagePresetChanged();
          }
        },
        {
          label: "Off",
          type: "radio",
          checked: messagePreset === "off",
          click: () => {
            messagePreset = "off";
            sendMessagePresetChanged();
          }
        }
      ]
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit()
    }
  ]);

  menu.popup({ window: mainWindow });
}

ipcMain.handle("pet:get-work-area", () => getWorkArea());
ipcMain.handle("pet:get-window-bounds", () => (mainWindow ? mainWindow.getBounds() : null));
ipcMain.handle("pet:set-window-position", (_event, { x, y }) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.setPosition(Math.round(x), Math.round(y));
});
ipcMain.handle("pet:show-context-menu", () => {
  showContextMenu();
});
ipcMain.handle("pet:get-message-interval-ms", () => MESSAGE_INTERVAL_BY_PRESET[messagePreset]);
ipcMain.handle("pet:get-message-preset", () => messagePreset);

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
