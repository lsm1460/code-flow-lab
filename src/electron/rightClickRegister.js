const { Menu, ipcMain } = require('electron');
const _edit = require('./menu/edit');
const { REQUEST_CONTEXT } = require('../consts/channel');

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

  const extendsForChangeRoot = (_groupId, _itemId) => [
    {
      label: 'Change Root',
      click: () => _edit.requestChangeRoot(_mainWindow, _groupId, _itemId),
    },
  ];

  ipcMain.on(REQUEST_CONTEXT, (_event, _payload) => {
    const { itemId, groupId, isGroup, isRoot } = _payload || {};
    let _menu = [...defaultMenu];

    if (isGroup) {
      _menu = [
        ..._menu,
        {
          type: 'separator',
        },
        ...extendsForGroup(itemId),
      ];
    } else {
      if (groupId && !isRoot) {
        _menu = [
          ..._menu,
          {
            type: 'separator',
          },
          ...extendsForChangeRoot(groupId, itemId),
        ];
      }
    }

    const editorMenu = Menu.buildFromTemplate(_menu);

    editorMenu.popup(_mainWindow);
  });
};

module.exports = registRightClick;
