const _file = require('./file');

const menuTemplate = [
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
        label: 'Open...',
        accelerator: 'CommandOrControl+O',
        click: () => _file.openProject(),
      },
      {
        type: 'separator',
      },
      {
        label: 'Save',
        accelerator: 'CommandOrControl+S',
        click: () => _file.saveProject(mainWindow.webContents),
      },
    ],
  },
];

module.exports = {
  menuTemplate,
  ..._file,
};
