const { Menu } = require('electron');
const _edit = require('./menu/edit');

const registRightClick = (_mainWindow) => {
  const ctxMenu = Menu.buildFromTemplate([
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
  ]);

  _mainWindow.webContents.on('context-menu', (e, param) => {
    ctxMenu.popup(_mainWindow, param.x, param.y);
  });
};

module.exports = registRightClick;
