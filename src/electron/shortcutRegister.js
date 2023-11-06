const { globalShortcut } = require('electron');
const { createProject, openProject, saveProject } = require('./menu');

const registeShortcut = (_mainWindow) => {
  globalShortcut.register('CommandOrControl+N', () => createProject(_mainWindow));
  globalShortcut.register('CommandOrControl+O', () => openProject(_mainWindow));
  globalShortcut.register('CommandOrControl+S', () => saveProject(_mainWindow));
};

module.exports = registeShortcut;
