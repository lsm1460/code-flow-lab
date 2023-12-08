const { ipcMain, Menu } = require('electron');
const { REQUEST_MINIMIZE, REQUEST_MAXIMIZE, CLOSE_WINDOW, OPEN_MENU } = require('../../channel');

const _file = require('./file');
const _edit = require('./edit');
const _view = require('./view');

const getMenuTemplate = (_mainWindow, _isMac = true) => {
  let menu = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CommandOrControl+N',
          click: () => _file.createProject(_mainWindow),
        },
        {
          label: 'Open...',
          accelerator: 'CommandOrControl+O',
          click: () => _file.openProject(_mainWindow),
        },
        {
          type: 'separator',
        },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: () => _file.saveProject(_mainWindow),
        },
        {
          type: 'separator',
        },
        {
          label: 'Export to Zip File...',
          click: () => _file.exportProject(_mainWindow),
        },
        {
          type: 'separator',
        },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CommandOrControl+Z',
          click: () => _edit.requestUndo(_mainWindow),
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CommandOrControl+Z',
          click: () => _edit.requestRedo(_mainWindow),
        },
        {
          type: 'separator',
        },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        {
          type: 'separator',
        },
        {
          label: 'Play',
          accelerator: 'CommandOrControl+Return',
          click: () => _view.requestPlay(_mainWindow),
        },
        {
          type: 'separator',
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CommandOrControl+num0',
          click: () => _view.requestResetZoom(_mainWindow),
        },
        {
          label: 'Zoom in',
          accelerator: 'CommandOrControl+numadd',
          click: () => _view.requestZoomin(_mainWindow),
        },
        {
          label: 'Zoom out',
          accelerator: 'CommandOrControl+numsub',
          click: () => _view.requestZoomout(_mainWindow),
        },
      ],
    },
  ];

  if (_isMac) {
    menu = [
      {
        label: '',
        submenu: [
          {
            label: 'About Code Flow Lab',
          },
          {
            type: 'separator',
          },
          { role: 'quit' },
        ],
      },
      ...menu,
    ];
  }

  return menu;
};

const registWindowChannelFunc = (_mainWindow) => {
  ipcMain.on(REQUEST_MINIMIZE, (_event) => {
    _mainWindow.minimize();
  });

  ipcMain.on(REQUEST_MAXIMIZE, (_event) => {
    if (_mainWindow.isMaximized()) {
      _mainWindow.unmaximize();
    } else {
      _mainWindow.maximize();
    }
  });

  ipcMain.on(CLOSE_WINDOW, () => {
    _file.closeWindow(_mainWindow);
  });

  ipcMain.on(OPEN_MENU, () => {
    const menuTemplate = getMenuTemplate(_mainWindow, false);

    const editorMenu = Menu.buildFromTemplate(menuTemplate);

    editorMenu.popup(_mainWindow);
  });
};

module.exports = {
  getMenuTemplate,
  ..._file,
  ..._edit,
  registWindowChannelFunc,
};
