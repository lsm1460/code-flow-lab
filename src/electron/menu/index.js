const _file = require('./file');

const getMenuTemplate = (_mainWindow) => {
  return [
    {
      label: '',
      submenu: [
        {
          label: 'About Code Flow Lab',
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
      ],
    },
  ];
};

module.exports = {
  getMenuTemplate,
  ..._file,
};
