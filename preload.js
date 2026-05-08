const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petAPI", {
  getWorkArea: () => ipcRenderer.invoke("get-work-area"),
  getWindowBounds: () => ipcRenderer.invoke("get-window-bounds"),
  setWindowPosition: (x, y) => ipcRenderer.invoke("set-window-position", { x, y }),
  showContextMenu: () => ipcRenderer.invoke("show-context-menu"),
  getMessageIntervalMs: () => ipcRenderer.invoke("get-message-interval-ms"),
  getMessagePreset: () => ipcRenderer.invoke("get-message-preset"),
  onMessageFrequencyChanged: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("message-frequency-changed", handler);
    return () => ipcRenderer.removeListener("message-frequency-changed", handler);
  }
});
