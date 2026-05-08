const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petAPI", {
  getWorkArea: () => ipcRenderer.invoke("pet:get-work-area"),
  getWindowBounds: () => ipcRenderer.invoke("pet:get-window-bounds"),
  setWindowPosition: (x, y) => ipcRenderer.invoke("pet:set-window-position", { x, y }),
  showContextMenu: () => ipcRenderer.invoke("pet:show-context-menu"),
  getMessageIntervalMs: () => ipcRenderer.invoke("pet:get-message-interval-ms"),
  getMessagePreset: () => ipcRenderer.invoke("pet:get-message-preset"),
  onMessageFrequencyChanged: (callback) => {
    if (typeof callback !== "function") {
      return () => {};
    }

    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("message-frequency-changed", listener);
    return () => ipcRenderer.removeListener("message-frequency-changed", listener);
  }
});
