const { globalShortcut } = require("electron");
const { saveProject } = require("./menu");

const registeShortcut = (_web) => {
  globalShortcut.register('CommandOrControl+S', () => saveProject(_web))
}

module.exports = registeShortcut