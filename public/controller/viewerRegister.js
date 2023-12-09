const { ipcMain, shell } = require('electron');
const { OPEN_BROWSER } = require('../channel');

const registViwerChannelFunc = (_mainWindow) => {
  ipcMain.on(`${_mainWindow.id}:${OPEN_BROWSER}`, (_event, _href) => {
    shell.openExternal(_href);
  });
};

module.exports = registViwerChannelFunc;
