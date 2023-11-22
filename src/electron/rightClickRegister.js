const { Menu, ipcMain } = require('electron');
const _edit = require('./menu/edit');
const { REQUEST_ZOOM_AREA_CONTEXT } = require('../consts/channel');

const registRightClick = (_mainWindow) => {
  const editorMenu = Menu.buildFromTemplate([
    {
      label: 'Cut',
      accelerator: 'CommandOrControl+X',
      click: () => _edit.requestCut(_mainWindow),
    },
    {
      label: 'Copy',
      accelerator: 'CommandOrControl+C',
      click: () => _edit.requestCopy(_mainWindow),
    },
    {
      label: 'Paste',
      accelerator: 'CommandOrControl+V',
      click: () => _edit.requestPaste(_mainWindow),
    },
    {
      label: 'Make Group',
      accelerator: 'Alt+CommandOrControl+I',
      click: () => _edit.requestMakeGroup(_mainWindow),
    },
  ]);

  ipcMain.on(REQUEST_ZOOM_AREA_CONTEXT, (_event) => {
    editorMenu.popup(_mainWindow);
  });
};

module.exports = registRightClick;
