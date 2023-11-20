const { ipcMain, shell } = require('electron');
const { OPEN_BROWSER } = require('../consts/channel');

const registViwerChannelFunc = (_mainWindow) => {
  ipcMain.on(OPEN_BROWSER, (_event, _href) => {
    shell.openExternal(_href);
  });
};

module.exports = registViwerChannelFunc;
