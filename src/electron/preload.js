const { contextBridge, ipcRenderer } = require('electron');
const { isMac, isWindows } = require('./detect-platform');

contextBridge.exposeInMainWorld('electron', {
  // ...other APIs to expose to renderer process
  ipcRenderer: { ...ipcRenderer, on: ipcRenderer.on },
  isMac,
  isWindows,
});
