const { globalShortcut } = require('electron');
const { createProject, openProject, saveProject, closeWindow, requestRedo, requestUndo } = require('./menu');

const registeShortcut = (_mainWindow) => {
  globalShortcut.register('CommandOrControl+N', () => createProject(_mainWindow));
  globalShortcut.register('CommandOrControl+O', () => openProject(_mainWindow));
  // globalShortcut.register('CommandOrControl+S', () => saveProject(_mainWindow));
  globalShortcut.register('Shift+CommandOrControl+W', () => closeWindow(_mainWindow));
  globalShortcut.register('CommandOrControl+Z', () => requestUndo(_mainWindow));
  globalShortcut.register('Shift+CommandOrControl+Z', () => requestRedo(_mainWindow));
};

module.exports = registeShortcut;
