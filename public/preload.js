const { contextBridge, ipcRenderer } = require('electron');
const { isMac, isWindows } = require('./controller/detect-platform');

contextBridge.exposeInMainWorld('electron', {
  // ...other APIs to expose to renderer process
  ipcRenderer: { ...ipcRenderer, on: ipcRenderer.on, removeAllListeners: ipcRenderer.removeAllListeners },
  isMac,
  isWindows,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CUSTOM_PROTOCOL: process.env.CUSTOM_PROTOCOL,
});
