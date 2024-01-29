const { globalShortcut } = require('electron');
const { createProject, openProject, saveProject, closeWindow, requestRedo, requestUndo } = require('./menu');
const { REQUEST_FULLSCREEN_OFF } = require('../channel');

const registShortcut = (_mainWindow) => {
  // globalShortcut.register('CommandOrControl+N', () => createProject(_mainWindow));
  // globalShortcut.register('CommandOrControl+O', () => openProject(_mainWindow));
  // globalShortcut.register('CommandOrControl+S', () => saveProject(_mainWindow));
  // globalShortcut.register('CommandOrControl+Z', () => requestUndo(_mainWindow));
  // globalShortcut.register('Shift+CommandOrControl+Z', () => requestRedo(_mainWindow));
  globalShortcut.register('esc', () => {
    if (_mainWindow.isFullScreen()) {
      _mainWindow.webContents.send(REQUEST_FULLSCREEN_OFF);

      _mainWindow.setFullScreen(false);
    }
  });
};

module.exports = registShortcut;
