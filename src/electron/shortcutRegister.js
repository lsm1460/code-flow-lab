const { globalShortcut } = require('electron');
const { openProject, saveProject } = require('./menu');

const registeShortcut = (_web) => {
  globalShortcut.register('CommandOrControl+O', () => openProject(_web));
  globalShortcut.register('CommandOrControl+S', () => saveProject(_web));
};

module.exports = registeShortcut;
