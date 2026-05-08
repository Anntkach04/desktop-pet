const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let hideTimer = null;

// Message frequency state (ms). 0 = off.
let messageIntervalMs = 30000;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  // Start near the bottom-left of the work area
  const winWidth = 300;
  const winHeight = 300;
  const startX = Math.round(workArea.x + 100);
  const startY = Math.round(workArea.y + workArea.height - winHeight);

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.setIgnoreMouseEvents(false);

  // Keep always on top even when other windows go full-screen (macOS)
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('get-work-area', () => {
  const display = screen.getPrimaryDisplay();
  return display.workArea;
});

ipcMain.handle('get-window-bounds', () => {
  if (!mainWindow) return null;
  return mainWindow.getBounds();
});

ipcMain.handle('set-window-position', (_, x, y) => {
  if (!mainWindow) return;
  mainWindow.setPosition(Math.round(x), Math.round(y));
});

ipcMain.handle('get-message-interval-ms', () => messageIntervalMs);

ipcMain.handle('get-message-preset', () => {
  if (messageIntervalMs === 15000) return '15s';
  if (messageIntervalMs === 30000) return '30s';
  if (messageIntervalMs === 60000) return '60s';
  return 'off';
});

ipcMain.handle('show-context-menu', (event) => {
  const freqItems = [
    { label: '15 seconds', type: 'radio', checked: messageIntervalMs === 15000,
      click: () => setMessageFrequency(15000) },
    { label: '30 seconds', type: 'radio', checked: messageIntervalMs === 30000,
      click: () => setMessageFrequency(30000) },
    { label: '60 seconds', type: 'radio', checked: messageIntervalMs === 60000,
      click: () => setMessageFrequency(60000) },
    { label: 'Off', type: 'radio', checked: messageIntervalMs === 0,
      click: () => setMessageFrequency(0) },
  ];

  const menu = Menu.buildFromTemplate([
    {
      label: 'Hide for 1 hour',
      click: () => {
        if (mainWindow) mainWindow.hide();
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (mainWindow) mainWindow.show();
        }, 60 * 60 * 1000);
      },
    },
    {
      label: 'Message frequency',
      submenu: freqItems,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  menu.popup({ window: mainWindow });
});

function setMessageFrequency(ms) {
  messageIntervalMs = ms;
  if (mainWindow) {
    mainWindow.webContents.send('message-frequency-changed', ms);
  }
}
