const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  /** Returns the primary display work area {x, y, width, height} */
  getWorkArea: () => ipcRenderer.invoke('get-work-area'),

  /** Returns the current window bounds {x, y, width, height} */
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),

  /** Moves the window to (x, y) in screen coordinates */
  setWindowPosition: (x, y) => ipcRenderer.invoke('set-window-position', x, y),

  /** Shows the native right-click context menu */
  showContextMenu: () => ipcRenderer.invoke('show-context-menu'),

  /** Returns the current message interval in milliseconds (0 = off) */
  getMessageIntervalMs: () => ipcRenderer.invoke('get-message-interval-ms'),

  /** Returns the current message preset string: '15s' | '30s' | '60s' | 'off' */
  getMessagePreset: () => ipcRenderer.invoke('get-message-preset'),

  /**
   * Register a callback that fires whenever the user changes message frequency.
   * The callback receives the new interval in ms (0 = off).
   */
  onMessageFrequencyChanged: (callback) => {
    ipcRenderer.on('message-frequency-changed', (_, ms) => callback(ms));
  },
});
