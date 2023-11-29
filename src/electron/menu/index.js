const { ipcMain } = require('electron');
const { REQUEST_MINIMIZE, REQUEST_MAXIMIZE, CLOSE_WINDOW } = require('../../consts/channel');

const _file = require('./file');
const _edit = require('./edit');

const getMenuTemplate = (_mainWindow, _app) => {
  return [
    {
      label: '',
      submenu: [
        {
          label: 'About Code Flow Lab',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit Code Flow Lab',
          click: () => {
            _app.exit();
          },
        },
      ],
    },
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
          label: 'Close Window',
          accelerator: 'Shift+CommandOrControl+W',
          click: () => _file.closeWindow(_mainWindow),
        },
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
  ];
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
};

module.exports = {
  getMenuTemplate,
  ..._file,
  ..._edit,
  registWindowChannelFunc,
};
