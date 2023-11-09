const { REQUEST_UNDO, REQUEST_REDO } = require('../../consts/channel');

const requestUndo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_UNDO);
};

const requestRedo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_REDO);
};

module.exports = {
  requestUndo,
  requestRedo,
};
