const { Menu, ipcMain } = require('electron');
const _edit = require('./menu/edit');
const { REQUEST_ZOOM_AREA_CONTEXT } = require('../consts/channel');

const registRightClick = (_mainWindow) => {
  const defaultMenu = [
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
      label: 'Group',
      accelerator: 'Alt+CommandOrControl+I',
      click: () => _edit.requestMakeGroup(_mainWindow),
    },
  ];

  const extendsForGroup = (_groupId) => [
    {
      label: 'Ungroup',
      click: () => _edit.requestUngroup(_mainWindow, _groupId),
    },
    {
      label: 'Edit Group',
      click: () => _edit.requestEditGroup(_mainWindow, _groupId),
    },
  ];

  ipcMain.on(REQUEST_ZOOM_AREA_CONTEXT, (_event, _groupId) => {
    let _menu = [...defaultMenu];

    if (_groupId) {
      _menu = [
        ..._menu,
        {
          type: 'separator',
        },
        ...extendsForGroup(_groupId),
      ];
    }

    const editorMenu = Menu.buildFromTemplate(_menu);

    editorMenu.popup(_mainWindow);
  });
};

module.exports = registRightClick;
